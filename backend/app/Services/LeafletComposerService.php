<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Typography\FontFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\BackgroundTemplate;
use App\Services\BadgeGeneratorService;

class LeafletComposerService
{
    protected $manager;
    protected $assetPath;
    protected $outputPath;
    protected $jsonPath;
    protected $fontPath;
    protected $badgeService;

    const CANVAS_W = 2480;
    const CANVAS_H = 3508;

    protected $staticAssetMap = [
        'img_namaLeaflet'         => 'tema_leaflet.png',
        'img_qr'                  => 'qr.png',
        'img_logo'                => 'logo.png',
        'img_khusus_member'       => 'img_khusus_member.png',
        'img_namaLeaflet_inner'   => 'tema_leaflet.png',
        'img_khusus_member_inner' => 'img_khusus_member.png',
        'img_badge_bbmu'          => 'img_badge_bbmu.png'
    ];

    public function __construct(BadgeGeneratorService $badgeService)
    {
        $this->manager = new ImageManager(new Driver());
        $this->badgeService = $badgeService;
        $this->assetPath = storage_path('app/master_templates/assets');
        $this->jsonPath = storage_path('app/master_templates/json');
        $this->fontPath = storage_path('app/master_templates/fonts/Poppins-Bold.ttf');
        $this->outputPath = storage_path('app/public/layouts');

        if (!file_exists($this->outputPath)) {
            mkdir($this->outputPath, 0777, true);
        }
    }

