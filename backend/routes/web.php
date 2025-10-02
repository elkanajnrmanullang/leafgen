<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\UserController;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/api/reset-password', [ForgotPasswordController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/api/logout', [AuthController::class, 'logout']);

    Route::get('/api/users', [UserController::class, 'index']);
    Route::post('/api/users', [UserController::class, 'store']);
    Route::put('/api/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::put('/api/users/{user}/activate', [UserController::class, 'activate']);

    Route::get('/api/products', [ProductController::class, 'index']);
    Route::post('/api/products', [ProductController::class, 'store']);
    Route::delete('/api/products/{product}', [ProductController::class, 'destroy']);

    Route::post('/api/debug/reset-data', [UserController::class, 'resetDataForSimulation']);

    Route::put('/api/user/password', [UserController::class, 'updatePassword']);
});