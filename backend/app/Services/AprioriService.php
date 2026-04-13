<?php

namespace App\Services;

use App\Models\Leaflet;
use App\Models\AssociationRule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AprioriService
{
    private $min_support = 0.01;
    private $min_confidence = 0.1;

    public function getTotalTransactions()
    {
        return Leaflet::whereIn('leaflet_status', ['completed', 'exported'])->count();
    }

    public function generateRules()
    {
        try {
            $transactions = [];
            $rulesCalc = [];

            $leafletItems = DB::table('leaflet_items')
                ->join('leaflets', 'leaflet_items.leaflet_id', '=', 'leaflets.leaflet_id')
                ->whereIn('leaflets.leaflet_status', ['completed', 'exported'])
                ->select('leaflet_items.leaflet_id', 'leaflet_items.product_name')
                ->get();

            foreach ($leafletItems as $item) {
                if (!empty($item->product_name)) {
                    $productName = trim(strtoupper($item->product_name));
                    $transactions[$item->leaflet_id][] = $productName;
                }
            }

            $totalTransactions = count($transactions);

            if ($totalTransactions < 80) {
                return [
                    'status' => false,
                    'steps' => [
                        'rules_calculation' => [],
                        'min_support' => $this->min_support,
                        'min_confidence' => $this->min_confidence,
                        'valid_count' => $totalTransactions
                    ]
                ];
            }

            $itemCounts = [];
            foreach ($transactions as $transaction) {
                $unique_items = array_values(array_unique($transaction));
                foreach ($unique_items as $item) {
                    if (!isset($itemCounts[$item])) $itemCounts[$item] = 0;
                    $itemCounts[$item]++;
                }
            }

            $pairCounts = [];
            foreach ($transactions as $transaction) {
                $items = array_values(array_unique($transaction));
                $count = count($items);

                for ($i = 0; $i < $count; $i++) {
                    for ($j = $i + 1; $j < $count; $j++) {
                        $pair = [$items[$i], $items[$j]];
                        sort($pair);
                        $pairKey = implode(' & ', $pair);

                        if (!isset($pairCounts[$pairKey])) $pairCounts[$pairKey] = 0;
                        $pairCounts[$pairKey]++;
                    }
                }
            }

            DB::table('association_rules')->truncate();
            $insertData = [];

            foreach ($pairCounts as $pairKey => $pairCount) {
                $supportAB = $pairCount / $totalTransactions;

                if ($supportAB >= $this->min_support) {
                    $items = explode(' & ', $pairKey);
                    $itemA = $items[0];
                    $itemB = $items[1];

                    $supportA = $itemCounts[$itemA] / $totalTransactions;
                    $confidenceAB = $pairCount / $itemCounts[$itemA];
                    $supportB = $itemCounts[$itemB] / $totalTransactions;
                    $liftAB = $supportB > 0 ? ($confidenceAB / $supportB) : 0;

                    $isValidAB = ($confidenceAB >= $this->min_confidence && $liftAB >= 1);
                    $rulesCalc[] = [
                        'rule' => $itemA . ' => ' . $itemB,
                        'support_A_B' => $supportAB,
                        'confidence' => $confidenceAB,
                        'lift_ratio' => $liftAB,
                        'is_valid' => $isValidAB
                    ];

                    if ($isValidAB) {
                        $insertData[] = [
                            'antecedent' => $itemA,
                            'consequent' => $itemB,
                            'support' => $supportAB,
                            'confidence' => $confidenceAB,
                            'lift_ratio' => $liftAB,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    }

                    $confidenceBA = $pairCount / $itemCounts[$itemB];
                    $liftBA = $supportA > 0 ? ($confidenceBA / $supportA) : 0;

                    $isValidBA = ($confidenceBA >= $this->min_confidence && $liftBA >= 1);
                    $rulesCalc[] = [
                        'rule' => $itemB . ' => ' . $itemA,
                        'support_A_B' => $supportAB,
                        'confidence' => $confidenceBA,
                        'lift_ratio' => $liftBA,
                        'is_valid' => $isValidBA
                    ];

                    if ($isValidBA) {
                        $insertData[] = [
                            'antecedent' => $itemB,
                            'consequent' => $itemA,
                            'support' => $supportAB,
                            'confidence' => $confidenceBA,
                            'lift_ratio' => $liftBA,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    }
                }
            }

            if (count($insertData) > 0) {
                DB::table('association_rules')->insert($insertData);
            }

            return [
                'status' => true,
                'steps' => [
                    'rules_calculation' => $rulesCalc,
                    'min_support' => $this->min_support,
                    'min_confidence' => $this->min_confidence,
                    'diagnostics' => [
                        'total_valid_transactions' => $totalTransactions,
                        'total_pairs_formed' => count($pairCounts),
                        'total_rules_generated' => count($insertData)
                    ]
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error in generateRules: ' . $e->getMessage());
            return [
                'status' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}