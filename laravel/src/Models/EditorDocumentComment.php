<?php

namespace UniversalEditor\Laravel\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use UniversalEditor\Laravel\Security\ContentSanitizer;

/**
 * Class EditorDocumentComment
 *
 * Eloquent model representing inline comments and threaded replies anchored to rich text documents.
 *
 * @property int $id
 * @property int $document_id
 * @property int|null $user_id
 * @property string|null $user_name
 * @property string|null $user_avatar
 * @property int|null $parent_id
 * @property string|null $selected_text
 * @property int|null $from_pos
 * @property int|null $to_pos
 * @property string $content
 * @property string $status
 * @property int|null $resolved_by
 * @property \Carbon\Carbon|null $resolved_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class EditorDocumentComment extends Model
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_RESOLVED = 'resolved';

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
        'parent_id',
        'selected_text',
        'from_pos',
        'to_pos',
        'content',
        'status',
        'resolved_by',
        'resolved_at',
    ];

    /**
     * Attribute casting.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'document_id' => 'integer',
        'user_id' => 'integer',
        'parent_id' => 'integer',
        'from_pos' => 'integer',
        'to_pos' => 'integer',
        'resolved_by' => 'integer',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Default model attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_ACTIVE,
    ];

    /**
     * Create a new Eloquent model instance.
     */
    public function __construct(array $attributes = [])
    {
        $this->table = function_exists('config')
            ? config('editor.database.comments_table', 'editor_document_comments')
            : 'editor_document_comments';

        parent::__construct($attributes);
    }

    /**
     * Bootstrap the model and its traits.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($comment) {
            // Sanitize comment content to prevent stored XSS
            if (!empty($comment->content)) {
                $sanitizer = new ContentSanitizer([
                    'allowed_tags' => ['p', 'strong', 'b', 'em', 'i', 'code', 'span', 'br', 'a'],
                    'allowed_attributes' => [
                        '*' => ['class', 'data-mention-id', 'data-username'],
                        'a' => ['href', 'target'],
                    ],
                ]);
                $comment->content = $sanitizer->clean($comment->content);
            }
        });
    }

    /**
     * Document to which this comment belongs.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(EditorDocument::class, 'document_id');
    }

    /**
     * Parent comment if this is a threaded reply.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Threaded replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    /**
     * Author of the comment.
     */
    public function author(): BelongsTo
    {
        $userModel = function_exists('config')
            ? config('auth.providers.users.model', 'App\\Models\\User')
            : 'App\\Models\\User';

        return $this->belongsTo($userModel, 'user_id');
    }

    /**
     * User who resolved the comment.
     */
    public function resolver(): BelongsTo
    {
        $userModel = function_exists('config')
            ? config('auth.providers.users.model', 'App\\Models\\User')
            : 'App\\Models\\User';

        return $this->belongsTo($userModel, 'resolved_by');
    }

    /**
     * Scope query to root comments only (not replies).
     */
    public function scopeRoot(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope query to active (unresolved) comments.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope query to resolved comments.
     */
    public function scopeResolved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_RESOLVED);
    }

    /**
     * Resolve the comment.
     */
    public function resolve(?int $userId = null): self
    {
        $this->status = self::STATUS_RESOLVED;
        $this->resolved_by = $userId;
        $this->resolved_at = function_exists('now') ? now() : date('Y-m-d H:i:s');
        $this->save();

        return $this;
    }

    /**
     * Reopen a resolved comment.
     */
    public function reopen(): self
    {
        $this->status = self::STATUS_ACTIVE;
        $this->resolved_by = null;
        $this->resolved_at = null;
        $this->save();

        return $this;
    }

    /**
     * Determine if comment is resolved.
     */
    public function isResolved(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }

    /**
     * Determine if comment is a top-level root comment.
     */
    public function isRoot(): bool
    {
        return empty($this->parent_id);
    }
}
