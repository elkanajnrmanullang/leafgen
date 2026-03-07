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
            $product->full_image_url = url('storage/' . $product->image_path);
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
                'name' => $validatedData['name'],
                'plu_code' => $validatedData['plu_code'],
                'image_path' => $path,
            ]);

            $user = Auth::user();
            $userName = $user ? $user->name : 'Sistem';

            ActivityLog::create([
                'user_id' => $user ? $user->id : null,
                'type' => 'product',
                'description' => "{$userName} mengupload produk baru ke Bank Gambar: {$validatedData['name']} ({$validatedData['plu_code']})"
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
                'plu_code' => 'required|string|max:50|unique:products,plu_code,' . $product->id,
                'image_file' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
            ], [
                'plu_code.unique' => 'Kode PLU sudah digunakan.'
            ]);

            $product->name = $validatedData['name'];
            $product->plu_code = $validatedData['plu_code'];

            if ($request->hasFile('image_file')) {
                if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                    Storage::disk('public')->delete($product->image_path);
                }

                $filename = time() . '_' . preg_replace('/\s+/', '_', $request->file('image_file')->getClientOriginalName());
                $path = $request->file('image_file')->storeAs('products', $filename, 'public');
                $product->image_path = $path;
            }

            $product->save();
            $product->full_image_url = url('storage/' . $product->image_path);

            $user = Auth::user();
            $userName = $user ? $user->name : 'Sistem';

            ActivityLog::create([
                'user_id' => $user ? $user->id : null,
                'type' => 'product',
                'description' => "{$userName} mengedit data produk: {$product->name}"
            ]);

            return response()->json($product);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function destroy(Product $product)
    {
        if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
            Storage::disk('public')->delete($product->image_path);
        }

        $name = $product->name;
        $product->delete();

        $user = Auth::user();
        $userName = $user ? $user->name : 'Sistem';

        ActivityLog::create([
            'user_id' => $user ? $user->id : null,
            'type' => 'product',
            'description' => "{$userName} menghapus produk: {$name}"
        ]);

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }
}
