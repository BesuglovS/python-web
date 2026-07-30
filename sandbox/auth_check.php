<?php
/**
 * Эндпоинт для проверки авторизации через auth-web
 * Вызывается из JavaScript python-web
 */
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

$allowedOrigin = 'https://python.nayanovaacademy.ru';
$allowedHost = parse_url($allowedOrigin, PHP_URL_HOST);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$refererHost = parse_url($referer, PHP_URL_HOST) ?? '';

function authDenied(): void {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Проверка Origin — строгое совпадение с доверенным
if ($origin !== '') {
    if ($origin !== $allowedOrigin) {
        authDenied();
    }
} else {
    // Без Origin (same-origin fetch) проверяем Referer
    if ($refererHost !== $allowedHost) {
        authDenied();
    }
}

header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Credentials: true');

$authUrl = 'https://auth.nayanovaacademy.ru/api/check.php';

$cookieHeader = '';
if (!empty($_COOKIE['auth_session'])) {
    $cookieHeader = 'auth_session=' . $_COOKIE['auth_session'];
}

$ch = curl_init($authUrl);
$opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_FOLLOWLOCATION => false,
];
if ($cookieHeader !== '') {
    $opts[CURLOPT_COOKIE] = $cookieHeader;
}
curl_setopt_array($ch, $opts);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    echo json_encode(['authenticated' => false]);
    exit;
}

$data = json_decode($response, true);
echo json_encode($data ?: ['authenticated' => false]);
