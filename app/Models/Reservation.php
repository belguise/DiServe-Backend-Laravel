<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $table = 'reservations';

    protected $fillable = [
        'user_id',
        'facility_id',
        'reservation_date',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'start_at',
        'end_at',
        'purpose',
        'supporting_file',
        'status',
        'rejection_reason',
        'cancellation_reason',
        'cancelled_by',
        'cancellation_deadline',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'cancellation_deadline' => 'datetime',
        ];
    }

    protected static function booted()
    {
        static::saving(function ($reservation) {
            if (empty($reservation->reservation_date) && !empty($reservation->start_date)) {
                $reservation->reservation_date = $reservation->start_date;
            } elseif (empty($reservation->start_date) && !empty($reservation->reservation_date)) {
                $reservation->start_date = $reservation->reservation_date;
                $reservation->end_date = $reservation->reservation_date;
            }

            if (empty($reservation->end_date) && !empty($reservation->start_date)) {
                $reservation->end_date = $reservation->start_date;
            }

            if (empty($reservation->start_at) && !empty($reservation->start_date) && !empty($reservation->start_time)) {
                $dateStr = is_string($reservation->start_date) ? $reservation->start_date : $reservation->start_date->format('Y-m-d');
                $reservation->start_at = \Carbon\Carbon::parse($dateStr . ' ' . $reservation->start_time);
            }

            if (empty($reservation->end_at) && !empty($reservation->end_date) && !empty($reservation->end_time)) {
                $dateStr = is_string($reservation->end_date) ? $reservation->end_date : $reservation->end_date->format('Y-m-d');
                $reservation->end_at = \Carbon\Carbon::parse($dateStr . ' ' . $reservation->end_time);
            }

            if (empty($reservation->cancellation_deadline) && !empty($reservation->start_at)) {
                $reservation->cancellation_deadline = (clone $reservation->start_at)->subDay();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function isPending(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['pending', 'menunggu']);
    }

    public function isApproved(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['approved', 'disetujui']);
    }

    public function isRejected(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['rejected', 'ditolak']);
    }

    public function isCancelled(): bool
    {
        return in_array(strtolower($this->status ?? ''), ['cancelled', 'dibatalkan']);
    }

    public static function expirePassedPendingReservations(): int
    {
        $now = now();

        return static::whereIn('status', ['pending', 'menunggu'])
            ->where(function ($query) use ($now) {
                $query->where(function ($q) use ($now) {
                    $q->whereNotNull('start_at')->where('start_at', '<=', $now);
                })->orWhere(function ($q) use ($now) {
                    $q->whereNull('start_at')
                        ->whereNotNull('start_date')
                        ->whereNotNull('start_time')
                        ->where(function ($dateQuery) use ($now) {
                            $dateQuery->whereDate('start_date', '<', $now->toDateString())
                                ->orWhere(function ($sameDayQuery) use ($now) {
                                    $sameDayQuery->whereDate('start_date', $now->toDateString())
                                        ->whereTime('start_time', '<=', $now->format('H:i:s'));
                                });
                        });
                });
            })
            ->update([
                'status' => 'rejected',
                'rejection_reason' => 'Reservasi otomatis ditolak karena belum disetujui hingga waktu mulai terlewati.',
            ]);
    }

    public function isCancellable(): bool
    {
        if (!in_array(strtolower($this->status ?? ''), ['pending', 'menunggu', 'approved', 'disetujui'])) {
            return false;
        }

        $deadline = $this->cancellation_deadline ?: ($this->start_at ? $this->start_at->copy()->subDay() : null);
        if ($deadline && now()->isAfter($deadline)) {
            return false;
        }

        return true;
    }
}
