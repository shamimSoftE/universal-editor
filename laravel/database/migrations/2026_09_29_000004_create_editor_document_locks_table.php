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
        $locksTable = config('editor.database.locks_table', 'editor_document_locks');

        if (!Schema::hasTable($locksTable)) {
            Schema::create($locksTable, function (Blueprint $table) use ($documentsTable) {
                $table->id();
                $table->unsignedBigInteger('document_id')->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('user_name', 120)->nullable();
                $table->string('user_avatar', 255)->nullable();
                $table->timestamp('locked_at');
                $table->timestamp('expires_at')->index();
                $table->timestamp('heartbeat_at')->nullable();
                $table->timestamps();

                // Foreign key referencing documents table
                $table->foreign('document_id')
                    ->references('id')
                    ->on($documentsTable)
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $locksTable = config('editor.database.locks_table', 'editor_document_locks');
        Schema::dropIfExists($locksTable);
    }
};
