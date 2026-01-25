<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        if (filter_var($this->image_path, FILTER_VALIDATE_URL)) {
            return $this->image_path;
        }

        return url(Storage::url($this->image_path));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
