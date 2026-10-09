<?php

namespace {
    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed {
            return $_ENV[$key] ?? $default;
        }
    }
}

namespace Illuminate\Support\Facades {
    if (!class_exists('Illuminate\Support\Facades\Facade')) {
        abstract class Facade {
            protected static function getFacadeAccessor() {
                return '';
            }
        }
    }
}

namespace UniversalEditor\Laravel\Tests {

    require_once __DIR__ . '/../src/Security/ContentSanitizer.php';
    require_once __DIR__ . '/../src/Facades/Editor.php';

    use UniversalEditor\Laravel\Security\ContentSanitizer;
    use UniversalEditor\Laravel\Facades\Editor;

    class SecurityTest
    {
        public static function run(): int
        {
            $passed = 0;
            $failed = 0;

            echo "Running Phase 6: Laravel Security & Sanitization Verification...\n\n";

            // Test 1: $safeHtml = Editor::sanitize($html) syntax from prompt
            $raw1 = '<p>Normal text</p><script>alert("XSS")</script>';
            $clean1 = Editor::sanitize($raw1);
            if (!str_contains($clean1, '<script>') && !str_contains($clean1, 'alert') && str_contains($clean1, '<p>Normal text</p>')) {
                echo "✓ Test 1: Editor::sanitize(\$html) successfully cleans script tags\n";
                $passed++;
            } else {
                echo "✗ Test 1: Editor::sanitize failed: {$clean1}\n";
                $failed++;
            }

            // Test 2: Inline event handlers (onerror, onclick, onload)
            $raw2 = '<img src="missing.jpg" onerror="alert(document.domain)"><a href="#" onclick="hack()">Link</a>';
            $clean2 = ContentSanitizer::clean($raw2);
            if (!str_contains($clean2, 'onerror') && !str_contains($clean2, 'onclick') && !str_contains($clean2, 'hack') && str_contains($clean2, '<img')) {
                echo "✓ Test 2: Inline event handler attributes (onerror, onclick) removed\n";
                $passed++;
            } else {
                echo "✗ Test 2: Event handlers not removed: {$clean2}\n";
                $failed++;
            }

            // Test 3: Javascript pseudo-protocols in href and src
            $raw3 = '<a href="javascript:alert(1)">Click Me</a><a href="vbscript:msgbox(1)">VB</a>';
            $clean3 = Editor::sanitize($raw3);
            if (!str_contains($clean3, 'javascript:') && !str_contains($clean3, 'vbscript:') && str_contains($clean3, 'Click Me')) {
                echo "✓ Test 3: Dangerous URI schemes (javascript:, vbscript:) neutralized\n";
                $passed++;
            } else {
                echo "✗ Test 3: Dangerous URIs not stripped: {$clean3}\n";
                $failed++;
            }

            // Test 4: Iframe and Object injections
            $raw4 = '<p>Intro</p><iframe src="https://evil.com/leak"></iframe><object data="bad.swf"></object><p>Outro</p>';
            $clean4 = ContentSanitizer::clean($raw4);
            if (!str_contains($clean4, '<iframe') && !str_contains($clean4, '<object') && str_contains($clean4, 'Intro') && str_contains($clean4, 'Outro')) {
                echo "✓ Test 4: Dangerous embedding elements (<iframe, <object) purged\n";
                $passed++;
            } else {
                echo "✗ Test 4: Embedding elements remained: {$clean4}\n";
                $failed++;
            }

            // Test 5: CSS expression & behavior attacks
            $raw5 = '<p style="color:red; width: expression(alert(1));">Text</p>';
            $clean5 = ContentSanitizer::clean($raw5);
            if (!str_contains($clean5, 'expression') && !str_contains($clean5, 'alert')) {
                echo "✓ Test 5: Dangerous CSS expression injections neutralized\n";
                $passed++;
            } else {
                echo "✗ Test 5: CSS expression not removed: {$clean5}\n";
                $failed++;
            }

            // Test 6: SVG Sanitization (ContentSanitizer::cleanSvg & Editor::sanitizeSvg)
            $rawSvg = '<svg onload="alert(\'xss\')"><script>alert(1)</script><circle cx="5" cy="5" r="5"/></svg>';
            $cleanSvg = Editor::sanitizeSvg($rawSvg);
            if (!str_contains($cleanSvg, 'onload') && !str_contains($cleanSvg, '<script>') && str_contains($cleanSvg, '<circle')) {
                echo "✓ Test 6: Editor::sanitizeSvg removes onload and script elements\n";
                $passed++;
            } else {
                echo "✗ Test 6: SVG sanitization failed: {$cleanSvg}\n";
                $failed++;
            }

            // Test 7: Preserves safe formatting (headings, lists, bold, safe links, tables)
            $safeInput = '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul><a href="https://laravel.com" target="_blank">Laravel</a>';
            $safeOutput = Editor::sanitize($safeInput);
            if (
                str_contains($safeOutput, '<h1>Title</h1>') &&
                str_contains($safeOutput, '<strong>bold</strong>') &&
                str_contains($safeOutput, '<ul>') &&
                str_contains($safeOutput, 'https://laravel.com')
            ) {
                echo "✓ Test 7: Legitimate rich-text formatting and safe URLs properly preserved\n";
                $passed++;
            } else {
                echo "✗ Test 7: Valid formatting was unexpectedly altered: {$safeOutput}\n";
                $failed++;
            }

            // Test 8: Custom tag configuration override
            $customSanitizer = new ContentSanitizer([
                'allowed_tags' => ['p', 'strong'],
            ]);
            $customInput = '<p>Keep</p><h2>Drop</h2><strong>Keep bold</strong>';
            $customOutput = $customSanitizer->sanitize($customInput);
            if (str_contains($customOutput, '<p>Keep</p>') && str_contains($customOutput, '<strong>Keep bold</strong>') && !str_contains($customOutput, '<h2>')) {
                echo "✓ Test 8: Custom allowed_tags configuration override verified\n";
                $passed++;
            } else {
                echo "✗ Test 8: Custom tags override failed: {$customOutput}\n";
                $failed++;
            }

            // Test 9: isSafeUrl validation
            $safeUrlValid = Editor::isSafeUrl('https://example.com') &&
                            Editor::isSafeUrl('mailto:user@test.com') &&
                            !Editor::isSafeUrl('javascript:alert(1)') &&
                            !Editor::isSafeUrl('vbscript:run()');
            if ($safeUrlValid) {
                echo "✓ Test 9: URL protocol whitelist validator (Editor::isSafeUrl) verified\n";
                $passed++;
            } else {
                echo "✗ Test 9: URL validation failed\n";
                $failed++;
            }

            // Test 10: Phase 10 Trusted Media Embeds preserved
            $embedHtml = '<div data-type="embed"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="100%" height="420px" frameborder="0" allowfullscreen="true"></iframe></div><video controls="" src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"></video>';
            $cleanEmbed = Editor::sanitize($embedHtml);
            if (
                str_contains($cleanEmbed, 'youtube-nocookie.com/embed/dQw4w9WgXcQ') &&
                str_contains($cleanEmbed, '<video') &&
                str_contains($cleanEmbed, 'BigBuckBunny.mp4')
            ) {
                echo "✓ Test 10: Phase 10 trusted media embeds (YouTube iframe & HTML5 video) preserved\n";
                $passed++;
            } else {
                echo "✗ Test 10: Trusted media embed was stripped: {$cleanEmbed}\n";
                $failed++;
            }

            // Test 11: Untrusted iframe blocked while trusted Vimeo iframe is allowed
            $mixedIframe = '<iframe src="https://player.vimeo.com/video/76979871"></iframe><iframe src="https://malicious-site.xyz/steal"></iframe>';
            $cleanMixed = Editor::sanitize($mixedIframe);
            if (str_contains($cleanMixed, 'player.vimeo.com/video/76979871') && !str_contains($cleanMixed, 'malicious-site.xyz')) {
                echo "✓ Test 11: Untrusted iframe blocked while trusted Vimeo iframe is preserved\n";
                $passed++;
            } else {
                echo "✗ Test 11: Untrusted iframe was not filtered: {$cleanMixed}\n";
                $failed++;
            }

            echo "\nSecurity Suite Summary: {$passed} passed, {$failed} failed.\n";
            return $failed === 0 ? 0 : 1;
        }
    }

    exit(SecurityTest::run());
}
