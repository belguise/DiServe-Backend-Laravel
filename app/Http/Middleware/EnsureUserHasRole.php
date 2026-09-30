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

        $userRole = strtolower($user->role ?? '');
        $normalizedUserRole = in_array($userRole, ['user', 'pengguna']) ? 'pengguna' : $userRole;
        $normalizedAllowedRoles = array_map(function ($r) {
            $lr = strtolower($r);
            return in_array($lr, ['user', 'pengguna']) ? 'pengguna' : $lr;
        }, $roles);

        // Admins can also access officer/petugas endpoints if needed
        if ($userRole === 'admin' && in_array('petugas', $normalizedAllowedRoles)) {
            return $next($request);
        }

        if (!in_array($normalizedUserRole, $normalizedAllowedRoles)) {
            return response()->json([
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
            ], 403);
        }

        return $next($request);
    }
}
