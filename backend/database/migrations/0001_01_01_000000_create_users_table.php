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
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('username')->unique(); // Tambahan
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->enum('role', ['manager', 'staff']); // Tambahan
        $table->enum('status', ['active', 'inactive'])->default('active'); // Tambahan
        $table->timestamp('password_changed_at')->nullable(); // Tambahan
        $table->rememberToken();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};