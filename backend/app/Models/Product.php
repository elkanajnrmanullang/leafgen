<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\LeafletItem;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'plu_code',
        'name',
        'description',
        'image_path',
    ];

    public function leafletItems(): HasMany
    {
        return $this->hasMany(LeafletItem::class);
    }
}
