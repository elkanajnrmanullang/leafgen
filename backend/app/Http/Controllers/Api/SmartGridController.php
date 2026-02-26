<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssociationRule;
use App\Services\AprioriService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SmartGridController extends Controller
{
    protected $aprioriService;

    public function __construct(AprioriService $aprioriService)
    {
        $this->aprioriService = $aprioriService;
    }

    public function getRules(Request $request)
    {
        try {
            $region = $request->query('region');
            $totalData = $this->aprioriService->getTotalTransactions($region);

            $generationResult = $this->aprioriService->generateRules($region);
            $steps = is_array($generationResult) && isset($generationResult['steps']) ? $generationResult['steps'] : null;

            $rules = AssociationRule::orderBy('lift_ratio', 'desc')->get()->map(function($rule) {
                return [
                    'rule_id' => $rule->id,
                    'antecedent' => $rule->antecedent,
                    'consequent' => $rule->consequent,
                    'support_percent' => number_format($rule->support * 100, 1) . '%',
                    'confidence_percent' => number_format($rule->confidence * 100, 1) . '%',
                    'lift_ratio' => number_format($rule->lift_ratio, 2),
                    'keterangan' => 'Valid (Lift >= 1)'
                ];
            });

            return response()->json([
                'success' => true,
                'is_smart_grid_active' => true,
                'total_transactions' => $totalData,
                'message' => 'Aturan Apriori berhasil dimuat.',
                'rules' => $rules,
                'steps' => $steps
            ]);
        } catch (\Exception $e) {
            Log::error('SmartGrid API Error: ' . $e->getMessage());

            $totalFallback = 0;
            try {
                $totalFallback = \App\Models\Leaflet::where('status', 'exported')->count();
            } catch (\Exception $e2) {
            }

            return response()->json([
                'success' => true,
                'is_smart_grid_active' => true,
                'total_transactions' => $totalFallback,
                'message' => 'Terjadi kesalahan pada server, memuat aturan kosong.',
                'rules' => [],
                'steps' => null,
                'error_detail' => $e->getMessage()
            ], 200);
        }
    }
}
