<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        //  Akun Manager
        User::create([
            'user_name' => 'Manager LeafGenn',
            'user_email' => 'manager@leafgenn.com',
            'username' => 'manager',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Akun Staff
        User::create([
            'user_name' => 'Staff Desain LeafGenn',
            'user_email' => 'staff@leafgenn.com',
            'username' => 'staff',
            'password' => Hash::make('staff123'),
            'role' => 'staff',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }
}