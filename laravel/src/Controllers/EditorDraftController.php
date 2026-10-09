<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use UniversalEditor\Laravel\Editor;

class EditorDraftController extends Controller
{
    /**
     * In-memory / file draft storage for headless package verification
     */
    protected static array $draftStore = [];

    /**
     * Store or update an autosaved draft
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $id = $request->input('id') ?? $request->input('documentId') ?? 'default';
        $content = $request->input('content');
        $html = $request->input('html');
        $checksum = $request->input('checksum');

        if ($content === null && $html === null) {
            return response()->json([
                'success' => false,
                'message' => 'Draft content is required.',
            ], 422);
        }

        // Content sanitization on HTML draft representation
        $sanitizedHtml = null;
        if ($html) {
            $sanitizedHtml = Editor::sanitize($html);
        }

        $draftRecord = [
            'id' => (string) $id,
            'documentId' => $id,
            'content' => $content,
            'html' => $sanitizedHtml ?? $html,
            'text' => $request->input('text', ''),
            'checksum' => $checksum,
            'updatedAt' => $request->input('updatedAt') ?? (int) (microtime(true) * 1000),
        ];

        static::$draftStore[(string) $id] = $draftRecord;

        return response()->json([
            'success' => true,
            'id' => (string) $id,
            'updatedAt' => $draftRecord['updatedAt'],
            'message' => 'Draft saved successfully.',
        ]);
    }

    /**
     * Retrieve a stored draft by ID or document ID
     *
     * @param Request $request
     * @param string|null $id
     * @return JsonResponse
     */
    public function show(Request $request, ?string $id = null): JsonResponse
    {
        $targetId = $id ?? $request->query('id') ?? $request->query('documentId') ?? 'default';

        if (isset(static::$draftStore[(string) $targetId])) {
            return response()->json([
                'success' => true,
                'draft' => static::$draftStore[(string) $targetId],
            ]);
        }

        return response()->json([
            'success' => false,
            'draft' => null,
            'message' => 'Draft not found.',
        ], 404);
    }

    /**
     * Clear / discard a saved draft
     *
     * @param Request $request
     * @param string|null $id
     * @return JsonResponse
     */
    public function destroy(Request $request, ?string $id = null): JsonResponse
    {
        $targetId = $id ?? $request->input('id') ?? $request->input('documentId') ?? 'default';

        if (isset(static::$draftStore[(string) $targetId])) {
            unset(static::$draftStore[(string) $targetId]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Draft discarded successfully.',
        ]);
    }

    /**
     * Clear all in-memory drafts (testing helper)
     */
    public static function resetStore(): void
    {
        static::$draftStore = [];
    }

    /**
     * Direct test helper to get stored draft
     */
    public static function getStored(string $id): ?array
    {
        return static::$draftStore[$id] ?? null;
    }
}
