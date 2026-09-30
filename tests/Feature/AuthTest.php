<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name' => 'Husni Ulyaa',
            'identity_number' => '24060124120021',
            'email' => 'husni@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'aktif',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'husni@students.undip.ac.id',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'token_type',
                'user' => ['id', 'name', 'identity_number', 'email', 'role', 'status']
            ])
            ->assertJsonPath('user.role', 'user'); // Ensures frontend login.js switch case succeeds
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::create([
            'name' => 'Husni Ulyaa',
            'email' => 'husni@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'aktif',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'husni@students.undip.ac.id',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401)
            ->assertJsonFragment(['message' => 'Email atau password salah.']);
    }

    public function test_pending_or_inactive_user_cannot_login(): void
    {
        User::create([
            'name' => 'Pending User',
            'email' => 'pending@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'pending@students.undip.ac.id',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403);
    }

    public function test_self_registration_creates_pending_pengguna_and_prevents_privilege_escalation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa Baru',
            'identity_number' => '24060124111111',
            'email' => 'maba@students.undip.ac.id',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            // Malicious user attempts to inject role admin:
            'role' => 'admin',
            'status' => 'aktif',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'maba@students.undip.ac.id')->first();
        $this->assertNotNull($user);
        // Ensure role is ALWAYS 'pengguna' and status is ALWAYS 'pending'
        $this->assertEquals('pengguna', $user->role);
        $this->assertEquals('pending', $user->status);
    }

    public function test_self_registration_rejects_non_undip_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Public User',
            'identity_number' => '12345678',
            'email' => 'public@gmail.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_get_profile_and_logout(): void
    {
        $user = User::create([
            'name' => 'Husni Ulyaa',
            'identity_number' => '24060124120021',
            'email' => 'husni@students.undip.ac.id',
            'password' => bcrypt('Password123!'),
            'role' => 'pengguna',
            'status' => 'aktif',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'husni@students.undip.ac.id');

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200);

        // Token should be revoked
        $this->assertCount(0, $user->fresh()->tokens);
    }
}
