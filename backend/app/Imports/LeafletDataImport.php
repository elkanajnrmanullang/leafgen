<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;

class LeafletDataImport implements ToArray, WithStartRow, WithCalculatedFormulas
{
    public function startRow(): int
    {
        return 10;
    }

    public function array(array $array)
    {
        return $array;
    }
}
