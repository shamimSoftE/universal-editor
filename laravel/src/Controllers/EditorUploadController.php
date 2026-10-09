<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EditorUploadController extends Controller
{
    public const BLACKLISTED_EXTENSIONS = [
        'php', 'phtml', 'phar', 'php3', 'php4', 'php5', 'php7', 'phps',
        'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'py', 'jsp', 'asp', 'aspx',
        'htm', 'html', 'js', 'vbs', 'jar', 'com'
    ];

    /**
     * Handle file / image upload
     *
     * Route: POST /editor/upload
     */
    public function upload(Request $request): JsonResponse
    {
        // 0. Authorization check if auth is required
        $authRequired = config('editor.authentication.required', false);
        if ($authRequired && !$request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Authentication required for uploads.',
            ], 401);
        }

        // Support both 'file', 'image', or 'upload' keys
        $fileKey = $request->hasFile('file') ? 'file' : ($request->hasFile('image') ? 'image' : 'upload');

        $maxSizeKb = config('editor.upload.max_size', 10240);
        $allowedMimes = config('editor.upload.allowed_mimes', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf']);
        $mimesRule = implode(',', $allowedMimes);

        $request->validate([
            $fileKey => "required|file|max:{$maxSizeKb}|mimes:{$mimesRule}",
        ], [
            "{$fileKey}.required" => 'No file was provided for upload.',
            "{$fileKey}.file" => 'The uploaded item must be a valid file.',
            "{$fileKey}.max" => "The file exceeds the maximum allowed upload size of {$maxSizeKb} KB.",
            "{$fileKey}.mimes" => "The file type is not allowed. Supported extensions: {$mimesRule}.",
        ]);

        $uploadedFile = $request->file($fileKey);

        if (!$uploadedFile || !$uploadedFile->isValid()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Uploaded file is invalid or corrupted.',
            ], 422);
        }

        $originalName = $uploadedFile->getClientOriginalName();

        // 1. Path traversal & null-byte injection prevention
        if (str_contains($originalName, "\0") || str_contains($originalName, '..') || str_contains($originalName, '/') || str_contains($originalName, '\\')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Path traversal or null-byte characters detected in filename.',
            ], 422);
        }

        // 2. Dangerous executable extension blacklist & double-extension defense
        $extension = strtolower($uploadedFile->getClientOriginalExtension() ?: $uploadedFile->guessExtension() ?: '');
        if (in_array($extension, self::BLACKLISTED_EXTENSIONS, true)) {
            return response()->json([
                'status' => 'error',
                'message' => "Executable file extension '.{$extension}' is strictly prohibited.",
            ], 422);
        }

        // Reject double-extension smuggling (e.g. payload.php.jpg or evil.phtml.png)
        if (preg_match('/\.(php|phtml|phar|exe|sh|bat|cmd|cgi|pl|py|jsp|asp|aspx)[\.\s]/i', $originalName)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Multi-extension executable payload detected.',
            ], 422);
        }

        // 3. MIME spoofing check: verify reported MIME matches allowed MIME families
        $mimeType = $uploadedFile->getMimeType();
        $disallowedMimes = ['application/x-php', 'text/x-php', 'text/html', 'application/javascript', 'application/x-executable', 'application/x-sharedlib'];
        if (in_array($mimeType, $disallowedMimes, true)) {
            return response()->json([
                'status' => 'error',
                'message' => "MIME spoofing detected: MIME type '{$mimeType}' is not permitted.",
            ], 422);
        }

        $diskName = config('editor.storage.disk', 'public');
        $basePath = trim(config('editor.storage.path', 'editor'), '/');

        // Secure randomized filename to prevent collisions and path traversal
        $safeOriginalName = pathinfo($originalName, PATHINFO_FILENAME);
        $safeOriginalName = Str::slug($safeOriginalName) ?: 'file';
        $fileId = (string) Str::uuid();
        $finalFilename = "{$safeOriginalName}-{$fileId}.{$extension}";

        $storage = Storage::disk($diskName);

        // Sanitize SVG if uploaded to eliminate malicious scripts or event handlers
        if (strtolower($extension) === 'svg' || $uploadedFile->getMimeType() === 'image/svg+xml') {
            $rawSvg = file_get_contents($uploadedFile->getRealPath());
            $sanitizedSvg = \UniversalEditor\Laravel\Security\ContentSanitizer::cleanSvg($rawSvg);
            $fullPath = $basePath ? "{$basePath}/{$finalFilename}" : $finalFilename;
            $success = $storage->put($fullPath, $sanitizedSvg);
            $storedPath = $success ? $fullPath : false;
        } else {
            $storedPath = $storage->putFileAs($basePath, $uploadedFile, $finalFilename);
        }

        if (!$storedPath) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to write file to storage filesystem.',
            ], 500);
        }

        $url = $storage->url($storedPath);

        return response()->json([
            'status' => 'success',
            'url' => $url,
            'name' => $uploadedFile->getClientOriginalName(),
            'size' => $uploadedFile->getSize(),
            'type' => $uploadedFile->getMimeType(),
            'id' => $fileId,
            'path' => $storedPath,
        ], 201);
    }
}
