<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LeafletController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\UserController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/leaflet/upload', [LeafletController::class, 'uploadAndGetRegions']);
    Route::post('/leaflet/generate-layout', [LeafletController::class, 'generateLayout']);
    Route::get('/leaflet/smart-grid-status', [LeafletController::class, 'getSmartGridStatus']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::put('/users/{user}/activate', [UserController::class, 'activate']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::put('/users/{user}/reset-password', [UserController::class, 'adminResetPassword']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::post('/debug/reset-data', [UserController::class, 'resetDataForSimulation']);
});
