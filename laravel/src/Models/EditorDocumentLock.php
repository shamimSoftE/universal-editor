<?php

namespace UniversalEditor\Laravel\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Class EditorDocumentLock
 *
 * Eloquent model representing an exclusive editing lock on a document.
 * Includes TTL expiration and heartbeat tracking to prevent abandoned locks.
 *
 * @property int $id
 * @property int $document_id
 * @property int $user_id
 * @property string|null $user_name
 * @property string|null $user_avatar
 * @property \Carbon\Carbon $locked_at
 * @property \Carbon\Carbon $expires_at
 * @property \Carbon\Carbon|null $heartbeat_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class EditorDocumentLock extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table;

    /**
     * Mass assignable attributes.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'document_id',
        'user_id',
        'user_name',
        'user_avatar',
        'locked_at',
        'expires_at',
        'heartbeat_at',
    ];

    /**
     * Attribute casting.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'document_id' => 'integer',
        'user_id' => 'integer',
        'locked_at' => 'datetime',
        'expires_at' => 'datetime',
        'heartbeat_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Create a new Eloquent model instance.
     */
    public function __construct(array $attributes = [])
    {
        $this->table = function_exists('config')
            ? config('editor.database.locks_table', 'editor_document_locks')
            : 'editor_document_locks';

        parent::__construct($attributes);
    }

    /**
     * Document associated with this lock.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(EditorDocument::class, 'document_id');
    }

    /**
     * User holding the lock.
     */
    public function user(): BelongsTo
    {
        $userModel = function_exists('config')
            ? config('auth.providers.users.model', 'App\\Models\\User')
            : 'App\\Models\\User';

        return $this->belongsTo($userModel, 'user_id');
    }

    /**
     * Scope query to non-expired active locks.
     */
    public function scopeActive(Builder $query): Builder
    {
        $currentTime = function_exists('now') ? now() : date('Y-m-d H:i:s');
        return $query->where('expires_at', '>', $currentTime);
    }

    /**
     * Determine if this lock is currently expired.
     */
    public function isExpired(): bool
    {
        if (empty($this->expires_at)) {
            return false;
        }

        $now = function_exists('now') ? now() : Carbon::now();
        $expires = $this->expires_at instanceof Carbon
            ? $this->expires_at
            : Carbon::parse($this->expires_at);

        return $expires->lessThanOrEqualTo($now);
    }

    /**
     * Determine if this lock is currently active and not expired.
     */
    public function isActive(): bool
    {
        return !$this->isExpired();
    }

    /**
     * Refresh the lock's heartbeat and extend expiration time.
     *
     * @param int $ttlSeconds Time to live in seconds (default 300 = 5 minutes)
     */
    public function refreshHeartbeat(int $ttlSeconds = 300): self
    {
        $now = function_exists('now') ? now() : Carbon::now();
        $this->heartbeat_at = $now;
        $this->expires_at = $now instanceof Carbon ? $now->copy()->addSeconds($ttlSeconds) : Carbon::parse($now)->addSeconds($ttlSeconds);
        $this->save();

        return $this;
    }
}
