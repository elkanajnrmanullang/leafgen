<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeafletItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'leaflet_id',
        'product_id',
        'display_price',
        'strikethrough_price',
        'position_x',
        'position_y',
        'custom_styles',
    ];

    protected $casts = [
        'custom_styles' => 'array',
    ];

    public function leaflet(): BelongsTo
    {
        return $this->belongsTo(Leaflet::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
