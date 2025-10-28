<?php

namespace App\Imports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\WithWorksheet;

class LeafletDataImport implements ToCollection, WithStartRow, WithChunkReading, WithWorksheet
{
    private string $targetRegion;
    private Collection $processedData;
    private string $sheetName;

    private const PLU_UNIT_COL = 2;
    private const NAMA_BARANG_COL = 3;
    private const HARGA_CORET_COL = 9;
    private const HARGA_TAMPIL_COL = 13;
    private const STORE_COL = 14;
    private const START_ROW = 5;

    public function __construct(string $region)
    {
        $this->targetRegion = trim(strtolower($region));
        $this->processedData = collect();
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $rowData = $row->toArray();
            $storeValue = isset($rowData[self::STORE_COL]) ? trim(strtolower($rowData[self::STORE_COL])) : '';

            if ($storeValue === $this->targetRegion) {
                $pluCode = isset($rowData[self::PLU_UNIT_COL]) ? trim($rowData[self::PLU_UNIT_COL]) : null;

                if ($pluCode) {
                    $product = Product::where('plu_code', $pluCode)->select('id', 'image_path')->first();

                    $this->processedData->push([
                        'plu_code' => $pluCode,
                        'product_id' => $product ? $product->id : null,
                        'nama_barang' => isset($rowData[self::NAMA_BARANG_COL]) ? trim($rowData[self::NAMA_BARANG_COL]) : '',
                        'harga_coret' => isset($rowData[self::HARGA_CORET_COL]) ? $this->formatPrice($rowData[self::HARGA_CORET_COL]) : null,
                        'harga_tampil' => isset($rowData[self::HARGA_TAMPIL_COL]) ? $this->formatPrice($rowData[self::HARGA_TAMPIL_COL]) : 0,
                        'image_path' => $product ? $product->image_path : null,
                        'found_in_db' => $product !== null,
                        'imageMissing' => $product === null || $product->image_path === null,
                    ]);
                }
            }
        }
    }

    private function formatPrice($price): ?float
    {
        if ($price === null || $price === '') {
            return null;
        }

        $cleaned = preg_replace('/[^\d]/', '', (string) $price);

        if (is_numeric($cleaned)) {
            return (float) $cleaned;
        }

        return null;
    }

    public function getProcessedData(): Collection
    {
        return $this->processedData;
    }

    public function startRow(): int
    {
        return self::START_ROW;
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function setSheetName(string $sheetName)
    {
        $this->sheetName = $sheetName;
    }

    public function worksheet(): string
    {
        return $this->sheetName;
    }
}
