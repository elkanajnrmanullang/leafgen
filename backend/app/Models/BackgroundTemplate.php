<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BackgroundTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'image_path',
        'is_default',
        'user_id'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
