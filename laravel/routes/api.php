<?php

use Illuminate\Support\Facades\Route;
use UniversalEditor\Laravel\Controllers\EditorController;
use UniversalEditor\Laravel\Controllers\EditorUploadController;
use UniversalEditor\Laravel\Controllers\EditorMediaController;
use UniversalEditor\Laravel\Controllers\EditorUserController;
use UniversalEditor\Laravel\Controllers\EditorDraftController;
use UniversalEditor\Laravel\Controllers\EditorDocumentController;
use UniversalEditor\Laravel\Controllers\EditorDocumentVersionController;
use UniversalEditor\Laravel\Controllers\EditorDocumentCommentController;
use UniversalEditor\Laravel\Controllers\EditorDocumentLockController;
use UniversalEditor\Laravel\Controllers\EditorAIController;

$prefix = config('editor.route.prefix', 'api/editor');
$middleware = config('editor.route.middleware', ['api']);

Route::prefix($prefix)->middleware($middleware)->group(function () {
    // Health & Configuration
    Route::get('/ping', [EditorController::class, 'ping'])->name('editor.ping');
    Route::get('/config', [EditorController::class, 'config'])->name('editor.config');
    Route::get('/theme', [EditorController::class, 'theme'])->name('editor.theme');

    // Media & Uploads
    Route::post('/upload', [EditorUploadController::class, 'upload'])->name('editor.upload');
    Route::get('/media', [EditorMediaController::class, 'index'])->name('editor.media.index');
    Route::delete('/media/{id}', [EditorMediaController::class, 'destroy'])->name('editor.media.destroy');

    // Mentions & User Directory (Phase 12)
    Route::get('/users/search', [EditorUserController::class, 'search'])->name('editor.users.search');

    // Autosave & Drafts (Phase 13)
    Route::post('/autosave', [EditorController::class, 'autosave'])->name('editor.autosave');
    Route::post('/drafts', [EditorDraftController::class, 'store'])->name('editor.drafts.store');
    Route::get('/drafts/{id?}', [EditorDraftController::class, 'show'])->name('editor.drafts.show');
    Route::delete('/drafts/{id?}', [EditorDraftController::class, 'destroy'])->name('editor.drafts.destroy');

    // Document & Content Management (Phase 18)
    Route::get('/documents', [EditorDocumentController::class, 'index'])->name('editor.documents.index');
    Route::post('/documents', [EditorDocumentController::class, 'store'])->name('editor.documents.store');
    Route::get('/documents/{id}', [EditorDocumentController::class, 'show'])->name('editor.documents.show');
    Route::put('/documents/{id}', [EditorDocumentController::class, 'update'])->name('editor.documents.update');
    Route::delete('/documents/{id}', [EditorDocumentController::class, 'destroy'])->name('editor.documents.destroy');

    // Document Version History (Phase 19)
    Route::get('/documents/{id}/versions', [EditorDocumentVersionController::class, 'index'])->name('editor.documents.versions.index');
    Route::post('/documents/{id}/versions', [EditorDocumentVersionController::class, 'store'])->name('editor.documents.versions.store');
    Route::get('/documents/{id}/versions/compare', [EditorDocumentVersionController::class, 'compare'])->name('editor.documents.versions.compare');
    Route::get('/documents/{id}/versions/{versionId}', [EditorDocumentVersionController::class, 'show'])->name('editor.documents.versions.show');
    Route::post('/documents/{id}/versions/{versionId}/restore', [EditorDocumentVersionController::class, 'restore'])->name('editor.documents.versions.restore');

    // Collaboration: Comments (Phase 20)
    Route::get('/documents/{id}/comments', [EditorDocumentCommentController::class, 'index'])->name('editor.documents.comments.index');
    Route::post('/documents/{id}/comments', [EditorDocumentCommentController::class, 'store'])->name('editor.documents.comments.store');
    Route::post('/documents/{id}/comments/{commentId}/reply', [EditorDocumentCommentController::class, 'reply'])->name('editor.documents.comments.reply');
    Route::patch('/documents/{id}/comments/{commentId}/resolve', [EditorDocumentCommentController::class, 'resolve'])->name('editor.documents.comments.resolve');
    Route::patch('/documents/{id}/comments/{commentId}/reopen', [EditorDocumentCommentController::class, 'reopen'])->name('editor.documents.comments.reopen');
    Route::delete('/documents/{id}/comments/{commentId}', [EditorDocumentCommentController::class, 'destroy'])->name('editor.documents.comments.destroy');

    // Collaboration: Document Locking (Phase 20)
    Route::post('/documents/{id}/lock', [EditorDocumentLockController::class, 'lock'])->name('editor.documents.lock');
    Route::post('/documents/{id}/heartbeat', [EditorDocumentLockController::class, 'heartbeat'])->name('editor.documents.heartbeat');
    Route::post('/documents/{id}/unlock', [EditorDocumentLockController::class, 'unlock'])->name('editor.documents.unlock');
    Route::get('/documents/{id}/lock-status', [EditorDocumentLockController::class, 'status'])->name('editor.documents.lock_status');

    // AI Assistant Integration (Phase 21)
    Route::post('/ai/generate', [EditorAIController::class, 'generate'])->name('editor.ai.generate');
});

