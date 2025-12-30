<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;

class LeafletParserService
{
    private const MM_TO_PX = 11.811;
    private const TEMPLATE_PATH = 'master_templates/json/';

    protected $badgeGenerator;

    public function __construct(BadgeGeneratorService $badgeGenerator)
    {
        $this->badgeGenerator = $badgeGenerator;
    }

    public function parse(array $rawData, string $selectedStore)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $sortedItems = $this->filterAndSortItems($rawData, $selectedStore);
        $visualItems = $this->mapToVisualItems($sortedItems);

        $layoutCover = $this->loadLayoutStructure('layout_cover.json');
        $layoutInner = $this->loadLayoutStructure('layout_inner.json');

        return $this->distributeToPages($visualItems, $layoutCover, $layoutInner);
    }

    private function filterAndSortItems(array $rows, string $store)
    {
        $validItems = [];
        $upperStore = strtoupper(trim($store));

        foreach ($rows as $row) {
            $rowStore = strtoupper($row['store'] ?? '');
            $stores = array_map('trim', explode(',', $rowStore));

            $isGlobal = in_array('SPI NAS', $stores) || in_array('NAS', $stores);
            $isLocal = false;

            if (!$isGlobal) {
                foreach ($stores as $s) {
                    if (!empty($s) && str_contains($s, $upperStore)) {
                        $isLocal = true;
                        break;
                    }
                }
            }

            if (!$isGlobal && !$isLocal) {
                continue;
            }

            $isBbmu = !empty($row['syarat_bbmu']);
            $priority = $isBbmu ? 1 : 2;

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
        $pluList = array_map(fn($item) => (string)($item['unit'] ?? $item['plu'] ?? ''), $items);
        $dbProducts = Product::whereIn('plu_code', $pluList)->pluck('image_path', 'plu_code');

        foreach ($items as $index => $item) {
            $plu = (string)($item['unit'] ?? $item['plu'] ?? '0');

            $imagePath = $dbProducts[$plu] ?? null;
            $finalImage = $imagePath ? asset('storage/' . $imagePath) : asset('assets/placeholder.png');
            $needsManual = empty($imagePath);

            $md = (float) ($item['promosi_h_jual_setting_md'] ?? $item['setting_md'] ?? 0);
            $supp = (float) ($item['setting_pp_supp'] ?? $item['supp'] ?? 0);
            $mkt = (float) ($item['setting_pp_mkt'] ?? $item['mkt'] ?? 0);
            $nett = $item['nett'] ?? 0;
            $keteranganRaw = $item['keteranganpembatasan'] ?? $item['keterangan'] ?? '';
            $poinRaw = (float) ($item['poin'] ?? 0);
            $syaratBbmu = $item['syarat_bbmu'] ?? null;

            $coretData = $this->calculateCoret($md, $supp, $mkt);
            $descText = $this->processDescription($keteranganRaw, $supp, $mkt);

            $promoBadgeUrl = $this->generateLabelPromo($keteranganRaw);
            $igrBadgeUrl = $this->generatePoinIGR($keteranganRaw);
            $spiBadgeUrl = $this->generatePoinSPI($poinRaw);
            $bbmuBadgeUrl = $this->getBadgeBBMU($syaratBbmu);

            $mapped[] = [
                'id' => 'item-' . $index . '-' . uniqid(),
                'type' => 'product_card',
                'plu' => $plu,
                'content' => [
                    'name' => $item['nama_barang'] ?? 'Nama Barang',
                    'price_display' => $nett,
                    'price_original' => $coretData['value'],
                    'show_coret' => $coretData['show'],
                    'description' => $descText,
                    'image_url' => $finalImage,
                    'badge_bbmu_url' => $bbmuBadgeUrl,
                    'badge_promo_url' => $promoBadgeUrl,
                    'badge_igr_url' => $igrBadgeUrl,
                    'badge_spi_url' => $spiBadgeUrl
                ],
                'needs_manual_image' => $needsManual,
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

        if (preg_match('/(\d+)\s*CTN\/MM\/HARI/', $upperText, $matches) || preg_match('/MAX\s+(\d+)/', $upperText, $matches)) {
            if ($totalPotongan < 1000) {
                return "*Harga Setelah Potongan\n(Maksimal " . ($matches[1] ?? '') . " Karton /member/hari)";
            }
        }

        if (preg_match('/MAKS\s+(\d+)\s*CTN/', $upperText, $matches)) {
            return "*Maks. Potongan {$matches[1]} Karton /member/hari";
        }

        if (str_contains($upperText, 'BELI 1 RCG POTONGAN') || str_contains($upperText, 'BELI 1 CTN POTONGAN')) {
            if ($totalPotongan < 1000) {
                return "*Harga Setelah Potongan";
            }
        }

        return "";
    }

    private function generateLabelPromo($text)
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
        if (preg_match_all('/(?:POTONGAN|DISC|RP)\s*[:\s]*((?:Rp\.?\s?)?[\d\.,]+)/', $upperText, $matches)) {
            foreach ($matches[1] as $priceStr) {
                $cleanPrice = (float) str_replace(['Rp', '.', ',', ' '], '', $priceStr);
                if ($cleanPrice > $maxPrice) {
                    $maxPrice = $cleanPrice;
                }
            }
        }

        return $this->badgeGenerator->generate('label_promo', [
            'txt_qty_promo' => $qty,
            'txt_price_promo' => $maxPrice > 0 ? 'Rp ' . number_format($maxPrice, 0, ',', '.') : '',
            'txt_keterangan_promo' => 'Tambahan Potongan'
        ]);
    }

    private function generatePoinIGR($text)
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

        return $this->badgeGenerator->generate('badge_poin_igr', [
            'txt_keterangan_qty_igr' => $qty,
            'txt_satuan_igr' => $satuan,
            'txt_price_bonus_igr' => $price
        ]);
    }

    private function generatePoinSPI($poin)
    {
        if ($poin > 0) {
            return $this->badgeGenerator->generate('badge_poin_spi', [
                'txt_price_bonus' => number_format($poin, 0, ',', '.'),
                'txt_satuan' => 'Pcs',
                'txt_keterangan_qty' => 'Setiap Pembelian 1'
            ]);
        }
        return null;
    }

    private function getBadgeBBMU($val)
    {
        if (!empty($val)) {
            return asset('storage/master_templates/assets/components/img_badge_bbmu.png');
        }
        return null;
    }

    private function loadLayoutStructure(string $filename)
    {
        $path = self::TEMPLATE_PATH . $filename;

        if (!Storage::exists($path)) {
            return [];
        }

        $jsonContent = Storage::get($path);
        $data = json_decode($jsonContent, true);

        if (!isset($data[0]['children'])) {
            return [];
        }

        $slots = [];
        $children = $data[0]['children'];

        foreach ($children as $node) {
            if (isset($node['name']) && str_starts_with($node['name'], 'slot_')) {
                $slots[] = [
                    'name' => $node['name'],
                    'x' => ($node['absoluteBoundingBox']['x'] ?? 0) * self::MM_TO_PX,
                    'y' => ($node['absoluteBoundingBox']['y'] ?? 0) * self::MM_TO_PX,
                    'w' => ($node['absoluteBoundingBox']['width'] ?? 0) * self::MM_TO_PX,
                    'h' => ($node['absoluteBoundingBox']['height'] ?? 0) * self::MM_TO_PX,
                ];
            }
        }

        usort($slots, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return $slots;
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

            if ($slotsCount === 0 && $pageNumber > 1) {
               $currentSlots = $coverSlots;
               $slotsCount = count($currentSlots);
            }

            if ($slotsCount === 0) {
                break;
            }

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

            if ($pageNumber > 50) break;
        }

        return $pages;
    }
}
