<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Geometry\Factories\RectangleFactory;
use Intervention\Image\Typography\FontFactory;

class LeafletComposerService
{
    private $manager;
    private $basePath;
    private $outputPath;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
        $this->basePath = storage_path('app/master_templates/assets'); // Tempat simpan background
        $this->outputPath = storage_path('app/public/debug_layouts'); // Output hasil

        if (!file_exists($this->outputPath)) {
            mkdir($this->outputPath, 0777, true);
        }
    }

    public function generateDebugLayout(array $pagesData)
    {
        $results = [];

        foreach ($pagesData as $page) {
            // 1. Tentukan Background berdasarkan tipe halaman
            $bgFile = ($page['layout_type'] === 'cover') ? 'layout_cover.png' : 'layout_inner.png';
            $bgPath = $this->basePath . '/' . $bgFile;

            // Jika background belum ada, buat kanvas putih polos A4
            if (file_exists($bgPath)) {
                $canvas = $this->manager->read($bgPath);
            } else {
                $canvas = $this->manager->create(2480, 3508)->fill('ffffff');
            }

            // 2. Loop Item dan Gambar Kotak Wireframe
            foreach ($page['items'] as $item) {
                $x = $item['x'];
                $y = $item['y'];
                $w = $item['w'];
                $h = $item['h'];
                $plu = $item['plu'] ?? 'Unknown';
                $name = $item['data']['txt_name'] ?? 'No Name';

                // Gambar Kotak Transparan (Merah) untuk cek area
                $canvas->drawRectangle($x, $y, function (RectangleFactory $rectangle) use ($w, $h) {
                    $rectangle->size($w, $h);
                    $rectangle->background('rgba(255, 0, 0, 0.3)'); // Merah Transparan
                    $rectangle->border('ff0000', 2); // Garis tepi merah tebal
                });

                // Tulis Info Debug di tengah kotak
                $infoText = "PLU: $plu\n$name";

                // Hitung posisi tengah untuk teks (Kira-kira)
                $textX = $x + 10;
                $textY = $y + 40;

                $canvas->text($infoText, $textX, $textY, function(FontFactory $font) {
                    $font->filename(storage_path('app/master_templates/fonts/Poppins-Regular.ttf')); // Pastikan font ada
                    $font->size(24);
                    $font->color('000000');
                    $font->align('left');
                    $font->valign('top');
                    $font->wrap(180); // Wrap text agar tidak keluar kotak
                });
            }

            // 3. Simpan Hasil
            $filename = 'debug_page_' . $page['page_number'] . '_' . time() . '.png';
            $canvas->save($this->outputPath . '/' . $filename);

            $results[] = asset('storage/debug_layouts/' . $filename);
        }

        return $results;
    }
}
