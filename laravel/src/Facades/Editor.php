<?php

namespace UniversalEditor\Laravel\Facades;

use Illuminate\Support\Facades\Facade;
use UniversalEditor\Laravel\Security\ContentSanitizer;

/**
 * Universal Editor Facade
 *
 * Provides a clean and intuitive API for editor utilities,
 * including enterprise-grade content sanitization:
 *
 * Example:
 * $safeHtml = Editor::sanitize($html);
 *
 * @method static string sanitize(string $html, array $config = [])
 * @method static string clean(string $html, array $config = [])
 * @method static string sanitizeSvg(string $svg)
 * @method static bool isSafeUrl(string $url)
 * @method static string sanitizeStyle(string $style)
 *
 * @see \UniversalEditor\Laravel\Security\ContentSanitizer
 */
class Editor extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return 'universal-editor';
    }

    /**
     * Direct static fallback if accessed outside the Laravel service container
     */
    public static function sanitize(string $html, array $config = []): string
    {
        return ContentSanitizer::clean($html, $config);
    }

    /**
     * Direct static fallback for SVG sanitization
     */
    public static function sanitizeSvg(string $svg): string
    {
        return ContentSanitizer::cleanSvg($svg);
    }

    /**
     * Direct static fallback for URL validation
     */
    public static function isSafeUrl(string $url): bool
    {
        $sanitizer = new ContentSanitizer();
        return $sanitizer->isSafeUrl($url);
    }
}
