<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;
use App\Services\BadgeGeneratorService;

class LeafletParserService
{
    protected $badgeGenerator;

    public function __construct(BadgeGeneratorService $badgeGenerator)
    {
        $this->badgeGenerator = $badgeGenerator;
    }

    public function parse(array $rawData, string $selectedStore)
    {
        ini_set('memory_limit', '1024M');
        set_time_limit(300);

        $filteredItems = $this->filterItems($rawData, $selectedStore);
        $groupedItems = $this->groupItemsByVariant($filteredItems);
        $sortedItems = $this->sortItems($groupedItems);

        $layoutCover = $this->loadLayoutStructure('layout_cover.json');
        $layoutInner = $this->loadLayoutStructure('layout_inner.json');

        if (empty($layoutCover['slots'])) {
            Log::error("Layout Cover slots not found or empty.");
            return [];
        }

        return $this->distributeToPages($sortedItems, $layoutCover, $layoutInner);
    }

    private function filterItems(array $rows, string $targetRegion)
    {
        $validItems = [];
        $targetRegion = strtoupper(trim($targetRegion));

        $regionCities = [
            'JAWA' => ['JAWA', 'BLI', 'BGR', 'CKL', 'CPG', 'CPT', 'KRW', 'KMY', 'MLG', 'PWT', 'SMG', 'SLO', 'SBI', 'SBY', 'TGR', 'YOG'],
            'SUM' => ['SUM', 'BTM', 'JBI', 'BDL', 'MDN', 'PLG', 'PKU'],
            'KAL' => ['KAL', 'BMS', 'PTK', 'SMD'],
            'SUL' => ['SUL', 'GTO', 'KRI', 'MKS', 'MDO'],
            'MALUKU' => ['MALUKU', 'AMB'],
        ];

        foreach ($rows as $row) {
            $storeString = strtoupper(trim($row['store'] ?? ''));

            if (empty($storeString)) continue;

            if (preg_match('/(EXCLD|KEC|EXC)\s+.*' . preg_quote($targetRegion, '/') . '/', $storeString)) {
                continue;
            }

            if (isset($regionCities[$targetRegion])) {
                foreach ($regionCities[$targetRegion] as $city) {
                    if (preg_match('/(EXCLD|KEC|EXC)\s+.*' . preg_quote($city, '/') . '/', $storeString)) {
                        continue 2;
                    }
                }
            }

            if (str_contains($storeString, 'NAS') || str_contains($storeString, 'ALL') || str_contains($storeString, 'SEMUA')) {
                if (str_contains($storeString, 'LUAR JAWA') && $targetRegion === 'JAWA') {
                    continue;
                }
                $validItems[] = $row;
                continue;
            }

            if (str_contains($storeString, 'LUAR JAWA')) {
                if ($targetRegion !== 'JAWA') {
                    $validItems[] = $row;
                }
                continue;
            }

            if (str_contains($storeString, $targetRegion)) {
                $validItems[] = $row;
                continue;
            }

            if (isset($regionCities[$targetRegion])) {
                foreach ($regionCities[$targetRegion] as $city) {
                    if (str_contains($storeString, $city)) {
                        $validItems[] = $row;
                        continue 2;
                    }
                }
            }
        }
        return $validItems;
    }

    private function groupItemsByVariant(array $items)
    {
        $groups = [];

        foreach ($items as $item) {
            $groupId = $item['group_id'] ?? null;
            $key = !empty($groupId) ? (string)$groupId : uniqid('single_');
            if (!isset($groups[$key])) $groups[$key] = [];
            $groups[$key][] = $item;
        }

        $result = [];

        foreach ($groups as $group) {
            $representative = $group[0];
            $count = count($group);
            if ($count > 1) {
                $firstItemName = strtoupper($group[0]['nama_barang']);
                $representative['nama_barang'] = $firstItemName . " (+" . ($count - 1) . " Varian)";
            }
            $result[] = $representative;
        }

        return $result;
    }

