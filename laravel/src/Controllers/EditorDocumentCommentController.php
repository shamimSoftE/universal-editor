<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use UniversalEditor\Laravel\Services\EditorDocumentCommentService;
use UniversalEditor\Laravel\Services\EditorDocumentService;

class EditorDocumentCommentController extends Controller
{
    protected EditorDocumentCommentService $commentService;
    protected EditorDocumentService $documentService;

    public function __construct(
        ?EditorDocumentCommentService $commentService = null,
        ?EditorDocumentService $documentService = null
    ) {
        $this->commentService = $commentService ?? new EditorDocumentCommentService();
        $this->documentService = $documentService ?? new EditorDocumentService();
    }

    /**
     * List all comments anchored to a document.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function index(Request $request, $documentId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $includeResolved = $request->boolean('include_resolved', true);
        $threaded = $request->boolean('threaded', true);

        $comments = $this->commentService->listComments($document, $includeResolved, $threaded);

        return response()->json([
            'success' => true,
            'document_id' => (int) $documentId,
            'count' => is_array($comments) ? count($comments) : $comments->count(),
            'data' => $comments,
        ]);
    }

    /**
     * Store a new top-level comment on a document.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function store(Request $request, $documentId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $content = $request->input('content');
        if (empty($content)) {
            return response()->json([
                'success' => false,
                'message' => 'Comment content is required.',
            ], 422);
        }

        $userId = $request->user() ? $request->user()->id : $request->input('user_id');

        try {
            $comment = $this->commentService->addComment(
                $document,
                $request->only(['content', 'user_id', 'user_name', 'user_avatar', 'selected_text', 'from_pos', 'to_pos']),
                $userId ? (int)$userId : null
            );

            return response()->json([
                'success' => true,
                'message' => 'Comment created successfully.',
                'data' => $comment,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Store a reply to an existing comment.
     *
     * @param Request $request
     * @param mixed $documentId
     * @param mixed $commentId
     * @return JsonResponse
     */
    public function reply(Request $request, $documentId, $commentId): JsonResponse
    {
        $content = $request->input('content');
        if (empty($content)) {
            return response()->json([
                'success' => false,
                'message' => 'Reply content is required.',
            ], 422);
        }

        $userId = $request->user() ? $request->user()->id : $request->input('user_id');

        try {
            $reply = $this->commentService->replyComment(
                (int)$commentId,
                $request->only(['content', 'user_id', 'user_name', 'user_avatar']),
                $userId ? (int)$userId : null
            );

            return response()->json([
                'success' => true,
                'message' => 'Reply posted successfully.',
                'data' => $reply,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mark a comment as resolved.
     *
     * @param Request $request
     * @param mixed $documentId
     * @param mixed $commentId
     * @return JsonResponse
     */
    public function resolve(Request $request, $documentId, $commentId): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id');

        try {
            $comment = $this->commentService->resolveComment((int)$commentId, $userId ? (int)$userId : null);

            return response()->json([
                'success' => true,
                'message' => 'Comment marked as resolved.',
                'data' => $comment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Reopen a resolved comment.
     *
     * @param Request $request
     * @param mixed $documentId
     * @param mixed $commentId
     * @return JsonResponse
     */
    public function reopen(Request $request, $documentId, $commentId): JsonResponse
    {
        try {
            $comment = $this->commentService->reopenComment((int)$commentId);

            return response()->json([
                'success' => true,
                'message' => 'Comment reopened.',
                'data' => $comment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete a comment thread.
     *
     * @param Request $request
     * @param mixed $documentId
     * @param mixed $commentId
     * @return JsonResponse
     */
    public function destroy(Request $request, $documentId, $commentId): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id');
        $force = $request->boolean('force', false);

        try {
            $this->commentService->deleteComment(
                (int)$commentId,
                $userId ? (int)$userId : null,
                $force
            );

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
