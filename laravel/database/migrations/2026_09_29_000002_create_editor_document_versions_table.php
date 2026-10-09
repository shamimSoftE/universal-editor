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
        $documentsTable = config('editor.database.table', 'editor_documents');
        $versionsTable = config('editor.database.versions_table', 'editor_document_versions');

        if (!Schema::hasTable($versionsTable)) {
            Schema::create($versionsTable, function (Blueprint $table) use ($documentsTable) {
                $table->id();
                $table->unsignedBigInteger('document_id');
                $table->unsignedInteger('version')->default(1);
                $table->string('title', 255)->nullable();
                $table->text('note')->nullable();
                $table->longText('content_html')->nullable();
                $table->json('content_json')->nullable();
                $table->unsignedInteger('word_count')->default(0);
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamp('created_at')->nullable();

                // Foreign key referencing documents table
                $table->foreign('document_id')
                    ->references('id')
                    ->on($documentsTable)
                    ->onDelete('cascade');

                // Performance & integrity indexes
                $table->index(['document_id', 'version']);
                $table->index(['document_id', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $versionsTable = config('editor.database.versions_table', 'editor_document_versions');
        Schema::dropIfExists($versionsTable);
    }
};