    private function sortItems(array $items)
    {
        $sorted = [];
        foreach ($items as $item) {
            $isBbmu = !empty($item['syarat_bbmu']);
            $priority = $isBbmu ? 1 : 2;
            $sorted[] = ['data' => $item, 'priority' => $priority];
        }

        usort($sorted, function ($a, $b) {
            return $a['priority'] <=> $b['priority'];
        });

        return array_column($sorted, 'data');
    }

    private function mapToVisualItems(array $items, int $pageNumber)
    {
        $mapped = [];

        $pluList = array_map(function($item) {
            return preg_replace('/[^0-9]/', '', (string)($item['plu'] ?? ''));
        }, $items);

        $dbProducts = Product::whereIn('plu_code', $pluList)->pluck('product_img_path', 'plu_code');

        $cardBg = ($pageNumber === 1) ? 'img_card_bg_master.png' : 'card_inner_master_bg.png';

        foreach ($items as $index => $item) {
            $cleanPlu = preg_replace('/[^0-9]/', '', (string)($item['plu'] ?? '0'));

            $imagePath = $dbProducts[$cleanPlu] ?? null;

            if ($imagePath) {
                if (str_starts_with($imagePath, 'http')) {
                    $finalImage = $imagePath;
                } else {
                    $finalImage = url('storage/' . $imagePath);
                }
            } else {
                $finalImage = url('assets/placeholder.png');
            }

            $needsManual = empty($imagePath);

            $md = (float)($item['setting_md'] ?? 0);
            $supp = (float)($item['supp'] ?? 0);
            $mkt = (float)($item['mkt'] ?? 0);
            $nett = $item['nett'] ?? 0;
            $keteranganRaw = $item['keterangan'] ?? '';
            $poinRaw = (float)($item['poin'] ?? 0);
            $syaratBbmu = $item['syarat_bbmu'] ?? null;
            $satuan = $item['satuan'] ?? '';

            $coretData = $this->calculateCoret($md, $supp, $mkt);
            $descText = $this->processDescription($keteranganRaw, $supp, $mkt);

            $promoBadgeUrl = $this->generateLabelPromo($keteranganRaw);
            $igrBadgeUrl = $this->generatePoinIGR($keteranganRaw);
            $spiBadgeUrl = $this->generatePoinSPI($poinRaw, $satuan, $syaratBbmu);
            $bbmuBadgeUrl = $this->getBadgeBBMU($syaratBbmu);

            $txtPrice = is_numeric($nett) ? number_format($nett, 0, ',', '.') . ',-' : $nett;
            $txtCoret = $coretData['show'] ? number_format($coretData['value'], 0, ',', '.') : '';

            $mapped[] = [
                'id' => 'item-' . $pageNumber . '-' . $index . '-' . uniqid(),
                'type' => 'product_card',
                'plu' => $cleanPlu,
                'component_name' => 'card_cover_master',
                'data' => [
                    'txt_name' => $item['nama_barang'] ?? 'Nama Barang',
                    'txt_price' => $txtPrice,
                    'txt_satuan_price' => $satuan ? "/$satuan" : '',
                    'img_product' => $finalImage,

                    'img_card_bg' => 'assets/' . $cardBg,
                    'img_container_price' => 'assets/components/img_container_price.png',
                    'img_container_coret' => $coretData['show'] ? 'assets/components/img_container_coret.png' : null,
                    'img_coret_line' => $coretData['show'] ? 'assets/components/img_coret_line.png' : null,
                    'img_container_keterangan' => !empty($descText) ? 'assets/components/img_container_keterangan.png' : null,

                    'txt_coret' => $txtCoret,
                    'txt_keterangan' => $descText,
                    'show_coret' => $coretData['show'],
                    'show_keterangan' => !empty($descText),

                    'is_bbmu' => !empty($bbmuBadgeUrl),
                    'img_badge_bbmu' => !empty($bbmuBadgeUrl) ? 'assets/components/' . $bbmuBadgeUrl : null,

                    'badge_promo' => $promoBadgeUrl ? [
                        'active' => true,
                        'txt_qty_promo' => $promoBadgeUrl['txt_qty_promo'],
                        'txt_price_promo' => $promoBadgeUrl['txt_price_promo'],
                        'txt_keterangan_promo' => $promoBadgeUrl['txt_keterangan_promo'],
                        'txt_satuan' => $promoBadgeUrl['txt_satuan'],
                    ] : null,
                    'img_bg_label_promo' => $promoBadgeUrl ? 'assets/components/img_bg_label_promo.png' : null,
                    'img_container_ketPromo' => $promoBadgeUrl ? 'assets/components/img_container_ketPromo.png' : null,

                    'txt_qty_promo' => $promoBadgeUrl['txt_qty_promo'] ?? null,
                    'txt_price_promo' => $promoBadgeUrl['txt_price_promo'] ?? null,
                    'txt_keterangan_promo' => $promoBadgeUrl['txt_keterangan_promo'] ?? null,
                    'txt_satuan' => $promoBadgeUrl['txt_satuan'] ?? null,

                    'badge_igr' => $igrBadgeUrl ? [
                         'active' => true,
                         'txt_keterangan_qty_igr' => $igrBadgeUrl['txt_keterangan_qty_igr'],
                         'txt_satuan_igr' => $igrBadgeUrl['txt_satuan_igr'],
                         'txt_price_bonus_igr' => $igrBadgeUrl['txt_price_bonus_igr'],
                    ] : null,
                    'img_bg_poin_igr' => $igrBadgeUrl ? 'assets/components/img_bg_poin_igr.png' : null,
                    'img_container_igr' => $igrBadgeUrl ? 'assets/components/img_container_igr.png' : null,
                    'txt_satuan_igr' => $igrBadgeUrl['txt_satuan_igr'] ?? null,
                    'txt_price_bonus_igr' => $igrBadgeUrl['txt_price_bonus_igr'] ?? null,
                    'txt_keterangan_qty_igr' => $igrBadgeUrl['txt_keterangan_qty_igr'] ?? null,

                    'badge_spi' => $spiBadgeUrl ? [
                        'active' => true,
                        'txt_price_bonus_spi' => $spiBadgeUrl['txt_price_bonus_spi'],
                        'txt_satuan_spi' => $spiBadgeUrl['txt_satuan_spi'],
                        'txt_keterangan_qty_spi' => $spiBadgeUrl['txt_keterangan_qty_spi']
                    ] : null,
                    'img_logo_spi' => $spiBadgeUrl ? 'assets/components/img_logo_spi.png' : null,
                    'img_container_spi' => $spiBadgeUrl ? 'assets/components/img_container_spi.png' : null,
                    'txt_satuan_spi' => $spiBadgeUrl['txt_satuan_spi'] ?? null,
                    'txt_price_bonus_spi' => $spiBadgeUrl['txt_price_bonus_spi'] ?? null,
                    'txt_keterangan_qty_spi' => $spiBadgeUrl['txt_keterangan_qty_spi'] ?? null,
                ],
                'needs_manual_image' => $needsManual,
                'x' => $item['x'] ?? 0, 'y' => $item['y'] ?? 0, 'w' => $item['w'] ?? 0, 'h' => $item['h'] ?? 0,
                'slot_id' => $item['slot_id'] ?? null
            ];
        }
        return $mapped;
    }

