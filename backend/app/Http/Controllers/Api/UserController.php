<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewUserWelcomeMail;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return User::latest()->get();
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'role' => 'required|in:manager,staff',
        ]);

        $password = Str::random(10);
        $validatedData['password'] = Hash::make($password);

        $user = User::create($validatedData);

        Mail::to($user->email)->send(new NewUserWelcomeMail($user, $password));

        return response()->json([
            'user' => $user
        ], 201);
    }

    public function deactivate(Request $request, User $user)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->status = 'inactive';
        $user->save();

        return response()->json(['message' => 'Akun berhasil dinonaktifkan.']);
    }

    public function activate(Request $request, User $user)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->status = 'active';
        $user->save();

        return response()->json(['message' => 'Akun berhasil diaktifkan kembali.']);
    }

    public function resetDataForSimulation(Request $request)
    {
        if ($request->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \App\Models\LeafletItem::truncate();
        \App\Models\Leaflet::truncate();
        \App\Models\Product::truncate();
        \App\Models\BackgroundTemplate::truncate();
        User::whereNotIn('username', ['manager', 'staff'])->delete();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        return response()->json(['message' => 'Data simulasi (produk, leaflet, template) berhasil dikosongkan.']);
    }

    public function updatePassword(Request $request)
{
    $validated = $request->validate([
        'password' => 'required|string|min:8|confirmed',
    ]);

    $user = $request->user();
    $user->password = Hash::make($validated['password']);
    $user->password_changed_at = now();
    $user->save();

    return response()->json(['message' => 'Password berhasil diperbarui.']);
}
}