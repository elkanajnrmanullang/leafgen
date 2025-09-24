<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        if (request()->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return User::latest()->get();
    }

    public function store(Request $request)
    {
        if (request()->user()->role !== 'manager') {
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

        return response()->json([
            'user' => $user,
            'password' => $password
        ], 201);
    }

    public function deactivate(User $user)
    {
        if (request()->user()->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->status = 'inactive';
        $user->save();

        return response()->json(['message' => 'Akun berhasil dinonaktifkan.']);
    }
}
