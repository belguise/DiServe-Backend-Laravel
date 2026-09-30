<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('facility_id')->constrained('facilities')->cascadeOnDelete();
            $table->date('reservation_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('start_time', 10);
            $table->string('end_time', 10);
            $table->dateTime('start_at')->nullable()->index();
            $table->dateTime('end_at')->nullable()->index();
            $table->text('purpose');
            $table->string('supporting_file')->nullable();
            $table->string('status', 50)->default('menunggu'); // menunggu/pending, disetujui/approved, ditolak/rejected, dibatalkan/cancelled
            $table->text('rejection_reason')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('cancelled_by')->nullable(); // user, petugas, admin
            $table->dateTime('cancellation_deadline')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
