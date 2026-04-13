<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_id';

    protected $fillable = [
        'plu_code',
        'product_name',
        'product_img_path',
    ];

    public function leafletItems(): HasMany
    {
        return $this->hasMany(LeafletItem::class, 'product_id', 'product_id');
    }
}