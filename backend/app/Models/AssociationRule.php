<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssociationRule extends Model
{
    use HasFactory;

    protected $primaryKey = 'association_rule_id';

    protected $fillable = [
        'antecedent',
        'consequent',
        'support',
        'confidence',
        'lift_ratio'
    ];
}