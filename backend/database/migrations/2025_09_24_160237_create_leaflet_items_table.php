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
    Schema::create('leaflet_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('leaflet_id')->constrained('leaflets')->onDelete('cascade');
        $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
        $table->decimal('display_price', 10, 2);
        $table->decimal('strikethrough_price', 10, 2)->nullable();
        $table->integer('position_x');
        $table->integer('position_y');
        $table->json('custom_styles')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaflet_items');
    }
};