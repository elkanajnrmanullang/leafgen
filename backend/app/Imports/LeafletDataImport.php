<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;

class LeafletDataImport implements ToArray, WithCalculatedFormulas
{
    public function array(array $array)
    {
        return $array;
    }
}