// Standard root aliases for frontend fetch
Route::middleware($middleware)->get('/api/users/search', [EditorUserController::class, 'search'])->name('api.users.search');
Route::middleware($middleware)->post('/api/drafts', [EditorDraftController::class, 'store'])->name('api.drafts.store');
Route::middleware($middleware)->get('/api/drafts/{id?}', [EditorDraftController::class, 'show'])->name('api.drafts.show');
Route::middleware($middleware)->delete('/api/drafts/{id?}', [EditorDraftController::class, 'destroy'])->name('api.drafts.destroy');

// Document API root aliases (Phase 18)
Route::middleware($middleware)->get('/api/documents', [EditorDocumentController::class, 'index'])->name('api.documents.index');
Route::middleware($middleware)->post('/api/documents', [EditorDocumentController::class, 'store'])->name('api.documents.store');
Route::middleware($middleware)->get('/api/documents/{id}', [EditorDocumentController::class, 'show'])->name('api.documents.show');
Route::middleware($middleware)->put('/api/documents/{id}', [EditorDocumentController::class, 'update'])->name('api.documents.update');
Route::middleware($middleware)->delete('/api/documents/{id}', [EditorDocumentController::class, 'destroy'])->name('api.documents.destroy');

// Document Version API root aliases (Phase 19)
Route::middleware($middleware)->get('/api/documents/{id}/versions', [EditorDocumentVersionController::class, 'index'])->name('api.documents.versions.index');
Route::middleware($middleware)->post('/api/documents/{id}/versions', [EditorDocumentVersionController::class, 'store'])->name('api.documents.versions.store');
Route::middleware($middleware)->get('/api/documents/{id}/versions/compare', [EditorDocumentVersionController::class, 'compare'])->name('api.documents.versions.compare');
Route::middleware($middleware)->get('/api/documents/{id}/versions/{versionId}', [EditorDocumentVersionController::class, 'show'])->name('api.documents.versions.show');
Route::middleware($middleware)->post('/api/documents/{id}/versions/{versionId}/restore', [EditorDocumentVersionController::class, 'restore'])->name('api.documents.versions.restore');

// Collaboration root aliases (Phase 20)
Route::middleware($middleware)->get('/api/documents/{id}/comments', [EditorDocumentCommentController::class, 'index'])->name('api.documents.comments.index');
Route::middleware($middleware)->post('/api/documents/{id}/comments', [EditorDocumentCommentController::class, 'store'])->name('api.documents.comments.store');
Route::middleware($middleware)->post('/api/documents/{id}/comments/{commentId}/reply', [EditorDocumentCommentController::class, 'reply'])->name('api.documents.comments.reply');
Route::middleware($middleware)->patch('/api/documents/{id}/comments/{commentId}/resolve', [EditorDocumentCommentController::class, 'resolve'])->name('api.documents.comments.resolve');
Route::middleware($middleware)->patch('/api/documents/{id}/comments/{commentId}/reopen', [EditorDocumentCommentController::class, 'reopen'])->name('api.documents.comments.reopen');
Route::middleware($middleware)->delete('/api/documents/{id}/comments/{commentId}', [EditorDocumentCommentController::class, 'destroy'])->name('api.documents.comments.destroy');
Route::middleware($middleware)->post('/api/documents/{id}/lock', [EditorDocumentLockController::class, 'lock'])->name('api.documents.lock');
Route::middleware($middleware)->post('/api/documents/{id}/heartbeat', [EditorDocumentLockController::class, 'heartbeat'])->name('api.documents.heartbeat');
Route::middleware($middleware)->post('/api/documents/{id}/unlock', [EditorDocumentLockController::class, 'unlock'])->name('api.documents.unlock');
Route::middleware($middleware)->get('/api/documents/{id}/lock-status', [EditorDocumentLockController::class, 'status'])->name('api.documents.lock_status');

// AI Assistant API root alias (Phase 21)
Route::middleware($middleware)->post('/api/ai/generate', [EditorAIController::class, 'generate'])->name('api.ai.generate');

// Theming Engine root alias (Phase 22)
Route::middleware($middleware)->get('/api/theme', [EditorController::class, 'theme'])->name('api.theme');


