<?php
/**
 * Конфигурация python-web API.
 * Читает переменные окружения, стартует сессию, определяет хелперы.
 */

error_reporting(0);
ini_set('display_errors', '0');

define('PYTHON_BASE_URL', getenv('SANDBOX_BASE_URL') ?: 'https://python.nayanovaacademy.ru');
define('PYTHON_DB_PATH', __DIR__ . '/../data/python.db');
define('AUTH_URL', 'https://auth.nayanovaacademy.ru');
define('CONTEST_URL', 'https://contest.nayanovaacademy.ru');
define('SESSION_LIFETIME', 86400 * 30);

define('ALLOWED_ORIGINS', [
    'https://python.nayanovaacademy.ru',
]);

// --- Сессия ---
if (session_status() === PHP_SESSION_NONE) {
    session_name('python_session');
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'domain' => '.nayanovaacademy.ru',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_only_cookies', 1);
    session_start();
}

// --- Хелперы ---
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrfToken()) . '">';
}

function validateCsrf(): bool {
    $token = $_POST['csrf_token'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    $valid = hash_equals($_SESSION['csrf_token'], $token);
    if ($valid) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $valid;
}

function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
