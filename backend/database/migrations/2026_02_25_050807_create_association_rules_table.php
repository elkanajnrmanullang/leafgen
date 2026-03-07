<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('association_rules', function (Blueprint $table) {
            $table->id();
            $table->string('antecedent');
            $table->string('consequent');
            $table->decimal('support', 5, 4);
            $table->decimal('confidence', 5, 4);
            $table->decimal('lift_ratio', 8, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('association_rules');
    }
};