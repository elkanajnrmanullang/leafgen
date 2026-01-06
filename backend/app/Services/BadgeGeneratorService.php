<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Typography\FontFactory;
use Illuminate\Support\Facades\Log;

class BadgeGeneratorService
{
    private $basePath;
    private $fontPath;
    private $tempPath;
    private $publicUploadPath;
    private $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());

        $this->basePath = storage_path('app/master_templates');
        $this->fontPath = $this->basePath . '/fonts';
        $this->tempPath = storage_path('app/public/temp/badges');
        $this->publicUploadPath = storage_path('app/public');

        if (!file_exists($this->tempPath)) {
            mkdir($this->tempPath, 0777, true);
        }
    }

    public function generate(string $componentName, array $dataReplacement, ?string $customBgName = null)
    {
        $files = $this->findFiles($componentName, $customBgName);

        if (!$files) {
            return null;
        }

        $jsonPath = $files['json'];
        $imgPath = $files['img'];

        $config = json_decode(file_get_contents($jsonPath), true);
        $frame = isset($config[0]) ? $config[0] : $config;

        $img = $this->manager->read($imgPath);

        $canvasWidth = $img->width();
        $canvasHeight = $img->height();

        $designWidth = $frame['absoluteBoundingBox']['width'] ?? ($frame['width'] ?? 1);
        $designHeight = $frame['absoluteBoundingBox']['height'] ?? ($frame['height'] ?? 1);

        $scaleX = $canvasWidth / $designWidth;
        $scaleY = $canvasHeight / $designHeight;

        $scaleFont = ($scaleX + $scaleY) / 2;

        $rootX = $frame['absoluteBoundingBox']['x'] ?? 0;
        $rootY = $frame['absoluteBoundingBox']['y'] ?? 0;

        $hasCoret = !empty($dataReplacement['txt_coret']);
        $hasPromo = !empty($dataReplacement['img_bg_label_promo']);
        $useAltLayout = $hasCoret && $hasPromo;

        $promoKeys = [
            'img_bg_label_promo',
            'img_container_ketPromo',
            'txt_qty_promo',
            'txt_price_promo',
            'txt_keterangan_promo',
            'txt_satuan'
        ];

        if (isset($frame['children'])) {

            $layers = $frame['children'];

            foreach ($layers as $layer) {
                $layerName = $layer['name'];

                $isAltLayer = str_ends_with($layerName, '_alt');
                $baseName = $isAltLayer ? substr($layerName, 0, -4) : $layerName;
                $isPromoLayer = in_array($baseName, $promoKeys);

                if ($useAltLayout) {
                    if ($isPromoLayer && !$isAltLayer) continue;
                } else {
                    if ($isAltLayer) continue;
                }

                if (!str_starts_with($baseName, 'img_')) continue;
                if (!array_key_exists($baseName, $dataReplacement)) continue;

                $value = $dataReplacement[$baseName];
                if (empty($value)) continue;

                $insertPath = $this->findInsertImage($value);

                if ($insertPath) {
                    try {
                        $imgToInsert = $this->manager->read($insertPath);

                        $absW = $layer['absoluteBoundingBox']['width'] ?? 0;
                        $absH = $layer['absoluteBoundingBox']['height'] ?? 0;
                        $absX = $layer['absoluteBoundingBox']['x'] ?? 0;
                        $absY = $layer['absoluteBoundingBox']['y'] ?? 0;

                        $finalX = ($absX - $rootX) * $scaleX;
                        $finalY = ($absY - $rootY) * $scaleY;
                        $targetW = $absW * $scaleX;
                        $targetH = $absH * $scaleY;

                        if ($targetW <= 1) $targetW = 1;
                        if ($targetH <= 1) $targetH = 1;

                        if ($baseName === 'img_product') {
                            $imgToInsert->scale((int)$targetW, (int)$targetH);

                            $newW = $imgToInsert->width();
                            $newH = $imgToInsert->height();

                            $offsetX = ($targetW - $newW) / 2;
                            $offsetY = ($targetH - $newH) / 2;

                            $img->place($imgToInsert, 'top-left', (int)($finalX + $offsetX), (int)($finalY + $offsetY));
                        } else {
                            $imgToInsert->resize((int)$targetW, (int)$targetH);
                            $img->place($imgToInsert, 'top-left', (int)$finalX, (int)$finalY);
                        }
                    } catch (\Exception $e) {
                        Log::warning("Failed to insert image layer {$layerName}: " . $e->getMessage());
                    }
                }
            }

            foreach ($layers as $layer) {
                $layerName = $layer['name'];

                $isAltLayer = str_ends_with($layerName, '_alt');
                $baseName = $isAltLayer ? substr($layerName, 0, -4) : $layerName;
                $isPromoLayer = in_array($baseName, $promoKeys);

                if ($useAltLayout) {
                    if ($isPromoLayer && !$isAltLayer) continue;
                } else {
                    if ($isAltLayer) continue;
                }

                if ($layer['type'] !== 'TEXT') continue;
                if (!array_key_exists($baseName, $dataReplacement)) continue;

                $value = $dataReplacement[$baseName];
                if (empty($value)) continue;

                $jsonFontSize = $layer['fontSize'] ?? 12;
                $baseFontSize = is_numeric($jsonFontSize) ? (float)$jsonFontSize : 12.0;
                $fontSize = $baseFontSize * $scaleFont;

                $r = $layer['fills'][0]['color']['r'] ?? 0;
                $g = $layer['fills'][0]['color']['g'] ?? 0;
                $b = $layer['fills'][0]['color']['b'] ?? 0;
                $fontColor = $this->rgbToHex(['r'=>$r, 'g'=>$g, 'b'=>$b]);

                $fontFamily = $layer['fontName']['family'] ?? 'Poppins';
                $fontStyle = $layer['fontName']['style'] ?? 'Regular';
                $fontFile = $this->getFontFile($fontFamily, $fontStyle);

                $absX = $layer['absoluteBoundingBox']['x'] ?? 0;
                $absY = $layer['absoluteBoundingBox']['y'] ?? 0;
                $absW = $layer['absoluteBoundingBox']['width'] ?? 0;
                $absH = $layer['absoluteBoundingBox']['height'] ?? 0;

                $finalX = ($absX - $rootX) * $scaleX;
                $finalY = ($absY - $rootY) * $scaleY;
                $finalW = $absW * $scaleX;
                $finalH = $absH * $scaleY; 

                $textAlign = $layer['textAlignHorizontal'] ?? 'LEFT';
                $alignMap = ['LEFT' => 'left', 'CENTER' => 'center', 'RIGHT' => 'right', 'JUSTIFIED' => 'left'];
                $align = $alignMap[$textAlign] ?? 'left';

                $drawX = $finalX;
                if ($align === 'center') {
                    $drawX = $finalX + ($finalW / 2);
                } elseif ($align === 'right') {
                    $drawX = $finalX + $finalW;
                }

                $lines = [];
                $finalFontSize = $fontSize;

                if ($baseName === 'txt_name') {
                    $maxLines = 2;
                    $startFontSize = $fontSize * 1.25;
                    $minFontSize = $fontSize * 0.7;

                    $fitFound = false;
                    for ($s = $startFontSize; $s >= $minFontSize; $s -= 0.5) {
                        $tempLines = $this->wrapText($value, $s, $fontFile, $finalW);

                        $totalHeight = count($tempLines) * ($s * 1.15);

                        if (count($tempLines) <= $maxLines && $totalHeight <= ($finalH + 5)) {
                            $lines = $tempLines;
                            $finalFontSize = $s;
                            $fitFound = true;
                            break;
                        }
                    }

                    if (!$fitFound) {
                        $finalFontSize = $minFontSize;
                        $lines = $this->wrapText($value, $finalFontSize, $fontFile, $finalW);
                        $lines = array_slice($lines, 0, $maxLines);
                    }
                } else {
                    $lines = [$value];
                }

                $lineHeight = $finalFontSize * 1.2;

                foreach ($lines as $index => $lineText) {
                    $currentY = $finalY + ($index * $lineHeight);

                    $img->text($lineText, $drawX, $currentY, function(FontFactory $font) use ($fontFile, $finalFontSize, $fontColor, $align) {
                        $font->filename($fontFile);
                        $font->size($finalFontSize);
                        $font->color($fontColor);
                        $font->align($align);
                        $font->valign('top');
                    });
                }
            }
        }

        $uniqueString = $componentName . ($customBgName ?? 'default') . json_encode($dataReplacement);
        $hash = md5($uniqueString);
        $filename = "{$componentName}_{$hash}.png";
        $savePath = "{$this->tempPath}/{$filename}";

        $img->save($savePath);

        return asset("storage/temp/badges/{$filename}");
    }

    private function wrapText($text, $fontSize, $fontFile, $maxWidth)
    {
        $words = explode(' ', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            $testLine = $currentLine . ($currentLine ? ' ' : '') . $word;
            $width = 0;

            try {
                $box = imagettfbbox($fontSize, 0, $fontFile, $testLine);
                if ($box) {
                    $width = abs($box[2] - $box[0]);
                }
            } catch (\Exception $e) {
                $width = strlen($testLine) * ($fontSize * 0.6);
            }

            if ($width <= $maxWidth) {
                $currentLine = $testLine;
            } else {
                if ($currentLine) {
                    $lines[] = $currentLine;
                }
                $currentLine = $word;
            }
        }
        if ($currentLine) {
            $lines[] = $currentLine;
        }

        return $lines;
    }

    private function findInsertImage($filenameOrPath)
    {
        if (filter_var($filenameOrPath, FILTER_VALIDATE_URL)) {
            return $filenameOrPath;
        }

        if (file_exists($filenameOrPath)) return $filenameOrPath;

        $candidates = [
            "{$this->publicUploadPath}/{$filenameOrPath}",
            "{$this->publicUploadPath}/uploads/{$filenameOrPath}",
            "{$this->basePath}/assets/components/{$filenameOrPath}",
            "{$this->basePath}/assets/components/{$filenameOrPath}.png",
            "{$this->basePath}/assets/{$filenameOrPath}",
            "{$this->basePath}/assets/{$filenameOrPath}.png"
        ];

        foreach ($candidates as $path) {
            if (file_exists($path)) return $path;
        }

        return null;
    }

    private function findFiles($name, $customBgName = null)
    {
        $bgCandidates = [];
        if ($customBgName) {
            $bgCandidates[] = "{$this->publicUploadPath}/{$customBgName}";
            $bgCandidates[] = "{$this->publicUploadPath}/backgrounds/{$customBgName}";
            $bgCandidates[] = "{$this->basePath}/assets/{$customBgName}.png";
            $bgCandidates[] = "{$this->basePath}/assets/{$customBgName}";
        }
        $bgCandidates[] = "{$this->basePath}/assets/{$name}_bg.png";
        $bgCandidates[] = "{$this->basePath}/assets/{$name}.png";
        $bgCandidates[] = "{$this->basePath}/assets/components/{$name}_bg.png";
        $bgCandidates[] = "{$this->basePath}/assets/components/{$name}.png";

        $jsonLocations = [
            "{$this->basePath}/json/{$name}.json",
            "{$this->basePath}/json/components/{$name}.json"
        ];

        foreach ($jsonLocations as $jsonPath) {
            if (file_exists($jsonPath)) {
                foreach ($bgCandidates as $bgPath) {
                    if (file_exists($bgPath)) {
                        return ['json' => $jsonPath, 'img' => $bgPath];
                    }
                }
            }
        }
        return null;
    }

    private function getFontFile($family, $style)
    {
        $styleClean = str_replace(' ', '', $style);
        $familyClean = str_replace(' ', '', $family);

        $filename = "{$familyClean}-{$styleClean}.ttf";
        $fullPath = "{$this->fontPath}/{$filename}";

        if (file_exists($fullPath)) return $fullPath;

        $fallbackPath = "{$this->fontPath}/{$familyClean}-Regular.ttf";
        if (file_exists($fallbackPath)) return $fallbackPath;

        if (str_contains(strtolower($style), 'bold')) {
             $boldPath = "{$this->fontPath}/Poppins-Bold.ttf";
             if (file_exists($boldPath)) return $boldPath;
        }

        return "{$this->fontPath}/Poppins-Regular.ttf";
    }

    private function rgbToHex($colorObj)
    {
        $r = dechex(round(($colorObj['r'] ?? 0) * 255));
        $g = dechex(round(($colorObj['g'] ?? 0) * 255));
        $b = dechex(round(($colorObj['b'] ?? 0) * 255));
        return "#" . str_pad($r, 2, "0", STR_PAD_LEFT) . str_pad($g, 2, "0", STR_PAD_LEFT) . str_pad($b, 2, "0", STR_PAD_LEFT);
    }
}