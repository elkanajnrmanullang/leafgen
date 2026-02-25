<?php

namespace App\Services;

use App\Models\Leaflet;
use App\Models\AssociationRule;
use Illuminate\Support\Facades\DB;

class AprioriService
{
    private $minimum_transactions = 80;
    private $min_support = 0.1;
    private $min_confidence = 0.5;

    public function checkSystemStatus()
    {
        $totalTransactions = Leaflet::where('status', 'exported')->count();

        if ($totalTransactions < $this->minimum_transactions) {
            return [
                'is_ready' => false,
                'total_data' => $totalTransactions,
                'message' => "Fase Cold-Start. Butuh {$this->minimum_transactions} transaksi, saat ini baru {$totalTransactions}."
            ];
        }

        return [
            'is_ready' => true,
            'total_data' => $totalTransactions,
            'message' => "Sistem siap. Algoritma Apriori dapat dijalankan."
        ];
    }

    public function generateRules()
    {
        $status = $this->checkSystemStatus();

        if (!$status['is_ready']) {
            return false;
        }

        $transactions = [];
        $leafletItems = DB::table('leaflet_items')
            ->join('leaflets', 'leaflet_items.leaflet_id', '=', 'leaflets.id')
            ->where('leaflets.status', 'exported')
            ->select('leaflet_items.leaflet_id', 'leaflet_items.product_name')
            ->get();

        foreach ($leafletItems as $item) {
            $transactions[$item->leaflet_id][] = $item->product_name;
        }

        $totalTransactions = count($transactions);
        if ($totalTransactions == 0) return false;

        $itemCounts = [];

        foreach ($transactions as $transaction) {
            $unique_items = array_unique($transaction);
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
                    $pairKey = implode('|', $pair);

                    if (!isset($pairCounts[$pairKey])) $pairCounts[$pairKey] = 0;
                    $pairCounts[$pairKey]++;
                }
            }
        }

        DB::table('association_rules')->truncate();

        foreach ($pairCounts as $pairKey => $pairCount) {
            $items = explode('|', $pairKey);
            $itemA = $items[0];
            $itemB = $items[1];

            $supportAB = $pairCount / $totalTransactions;

            if ($supportAB >= $this->min_support) {

                $confidenceAB = $pairCount / $itemCounts[$itemA];
                $supportB = $itemCounts[$itemB] / $totalTransactions;
                $liftAB = $confidenceAB / $supportB;

                if ($confidenceAB >= $this->min_confidence && $liftAB > 1) {
                    AssociationRule::create([
                        'antecedent' => $itemA,
                        'consequent' => $itemB,
                        'support' => $supportAB,
                        'confidence' => $confidenceAB,
                        'lift_ratio' => $liftAB
                    ]);
                }

                $confidenceBA = $pairCount / $itemCounts[$itemB];
                $supportA = $itemCounts[$itemA] / $totalTransactions;
                $liftBA = $confidenceBA / $supportA;

                if ($confidenceBA >= $this->min_confidence && $liftBA > 1) {
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

        return true;
    }
}
