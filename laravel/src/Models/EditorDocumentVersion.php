<?php

namespace UniversalEditor\Laravel\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use UniversalEditor\Laravel\Security\ContentSanitizer;

class EditorDocumentVersion extends Model
{
    /**
     * Disable default updated_at since versions are immutable historical snapshots.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'document_id',
        'version',
        'title',
        'note',
        'content_html',
        'content_json',
        'word_count',
        'created_by',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'document_id' => 'integer',
        'version' => 'integer',
        'word_count' => 'integer',
        'created_by' => 'integer',
        'content_json' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the table associated with the model.
     */
    public function getTable(): string
    {
        return config('editor.database.versions_table', 'editor_document_versions');
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($version) {
            if (empty($version->created_at)) {
                $version->created_at = now();
            }

            // Ensure content_html is sanitized
            if (!empty($version->content_html) && config('editor.sanitization.enabled', true)) {
                $version->content_html = ContentSanitizer::clean($version->content_html);
            }

            // Auto-calculate word count if not explicitly provided
            if (empty($version->word_count) && !empty($version->content_html)) {
                $cleanText = strip_tags($version->content_html);
                $cleanText = html_entity_decode($cleanText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $words = preg_split('/\s+/u', trim($cleanText), -1, PREG_SPLIT_NO_EMPTY);
                $version->word_count = is_array($words) ? count($words) : 0;
            }
        });
    }

    /**
     * The document this version snapshot belongs to.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(EditorDocument::class, 'document_id');
    }

    /**
     * The user who created this version snapshot.
     */
    public function author(): BelongsTo
    {
        $userModel = config('editor.user_model', 'App\\Models\\User');
        return $this->belongsTo($userModel, 'created_by');
    }

    /**
     * Generate a plain text preview snippet of the version content.
     */
    public function getPreviewSnippet(int $length = 120): string
    {
        if (empty($this->content_html)) {
            return '';
        }

        $plain = strip_tags($this->content_html);
        $plain = html_entity_decode($plain, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $plain = preg_replace('/\s+/u', ' ', trim($plain));

        if (mb_strlen($plain) <= $length) {
            return $plain;
        }

        return mb_substr($plain, 0, $length) . '...';
    }
}
