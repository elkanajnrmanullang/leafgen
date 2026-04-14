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
        $filename = basename($path);

        $possiblePaths = [
            storage_path('app/public/' . $filename),

            storage_path('app/public/assets/templates/' . $filename),
            storage_path('app/public/templates/' . $filename),

            storage_path('app/master_templates/' . $filename),
            storage_path('app/master_templates/assets/' . $filename),

            public_path('assets/' . $filename),
            public_path('assets/templates/' . $filename),
            public_path('assets/components/' . $filename),

            storage_path('app/public/temp/badges/' . $filename),

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
            return response()->json(['error' => 'File not found on server', 'searched_for' => $filename], 404);
        }

        $file = File::get($foundPath);
        $type = File::mimeType($foundPath);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        $response->header("Access-Control-Allow-Origin", "*");
        $response->header("Access-Control-Allow-Methods", "GET, OPTIONS");
        $response->header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

        $response->header("Cache-Control", "public, max-age=3600");

        return $response;
    }
}