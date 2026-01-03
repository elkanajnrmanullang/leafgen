<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Imports\LeafletDataImport;
use App\Services\LeafletParserService;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Leaflet;
use App\Models\BackgroundTemplate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class LeafletController extends Controller
{
    protected $parserService;

    public function __construct(LeafletParserService $parserService)
    {
        $this->parserService = $parserService;
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

            $template = BackgroundTemplate::create([
                'title' => $request->title,
                'type' => $type,
                'image_path' => $path,
                'user_id' => Auth::id(),
                'is_default' => false
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template berhasil diupload dan disesuaikan (A4)'
            ]);

        } catch (\Exception $e) {
            Log::error('Template Upload Error: ' . $e->getMessage());
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
            $data = [
                'title' => $request->title
            ];

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

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            Log::error('Template Update Error: ' . $e->getMessage());
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

    public function preview()
    {
        return response()->json([
            'status' => 'success',
            'data' => []
        ]);
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
            $userId = Auth::id() ?? 1;

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
                    'user_id' => $userId
                ]);
            }

            return response()->json(['success' => true, 'data' => $leaflet]);

        } catch (\Exception $e) {
            Log::error('Leaflet Save Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan: ' . $e->getMessage()], 500);
        }
    }

    public function generateDraft(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
            'store_name' => 'nullable|string',
        ]);

        try {
            $data = Excel::toArray(new LeafletDataImport, $request->file('file'));
            $rawData = $data[0] ?? [];

            if (empty($rawData)) {
                return response()->json(['message' => 'File Excel kosong atau tidak terbaca'], 400);
            }

            $regionCode = $request->input('store_name');

            $result = $this->parserService->parse($rawData, $regionCode ?? '');

            return response()->json([
                'success' => true,
                'data' => [
                    'leaflet_name' => 'Draft Otomatis ' . ($regionCode ?? 'Nasional'),
                    'store' => $regionCode ?? 'NASIONAL',
                    'pages' => $result
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Generate Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadAndGetRegions(Request $request)
    {
        try {
            $configuredRegions = array_keys(Config::get('leaflet_regions', []));
            return response()->json([
                'success' => true,
                'data' => $configuredRegions
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
