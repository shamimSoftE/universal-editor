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
                $method = 'get' . str_replace(' ', '', ucwords(str_replace('_', ' ', $key))) . 'Attribute';
                if (method_exists($this, $method)) {
                    return $this->$method();
                }
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
            public static function query() {
                return new class {
                    public function status($s) { return $this; }
                    public function search($t) { return $this; }
                    public function forUser($u) { return $this; }
                    public function latest() { return $this; }
                    public function paginate($p) {
                        return new class {
                            public function items() { return []; }
                            public function total() { return 0; }
                            public function currentPage() { return 1; }
                        };
                    }
                };
            }
            public static function find($id) {
                return null;
            }
            public static function create(array $data) {
                return new static($data);
            }
            public function save() {
                return true;
            }
            public function delete() {
                return true;
            }
        }
    }

    if (!class_exists('Illuminate\Database\Eloquent\Builder', false)) {
        class Builder {}
    }
}

namespace Illuminate\Database\Eloquent\Relations {
    if (!class_exists('Illuminate\Database\Eloquent\Relations\BelongsTo', false)) {
        class BelongsTo {}
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
            public function user() {
                return null;
            }
        }
    }
}

namespace {
    if (!function_exists('response')) {
        function response() {
            return new class {
                public function json($data, $status = 200) {
                    return new \Illuminate\Http\JsonResponse($data, $status);
                }
            };
        }
    }

    if (!function_exists('config')) {
        function config(string $key, mixed $default = null): mixed {
            $configs = [
                'editor.database.table' => 'editor_documents',
                'editor.database.per_page' => 15,
                'editor.database.default_status' => 'draft',
                'editor.database.allowed_statuses' => ['draft', 'published', 'archived'],
                'editor.sanitization.enabled' => true,
                'editor.authentication.required' => false,
            ];
            return $configs[$key] ?? $default;
        }
    }

    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed {
            return $_ENV[$key] ?? $default;
        }
    }
}

namespace UniversalEditor\Laravel\Tests {

    require_once __DIR__ . '/../src/Security/ContentSanitizer.php';
    require_once __DIR__ . '/../src/Models/EditorDocument.php';
    require_once __DIR__ . '/../src/Policies/EditorDocumentPolicy.php';
    require_once __DIR__ . '/../src/Services/EditorDocumentService.php';
    require_once __DIR__ . '/../src/Controllers/EditorDocumentController.php';

    use UniversalEditor\Laravel\Models\EditorDocument;
    use UniversalEditor\Laravel\Services\EditorDocumentService;
    use UniversalEditor\Laravel\Controllers\EditorDocumentController;
    use UniversalEditor\Laravel\Policies\EditorDocumentPolicy;
    use Illuminate\Http\Request;

