<?php

namespace UniversalEditor\Laravel\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use UniversalEditor\Laravel\Security\ContentSanitizer;

/**
 * Class EditorDocument
 *
 * Eloquent model representing rich text documents managed by Universal Editor.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $title
 * @property string|null $content_html
 * @property array|null $content_json
 * @property string $status
 * @property int $version
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class EditorDocument extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PUBLISHED,
        self::STATUS_ARCHIVED,
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'content_html',
        'content_json',
        'status',
        'version',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'integer',
        'content_json' => 'array',
        'version' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_DRAFT,
        'version' => 1,
    ];

    /**
     * EditorDocument constructor.
     *
     * @param array $attributes
     */
    public function __construct(array $attributes = [])
    {
        $this->table = function_exists('config')
            ? config('editor.database.table', 'editor_documents')
            : 'editor_documents';

        parent::__construct($attributes);
    }

    /**
     * The "booted" method of the model.
     * Auto-sanitizes HTML content before saving when enabled.
     */
    protected static function booted(): void
    {
        static::saving(function (EditorDocument $document) {
            $sanitizationEnabled = function_exists('config')
                ? config('editor.sanitization.enabled', true)
                : true;

            if ($sanitizationEnabled && !empty($document->content_html)) {
                $document->content_html = ContentSanitizer::clean($document->content_html);
            }
        });
    }

    /**
     * Scope a query to only include documents of a given status.
     *
     * @param Builder $query
     * @param string $status
     * @return Builder
     */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include published documents.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope a query to only include draft documents.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope a query to only include archived documents.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    /**
     * Scope a query to only include documents for a specific user.
     *
     * @param Builder $query
     * @param int|null $userId
     * @return Builder
     */
    public function scopeForUser(Builder $query, ?int $userId): Builder
    {
        if ($userId === null) {
            return $query->whereNull('user_id');
        }
        return $query->where('user_id', $userId);
    }

    /**
     * Search documents by title or plain text inside content_html.
     *
     * @param Builder $query
     * @param string $term
     * @return Builder
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $term = trim($term);
        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('content_html', 'like', "%{$term}%");
        });
    }

    /**
     * Check if document is a draft.
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if document is published.
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * Check if document is archived.
     *
     * @return bool
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    /**
     * Publish the document.
     *
     * @return bool
     */
    public function publish(): bool
    {
        $this->status = self::STATUS_PUBLISHED;
        return $this->save();
    }

    /**
     * Archive the document.
     *
     * @return bool
     */
    public function archive(): bool
    {
        $this->status = self::STATUS_ARCHIVED;
        return $this->save();
    }

    /**
     * Increment the document version number.
     *
     * @return int New version number
     */
    public function incrementVersion(): int
    {
        $this->version = ($this->version ?? 1) + 1;
        $this->save();
        return $this->version;
    }

    /**
     * Calculate approximate word count of HTML content.
     *
     * @return int
     */
    public function getWordCountAttribute(): int
    {
        $html = $this->content_html ?? '';
        if (empty($html)) {
            return 0;
        }
        $plain = strip_tags($html);
        return str_word_count($plain);
    }

    /**
     * Optional author relationship.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        $userModel = function_exists('config')
            ? config('auth.providers.users.model', 'App\\Models\\User')
            : 'App\\Models\\User';

        return $this->belongsTo($userModel, 'user_id');
    }

    /**
     * Historical version snapshots of this document.
     *
     * @return HasMany
     */
    public function versions(): HasMany
    {
        return $this->hasMany(EditorDocumentVersion::class, 'document_id')
            ->orderBy('version', 'desc');
    }

    /**
     * Latest version snapshot of this document.
     *
     * @return HasOne
     */
    public function latestVersion(): HasOne
    {
        return $this->hasOne(EditorDocumentVersion::class, 'document_id')
            ->latestOfMany('version');
    }

    /**
     * Create an immutable version snapshot of the current document state.
     *
     * @param string|null $note Optional revision note
     * @param int|null $userId User ID creating the version
     * @return EditorDocumentVersion
     */
    public function createVersionSnapshot(?string $note = null, ?int $userId = null): EditorDocumentVersion
    {
        $versionModel = new EditorDocumentVersion([
            'document_id' => $this->id,
            'version' => $this->version ?? 1,
            'title' => $this->title,
            'note' => $note,
            'content_html' => $this->content_html,
            'content_json' => $this->content_json,
            'word_count' => $this->word_count,
            'created_by' => $userId ?? $this->user_id,
            'created_at' => now(),
        ]);

        $versionModel->save();
        return $versionModel;
    }

    /**
     * Restore document content from an existing version snapshot.
     * Increments the document's version number and updates content.
     *
     * @param EditorDocumentVersion|int $version
     * @param int|null $userId User performing the restoration
     * @return self
     */
    public function restoreFromVersion($version, ?int $userId = null): self
    {
        if (is_numeric($version)) {
            $versionModel = $this->versions()->where('id', $version)->orWhere('version', $version)->firstOrFail();
        } else {
            $versionModel = $version;
        }

        $this->content_html = $versionModel->content_html;
        $this->content_json = $versionModel->content_json;
        $this->title = $versionModel->title ?? $this->title;
        $this->version = ($this->version ?? 1) + 1;
        $this->save();

        // Create an audit version snapshot of the restoration
        $this->createVersionSnapshot(
            "Restored from version {$versionModel->version}",
            $userId ?? $this->user_id
        );

        return $this;
    }

    /**
     * All comments anchored to this document.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(EditorDocumentComment::class, 'document_id');
    }

    /**
     * Active (unresolved) comments anchored to this document.
     */
    public function activeComments(): HasMany
    {
        return $this->hasMany(EditorDocumentComment::class, 'document_id')
            ->where('status', EditorDocumentComment::STATUS_ACTIVE);
    }

    /**
     * Root top-level comments for this document.
     */
    public function rootComments(): HasMany
    {
        return $this->hasMany(EditorDocumentComment::class, 'document_id')
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Active edit lock for this document.
     */
    public function currentLock(): HasOne
    {
        return $this->hasOne(EditorDocumentLock::class, 'document_id');
    }

    /**
     * Check if document is currently locked by any user.
     */
    public function isLocked(): bool
    {
        $lock = $this->currentLock;
        if (!$lock) {
            return false;
        }

        if ($lock->isExpired()) {
            $lock->delete();
            return false;
        }

        return true;
    }

    /**
     * Check if document is locked by a specific user.
     */
    public function isLockedBy(int $userId): bool
    {
        $lock = $this->currentLock;
        if (!$lock || $lock->isExpired()) {
            return false;
        }

        return (int)$lock->user_id === $userId;
    }

    /**
     * Acquire or renew edit lock on this document for a user.
     */
    public function acquireLock(int $userId, ?string $userName = null, int $ttlSeconds = 300): EditorDocumentLock
    {
        $now = function_exists('now') ? now() : \Carbon\Carbon::now();
        $expiresAt = $now instanceof \Carbon\Carbon ? $now->copy()->addSeconds($ttlSeconds) : \Carbon\Carbon::parse($now)->addSeconds($ttlSeconds);

        $lock = EditorDocumentLock::where('document_id', $this->id)->first();

        if ($lock) {
            // Check if existing lock belongs to another user and has not expired
            if ((int)$lock->user_id !== $userId && !$lock->isExpired()) {
                throw new \RuntimeException("Document is currently locked by {$lock->user_name} (ID: {$lock->user_id})");
            }

            $lock->update([
                'user_id' => $userId,
                'user_name' => $userName ?? $lock->user_name,
                'locked_at' => $now,
                'heartbeat_at' => $now,
                'expires_at' => $expiresAt,
            ]);
            return $lock;
        }

        return EditorDocumentLock::create([
            'document_id' => $this->id,
            'user_id' => $userId,
            'user_name' => $userName,
            'locked_at' => $now,
            'heartbeat_at' => $now,
            'expires_at' => $expiresAt,
        ]);
    }

    /**
     * Release edit lock on this document.
     */
    public function releaseLock(int $userId, bool $force = false): bool
    {
        $lock = EditorDocumentLock::where('document_id', $this->id)->first();
        if (!$lock) {
            return true;
        }

        if (!$force && (int)$lock->user_id !== $userId) {
            return false;
        }

        return (bool)$lock->delete();
    }
}

