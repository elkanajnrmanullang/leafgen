<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Manager',
            'email' => 'manager@perusahaanx.com',
            'username' => 'manager',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'Staff Desain',
            'email' => 'staff@perusahaanx.com',
            'username' => 'staff',
            'password' => Hash::make('staff123'),
            'role' => 'staff',
            'status' => 'active',
        ]);
    }
}
