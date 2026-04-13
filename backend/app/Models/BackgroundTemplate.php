<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BackgroundTemplate extends Model
{
    use HasFactory;

    // Menyesuaikan dengan nama tabel baru
    protected $table = 'bg_templates';
    
    // Menyesuaikan dengan primary key baru
    protected $primaryKey = 'bg_template_id';

    protected $fillable = [
        'bg_title',
        'bg_img_path',
        'user_id'
    ];

    // Otomatis menambahkan 'image_url' setiap kali data dipanggil via API
    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (empty($this->bg_img_path)) {
            return null;
        }

        if (filter_var($this->bg_img_path, FILTER_VALIDATE_URL)) {
            return $this->bg_img_path;
        }

        // Langsung arahkan ke URL public storage Laravel secara aman
        return url('storage/' . $this->bg_img_path);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}