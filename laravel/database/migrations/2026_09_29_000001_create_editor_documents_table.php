<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableName = config('editor.database.table', 'editor_documents');

        if (!Schema::hasTable($tableName)) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('title', 255);
                $table->longText('content_html')->nullable();
                $table->json('content_json')->nullable();
                $table->string('status', 32)->default('draft')->index(); // draft, published, archived
                $table->unsignedInteger('version')->default(1);
                $table->timestamps();

                // Composite indexes for performance
                $table->index(['user_id', 'status']);
                $table->index(['status', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableName = config('editor.database.table', 'editor_documents');
        Schema::dropIfExists($tableName);
    }
};
