<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DamageReport extends Model
{
    use HasFactory;

    protected $table = 'reports';

    protected $fillable = [
        'user_id',
        'facility_id',
        'category',
        'location_detail',
        'description',
        'photo',
        'status',
        'resolution_note',
        'reject_reason',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function isBaru(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['baru', 'new']);
    }

    public function isDiproses(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['diproses', 'processing']);
    }

    public function isSelesai(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['selesai', 'completed']);
    }

    public function isDitolak(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['ditolak', 'rejected']);
    }
}
