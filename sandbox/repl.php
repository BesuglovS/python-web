<?php
/**
 * Persistent REPL Sandbox — выполняет код с сохранением состояния между вызовами.
 * Использует JSON-файл для хранения namespace (безопаснее pickle).
 * Данные передаются через stdin. Не требует фоновых процессов.
 *
 * POST /sandbox/repl.php
 *   code       — строка с кодом на Python
 *   input      — строка с stdin для input() (опционально)
 *   session_id — UUID клиента для изоляции сессий (только [a-f0-9-])
 *   reset      — true, чтобы сбросить сессию (опционально)
 *   timeout    — опциональный таймаут (сек), по умолчанию 5
 *
 * Возвращает JSON:
 *   { "ok": true/false, "stdout": "...", "stderr": "...", "exit_code": N }
 */

require_once __DIR__ . '/sandbox_common.php';

sandbox_check_rate_limit();
$data = sandbox_read_input();

$code = $data['code'];

// Изолируем сессию по session_id (строгий UUID клиента)
$sessionId = $data['session_id'] ?? '';
$uuidPattern = '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i';

$SESSIONS_DIR = __DIR__ . '/.repl_sessions';
$PYTHON_RUNNER = __DIR__ . '/.repl_runner.py';
$MAX_SESSION_SIZE = SANDBOX_SESSION_MAX_SIZE;
$reset = !empty($data['reset']);

if (!is_dir($SESSIONS_DIR)) {
    if (!mkdir($SESSIONS_DIR, 0700, true) && !is_dir($SESSIONS_DIR)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Sessions directory unavailable'], SANDBOX_JSON_OPT);
        exit;
    }
}

// ─── Очистка устаревших сессий (~1 из 50 запросов) ───
$SANDBOX_SESSION_MAX_AGE = 3600; // 1 час
if (mt_rand(1, 50) === 1 && is_dir($SESSIONS_DIR)) {
    $oldSessions = glob($SESSIONS_DIR . '/.repl_session_*.json');
    if ($oldSessions) {
        $now = time();
        foreach ($oldSessions as $sessionFile) {
            if ($now - filemtime($sessionFile) > $SANDBOX_SESSION_MAX_AGE) {
                @unlink($sessionFile);
            }
        }
    }
}

// Генерируем серверный UUID, если клиент не предоставил валидный.
// Это покрывает отсутствие UUID, невалидный UUID и reset без UUID —
// каждый такой запрос получает изолированную сессию (без общего
// md5('default'), который ранее приводил к утечке состояния между пользователями).
$serverGenerated = false;
if ($sessionId !== '' && preg_match($uuidPattern, $sessionId)) {
    // Валидный UUID от клиента
} else {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant 1
    $sessionId = vsprintf('%s%s-%s-%s-%s-%s%s', str_split(bin2hex($bytes), 4));
    $serverGenerated = true;
}

$SESSION_FILE = $SESSIONS_DIR . '/.repl_session_' . hash('sha256', $sessionId) . '.json';

$input = $data['input'] ?? '';
$timeout = isset($data['timeout']) ? max(1, min(10, (int)$data['timeout'])) : SANDBOX_DEFAULT_TIMEOUT;

if ($reset) {
    @unlink($SESSION_FILE);
    $resetResponse = ['ok' => true, 'stdout' => '', 'stderr' => 'Session reset'];
    if ($serverGenerated) $resetResponse['session_id'] = $sessionId;
    echo json_encode($resetResponse, SANDBOX_JSON_OPT);
    exit;
}

// ─── AST-валидация ───
list($astOk, $astError) = sandbox_validate_ast($code, $SANDBOX_ALLOWED_IMPORTS);
if (!$astOk) {
    sandbox_reject_ast($astError);
}

// ─── Выполнение через .repl_runner.py ───
$inputJson = json_encode([
    'session_file' => $SESSION_FILE,
    'code' => $code,
    'stdin_data' => $input,
    'max_output' => SANDBOX_MAX_OUTPUT_SIZE,
], JSON_UNESCAPED_UNICODE);

list($stdout, $stderr, $exitCode) = sandbox_run_python($PYTHON_RUNNER, $inputJson, $timeout, SANDBOX_MEMORY_LIMIT_MB);

// Проверяем размер файла сессии
if (file_exists($SESSION_FILE) && filesize($SESSION_FILE) > $MAX_SESSION_SIZE) {
    @unlink($SESSION_FILE);
    $stderr = ($stderr ? $stderr . "\n" : '') . '⚠ Размер сессии превысил лимит (10 МБ). Сессия сброшена.';
}

if (empty($stdout)) {
    $emptyResponse = [
        'ok' => false,
        'stdout' => '',
        'stderr' => $stderr ?: 'Empty response from Python (exit: ' . $exitCode . ')',
        'exit_code' => $exitCode
    ];
    if ($serverGenerated) $emptyResponse['session_id'] = $sessionId;
    echo json_encode($emptyResponse, SANDBOX_JSON_OPT);
    exit;
}

// Парсим JSON-ответ и добавляем session_id при серверной генерации
$response = json_decode($stdout, true);
if (is_array($response)) {
    if ($serverGenerated) {
        $response['session_id'] = $sessionId;
    }
    echo json_encode($response, SANDBOX_JSON_OPT);
} else {
    // Raw stdout is not valid JSON — return error instead of leaking output
    http_response_code(500);
    $errorResponse = [
        'ok' => false,
        'stdout' => '',
        'stderr' => 'Unexpected response format from Python',
        'exit_code' => $exitCode
    ];
    if ($serverGenerated) $errorResponse['session_id'] = $sessionId;
    echo json_encode($errorResponse, SANDBOX_JSON_OPT);
}
