<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Imports\LeafletDataImport;
use App\Services\LeafletParserService;
use App\Services\LeafletComposerService;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Leaflet;
use App\Models\BackgroundTemplate;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class LeafletController extends Controller
{
    protected $parserService;
    protected $composerService;

    public function __construct(LeafletParserService $parserService, LeafletComposerService $composerService)
    {
        $this->parserService = $parserService;
        $this->composerService = $composerService;
    }

    public function getDashboardStats()
    {
        try {
            $totalLeaflets = Leaflet::whereIn('status', [
                'Selesai', 'selesai', 'SELESAI',
                'exported', 'Exported',
                'Done', 'done'
            ])->count();

            $recentActivities = ActivityLog::with('user')
                ->latest()
                ->take(20)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'text' => $log->description,
                        'date' => $log->created_at->diffForHumans(),
                        'type' => $log->type,
                        'user' => $log->user ? $log->user->name : 'Sistem'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_leaflets' => $totalLeaflets,
                    'recent_activities' => $recentActivities
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getTemplates()
    {
        try {
            $templates = BackgroundTemplate::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function storeTemplate(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'image' => 'required|image|mimes:jpeg,png,jpg|max:20480',
        ]);

        try {
            $file = $request->file('image');
            $filename = 'template_' . time() . '.png';
            $path = 'templates/' . $filename;

            if (!Storage::disk('public')->exists('templates')) {
                Storage::disk('public')->makeDirectory('templates');
            }

            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);
            $image->cover(2480, 3508);
            $image->save(storage_path('app/public/' . $path));

            $type = $request->input('type', 'master');
            $user = Auth::user() ?? User::first();
            $userId = $user ? $user->id : 1;

            $template = BackgroundTemplate::create([
                'title' => $request->title,
                'type' => $type,
                'image_path' => $path,
                'user_id' => $userId,
                'is_default' => false
            ]);

            ActivityLog::create([
                'user_id' => $userId,
                'type' => 'template',
                'description' => "{$user->name} mengupload template desain baru: {$request->title}"
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template berhasil diupload'
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = BackgroundTemplate::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:20480',
        ]);

        try {
            $data = ['title' => $request->title];

            if ($request->hasFile('image')) {
                if (Storage::disk('public')->exists($template->image_path)) {
                    Storage::disk('public')->delete($template->image_path);
                }

                $file = $request->file('image');
                $filename = 'template_' . time() . '.png';
                $path = 'templates/' . $filename;

                $manager = new ImageManager(new Driver());
                $image = $manager->read($file);
                $image->cover(2480, 3508);
                $image->save(storage_path('app/public/' . $path));

                $data['image_path'] = $path;
            }

            $template->update($data);

            $user = Auth::user();
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'template',
                'description' => "{$user->name} memperbarui template: {$request->title}"
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroyTemplate($id)
    {
        try {
            $template = BackgroundTemplate::findOrFail($id);

            if (Storage::disk('public')->exists($template->image_path)) {
                Storage::disk('public')->delete($template->image_path);
            }

            $template->delete();

            return response()->json(['success' => true, 'message' => 'Template dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus template'], 500);
        }
    }

    public function checkRegions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => ['ALL', 'JAWA', 'SUM', 'KAL', 'SUL', 'MALUKU']
        ]);
    }

    public function generateDraft(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
            'store_name' => 'nullable|string',
            'leaflet_name' => 'nullable|string',
        ]);

        try {
            $data = Excel::toArray(new LeafletDataImport, $request->file('file'));
            $rawData = $data[0] ?? [];

            if (empty($rawData)) {
                return response()->json(['message' => 'File Excel kosong atau tidak terbaca'], 400);
            }

            $periodText = isset($rawData[2][0]) ? trim((string)$rawData[2][0]) : '2';
            $baseLeafletName = $request->input('leaflet_name', 'Draft Otomatis');

            $mappedData = [];
            $currentCategory = 'GENERAL';
            $currentNumber = null;

            foreach ($rawData as $row) {
                $colNo = trim((string)($row[0] ?? ''));
                $upperNo = strtoupper($colNo);

                if ($upperNo === 'FOOD' || str_contains($upperNo, 'NFOOD') || str_contains($upperNo, 'NON FOOD')) {
                    $currentCategory = $upperNo;
                    $currentNumber = null;
                    continue;
                }

                if ($colNo !== '' && is_numeric($colNo)) {
                    $currentNumber = $colNo;
                }

                $colPlu = trim((string)($row[2] ?? ''));
                $colName = trim((string)($row[3] ?? ''));

                if ($colPlu === '' && $colName === '') {
                    continue;
                }

                if ($currentNumber) {
                    $rowGroupId = $currentCategory . '_' . $currentNumber;
                } else {
                    $rowGroupId = uniqid('orphan_');
                }

                $cleanPrice = function($val) {
                    if (is_string($val) && str_starts_with($val, '=')) {
                        return 0;
                    }
                    return (float) filter_var($val, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                };

                $mappedData[] = [
                    'group_id' => $rowGroupId,
                    'plu' => $row[2] ?? null,
                    'nama_barang' => $row[3] ?? null,
                    'setting_md' => $cleanPrice($row[16] ?? 0),
                    'supp' => $cleanPrice($row[17] ?? 0),
                    'mkt' => $cleanPrice($row[18] ?? 0),
                    'satuan' => $row[19] ?? null,
                    'nett' => $cleanPrice($row[20] ?? 0),
                    'poin' => $cleanPrice($row[21] ?? 0),
                    'syarat_bbmu' => $row[22] ?? null,
                    'store' => $row[23] ?? null,
                    'keterangan' => $row[24] ?? null,
                ];
            }

            $storeNameInput = strtoupper($request->input('store_name', 'ALL'));

            $targetRegions = [];
            if ($storeNameInput === 'ALL') {
                $targetRegions = ['JAWA', 'SUM', 'KAL', 'SUL', 'MALUKU'];
            } else {
                $targetRegions = [$storeNameInput];
            }

            $finalResults = [];

            foreach ($targetRegions as $regionCode) {
                $pages = $this->parserService->parse($mappedData, $regionCode);

                if (!empty($pages)) {
                    $finalResults[$regionCode] = [
                        'leaflet_name' => $baseLeafletName . " " . $regionCode,
                        'store' => $regionCode,
                        'period_text' => $periodText,
                        'pages' => $pages
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $finalResults
            ]);

        } catch (\Exception $e) {
            Log::error('Generate Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function generateLayout(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Layout handled by frontend'
        ]);
    }

    public function uploadAndGetRegions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => ['ALL', 'JAWA', 'SUM', 'KAL', 'SUL', 'MALUKU']
        ]);
    }

    public function index()
    {
        try {
            $leaflets = Leaflet::orderBy('updated_at', 'desc')->get();

            $formatted = $leaflets->map(function ($item) {
                $content = $item->content;
                if (is_string($content)) {
                    $pages = json_decode($content, true);
                } else {
                    $pages = $content;
                }
                $pages = $pages ?? [];

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

            $content = $leaflet->content;
            if (is_string($content)) {
                $decodedContent = json_decode($content, true);
            } else {
                $decodedContent = $content;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'leaflet_name' => $leaflet->name,
                    'store' => $leaflet->store_name,
                    'pages' => $decodedContent,
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
            $user = Auth::user();
            if (!$user) {
                $user = User::first();
            }
            $userId = $user->id;

            $leaflet = null;
            if ($request->has('id') && $request->id) {
                $leaflet = Leaflet::find($request->id);
            }

            $contentData = $request->pages;
            $actionDescription = "";

            if ($leaflet) {
                $leaflet->update([
                    'name' => $request->title,
                    'store_name' => $request->store,
                    'content' => $contentData,
                    'status' => $request->status
                ]);
                $actionDescription = "{$user->name} memperbarui/mengedit leaflet: {$request->title}";
            } else {
                $leaflet = Leaflet::create([
                    'name' => $request->title,
                    'store_name' => $request->store,
                    'content' => $contentData,
                    'status' => $request->status,
                    'user_id' => $userId
                ]);
                $actionDescription = "{$user->name} membuat leaflet baru: {$request->title}";
            }

            if ($request->status === 'Selesai') {
                $actionDescription = "{$user->name} menyelesaikan leaflet: {$request->title}";
            }

            ActivityLog::create([
                'user_id' => $userId,
                'type' => 'leaflet',
                'description' => $actionDescription
            ]);

            return response()->json(['success' => true, 'data' => $leaflet]);

        } catch (\Exception $e) {
            Log::error('Leaflet Save Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan: ' . $e->getMessage()], 500);
        }
    }
}
