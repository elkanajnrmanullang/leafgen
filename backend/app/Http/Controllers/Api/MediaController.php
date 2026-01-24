<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    public function show($path)
    {
        // Ambil nama file saja, abaikan folder path yang dikirim dari frontend
        // Contoh: 'assets/templates/gambar.png' menjadi 'gambar.png'
        $filename = basename($path);

        // Daftar semua folder kemungkinan tempat file berada
        $possiblePaths = [
            // 1. Cek folder upload public storage standar
            storage_path('app/public/' . $filename),

            // 2. Cek folder templates spesifik di storage
            storage_path('app/public/assets/templates/' . $filename),
            storage_path('app/public/templates/' . $filename),

            // 3. Cek folder master_templates (dari BadgeGeneratorService)
            storage_path('app/master_templates/' . $filename),
            storage_path('app/master_templates/assets/' . $filename),

            // 4. Cek folder assets bawaan Laravel (public/assets)
            public_path('assets/' . $filename),
            public_path('assets/templates/' . $filename),
            public_path('assets/components/' . $filename),

            // 5. Cek folder temp badges
            storage_path('app/public/temp/badges/' . $filename),

            // 6. Cek path asli jika user mengirim path lengkap
            storage_path('app/public/' . $path),
            public_path($path),
        ];

        $foundPath = null;

        foreach ($possiblePaths as $candidate) {
            if (File::exists($candidate)) {
                $foundPath = $candidate;
                break;
            }
        }

        if (!$foundPath) {
            Log::error("MediaController: File not found. Searched for: {$filename}");
            // Return 404 tapi dengan format JSON biar jelas kalau diakses via API
            return response()->json(['error' => 'File not found on server', 'searched_for' => $filename], 404);
        }

        $file = File::get($foundPath);
        $type = File::mimeType($foundPath);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        // Header CORS Lengkap untuk html2canvas
        $response->header("Access-Control-Allow-Origin", "*");
        $response->header("Access-Control-Allow-Methods", "GET, OPTIONS");
        $response->header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

        // Cache browser selama 1 jam
        $response->header("Cache-Control", "public, max-age=3600");

        return $response;
    }
}
