<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

class MediaController extends Controller
{
    public function show($path)
    {
        // Pastikan path mengarah ke storage/app/public
        $fullPath = storage_path('app/public/' . $path);

        if (!File::exists($fullPath)) {
            abort(404, 'File not found');
        }

        $file = File::get($fullPath);
        $type = File::mimeType($fullPath);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        // Header CORS Kritis untuk html2canvas
        $response->header("Access-Control-Allow-Origin", "*");
        $response->header("Access-Control-Allow-Methods", "GET, OPTIONS");
        $response->header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

        // Cache agar performa tetap cepat
        $response->header("Cache-Control", "public, max-age=3600");

        return $response;
    }
}
