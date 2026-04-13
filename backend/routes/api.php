<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LeafletController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BadgeController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\SmartGridController;

Route::post('/login', [AuthController::class, 'login']);

// Rute untuk Lupa Password
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

Route::get('/media/{path}', [MediaController::class, 'show'])->where('path', '.*');
Route::get('/asset-proxy/{path}', [AssetController::class, 'proxy'])->where('path', '.*');

Route::post('/leaflet/generate-draft', [LeafletController::class, 'generateDraft']);
Route::post('/leaflet/generate-layout', [LeafletController::class, 'generateLayout']);
Route::post('/leaflet/upload', [LeafletController::class, 'uploadAndGetRegions']);
Route::post('/leaflet/check-regions', [LeafletController::class, 'uploadAndGetRegions']);
Route::get('/leaflet/preview', [LeafletController::class, 'preview']);

Route::get('/leaflets', [LeafletController::class, 'index']);
Route::get('/leaflets/{id}', [LeafletController::class, 'show']);
Route::post('/leaflets/save', [LeafletController::class, 'store']);

Route::post('/generate-badge', [BadgeController::class, 'generate']);
Route::get('/smart-grid-rules', [SmartGridController::class, 'getRules']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard-stats', [LeafletController::class, 'getDashboardStats']);

    Route::get('/leaflet/templates', [LeafletController::class, 'getTemplates']);
    Route::post('/leaflet/templates', [LeafletController::class, 'storeTemplate']);
    Route::match(['put', 'post'], '/leaflet/templates/{id}', [LeafletController::class, 'updateTemplate']);
    Route::delete('/leaflet/templates/{id}', [LeafletController::class, 'destroyTemplate']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::put('/users/{user}/activate', [UserController::class, 'activate']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::put('/users/{user}/reset-password', [UserController::class, 'adminResetPassword']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::match(['put', 'patch'], '/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::post('/debug/reset-data', [UserController::class, 'resetDataForSimulation']);
});