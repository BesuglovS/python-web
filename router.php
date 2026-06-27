<?php
/**
 * Router for PHP built-in development server.
 * Встроенный сервер на Windows не обслуживает поддиректории,
 * поэтому этот файл явно обрабатывает запросы к /sandbox/run.php
 */

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Если запрос к sandbox — выполняем его напрямую
if (strpos($path, '/sandbox/') === 0) {
    $file = __DIR__ . $path;
    if (file_exists($file) && is_file($file) && substr($file, -4) === '.php') {
        require $file;
        return true;
    }
}

// Для остальных файлов — проверяем, существует ли файл
$filePath = __DIR__ . $path;
if (file_exists($filePath) && is_file($filePath)) {
    return false; // отдаём статику через built-in сервер
}

// 404
http_response_code(404);
echo "<h1>404 Not Found</h1><p>Resource not found: " . htmlspecialchars($path) . "</p>";
return true;