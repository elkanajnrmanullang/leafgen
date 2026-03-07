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
        return Leaflet::where('status', 'exported')->count();
    }

    public function generateRules()
    {
        try {
            $transactions = [];
            $rulesCalc = [];

            $leafletItems = DB::table('leaflet_items')
                ->join('leaflets', 'leaflet_items.leaflet_id', '=', 'leaflets.id')
                ->where('leaflets.status', 'exported')
                ->select('leaflet_items.leaflet_id', 'leaflet_items.content')
                ->get();

            foreach ($leafletItems as $item) {
                if (empty($item->content)) continue;

                $content = json_decode($item->content, true);

                if (json_last_error() !== JSON_ERROR_NONE) continue;

                $productName = $content['name'] ?? $content['txt_name'] ?? null;

                if ($productName) {
                    $transactions[$item->leaflet_id][] = $productName;
                }
            }

            $totalTransactions = count($transactions);

            DB::table('association_rules')->truncate();

            if ($totalTransactions < 80) {
                return [
                    'status' => false,
                    'steps' => [
                        'rules_calculation' => [],
                        'min_support' => $this->min_support,
                        'min_confidence' => $this->min_confidence
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

                    $rulesCalc[] = [
                        'rule' => $itemA . ' => ' . $itemB,
                        'support_A_B' => $supportAB,
                        'confidence' => $confidenceAB,
                        'lift_ratio' => $liftAB,
                        'is_valid' => ($confidenceAB >= $this->min_confidence && $liftAB >= 1)
                    ];

                    if ($confidenceAB >= $this->min_confidence && $liftAB >= 1) {
                        AssociationRule::create([
                            'antecedent' => $itemA,
                            'consequent' => $itemB,
                            'support' => $supportAB,
                            'confidence' => $confidenceAB,
                            'lift_ratio' => $liftAB
                        ]);
                    }

                    $confidenceBA = $pairCount / $itemCounts[$itemB];
                    $liftBA = $supportA > 0 ? ($confidenceBA / $supportA) : 0;

                    $rulesCalc[] = [
                        'rule' => $itemB . ' => ' . $itemA,
                        'support_A_B' => $supportAB,
                        'confidence' => $confidenceBA,
                        'lift_ratio' => $liftBA,
                        'is_valid' => ($confidenceBA >= $this->min_confidence && $liftBA >= 1)
                    ];

                    if ($confidenceBA >= $this->min_confidence && $liftBA >= 1) {
                        AssociationRule::create([
                            'antecedent' => $itemB,
                            'consequent' => $itemA,
                            'support' => $supportAB,
                            'confidence' => $confidenceBA,
                            'lift_ratio' => $liftBA
                        ]);
                    }
                }
            }

            return [
                'status' => true,
                'steps' => [
                    'rules_calculation' => $rulesCalc,
                    'min_support' => $this->min_support,
                    'min_confidence' => $this->min_confidence
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error in generateRules: ' . $e->getMessage());
            return false;
        }
    }
}