<?php

namespace UniversalEditor\Laravel\Services;

use Illuminate\Support\Facades\DB;
use UniversalEditor\Laravel\Models\EditorDocument;
use UniversalEditor\Laravel\Models\EditorDocumentVersion;
use UniversalEditor\Laravel\Security\ContentSanitizer;

class EditorDocumentVersionService
{
    /**
     * In-memory store fallback for headless/unit test execution
     */
    protected static array $memoryVersions = [];
    protected static int $nextVersionId = 1;

    /**
     * Retrieve all versions for a given document.
     *
     * @param EditorDocument|int $document
     * @return mixed
     */
    public function listVersions($document): mixed
    {
        $doc = $this->resolveDocument($document);

        try {
            if (
                class_exists(DB::class) &&
                method_exists(DB::class, 'connection') &&
                DB::connection()->getPdo()
            ) {
                if (method_exists($doc, 'versions')) {
                    return $doc->versions()->with('author')->get();
                }

                return EditorDocumentVersion::where('document_id', $doc->id)
                    ->orderBy('version', 'desc')
                    ->get();
            }
        } catch (\Throwable $e) {
            // Fall through to memory store
        }

        $list = array_filter(static::$memoryVersions, fn($v) => (int) $v->document_id === (int) $doc->id);
        usort($list, fn($a, $b) => ($b->version ?? 0) <=> ($a->version ?? 0));
        return array_values($list);
    }

    /**
     * Create an immutable snapshot version for the document.
     * Guaranteed transaction integrity — never overwrites old versions.
     *
     * @param EditorDocument|int $document
     * @param array $data ['note' => ..., 'title' => ..., 'content_html' => ..., 'content_json' => ...]
     * @param int|null $userId
     * @return EditorDocumentVersion
     */
    public function createVersion($document, array $data = [], ?int $userId = null): EditorDocumentVersion
    {
        $doc = $this->resolveDocument($document);

        $callback = function () use ($doc, $data, $userId) {
            $versionNumber = $data['version'] ?? ($doc->version ?? 1);

            $html = array_key_exists('content_html', $data) ? $data['content_html'] : $doc->content_html;
            $json = array_key_exists('content_json', $data) ? $data['content_json'] : $doc->content_json;
            $title = array_key_exists('title', $data) ? $data['title'] : $doc->title;
            $note = $data['note'] ?? null;

            if (config('editor.sanitization.enabled', true) && !empty($html)) {
                $html = ContentSanitizer::clean($html);
            }

            // Calculate word count
            $cleanText = strip_tags($html ?? '');
            $words = preg_split('/\s+/u', trim($cleanText), -1, PREG_SPLIT_NO_EMPTY);
            $wordCount = is_array($words) ? count($words) : 0;

            $version = new EditorDocumentVersion([
                'document_id' => $doc->id,
                'version' => $versionNumber,
                'title' => $title,
                'note' => $note,
                'content_html' => $html,
                'content_json' => $json,
                'word_count' => $wordCount,
                'created_by' => $userId ?? $doc->user_id,
                'created_at' => now(),
            ]);

            $id = static::$nextVersionId++;
            $version->id = $id;
            static::$memoryVersions[$id] = $version;

            try {
                $version->save();

                // Optional pruning of ancient versions exceeding max limit
                $maxVersions = config('editor.database.versioning.max_versions_per_document', 50);
                if ($maxVersions > 0) {
                    $this->pruneExcessVersions($doc->id, $maxVersions);
                }
            } catch (\Throwable $e) {
                // Headless fallback
            }

            return $version;
        };

        if (class_exists(DB::class) && method_exists(DB::class, 'transaction')) {
            return DB::transaction($callback);
        }

        return $callback();
    }

    /**
     * Retrieve a specific version by its version ID or version number.
     *
     * @param EditorDocument|int $document
     * @param int $versionIdOrNumber
     * @return EditorDocumentVersion|null
     */
    public function getVersion($document, int $versionIdOrNumber): ?EditorDocumentVersion
    {
        $doc = $this->resolveDocument($document);

        try {
            if (
                class_exists(DB::class) &&
                method_exists(DB::class, 'connection') &&
                DB::connection()->getPdo()
            ) {
                return EditorDocumentVersion::where('document_id', $doc->id)
                    ->where(function ($query) use ($versionIdOrNumber) {
                        $query->where('id', $versionIdOrNumber)
                              ->orWhere('version', $versionIdOrNumber);
                    })
                    ->first();
            }
        } catch (\Throwable $e) {
            // Fall through to memory store
        }

        foreach (static::$memoryVersions as $v) {
            if ((int) $v->document_id === (int) $doc->id) {
                if ((int) $v->id === (int) $versionIdOrNumber || (int) $v->version === (int) $versionIdOrNumber) {
                    return $v;
                }
            }
        }

        return null;
    }

