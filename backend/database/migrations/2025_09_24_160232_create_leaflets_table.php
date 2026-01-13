<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaflets', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('store_name')->nullable();
            $table->longText('content')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaflets');
    }
};
