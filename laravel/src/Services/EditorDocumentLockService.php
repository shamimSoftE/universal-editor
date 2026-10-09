<?php

namespace UniversalEditor\Laravel\Services;

use UniversalEditor\Laravel\Models\EditorDocument;
use UniversalEditor\Laravel\Models\EditorDocumentLock;
use Carbon\Carbon;

/**
 * Class EditorDocumentLockService
 *
 * Manages document concurrency and exclusive editing locks with TTL expiration and heartbeats.
 */
class EditorDocumentLockService
{
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
     * Attempt to acquire an exclusive edit lock on a document.
     *
     * @param EditorDocument|int $document
     * @param int $userId
     * @param string|null $userName
     * @param int|null $ttlSeconds
     * @return array
     */
    public function acquireLock($document, int $userId, ?string $userName = null, ?int $ttlSeconds = null): array
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        $ttl = $ttlSeconds ?? (function_exists('config') ? config('editor.collaboration.lock_ttl', 300) : 300);
        $now = function_exists('now') ? now() : Carbon::now();
        $expiresAt = $now instanceof Carbon ? $now->copy()->addSeconds($ttl) : Carbon::parse($now)->addSeconds($ttl);

        $lock = EditorDocumentLock::where('document_id', $docId)->first();

        if ($lock) {
            // If already locked by this user, refresh expiration
            if ((int)$lock->user_id === $userId) {
                $lock->update([
                    'user_name' => $userName ?? $lock->user_name,
                    'heartbeat_at' => $now,
                    'expires_at' => $expiresAt,
                ]);

                return [
                    'success' => true,
                    'action' => 'renewed',
                    'lock' => $lock,
                ];
            }

            // If lock expired, allow new user to take it over
            if ($lock->isExpired()) {
                $lock->update([
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'locked_at' => $now,
                    'heartbeat_at' => $now,
                    'expires_at' => $expiresAt,
                ]);

                return [
                    'success' => true,
                    'action' => 'acquired_expired',
                    'lock' => $lock,
                ];
            }

            // Lock is held by another user and still active!
            return [
                'success' => false,
                'action' => 'conflict',
                'message' => "Document is currently locked by {$lock->user_name} (ID: {$lock->user_id}).",
                'lock' => $lock,
            ];
        }

        // Create new lock
        $lock = EditorDocumentLock::create([
            'document_id' => $docId,
            'user_id' => $userId,
            'user_name' => $userName,
            'locked_at' => $now,
            'heartbeat_at' => $now,
            'expires_at' => $expiresAt,
        ]);

        return [
            'success' => true,
            'action' => 'acquired',
            'lock' => $lock,
        ];
    }

    /**
     * Send heartbeat to keep lock alive.
     *
     * @param EditorDocument|int $document
     * @param int $userId
     * @param int|null $ttlSeconds
     * @return array
     */
    public function heartbeat($document, int $userId, ?int $ttlSeconds = null): array
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        $ttl = $ttlSeconds ?? (function_exists('config') ? config('editor.collaboration.lock_ttl', 300) : 300);
        $lock = EditorDocumentLock::where('document_id', $docId)->first();

        if (!$lock) {
            return [
                'success' => false,
                'message' => 'No active lock found for this document.',
            ];
        }

        if ((int)$lock->user_id !== $userId) {
            return [
                'success' => false,
                'message' => 'Cannot refresh lock owned by another user.',
                'lock' => $lock,
            ];
        }

        $now = function_exists('now') ? now() : Carbon::now();
        $expiresAt = $now instanceof Carbon ? $now->copy()->addSeconds($ttl) : Carbon::parse($now)->addSeconds($ttl);

        $lock->update([
            'heartbeat_at' => $now,
            'expires_at' => $expiresAt,
        ]);

        return [
            'success' => true,
            'lock' => $lock,
        ];
    }

    /**
     * Release an acquired edit lock.
     *
     * @param EditorDocument|int $document
     * @param int $userId
     * @param bool $force
     * @return array
     */
    public function releaseLock($document, int $userId, bool $force = false): array
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        $lock = EditorDocumentLock::where('document_id', $docId)->first();

        if (!$lock) {
            return [
                'success' => true,
                'message' => 'Document was not locked.',
            ];
        }

        if (!$force && (int)$lock->user_id !== $userId) {
            return [
                'success' => false,
                'message' => 'Unauthorized: lock is held by another user.',
            ];
        }

        $lock->delete();

        return [
            'success' => true,
            'message' => 'Lock successfully released.',
        ];
    }

    /**
     * Check lock state for a document.
     *
     * @param EditorDocument|int $document
     * @param int|null $currentUserId
     * @return array
     */
    public function checkLock($document, ?int $currentUserId = null): array
    {
        $doc = $this->resolveDocument($document);
        $docId = is_object($doc) ? $doc->id : (is_array($doc) ? $doc['id'] : $doc);

        $lock = EditorDocumentLock::where('document_id', $docId)->first();

        if (!$lock) {
            return [
                'is_locked' => false,
                'is_owner' => false,
                'lock' => null,
            ];
        }

        if ($lock->isExpired()) {
            $lock->delete();
            return [
                'is_locked' => false,
                'is_owner' => false,
                'lock' => null,
            ];
        }

        return [
            'is_locked' => true,
            'is_owner' => $currentUserId !== null && (int)$lock->user_id === $currentUserId,
            'lock' => $lock,
        ];
    }
}
