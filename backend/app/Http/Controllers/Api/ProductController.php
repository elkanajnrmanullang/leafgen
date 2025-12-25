<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index()
    {
        return Product::latest()->get();
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'plu_code' => 'required|string|max:50|unique:products',
                'image_file' => 'required|image|mimes:jpg,png|max:2048',
            ]);

            $path = $request->file('image_file')->store('products', 'public');

            $product = Product::create([
                'name' => $validatedData['name'],
                'plu_code' => $validatedData['plu_code'],
                'image_path' => $path,
            ]);

            return response()->json($product, 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function update(Request $request, Product $product)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'plu_code' => 'required|string|max:50|unique:products,plu_code,' . $product->id,
                'image_file' => 'nullable|image|mimes:jpg,png|max:2048',
            ]);

            $dataToUpdate = [
                'name' => $validatedData['name'],
                'plu_code' => $validatedData['plu_code'],
            ];

            if ($request->hasFile('image_file')) {
                if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                    Storage::disk('public')->delete($product->image_path);
                }

                $path = $request->file('image_file')->store('products', 'public');
                $dataToUpdate['image_path'] = $path;
            }

            $product->update($dataToUpdate);

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
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }
}
