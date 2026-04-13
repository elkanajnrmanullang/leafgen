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

    public function getRules()
    {
        try {
            $totalData = $this->aprioriService->getTotalTransactions();

            if ($totalData < 80) {
                return response()->json([
                    'success' => true,
                    'is_smart_grid_active' => false,
                    'total_transactions' => $totalData,
                    'message' => 'Grid Cerdas membutuhkan minimal 80 data (Cold Start). Saat ini: ' . $totalData,
                    'rules' => [],
                    'steps' => null
                ]);
            }

            $generationResult = $this->aprioriService->generateRules();
            $steps = is_array($generationResult) && isset($generationResult['steps']) ? $generationResult['steps'] : null;

            if (isset($generationResult['status']) && $generationResult['status'] === false) {
                return response()->json([
                    'success' => true,
                    'is_smart_grid_active' => false,
                    'total_transactions' => $totalData,
                    'message' => 'Data belum cukup valid untuk generate rules.',
                    'rules' => [],
                    'steps' => $steps,
                    'error' => $generationResult['error'] ?? null
                ]);
            }

            $rules = AssociationRule::orderBy('lift_ratio', 'desc')->get()->map(function($rule) {
                return [
                    'rule_id' => $rule->association_rule_id,
                    'antecedent' => $rule->antecedent,
                    'consequent' => $rule->consequent,
                    'support_percent' => number_format($rule->support * 100, 1) . '%',
                    'confidence_percent' => number_format($rule->confidence * 100, 1) . '%',
                    'lift_ratio' => number_format($rule->lift_ratio, 2),
                    'keterangan' => 'Valid (Lift >= 1)'
                ];
            });

            // Beri tahu pengguna jika rules benar-benar kosong karena struktur data
            $message = 'Aturan Apriori berhasil dimuat.';
            if ($rules->isEmpty()) {
                $message = 'Grid aktif. Namun, sistem tidak menemukan adanya minimal 2 produk atau lebih yang digabungkan dalam satu leaflet.';
            }

            return response()->json([
                'success' => true,
                'is_smart_grid_active' => true,
                'total_transactions' => $totalData,
                'message' => $message,
                'rules' => $rules,
                'steps' => $steps
            ]);
        } catch (\Exception $e) {
            Log::error('SmartGrid API Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'is_smart_grid_active' => false,
                'total_transactions' => 0,
                'message' => 'Terjadi kesalahan pada server, gagal memuat aturan.',
                'rules' => [],
                'steps' => null,
                'error_detail' => $e->getMessage()
            ], 200);
        }
    }
}