<?php
/**
 * Router for PHP built-in development server.
 * Встроенный сервер на Windows не обслуживает поддиректории,
 * поэтому этот файл явно обрабатывает запросы к /sandbox/run.php
 */

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$projectDir = realpath(__DIR__);

/**
 * Безопасное разрешение пути с защитой от path traversal.
 * Возвращает реальный путь внутри $projectDir или null если путь невалиден.
 */
function safeResolve(string $projectDir, string $path): ?string {
    $fullPath = realpath($projectDir . $path);
    if ($fullPath === false) {
        return null;
    }
    // Путь должен начинаться с корня проекта (защита от ../)
    if (strpos($fullPath, $projectDir . DIRECTORY_SEPARATOR) !== 0 && $fullPath !== $projectDir) {
        return null;
    }
    return $fullPath;
}

// Если запрос к sandbox — выполняем его напрямую
// Поддерживаем run.php, repl.php и любые будущие .php в sandbox
if (strpos($path, '/sandbox/') === 0) {
    $file = safeResolve($projectDir, $path);
    if ($file !== null && is_file($file) && substr($file, -4) === '.php') {
        require $file;
        return true;
    }
    // Если PHP-файл не найден в sandbox — 404
    if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
        http_response_code(404);
        echo "<h1>404 Not Found</h1><p>Sandbox script not found: " . htmlspecialchars($path) . "</p>";
        return true;
    }
}

// Для остальных файлов — проверяем, существует ли файл
$filePath = safeResolve($projectDir, $path);
if ($filePath !== null && is_file($filePath)) {
    return false; // отдаём статику через built-in сервер
}

// 404
http_response_code(404);
echo "<h1>404 Not Found</h1><p>Resource not found: " . htmlspecialchars($path) . "</p>";
return true;
