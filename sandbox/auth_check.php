<?php
/**
 * Эндпоинт для проверки авторизации через auth-web
 * Вызывается из JavaScript python-web
 */
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

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
    // Сбой auth-web — это НЕ «не авторизован»: помечаем ответ для клиента.
    echo json_encode(['authenticated' => false, 'unavailable' => true]);
    exit;
}

$data = json_decode($response, true);
if (!is_array($data) || empty($data['authenticated']) || empty($data['user']) || !is_array($data['user'])) {
    echo json_encode(['authenticated' => false]);
    exit;
}

// Прокидываем клиенту только безопасное подмножество полей: ответ auth-web
// может со временем обрасти служебными данными (email, роли, внутренние id).
$user = $data['user'];
$safeUser = [
    'id'           => isset($user['id']) ? (string) $user['id'] : '',
    'login'        => isset($user['login']) ? (string) $user['login'] : '',
    'display_name' => isset($user['display_name']) ? (string) $user['display_name'] : '',
    'is_admin'     => !empty($user['is_admin']),
];
echo json_encode(['authenticated' => true, 'user' => $safeUser]);
