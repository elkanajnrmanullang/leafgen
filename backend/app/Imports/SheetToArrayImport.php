<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithWorksheet;

class SheetToArrayImport implements ToArray, WithWorksheet
{
    private string $sheetName;

    public function __construct(string $sheetName)
    {
        $this->sheetName = $sheetName;
    }

    public function worksheet(): string
    {
        return $this->sheetName;
    }

    public function array(array $array)
    {
    }
}
