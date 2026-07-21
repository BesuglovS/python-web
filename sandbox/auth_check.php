<?php
/**
 * Эндпоинт для проверки авторизации через auth-web
 * Вызывается из JavaScript python-web
 */
header('Content-Type: application/json; charset=utf-8');

$allowedOrigin = 'https://python.nayanovaacademy.ru';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$refererHost = parse_url($referer, PHP_URL_HOST) ?? '';

if ($origin !== '' && $origin !== $allowedOrigin) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
if ($origin === '' && $refererHost !== parse_url($allowedOrigin, PHP_URL_HOST)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
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
