<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;

class LeafletParserService
{
    private const MM_TO_PX = 11.811;

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
        $visualItems = $this->mapToVisualItems($sortedItems);

        $layoutCover = $this->loadLayoutStructure('layout_cover.json');
        $layoutInner = $this->loadLayoutStructure('layout_inner.json');

        return $this->distributeToPages($visualItems, $layoutCover, $layoutInner);
    }

    private function filterItems(array $rows, string $store)
    {
        $validItems = [];
        $upperStore = strtoupper(trim($store));

        foreach ($rows as $row) {
            $rowStore = strtoupper($row['store'] ?? '');

            if (empty($rowStore)) continue;

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

            if ($isGlobal || $isLocal) {
                $validItems[] = $row;
            }
        }
        return $validItems;
    }

    private function groupItemsByVariant(array $items)
    {
        $groups = [];

        foreach ($items as $item) {
            $name = strtoupper($item['nama_barang'] ?? '');
            if (empty($name)) continue;

            $words = explode(' ', $name);
            $baseName = implode(' ', array_slice($words, 0, 3));

            $size = '';
            if (preg_match('/(\d+\s*(?:GR|GRAM|G|ML|L|LITER|KG|PCS|BTL|BOX|SACHET))$/i', $name, $matches)) {
                $size = $matches[1];
            }

            $key = trim($baseName . '_' . $size);

            if (!isset($groups[$key])) {
                $groups[$key] = [];
            }
            $groups[$key][] = $item;
        }

        $result = [];

        foreach ($groups as $group) {
            $representative = $group[0];
            $count = count($group);

            if ($count > 1) {
                $fullNameRep = strtoupper($representative['nama_barang']);
                $words = explode(' ', $fullNameRep);
                $baseName = implode(' ', array_slice($words, 0, 3));

                $size = '';
                if (preg_match('/(\d+\s*(?:GR|GRAM|G|ML|L|LITER|KG|PCS|BTL|BOX|SACHET))$/i', $fullNameRep, $matches)) {
                    $size = $matches[1];
                }

                if ($count > 3) {
                    $representative['nama_barang'] = trim($baseName . ' ' . $size);
                }
                else {
                    $variants = [];
                    foreach ($group as $g) {
                        $n = strtoupper($g['nama_barang']);
                        $temp = str_replace($baseName, '', $n);
                        $temp = str_replace($size, '', $temp);
                        $cleanVariant = trim(preg_replace('/[^A-Z0-9]/', ' ', $temp));

                        if (!empty($cleanVariant)) {
                            $variants[] = ucfirst(strtolower($cleanVariant));
                        }
                    }

                    $variants = array_unique($variants);
                    if (!empty($variants)) {
                        $variantStr = implode(', ', $variants);
                        $representative['nama_barang'] = trim($baseName . ' ' . $variantStr . ' ' . $size);
                    }
                }
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
        $path = storage_path('app/master_templates/json/' . $filename);

        if (!file_exists($path)) {
            Log::warning("Layout JSON not found: " . $path);
            return [];
        }

        $jsonContent = file_get_contents($path);
        $data = json_decode($jsonContent, true);

        $slots = $this->findSlotsRecursively($data);

        usort($slots, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return $slots;
    }

    private function findSlotsRecursively($nodes) {
        $slots = [];

        if (isset($nodes['id'])) {
            $nodes = [$nodes];
        }

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
                $childSlots = $this->findSlotsRecursively($node['children']);
                $slots = array_merge($slots, $childSlots);
            }
        }

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

            if (empty($currentSlots) && !empty($coverSlots)) {
                $currentSlots = $coverSlots;
            }

            $slotsCount = count($currentSlots);

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
