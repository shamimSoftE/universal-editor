<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EditorMediaController extends Controller
{
    /**
     * List uploaded media files
     *
     * Route: GET /editor/media
     */
    public function index(Request $request): JsonResponse
    {
        $diskName = config('editor.storage.disk', 'public');
        $basePath = trim(config('editor.storage.path', 'editor'), '/');

        $storage = Storage::disk($diskName);

        if (!$storage->exists($basePath)) {
            return response()->json([
                'status' => 'success',
                'data' => [],
                'total' => 0,
            ]);
        }

        $files = $storage->files($basePath);
        $search = $request->query('query', '');

        $mediaList = [];

        foreach ($files as $filePath) {
            $filename = basename($filePath);

            if (!empty($search) && !str_contains(strtolower($filename), strtolower($search))) {
                continue;
            }

            $mediaList[] = [
                'id' => pathinfo($filename, PATHINFO_FILENAME),
                'name' => $filename,
                'path' => $filePath,
                'url' => $storage->url($filePath),
                'size' => $storage->size($filePath),
                'last_modified' => $storage->lastModified($filePath),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $mediaList,
            'total' => count($mediaList),
        ]);
    }

    /**
     * Delete a media item by ID or filename
     *
     * Route: DELETE /editor/media/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        // Path traversal defense: disallow any path separators, dots, or dangerous sequences
        if (str_contains($id, '/') || str_contains($id, '\\') || str_contains($id, '..')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid media identifier provided.',
            ], 400);
        }

        $diskName = config('editor.storage.disk', 'public');
        $basePath = trim(config('editor.storage.path', 'editor'), '/');
        $storage = Storage::disk($diskName);

        // Find file matching id or id with extension
        $targetFile = null;
        $allFiles = $storage->files($basePath);

        foreach ($allFiles as $file) {
            $filename = basename($file);
            $fileId = pathinfo($filename, PATHINFO_FILENAME);

            if ($filename === $id || $fileId === $id || Str::endsWith($fileId, $id)) {
                $targetFile = $file;
                break;
            }
        }

        if (!$targetFile || !$storage->exists($targetFile)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Media item not found.',
            ], 404);
        }

        // Additional directory boundary check: ensure targetFile starts with basePath
        if (!Str::startsWith(trim($targetFile, '/'), $basePath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized path access prevented.',
            ], 403);
        }

        $deleted = $storage->delete($targetFile);

        if (!$deleted) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete file from storage.',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Media file deleted successfully.',
            'id' => $id,
        ]);
    }
}
