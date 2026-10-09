<?php

namespace UniversalEditor\Laravel;

use Illuminate\Support\ServiceProvider;

/**
 * Universal Editor Service Provider
 *
 * Official Laravel integration provider for Universal Rich Text Editor.
 */
class EditorServiceProvider extends ServiceProvider
{
    /**
     * Register any package services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/editor.php', 'editor');

        $this->app->singleton('universal-editor', function ($app) {
            return new \UniversalEditor\Laravel\Security\ContentSanitizer();
        });

        $this->app->alias('universal-editor', \UniversalEditor\Laravel\Security\ContentSanitizer::class);

        $this->app->singleton(\UniversalEditor\Laravel\Services\EditorDocumentService::class, function ($app) {
            return new \UniversalEditor\Laravel\Services\EditorDocumentService();
        });

        $this->app->singleton(\UniversalEditor\Laravel\Services\EditorDocumentVersionService::class, function ($app) {
            return new \UniversalEditor\Laravel\Services\EditorDocumentVersionService();
        });
    }

    /**
     * Bootstrap package services, routes, and publishables.
     */
    public function boot(): void
    {
        // Load package migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Publish configuration file
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/editor.php' => config_path('editor.php'),
            ], 'editor-config');

            // Publish migrations when available
            if (is_dir(__DIR__ . '/../database/migrations')) {
                $this->publishes([
                    __DIR__ . '/../database/migrations' => database_path('migrations'),
                ], 'editor-migrations');
            }
        }

        // Register package routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
    }
}
