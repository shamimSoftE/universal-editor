<?php

namespace UniversalEditor\Laravel\Security;

use DOMDocument;
use DOMElement;
use DOMNode;

class ContentSanitizer
{
    protected array $allowedTags;
    protected array $allowedAttributes;
    protected array $allowedProtocols;
    protected array $allowedIframeDomains;

    public function __construct(array $config = [])
    {
        $defaultTags = [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
            'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'hr', 'br', 'a', 'img',
            'figure', 'figcaption', 'div', 'span', 'table', 'thead', 'tbody',
            'tr', 'th', 'td', 'label', 'input', 'iframe', 'video', 'source',
        ];

        $defaultAttrs = [
            '*' => ['class', 'id', 'dir', 'style', 'title'],
            'a' => ['href', 'target', 'rel', 'download'],
            'img' => ['src', 'alt', 'title', 'width', 'height', 'data-alignment', 'data-width', 'data-caption'],
            'figure' => ['class', 'style', 'data-alignment', 'data-width'],
            'div' => ['class', 'style', 'data-type', 'data-url', 'data-name', 'data-size', 'data-file-type', 'data-language', 'data-provider', 'data-src', 'data-original-url', 'data-title', 'data-alignment'],
            'pre' => ['class', 'data-language'],
            'code' => ['class'],
            'iframe' => ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'class', 'style'],
            'video' => ['src', 'controls', 'autoplay', 'muted', 'loop', 'poster', 'width', 'height', 'class', 'style'],
            'source' => ['src', 'type'],
            'ul' => ['data-type', 'class'],
            'li' => ['data-type', 'data-checked', 'class'],
            'input' => ['type', 'checked', 'disabled'],
            'th' => ['colspan', 'rowspan', 'colwidth', 'style'],
            'td' => ['colspan', 'rowspan', 'colwidth', 'style'],
        ];

        $defaultProtocols = ['https:', 'http:', 'mailto:', 'tel:'];

        $defaultIframeDomains = [
            'youtube.com',
            'www.youtube.com',
            'youtube-nocookie.com',
            'www.youtube-nocookie.com',
            'player.vimeo.com',
            'vimeo.com',
            'www.google.com',
            'maps.google.com',
            'google.com',
        ];

        $configAllowedTags = function_exists('config') ? config('editor.sanitization.allowed_tags', null) : null;
        $configAllowedAttrs = function_exists('config') ? config('editor.sanitization.allowed_attributes', null) : null;
        $configAllowedProtocols = function_exists('config') ? config('editor.sanitization.allowed_protocols', null) : null;
        $configAllowedDomains = function_exists('config') ? config('editor.sanitization.allowed_iframe_domains', null) : null;

