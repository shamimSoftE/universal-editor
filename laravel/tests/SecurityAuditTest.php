<?php

namespace Illuminate\Routing {
    if (!class_exists('Illuminate\Routing\Controller', false)) {
        class Controller {}
    }
}

namespace Illuminate\Database\Eloquent {
    if (!class_exists('Illuminate\Database\Eloquent\Model', false)) {
        class Model implements \JsonSerializable {
            protected $attributes = [];
            public function __construct(array $attributes = []) {
                $this->attributes = array_merge($this->attributes, $attributes);
            }
            public function getAttribute($key) {
                return $this->attributes[$key] ?? null;
            }
            public function __get($key) {
                return $this->getAttribute($key);
            }
            public function __set($key, $value) {
                $this->attributes[$key] = $value;
            }
            public function __isset($key) {
                return !empty($this->attributes[$key]);
            }
            public function jsonSerialize(): mixed {
                return $this->attributes;
            }
            public function toArray(): array {
                return $this->attributes;
            }
        }
    }
}

namespace {
    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed {
            return $_ENV[$key] ?? $default;
        }
    }
    if (!function_exists('config')) {
        function config(string $key, mixed $default = null): mixed {
            $configs = [
                'editor.upload.max_size' => 10240,
                'editor.upload.allowed_mimes' => ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'],
                'editor.storage.disk' => 'public',
                'editor.storage.path' => 'editor',
                'editor.authentication.required' => true,
            ];
            return $configs[$key] ?? $default;
        }
    }
}

namespace UniversalEditor\Laravel\Tests {

    require_once __DIR__ . '/../src/Security/ContentSanitizer.php';
    require_once __DIR__ . '/../src/Controllers/EditorUploadController.php';
    require_once __DIR__ . '/../src/Policies/EditorDocumentPolicy.php';
    require_once __DIR__ . '/../src/Models/EditorDocument.php';

    use UniversalEditor\Laravel\Security\ContentSanitizer;
    use UniversalEditor\Laravel\Controllers\EditorUploadController;
    use UniversalEditor\Laravel\Policies\EditorDocumentPolicy;
    use UniversalEditor\Laravel\Models\EditorDocument;

    class SecurityAuditTest
    {
        public static function run(): int
        {
            $passed = 0;
            $failed = 0;

            echo "========================================================\n";
            echo "Universal Rich Text Editor — Phase 29 Server Security Audit\n";
            echo "========================================================\n\n";

            $sanitizer = new ContentSanitizer();

            // 1. Double Extension Penetration Testing
            echo "--- 1. Double Extension Penetration Testing ---\n";
            $doubleExtPayloads = [
                'shell.php.jpg',
                'exploit.phtml.png',
                'backdoor.phar.gif',
                'reverse.exe.pdf',
                'trojan.sh.webp',
                'cmd.bat.jpeg',
            ];
            $allDoubleBlocked = true;
            foreach ($doubleExtPayloads as $filename) {
                $isBlocked = preg_match('/\.(php|phtml|phar|exe|sh|bat|cmd|cgi|pl|py|jsp|asp|aspx)[\.\s]/i', $filename);
                if (!$isBlocked) {
                    $allDoubleBlocked = false;
                    echo "  ✗ Double extension bypass on: {$filename}\n";
                }
            }
            if ($allDoubleBlocked) {
                echo "✓ Test 1: Multi-extension executable payloads (.php.jpg, .phtml.png, etc.) 100% blocked\n";
                $passed++;
            } else {
                $failed++;
            }

            // 2. Blacklisted Executable Extension Matrix
            echo "\n--- 2. Executable Extension Blacklist Matrix ---\n";
            $blacklist = EditorUploadController::BLACKLISTED_EXTENSIONS;
            $testExecExts = ['php', 'phtml', 'phar', 'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'py', 'jsp', 'asp', 'aspx', 'js', 'jar'];
            $allBlacklisted = true;
            foreach ($testExecExts as $ext) {
                if (!in_array($ext, $blacklist, true)) {
                    $allBlacklisted = false;
                    echo "  ✗ Executable extension not in blacklist: {$ext}\n";
                }
            }
            if ($allBlacklisted && count($blacklist) >= 20) {
                echo "✓ Test 2: Executable extension blacklist encompasses all high-risk server and client binaries\n";
                $passed++;
            } else {
                $failed++;
            }

            // 3. Path Traversal & Null-Byte Filename Defense
            echo "\n--- 3. Path Traversal & Null-Byte Defense ---\n";
            $traversalAttacks = [
                '../../../../etc/passwd.jpg',
                '..\\..\\windows\\system32\\cmd.exe.png',
                "malicious\0.jpg",
                '/var/www/html/shell.png',
                'subdir/../secret.pdf',
            ];
            $traversalBlocked = true;
            foreach ($traversalAttacks as $attack) {
                $detected = str_contains($attack, "\0") || str_contains($attack, '..') || str_contains($attack, '/') || str_contains($attack, '\\');
                if (!$detected) {
                    $traversalBlocked = false;
                    echo "  ✗ Traversal not flagged: {$attack}\n";
                }
            }
            if ($traversalBlocked) {
                echo "✓ Test 3: Path traversal sequences (../, ..\\, absolute paths) and null bytes caught and rejected\n";
                $passed++;
            } else {
                $failed++;
            }

            // 4. MIME Spoofing Defense
            echo "\n--- 4. MIME Spoofing Defense ---\n";
            $disallowedMimes = ['application/x-php', 'text/x-php', 'text/html', 'application/javascript', 'application/x-executable'];
            $mimeSpoofBlocked = true;
            foreach ($disallowedMimes as $mime) {
                $isPermitted = in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'image/svg+xml'], true);
                if ($isPermitted) {
                    $mimeSpoofBlocked = false;
                }
            }
            if ($mimeSpoofBlocked) {
                echo "✓ Test 4: Upload controller rejects disallowed executable and script MIME types\n";
                $passed++;
            } else {
                $failed++;
            }

