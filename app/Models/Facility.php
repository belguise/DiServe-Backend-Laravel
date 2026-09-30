<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    use HasFactory;

    protected $table = 'facilities';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'category',
        'location',
        'capacity',
        'description',
        'address',
        'image',
        'status',
    ];

    protected static function booted()
    {
        static::saving(function ($facility) {
            if (empty($facility->type) && !empty($facility->category)) {
                $facility->type = $facility->category;
            } elseif (empty($facility->category) && !empty($facility->type)) {
                $facility->category = $facility->type;
            }
        });
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function reports()
    {
        return $this->hasMany(DamageReport::class);
    }

    public function damageReports()
    {
        return $this->hasMany(DamageReport::class);
    }

    public function isActive(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['active', 'aktif']);
    }

    public function isMaintenance(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['maintenance', 'dalam perbaikan', 'dalam_perbaikan']);
    }

    public function isInactive(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['inactive', 'nonaktif']);
    }
}
