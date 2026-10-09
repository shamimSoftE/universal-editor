<?php

namespace UniversalEditor\Laravel\Policies;

use UniversalEditor\Laravel\Models\EditorDocument;

/**
 * Class EditorDocumentPolicy
 *
 * Authorization policy for EditorDocument model actions.
 */
class EditorDocumentPolicy
{
    /**
     * Determine whether the user can view any documents.
     */
    public function viewAny($user = null): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the document.
     */
    public function view($user = null, ?EditorDocument $document = null): bool
    {
        if ($document === null) {
            return false;
        }

        // Anyone can view published documents
        if ($document->isPublished()) {
            return true;
        }

        // Only the author or authenticated admins can view drafts / archives
        if ($user !== null) {
            $userId = is_object($user) && isset($user->id) ? $user->id : (is_array($user) ? ($user['id'] ?? null) : $user);
            return (int) $document->user_id === (int) $userId;
        }

        return false;
    }

    /**
     * Determine whether the user can create documents.
     */
    public function create($user = null): bool
    {
        // If auth is required, ensure user is provided
        $authRequired = function_exists('config')
            ? config('editor.authentication.required', false)
            : false;

        if ($authRequired) {
            return $user !== null;
        }

        return true;
    }

    /**
     * Determine whether the user can update the document.
     */
    public function update($user = null, ?EditorDocument $document = null): bool
    {
        if ($document === null) {
            return false;
        }

        $authRequired = function_exists('config')
            ? config('editor.authentication.required', false)
            : false;

        if (!$authRequired) {
            return true;
        }

        if ($user !== null) {
            $userId = is_object($user) && isset($user->id) ? $user->id : (is_array($user) ? ($user['id'] ?? null) : $user);
            return (int) $document->user_id === (int) $userId;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the document.
     */
    public function delete($user = null, ?EditorDocument $document = null): bool
    {
        return $this->update($user, $document);
    }

    /**
     * Determine whether the user can view historical versions of the document.
     */
    public function viewVersions($user = null, ?EditorDocument $document = null): bool
    {
        return $this->view($user, $document);
    }

    /**
     * Determine whether the user can create a version snapshot of the document.
     */
    public function createVersion($user = null, ?EditorDocument $document = null): bool
    {
        return $this->update($user, $document);
    }

    /**
     * Determine whether the user can restore a previous version of the document.
     */
    public function restoreVersion($user = null, ?EditorDocument $document = null): bool
    {
        return $this->update($user, $document);
    }
}
