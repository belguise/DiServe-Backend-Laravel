<?php

namespace App\Http\Controllers;

use App\Models\DamageReport;
use App\Models\Facility;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PetugasController extends Controller
{
    /**
     * Dashboard data for Petugas (US 8).
     */
    public function dashboard(Request $request): JsonResponse
    {
        Reservation::expirePassedPendingReservations();
        $pendingReservations = Reservation::whereIn('status', ['pending', 'menunggu', 'Menunggu'])->count();
        $newReports = DamageReport::whereIn('status', ['baru', 'new', 'Baru'])->count();
        $processingReports = DamageReport::whereIn('status', ['diproses', 'processing', 'Diproses'])->count();
        $maintenanceFacilities = Facility::whereIn('status', ['maintenance', 'dalam perbaikan', 'dalam_perbaikan', 'Dalam Perbaikan'])->count();

        // Queue: pending reservations
        $queue = Reservation::with(['user', 'facility'])
            ->whereIn('status', ['pending', 'menunggu', 'Menunggu'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Damage reports
        $reports = DamageReport::with(['user', 'facility'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Facilities list for maintenance tab
        $facilities = Facility::orderBy('name', 'asc')->get();

        return response()->json([
            'stats' => [
                'pending_queue' => $pendingReservations,
                'new_reports' => $newReports,
                'processing_reports' => $processingReports,
                'maintenance_facilities' => $maintenanceFacilities,
            ],
            'queue' => $queue,
            'reports' => $reports,
            'facilities' => $facilities,
        ]);
    }
}
