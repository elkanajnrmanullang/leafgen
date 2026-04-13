<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaflets', function (Blueprint $table) {
            $table->id('leaflet_id');
            $table->string('leaflet_name')->nullable();
            $table->string('region')->nullable();
            $table->json('content')->nullable();
            $table->enum('leaflet_status', ['completed', 'draft'])->default('draft');
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaflets');
    }
};