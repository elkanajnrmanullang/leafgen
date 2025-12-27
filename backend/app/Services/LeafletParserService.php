<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LeafletParserService
{
    private const MM_TO_PX = 11.811;
    private const TEMPLATE_PATH = 'master_templates/.json/';

    public function parse(array $rawData, string $selectedStore)
    {
        $filteredItems = $this->filterAndPrioritizeItems($rawData, $selectedStore);
        $visualItems = $this->mapToVisualItems($filteredItems);

        $layoutCover = $this->loadLayoutStructure('layout_cover.json');
        $layoutInner = $this->loadLayoutStructure('layout_inner.json');

        return $this->distributeToPages($visualItems, $layoutCover, $layoutInner);
    }

    private function loadLayoutStructure(string $filename)
    {
        $path = self::TEMPLATE_PATH . $filename;

        if (!Storage::exists($path)) {
            return $this->generateDummySlots(16);
        }

        $jsonContent = Storage::get($path);
        $data = json_decode($jsonContent, true);

        $flatNodes = $this->flattenNodes($data);

        $slots = [];
        foreach ($flatNodes as $node) {
            if (isset($node['name']) && str_starts_with($node['name'], 'slot_')) {
                $slots[] = [
                    'name' => $node['name'],
                    'x' => floor(($node['absoluteBoundingBox']['x'] ?? 0) * self::MM_TO_PX),
                    'y' => floor(($node['absoluteBoundingBox']['y'] ?? 0) * self::MM_TO_PX),
                    'w' => floor(($node['absoluteBoundingBox']['width'] ?? 0) * self::MM_TO_PX),
                    'h' => floor(($node['absoluteBoundingBox']['height'] ?? 0) * self::MM_TO_PX),
                ];
            }
        }

        usort($slots, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return $slots;
    }

    private function flattenNodes($nodes)
    {
        $result = [];
        foreach ($nodes as $node) {
            $result[] = $node;
            if (isset($node['children'])) {
                $result = array_merge($result, $this->flattenNodes($node['children']));
            }
        }
        return $result;
    }

    private function distributeToPages(array $items, array $coverSlots, array $innerSlots)
    {
        $pages = [];
        $itemIndex = 0;
        $totalItems = count($items);
        $pageNumber = 1;

        while ($itemIndex < $totalItems) {
            $currentSlots = ($pageNumber === 1) ? $coverSlots : $innerSlots;
            $slotsCount = count($currentSlots);

            if ($slotsCount === 0) break;

            $pageItems = [];

            for ($i = 0; $i < $slotsCount; $i++) {
                if ($itemIndex >= $totalItems) break;

                $item = $items[$itemIndex];
                $slot = $currentSlots[$i];

                $item['x'] = $slot['x'];
                $item['y'] = $slot['y'];
                $item['w'] = $slot['w'];
                $item['h'] = $slot['h'];

                $pageItems[] = $item;
                $itemIndex++;
            }

            $pages[] = [
                'id' => 'page-' . $pageNumber,
                'page_number' => $pageNumber,
                'layout_type' => ($pageNumber === 1) ? 'cover' : 'inner',
                'items' => $pageItems
            ];

            $pageNumber++;
        }

        return $pages;
    }

    private function filterAndPrioritizeItems(array $rows, string $store)
    {
        $validItems = [];
        $upperStore = strtoupper($store);

        foreach ($rows as $row) {
            $rowStore = strtoupper($row['store'] ?? '');
            $stores = array_map('trim', explode(',', $rowStore));

            $isGlobal = in_array('SPI NAS', $stores) || in_array('NAS', $stores);
            $isLocal = false;

            foreach ($stores as $s) {
                if (!empty($s) && str_contains($s, $upperStore)) {
                    $isLocal = true;
                    break;
                }
            }

            if (!$isGlobal && !$isLocal) {
                continue;
            }

            $bbmuValue = $row['syarat_bbmu'] ?? null;
            $priority = (!empty($bbmuValue)) ? 1 : 2;

            $validItems[] = [
                'data' => $row,
                'priority' => $priority
            ];
        }

        usort($validItems, function ($a, $b) {
            return $a['priority'] <=> $b['priority'];
        });

        return array_column($validItems, 'data');
    }

    private function mapToVisualItems(array $items)
    {
        $mapped = [];
        $pluList = array_map(fn($item) => (string)($item['plu'] ?? ''), $items);
        $dbProducts = Product::whereIn('plu_code', $pluList)->pluck('image_path', 'plu_code');

        foreach ($items as $index => $item) {
            $plu = (string)($item['plu'] ?? '0');
            $imagePath = $dbProducts[$plu] ?? null;

            $finalImage = $imagePath
                ? asset('storage/' . $imagePath)
                : asset('assets/placeholder.png');

            $md = (float) ($item['promosi_h_jual_setting_md'] ?? 0);
            $supp = (float) ($item['setting_pp_supp'] ?? 0);
            $mkt = (float) ($item['setting_pp_mkt'] ?? 0);
            $nett = $item['nett'] ?? 0;
            $keteranganRaw = $item['keteranganpembatasan'] ?? '';

            $coretData = $this->calculateCoret($md, $supp, $mkt);
            $descText = $this->processDescription($keteranganRaw, $supp, $mkt);
            $promoBadge = $this->processLabelPromo($keteranganRaw);
            $igrBadge = $this->processPoinIGR($keteranganRaw);

            $mapped[] = [
                'id' => 'item-' . $index . '-' . uniqid(),
                'type' => 'product_card',
                'plu' => $plu,
                'content' => [
                    'name' => $item['nama_barang'] ?? '',
                    'price_display' => $nett,
                    'price_original' => $coretData['value'],
                    'show_coret' => $coretData['show'],
                    'description' => $descText,
                    'image_url' => $finalImage,
                    'is_bbmu' => !empty($item['syarat_bbmu']),
                    'badge_promo' => $promoBadge,
                    'badge_igr' => $igrBadge,
                    'badge_spi_value' => (int)($item['poin'] ?? 0)
                ],
                'needs_manual_image' => $imagePath ? false : true,
                'x' => 0, 'y' => 0, 'w' => 0, 'h' => 0
            ];
        }

        return $mapped;
    }

    private function calculateCoret($md, $supp, $mkt)
    {
        if ($md > 0) {
            if ($supp > 1000 || $mkt > 1000 || ($supp + $mkt) > 1000) {
                return ['show' => true, 'value' => $md];
            }
        }
        return ['show' => false, 'value' => 0];
    }

    private function processDescription($text, $supp, $mkt)
    {
        $upperText = strtoupper($text);
        $totalPotongan = $supp + $mkt;

        if (preg_match('/(\d+)\s*CTN\/MM\/HARI/', $upperText, $matches)) {
            if ($totalPotongan < 1000) {
                return "*Harga Setelah Potongan\n(Maksimal {$matches[1]} Karton /member/hari)";
            }
        }

        if (preg_match('/MAKS\s+(\d+)\s*CTN/', $upperText, $matches)) {
            return "*Maks. Potongan {$matches[1]} Karton /member/hari";
        }

        if (str_contains($upperText, 'BELI 1 RCG POTONGAN')) {
            if ($totalPotongan < 1000) {
                return "*Harga Setelah Potongan";
            }
        }

        return "";
    }

    private function processLabelPromo($text)
    {
        $upperText = strtoupper($text);
        $isActive = str_contains($upperText, 'TOTAL POTONGAN') ||
                    str_contains($upperText, 'TOTAL DISC') ||
                    (str_contains($upperText, 'BELI') && str_contains($upperText, 'DISC'));

        if (!$isActive) return null;

        $qty = '';
        if (preg_match('/BELI\s+(\d+)/', $upperText, $matches)) {
            $qty = $matches[1];
        }

        $maxPrice = 0;
        if (preg_match_all('/(?:POTONGAN|DISC|RP)\s*[:\s]*((?:Rp\s?)?[\d\.,]+)/', $upperText, $matches)) {
            foreach ($matches[1] as $priceStr) {
                $cleanPrice = (float) str_replace(['Rp', '.', ',', ' '], '', $priceStr);
                if ($cleanPrice > $maxPrice) {
                    $maxPrice = $cleanPrice;
                }
            }
        }

        return [
            'active' => true,
            'txt_qty_promo' => $qty,
            'txt_price_promo' => $maxPrice > 0 ? number_format($maxPrice, 0, ',', '.') : ''
        ];
    }

    private function processPoinIGR($text)
    {
        if (!str_contains(strtoupper($text), 'POIN IGR')) {
            return null;
        }

        $qty = '';
        $satuan = '';
        $price = '';

        if (preg_match('/Beli\s+(\d+)\s+(\w+).*?dapat\s+([\d,\.]+)\s+Poin/i', $text, $matches)) {
            $qty = $matches[1];
            $satuan = $matches[2];
            $price = $matches[3];
        }

        return [
            'active' => true,
            'txt_keterangan_qty_igr' => $qty,
            'txt_satuan_igr' => $satuan,
            'txt_price_bonus_igr' => $price
        ];
    }

    private function generateDummySlots($count)
    {
        $slots = [];
        $cols = 4;
        $w = 48 * self::MM_TO_PX;
        $h = 58 * self::MM_TO_PX;
        for($i=0; $i<$count; $i++) {
             $slots[] = [
                 'name' => 'slot_' . str_pad($i+1, 2, '0', STR_PAD_LEFT),
                 'x' => ($i % $cols) * ($w + 30),
                 'y' => floor($i / $cols) * ($h + 30),
                 'w' => $w,
                 'h' => $h
             ];
        }
        return $slots;
    }
}
