<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssociationRule;
use App\Models\Leaflet;
use App\Services\AprioriService;
use Illuminate\Http\Request;

class SmartGridController extends Controller
{
    protected $aprioriService;

    public function __construct(AprioriService $aprioriService)
    {
        $this->aprioriService = $aprioriService;
    }

    public function getRules()
    {
        $status = $this->aprioriService->checkSystemStatus();

        if (!$status['is_ready']) {
            return response()->json([
                'success' => false,
                'is_smart_grid_active' => false,
                'total_transactions' => $status['total_data'],
                'message' => $status['message'],
                'rules' => []
            ]);
        }

        $this->aprioriService->generateRules();

        $rules = AssociationRule::orderBy('lift_ratio', 'desc')->get()->map(function($rule) {
            return [
                'rule_id' => $rule->id,
                'antecedent' => $rule->antecedent,
                'consequent' => $rule->consequent,
                'support_percent' => number_format($rule->support * 100, 1) . '%',
                'confidence_percent' => number_format($rule->confidence * 100, 1) . '%',
                'lift_ratio' => number_format($rule->lift_ratio, 2),
                'keterangan' => 'Valid (Lift > 1)'
            ];
        });

        return response()->json([
            'success' => true,
            'is_smart_grid_active' => true,
            'total_transactions' => $status['total_data'],
            'message' => 'Aturan Apriori berhasil dimuat.',
            'rules' => $rules
        ]);
    }
}
