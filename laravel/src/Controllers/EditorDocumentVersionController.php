<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use UniversalEditor\Laravel\Services\EditorDocumentVersionService;
use UniversalEditor\Laravel\Services\EditorDocumentService;

class EditorDocumentVersionController extends Controller
{
    protected EditorDocumentVersionService $versionService;
    protected EditorDocumentService $documentService;

    public function __construct(
        ?EditorDocumentVersionService $versionService = null,
        ?EditorDocumentService $documentService = null
    ) {
        $this->versionService = $versionService ?? new EditorDocumentVersionService();
        $this->documentService = $documentService ?? new EditorDocumentService();
    }

    /**
     * Display a listing of versions for the specified document.
     *
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function index($documentId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $versions = $this->versionService->listVersions($document);

        $currentVersion = is_object($document) ? ($document->version ?? 1) : ($document['version'] ?? 1);

        return response()->json([
            'success' => true,
            'document_id' => (int) $documentId,
            'current_version' => $currentVersion,
            'count' => is_array($versions) ? count($versions) : $versions->count(),
            'data' => $versions,
        ]);
    }

    /**
     * Create a new immutable version snapshot for the document.
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

        $userId = $request->user() ? ($request->user()->id ?? null) : $request->input('user_id');

        $docTitle = is_object($document) ? ($document->title ?? 'Untitled Document') : ($document['title'] ?? 'Untitled Document');
        $docHtml = is_object($document) ? ($document->content_html ?? null) : ($document['content_html'] ?? null);
        $docJson = is_object($document) ? ($document->content_json ?? null) : ($document['content_json'] ?? null);

        $data = [
            'version' => $request->input('version'),
            'note' => $request->input('note') ?? $request->input('description'),
            'title' => $request->input('title') ?? $docTitle,
            'content_html' => $request->input('content_html') ?? $docHtml,
            'content_json' => $request->input('content_json') ?? $docJson,
        ];

        $version = $this->versionService->createVersion($document, $data, $userId);

        return response()->json([
            'success' => true,
            'message' => 'Version snapshot created successfully.',
            'data' => $version,
        ], 201);
    }

    /**
     * Display a single historical version snapshot for preview.
     *
     * @param mixed $documentId
     * @param mixed $versionId
     * @return JsonResponse
     */
    public function show($documentId, $versionId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $version = $this->versionService->getVersion($document, (int) $versionId);
        if (!$version) {
            return response()->json([
                'success' => false,
                'message' => 'Version snapshot not found.',
            ], 404);
        }

        $docId = is_object($document) ? ($document->id ?? $documentId) : ($document['id'] ?? $documentId);
        $currVer = is_object($document) ? ($document->version ?? 1) : ($document['version'] ?? 1);
        $title = is_object($document) ? ($document->title ?? '') : ($document['title'] ?? '');

        return response()->json([
            'success' => true,
            'document' => [
                'id' => (int) $docId,
                'current_version' => (int) $currVer,
                'title' => $title,
            ],
            'data' => $version,
        ]);
    }

    /**
     * Restore document to a historical version snapshot.
     *
     * @param Request $request
     * @param mixed $documentId
     * @param mixed $versionId
     * @return JsonResponse
     */
    public function restore(Request $request, $documentId, $versionId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $userId = $request->user() ? ($request->user()->id ?? null) : $request->input('user_id');

        try {
            $restoredDoc = $this->versionService->restoreVersion($document, (int) $versionId, $userId);

            return response()->json([
                'success' => true,
                'message' => "Document successfully restored to version {$versionId}.",
                'data' => $restoredDoc,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Compare two versions or a version against current document state.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function compare(Request $request, $documentId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $v1 = (int) ($request->input('v1') ?? $request->input('base'));
        $v2 = $request->has('v2') ? (int) $request->input('v2') : ($request->has('target') ? (int) $request->input('target') : null);

        if (!$v1) {
            return response()->json([
                'success' => false,
                'message' => 'Base version parameter (v1) is required for comparison.',
            ], 422);
        }

        try {
            $comparison = $this->versionService->compareVersions($document, $v1, $v2);

            return response()->json([
                'success' => true,
                'data' => $comparison,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
