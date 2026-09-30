<?php

namespace Tests\Feature;

use App\Models\DamageReport;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetugasTest extends TestCase
{
    use RefreshDatabase;

    private User $petugas;
    private User $user;
    private Facility $facility;

    protected function setUp(): void
    {
        parent::setUp();

        $this->petugas = User::create([
            'name' => 'Arif Pratama',
            'identity_number' => '198803112014021004',
            'email' => 'arif@facility.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'petugas',
            'status' => 'aktif',
        ]);

        $this->user = User::create([
            'name' => 'Husni Ulyaa',
            'identity_number' => '24060124120021',
            'email' => 'husni@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'aktif',
        ]);

        $this->facility = Facility::create([
            'name' => 'Muladi Dome',
            'slug' => 'muladi-dome',
            'category' => 'Gedung/Aula',
            'location' => 'Lainnya',
            'capacity' => 5000,
            'status' => 'active',
        ]);
    }

    public function test_us8_petugas_dashboard_returns_metrics_and_queue(): void
    {
        $token = $this->petugas->createToken('petugas')->plainTextToken;

        $targetDate = now()->addDays(3)->format('Y-m-d');
        Reservation::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'start_at' => Carbon::parse("{$targetDate} 08:00:00"),
            'end_at' => Carbon::parse("{$targetDate} 10:00:00"),
            'purpose' => 'Seminar Petugas',
            'status' => 'pending',
        ]);

        DamageReport::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'category' => 'Kelistrikan',
            'location_detail' => 'Lantai 1',
            'description' => 'Lampu padam',
            'status' => 'baru',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/petugas/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'stats' => ['pending_queue', 'new_reports', 'processing_reports', 'maintenance_facilities'],
                'queue',
                'reports',
                'facilities'
            ])
            ->assertJsonPath('stats.pending_queue', 1)
            ->assertJsonPath('stats.new_reports', 1);
    }

    public function test_us9_petugas_can_approve_reservation(): void
    {
        $targetDate = now()->addDays(3)->format('Y-m-d');
        $res = Reservation::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'start_at' => Carbon::parse("{$targetDate} 08:00:00"),
            'end_at' => Carbon::parse("{$targetDate} 10:00:00"),
            'purpose' => 'Seminar UI/UX',
            'status' => 'pending',
        ]);

        $token = $this->petugas->createToken('petugas')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/reservations/{$res->id}/approve");

        $response->assertStatus(200);
        $this->assertEquals('approved', $res->fresh()->status);
    }

    public function test_us9_petugas_can_reject_reservation_with_reason(): void
    {
        $targetDate = now()->addDays(3)->format('Y-m-d');
        $res = Reservation::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'start_at' => Carbon::parse("{$targetDate} 08:00:00"),
            'end_at' => Carbon::parse("{$targetDate} 10:00:00"),
            'purpose' => 'Seminar UI/UX',
            'status' => 'pending',
        ]);

        $token = $this->petugas->createToken('petugas')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/reservations/{$res->id}/reject", [
                'reason' => 'Jadwal bertabrakan dengan agenda universitas.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('rejected', $res->fresh()->status);
        $this->assertEquals('Jadwal bertabrakan dengan agenda universitas.', $res->fresh()->rejection_reason);
    }

    public function test_us10_petugas_can_emergency_cancel_approved_reservation(): void
    {
        $targetDate = now()->addDays(3)->format('Y-m-d');
        $res = Reservation::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'start_at' => Carbon::parse("{$targetDate} 08:00:00"),
            'end_at' => Carbon::parse("{$targetDate} 10:00:00"),
            'purpose' => 'Seminar Penting',
            'status' => 'approved',
        ]);

        $token = $this->petugas->createToken('petugas')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/reservations/{$res->id}/emergency-cancel", [
                'reason' => 'Gedung dialihkan secara mendadak untuk kegiatan rektorat.',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $res->fresh()->status);
        $this->assertEquals('Gedung dialihkan secara mendadak untuk kegiatan rektorat.', $res->fresh()->cancellation_reason);
    }

    public function test_us11_petugas_updates_damage_report_statuses(): void
    {
        $report = DamageReport::create([
            'user_id' => $this->user->id,
            'facility_id' => $this->facility->id,
            'category' => 'KELISTRIKAN',
            'location_detail' => 'Ruang 203',
            'description' => 'Stop kontak rusak',
            'status' => 'baru',
        ]);

        $token = $this->petugas->createToken('petugas')->plainTextToken;

        // 1. Process
        $resProcess = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/damage-reports/{$report->id}/status", [
                'status' => 'diproses',
            ]);
        $resProcess->assertStatus(200);
        $this->assertEquals('diproses', $report->fresh()->status);

        // 2. Resolve (requires resolution_note)
        $resResolve = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/damage-reports/{$report->id}/status", [
                'status' => 'selesai',
                'resolution_note' => 'Perbaikan instalasi kabel dan penggantian stop kontak telah selesai.',
            ]);
        $resResolve->assertStatus(200);
        $this->assertEquals('selesai', $report->fresh()->status);
        $this->assertNotNull($report->fresh()->resolution_note);
    }

    public function test_us12_petugas_toggles_maintenance_mode(): void
    {
        $token = $this->petugas->createToken('petugas')->plainTextToken;

        // Set to maintenance
        $resMaint = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/facilities/{$this->facility->id}/maintenance");

        $resMaint->assertStatus(200);
        $this->assertEquals('maintenance', $this->facility->fresh()->status);

        // Set back to active
        $resActive = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/petugas/facilities/{$this->facility->id}/maintenance");

        $resActive->assertStatus(200);
        $this->assertEquals('active', $this->facility->fresh()->status);
    }
}
