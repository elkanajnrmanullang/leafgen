<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;

class LeafletDataImport implements ToArray, WithHeadingRow, WithCalculatedFormulas
{
    public function array(array $array)
    {
        return $array;
    }
}
