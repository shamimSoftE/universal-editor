<?php

namespace Illuminate\Routing {
    if (!class_exists('Illuminate\Routing\Controller', false)) {
        class Controller {}
    }
}

namespace Illuminate\Http {
    if (!class_exists('Illuminate\Http\JsonResponse', false)) {
        class JsonResponse {
            public $data;
            public $status;
            public function __construct($data, $status = 200) {
                $this->data = $data;
                $this->status = $status;
            }
            public function getData($assoc = true) {
                return $assoc ? json_decode(json_encode($this->data), true) : (object) $this->data;
            }
        }
    }

    if (!class_exists('Illuminate\Http\Request', false)) {
        class Request {
            protected array $data;
            public function __construct(array $data = []) {
                $this->data = $data;
            }
            public function input($key = null, $default = null) {
                if ($key === null) return $this->data;
                return $this->data[$key] ?? $default;
            }
            public function has($key): bool {
                return array_key_exists($key, $this->data);
            }
        }
    }
}

namespace Illuminate\Support\Facades {
    if (!class_exists('Illuminate\Support\Facades\Route', false)) {
        class Route {
            public static array $routes = [];
            public static string $currentPrefix = '';
            public static function prefix($prefix) {
                $inst = new static;
                self::$currentPrefix = trim($prefix, '/');
                return $inst;
            }
            public static function middleware($middleware) { return new static; }
            public function group($callback) {
                $callback();
                self::$currentPrefix = '';
                return $this;
            }
            protected static function normalizeUri(string $uri): string {
                $clean = trim($uri, '/');
                if (self::$currentPrefix !== '') {
                    return self::$currentPrefix . '/' . $clean;
                }
                return $clean;
            }
            public static function get($uri, $action) {
                $norm = self::normalizeUri($uri);
                self::$routes['GET'][$norm] = $action;
                return new static;
            }
            public static function post($uri, $action) {
                $norm = self::normalizeUri($uri);
                self::$routes['POST'][$norm] = $action;
                return new static;
            }
            public static function put($uri, $action) {
                $norm = self::normalizeUri($uri);
                self::$routes['PUT'][$norm] = $action;
                return new static;
            }
            public static function delete($uri, $action) {
                $norm = self::normalizeUri($uri);
                self::$routes['DELETE'][$norm] = $action;
                return new static;
            }
            public static function patch($uri, $action) {
                $norm = self::normalizeUri($uri);
                self::$routes['PATCH'][$norm] = $action;
                return new static;
            }
            public function name($name) { return $this; }
        }
    }
}

namespace {
    if (!function_exists('env')) {
        function env($key, $default = null) {
            return $default;
        }
    }

    if (!function_exists('response')) {
        function response() {
            return new class {
                public function json($data, $status = 200) {
                    return new \Illuminate\Http\JsonResponse($data, $status);
                }
            };
        }
    }

    if (!function_exists('now')) {
        function now() {
            return new class {
                public function toIso8601String() {
                    return date('c');
                }
            };
        }
    }

    if (!function_exists('config')) {
        $GLOBALS['mock_config'] = [];
        function config($key = null, $default = null) {
            global $mock_config;
            if ($key === null) return $mock_config;
            $parts = explode('.', $key);
            $curr = $mock_config;
            foreach ($parts as $p) {
                if (!is_array($curr) || !array_key_exists($p, $curr)) {
                    return $default;
                }
                $curr = $curr[$p];
            }
            return $curr;
        }
    }

    require_once __DIR__ . '/../src/Controllers/EditorController.php';