    public function generateDebugLayout(array $pages, $templateId = null, $periodText = '')
    {
        ini_set('memory_limit', '1024M');
        set_time_limit(300);

        $generatedImages = [];

        foreach ($pages as $page) {
            try {
                $layoutType = $page['layout_type'];

                $jsonFilename = ($layoutType === 'cover') ? 'layout_cover.json' : 'layout_inner.json';
                $jsonFullPath = $this->jsonPath . '/' . $jsonFilename;

                $layoutData = [];
                $jsonWidth = 210;

                if (file_exists($jsonFullPath)) {
                    $rawJson = json_decode(file_get_contents($jsonFullPath), true);
                    $layoutData = isset($rawJson[0]) ? $rawJson[0] : $rawJson;
                    $jsonWidth = $layoutData['width'] ?? 210;
                }

                $scaleFactor = self::CANVAS_W / $jsonWidth;

                $defaultBgFilename = ($layoutType === 'cover')
                    ? 'img_bg_layout_cover.png'
                    : 'img_bg_layout_inner.png';

                $uiFrameFilename = ($layoutType === 'cover')
                    ? 'layout_ui_cover.png'
                    : 'layout_ui_inner.png';

                $defaultBgPath = $this->assetPath . '/' . $defaultBgFilename;
                $uiFramePath   = $this->assetPath . '/' . $uiFrameFilename;

                $customBgPath = null;
                if ($templateId) {
                    $templateDB = BackgroundTemplate::find($templateId);
                    if ($templateDB && Storage::disk('public')->exists($templateDB->image_path)) {
                        $customBgPath = storage_path('app/public/' . $templateDB->image_path);
                    }
                }

                $pathToLoad = $customBgPath ? $customBgPath : $defaultBgPath;

                if (file_exists($pathToLoad)) {
                    $canvas = $this->manager->read($pathToLoad);
                    $canvas->cover(self::CANVAS_W, self::CANVAS_H);
                } else {
                    $canvas = $this->manager->create(self::CANVAS_W, self::CANVAS_H)->fill('ffffff');
                }

                if (file_exists($uiFramePath)) {
                    $uiFrame = $this->manager->read($uiFramePath);
                    $uiFrame->resize(self::CANVAS_W, self::CANVAS_H);
                    $canvas->place($uiFrame, 'top-left', 0, 0);
                }

                if (!empty($layoutData)) {
                    $staticSlots = $this->findNodes($layoutData, array_keys($this->staticAssetMap));

                    foreach ($staticSlots as $slot) {
                        $layerName = $slot['name'];
                        $imageFile = $this->staticAssetMap[$layerName];
                        $imagePath = $this->assetPath . '/' . $imageFile;

                        if (file_exists($imagePath)) {
                            $sX = $slot['x'] * $scaleFactor;
                            $sY = $slot['y'] * $scaleFactor;
                            $sW = $slot['width'] * $scaleFactor;
                            $sH = $slot['height'] * $scaleFactor;

                            $overlay = $this->manager->read($imagePath);

                            $overlay->resize((int)$sW, (int)$sH);
                            $canvas->place($overlay, 'top-left', (int)$sX, (int)$sY);
                        }
                    }

                    $this->renderLayoutText($canvas, $layoutData, $scaleFactor, $periodText);

                    $productSlots = $this->findSlotNodes($layoutData);
                    ksort($productSlots);
                    $slotKeys = array_keys($productSlots);

                    foreach ($page['items'] as $index => $item) {
                        $componentName = $item['component_name'] ?? null;
                        $itemData = $item['data'] ?? [];

                        $targetX = 0;
                        $targetY = 0;
                        $targetW = 0;
                        $targetH = 0;

                        if (isset($item['slot_id']) && isset($productSlots[$item['slot_id']])) {
                            $slotNode = $productSlots[$item['slot_id']];
                            $targetX = $slotNode['x'] * $scaleFactor;
                            $targetY = $slotNode['y'] * $scaleFactor;
                            $targetW = $slotNode['width'] * $scaleFactor;
                            $targetH = $slotNode['height'] * $scaleFactor;
                        }
                        elseif (isset($slotKeys[$index])) {
                            $slotKey = $slotKeys[$index];
                            $slotNode = $productSlots[$slotKey];
                            $targetX = $slotNode['x'] * $scaleFactor;
                            $targetY = $slotNode['y'] * $scaleFactor;
                            $targetW = $slotNode['width'] * $scaleFactor;
                            $targetH = $slotNode['height'] * $scaleFactor;
                        }
                        elseif (isset($item['x'])) {
                            $targetX = $item['x'] * $scaleFactor;
                            $targetY = $item['y'] * $scaleFactor;
                            $targetW = $item['w'] * $scaleFactor;
                            $targetH = $item['h'] * $scaleFactor;
                        }

                        if ($targetW <= 0 || !$componentName || empty($itemData)) continue;

                        try {
                            $badgeUrl = $this->badgeService->generate($componentName, $itemData);

                            if ($badgeUrl) {
                                $filename = basename($badgeUrl);
                                $badgePath = storage_path("app/public/temp/badges/{$filename}");

                                if (file_exists($badgePath)) {
                                    $badgeImage = $this->manager->read($badgePath);
                                    $badgeImage->resize((int)$targetW, (int)$targetH);
                                    $canvas->place($badgeImage, 'top-left', (int)$targetX, (int)$targetY);
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error("Failed to generate/place badge for item {$index}: " . $e->getMessage());
                        }
                    }
                }

                $outputFilename = $layoutType . '.png';
                $canvas->save($this->outputPath . '/' . $outputFilename);
                $generatedImages[] = url('storage/layouts/' . $outputFilename);

            } catch (\Exception $e) {
                Log::error("Error generating layout page {$page['page_number']}: " . $e->getMessage());
                throw $e;
            }
        }

        return $generatedImages;
    }

    private function renderLayoutText($canvas, $root, $scaleFactor, $periodText)
    {
        $textNodes = $this->findTextNodes($root);

        foreach ($textNodes as $node) {
            $name = $node['name'];
            $x = $node['x'] * $scaleFactor;
            $y = $node['y'] * $scaleFactor;
            $w = $node['width'] * $scaleFactor;
            $fontSize = ($node['fontSize'] ?? 12) * $scaleFactor;

            if ($name === 'txt_tgl_periode' || $name === 'txt_tgl_periode_inner') {
                $canvas->text($periodText, $x + ($w / 2), $y, function(FontFactory $font) use ($fontSize) {
                    $font->filename($this->fontPath);
                    $font->size($fontSize);
                    $font->color('ffffff');
                    $font->align('center');
                    $font->valign('top');
                });
            }

            if ($name === 'txt_footer') {
                $text1 = "BBMU (Beli Banyak Makin Untung) Maksimal Bonus Poin IGR 1x";
                $text2 = " /Member/Hari";

                $canvas->text($text1, $x, $y, function(FontFactory $font) use ($fontSize) {
                    $font->filename($this->fontPath);
                    $font->size($fontSize);
                    $font->color('000000');
                    $font->align('left');
                    $font->valign('top');
                });

                $box = imagettfbbox($fontSize * 0.75, 0, $this->fontPath, $text1);
                $text1Width = abs($box[2] - $box[0]);

                $canvas->text($text2, $x + $text1Width, $y, function(FontFactory $font) use ($fontSize) {
                    $font->filename($this->fontPath);
                    $font->size($fontSize);
                    $font->color('ff0000');
                    $font->align('left');
                    $font->valign('top');
                });
            }
        }
    }

    private function findNodes($root, $targetNames)
    {
        $found = [];
        if (!isset($root['children'])) return $found;

        foreach ($root['children'] as $child) {
            if (in_array($child['name'], $targetNames)) {
                $found[] = [
                    'name' => $child['name'],
                    'x' => $child['x'] ?? 0,
                    'y' => $child['y'] ?? 0,
                    'width' => $child['width'] ?? 0,
                    'height' => $child['height'] ?? 0,
                ];
            }
            if (isset($child['children'])) {
                $found = array_merge($found, $this->findNodes($child, $targetNames));
            }
        }
        return $found;
    }

    private function findTextNodes($root)
    {
        $found = [];
        if (!isset($root['children'])) return $found;

        foreach ($root['children'] as $child) {
            if (str_starts_with($child['name'], 'txt_')) {
                $found[] = [
                    'name' => $child['name'],
                    'x' => $child['x'] ?? 0,
                    'y' => $child['y'] ?? 0,
                    'width' => $child['width'] ?? 0,
                    'height' => $child['height'] ?? 0,
                    'fontSize' => $child['fontSize'] ?? 12
                ];
            }
            if (isset($child['children'])) {
                $found = array_merge($found, $this->findTextNodes($child));
            }
        }
        return $found;
    }

    private function findSlotNodes($root)
    {
        $slots = [];
        if (!isset($root['children'])) return $slots;

        foreach ($root['children'] as $child) {
            if (str_starts_with($child['name'], 'slot_')) {
                $slots[$child['name']] = [
                    'name' => $child['name'],
                    'x' => $child['x'] ?? 0,
                    'y' => $child['y'] ?? 0,
                    'width' => $child['width'] ?? 0,
                    'height' => $child['height'] ?? 0,
                ];
            }
            if (isset($child['children'])) {
                $slots = array_merge($slots, $this->findSlotNodes($child));
            }
        }
        return $slots;
    }
}
