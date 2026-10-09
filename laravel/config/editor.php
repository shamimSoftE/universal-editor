<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Routes & Middleware
    |--------------------------------------------------------------------------
    |
    | Configure the URL prefix and middleware stack applied to all editor
    | endpoints (upload, media list, media delete, autosave).
    |
    */
    'route' => [
        'prefix' => env('EDITOR_ROUTE_PREFIX', 'api/editor'),
        'middleware' => ['api'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | The filesystem disk and base folder path where uploaded images and
    | files will be stored.
    |
    */
    'storage' => [
        'disk' => env('EDITOR_DISK', 'public'),
        'path' => env('EDITOR_STORAGE_PATH', 'editor'),
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Constraints
    |--------------------------------------------------------------------------
    |
    | Maximum file size in kilobytes (KB) and whitelist of allowed MIME types
    | or file extensions.
    |
    */
    'upload' => [
        'max_size' => env('EDITOR_MAX_FILE_SIZE', 10240), // 10 MB in KB
        'allowed_mimes' => [
            'jpg',
            'jpeg',
            'png',
            'webp',
            'gif',
            'svg',
            'pdf',
            'doc',
            'docx',
            'xls',
            'xlsx',
            'zip',
            'txt',
            'csv',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Optimization & Resizing
    |--------------------------------------------------------------------------
    |
    | Optional automated server-side image resizing and compression quality.
    |
    */
    'image_resize' => [
        'enabled' => env('EDITOR_IMAGE_RESIZE', false),
        'max_width' => 1920,
        'max_height' => 1080,
    ],

    'image_quality' => env('EDITOR_IMAGE_QUALITY', 85),

    /*
    |--------------------------------------------------------------------------
    | Security: Authentication & Authorization
    |--------------------------------------------------------------------------
    |
    | Configure whether authentication or Laravel policies should guard media
    | creation, retrieval, and deletion.
    |
    */
    'authentication' => [
        'required' => env('EDITOR_AUTH_REQUIRED', false),
        'guard' => env('EDITOR_AUTH_GUARD', null),
    ],

    'authorization' => [
        'enabled' => env('EDITOR_AUTHORIZATION_ENABLED', false),
        'policy' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Content Sanitization
    |--------------------------------------------------------------------------
    |
    | Enable server-side HTML sanitization (detailed in Phase 6).
    |
    */
    'sanitization' => [
        'enabled' => env('EDITOR_SANITIZATION_ENABLED', true),
        'allowed_tags' => [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
            'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'hr', 'br', 'a', 'img',
            'figure', 'figcaption', 'div', 'span', 'table', 'thead', 'tbody',
            'tr', 'th', 'td', 'label', 'input',
        ],
        'allowed_attributes' => [
            '*' => ['class', 'id', 'dir', 'style', 'title'],
            'a' => ['href', 'target', 'rel', 'download'],
            'img' => ['src', 'alt', 'title', 'width', 'height', 'data-alignment', 'data-width', 'data-caption'],
            'figure' => ['class', 'style', 'data-alignment', 'data-width'],
            'div' => ['class', 'style', 'data-type', 'data-url', 'data-name', 'data-size', 'data-file-type'],
            'span' => ['class', 'style', 'data-type', 'data-id', 'data-label', 'data-username', 'data-avatar', 'data-role'],
            'ul' => ['data-type', 'class'],
            'li' => ['data-type', 'data-checked', 'class'],
            'input' => ['type', 'checked', 'disabled'],
            'th' => ['colspan', 'rowspan', 'style'],
            'td' => ['colspan', 'rowspan', 'style'],
        ],
        'allowed_protocols' => [
            'https:', 'http:', 'mailto:', 'tel:',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Database & Content Management (Phase 18 & Phase 19)
    |--------------------------------------------------------------------------
    |
    | Configuration for storing persistent rich-text documents and immutable
    | version snapshots in the database.
    |
    */
    'database' => [
        'enabled' => env('EDITOR_DATABASE_ENABLED', true),
        'table' => env('EDITOR_DOCUMENTS_TABLE', 'editor_documents'),
        'versions_table' => env('EDITOR_DOCUMENT_VERSIONS_TABLE', 'editor_document_versions'),
        'comments_table' => env('EDITOR_DOCUMENT_COMMENTS_TABLE', 'editor_document_comments'),
        'locks_table' => env('EDITOR_DOCUMENT_LOCKS_TABLE', 'editor_document_locks'),
        'per_page' => env('EDITOR_DOCUMENTS_PER_PAGE', 15),
        'default_status' => 'draft',
        'allowed_statuses' => ['draft', 'published', 'archived'],
        'versioning' => [
            'enabled' => env('EDITOR_VERSIONING_ENABLED', true),
            'auto_snapshot_on_save' => env('EDITOR_AUTO_SNAPSHOT_ON_SAVE', true),
            'max_versions_per_document' => env('EDITOR_MAX_VERSIONS', 50),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Collaboration & Document Locking (Phase 20)
    |--------------------------------------------------------------------------
    |
    | Decoupled collaboration settings supporting WebSocket, Laravel Reverb,
    | Pusher, and custom broadcast providers.
    |
    */
    'collaboration' => [
        'enabled' => env('EDITOR_COLLABORATION_ENABLED', true),
        'provider' => env('EDITOR_COLLABORATION_PROVIDER', 'reverb'), // 'websocket', 'reverb', 'pusher', 'custom'
        'channel_prefix' => env('EDITOR_COLLABORATION_CHANNEL_PREFIX', 'editor-document.'),
        'lock_ttl' => env('EDITOR_LOCK_TTL', 300), // Lock TTL in seconds (5 minutes)
        'heartbeat_interval' => env('EDITOR_LOCK_HEARTBEAT_INTERVAL', 60), // Heartbeat interval in seconds
        'max_comment_length' => env('EDITOR_MAX_COMMENT_LENGTH', 5000),
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Assistant Integration (Phase 21)
    |--------------------------------------------------------------------------
    |
    | Optional AI text generation, grammar repair, summarization, and translation
    | supporting Mock, OpenAI, Anthropic, Gemini, or custom proxy providers.
    |
    */
    'ai' => [
        'enabled' => env('EDITOR_AI_ENABLED', true),
        'provider' => env('EDITOR_AI_PROVIDER', 'mock'), // 'mock', 'openai', 'gemini', 'anthropic', 'custom'
        'model' => env('EDITOR_AI_MODEL', 'gpt-4o-mini'),
        'api_key' => env('EDITOR_AI_API_KEY', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Theming Engine & Customization (Phase 22)
    |--------------------------------------------------------------------------
    |
    | Configuration for editor default theme, dark mode, design tokens,
    | and available theme presets.
    |
    */
    'theme' => [
        'default' => env('EDITOR_THEME', 'dark'),
        'presets' => ['dark', 'light', 'sepia', 'cyberpunk', 'minimal', 'high-contrast'],
        'tokens' => [
            'editorToolbarHeight' => '44px',
            'editorRadius' => '8px',
            'editorFontSize' => '15px',
            'editorButtonSize' => '32px',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Mobile & Accessibility Optimizations (Phase 23)
    |--------------------------------------------------------------------------
    |
    | Configuration for WCAG 2.1 AA/AAA compliance, screen reader live region,
    | touch target sizing (min 44px), and mobile viewports.
    |
    */
    'accessibility' => [
        'enabled' => env('EDITOR_ACCESSIBILITY_ENABLED', true),
        'announcer_politeness' => env('EDITOR_ANNOUNCER_POLITENESS', 'polite'),
        'visible_focus_rings' => env('EDITOR_VISIBLE_FOCUS_RINGS', true),
        'keyboard_navigation' => env('EDITOR_KEYBOARD_NAV', true),
        'editor_label' => env('EDITOR_A11Y_LABEL', 'Rich Text Editor content area'),
    ],

    'mobile' => [
        'enabled' => env('EDITOR_MOBILE_ENABLED', true),
        'breakpoints' => [
            'mobile' => 768,
            'tablet' => 1024,
        ],
        'touch_target_min_size' => 44, // WCAG 2.5.5 minimum 44px
        'eliminate_tap_delay' => true,
        'bottom_sheet_on_mobile' => env('EDITOR_BOTTOM_SHEET_ON_MOBILE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Production Performance & Caching (Phase 28)
    |--------------------------------------------------------------------------
    |
    | High-throughput caching for server-side HTML sanitization, HTTP ETags,
    | CDN asset prefixing, and gzip compression.
    |
    */
    'performance' => [
        'cache_sanitized_output' => env('EDITOR_CACHE_SANITIZED', true),
        'cache_ttl_seconds' => env('EDITOR_CACHE_TTL', 3600),
        'cdn_url' => env('EDITOR_CDN_URL', null),
        'etag_enabled' => env('EDITOR_ETAG_ENABLED', true),
        'gzip_compression' => env('EDITOR_GZIP_ENABLED', true),
        'max_payload_kb' => env('EDITOR_MAX_PAYLOAD_KB', 2048),
    ],
];