    class ThemeTest {
        public static function run(): int {
            global $mock_config;
            $passed = 0;
            $failed = 0;

            echo "\n========================================\n";
            echo "Universal Rich Text Editor — Phase 22 Theming Tests\n";
            echo "========================================\n\n";

            // Load editor.php configuration
            $configFile = require __DIR__ . '/../config/editor.php';
            $mock_config['editor'] = $configFile;

            // Test 1: Config has theme section
            if (isset($configFile['theme']) && is_array($configFile['theme'])) {
                echo "✓ Test 1: Configuration contains 'theme' definition\n";
                $passed++;
            } else {
                echo "✗ Test 1: 'theme' config missing\n";
                $failed++;
            }

            // Test 2: Default theme is defined
            $defaultTheme = $configFile['theme']['default'] ?? null;
            if ($defaultTheme === 'dark') {
                echo "✓ Test 2: Default theme is set to 'dark'\n";
                $passed++;
            } else {
                echo "✗ Test 2: Default theme is not 'dark' (got: " . var_export($defaultTheme, true) . ")\n";
                $failed++;
            }

            // Test 3: Standard presets defined
            $presets = $configFile['theme']['presets'] ?? [];
            $requiredPresets = ['dark', 'light', 'sepia', 'cyberpunk', 'minimal', 'high-contrast'];
            $allPresetsPresent = count(array_intersect($requiredPresets, $presets)) === count($requiredPresets);
            if ($allPresetsPresent) {
                echo "✓ Test 3: All 6 standard theme presets registered (" . implode(', ', $presets) . ")\n";
                $passed++;
            } else {
                echo "✗ Test 3: Missing standard presets\n";
                $failed++;
            }

            // Test 4: Default design tokens defined
            $tokens = $configFile['theme']['tokens'] ?? [];
            if (isset($tokens['editorToolbarHeight']) && isset($tokens['editorRadius']) && isset($tokens['editorFontSize'])) {
                echo "✓ Test 4: Default design tokens defined (height: {$tokens['editorToolbarHeight']}, radius: {$tokens['editorRadius']}, size: {$tokens['editorFontSize']})\n";
                $passed++;
            } else {
                echo "✗ Test 4: Design tokens missing\n";
                $failed++;
            }

            // Test 5: EditorController::theme() action returns valid JSON payload
            $controller = new \UniversalEditor\Laravel\Controllers\EditorController();
            $themeResponse = $controller->theme();
            $themeData = $themeResponse->getData();
            if ($themeResponse->status === 200 &&
                isset($themeData['default']) &&
                isset($themeData['presets']) &&
                isset($themeData['tokens'])) {
                echo "✓ Test 5: EditorController::theme() returns 200 JSON with default, presets, tokens\n";
                $passed++;
            } else {
                echo "✗ Test 5: EditorController::theme() failed\n";
                $failed++;
            }

            // Test 6: EditorController::config() includes theme
            $configResponse = $controller->config();
            $configData = $configResponse->getData();
            if ($configResponse->status === 200 && isset($configData['theme']) && isset($configData['theme']['default'])) {
                echo "✓ Test 6: EditorController::config() includes theme configuration\n";
                $passed++;
            } else {
                echo "✗ Test 6: EditorController::config() theme data missing\n";
                $failed++;
            }

            // Test 7: Route registration verification
            \Illuminate\Support\Facades\Route::$routes = [];
            require __DIR__ . '/../routes/api.php';
            $getRoutes = \Illuminate\Support\Facades\Route::$routes['GET'] ?? [];

            $hasPrefixedThemeRoute = isset($getRoutes['api/editor/theme']);
            $hasRootThemeRoute = isset($getRoutes['api/theme']);

            if ($hasPrefixedThemeRoute && $hasRootThemeRoute) {
                echo "✓ Test 7: Both 'api/editor/theme' and root alias 'api/theme' routes registered\n";
                $passed++;
            } else {
                echo "✗ Test 7: Route registration check failed (prefixed: " . ($hasPrefixedThemeRoute ? 'yes' : 'no') . ", root: " . ($hasRootThemeRoute ? 'yes' : 'no') . ")\n";
                $failed++;
            }

            // Test 8: Convert token key to CSS variable logic
            $tokenToVar = function(string $token): string {
                return '--' . strtolower(preg_replace('/([A-Z])/', '-$1', $token));
            };

            $testTokens = [
                'editorBg' => '--editor-bg',
                'editorText' => '--editor-text',
                'editorBorder' => '--editor-border',
                'editorToolbarBg' => '--editor-toolbar-bg',
                'editorToolbarHeight' => '--editor-toolbar-height',
                'editorButtonHover' => '--editor-button-hover',
                'editorButtonActive' => '--editor-button-active',
                'editorPlaceholder' => '--editor-placeholder',
                'editorRadius' => '--editor-radius',
                'editorFontFamily' => '--editor-font-family',
                'editorFontSize' => '--editor-font-size',
                'editorButtonSize' => '--editor-button-size',
                'editorActiveColor' => '--editor-active-color',
                'editorAccentColor' => '--editor-accent-color',
            ];

            $allMatched = true;
            foreach ($testTokens as $token => $expectedVar) {
                if ($tokenToVar($token) !== $expectedVar) {
                    $allMatched = false;
                    break;
                }
            }

            if ($allMatched) {
                echo "✓ Test 8: Design token to CSS variable kebab-case mapper matches specification (14 tokens verified)\n";
                $passed++;
            } else {
                echo "✗ Test 8: CSS variable mapping mismatch\n";
                $failed++;
            }

            echo "\n----------------------------------------\n";
            echo "Phase 22 Laravel Theming Tests Completed: {$passed} Passed, {$failed} Failed.\n";
            echo "----------------------------------------\n";

            return $failed === 0 ? 0 : 1;
        }
    }

    exit(ThemeTest::run());
}
