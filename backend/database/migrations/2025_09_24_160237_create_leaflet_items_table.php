<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaflet_items', function (Blueprint $table) {
            $table->id('leaflet_item_id');
            $table->foreignId('leaflet_id')->constrained('leaflets', 'leaflet_id')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products', 'product_id')->onDelete('cascade');
            $table->string('product_name');
            $table->integer('position_x');
            $table->integer('position_y');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaflet_items');
    }
};