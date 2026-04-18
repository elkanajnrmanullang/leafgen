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
        return Leaflet::where('leaflet_status', 'completed')->count();
    }

    public function generateRules()
    {
        try {
            $transactions = [];
            $C1_formatted = [];
            $L1_formatted = [];
            $C2_formatted = [];
            $L2_formatted = [];
            $rulesCalc = [];
            $insertData = [];

            $leafletItems = DB::table('leaflet_items')
                ->join('leaflets', 'leaflet_items.leaflet_id', '=', 'leaflets.leaflet_id')
                ->where('leaflets.leaflet_status', 'completed')
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
                        'C1' => [],
                        'L1' => [],
                        'C2' => [],
                        'L2' => [],
                        'AssociationRules' => []
                    ],
                    'valid_count' => $totalTransactions
                ];
            }

            $C1 = [];
            foreach ($transactions as $transaction) {
                $unique_items = array_values(array_unique($transaction));
                foreach ($unique_items as $item) {
                    if (!isset($C1[$item])) {
                        $C1[$item] = 0;
                    }
                    $C1[$item]++;
                }
            }

            $frequentItemsL1 = [];
            foreach ($C1 as $item => $count) {
                $support = $count / $totalTransactions;
                $C1_formatted[] = [
                    'itemset' => $item,
                    'count' => $count,
                    'support' => round($support, 4)
                ];
                
                if ($support >= $this->min_support) {
                    $L1_formatted[] = [
                        'itemset' => $item,
                        'count' => $count,
                        'support' => round($support, 4)
                    ];
                    $frequentItemsL1[] = $item;
                }
            }

            $C2 = [];
            $itemCountL1 = count($frequentItemsL1);
            for ($i = 0; $i < $itemCountL1; $i++) {
                for ($j = $i + 1; $j < $itemCountL1; $j++) {
                    $pair = [$frequentItemsL1[$i], $frequentItemsL1[$j]];
                    sort($pair);
                    $pairKey = implode(' , ', $pair);
                    $C2[$pairKey] = 0;
                }
            }

            foreach ($transactions as $transaction) {
                $items = array_values(array_unique($transaction));
                $count = count($items);
                for ($i = 0; $i < $count; $i++) {
                    for ($j = $i + 1; $j < $count; $j++) {
                        $pair = [$items[$i], $items[$j]];
                        sort($pair);
                        $pairKey = implode(' , ', $pair);
                        if (isset($C2[$pairKey])) {
                            $C2[$pairKey]++;
                        }
                    }
                }
            }

            $L2 = [];
            foreach ($C2 as $pairKey => $count) {
                $support = $count / $totalTransactions;
                $C2_formatted[] = [
                    'itemset' => $pairKey,
                    'count' => $count,
                    'support' => round($support, 4)
                ];

                if ($support >= $this->min_support) {
                    $L2[$pairKey] = $count;
                    $L2_formatted[] = [
                        'itemset' => $pairKey,
                        'count' => $count,
                        'support' => round($support, 4)
                    ];
                }
            }

            DB::table('association_rules')->truncate();

            foreach ($L2 as $pairKey => $pairCount) {
                $supportAB = $pairCount / $totalTransactions;
                $items = explode(' , ', $pairKey);
                $itemA = $items[0];
                $itemB = $items[1];

                $supportA = $C1[$itemA] / $totalTransactions;
                $confidenceAB = $pairCount / $C1[$itemA];
                $supportB = $C1[$itemB] / $totalTransactions;
                $liftAB = $supportB > 0 ? ($confidenceAB / $supportB) : 0;

                $isValidAB = ($confidenceAB >= $this->min_confidence && $liftAB >= 1);
                $rulesCalc[] = [
                    'rule' => $itemA . ' => ' . $itemB,
                    'support_A_B' => round($supportAB, 4),
                    'confidence' => round($confidenceAB, 4),
                    'lift_ratio' => round($liftAB, 4),
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

                $confidenceBA = $pairCount / $C1[$itemB];
                $liftBA = $supportA > 0 ? ($confidenceBA / $supportA) : 0;

                $isValidBA = ($confidenceBA >= $this->min_confidence && $liftBA >= 1);
                $rulesCalc[] = [
                    'rule' => $itemB . ' => ' . $itemA,
                    'support_A_B' => round($supportAB, 4),
                    'confidence' => round($confidenceBA, 4),
                    'lift_ratio' => round($liftBA, 4),
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

            if (count($insertData) > 0) {
                DB::table('association_rules')->insert($insertData);
            }

            return [
                'status' => true,
                'steps' => [
                    'C1' => $C1_formatted,
                    'L1' => $L1_formatted,
                    'C2' => $C2_formatted,
                    'L2' => $L2_formatted,
                    'AssociationRules' => $rulesCalc,
                    'min_support' => $this->min_support,
                    'min_confidence' => $this->min_confidence
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