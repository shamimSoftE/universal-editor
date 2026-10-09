<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class EditorController extends Controller
{
    /**
     * Service health check
     */
    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'Universal Rich Text Editor API',
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Expose frontend editor configuration
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'max_file_size' => config('editor.upload.max_size', 10240),
            'allowed_mimes' => config('editor.upload.allowed_mimes', []),
            'sanitization' => config('editor.sanitization.enabled', true),
            'theme' => config('editor.theme', []),
        ]);
    }

    /**
     * Expose theme configuration & tokens (Phase 22)
     */
    public function theme(): JsonResponse
    {
        return response()->json([
            'default' => config('editor.theme.default', 'dark'),
            'presets' => config('editor.theme.presets', ['dark', 'light', 'sepia', 'cyberpunk', 'minimal', 'high-contrast']),
            'tokens' => config('editor.theme.tokens', []),
        ]);
    }

    /**
     * Handle autosave / draft storage
     *
     * Route: POST /editor/autosave
     */
    public function autosave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'content_html' => 'required|string',
            'content_json' => 'nullable',
        ]);

        $contentHtml = $validated['content_html'];
        $wasSanitized = false;

        if (config('editor.sanitization.enabled', true)) {
            $contentHtml = \UniversalEditor\Laravel\Security\ContentSanitizer::clean($contentHtml);
            $wasSanitized = true;
        }

        $contentHash = hash('sha256', $contentHtml);
        $draftId = $validated['document_id'] ?? ('draft_' . substr($contentHash, 0, 12));

        // In Phase 5/6, provide response structure; Phase 18 will integrate with Eloquent database models
        return response()->json([
            'status' => 'success',
            'message' => 'Draft saved successfully',
            'draft_id' => $draftId,
            'checksum' => $contentHash,
            'sanitized' => $wasSanitized,
            'saved_at' => now()->toIso8601String(),
        ]);
    }
}
