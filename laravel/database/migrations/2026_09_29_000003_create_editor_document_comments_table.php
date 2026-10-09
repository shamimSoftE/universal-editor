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
        $commentsTable = config('editor.database.comments_table', 'editor_document_comments');

        if (!Schema::hasTable($commentsTable)) {
            Schema::create($commentsTable, function (Blueprint $table) use ($documentsTable, $commentsTable) {
                $table->id();
                $table->unsignedBigInteger('document_id');
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('user_name', 120)->nullable();
                $table->string('user_avatar', 255)->nullable();
                $table->unsignedBigInteger('parent_id')->nullable()->index();
                $table->text('selected_text')->nullable();
                $table->integer('from_pos')->nullable();
                $table->integer('to_pos')->nullable();
                $table->text('content');
                $table->string('status', 32)->default('active')->index(); // 'active', 'resolved'
                $table->unsignedBigInteger('resolved_by')->nullable()->index();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();

                // Foreign key referencing documents table
                $table->foreign('document_id')
                    ->references('id')
                    ->on($documentsTable)
                    ->onDelete('cascade');

                // Foreign key for threaded replies
                $table->foreign('parent_id')
                    ->references('id')
                    ->on($commentsTable)
                    ->onDelete('cascade');

                // Performance & filtering indexes
                $table->index(['document_id', 'status']);
                $table->index(['document_id', 'parent_id']);
                $table->index(['document_id', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $commentsTable = config('editor.database.comments_table', 'editor_document_comments');
        Schema::dropIfExists($commentsTable);
    }
};
