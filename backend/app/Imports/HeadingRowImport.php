<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithWorksheet;

class HeadingRowImport implements ToArray, WithStartRow, SkipsEmptyRows, WithWorksheet
{
    use Importable;

    private int $startRow;
    private string $sheetName;

    public function __construct(int $startRow = 1)
    {
        $this->startRow = $startRow;
    }

    public function startRow(): int
    {
        return $this->startRow;
    }

    public function array(array $array)
    {
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
