<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BadgeGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BadgeController extends Controller
{
    protected $badgeService;

    public function __construct(BadgeGeneratorService $badgeService)
    {
        $this->badgeService = $badgeService;
    }

    public function generate(Request $request)
    {
        $request->validate([
            'component_name' => 'required|string',
            'background_name' => 'nullable|string',
            'data' => 'required|array',
        ]);

        try {
            $customBackground = $request->input('background_name');

            $imageUrl = $this->badgeService->generate(
                $request->component_name,
                $request->data,
                $customBackground
            );

            if (!$imageUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template JSON atau Background tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $imageUrl
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Badge Generation Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat badge: ' . $e->getMessage(),
            ], 500);
        }
    }
}