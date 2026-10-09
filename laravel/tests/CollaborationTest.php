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
            public function update(array $attributes = []): bool {
                $this->attributes = array_merge($this->attributes, $attributes);
                return true;
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
            protected static function boot() {}
            protected static function saving($callback) {}
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
    if (!class_exists('Illuminate\Database\Eloquent\Relations\HasMany', false)) {
        class HasMany {}
    }
    if (!class_exists('Illuminate\Database\Eloquent\Relations\HasOne', false)) {
        class HasOne {}
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
            public function boolean($key, $default = false): bool {
                if (!isset($this->data[$key])) return $default;
                return filter_var($this->data[$key], FILTER_VALIDATE_BOOLEAN);
            }
            public function only(array $keys): array {
                $res = [];
                foreach ($keys as $k) {
                    if (array_key_exists($k, $this->data)) {
                        $res[$k] = $this->data[$k];
                    }
                }
                return $res;
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

    if (!class_exists('Illuminate\Support\Facades\DB', false)) {
        class DB {
            public static function transaction(callable $callback) {
                return $callback();
            }
        }
    }

    if (!class_exists('Illuminate\Support\Facades\Schema', false)) {
        class Schema {
            public static function hasTable($name) { return false; }
            public static function create($name, $callback) { return true; }
            public static function dropIfExists($name) { return true; }
        }
    }
}

namespace Carbon {
    if (!class_exists('Carbon\Carbon', false)) {
        class Carbon {
            protected int $timestamp;
            public function __construct($time = 'now') {
                $this->timestamp = is_numeric($time) ? (int)$time : strtotime($time ?: 'now');
            }
            public static function now(): self { return new static(); }
            public static function parse($time): self { return new static($time); }
            public function copy(): self { return new static('@' . $this->timestamp); }
            public function addSeconds(int $sec): self {
                $this->timestamp += $sec;
                return $this;
            }
            public function lessThanOrEqualTo($other): bool {
                $otherTs = $other instanceof self ? $other->getTimestamp() : strtotime((string)$other);
                return $this->timestamp <= $otherTs;
            }
            public function getTimestamp(): int { return $this->timestamp; }
            public function __toString(): string { return date('Y-m-d H:i:s', $this->timestamp); }
        }
    }
}

namespace {
    if (!function_exists('config')) {
        function config($key = null, $default = null) {
            $configs = [
                'editor.route.prefix' => 'api/editor',
                'editor.route.middleware' => ['api'],
                'editor.database.table' => 'editor_documents',
                'editor.database.versions_table' => 'editor_document_versions',
                'editor.database.comments_table' => 'editor_document_comments',
                'editor.database.locks_table' => 'editor_document_locks',
                'editor.collaboration.lock_ttl' => 300,
                'editor.collaboration.provider' => 'reverb',
            ];
            return $configs[$key] ?? $default;
        }
    }

    if (!function_exists('now')) {
        function now() {
            return \Carbon\Carbon::now();
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

    require_once __DIR__ . '/../src/Security/ContentSanitizer.php';
    require_once __DIR__ . '/../src/Models/EditorDocument.php';
    require_once __DIR__ . '/../src/Models/EditorDocumentComment.php';
    require_once __DIR__ . '/../src/Models/EditorDocumentLock.php';
    require_once __DIR__ . '/../src/Services/EditorDocumentService.php';
    require_once __DIR__ . '/../src/Services/EditorDocumentCommentService.php';
    require_once __DIR__ . '/../src/Services/EditorDocumentLockService.php';
    require_once __DIR__ . '/../src/Controllers/EditorDocumentController.php';
    require_once __DIR__ . '/../src/Controllers/EditorDocumentCommentController.php';
    require_once __DIR__ . '/../src/Controllers/EditorDocumentLockController.php';

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;
    use UniversalEditor\Laravel\Models\EditorDocument;
    use UniversalEditor\Laravel\Models\EditorDocumentComment;
    use UniversalEditor\Laravel\Models\EditorDocumentLock;
    use UniversalEditor\Laravel\Services\EditorDocumentCommentService;
    use UniversalEditor\Laravel\Services\EditorDocumentLockService;
    use UniversalEditor\Laravel\Services\EditorDocumentService;
    use UniversalEditor\Laravel\Controllers\EditorDocumentCommentController;
    use UniversalEditor\Laravel\Controllers\EditorDocumentLockController;
    use Carbon\Carbon;

    // In-memory mock Document Comment Model for DB emulation
    class MockCommentModel extends EditorDocumentComment {

        public static array $store = [];
        public static int $autoId = 1;

        public static function resetStore(): void {
            self::$store = [];
            self::$autoId = 1;
        }

        public function save(): bool {
            if (empty($this->attributes['id'])) {
                $this->attributes['id'] = self::$autoId++;
            }
            if (empty($this->attributes['created_at'])) {
                $this->attributes['created_at'] = Carbon::now();
            }
            self::$store[$this->attributes['id']] = $this;
            return true;
        }

        public function delete(): bool {
            unset(self::$store[$this->attributes['id']]);
            return true;
        }

        public static function findOrFail($id) {
            if (isset(self::$store[$id])) {
                return self::$store[$id];
            }
            throw new \RuntimeException("Comment {$id} not found.");
        }

        public static function where($col, $opOrVal = null, $val = null) {
            $colName = $col;
            $value = $val !== null ? $val : $opOrVal;
            $items = array_values(array_filter(self::$store, function ($c) use ($colName, $value) {
                return ($c->$colName == $value);
            }));

            return new class($items) {
                protected array $items;
                public function __construct(array $items) { $this->items = $items; }
                public function where($c, $v) {
                    $this->items = array_values(array_filter($this->items, fn($i) => $i->$c == $v));
                    return $this;
                }
                public function whereNull($c) {
                    $this->items = array_values(array_filter($this->items, fn($i) => empty($i->$c)));
                    return $this;
                }
                public function with($relations) { return $this; }
                public function orderBy($col, $dir = 'asc') { return $this; }
                public function get() { return $this->items; }
                public function first() { return $this->items[0] ?? null; }
                public function update(array $data) {
                    foreach ($this->items as $item) {
                        $item->update($data);
                    }
                    return count($this->items);
                }
                public function delete() {
                    foreach ($this->items as $item) {
                        $item->delete();
                    }
                    return count($this->items);
                }
            };
        }
    }

    // In-memory mock Document Lock Model
    class MockLockModel extends EditorDocumentLock {
        public static array $store = [];
        public static int $autoId = 1;

        public static function resetStore(): void {
            self::$store = [];
            self::$autoId = 1;
        }

        public static function create(array $data): static {
            $lock = new static($data);
            $lock->id = self::$autoId++;
            self::$store[$data['document_id']] = $lock;
            return $lock;
        }

        public function save(): bool {
            if (empty($this->attributes['id'])) {
                $this->attributes['id'] = self::$autoId++;
            }
            self::$store[$this->attributes['document_id']] = $this;
            return true;
        }

        public function update(array $attributes = []): bool {
            $this->attributes = array_merge($this->attributes, $attributes);
            self::$store[$this->attributes['document_id']] = $this;
            return true;
        }

        public function delete(): bool {
            unset(self::$store[$this->attributes['document_id']]);
            return true;
        }

        public static function where($col, $opOrVal = null, $val = null) {
            $colName = $col;
            $value = $val !== null ? $val : $opOrVal;

            $items = array_values(array_filter(self::$store, function ($l) use ($colName, $value) {
                return ($l->$colName == $value);
            }));

            return new class($items) {
                protected array $items;
                public function __construct(array $items) { $this->items = $items; }
                public function first() { return $this->items[0] ?? null; }
                public function get() { return $this->items; }
            };
        }
    }

    class CollaborationTest
    {
        protected static int $passed = 0;
        protected static int $failed = 0;

        public static function run(): void
        {
            echo "Running Phase 20: Collaboration & Comments Verification...\n\n";

            self::testMigrationsExist();
            self::testCommentModelFunctionality();
            self::testLockModelFunctionality();
            self::testDocumentCollaborationRelationships();
            self::testCommentServiceOperations();
            self::testLockServiceOperations();
            self::testCommentControllerEndpoints();
            self::testLockControllerEndpoints();
            self::testApiRoutesRegistration();

            echo "\nPhase 20 Collaboration Suite Summary: " . self::$passed . " passed, " . self::$failed . " failed.\n\n";

            if (self::$failed > 0) {
                exit(1);
            }
        }

        protected static function assert(bool $condition, string $message): void
        {
            if ($condition) {
                self::$passed++;
                echo "✓ {$message}\n";
            } else {
                self::$failed++;
                echo "✗ FAIL: {$message}\n";
            }
        }

        public static function testMigrationsExist(): void
        {
            $commentsMigration = __DIR__ . '/../database/migrations/2026_09_29_000003_create_editor_document_comments_table.php';
            $locksMigration = __DIR__ . '/../database/migrations/2026_09_29_000004_create_editor_document_locks_table.php';

            self::assert(file_exists($commentsMigration), "Test 1: Migration 000003_create_editor_document_comments_table.php exists");
            self::assert(file_exists($locksMigration), "Test 1: Migration 000004_create_editor_document_locks_table.php exists");

            $commentContent = file_get_contents($commentsMigration);
            self::assert(str_contains($commentContent, 'selected_text') && str_contains($commentContent, 'parent_id'),
                "Test 1: Comments migration specifies anchors and threaded parent_id");

            $lockContent = file_get_contents($locksMigration);
            self::assert(str_contains($lockContent, 'expires_at') && str_contains($lockContent, 'heartbeat_at'),
                "Test 1: Locks migration specifies TTL expiration and heartbeat tracking");
        }

        public static function testCommentModelFunctionality(): void
        {
            $comment = new EditorDocumentComment([
                'document_id' => 10,
                'user_id' => 42,
                'user_name' => 'Alice Dev',
                'selected_text' => 'sample highlighted text',
                'from_pos' => 12,
                'to_pos' => 35,
                'content' => 'Please rewrite this section @bob',
                'status' => EditorDocumentComment::STATUS_ACTIVE,
            ]);

            self::assert($comment->document_id === 10, "Test 2: Comment document_id matches");
            self::assert($comment->selected_text === 'sample highlighted text', "Test 2: Comment stores anchored selection text");
            self::assert($comment->from_pos === 12 && $comment->to_pos === 35, "Test 2: Comment stores start and end positions");
            self::assert(!$comment->isResolved(), "Test 2: New comment is not resolved");
            self::assert($comment->isRoot(), "Test 2: Comment without parent_id isRoot() is true");

            // Test resolve
            $comment->resolve(99);
            self::assert($comment->isResolved(), "Test 2: Comment is resolved after resolve()");
            self::assert($comment->resolved_by === 99, "Test 2: Comment records resolved_by user ID");

            // Test reopen
            $comment->reopen();
            self::assert(!$comment->isResolved(), "Test 2: Comment is active after reopen()");
            self::assert($comment->resolved_by === null, "Test 2: Resolved by cleared after reopen()");
        }

        public static function testLockModelFunctionality(): void
        {
            $now = Carbon::now();
            $lock = new EditorDocumentLock([
                'document_id' => 10,
                'user_id' => 5,
                'user_name' => 'Charlie',
                'locked_at' => $now,
                'expires_at' => $now->copy()->addSeconds(300),
            ]);

            self::assert($lock->isActive(), "Test 3: Lock with future expiry is active");
            self::assert(!$lock->isExpired(), "Test 3: Lock with future expiry is not expired");

            // Simulate expired lock
            $expiredLock = new EditorDocumentLock([
                'document_id' => 10,
                'user_id' => 5,
                'expires_at' => Carbon::now()->addSeconds(-10),
            ]);
            self::assert($expiredLock->isExpired(), "Test 3: Lock with past expiry is detected as expired");
            self::assert(!$expiredLock->isActive(), "Test 3: Expired lock is not active");

            // Refresh heartbeat
            $lock->refreshHeartbeat(600);
            self::assert($lock->isActive(), "Test 3: Lock is active after heartbeat refresh");
        }

        public static function testDocumentCollaborationRelationships(): void
        {
            $doc = new EditorDocument([
                'id' => 101,
                'title' => 'Collab Doc',
                'content_html' => '<p>Collab content</p>',
            ]);

            self::assert(method_exists($doc, 'comments'), "Test 4: EditorDocument defines comments() relationship");
            self::assert(method_exists($doc, 'activeComments'), "Test 4: EditorDocument defines activeComments() relationship");
            self::assert(method_exists($doc, 'rootComments'), "Test 4: EditorDocument defines rootComments() relationship");
            self::assert(method_exists($doc, 'currentLock'), "Test 4: EditorDocument defines currentLock() relationship");
            self::assert(method_exists($doc, 'isLocked'), "Test 4: EditorDocument has isLocked() method");
            self::assert(method_exists($doc, 'acquireLock'), "Test 4: EditorDocument has acquireLock() method");
            self::assert(method_exists($doc, 'releaseLock'), "Test 4: EditorDocument has releaseLock() method");
        }

        public static function testCommentServiceOperations(): void
        {
            MockCommentModel::resetStore();
            $service = new EditorDocumentCommentService();

            // 1. Add top-level comment
            $doc = new EditorDocument(['id' => 201, 'title' => 'Doc 201']);
            $comment = new MockCommentModel([
                'document_id' => 201,
                'user_id' => 1,
                'user_name' => 'Alice',
                'selected_text' => 'some sentence',
                'from_pos' => 5,
                'to_pos' => 18,
                'content' => 'Consider updating this paragraph @john',
            ]);
            $comment->save();

            self::assert(count(MockCommentModel::$store) === 1, "Test 5: Comment saved in store");
            self::assert($comment->id === 1, "Test 5: Auto-increment ID assigned to comment");

            // 2. Mention extraction
            $mentions = $service->extractMentions("Hey @alice and @bob_123 please review");
            self::assert(in_array('alice', $mentions) && in_array('bob_123', $mentions), "Test 5: extractMentions parses usernames");

            // 3. Add reply
            $reply = new MockCommentModel([
                'document_id' => 201,
                'user_id' => 2,
                'user_name' => 'Bob',
                'parent_id' => 1,
                'content' => 'I agree, will fix it now',
            ]);
            $reply->save();

            self::assert(count(MockCommentModel::$store) === 2, "Test 5: Reply added to store");
            self::assert($reply->parent_id === 1, "Test 5: Reply references parent comment ID");

            // 4. Resolve comment
            $comment->resolve(2);
            self::assert($comment->isResolved(), "Test 5: Root comment marked resolved");

            // 5. Delete comment
            $reply->delete();
            $comment->delete();
            self::assert(count(MockCommentModel::$store) === 0, "Test 5: Comments deleted cleanly");
        }

        public static function testLockServiceOperations(): void
        {
            MockLockModel::resetStore();
            $service = new EditorDocumentLockService();

            $doc = new EditorDocument(['id' => 301, 'title' => 'Lock Doc']);

            // 1. Acquire lock
            $lock = MockLockModel::create([
                'document_id' => 301,
                'user_id' => 10,
                'user_name' => 'User Ten',
                'locked_at' => Carbon::now(),
                'expires_at' => Carbon::now()->addSeconds(300),
            ]);

            self::assert(count(MockLockModel::$store) === 1, "Test 6: Lock recorded in store");
            self::assert($lock->user_id === 10, "Test 6: Lock user_id matches acquiree");

            // 2. Refresh heartbeat
            $lock->refreshHeartbeat(400);
            self::assert(!$lock->isExpired(), "Test 6: Heartbeat extended expiration");

            // 3. Release lock
            $lock->delete();
            self::assert(count(MockLockModel::$store) === 0, "Test 6: Lock deleted on release");
        }

        public static function testCommentControllerEndpoints(): void
        {
            $mockDocService = new class extends EditorDocumentService {
                public function find(string|int $id): mixed {
                    return new EditorDocument(['id' => (int)$id, 'title' => 'Test Doc']);
                }
            };

            $mockCommentService = new class extends EditorDocumentCommentService {
                public function listComments($document, bool $includeResolved = true, bool $threaded = true): array {
                    return [
                        ['id' => 1, 'content' => 'Great work!', 'status' => 'active'],
                    ];
                }
                public function addComment($document, array $data, ?int $userId = null): EditorDocumentComment {
                    return new EditorDocumentComment(array_merge($data, ['id' => 2, 'document_id' => 1, 'user_id' => $userId]));
                }
                public function replyComment(int $commentId, array $data, ?int $userId = null): EditorDocumentComment {
                    return new EditorDocumentComment(array_merge($data, ['id' => 3, 'parent_id' => $commentId, 'user_id' => $userId]));
                }
                public function resolveComment(int $commentId, ?int $userId = null): EditorDocumentComment {
                    return new EditorDocumentComment(['id' => $commentId, 'status' => 'resolved', 'resolved_by' => $userId]);
                }
                public function reopenComment(int $commentId): EditorDocumentComment {
                    return new EditorDocumentComment(['id' => $commentId, 'status' => 'active']);
                }
                public function deleteComment(int $commentId, ?int $userId = null, bool $force = false): bool {
                    return true;
                }
            };

            $controller = new EditorDocumentCommentController($mockCommentService, $mockDocService);

            // 1. Index comments
            $req = new Request();
            $res = $controller->index($req, 1);
            self::assert($res->status === 200, "Test 7: Comment index returns 200 OK");
            $data = $res->getData(true);
            self::assert($data['count'] === 1, "Test 7: Index returns comment count");

            // 2. Store comment
            $reqStore = new Request([
                'content' => 'Review this line',
                'selected_text' => 'important text',
                'from_pos' => 10,
                'to_pos' => 24,
                'user_id' => 5,
            ]);
            $resStore = $controller->store($reqStore, 1);
            self::assert($resStore->status === 201, "Test 7: Comment store returns 201 Created");

            // 3. Reply to comment
            $reqReply = new Request(['content' => 'Done reviewing', 'user_id' => 6]);
            $resReply = $controller->reply($reqReply, 1, 2);
            self::assert($resReply->status === 201, "Test 7: Comment reply returns 201 Created");

            // 4. Resolve comment
            $reqResolve = new Request(['user_id' => 5]);
            $resResolve = $controller->resolve($reqResolve, 1, 2);
            self::assert($resResolve->status === 200, "Test 7: Comment resolve returns 200 OK");

            // 5. Reopen comment
            $resReopen = $controller->reopen($req, 1, 2);
            self::assert($resReopen->status === 200, "Test 7: Comment reopen returns 200 OK");

            // 6. Delete comment
            $resDelete = $controller->destroy($req, 1, 2);
            self::assert($resDelete->status === 200, "Test 7: Comment destroy returns 200 OK");
        }

        public static function testLockControllerEndpoints(): void
        {
            $mockDocService = new class extends EditorDocumentService {
                public function find(string|int $id): mixed {
                    return new EditorDocument(['id' => (int)$id, 'title' => 'Test Doc']);
                }
            };

            $mockLockService = new class extends EditorDocumentLockService {
                public function acquireLock($document, int $userId, ?string $userName = null, ?int $ttlSeconds = null): array {
                    if ($userId === 999) {
                        return [
                            'success' => false,
                            'message' => 'Locked by another user',
                            'lock' => new EditorDocumentLock(['document_id' => 1, 'user_id' => 42, 'user_name' => 'Boss']),
                        ];
                    }
                    return [
                        'success' => true,
                        'action' => 'acquired',
                        'lock' => new EditorDocumentLock(['document_id' => 1, 'user_id' => $userId, 'user_name' => $userName]),
                    ];
                }
                public function heartbeat($document, int $userId, ?int $ttlSeconds = null): array {
                    return ['success' => true, 'lock' => new EditorDocumentLock(['document_id' => 1, 'user_id' => $userId])];
                }
                public function releaseLock($document, int $userId, bool $force = false): array {
                    return ['success' => true, 'message' => 'Lock released'];
                }
                public function checkLock($document, ?int $currentUserId = null): array {
                    return ['is_locked' => true, 'is_owner' => true, 'lock' => new EditorDocumentLock(['document_id' => 1, 'user_id' => 1])];
                }
            };

            $controller = new EditorDocumentLockController($mockLockService, $mockDocService);

            // 1. Lock acquire success
            $req = new Request(['user_id' => 1, 'user_name' => 'Sarah']);
            $res = $controller->lock($req, 1);
            self::assert($res->status === 200, "Test 8: Lock acquire returns 200 OK");

            // 2. Lock acquire conflict
            $reqConflict = new Request(['user_id' => 999, 'user_name' => 'Stranger']);
            $resConflict = $controller->lock($reqConflict, 1);
            self::assert($resConflict->status === 409, "Test 8: Lock conflict returns 409 Conflict");

            // 3. Heartbeat
            $resHeartbeat = $controller->heartbeat($req, 1);
            self::assert($resHeartbeat->status === 200, "Test 8: Heartbeat returns 200 OK");

            // 4. Status
            $resStatus = $controller->status($req, 1);
            self::assert($resStatus->status === 200, "Test 8: Lock status returns 200 OK");

            // 5. Unlock
            $resUnlock = $controller->unlock($req, 1);
            self::assert($resUnlock->status === 200, "Test 8: Lock unlock returns 200 OK");
        }

        public static function testApiRoutesRegistration(): void
        {
            Route::$routes = [];
            require __DIR__ . '/../routes/api.php';

            $routes = Route::$routes;

            // Comment routes
            self::assert(isset($routes['GET:api/editor/documents/{id}/comments']), "Test 9: GET api/editor/documents/{id}/comments registered");
            self::assert(isset($routes['POST:api/editor/documents/{id}/comments']), "Test 9: POST api/editor/documents/{id}/comments registered");
            self::assert(isset($routes['POST:api/editor/documents/{id}/comments/{commentId}/reply']), "Test 9: POST api/editor/documents/{id}/comments/{commentId}/reply registered");
            self::assert(isset($routes['PATCH:api/editor/documents/{id}/comments/{commentId}/resolve']), "Test 9: PATCH api/editor/documents/{id}/comments/{commentId}/resolve registered");
            self::assert(isset($routes['DELETE:api/editor/documents/{id}/comments/{commentId}']), "Test 9: DELETE api/editor/documents/{id}/comments/{commentId} registered");

            // Lock routes
            self::assert(isset($routes['POST:api/editor/documents/{id}/lock']), "Test 9: POST api/editor/documents/{id}/lock registered");
            self::assert(isset($routes['POST:api/editor/documents/{id}/heartbeat']), "Test 9: POST api/editor/documents/{id}/heartbeat registered");
            self::assert(isset($routes['POST:api/editor/documents/{id}/unlock']), "Test 9: POST api/editor/documents/{id}/unlock registered");
            self::assert(isset($routes['GET:api/editor/documents/{id}/lock-status']), "Test 9: GET api/editor/documents/{id}/lock-status registered");

            // Root aliases
            self::assert(isset($routes['GET:/api/documents/{id}/comments']), "Test 9: Root alias GET /api/documents/{id}/comments registered");
            self::assert(isset($routes['POST:/api/documents/{id}/lock']), "Test 9: Root alias POST /api/documents/{id}/lock registered");
        }
    }
}
