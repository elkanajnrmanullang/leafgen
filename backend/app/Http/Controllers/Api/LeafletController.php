<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Imports\LeafletDataImport;
use App\Services\LeafletParserService;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Leaflet;

class LeafletController extends Controller
{
    protected $parserService;

    public function __construct(LeafletParserService $parserService)
    {
        $this->parserService = $parserService;
    }

    public function index()
    {
        try {
            $leaflets = Leaflet::orderBy('updated_at', 'desc')->get();

            $formatted = $leaflets->map(function ($item) {
                $pages = json_decode($item->content, true) ?? [];
                return [
                    'id' => $item->id,
                    'title' => $item->name,
                    'store' => $item->store_name ?? 'Unknown',
                    'date' => $item->updated_at->format('d M Y H:i'),
                    'status' => $item->status ?? 'draft',
                    'pageCount' => count($pages),
                    'thumbnailUrl' => null
                ];
            });

            return response()->json(['success' => true, 'data' => $formatted]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $leaflet = Leaflet::findOrFail($id);
            $content = json_decode($leaflet->content, true);

            return response()->json([
                'success' => true,
                'data' => [
                    'leaflet_name' => $leaflet->name,
                    'store' => $leaflet->store_name,
                    'pages' => $content,
                    'id' => $leaflet->id
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Leaflet not found'], 404);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'store' => 'required|string',
            'pages' => 'present|array',
            'status' => 'required|string'
        ]);

        try {
            $leaflet = null;
            if ($request->has('id') && $request->id) {
                $leaflet = Leaflet::find($request->id);
            }

            $contentJson = json_encode($request->pages);

            if ($leaflet) {
                $leaflet->update([
                    'name' => $request->title,
                    'store_name' => $request->store,
                    'content' => $contentJson,
                    'status' => $request->status
                ]);
            } else {
                $leaflet = Leaflet::create([
                    'name' => $request->title,
                    'store_name' => $request->store,
                    'content' => $contentJson,
                    'status' => $request->status,
                    'user_id' => 1
                ]);
            }

            return response()->json(['success' => true, 'data' => $leaflet]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function generateDraft(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
            'store_name' => 'required|string',
        ]);

        try {
            $rawData = Excel::toArray(new LeafletDataImport, $request->file('file'));

            if (empty($rawData) || empty($rawData[0])) {
                return response()->json(['message' => 'File Excel kosong atau tidak terbaca'], 400);
            }

            $sheetData = $rawData[0];

            $mapConfig = $this->mapColumnsVertically($sheetData);

            if (empty($mapConfig['map']['plu']) || empty($mapConfig['map']['nama_barang'])) {
                return response()->json([
                    'message' => 'Gagal membaca format Excel. Pastikan ada kolom "UNIT" dan "NAMA BARANG".'
                ], 400);
            }

            $cleanData = $this->extractDataUsingMap($sheetData, $mapConfig);

            if (empty($cleanData)) {
                return response()->json(['message' => 'Tidak ada data produk yang ditemukan.'], 400);
            }

            $result = $this->parserService->parse($cleanData, $request->store_name);

            return response()->json([
                'success' => true,
                'data' => [
                    'leaflet_name' => 'Draft Otomatis',
                    'store' => $request->store_name,
                    'pages' => $result
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadAndGetRegions(Request $request)
    {
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:2048']);

        try {
            $rawData = Excel::toArray(new LeafletDataImport, $request->file('file'));
            if (empty($rawData) || empty($rawData[0])) {
                return response()->json(['message' => 'File kosong'], 400);
            }
            $sheetData = $rawData[0];

            $mapConfig = $this->mapColumnsVertically($sheetData);

            if (!isset($mapConfig['map']['store'])) {
                return response()->json(['success' => true, 'data' => ['NASIONAL (Default)']]);
            }

            $storeColIdx = $mapConfig['map']['store'];
            $startRow = $mapConfig['start_row'];
            $detectedStores = [];

            $totalRows = count($sheetData);
            for ($i = $startRow; $i < $totalRows; $i++) {
                $val = $sheetData[$i][$storeColIdx] ?? '';
                if (!empty($val)) {
                    $parts = explode(',', $val);
                    foreach ($parts as $p) {
                        $cleanStore = trim(strtoupper($p));
                        if (!empty($cleanStore) && strlen($cleanStore) < 50) {
                            $detectedStores[$cleanStore] = true;
                        }
                    }
                }
            }

            $resultList = array_keys($detectedStores);
            sort($resultList);

            return response()->json([
                'success' => true,
                'data' => $resultList
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function mapColumnsVertically(array $sheetData)
    {
        $scanLimit = 15;
        $mapping = [];
        $dataStartRow = 0;

        $maxCols = 0;
        foreach (array_slice($sheetData, 0, $scanLimit) as $row) {
            $maxCols = max($maxCols, count($row));
        }

        $rules = [
            'plu' => ['UNIT', 'PLU'],
            'nama_barang' => ['NAMA BARANG', 'DESKRIPSI'],
            'store' => ['STORE', 'WILAYAH'],
            'syarat_bbmu' => ['SYARAT BBMU'],
            'nett' => ['NETT', 'HARGA'],
            'promosi_h_jual_setting_md' => ['Setting MD', 'SETTING MD'],
            'setting_pp_supp' => ['SUPP'],
            'setting_pp_mkt' => ['MKT'],
            'keteranganpembatasan' => ['KETERANGAN/PEMBATASAN', 'KETERANGAN'],
            'poin' => ['POIN']
        ];

        for ($col = 0; $col < $maxCols; $col++) {
            $colText = '';
            for ($row = 0; $row < $scanLimit; $row++) {
                if (isset($sheetData[$row][$col])) {
                    $val = (string)$sheetData[$row][$col];
                    if (!empty($val)) {
                        $colText .= ' ' . strtoupper($val);
                    }
                }
            }

            foreach ($rules as $key => $keywords) {
                if (isset($mapping[$key])) continue;

                foreach ($keywords as $keyword) {
                    if (str_contains($colText, strtoupper($keyword))) {
                        $mapping[$key] = $col;
                        break;
                    }
                }
            }
        }

        if (isset($mapping['plu'])) {
            $pluCol = $mapping['plu'];
            for ($r = 0; $r < 50; $r++) {
                $val = $sheetData[$r][$pluCol] ?? '';
                if (is_numeric($val) && !str_contains(strtoupper($val), 'UNIT')) {
                    $dataStartRow = $r;
                    break;
                }
            }
        }

        if ($dataStartRow === 0) $dataStartRow = 10;

        return ['map' => $mapping, 'start_row' => $dataStartRow];
    }

    private function extractDataUsingMap(array $sheetData, array $mapConfig)
    {
        $normalizedData = [];
        $totalRows = count($sheetData);
        $map = $mapConfig['map'];
        $startRow = $mapConfig['start_row'];

        for ($i = $startRow; $i < $totalRows; $i++) {
            $row = $sheetData[$i];
            $rowData = [];
            $isEmptyRow = true;

            if (empty($row[$map['nama_barang'] ?? -1])) {
                continue;
            }

            foreach ($map as $key => $colIndex) {
                $value = $row[$colIndex] ?? null;
                $rowData[$key] = $value;
                if (!empty($value)) $isEmptyRow = false;
            }

            if (!$isEmptyRow) {
                $normalizedData[] = $rowData;
            }
        }

        return $normalizedData;
    }
}
