<?php

namespace UniversalEditor\Laravel\Services;

use UniversalEditor\Laravel\Models\EditorDocument;
use UniversalEditor\Laravel\Security\ContentSanitizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Class EditorDocumentService
 *
 * Business logic layer for managing EditorDocument entities.
 */
class EditorDocumentService
{
    /**
     * Fallback in-memory document store for headless / test environments
     */
    protected static array $memoryStore = [];
    protected static int $nextId = 1;

    /**
     * Query documents with filters and pagination
     *
     * @param array $filters ['status', 'search', 'user_id']
     * @param int $perPage
     * @return mixed
     */
    public function list(array $filters = [], int $perPage = 15): mixed
    {
        // Try Eloquent query if database is configured and connected
        try {
            if (
                class_exists('Illuminate\Support\Facades\DB') &&
                class_exists(EditorDocument::class) &&
                \Illuminate\Support\Facades\DB::connection()->getPdo()
            ) {
                $query = EditorDocument::query();

                if (!empty($filters['status'])) {
                    $query->status($filters['status']);
                }

                if (!empty($filters['search'])) {
                    $query->search($filters['search']);
                }

                if (array_key_exists('user_id', $filters) && $filters['user_id'] !== null) {
                    $query->forUser((int) $filters['user_id']);
                }

                return $query->latest()->paginate($perPage);
            }
        } catch (\Throwable $e) {
            // Fall through to memory store
        }

        // Memory store filter & slice
        $results = array_values(static::$memoryStore);

        if (!empty($filters['status'])) {
            $results = array_filter($results, function ($d) use ($filters) {
                $status = is_object($d) ? ($d->status ?? '') : ($d['status'] ?? '');
                return $status === $filters['status'];
            });
        }

        if (!empty($filters['search'])) {
            $term = strtolower(trim($filters['search']));
            $results = array_filter($results, function ($d) use ($term) {
                $title = is_object($d) ? ($d->title ?? '') : ($d['title'] ?? '');
                $html = is_object($d) ? ($d->content_html ?? '') : ($d['content_html'] ?? '');
                return str_contains(strtolower($title), $term) || str_contains(strtolower($html), $term);
            });
        }

        if (array_key_exists('user_id', $filters) && $filters['user_id'] !== null) {
            $userId = (int) $filters['user_id'];
            $results = array_filter($results, function ($d) use ($userId) {
                $uid = is_object($d) ? ($d->user_id ?? null) : ($d['user_id'] ?? null);
                return (int) $uid === $userId;
            });
        }

        return [
            'data' => array_slice(array_values($results), 0, $perPage),
            'total' => count($results),
            'per_page' => $perPage,
            'current_page' => 1,
        ];
    }

    /**
     * Find a document by ID
     *
     * @param int|string $id
     * @return mixed
     */
    public function find(int|string $id): mixed
    {
        try {
            $doc = EditorDocument::find($id);
            if ($doc) {
                return $doc;
            }
        } catch (\Throwable $e) {
            // Ignore DB exception in headless environments
        }

        $raw = static::$memoryStore[(int) $id] ?? null;
        if ($raw !== null) {
            return ($raw instanceof EditorDocument) ? $raw : new EditorDocument((array) $raw);
        }
        return null;
    }

    /**
     * Create a new document
     *
     * @param array $data
     * @param int|null $userId
     * @return mixed
     */
    public function create(array $data, ?int $userId = null): mixed
    {
        $html = $data['content_html'] ?? null;
        if (!empty($html)) {
            $html = ContentSanitizer::clean($html);
        }

        $documentData = [
            'user_id' => $userId ?? ($data['user_id'] ?? null),
            'title' => $data['title'] ?? 'Untitled Document',
            'content_html' => $html,
            'content_json' => $data['content_json'] ?? null,
            'status' => in_array($data['status'] ?? '', EditorDocument::STATUSES, true)
                ? $data['status']
                : EditorDocument::STATUS_DRAFT,
            'version' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $id = static::$nextId++;
        $documentData['id'] = $id;
        $docInstance = new EditorDocument($documentData);
        static::$memoryStore[$id] = $docInstance;

        try {
            $created = EditorDocument::create($documentData);
            if ($created && !empty($created->id)) {
                return $created;
            }
        } catch (\Throwable $e) {
            // Store fallback
        }

        return $docInstance;
    }

    /**
     * Update an existing document
     *
     * @param int|string $id
     * @param array $data
     * @return mixed
     */
    public function update(int|string $id, array $data): mixed
    {
        $doc = $this->find($id);
        if (!$doc) {
            return null;
        }

        $html = $data['content_html'] ?? null;
        if (!empty($html)) {
            $html = ContentSanitizer::clean($html);
        }

        if (is_object($doc) && $doc instanceof EditorDocument) {
            if (isset($data['title'])) $doc->title = $data['title'];
            if ($html !== null) $doc->content_html = $html;
            if (isset($data['content_json'])) $doc->content_json = $data['content_json'];
            if (isset($data['status']) && in_array($data['status'], EditorDocument::STATUSES, true)) {
                $doc->status = $data['status'];
            }
            $doc->version = ($doc->version ?? 1) + 1;
            $doc->save();
            return $doc;
        }

        // Memory store update
        $record = is_array($doc) ? $doc : (array) $doc;
        if (isset($data['title'])) $record['title'] = $data['title'];
        if ($html !== null) $record['content_html'] = $html;
        if (isset($data['content_json'])) $record['content_json'] = $data['content_json'];
        if (isset($data['status']) && in_array($data['status'], EditorDocument::STATUSES, true)) {
            $record['status'] = $data['status'];
        }
        $record['version'] = ($record['version'] ?? 1) + 1;
        $record['updated_at'] = date('Y-m-d H:i:s');

        static::$memoryStore[(int) $id] = $record;
        return (object) $record;
    }

    /**
     * Delete a document
     *
     * @param int|string $id
     * @return bool
     */
    public function delete(int|string $id): bool
    {
        try {
            $doc = EditorDocument::find($id);
            if ($doc) {
                return (bool) $doc->delete();
            }
        } catch (\Throwable $e) {
            // Ignore
        }

        if (isset(static::$memoryStore[(int) $id])) {
            unset(static::$memoryStore[(int) $id]);
            return true;
        }

        return false;
    }

    /**
     * Change document status
     *
     * @param int|string $id
     * @param string $status
     * @return mixed
     */
    public function changeStatus(int|string $id, string $status): mixed
    {
        if (!in_array($status, EditorDocument::STATUSES, true)) {
            throw new \InvalidArgumentException("Invalid document status: {$status}");
        }

        return $this->update($id, ['status' => $status]);
    }

    /**
     * Reset memory store (useful for tests)
     */
    public static function resetMemoryStore(): void
    {
        static::$memoryStore = [];
        static::$nextId = 1;
    }
}
