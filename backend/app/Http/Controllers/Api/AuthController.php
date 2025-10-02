<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password yang diberikan salah.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'username' => ['Akun ini tidak aktif.'],
            ]);
        }

        $user->increment('login_count');

        $actionRequired = null;
        $isDefaultAccount = in_array($user->username, ['manager', 'staff']);

        if (is_null($user->password_changed_at) && !$isDefaultAccount) {
            $actionRequired = 'NEW_USER';
        } elseif ($user->password_changed_at && $user->password_changed_at->diffInDays(Carbon::now()) > 30) {
            $actionRequired = 'EXPIRED_PASSWORD';
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'action_required' => $actionRequired,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}
