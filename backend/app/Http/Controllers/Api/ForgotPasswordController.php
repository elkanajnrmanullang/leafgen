<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Log;

class ForgotPasswordController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Cari user berdasarkan user_email (kolom baru kita)
        $user = User::where('user_email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email tidak terdaftar.'
            ], 404);
        }

        // Hapus token lama jika ada
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate token baru
        $token = Str::random(60);

        // Simpan token ke database
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => bcrypt($token),
            'created_at' => Carbon::now()
        ]);

        try {
            // Coba kirim email
            $resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . "/reset-password?token=" . $token . "&email=" . urlencode($request->email);
            Mail::to($request->email)->send(new ResetPasswordMail($user->user_name, $resetUrl));

            ActivityLog::create([
                'user_id' => $user->user_id,
                'type_activity' => 'security',
                'description_activity' => "Sistem mengirimkan tautan reset password ke email: {$request->email}"
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Link reset password telah dikirim ke email Anda.'
            ], 200);

        } catch (\Exception $e) {
            Log::error("Gagal mengirim email reset password: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim email. Pastikan konfigurasi SMTP (.env) sudah benar.'
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Data reset tidak valid atau email salah.'], 404);
        }

        // Cek kedaluwarsa (60 menit)
        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Token kedaluwarsa. Silakan request ulang.'], 400);
        }

        // Verifikasi token
        if (!password_verify($request->token, $resetRecord->token)) {
            return response()->json(['message' => 'Token tidak valid.'], 400);
        }

        $user = User::where('user_email', $request->email)->first();

        if (!$user) {
             return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        // Update password baru
        $user->password = bcrypt($request->password);
        $user->save();

        // Hapus token agar tidak bisa digunakan dua kali
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        ActivityLog::create([
            'user_id' => $user->user_id,
            'type_activity' => 'security',
            'description_activity' => "{$user->user_name} berhasil mereset password secara mandiri via email."
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan login.'
        ], 200);
    }
}