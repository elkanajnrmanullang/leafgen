<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/cors-assets/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!File::exists($fullPath)) {
        abort(404);
    }

    $file = File::get($fullPath);
    $type = File::mimeType($fullPath);

    return Response::make($file, 200, [
        'Content-Type' => $type,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => '*',
        'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
