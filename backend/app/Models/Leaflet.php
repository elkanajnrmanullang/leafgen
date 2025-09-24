<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Leaflet extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'region',
        'promotion_start_date',
        'promotion_end_date',
        'final_image_path',
        'user_id',
    ];

    protected $casts = [
        'promotion_start_date' => 'date',
        'promotion_end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(LeafletItem::class);
    }
}