    private function calculateCoret($md, $supp, $mkt)
    {
        if ($md > 0) {
            $totalSubsidi = $supp + $mkt;
            if ($supp > 1000 || $mkt > 1000 || $totalSubsidi > 1000) {
                return ['show' => true, 'value' => $md];
            }
        }
        return ['show' => false, 'value' => 0];
    }

    private function processDescription($text, $supp, $mkt)
    {
        $upperText = strtoupper($text);
        $totalSubsidi = $supp + $mkt;

        if (preg_match('/(?:MAX|MAKS|MAKSIMAL)\s*(\d+)\s*CTN\/.*\/HARI/i', $upperText, $matches)) {
            $qty = $matches[1];
            if ($totalSubsidi < 1000) return "*Harga Setelah Potongan\n(Maksimal $qty Karton /member/hari)";
            return null;
        }

        if (preg_match('/MAKS\s+(\d+)\s*CTN/i', $upperText, $matches)) {
            return "*Maks. Potongan {$matches[1]} Karton /member/hari";
        }

        if (str_contains($upperText, 'BELI 1 RCG POTONGAN') || str_contains($upperText, 'BELI 1 CTN POTONGAN')) {
             if ($supp < 1000 && $mkt < 1000) return "*Harga Setelah Potongan";
             return null;
        }
        return null;
    }

