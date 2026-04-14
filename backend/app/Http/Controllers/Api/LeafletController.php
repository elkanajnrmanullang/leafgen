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
            $totalLeaflets = Leaflet::whereIn('leaflet_status', [
                'completed', 'Selesai', 'selesai', 'SELESAI',
                'exported', 'Exported',
                'Done', 'done'
            ])->count();

            $recentActivities = ActivityLog::with('user')
                ->whereNotIn('type_activity', ['security', 'account', 'user']) 
                ->latest()
                ->take(20)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->activity_id,
                        'text' => $log->description_activity,
                        'date' => $log->created_at->diffForHumans(),
                        'type' => $log->type_activity,
                        'user' => $log->user ? $log->user->user_name : 'Sistem'
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
            Log::error('Dashboard Stats Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getTemplates()
    {
        try {
            $templates = BackgroundTemplate::orderBy('created_at', 'desc')->get();

            $formattedTemplates = $templates->map(function ($template) {
                return [
                    'id' => $template->bg_template_id,
                    'bg_template_id' => $template->bg_template_id,
                    'title' => $template->bg_title,
                    'bg_title' => $template->bg_title,
                    'image_path' => $template->bg_img_path,
                    'image_url' => $template->image_url,
                    'type' => 'master'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedTemplates
            ]);
        } catch (\Exception $e) {
            Log::error('Get Templates Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal memuat template: ' . $e->getMessage()], 500);
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
            $filename = 'template_' . time() . '.' . $file->getClientOriginalExtension();
            
            $path = $file->storeAs('templates', $filename, 'public');

            $user = Auth::user() ?? User::orderBy('user_id')->first();
            
            if (!$user) {
                throw new \Exception("Tidak ada data pengguna di dalam sistem untuk relasi.");
            }

            $userId = $user->user_id;
            $userName = $user->user_name;

            $template = BackgroundTemplate::create([
                'bg_title' => $request->title,
                'bg_img_path' => $path,
                'user_id' => $userId
            ]);

            ActivityLog::create([
                'user_id' => $userId,
                'type_activity' => 'template',
                'description_activity' => "{$userName} mengupload template desain baru: {$request->title}"
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $template->bg_template_id,
                    'bg_template_id' => $template->bg_template_id,
                    'title' => $template->bg_title,
                    'bg_title' => $template->bg_title,
                    'image_url' => $template->image_url,
                ],
                'message' => 'Template berhasil diupload'
            ]);

        } catch (\Exception $e) {
            Log::error('Store Template Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan template: ' . $e->getMessage()], 500);
        }
    }

    public function updateTemplate(Request $request, $id)
    {
        try {
            $template = BackgroundTemplate::findOrFail($id);

            $request->validate([
                'title' => 'required|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:20480',
            ]);

            $data = ['bg_title' => $request->title];

            if ($request->hasFile('image')) {
                if ($template->bg_img_path && Storage::disk('public')->exists($template->bg_img_path)) {
                    Storage::disk('public')->delete($template->bg_img_path);
                }

                $file = $request->file('image');
                $filename = 'template_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('templates', $filename, 'public');

                $data['bg_img_path'] = $path;
            }

            $template->update($data);

            $user = Auth::user() ?? User::orderBy('user_id')->first();
            $userId = $user ? $user->user_id : null;
            $userName = $user ? $user->user_name : 'Sistem';

            ActivityLog::create([
                'user_id' => $userId,
                'type_activity' => 'template',
                'description_activity' => "{$userName} memperbarui template: {$request->title}"
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $template->bg_template_id,
                    'bg_template_id' => $template->bg_template_id,
                    'title' => $template->bg_title,
                    'bg_title' => $template->bg_title,
                    'image_url' => $template->image_url,
                ],
                'message' => 'Template berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            Log::error('Update Template Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengupdate template: ' . $e->getMessage()], 500);
        }
    }

    public function destroyTemplate($id)
    {
        try {
            $template = BackgroundTemplate::findOrFail($id);

            if ($template->bg_img_path && Storage::disk('public')->exists($template->bg_img_path)) {
                Storage::disk('public')->delete($template->bg_img_path);
            }

            $title = $template->bg_title;
            $template->delete();

            $user = Auth::user() ?? User::orderBy('user_id')->first();
            $userId = $user ? $user->user_id : null;
            $userName = $user ? $user->user_name : 'Sistem';

            ActivityLog::create([
                'user_id' => $userId,
                'type_activity' => 'template',
                'description_activity' => "{$userName} menghapus template: {$title}"
            ]);

            return response()->json(['success' => true, 'message' => 'Template dihapus']);
        } catch (\Exception $e) {
            Log::error('Delete Template Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menghapus template: ' . $e->getMessage()], 500);
        }
    }

    public function checkRegions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => ['ALL', 'JAWA', 'SUM', 'KAL', 'SUL', 'MALUKU']
        ]);
    }

    // FUNGSI INI DITAMBAHKAN KEMBALI
    public function uploadAndGetRegions(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

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
                'message' => 'Terjadi kesalahan generate: ' . $e->getMessage()
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

                $pageCount = 0;

                if (is_array($pages)) {
                    if (isset($pages['pages']) && is_array($pages['pages'])) {
                         $pageCount += count($pages['pages']);
                    } else if (isset($pages[0]) && (isset($pages[0]['id']) || isset($pages[0]['items']))) {
                        $pageCount = count($pages);
                    } else {
                        foreach ($pages as $regionKey => $regionData) {
                            if ($regionKey === 'template_url') continue;

                            if (is_array($regionData)) {
                                if (isset($regionData[0]['id'])) {
                                    $pageCount += count($regionData);
                                }
                                elseif (isset($regionData['pages']) && is_array($regionData['pages'])) {
                                    $pageCount += count($regionData['pages']);
                                }
                            }
                        }
                    }
                }

                return [
                    'id' => $item->leaflet_id,
                    'title' => $item->leaflet_name,
                    'store' => $item->region ?? 'Unknown',
                    'date' => $item->updated_at->format('d M Y H:i'),
                    'status' => $item->leaflet_status ?? 'draft',
                    'pageCount' => $pageCount,
                    'thumbnailUrl' => null
                ];
            });

            return response()->json(['success' => true, 'data' => $formatted]);
        } catch (\Exception $e) {
            Log::error('Index Leaflet Error: ' . $e->getMessage());
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
                    'leaflet_name' => $leaflet->leaflet_name,
                    'store' => $leaflet->region,
                    'pages' => $decodedContent,
                    'id' => $leaflet->leaflet_id,
                    'status' => $leaflet->leaflet_status
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
            'pages' => 'sometimes|array',
            'regions_data' => 'sometimes|array',
            'status' => 'required|string',
            'template_url' => 'nullable|string'
        ]);

        try {
            $user = Auth::user() ?? User::orderBy('user_id')->first();
            $userId = $user->user_id;

            $leaflet = null;
            if ($request->has('id') && $request->id) {
                $leaflet = Leaflet::find($request->id);
            }

            $contentData = [];
            if ($request->has('regions_data')) {
                $contentData = $request->input('regions_data');
            } elseif ($request->has('pages')) {
                $contentData = $request->input('pages');
            }

            if ($request->has('template_url')) {
                if (!is_array($contentData)) {
                    $contentData = [];
                }

                if (array_keys($contentData) === range(0, count($contentData) - 1) && !empty($contentData)) {
                    $contentData = ['pages' => $contentData];
                }

                $contentData['template_url'] = $request->input('template_url');
            }

            $actionDescription = "";

            if ($leaflet) {
                $leaflet->update([
                    'leaflet_name' => $request->title,
                    'region' => $request->store,
                    'content' => $contentData,
                    'leaflet_status' => $request->status
                ]);
                $actionDescription = "{$user->user_name} memperbarui/mengedit leaflet: {$request->title}";
            } else {
                $leaflet = Leaflet::create([
                    'leaflet_name' => $request->title,
                    'region' => $request->store,
                    'content' => $contentData,
                    'leaflet_status' => $request->status,
                    'user_id' => $userId
                ]);
                $actionDescription = "{$user->user_name} membuat leaflet baru: {$request->title}";
            }

            if ($request->status === 'exported' || $request->status === 'completed') {
                $actionDescription = "{$user->user_name} mendownload/menyelesaikan leaflet: {$request->title}";
            }

            ActivityLog::create([
                'user_id' => $userId,
                'type_activity' => 'leaflet',
                'description_activity' => $actionDescription
            ]);

            return response()->json(['success' => true, 'data' => $leaflet]);

        } catch (\Exception $e) {
            Log::error('Leaflet Save Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan leaflet: ' . $e->getMessage()], 500);
        }
    }
}