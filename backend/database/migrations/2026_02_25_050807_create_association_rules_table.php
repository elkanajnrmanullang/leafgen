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
        Schema::create('association_rules', function (Blueprint $table) {
            $table->id();
            $table->string('antecedent');
            $table->string('consequent');

            // Metrik Algoritma Apriori
            $table->decimal('support', 5, 4);      // Nilai dari 0.0000 - 1.0000 (Persentase kemunculan bersama)
            $table->decimal('confidence', 5, 4);   // Nilai dari 0.0000 - 1.0000 (Kekuatan hubungan searah)
            $table->decimal('lift_ratio', 8, 4);   // Jika > 1 berarti hubungan kuat/valid

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('association_rules');
    }
};
