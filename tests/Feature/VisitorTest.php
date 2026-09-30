<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisitorTest extends TestCase
{
    use RefreshDatabase;

    public function test_us1_visitor_can_view_facilities_without_login(): void
    {
        Facility::create([
            'name' => 'Muladi Dome',
            'slug' => 'muladi-dome',
            'category' => 'Gedung/Aula',
            'location' => 'Lainnya',
            'capacity' => 5000,
            'address' => 'Jl. Prof. Soedarto',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/facilities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'category', 'location', 'capacity', 'address', 'status', 'availability_label']
                ]
            ])
            ->assertJsonFragment(['name' => 'Muladi Dome']);
    }

    public function test_us1_visitor_can_view_availability_slots_without_revealing_requester_or_purpose(): void
    {
        $facility = Facility::create([
            'name' => 'Laboratorium Sentral FK',
            'slug' => 'laboratorium-sentral',
            'category' => 'Laboratorium',
            'location' => 'Lainnya',
            'capacity' => 50,
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => 'Mahasiswa Rahasia',
            'identity_number' => '12345678',
            'email' => 'rahasia@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'aktif',
        ]);

        $today = now()->format('Y-m-d');
        Reservation::create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'start_date' => $today,
            'end_date' => $today,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'start_at' => Carbon::parse("{$today} 08:00:00"),
            'end_at' => Carbon::parse("{$today} 10:00:00"),
            'purpose' => 'Rapat Rahasia Organisasi Sangat Rahasia',
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/facilities/{$facility->id}/availability?date={$today}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'facility' => ['id', 'name', 'category', 'location', 'capacity', 'status'],
                'date',
                'slots' => [
                    '*' => ['time', 'start', 'end', 'status', 'status_label']
                ]
            ]);

        // CRUCIAL PRIVACY CHECK: Visitor must NOT see applicant name or purpose
        $content = $response->getContent();
        $this->assertStringNotContainsString('Mahasiswa Rahasia', $content);
        $this->assertStringNotContainsString('Rapat Rahasia Organisasi Sangat Rahasia', $content);
        $this->assertStringNotContainsString('rahasia@students.undip.ac.id', $content);
    }

    public function test_us2_visitor_can_search_and_filter_facilities(): void
    {
        Facility::create([
            'name' => 'Muladi Dome',
            'category' => 'Gedung/Aula',
            'location' => 'Lainnya',
            'capacity' => 5000,
            'status' => 'active',
        ]);

        Facility::create([
            'name' => 'Lab Komputer FSM',
            'category' => 'Laboratorium',
            'location' => 'FSM',
            'capacity' => 40,
            'status' => 'active',
        ]);

        // Filter by keyword
        $resKeyword = $this->getJson('/api/facilities?search=Komputer');
        $resKeyword->assertStatus(200)
            ->assertJsonFragment(['name' => 'Lab Komputer FSM'])
            ->assertJsonMissing(['name' => 'Muladi Dome']);

        // Filter by location
        $resLocation = $this->getJson('/api/facilities?location=FSM');
        $resLocation->assertStatus(200)
            ->assertJsonFragment(['name' => 'Lab Komputer FSM'])
            ->assertJsonMissing(['name' => 'Muladi Dome']);

        // Filter by capacity range
        $resCap = $this->getJson('/api/facilities?capacity=0-50');
        $resCap->assertStatus(200)
            ->assertJsonFragment(['name' => 'Lab Komputer FSM'])
            ->assertJsonMissing(['name' => 'Muladi Dome']);
    }

    public function test_visitor_cannot_create_reservation_without_login(): void
    {
        $response = $this->postJson('/api/reservations', [
            'facility' => 1,
            'start_date' => now()->addDays(1)->format('Y-m-d'),
            'end_date' => now()->addDays(1)->format('Y-m-d'),
            'start_time' => '08:00',
            'end_time' => '10:00',
            'purpose' => 'Tanpa login',
        ]);

        $response->assertStatus(401);
    }
}
