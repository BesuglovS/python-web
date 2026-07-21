<?php
/**
 * Синхронизация пользователей из auth-web.
 * POST — синхронизировать (admin only)
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCorsHeaders();
    http_response_code(200);
    exit;
}

setCorsHeaders();
Database::initialize();
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Только POST'], 405);
}

$result = Database::syncUsers();

if ($result['success']) {
    jsonResponse($result);
} else {
    jsonResponse($result, 500);
}
