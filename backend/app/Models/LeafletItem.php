<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeafletItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'leaflet_item_id';

    protected $fillable = [
        'leaflet_id',
        'product_id',
        'product_name',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'position_x' => 'integer',
        'position_y' => 'integer',
    ];

    public function leaflet(): BelongsTo
    {
        return $this->belongsTo(Leaflet::class, 'leaflet_id', 'leaflet_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}