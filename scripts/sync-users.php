<?php
/**
 * CLI-скрипт синхронизации пользователей из auth-web.
 * Запуск: php scripts/sync-users.php
 *
 * Использует AUTH_SYNC_URL из env (по умолчанию https://auth.nayanovaacademy.ru/api/public_users.php)
 * Можно указать в .env: AUTH_SYNC_URL
 * 
 * Фильтрация по логину через AUTH_SYNC_FILTER (regex, опционально).
 * Пример: AUTH_SYNC_FILTER="/[0-9]{2}-[0-9]{2}-[0-9]+/"
 *
 * Файлы: scripts/sync-users.php  +  api/public_users.php (auth-web)
 */

$projectDir = realpath(__DIR__ . '/..');
require_once $projectDir . '/sandbox/config.php';
require_once $projectDir . '/sandbox/Database.php';

// ─── Загрузка .env ───
$envFile = $projectDir . '/.env';
if (is_file($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (preg_match('/^\s*([^#=]+?)\s*=\s*(.+?)\s*$/', $line, $m)) {
            $_SERVER[$m[1]] = $m[2];
            putenv("{$m[1]}={$m[2]}");
        }
    }
}

$syncUrl = getenv('AUTH_SYNC_URL');
if (!$syncUrl) {
    $syncUrl = 'https://auth.nayanovaacademy.ru/api/public_users.php';
}

$filterPattern = getenv('AUTH_SYNC_FILTER');

echo "Синхронизация пользователей из: $syncUrl\n";

// ─── Запрос к auth-web ───
$ch = curl_init($syncUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_FOLLOWLOCATION => false,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    echo "Ошибка: HTTP $httpCode, curl: $curlError\n";
    exit(1);
}

$data = json_decode($response, true);
if (!is_array($data) || !isset($data['users'])) {
    echo "Ошибка: неверный ответ от auth-web\n";
    exit(1);
}

// ─── Синхронизация ───
Database::initialize();
$db = Database::getInstance();

$stmt = $db->prepare(
    "INSERT INTO users (id, login, display_name, is_admin, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       login = excluded.login,
       display_name = excluded.display_name,
       is_admin = excluded.is_admin,
       created_at = excluded.created_at"
);

$synced = 0;
$skipped = 0;
$syncedIds = [];

foreach ($data['users'] as $user) {
    $login = $user['login'] ?? '';

    // Фильтр по логину
    if ($filterPattern && !preg_match($filterPattern, $login)) {
        $skipped++;
        continue;
    }

    $stmt->execute([
        (int) $user['id'],
        $login,
        $user['display_name'] ?? $login,
        (int) ($user['is_admin'] ?? 0),
        $user['created_at'] ?? gmdate('Y-m-d H:i:s'),
    ]);
    $syncedIds[] = (int) $user['id'];
    $synced++;
}

// Удаляем пользователей, которых больше нет в auth-web
$deleted = 0;
if (!empty($syncedIds)) {
    $placeholders = implode(',', array_fill(0, count($syncedIds), '?'));
    $stmtDel = $db->prepare("DELETE FROM users WHERE id NOT IN ($placeholders)");
    $stmtDel->execute($syncedIds);
    $deleted = $stmtDel->rowCount();
}

$total = count($data['users']);
echo "Готово: $synced синхронизировано, $skipped пропущено, $deleted удалено (всего: $total)\n";
