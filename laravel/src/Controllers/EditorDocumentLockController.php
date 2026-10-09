<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use UniversalEditor\Laravel\Services\EditorDocumentLockService;
use UniversalEditor\Laravel\Services\EditorDocumentService;

class EditorDocumentLockController extends Controller
{
    protected EditorDocumentLockService $lockService;
    protected EditorDocumentService $documentService;

    public function __construct(
        ?EditorDocumentLockService $lockService = null,
        ?EditorDocumentService $documentService = null
    ) {
        $this->lockService = $lockService ?? new EditorDocumentLockService();
        $this->documentService = $documentService ?? new EditorDocumentService();
    }

    /**
     * Acquire exclusive editing lock for a document.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function lock(Request $request, $documentId): JsonResponse
    {
        $document = $this->documentService->find($documentId);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $userId = $request->user() ? $request->user()->id : $request->input('user_id');
        if (empty($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required to acquire lock.',
            ], 422);
        }

        $userName = $request->input('user_name', 'Anonymous User');
        $ttl = $request->input('ttl');

        $result = $this->lockService->acquireLock(
            $document,
            (int)$userId,
            $userName,
            $ttl ? (int)$ttl : null
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'action' => 'conflict',
                'message' => $result['message'],
                'data' => $result['lock'],
            ], 409); // 409 Conflict when locked by another peer
        }

        return response()->json([
            'success' => true,
            'action' => $result['action'],
            'message' => 'Document edit lock acquired successfully.',
            'data' => $result['lock'],
        ], 200);
    }

    /**
     * Send heartbeat to keep lock alive.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function heartbeat(Request $request, $documentId): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id');
        if (empty($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required for heartbeat.',
            ], 422);
        }

        $ttl = $request->input('ttl');

        $result = $this->lockService->heartbeat(
            $documentId,
            (int)$userId,
            $ttl ? (int)$ttl : null
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'data' => $result['lock'] ?? null,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat acknowledged.',
            'data' => $result['lock'],
        ], 200);
    }

    /**
     * Release an edit lock on a document.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function unlock(Request $request, $documentId): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id');
        if (empty($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required to release lock.',
            ], 422);
        }

        $force = $request->boolean('force', false);

        $result = $this->lockService->releaseLock($documentId, (int)$userId, $force);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ], 200);
    }

    /**
     * Check current lock status for a document.
     *
     * @param Request $request
     * @param mixed $documentId
     * @return JsonResponse
     */
    public function status(Request $request, $documentId): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id');

        $result = $this->lockService->checkLock($documentId, $userId ? (int)$userId : null);

        return response()->json([
            'success' => true,
            'document_id' => (int)$documentId,
            'is_locked' => $result['is_locked'],
            'is_owner' => $result['is_owner'],
            'data' => $result['lock'],
        ]);
    }
}
