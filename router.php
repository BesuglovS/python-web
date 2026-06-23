<?php
/**
 * Router для PHP built-in development server
 * Маршрутизирует запросы к существующим файлам
 */
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Если файл существует, отдаём его
$filePath = __DIR__ . $path;
if ($path !== '/' && file_exists($filePath)) {
    return false;
}

// Иначе пытаемся отдать индексный файл
if (file_exists(__DIR__ . '/index.html')) {
    require __DIR__ . '/index.html';
    return true;
}

return false;