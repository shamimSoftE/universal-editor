<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use UniversalEditor\Laravel\Services\EditorDocumentService;
use UniversalEditor\Laravel\Models\EditorDocument;

/**
 * Class EditorDocumentController
 *
 * RESTful API controller for managing persistent rich-text documents.
 */
class EditorDocumentController extends Controller
{
    protected EditorDocumentService $documentService;

    public function __construct(?EditorDocumentService $documentService = null)
    {
        $this->documentService = $documentService ?? new EditorDocumentService();
    }

    /**
     * Display a listing of documents.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('per_page') ?? config('editor.database.per_page', 15));
        $filters = [
            'status' => $request->input('status'),
            'search' => $request->input('search') ?? $request->input('q'),
            'user_id' => $request->input('user_id'),
        ];

        $paginator = $this->documentService->list($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => is_array($paginator) ? ($paginator['data'] ?? $paginator) : $paginator->items(),
            'pagination' => [
                'total' => is_array($paginator) ? ($paginator['total'] ?? count($paginator['data'] ?? [])) : $paginator->total(),
                'per_page' => $perPage,
                'current_page' => is_array($paginator) ? ($paginator['current_page'] ?? 1) : $paginator->currentPage(),
            ],
        ]);
    }

    /**
     * Store a newly created document.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $title = $request->input('title');
        if (empty($title)) {
            return response()->json([
                'success' => false,
                'message' => 'The title field is required.',
                'errors' => ['title' => ['The title field is required.']],
            ], 422);
        }

        $status = $request->input('status', EditorDocument::STATUS_DRAFT);
        if (!in_array($status, EditorDocument::STATUSES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid document status specified.',
                'errors' => ['status' => ['Status must be draft, published, or archived.']],
            ], 422);
        }

        $userId = $request->user() ? ($request->user()->id ?? null) : $request->input('user_id');

        $document = $this->documentService->create([
            'title' => (string) $title,
            'content_html' => $request->input('content_html') ?? $request->input('html'),
            'content_json' => $request->input('content_json') ?? $request->input('json') ?? $request->input('content'),
            'status' => $status,
            'user_id' => $userId,
        ], $userId);

        return response()->json([
            'success' => true,
            'message' => 'Document created successfully.',
            'data' => $document,
        ], 201);
    }

    /**
     * Display the specified document.
     *
     * @param mixed $id
     * @return JsonResponse
     */
    public function show(mixed $id): JsonResponse
    {
        $document = $this->documentService->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => "Document with ID {$id} not found.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $document,
        ]);
    }

    /**
     * Update the specified document.
     *
     * @param Request $request
     * @param mixed $id
     * @return JsonResponse
     */
    public function update(Request $request, mixed $id): JsonResponse
    {
        $document = $this->documentService->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => "Document with ID {$id} not found.",
            ], 404);
        }

        $updateData = [];

        if ($request->has('title')) {
            $title = $request->input('title');
            if (empty($title)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The title field cannot be empty.',
                ], 422);
            }
            $updateData['title'] = (string) $title;
        }

        if ($request->has('status')) {
            $status = $request->input('status');
            if (!in_array($status, EditorDocument::STATUSES, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid document status specified.',
                ], 422);
            }
            $updateData['status'] = $status;
        }

        if ($request->has('content_html') || $request->has('html')) {
            $updateData['content_html'] = $request->input('content_html') ?? $request->input('html');
        }

        if ($request->has('content_json') || $request->has('json') || $request->has('content')) {
            $updateData['content_json'] = $request->input('content_json') ?? $request->input('json') ?? $request->input('content');
        }

        $updated = $this->documentService->update($id, $updateData);

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Remove the specified document from storage.
     *
     * @param mixed $id
     * @return JsonResponse
     */
    public function destroy(mixed $id): JsonResponse
    {
        $deleted = $this->documentService->delete($id);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => "Document with ID {$id} not found.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);
    }
}
