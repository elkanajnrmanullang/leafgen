<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Konfigurasi Wilayah Leaflet (Store Mapping)
    |--------------------------------------------------------------------------
    |
    | Format: 'KODE_WILAYAH' => ['keyword1', 'keyword2', 'kode_toko_3_huruf']
    | Sistem akan mencari string ini di dalam kolom "STORE" pada Excel.
    |
    */

    'JAWA' => [
        'JAWA',
        'BALI', 'BLI',
        'BOGOR', 'BGR',
        'CIKOKOL', 'CKL',
        'CIPINANG', 'CPG',
        'CIPUTAT', 'CPT',
        'KARAWANG', 'KRW',
        'KEMAYORAN', 'KMY',
        'MALANG', 'MLG',
        'PURWOKERTO', 'PWT',
        'SEMARANG', 'SMG',
        'SOLO', 'SLO',
        'SUKABUMI', 'SBI',
        'SURABAYA', 'SBY',
        'TANGERANG', 'TGR',
        'YOGYAKARTA', 'YOG',
    ],
    'SUM' => [
        'SUM',
        'SUMATERA',
        'BATAM', 'BTM',
        'JAMBI', 'JBI',
        'LAMPUNG', 'BDL',
        'MEDAN', 'MDN',
        'PALEMBANG', 'PLG',
        'PEKANBARU', 'PKU',
    ],
    'KAL' => [
        'KAL',
        'KALIMANTAN',
        'BANJARMASIN', 'BMS',
        'PONTIANAK', 'PTK',
        'SAMARINDA', 'SMD',
    ],
    'SUL' => [
        'SUL',
        'SULAWESI',
        'GORONTALO', 'GTO',
        'KENDARI', 'KRI',
        'MAKASSAR', 'MKS',
        'MANADO', 'MDO',
    ],
    'MALUKU' => [
        'MALUKU',
        'AMBON', 'AMB',
    ],
];