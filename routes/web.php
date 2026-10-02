<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

// Clean friendly web routes for each HTML page
$pages = [
    'login',
    'register',
    'forgotpw',
    'dashboard',
    'reservation',
    'reservations',
    'report',
    'petugas',
    'admin',
    'reset-password',
];

foreach ($pages as $page) {
    Route::get('/' . $page, function () use ($page) {
        return response()->file(public_path($page . '.html'));
    });
}
