<?php

namespace UniversalEditor\Laravel\Services;

use UniversalEditor\Laravel\Models\EditorDocument;
use UniversalEditor\Laravel\Models\EditorDocumentComment;
use UniversalEditor\Laravel\Security\ContentSanitizer;
use Illuminate\Support\Facades\DB;

/**
 * Class EditorDocumentCommentService
 *
 * Business logic layer for managing inline comments, position anchors, threaded replies, and resolutions.
 */
class EditorDocumentCommentService
{
    protected ContentSanitizer $sanitizer;

    public function __construct(?ContentSanitizer $sanitizer = null)
    {
        $this->sanitizer = $sanitizer ?? new ContentSanitizer([
            'allowed_tags' => ['p', 'strong', 'b', 'em', 'i', 'code', 'span', 'br', 'a'],
            'allowed_attributes' => [
                '*' => ['class', 'data-mention-id', 'data-username'],
                'a' => ['href', 'target'],
            ],
        ]);
    }

    /**
     * Resolve document model or ID.
     */
    protected function resolveDocument($document): EditorDocument
    {
        if ($document instanceof EditorDocument) {
            return $document;
        }

        return EditorDocument::findOrFail($document);
    }

    /**
     * List all comments anchored to a document, optionally threaded or filtered by status.
     *
     * @param EditorDocument|int $document
     * @param bool $includeResolved
     * @param bool $threaded
     * @return array
     */
    public function listComments($document, bool $includeResolved = true, bool $threaded = true): array
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        $query = EditorDocumentComment::where('document_id', $docId);

        if (!$includeResolved) {
            $query->where('status', EditorDocumentComment::STATUS_ACTIVE);
        }

        if ($threaded) {
            $query->whereNull('parent_id')
                  ->with(['replies', 'author'])
                  ->orderBy('created_at', 'asc');
        } else {
            $query->with(['author'])->orderBy('created_at', 'asc');
        }

        $comments = $query->get();

        if (is_array($comments)) {
            return $comments;
        }

        return method_exists($comments, 'toArray') ? $comments->toArray() : (array)$comments;
    }

    /**
     * Add a new top-level anchored comment to a document.
     *
     * @param EditorDocument|int $document
     * @param array $data
     * @param int|null $userId
     * @return EditorDocumentComment
     */
    public function addComment($document, array $data, ?int $userId = null): EditorDocumentComment
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        if (empty($data['content'])) {
            throw new \InvalidArgumentException("Comment content cannot be empty.");
        }

        $cleanContent = $this->sanitizer->clean($data['content']);
        $mentions = $this->extractMentions($cleanContent);

        $comment = new EditorDocumentComment([
            'document_id' => $docId,
            'user_id' => $userId ?? ($data['user_id'] ?? null),
            'user_name' => $data['user_name'] ?? 'Anonymous',
            'user_avatar' => $data['user_avatar'] ?? null,
            'parent_id' => null,
            'selected_text' => $data['selected_text'] ?? null,
            'from_pos' => isset($data['from_pos']) ? (int)$data['from_pos'] : null,
            'to_pos' => isset($data['to_pos']) ? (int)$data['to_pos'] : null,
            'content' => $cleanContent,
            'status' => EditorDocumentComment::STATUS_ACTIVE,
        ]);

        $comment->save();
        $comment->mentions = $mentions;

        return $comment;
    }

    /**
     * Add a threaded reply to an existing comment.
     *
     * @param int $commentId
     * @param array $data
     * @param int|null $userId
     * @return EditorDocumentComment
     */
    public function replyComment(int $commentId, array $data, ?int $userId = null): EditorDocumentComment
    {
        $parent = EditorDocumentComment::findOrFail($commentId);

        if (empty($data['content'])) {
            throw new \InvalidArgumentException("Reply content cannot be empty.");
        }

        // Always thread to the root parent if parent itself is a reply
        $rootParentId = $parent->parent_id ?? $parent->id;
        $cleanContent = $this->sanitizer->clean($data['content']);
        $mentions = $this->extractMentions($cleanContent);

        $reply = new EditorDocumentComment([
            'document_id' => $parent->document_id,
            'user_id' => $userId ?? ($data['user_id'] ?? null),
            'user_name' => $data['user_name'] ?? 'Anonymous',
            'user_avatar' => $data['user_avatar'] ?? null,
            'parent_id' => $rootParentId,
            'selected_text' => null,
            'from_pos' => null,
            'to_pos' => null,
            'content' => $cleanContent,
            'status' => EditorDocumentComment::STATUS_ACTIVE,
        ]);

        $reply->save();
        $reply->mentions = $mentions;

        return $reply;
    }

    /**
     * Mark a comment (and optionally its thread) as resolved.
     *
     * @param int $commentId
     * @param int|null $userId
     * @return EditorDocumentComment
     */
    public function resolveComment(int $commentId, ?int $userId = null): EditorDocumentComment
    {
        $comment = EditorDocumentComment::findOrFail($commentId);
        $comment->resolve($userId);

        // Also mark replies as resolved if root
        if ($comment->isRoot()) {
            EditorDocumentComment::where('parent_id', $comment->id)->update([
                'status' => EditorDocumentComment::STATUS_RESOLVED,
                'resolved_by' => $userId,
                'resolved_at' => function_exists('now') ? now() : date('Y-m-d H:i:s'),
            ]);
        }

        return $comment;
    }

    /**
     * Reopen a resolved comment.
     *
     * @param int $commentId
     * @return EditorDocumentComment
     */
    public function reopenComment(int $commentId): EditorDocumentComment
    {
        $comment = EditorDocumentComment::findOrFail($commentId);
        $comment->reopen();

        if ($comment->isRoot()) {
            EditorDocumentComment::where('parent_id', $comment->id)->update([
                'status' => EditorDocumentComment::STATUS_ACTIVE,
                'resolved_by' => null,
                'resolved_at' => null,
            ]);
        }

        return $comment;
    }

    /**
     * Delete a comment (and child replies).
     *
     * @param int $commentId
     * @param int|null $userId
     * @param bool $force
     * @return bool
     */
    public function deleteComment(int $commentId, ?int $userId = null, bool $force = false): bool
    {
        $comment = EditorDocumentComment::findOrFail($commentId);

        if (!$force && $userId !== null && (int)$comment->user_id !== $userId) {
            throw new \RuntimeException("Unauthorized to delete this comment.");
        }

        // Delete replies if root
        EditorDocumentComment::where('parent_id', $comment->id)->delete();

        return (bool)$comment->delete();
    }

    /**
     * Extract @mentions from text or HTML content.
     *
     * @param string $content
     * @return array<string> List of mentioned usernames
     */
    public function extractMentions(string $content): array
    {
        preg_match_all('/@([a-zA-Z0-9_\.\-]+)/', strip_tags($content), $matches);

        if (empty($matches[1])) {
            return [];
        }

        return array_values(array_unique($matches[1]));
    }
}