    class DocumentTest
    {
        public static function run(): int
        {
            $passed = 0;
            $failed = 0;

            echo "Running Phase 18: Laravel Database & Content Management Verification...\n\n";

            // Test 1: Migration file exists and has up & down
            $migrationFiles = glob(__DIR__ . '/../database/migrations/*_create_editor_documents_table.php');
            if (!empty($migrationFiles) && file_exists($migrationFiles[0])) {
                $content = file_get_contents($migrationFiles[0]);
                if (str_contains($content, 'editor_documents') &&
                    str_contains($content, 'content_html') &&
                    str_contains($content, 'content_json') &&
                    str_contains($content, 'status') &&
                    str_contains($content, 'version')) {
                    echo "✓ Test 1: Migration creates editor_documents with all required fields\n";
                    $passed++;
                } else {
                    echo "✗ Test 1: Migration missing required fields\n";
                    $failed++;
                }
            } else {
                echo "✗ Test 1: Migration file not found\n";
                $failed++;
            }

            // Test 2: EditorDocument model definitions and constants
            if (
                EditorDocument::STATUS_DRAFT === 'draft' &&
                EditorDocument::STATUS_PUBLISHED === 'published' &&
                EditorDocument::STATUS_ARCHIVED === 'archived' &&
                count(EditorDocument::STATUSES) === 3
            ) {
                echo "✓ Test 2: EditorDocument constants and statuses verified\n";
                $passed++;
            } else {
                echo "✗ Test 2: EditorDocument constants invalid\n";
                $failed++;
            }

            // Test 3: EditorDocumentPolicy authorization methods
            $policy = new EditorDocumentPolicy();
            if (
                method_exists($policy, 'viewAny') &&
                method_exists($policy, 'view') &&
                method_exists($policy, 'create') &&
                method_exists($policy, 'update') &&
                method_exists($policy, 'delete')
            ) {
                echo "✓ Test 3: EditorDocumentPolicy defines complete authorization suite\n";
                $passed++;
            } else {
                echo "✗ Test 3: EditorDocumentPolicy missing required methods\n";
                $failed++;
            }

            // Test 4: EditorDocumentService CRUD lifecycle and auto-sanitization
            EditorDocumentService::resetMemoryStore();
            $service = new EditorDocumentService();

            $created = $service->create([
                'title' => 'Release Notes v2.0',
                'content_html' => '<h2>Features</h2><script>alert("xss")</script><p>Safe text</p>',
                'content_json' => ['type' => 'doc', 'content' => []],
                'status' => 'draft',
            ], 101);

            if (
                $created &&
                $created->title === 'Release Notes v2.0' &&
                $created->status === 'draft' &&
                $created->version === 1 &&
                !str_contains($created->content_html, '<script>') &&
                str_contains($created->content_html, '<p>Safe text</p>')
            ) {
                echo "✓ Test 4: EditorDocumentService creates document with auto-sanitization & versioning\n";
                $passed++;
            } else {
                echo "✗ Test 4: EditorDocumentService creation or sanitization failed\n";
                $failed++;
            }

            // Test 5: EditorDocumentService update & version increment
            $docId = $created->id;
            $updated = $service->update($docId, [
                'title' => 'Release Notes v2.0 Final',
                'content_html' => '<p>Updated content</p>',
            ]);

            if (
                $updated &&
                $updated->title === 'Release Notes v2.0 Final' &&
                $updated->version === 2 &&
                str_contains($updated->content_html, '<p>Updated content</p>')
            ) {
                echo "✓ Test 5: EditorDocumentService updates content and auto-increments version\n";
                $passed++;
            } else {
                echo "✗ Test 5: EditorDocumentService update failed\n";
                $failed++;
            }

            // Test 6: EditorDocumentService status transition and filter listing
            $published = $service->changeStatus($docId, 'published');
            $listAll = $service->list([], 10);
            $listDrafts = $service->list(['status' => 'draft'], 10);
            $listPublished = $service->list(['status' => 'published'], 10);
            $listSearch = $service->list(['search' => 'Release'], 10);

            if (
                $published->status === 'published' &&
                $listAll['total'] === 1 &&
                $listDrafts['total'] === 0 &&
                $listPublished['total'] === 1 &&
                $listSearch['total'] === 1
            ) {
                echo "✓ Test 6: Status transitions, status filtering, and search verified\n";
                $passed++;
            } else {
                echo "✗ Test 6: Status transition or listing failed\n";
                $failed++;
            }

            // Test 7: EditorDocumentController RESTful endpoints
            $controller = new EditorDocumentController($service);

            // 7a. Controller Store validation
            $invalidReq = new Request([]);
            $resInvalid = $controller->store($invalidReq);
            $dataInvalid = $resInvalid->getData(true);

            // 7b. Controller Store valid
            $validReq = new Request([
                'title' => 'Architecture Whitepaper',
                'content_html' => '<p>Executive architecture document</p>',
                'status' => 'draft',
            ]);
            $resValid = $controller->store($validReq);
            $dataValid = $resValid->getData(true);

            if (
                $resInvalid->status === 422 &&
                $resValid->status === 201 &&
                $dataValid['success'] === true &&
                $dataValid['data']['title'] === 'Architecture Whitepaper'
            ) {
                echo "✓ Test 7: EditorDocumentController store validation and creation verified\n";
                $passed++;
            } else {
                echo "✗ Test 7: EditorDocumentController store failed\n";
                $failed++;
            }

            // Test 8: Controller Show, Update, and Destroy
            $newId = $dataValid['data']['id'];
            $resShow = $controller->show($newId);
            $dataShow = $resShow->getData(true);

            $updateReq = new Request(['title' => 'Architecture Whitepaper v2']);
            $resUpdate = $controller->update($updateReq, $newId);
            $dataUpdate = $resUpdate->getData(true);

            $resDelete = $controller->destroy($newId);
            $dataDelete = $resDelete->getData(true);

            $resShowAfterDelete = $controller->show($newId);

            if (
                $dataShow['success'] === true &&
                $dataUpdate['data']['title'] === 'Architecture Whitepaper v2' &&
                $dataDelete['success'] === true &&
                $resShowAfterDelete->status === 404
            ) {
                echo "✓ Test 8: EditorDocumentController show, update, and destroy verified\n";
                $passed++;
            } else {
                echo "✗ Test 8: EditorDocumentController show/update/destroy failed\n";
                $failed++;
            }

            // Test 9: Route file defines all Phase 18 endpoints
            $routesContent = file_get_contents(__DIR__ . '/../routes/api.php');
            if (
                str_contains($routesContent, 'editor.documents.index') &&
                str_contains($routesContent, 'editor.documents.store') &&
                str_contains($routesContent, 'editor.documents.show') &&
                str_contains($routesContent, 'editor.documents.update') &&
                str_contains($routesContent, 'editor.documents.destroy')
            ) {
                echo "✓ Test 9: routes/api.php registers all Phase 18 RESTful document routes\n";
                $passed++;
            } else {
                echo "✗ Test 9: Missing document routes in routes/api.php\n";
                $failed++;
            }

            // Test 10: Model helper methods (isDraft, isPublished, isArchived, publish, archive)
            $model = new EditorDocument([
                'title' => 'Doc Status Test',
                'status' => 'draft',
                'content_html' => '<p>Word count test with five words</p>',
            ]);

            $isDraft = $model->isDraft();
            $isPub = $model->isPublished();
            $isArch = $model->isArchived();
            $wc = $model->getWordCountAttribute();

            if (
                $isDraft === true &&
                $isPub === false &&
                $isArch === false &&
                $wc >= 5
            ) {
                echo "✓ Test 10: EditorDocument status helper methods and word count accessor verified\n";
                $passed++;
            } else {
                echo "✗ Test 10: isDraft: " . var_export($isDraft, true) . ", isPub: " . var_export($isPub, true) . ", isArch: " . var_export($isArch, true) . ", wordCount: " . var_export($wc, true) . "\n";
                $failed++;
            }

            echo "\nPhase 18 Document Suite Summary: {$passed} passed, {$failed} failed.\n";
            return $failed === 0 ? 0 : 1;
        }
    }

    exit(DocumentTest::run());
}