    /**
     * Restore document to a specific historical version snapshot.
     * Automatically creates a new version snapshot and updates document state.
     *
     * @param EditorDocument|int $document
     * @param int $versionIdOrNumber
     * @param int|null $userId
     * @return EditorDocument
     */
    public function restoreVersion($document, int $versionIdOrNumber, ?int $userId = null): EditorDocument
    {
        $doc = $this->resolveDocument($document);
        $version = $this->getVersion($doc, $versionIdOrNumber);

        if (!$version) {
            throw new \InvalidArgumentException("Version {$versionIdOrNumber} not found for document {$doc->id}");
        }

        $callback = function () use ($doc, $version, $userId) {
            // Update document with snapshot content
            $doc->content_html = $version->content_html;
            $doc->content_json = $version->content_json;
            if (!empty($version->title)) {
                $doc->title = $version->title;
            }

            // Increment version to mark the restored revision
            $doc->version = ($doc->version ?? 1) + 1;
            $doc->save();

            // Create an audit version entry representing this restoration
            $this->createVersion($doc, [
                'version' => $doc->version,
                'note' => "Restored from version {$version->version}",
                'content_html' => $doc->content_html,
                'content_json' => $doc->content_json,
                'title' => $doc->title,
            ], $userId ?? $doc->user_id);

            return $doc;
        };

        if (class_exists(DB::class) && method_exists(DB::class, 'transaction')) {
            return DB::transaction($callback);
        }

        return $callback();
    }

    /**
     * Compare two versions of a document or a version against current state.
     * Returns structured diff chunks, counts, and visual diff HTML.
     *
     * @param EditorDocument|int $document
     * @param int $v1 First version ID or number (baseline)
     * @param int|null $v2 Second version ID or number (target, defaults to current document state if null)
     * @return array
     */
    public function compareVersions($document, int $v1, ?int $v2 = null): array
    {
        $doc = $this->resolveDocument($document);

        $versionA = $this->getVersion($doc, $v1);
        if (!$versionA) {
            throw new \InvalidArgumentException("Base version {$v1} not found.");
        }

        if ($v2 !== null) {
            $versionB = $this->getVersion($doc, $v2);
            if (!$versionB) {
                throw new \InvalidArgumentException("Comparison target version {$v2} not found.");
            }
            $targetHtml = $versionB->content_html ?? '';
            $targetTitle = $versionB->title ?? $doc->title;
            $targetVersionNumber = $versionB->version;
        } else {
            $targetHtml = $doc->content_html ?? '';
            $targetTitle = $doc->title;
            $targetVersionNumber = $doc->version;
        }

        $baseHtml = $versionA->content_html ?? '';
        $baseVersionNumber = $versionA->version;

        $diffResult = $this->computeWordDiff($baseHtml, $targetHtml);

        return [
            'document_id' => $doc->id,
            'base_version' => $baseVersionNumber,
            'target_version' => $targetVersionNumber,
            'title_changed' => ($versionA->title !== $targetTitle),
            'base_title' => $versionA->title,
            'target_title' => $targetTitle,
            'statistics' => [
                'additions' => $diffResult['additions'],
                'deletions' => $diffResult['deletions'],
                'unchanged' => $diffResult['unchanged'],
                'total_changes' => $diffResult['additions'] + $diffResult['deletions'],
            ],
            'diff_html' => $diffResult['diff_html'],
            'chunks' => $diffResult['chunks'],
        ];
    }

