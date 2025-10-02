<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Manager Account',
            'username' => 'manager',
            'email' => 'manager@leafgen.app',
            'password' => bcrypt('manager123'),
            'role' => 'manager',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'Staff Account',
            'username' => 'staff',
            'email' => 'staff@leafgen.app',
            'password' => bcrypt('staff123'),
            'role' => 'staff',
            'status' => 'active',
        ]);
    }
}
