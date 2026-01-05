<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leaflet extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'store_name',
        'promotion_start_date',
        'promotion_end_date',
        'content',
        'status',
        'user_id'
    ];

    protected $casts = [
        'content' => 'array',
        'promotion_start_date' => 'date',
        'promotion_end_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
