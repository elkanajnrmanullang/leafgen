<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\RegionsImport;
use App\Imports\LeafletDataImport;
use App\Imports\HeadingRowImport;
use App\Imports\SheetToArrayImport;
use App\Models\Leaflet;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;

class LeafletController extends Controller
{
    private function findPromoSheetName(string $filePath): ?string
    {
        try {
            $fullPath = Storage::path($filePath);
            $spreadsheet = IOFactory::load($fullPath);

            foreach ($spreadsheet->getSheetNames() as $sheetName) {
                $worksheet = $spreadsheet->getSheetByName($sheetName);
                $cellValue = $worksheet->getCell('A1')->getValue();

                if (str_contains(strtoupper((string)$cellValue), 'FINAL PROMO SPI')) {
                    return $sheetName;
                }
            }
        } catch (\Exception $e) {
            Log::error('Gagal membaca sheet Excel: ' . $e->getMessage());
            return null;
        }

        return null;
    }

    public function uploadAndGetRegions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'leaflet_file' => 'required|file|mimes:xlsx,csv|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('leaflet_file');
        $path = null;

        try {
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('temp_leaflets', $fileName);

            $correctSheetName = $this->findPromoSheetName($path);

            if ($correctSheetName === null) {
                Storage::delete($path);
                return response()->json(['message' => 'File Excel tidak valid. Sheet "FINAL PROMO SPI" tidak ditemukan.'], 400);
            }

            $headerRowNumber = 4;
            $headingImport = new HeadingRowImport($headerRowNumber);
            $headingImport->setSheetName($correctSheetName);
            $headings = Excel::toArray($headingImport, $path);

            $regions = [];
            $storeColIndex = -1;

             if(isset($headings[0][0])) {
                 foreach($headings[0][0] as $index => $header) {
                     if(strtolower(trim($header ?? '')) === 'store') {
                         $storeColIndex = $index;
                         break;
                     }
                 }
             }

             if($storeColIndex !== -1) {
                $allDataImport = new SheetToArrayImport($correctSheetName);
                $allDataRows = Excel::toArray($allDataImport, $path);

                $allData = collect($allDataRows[0]);

                $dataStartRowIndex = 4;
                $regions = $allData->slice($dataStartRowIndex)
                                    ->pluck($storeColIndex)
                                    ->map(fn($val) => trim(strtolower($val ?? '')))
                                    ->filter()
                                    ->unique()
                                    ->values()
                                    ->all();
             }

            $uniqueRegions = $regions;

            if (empty($uniqueRegions)) {
                Storage::delete($path);
                return response()->json(['message' => 'Kolom "Store" tidak ditemukan atau kosong.'], 400);
            }

            return response()->json([
                'message' => 'File berhasil diunggah.',
                'file_path' => $path,
                'regions' => $uniqueRegions,
            ]);

        } catch (\Exception $e) {
            Log::error('Error Upload/GetRegions: at ' . $e->getFile() . ':' . $e->getLine() . ' ' . $e->getMessage());
             if ($path && Storage::exists($path)) {
                 Storage::delete($path);
             }
            return response()->json(['message' => 'Gagal memproses file.', 'error' => $e->getMessage()], 500);
        }
    }

    public function generateLayout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file_path' => 'required|string',
            'region' => 'required|string',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $filePath = $request->input('file_path');
        $region = $request->input('region');

        clearstatcache();

        if (!Storage::exists($filePath)) {
            return response()->json(['message' => 'File tidak ditemukan atau sesi telah berakhir.'], 404);
        }

        try {
            $correctSheetName = $this->findPromoSheetName($filePath);
            if ($correctSheetName === null) {
                return response()->json(['message' => 'File Excel tidak valid. Sheet "FINAL PROMO SPI" tidak ditemukan.'], 400);
            }

            $leafletImport = new LeafletDataImport($region);
            $leafletImport->setSheetName($correctSheetName);

            Excel::import($leafletImport, $filePath);
            $productData = $leafletImport->getProcessedData();

            if ($productData->isEmpty()) {
                Storage::delete($filePath);
                return response()->json(['message' => 'Tidak ada data produk ditemukan untuk region yang dipilih.'], 404);
            }

            Storage::delete($filePath);

            $layout = [];
            $columnCount = 4;
            $itemWidth = 200;
            $itemHeight = 250;
            $gap = 20;
            $validProductIndex = 0;

            foreach ($productData as $item) {
                $row = floor($validProductIndex / $columnCount);
                $col = $validProductIndex % $columnCount;

                $posX = $col * ($itemWidth + $gap);
                $posY = $row * ($itemHeight + $gap);

                $layout[] = [
                    'id' => $item['plu_code'],
                    'plu' => $item['plu_code'],
                    'name' => $item['nama_barang'],
                    'displayPrice' => $item['harga_tampil'],
                    'strikethroughPrice' => $item['harga_coret'],
                    'imagePath' => $item['image_path'],
                    'imageMissing' => $item['imageMissing'],
                    'initialX' => $posX,
                    'initialY' => $posY,
                    'currentX' => $posX,
                    'currentY' => $posY,
                    'styles' => [
                         'fontFamily' => 'Arial',
                         'fontSize' => 12,
                         'fontColor' => '#000000',
                         'bgColor' => '#FFFFFF',
                         'borderColor' => '#CCCCCC',
                         'borderWidth' => 1,
                         'imageScale' => 1,
                     ]
                ];
                $validProductIndex++;
            }

             if (empty($layout)) {
                 return response()->json(['message' => 'Tidak ada produk valid yang dapat ditampilkan.'], 404);
             }

            return response()->json([
                'layout' => $layout,
                'grid_info' => [
                    'columns' => $columnCount,
                    'itemWidth' => $itemWidth,
                    'itemHeight' => $itemHeight,
                    'gap' => $gap
                ]
            ]);

        } catch (\Exception $e) {
            if (Storage::exists($filePath)) {
                Storage::delete($filePath);
            }
            Log::error('Error saat generate layout: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Gagal memproses data layout.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getSmartGridStatus()
    {
        try {
            $leafletCount = Leaflet::count();
            $isSmartGridActive = $leafletCount >= 5;
            return response()->json(['active' => $isSmartGridActive]);
        } catch (\Exception $e) {
            Log::error('Error getSmartGridStatus: ' . $e->getMessage());
            return response()->json(['active' => false], 500);
        }
    }
}