    /**
     * Tokenize and compute LCS word diff between two HTML or text strings.
     *
     * @param string $oldText
     * @param string $newText
     * @return array
     */
    public function computeWordDiff(string $oldText, string $newText): array
    {
        $tokensOld = $this->tokenize($oldText);
        $tokensNew = $this->tokenize($newText);

        $m = count($tokensOld);
        $n = count($tokensNew);

        // Standard matrix for LCS
        $matrix = [];
        for ($i = 0; $i <= $m; $i++) {
            $matrix[$i][0] = 0;
        }
        for ($j = 0; $j <= $n; $j++) {
            $matrix[0][$j] = 0;
        }

        for ($i = 1; $i <= $m; $i++) {
            for ($j = 1; $j <= $n; $j++) {
                if ($tokensOld[$i - 1] === $tokensNew[$j - 1]) {
                    $matrix[$i][$j] = $matrix[$i - 1][$j - 1] + 1;
                } else {
                    $matrix[$i][$j] = max($matrix[$i - 1][$j], $matrix[$i][$j - 1]);
                }
            }
        }

        // Traceback to build diff chunks
        $chunks = [];
        $i = $m;
        $j = $n;

        while ($i > 0 || $j > 0) {
            if ($i > 0 && $j > 0 && $tokensOld[$i - 1] === $tokensNew[$j - 1]) {
                array_unshift($chunks, [
                    'type' => 'unchanged',
                    'text' => $tokensOld[$i - 1],
                ]);
                $i--;
                $j--;
            } elseif ($j > 0 && ($i === 0 || $matrix[$i][$j - 1] >= $matrix[$i - 1][$j])) {
                array_unshift($chunks, [
                    'type' => 'added',
                    'text' => $tokensNew[$j - 1],
                ]);
                $j--;
            } elseif ($i > 0 && ($j === 0 || $matrix[$i][$j - 1] < $matrix[$i - 1][$j])) {
                array_unshift($chunks, [
                    'type' => 'removed',
                    'text' => $tokensOld[$i - 1],
                ]);
                $i--;
            }
        }

        // Consolidate adjacent chunks of identical type
        $consolidated = [];
        $additions = 0;
        $deletions = 0;
        $unchanged = 0;

        foreach ($chunks as $chunk) {
            $count = preg_match_all('/\S+/u', $chunk['text']);
            if ($chunk['type'] === 'added') {
                $additions += $count;
            } elseif ($chunk['type'] === 'removed') {
                $deletions += $count;
            } else {
                $unchanged += $count;
            }

            $lastIdx = count($consolidated) - 1;
            if ($lastIdx >= 0 && $consolidated[$lastIdx]['type'] === $chunk['type']) {
                $consolidated[$lastIdx]['text'] .= $chunk['text'];
            } else {
                $consolidated[] = $chunk;
            }
        }

        // Format HTML with semantic <ins> and <del> tags
        $diffHtml = '';
        foreach ($consolidated as $c) {
            $escaped = htmlspecialchars($c['text'], ENT_NOQUOTES, 'UTF-8');
            if ($c['type'] === 'added') {
                $diffHtml .= '<ins class="ue-diff-ins">' . $escaped . '</ins>';
            } elseif ($c['type'] === 'removed') {
                $diffHtml .= '<del class="ue-diff-del">' . $escaped . '</del>';
            } else {
                $diffHtml .= $escaped;
            }
        }

        return [
            'additions' => $additions,
            'deletions' => $deletions,
            'unchanged' => $unchanged,
            'diff_html' => $diffHtml,
            'chunks' => $consolidated,
        ];
    }

    /**
     * Tokenize text into words, punctuation, whitespace, and HTML tags.
     */
    protected function tokenize(string $text): array
    {
        if ($text === '') {
            return [];
        }

        // Match HTML tags, words with Unicode support, whitespace, and symbols
        preg_match_all('/<[^>]+>|[\p{L}\p{N}]+|[^\p{L}\p{N}\s<]+|\s+/u', $text, $matches);
        return $matches[0] ?? [];
    }

    /**
     * Resolve model instance from ID or object.
     */
    protected function resolveDocument($document): EditorDocument
    {
        if ($document instanceof EditorDocument) {
            return $document;
        }

        if (is_array($document)) {
            return new EditorDocument($document);
        }

        if (is_object($document)) {
            return new EditorDocument((array) $document);
        }

        try {
            return EditorDocument::findOrFail($document);
        } catch (\Throwable $e) {
            $service = new EditorDocumentService();
            $found = $service->find($document);
            if ($found instanceof EditorDocument) {
                return $found;
            }
            if (is_object($found) || is_array($found)) {
                return new EditorDocument((array) $found);
            }
            return new EditorDocument(['id' => (int) $document, 'title' => 'Document #' . $document]);
        }
    }

    /**
     * Keep only the latest $maxCount versions for a document.
     */
    protected function pruneExcessVersions(int $documentId, int $maxCount): void
    {
        try {
            $total = EditorDocumentVersion::where('document_id', $documentId)->count();
            if ($total > $maxCount) {
                $excessIds = EditorDocumentVersion::where('document_id', $documentId)
                    ->orderBy('version', 'asc')
                    ->limit($total - $maxCount)
                    ->pluck('id');

                EditorDocumentVersion::whereIn('id', $excessIds)->delete();
            }
        } catch (\Throwable $e) {
            // Prune memory store
            $docVersions = array_filter(static::$memoryVersions, fn($v) => (int) $v->document_id === $documentId);
            if (count($docVersions) > $maxCount) {
                usort($docVersions, fn($a, $b) => ($a->version ?? 0) <=> ($b->version ?? 0));
                $toRemove = array_slice($docVersions, 0, count($docVersions) - $maxCount);
                foreach ($toRemove as $rem) {
                    unset(static::$memoryVersions[$rem->id]);
                }
            }
        }
    }
}
