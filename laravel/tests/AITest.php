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
                return '/' . $clean;
            }
            public static function get($uri, $action) { self::$routes['GET:' . self::normalizeUri($uri)] = $action; return new static; }
            public static function post($uri, $action) { self::$routes['POST:' . self::normalizeUri($uri)] = $action; return new static; }
            public static function put($uri, $action) { self::$routes['PUT:' . self::normalizeUri($uri)] = $action; return new static; }
            public static function patch($uri, $action) { self::$routes['PATCH:' . self::normalizeUri($uri)] = $action; return new static; }
            public static function delete($uri, $action) { self::$routes['DELETE:' . self::normalizeUri($uri)] = $action; return new static; }
            public function name($name) { return $this; }
        }
    }
}

namespace {
    if (!function_exists('config')) {
        function config($key = null, $default = null) {
            $configs = [
                'editor.route.prefix' => 'api/editor',
                'editor.route.middleware' => ['api'],
                'editor.ai.provider' => 'mock',
                'editor.ai.model' => 'gpt-4o',
                'editor.ai.max_tokens' => 2048,
            ];
            return $configs[$key] ?? $default;
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
}

namespace UniversalEditor\Laravel\Tests {

    require_once __DIR__ . '/../src/Controllers/EditorAIController.php';

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;
    use UniversalEditor\Laravel\Controllers\EditorAIController;

    class AITest
    {
        public static function run(): int
        {
            $passed = 0;
            $failed = 0;

            echo "Running Phase 21: Laravel AI Assistant Integration Verification Suite...\n\n";

            $controller = new EditorAIController();

            // Test 1: Routes registration
            Route::$routes = [];
            require __DIR__ . '/../routes/api.php';

            if (isset(Route::$routes['POST:api/editor/ai/generate']) &&
                isset(Route::$routes['POST:/api/ai/generate'])) {
                echo "✓ Test 1: AI generation endpoints registered in routes/api.php\n";
                $passed++;
            } else {
                echo "✗ Test 1: Route registration missing for AI endpoints\n";
                $failed++;
            }

            // Test 2: Validation - Empty text for standard actions returns 422
            $reqEmpty = new Request(['action' => 'improve', 'text' => '']);
            $resEmpty = $controller->generate($reqEmpty);
            $dataEmpty = $resEmpty->getData();
            if ($resEmpty->status === 422 && $dataEmpty['success'] === false) {
                echo "✓ Test 2: Empty text rejected with 422 Unprocessable Entity\n";
                $passed++;
            } else {
                echo "✗ Test 2: Empty text was not rejected with 422\n";
                $failed++;
            }

            // Test 3: Validation - Unsupported action returns 400
            $reqInvalid = new Request(['action' => 'unknown_ai_op', 'text' => 'Sample text']);
            $resInvalid = $controller->generate($reqInvalid);
            $dataInvalid = $resInvalid->getData();
            if ($resInvalid->status === 400 && $dataInvalid['success'] === false && str_contains($dataInvalid['message'], 'Unsupported AI action')) {
                echo "✓ Test 3: Unsupported AI action rejected with 400 Bad Request\n";
                $passed++;
            } else {
                echo "✗ Test 3: Unsupported action was not rejected with 400\n";
                $failed++;
            }

            // Test 4: Action 'improve'
            $reqImprove = new Request([
                'action' => 'improve',
                'text' => 'in order to make better documentation due to the fact that we have a lot of users'
            ]);
            $resImprove = $controller->generate($reqImprove);
            $dataImprove = $resImprove->getData();
            if ($resImprove->status === 200 &&
                $dataImprove['success'] === true &&
                $dataImprove['action'] === 'improve' &&
                str_contains($dataImprove['result'], 'Enhanced:') &&
                str_contains($dataImprove['result'], 'because') &&
                str_contains($dataImprove['result'], 'numerous')) {
                echo "✓ Test 4: Action 'improve' successfully elevates text phrasing\n";
                $passed++;
            } else {
                echo "✗ Test 4: Action 'improve' failed: " . json_encode($dataImprove) . "\n";
                $failed++;
            }

            // Test 5: Action 'grammar'
            $reqGrammar = new Request([
                'action' => 'grammar',
                'text' => 'teh client will recieve teh seperate package untill tomorrow'
            ]);
            $resGrammar = $controller->generate($reqGrammar);
            $dataGrammar = $resGrammar->getData();
            if ($resGrammar->status === 200 &&
                $dataGrammar['success'] === true &&
                str_contains($dataGrammar['result'], 'The client will receive the separate package until tomorrow.')) {
                echo "✓ Test 5: Action 'grammar' successfully corrects typos and punctuation\n";
                $passed++;
            } else {
                echo "✗ Test 5: Action 'grammar' failed: " . json_encode($dataGrammar) . "\n";
                $failed++;
            }

            // Test 6: Action 'rewrite' - Professional tone
            $reqRewriteProf = new Request([
                'action' => 'rewrite',
                'text' => 'the system delivers updates reliably',
                'options' => ['tone' => 'professional']
            ]);
            $resRewriteProf = $controller->generate($reqRewriteProf);
            $dataRewriteProf = $resRewriteProf->getData();
            if ($resRewriteProf->status === 200 &&
                str_contains($dataRewriteProf['result'], 'From an operational perspective') &&
                str_contains($dataRewriteProf['result'], 'optimizing organizational efficiency')) {
                echo "✓ Test 6: Action 'rewrite' (professional tone) applies corporate polish\n";
                $passed++;
            } else {
                echo "✗ Test 6: Action 'rewrite' professional failed\n";
                $failed++;
            }

            // Test 7: Action 'rewrite' - Casual tone
            $reqRewriteCas = new Request([
                'action' => 'rewrite',
                'text' => 'the system delivers updates reliably',
                'options' => ['tone' => 'casual']
            ]);
            $resRewriteCas = $controller->generate($reqRewriteCas);
            $dataRewriteCas = $resRewriteCas->getData();
            if ($resRewriteCas->status === 200 &&
                str_contains($dataRewriteCas['result'], 'Hey! Basically') &&
                str_contains($dataRewriteCas['result'], 'works like a charm!')) {
                echo "✓ Test 7: Action 'rewrite' (casual tone) applies friendly conversational style\n";
                $passed++;
            } else {
                echo "✗ Test 7: Action 'rewrite' casual failed\n";
                $failed++;
            }

            // Test 8: Action 'rewrite' - Concise tone
            $reqRewriteConc = new Request([
                'action' => 'rewrite',
                'text' => 'one two three four five six seven eight nine ten eleven twelve',
                'options' => ['tone' => 'concise']
            ]);
            $resRewriteConc = $controller->generate($reqRewriteConc);
            $dataRewriteConc = $resRewriteConc->getData();
            if ($resRewriteConc->status === 200 &&
                $dataRewriteConc['result'] === 'one two three four five six seven eight.') {
                echo "✓ Test 8: Action 'rewrite' (concise tone) truncates to concise length\n";
                $passed++;
            } else {
                echo "✗ Test 8: Action 'rewrite' concise failed: " . json_encode($dataRewriteConc) . "\n";
                $failed++;
            }

            // Test 9: Action 'shorter'
            $reqShorter = new Request([
                'action' => 'shorter',
                'text' => 'Universal Editor delivers powerful modular architecture for modern web applications across Vue and React'
            ]);
            $resShorter = $controller->generate($reqShorter);
            $dataShorter = $resShorter->getData();
            if ($resShorter->status === 200 &&
                strlen($dataShorter['result']) < strlen($reqShorter->input('text')) &&
                str_ends_with($dataShorter['result'], '.')) {
                echo "✓ Test 9: Action 'shorter' shortens input content\n";
                $passed++;
            } else {
                echo "✗ Test 9: Action 'shorter' failed\n";
                $failed++;
            }

            // Test 10: Action 'longer'
            $reqLonger = new Request([
                'action' => 'longer',
                'text' => 'The editor supports markdown and WYSIWYG modes'
            ]);
            $resLonger = $controller->generate($reqLonger);
            $dataLonger = $resLonger->getData();
            if ($resLonger->status === 200 &&
                strlen($dataLonger['result']) > strlen($reqLonger->input('text')) &&
                str_contains($dataLonger['result'], 'sustained modular extensibility')) {
                echo "✓ Test 10: Action 'longer' expands context with enterprise detail\n";
                $passed++;
            } else {
                echo "✗ Test 10: Action 'longer' failed\n";
                $failed++;
            }

            // Test 11: Action 'summarize'
            $reqSum = new Request([
                'action' => 'summarize',
                'text' => 'Universal Editor features 30 development phases spanning core rich text and cloud collaboration'
            ]);
            $resSum = $controller->generate($reqSum);
            $dataSum = $resSum->getData();
            if ($resSum->status === 200 &&
                str_contains($dataSum['result'], 'Key Summary Takeaways:') &&
                str_contains($dataSum['result'], '• Core principle:')) {
                echo "✓ Test 11: Action 'summarize' creates structured takeaway points\n";
                $passed++;
            } else {
                echo "✗ Test 11: Action 'summarize' failed\n";
                $failed++;
            }

            // Test 12: Action 'translate' - Spanish
            $reqTransEs = new Request([
                'action' => 'translate',
                'text' => 'Welcome to the editor',
                'options' => ['targetLanguage' => 'spanish']
            ]);
            $resTransEs = $controller->generate($reqTransEs);
            $dataTransEs = $resTransEs->getData();
            if ($resTransEs->status === 200 &&
                str_contains($dataTransEs['result'], '[Translated to Spanish]: Welcome to the editor')) {
                echo "✓ Test 12: Action 'translate' (Spanish) produces targeted translation header\n";
                $passed++;
            } else {
                echo "✗ Test 12: Action 'translate' Spanish failed\n";
                $failed++;
            }

            // Test 13: Action 'translate' - Bengali
            $reqTransBn = new Request([
                'action' => 'translate',
                'text' => 'Rich text experience',
                'options' => ['targetLanguage' => 'bengali']
            ]);
            $resTransBn = $controller->generate($reqTransBn);
            $dataTransBn = $resTransBn->getData();
            if ($resTransBn->status === 200 &&
                str_contains($dataTransBn['result'], '[বাংলা অনুবাদ]')) {
                echo "✓ Test 13: Action 'translate' (Bengali) produces localized Bangla translation\n";
                $passed++;
            } else {
                echo "✗ Test 13: Action 'translate' Bengali failed\n";
                $failed++;
            }

            // Test 14: Action 'translate' - Arabic
            $reqTransAr = new Request([
                'action' => 'translate',
                'text' => 'Collaborative editing',
                'options' => ['targetLanguage' => 'arabic']
            ]);
            $resTransAr = $controller->generate($reqTransAr);
            $dataTransAr = $resTransAr->getData();
            if ($resTransAr->status === 200 &&
                str_contains($dataTransAr['result'], '[الترجمة العربية]')) {
                echo "✓ Test 14: Action 'translate' (Arabic) produces localized Arabic translation\n";
                $passed++;
            } else {
                echo "✗ Test 14: Action 'translate' Arabic failed\n";
                $failed++;
            }

            // Test 15: Action 'title'
            $reqTitle = new Request([
                'action' => 'title',
                'text' => 'rich text engine for modern responsive content authoring'
            ]);
            $resTitle = $controller->generate($reqTitle);
            $dataTitle = $resTitle->getData();
            if ($resTitle->status === 200 &&
                str_contains($dataTitle['result'], 'Rich Text Engine For: Strategic Overview')) {
                echo "✓ Test 15: Action 'title' generates capitalized title\n";
                $passed++;
            } else {
                echo "✗ Test 15: Action 'title' failed: " . json_encode($dataTitle) . "\n";
                $failed++;
            }

            // Test 16: Action 'description'
            $reqDesc = new Request([
                'action' => 'description',
                'text' => 'Building enterprise applications with high reliability'
            ]);
            $resDesc = $controller->generate($reqDesc);
            $dataDesc = $resDesc->getData();
            if ($resDesc->status === 200 &&
                str_contains($dataDesc['result'], 'An authoritative guide to') &&
                str_contains($dataDesc['result'], 'Designed for enterprise scalability.')) {
                echo "✓ Test 16: Action 'description' generates SEO/meta summary\n";
                $passed++;
            } else {
                echo "✗ Test 16: Action 'description' failed\n";
                $failed++;
            }

            // Test 17: Action 'custom' with prompt instruction
            $reqCustom = new Request([
                'action' => 'custom',
                'text' => 'bullet list of features',
                'options' => ['instruction' => 'Convert into markdown checklist']
            ]);
            $resCustom = $controller->generate($reqCustom);
            $dataCustom = $resCustom->getData();
            if ($resCustom->status === 200 &&
                str_contains($dataCustom['result'], '[AI Result (Convert into markdown checklist)]: bullet list of features')) {
                echo "✓ Test 17: Action 'custom' processes user prompt instructions\n";
                $passed++;
            } else {
                echo "✗ Test 17: Action 'custom' failed\n";
                $failed++;
            }

            // Test 18: Action 'custom' allows empty text when generating from scratch
            $reqCustomScratch = new Request([
                'action' => 'custom',
                'text' => '',
                'options' => ['instruction' => 'Write a welcome intro']
            ]);
            $resCustomScratch = $controller->generate($reqCustomScratch);
            $dataCustomScratch = $resCustomScratch->getData();
            if ($resCustomScratch->status === 200 && $dataCustomScratch['success'] === true) {
                echo "✓ Test 18: Action 'custom' allows text generation from scratch without initial selection\n";
                $passed++;
            } else {
                echo "✗ Test 18: Action 'custom' scratch failed\n";
                $failed++;
            }

            echo "\n----------------------------------------\n";
            echo "Phase 21 Laravel Tests Completed: {$passed} Passed, {$failed} Failed.\n";
            echo "----------------------------------------\n";

            return $failed === 0 ? 0 : 1;
        }
    }
}