        $this->allowedTags = $config['allowed_tags'] ?? $configAllowedTags ?? $defaultTags;
        $this->allowedAttributes = $config['allowed_attributes'] ?? $configAllowedAttrs ?? $defaultAttrs;
        $this->allowedProtocols = $config['allowed_protocols'] ?? $configAllowedProtocols ?? $defaultProtocols;
        $this->allowedIframeDomains = $config['allowed_iframe_domains'] ?? $configAllowedDomains ?? $defaultIframeDomains;
    }

    /**
     * Static helper to clean HTML content
     */
    public static function clean(string $html, array $config = []): string
    {
        $sanitizer = new static($config);
        return $sanitizer->sanitize($html);
    }

    /**
     * Static helper to sanitize SVG content
     */
    public static function cleanSvg(string $svg): string
    {
        if (empty(trim($svg))) {
            return '';
        }

        // 1. Remove script elements
        $cleaned = preg_replace('/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i', '', $svg);
        $cleaned = preg_replace('/<\s*script[^>]*>/i', '', $cleaned);

        // 2. Remove inline event handlers (onload, onclick, onerror, etc.)
        $cleaned = preg_replace('/\s*on\w+\s*=\s*(["\'])[\s\S]*?\1/i', '', $cleaned);
        $cleaned = preg_replace('/\s*on\w+\s*=\s*[^\s>]+/i', '', $cleaned);

        // 3. Remove javascript: and vbscript: URIs
        $cleaned = preg_replace('/href\s*=\s*(["\'])\s*(?:javascript|vbscript):[\s\S]*?\1/i', '', $cleaned);
        $cleaned = preg_replace('/xlink:href\s*=\s*(["\'])\s*(?:javascript|vbscript):[\s\S]*?\1/i', '', $cleaned);

        // 4. Strip foreignObject (frequent SVG XSS vector)
        $cleaned = preg_replace('/<\s*foreignObject[^>]*>[\s\S]*?<\s*\/\s*foreignObject\s*>/i', '', $cleaned);

        // 5. Strip animate, set, and use tags
        $cleaned = preg_replace('/<\s*animate[^>]*>[\s\S]*?<\s*\/\s*animate\s*>/i', '', $cleaned);
        $cleaned = preg_replace('/<\s*animate[^>]*\/?\s*>/i', '', $cleaned);
        $cleaned = preg_replace('/<\s*set[^>]*>/i', '', $cleaned);
        $cleaned = preg_replace('/<\s*use[^>]*>/i', '', $cleaned);

        return trim($cleaned);
    }

    /**
     * Sanitize HTML string
     */
    public function sanitize(string $html): string
    {
        if (empty(trim($html))) {
            return '';
        }

        // 1. Pre-filter dangerous executable / embedding tags
        $html = preg_replace('/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i', '', $html);
        $html = preg_replace('/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/i', '', $html);
        $html = preg_replace('/<\s*embed[^>]*>[\s\S]*?<\s*\/\s*embed\s*>/i', '', $html);
        $html = preg_replace('/<\s*applet[^>]*>[\s\S]*?<\s*\/\s*applet\s*>/i', '', $html);
        $html = preg_replace('/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/i', '', $html);

        // 2. Strip unclosed or evasive script tags
        $html = preg_replace('/<\s*script[^>]*>/i', '', $html);

        // 3. Load into DOMDocument
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);

        // UTF-8 encoding wrapper
        $encodedHtml = '<?xml encoding="utf-8" ?>' . "<div>{$html}</div>";
        $dom->loadHTML($encodedHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $root = $dom->getElementsByTagName('div')->item(0);

        if (!$root) {
            return '';
        }

        $this->cleanNode($root);

        // Extract cleaned inner HTML
        $result = '';
        foreach ($root->childNodes as $child) {
            $result .= $dom->saveHTML($child);
        }

        return trim($result);
    }

    /**
     * Recursively clean a DOM node
     */
    protected function cleanNode(DOMNode $node): void
    {
        $toRemove = [];

        foreach ($node->childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE) {
                /** @var DOMElement $child */
                $tagName = strtolower($child->tagName);

                // Check allowed tags
                if (!in_array($tagName, $this->allowedTags, true)) {
                    $toRemove[] = $child;
                    continue;
                }

                // Check safe iframe source domain
                if ($tagName === 'iframe') {
                    $src = $child->getAttribute('src') ?: '';
                    if (!$this->isSafeIframeSrc($src)) {
                        $toRemove[] = $child;
                        continue;
                    }
                }

                // Check attributes
                $attributesToRemove = [];
                $allowedForTag = array_merge(
                    $this->allowedAttributes['*'] ?? [],
                    $this->allowedAttributes[$tagName] ?? []
                );

                foreach ($child->attributes as $attr) {
                    $attrName = strtolower($attr->name);
                    $attrValue = $attr->value;

                    // Block inline event handlers (on*)
                    if (str_starts_with($attrName, 'on')) {
                        $attributesToRemove[] = $attr->name;
                        continue;
                    }

                    // Check attribute whitelist
                    if (!in_array($attrName, $allowedForTag, true) && !str_starts_with($attrName, 'data-')) {
                        $attributesToRemove[] = $attr->name;
                        continue;
                    }

                    // Check safe URLs on href and src
                    if ($attrName === 'href' || $attrName === 'src') {
                        if (!$this->isSafeUrl($attrValue)) {
                            $attributesToRemove[] = $attr->name;
                            continue;
                        }
                    }

                    // Check inline style
                    if ($attrName === 'style') {
                        $safeStyle = $this->sanitizeStyle($attrValue);
                        if ($safeStyle !== '') {
                            $child->setAttribute('style', $safeStyle);
                        } else {
                            $attributesToRemove[] = $attr->name;
                        }
                    }
                }

                foreach ($attributesToRemove as $name) {
                    $child->removeAttribute($name);
                }

                // Recursively clean children
                $this->cleanNode($child);
            } elseif ($child->nodeType === XML_COMMENT_NODE) {
                $toRemove[] = $child;
            }
        }

        foreach ($toRemove as $child) {
            $node->removeChild($child);
        }
    }

    /**
     * Check if a URL uses a safe protocol
     */
    public function isSafeUrl(string $url): bool
    {
        $cleaned = trim(preg_replace('/[\x00-\x20\s]+/u', '', $url));

        // Normalize entities (including hex and dec numeric character references)
        $decoded = str_ireplace('&colon;', ':', $cleaned);
        $decoded = preg_replace('/&#0*58;?/i', ':', $decoded);
        $decoded = preg_replace('/&#x0*3a;?/i', ':', $decoded);
        $decoded = preg_replace_callback('/&#[xX]0*([0-9a-fA-F]+);?/', fn($m) => chr(hexdec($m[1])), $decoded);
        $decoded = preg_replace_callback('/&#0*([0-9]+);?/', fn($m) => chr((int)$m[1]), $decoded);

        $normalized = preg_replace('/[\x00-\x20\s]+/u', '', $decoded);

        // Reject dangerous schemes
        if (preg_match('/^(javascript|vbscript|data):/i', $normalized)) {
            // Allow safe raster images
            if (preg_match('/^data:image\/(jpeg|png|webp|gif);base64,/i', $normalized)) {
                return true;
            }
            // Allow SVG only if safe and scriptless
            if (preg_match('/^data:image\/svg\+xml;base64,/i', $normalized)) {
                $parts = explode(',', $normalized, 2);
                $rawSvg = isset($parts[1]) ? base64_decode($parts[1]) : '';
                if ($rawSvg && !preg_match('/<script|on\w+\s*=|javascript:|vbscript:|xlink:href|<foreignObject|<animate|<set|<use/i', $rawSvg)) {
                    return true;
                }
            }
            return false;
        }

        // Relative paths and anchor links are safe
        if (str_starts_with($decoded, '/') || str_starts_with($decoded, '#') || str_starts_with($decoded, './')) {
            return true;
        }

        $scheme = parse_url($decoded, PHP_URL_SCHEME);
        if (!$scheme) {
            return true;
        }

        return in_array(strtolower($scheme) . ':', $this->allowedProtocols, true);
    }

    /**
     * Generate Content Security Policy directives for enterprise integration
     */
    public static function generateCSPDirectives(array $options = []): array
    {
        $embedDomains = $options['allowed_embed_domains'] ?? [
            'youtube.com', 'www.youtube.com', 'youtube-nocookie.com',
            'player.vimeo.com', 'vimeo.com', 'www.google.com', 'maps.google.com'
        ];
        $frameSources = array_merge(["'self'"], array_map(fn($d) => "https://{$d}", $embedDomains));
        $scriptSources = ["'self'"];
        if (!empty($options['script_nonces'])) {
            foreach ($options['script_nonces'] as $nonce) {
                $scriptSources[] = "'nonce-{$nonce}'";
            }
        }

        return [
            'default-src' => ["'self'"],
            'script-src' => $scriptSources,
            'style-src' => ["'self'", "'unsafe-inline'"],
            'img-src' => ["'self'", 'data:', 'https:'],
            'frame-src' => $frameSources,
            'connect-src' => ["'self'", 'https:', 'wss:'],
            'font-src' => ["'self'", 'https://fonts.gstatic.com', 'data:'],
            'object-src' => ["'none'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
        ];
    }

    /**
     * Format CSP directives to a standard HTTP header value
     */
    public static function formatCSPHeader(array $directives): string
    {
        $tokens = [];
        foreach ($directives as $key => $values) {
            $tokens[] = $key . ' ' . implode(' ', $values);
        }
        return implode('; ', $tokens);
    }

    /**
     * Validate a CSP header against enterprise security standards
     */
    public static function validateCSPHeader(string $cspHeader): array
    {
        $issues = [];
        $warnings = [];
        $parsed = [];

        if (empty(trim($cspHeader))) {
            return ['valid' => false, 'issues' => ['CSP header is empty'], 'warnings' => [], 'directives' => []];
        }

        $directives = array_filter(array_map('trim', explode(';', $cspHeader)));
        foreach ($directives as $dir) {
            $parts = preg_split('/\s+/', $dir);
            $key = strtolower(array_shift($parts));
            $parsed[$key] = $parts;
        }

        if (!isset($parsed['default-src']) && !isset($parsed['script-src'])) {
            $issues[] = "Missing 'default-src' and 'script-src' directives.";
        }

        $scriptSources = $parsed['script-src'] ?? $parsed['default-src'] ?? [];
        if (in_array("'unsafe-eval'", $scriptSources, true)) {
            $issues[] = "Directive 'script-src' contains 'unsafe-eval'.";
        }
        if (in_array('*', $scriptSources, true)) {
            $issues[] = "Directive 'script-src' contains wildcard '*'.";
        }

        if (!isset($parsed['object-src']) || !in_array("'none'", $parsed['object-src'], true)) {
            $warnings[] = "Missing or insecure 'object-src' directive; should be 'none'.";
        }

        if (!isset($parsed['base-uri'])) {
            $warnings[] = "Missing 'base-uri' directive.";
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'warnings' => $warnings,
            'directives' => $parsed,
        ];
    }

    /**
     * Check if an iframe src belongs to a trusted provider domain
     */
    public function isSafeIframeSrc(string $src): bool
    {
        if (empty(trim($src))) {
            return false;
        }

        $scheme = parse_url($src, PHP_URL_SCHEME);
        if (!in_array(strtolower($scheme ?: ''), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower(parse_url($src, PHP_URL_HOST) ?: '');
        if (empty($host)) {
            return false;
        }

        foreach ($this->allowedIframeDomains as $domain) {
            $domain = strtolower($domain);
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize CSS style attribute
     */
    public function sanitizeStyle(string $style): string
    {
        // Strip expressions, behavior, javascript in url, @import
        if (
            preg_match('/expression\s*\(/i', $style) ||
            preg_match('/behavior\s*:/i', $style) ||
            preg_match('/url\s*\(\s*[\'"]?\s*javascript:/i', $style) ||
            preg_match('/@import/i', $style) ||
            preg_match('/-moz-binding/i', $style)
        ) {
            return '';
        }

        return $style;
    }
}
