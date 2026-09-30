<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->string('category', 100);
            $table->string('location_detail')->nullable();
            $table->text('description');
            $table->string('photo')->nullable();
            $table->string('status', 50)->default('Baru'); // Baru/baru, Diproses/diproses, Selesai/selesai, Ditolak/ditolak
            $table->text('resolution_note')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamps();
        });

        try {
            DB::statement('CREATE VIEW damage_reports AS SELECT * FROM reports');
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        try {
            DB::statement('DROP VIEW IF EXISTS damage_reports');
        } catch (\Throwable $e) {}
        Schema::dropIfExists('reports');
    }
};