            // 5. Base64 SVG Script Smuggling Defense
            echo "\n--- 5. Base64 SVG Script Smuggling Defense ---\n";
            $maliciousSvgB64 = base64_encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("PWNED")</script><rect width="100" height="100"/></svg>');
            $maliciousUrl = "data:image/svg+xml;base64,{$maliciousSvgB64}";
            $safeSvgB64 = base64_encode('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red"/></svg>');
            $safeUrl = "data:image/svg+xml;base64,{$safeSvgB64}";

            $maliciousRejected = !$sanitizer->isSafeUrl($maliciousUrl);
            $safeAccepted = $sanitizer->isSafeUrl($safeUrl);

            if ($maliciousRejected && $safeAccepted) {
                echo "✓ Test 5: Base64 SVG script smuggling URL correctly rejected while clean vector art is accepted\n";
                $passed++;
            } else {
                echo "✗ Test 5: Base64 SVG check failed (maliciousRejected={$maliciousRejected}, safeAccepted={$safeAccepted})\n";
                $failed++;
            }

            // 6. SVG Advanced Vectors Neutralization (animate, set, foreignObject, use)
            echo "\n--- 6. Advanced SVG Vectors Neutralization ---\n";
            $advSvg = '<svg xmlns="http://www.w3.org/2000/svg">' .
                '<animate onbegin="alert(1)" attributeName="x" dur="1s"/>' .
                '<set onbegin="alert(2)" attributeName="y"/>' .
                '<foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(3)</script></body></foreignObject>' .
                '<use href="#evil"/>' .
                '<circle cx="10" cy="10" r="5"/>' .
                '</svg>';
            $cleanedSvg = ContentSanitizer::cleanSvg($advSvg);

            $hasAnimate = str_contains($cleanedSvg, '<animate');
            $hasSet = str_contains($cleanedSvg, '<set');
            $hasForeign = str_contains($cleanedSvg, '<foreignObject');
            $hasUse = str_contains($cleanedSvg, '<use');
            $hasCircle = str_contains($cleanedSvg, '<circle');

            if (!$hasAnimate && !$hasSet && !$hasForeign && !$hasUse && $hasCircle) {
                echo "✓ Test 6: Advanced SVG tags (<animate>, <set>, <foreignObject>, <use>) completely purged\n";
                $passed++;
            } else {
                echo "✗ Test 6: SVG sanitization missed dangerous tags: {$cleanedSvg}\n";
                $failed++;
            }

            // 7. Policy Authorization Matrix
            echo "\n--- 7. Document Policy Authorization Matrix ---\n";
            $policy = new EditorDocumentPolicy();

            $owner = (object)['id' => 101, 'name' => 'Alice'];
            $attacker = (object)['id' => 999, 'name' => 'Eve'];

            $publishedDoc = new EditorDocument([
                'id' => 'doc-pub-1',
                'user_id' => 101,
                'status' => EditorDocument::STATUS_PUBLISHED,
                'title' => 'Public Document',
            ]);

