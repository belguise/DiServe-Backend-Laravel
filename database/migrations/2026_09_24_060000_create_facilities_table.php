<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('type', 50)->nullable();
            $table->string('category', 50)->nullable();
            $table->string('slug', 150)->nullable()->unique();
            $table->string('location', 50);
            $table->integer('capacity');
            $table->text('description')->nullable();
            $table->text('address')->nullable();
            $table->string('image', 255)->nullable();
            $table->string('status', 50)->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
