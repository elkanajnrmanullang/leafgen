<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function index()
    {
        return Product::latest()->get()->map(function ($product) {
            $product->full_image_url = url('storage/' . $product->product_img_path);
            return $product;
        });
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'plu_code' => 'required|string|max:50|unique:products,plu_code',
                'image_file' => 'required|image|mimes:jpg,png,jpeg|max:2048',
            ], [
                'plu_code.unique' => 'Kode PLU sudah digunakan.'
            ]);

            $filename = time() . '_' . preg_replace('/\s+/', '_', $request->file('image_file')->getClientOriginalName());
            $path = $request->file('image_file')->storeAs('products', $filename, 'public');

            $product = Product::create([
                'product_name' => $validatedData['name'],
                'plu_code' => $validatedData['plu_code'],
                'product_img_path' => $path,
            ]);

            $user = Auth::user();
            $userName = $user ? $user->user_name : 'Sistem';

            ActivityLog::create([
                'user_id' => $user ? $user->user_id : null,
                'type_activity' => 'product',
                'description_activity' => "{$userName} mengupload produk baru ke Bank Gambar: {$validatedData['name']} ({$validatedData['plu_code']})"
            ]);

            $product->full_image_url = url('storage/' . $path);

            return response()->json($product, 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Error storing product: " . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan server'], 500);
        }
    }

    public function update(Request $request, Product $product)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'plu_code' => 'required|string|max:50|unique:products,plu_code,' . $product->product_id . ',product_id',
                'image_file' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
            ], [
                'plu_code.unique' => 'Kode PLU sudah digunakan.'
            ]);

            $product->product_name = $validatedData['name'];
            $product->plu_code = $validatedData['plu_code'];

            if ($request->hasFile('image_file')) {
                if ($product->product_img_path && Storage::disk('public')->exists($product->product_img_path)) {
                    Storage::disk('public')->delete($product->product_img_path);
                }

                $filename = time() . '_' . preg_replace('/\s+/', '_', $request->file('image_file')->getClientOriginalName());
                $path = $request->file('image_file')->storeAs('products', $filename, 'public');
                $product->product_img_path = $path;
            }

            $product->save();
            $product->full_image_url = url('storage/' . $product->product_img_path);

            $user = Auth::user();
            $userName = $user ? $user->user_name : 'Sistem';

            ActivityLog::create([
                'user_id' => $user ? $user->user_id : null,
                'type_activity' => 'product',
                'description_activity' => "{$userName} mengedit data produk: {$product->product_name}"
            ]);

            return response()->json($product);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function destroy(Product $product)
    {
        if ($product->product_img_path && Storage::disk('public')->exists($product->product_img_path)) {
            Storage::disk('public')->delete($product->product_img_path);
        }

        $name = $product->product_name;
        $product->delete();

        $user = Auth::user();
        $userName = $user ? $user->user_name : 'Sistem';

        ActivityLog::create([
            'user_id' => $user ? $user->user_id : null,
            'type_activity' => 'product',
            'description_activity' => "{$userName} menghapus produk: {$name}"
        ]);

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }
}