    private function generateLabelPromo($text)
    {
        $upperText = strtoupper($text);
        $isActive = str_contains($upperText, 'TOTAL POTONGAN') || str_contains($upperText, 'TOTAL DISC') || str_contains($upperText, 'TIAP PEMBELIAN') || (str_contains($upperText, 'BELI') && str_contains($upperText, 'DISC'));
        if (!$isActive) return null;

        $qty = preg_match('/BELI\s+(\d+)/', $upperText, $m) ? "BELI " . $m[1] : "BELI 1";
        $maxPrice = 0;
        preg_match_all('/(?:POTONGAN|DISC|RP|POT)\.?\s*([\d\.,]+)/', $upperText, $priceMatches);
        if (!empty($priceMatches[1])) {
            foreach ($priceMatches[1] as $priceStr) {
                $val = (float) str_replace(['.', ','], '', $priceStr);
                if ($val > $maxPrice) $maxPrice = $val;
            }
        }
        $satuan = 'PCS';
        if (preg_match('/(?:CTN|KARTON|RCG|PCS)/', $upperText, $satuanMatch)) $satuan = $satuanMatch[0];

        return [
            'txt_qty_promo' => $qty,
            'txt_price_promo' => $maxPrice > 0 ? "Rp " . number_format($maxPrice, 0, ',', '.') : '',
            'txt_keterangan_promo' => 'Tambahan Potongan',
            'txt_satuan' => $satuan
        ];
    }

    private function generatePoinIGR($text)
    {
        if (!str_contains(strtoupper($text), 'POIN IGR')) return null;
        if (preg_match('/Beli\s+(\d+)\s+(\w+).*?dapat\s+([\d,\.]+)\s+Poin/i', $text, $matches)) {
            return [
                'txt_keterangan_qty_igr' => "Setiap Pembelian " . $matches[1],
                'txt_satuan_igr' => ucfirst(strtolower($matches[2])),
                'txt_price_bonus_igr' => "BONUS " . $matches[3]
            ];
        }
        return null;
    }

    private function generatePoinSPI($poin, $satuan, $syaratBbmu)
    {
        if ($poin > 0) {
            $qty = '1';
            $unit = ucfirst(strtolower($satuan));
            if (!empty($syaratBbmu) && preg_match('/(\d+)\s*(\w+)/', $syaratBbmu, $matches)) {
                $qty = $matches[1];
                $unit = ucfirst(strtolower($matches[2]));
            }
            return [
                'txt_price_bonus_spi' => 'Bonus ' . number_format($poin, 0, ',', '.'),
                'txt_satuan_spi' => $unit,
                'txt_keterangan_qty_spi' => 'Setiap Pembelian ' . $qty
            ];
        }
        return null;
    }

    private function getBadgeBBMU($val)
    {
        return !empty($val) ? 'img_badge_bbmu.png' : null;
    }

