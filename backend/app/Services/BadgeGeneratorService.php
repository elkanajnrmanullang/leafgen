<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Typography\FontFactory;

class BadgeGeneratorService
{
    private $basePath;
    private $fontPath;
    private $tempPath;
    private $manager;

    private const SCALE_FACTOR = 11.811;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());

        $this->basePath = storage_path('app/master_templates');
        $this->fontPath = $this->basePath . '/fonts';
        $this->tempPath = 'public/temp/badges';

        if (!Storage::exists($this->tempPath)) {
            Storage::makeDirectory($this->tempPath);
        }
    }

    public function generate(string $componentName, array $dataReplacement)
    {
        $jsonPath = "{$this->basePath}/json/components/{$componentName}.json";
        $imgPath = "{$this->basePath}/assets/components/{$componentName}_bg.png";

        if (!file_exists($jsonPath) || !file_exists($imgPath)) {
            return null;
        }

        $config = json_decode(file_get_contents($jsonPath), true);
        $frame = isset($config[0]) ? $config[0] : $config;

        $img = $this->manager->read($imgPath);

        $scaleX = $img->width() / ($frame['width'] ?? 1);
        $scaleY = $img->height() / ($frame['height'] ?? 1);

        if (isset($frame['children'])) {
            foreach ($frame['children'] as $layer) {
                if ($layer['type'] !== 'TEXT') continue;

                $layerName = $layer['name'];

                if (array_key_exists($layerName, $dataReplacement)) {
                    $textToWrite = $dataReplacement[$layerName];

                    if (empty($textToWrite)) continue;

                    $fontSize = ($layer['fontSize'] ?? 12) * $scaleX;
                    $r = $layer['fills'][0]['color']['r'] ?? 0;
                    $g = $layer['fills'][0]['color']['g'] ?? 0;
                    $b = $layer['fills'][0]['color']['b'] ?? 0;
                    $fontColor = $this->rgbToHex(['r'=>$r, 'g'=>$g, 'b'=>$b]);

                    $fontStyle = $layer['fontName']['style'] ?? 'Regular';
                    $fontFile = $this->getFontFile($fontStyle);

                    $x = ($layer['x'] ?? 0) * $scaleX;
                    $y = ($layer['y'] ?? 0) * $scaleY;

                    $img->text($textToWrite, $x, $y, function(FontFactory $font) use ($fontFile, $fontSize, $fontColor) {
                        $font->filename($fontFile);
                        $font->size($fontSize);
                        $font->color($fontColor);
                        $font->align('left');
                        $font->valign('top');
                    });
                }
            }
        }

        $fullStoragePath = storage_path("app/public/temp/badges");

        if (!file_exists($fullStoragePath)) {
            mkdir($fullStoragePath, 0777, true);
        }

        $hash = md5($componentName . json_encode($dataReplacement));
        $filename = "{$componentName}_{$hash}.png";
        $savePath = "{$fullStoragePath}/{$filename}";

        $img->save($savePath);

        return asset("storage/temp/badges/{$filename}");
    }

    private function getFontFile($style)
    {
        $map = [
            'Bold' => 'Poppins-Bold.ttf',
            'SemiBold' => 'Poppins-SemiBold.ttf',
            'Regular' => 'Poppins-Regular.ttf',
            'Medium' => 'Poppins-Medium.ttf'
        ];

        $file = $map[$style] ?? 'Poppins-Regular.ttf';
        return "{$this->fontPath}/{$file}";
    }

    private function rgbToHex($colorObj)
    {
        $r = dechex(round($colorObj['r'] * 255));
        $g = dechex(round($colorObj['g'] * 255));
        $b = dechex(round($colorObj['b'] * 255));
        return "#" . str_pad($r, 2, "0", STR_PAD_LEFT) . str_pad($g, 2, "0", STR_PAD_LEFT) . str_pad($b, 2, "0", STR_PAD_LEFT);
    }
}
