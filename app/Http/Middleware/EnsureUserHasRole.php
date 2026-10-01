<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Akun belum aktif atau telah dinonaktifkan.',
            ], 403);
        }

        $userRole = strtolower(trim($user->role ?? ''));
        $normalizedUserRole = in_array($userRole, ['user', 'pengguna']) ? 'pengguna' : $userRole;

        $allowedRoles = [];
        foreach ($roles as $r) {
            foreach (explode(',', $r) as $part) {
                $trimmed = strtolower(trim($part));
                if ($trimmed !== '') {
                    $allowedRoles[] = in_array($trimmed, ['user', 'pengguna']) ? 'pengguna' : $trimmed;
                }
            }
        }

        // Admin has superuser privileges across all system operations
        if ($userRole === 'admin') {
            return $next($request);
        }

        if (!in_array($normalizedUserRole, $allowedRoles)) {
            return response()->json([
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
            ], 403);
        }

        return $next($request);
    }
}