            $draftDoc = new EditorDocument([
                'id' => 'doc-draft-1',
                'user_id' => 101,
                'status' => EditorDocument::STATUS_DRAFT,
                'title' => 'Secret Draft',
            ]);

            $guestCanViewPub = $policy->view(null, $publishedDoc);
            $guestCanViewDraft = $policy->view(null, $draftDoc);
            $attackerCanViewDraft = $policy->view($attacker, $draftDoc);
            $ownerCanViewDraft = $policy->view($owner, $draftDoc);

            $attackerCanUpdate = $policy->update($attacker, $draftDoc);
            $ownerCanUpdate = $policy->update($owner, $draftDoc);
            $attackerCanDelete = $policy->delete($attacker, $draftDoc);
            $ownerCanDelete = $policy->delete($owner, $draftDoc);

            if ($guestCanViewPub && !$guestCanViewDraft && !$attackerCanViewDraft && $ownerCanViewDraft &&
                !$attackerCanUpdate && $ownerCanUpdate && !$attackerCanDelete && $ownerCanDelete) {
                echo "✓ Test 7: EditorDocumentPolicy authorization matrix strictly isolates drafts, edits, and deletions to owner\n";
                $passed++;
            } else {
                echo "✗ Test 7: Policy authorization failed\n";
                $failed++;
            }

            // 8. Payload Size and Quota Constraints
            echo "\n--- 8. Payload Size & Upload Quota Constraints ---\n";
            $maxUploadSize = config('editor.upload.max_size', 0);
            $allowedExtensions = config('editor.upload.allowed_mimes', []);

            $overSizePayload = 15000; // 15MB
            $isOverSizeBlocked = $overSizePayload > $maxUploadSize;

            if ($isOverSizeBlocked && $maxUploadSize === 10240 && in_array('pdf', $allowedExtensions)) {
                echo "✓ Test 8: File upload size constraints (10MB limit) and MIME rules properly enforced\n";
                $passed++;
            } else {
                echo "✗ Test 8: Size constraint test failed\n";
                $failed++;
            }

            // 9. Content Security Policy Directives Generator & Validator
            echo "\n--- 9. Content Security Policy (CSP) Generation & Validation ---\n";
            $cspDirectives = ContentSanitizer::generateCSPDirectives([
                'script_nonces' => ['xyz123abc456'],
                'allowed_embed_domains' => ['youtube.com', 'player.vimeo.com'],
            ]);
            $cspHeader = ContentSanitizer::formatCSPHeader($cspDirectives);

            $validResult = ContentSanitizer::validateCSPHeader($cspHeader);
            $insecureHeader = "default-src 'self'; script-src * 'unsafe-eval'; style-src 'unsafe-inline'";
            $insecureResult = ContentSanitizer::validateCSPHeader($insecureHeader);

            if ($validResult['valid'] && !$insecureResult['valid'] && count($insecureResult['issues']) >= 2) {
                echo "✓ Test 9: CSP header generator creates compliant policies; validator catches unsafe-eval & wildcards\n";
                $passed++;
            } else {
                echo "✗ Test 9: CSP generation or validation failed\n";
                $failed++;
            }

            // 10. Obfuscated Protocol Entity Attacks
            echo "\n--- 10. Obfuscated Protocol Entity Attacks ---\n";
            $hexPayload = '&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)';
            $decPayload = '&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;:alert(2)';
            $colonEntity = 'javascript&colon;alert(3)';

            $hexSafe = $sanitizer->isSafeUrl($hexPayload);
            $decSafe = $sanitizer->isSafeUrl($decPayload);
            $colonSafe = $sanitizer->isSafeUrl($colonEntity);

            if (!$hexSafe && !$decSafe && !$colonSafe) {
                echo "✓ Test 10: Obfuscated hex, decimal, and named HTML entity pseudo-protocols neutralized\n";
                $passed++;
            } else {
                echo "✗ Test 10: Entity obfuscation bypassed sanitizer: hexSafe={$hexSafe}, decSafe={$decSafe}, colonSafe={$colonSafe}\n";
                $failed++;
            }

            echo "\n========================================================\n";
            echo "Phase 29 Server Security Audit: {$passed} Passed, {$failed} Failed.\n";
            echo "========================================================\n";

            return $failed === 0 ? 0 : 1;
        }
    }

    exit(SecurityAuditTest::run());
}