    private function loadLayoutStructure(string $filename)
    {
        $path = storage_path('app/master_templates/json/' . $filename);
        if (!file_exists($path)) {
            Log::warning("Layout JSON not found: " . $path);
            return ['slots' => [], 'width' => 2480, 'height' => 3508];
        }
        $data = json_decode(file_get_contents($path), true);

        $width = 2480;
        $height = 3508;

        $root = $data;
        if (isset($data['document']['children'][0]['children'])) {
             foreach($data['document']['children'][0]['children'] as $node) {
                 if(isset($node['absoluteBoundingBox'])) {
                     $width = $node['absoluteBoundingBox']['width'] * 4;
                     $height = $node['absoluteBoundingBox']['height'] * 4;
                     break;
                 }
             }
        } elseif (isset($data['absoluteBoundingBox'])) {
             $width = $data['absoluteBoundingBox']['width'] * 4;
             $height = $data['absoluteBoundingBox']['height'] * 4;
        } elseif (is_array($data) && isset($data[0]['absoluteBoundingBox'])) {
             $width = $data[0]['absoluteBoundingBox']['width'] * 4;
             $height = $data[0]['absoluteBoundingBox']['height'] * 4;
        }

        $slots = $this->findSlotsRecursively($data);
        usort($slots, function ($a, $b) {
            return strnatcmp($a['name'], $b['name']);
        });

        if (!empty($slots)) {
            $minX = min(array_column($slots, 'x'));
            $minY = min(array_column($slots, 'y'));
            foreach ($slots as &$slot) {
                $slot['x'] -= $minX;
                $slot['y'] -= $minY;
            }
        }

        return [
            'slots' => $slots,
            'width' => $width,
            'height' => $height
        ];
    }

    private function findSlotsRecursively($nodes)
    {
        $slots = [];
        if (isset($nodes['id'])) $nodes = [$nodes];

        foreach ($nodes as $node) {
            if (isset($node['name']) && str_starts_with($node['name'], 'slot_')) {
                $scale = 4;
                $slots[] = [
                    'name' => $node['name'],
                    'x' => ($node['absoluteBoundingBox']['x'] ?? 0) * $scale,
                    'y' => ($node['absoluteBoundingBox']['y'] ?? 0) * $scale,
                    'w' => ($node['absoluteBoundingBox']['width'] ?? 0) * $scale,
                    'h' => ($node['absoluteBoundingBox']['height'] ?? 0) * $scale,
                ];
            }
            if (isset($node['children']) && is_array($node['children'])) {
                $slots = array_merge($slots, $this->findSlotsRecursively($node['children']));
            }
        }
        return $slots;
    }

    private function distributeToPages(array $rawItems, array $coverLayout, array $innerLayout)
    {
        $pages = [];
        $itemIndex = 0;
        $totalItems = count($rawItems);
        $pageNumber = 1;

        while ($itemIndex < $totalItems) {
            $currentLayoutData = ($pageNumber === 1) ? $coverLayout : $innerLayout;

            if (empty($currentLayoutData['slots']) && !empty($coverLayout['slots'])) {
                $currentLayoutData = $coverLayout;
            }

            $currentSlots = $currentLayoutData['slots'];

            if (empty($currentSlots)) {
                Log::error("No slots available for page $pageNumber. Stopping distribution.");
                break;
            }

            $slotsCount = count($currentSlots);
            $pageItemsRaw = [];

            for ($i = 0; $i < $slotsCount; $i++) {
                if ($itemIndex >= $totalItems) break;

                $item = $rawItems[$itemIndex];
                $slot = $currentSlots[$i];

                $item['x'] = $slot['x'];
                $item['y'] = $slot['y'];
                $item['w'] = $slot['w'];
                $item['h'] = $slot['h'];
                $item['slot_id'] = $slot['name'];

                $pageItemsRaw[] = $item;
                $itemIndex++;
            }

            $visualItems = $this->mapToVisualItems($pageItemsRaw, $pageNumber);

            $pages[] = [
                'id' => 'page-' . $pageNumber,
                'page_number' => $pageNumber,
                'layout_type' => ($pageNumber === 1) ? 'cover' : 'inner',
                'width' => $currentLayoutData['width'],
                'height' => $currentLayoutData['height'],
                'items' => $visualItems
            ];

            $pageNumber++;
            if ($pageNumber > 50) break;
        }

        return $pages;
    }
}