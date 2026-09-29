<?php
/**
 * Конфигурация python-web API.
 * Читает переменные окружения, стартует сессию, определяет хелперы.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

define('PYTHON_BASE_URL', getenv('SANDBOX_BASE_URL') ?: 'https://python.nayanovaacademy.ru');
define('PYTHON_DB_PATH', __DIR__ . '/../data/python.db');
define('AUTH_URL', 'https://auth.nayanovaacademy.ru');
define('CONTEST_URL', 'https://contest.nayanovaacademy.ru');
define('SESSION_LIFETIME', 86400 * 30);

// Ограничения курса (синхронизированы с lessons.json)
define('MAX_COURSE_LESSONS', 50);
define('MAX_BULK_ITEMS', 100);

define('ALLOWED_ORIGINS', [
    'https://python.nayanovaacademy.ru',
]);

// --- Сессия ---
if (session_status() === PHP_SESSION_NONE) {
    session_name('python_session');
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        // Host-only кука: сессия курса не должна быть видна другим
        // субдоменам (компрометация любого субдомена = угон сессии).
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_only_cookies', 1);
    // Отвергаем неизвестные session id (защита от session fixation).
    ini_set('session.use_strict_mode', '1');
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
    header('Vary: Origin');
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

/**
 * Файловый rate-limit для авторизованных API-эндпоинтов.
 * Отдельный бакет-файл на (scope, IP); flock защищает read-modify-write.
 *
 * @param string $scope  имя бакета (endpoint)
 * @param int    $limit  максимум запросов в окне
 * @param int    $window размер окна в секундах
 */
function apiCheckRateLimit(string $scope, int $limit = 60, int $window = 60): void {
    $dir = __DIR__ . '/.ratelimit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return; // каталог недоступен — не блокируем работу эндпоинта
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $file = $dir . '/' . md5($scope . '|' . $ip) . '.json';

    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return;
    }
    flock($handle, LOCK_EX);

    $now = time();
    $timestamps = [];
    $content = stream_get_contents($handle);
    if ($content !== false && $content !== '') {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $timestamps = array_values(array_filter($decoded, function ($ts) use ($now, $window) {
                return is_numeric($ts) && ($now - (int) $ts) < $window;
            }));
        }
    }

    if (count($timestamps) >= $limit) {
        $retryAfter = $window - ($now - (int) $timestamps[0]);
        flock($handle, LOCK_UN);
        fclose($handle);
        header('Retry-After: ' . max(0, $retryAfter));
        jsonResponse(['error' => 'Слишком много запросов. Подождите ' . max(1, $retryAfter) . ' сек.'], 429);
    }

    $timestamps[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($timestamps, JSON_UNESCAPED_UNICODE));
    flock($handle, LOCK_UN);
    fclose($handle);
}
