<?php
/**
 * Общие функции для PHP-песочницы.
 * Подключается через require_once в run.php и repl.php.
 */

// ─── Конфигурация (читает из env, с фоллбэками на дефолты) ───
define('SANDBOX_MAX_CODE_LENGTH', (int)(getenv('SANDBOX_MAX_CODE_LENGTH') ?: 65536));
define('SANDBOX_MAX_INPUT_LENGTH', (int)(getenv('SANDBOX_MAX_INPUT_LENGTH') ?: 102400));
define('SANDBOX_MAX_OUTPUT_SIZE', (int)(getenv('SANDBOX_MAX_OUTPUT_SIZE') ?: 1048576));
define('SANDBOX_DEFAULT_TIMEOUT', (int)(getenv('SANDBOX_DEFAULT_TIMEOUT') ?: 5));
define('SANDBOX_MEMORY_LIMIT_MB', (int)(getenv('SANDBOX_MEMORY_LIMIT_MB') ?: 128));
define('SANDBOX_RATE_LIMIT', (int)(getenv('SANDBOX_RATE_LIMIT') ?: 10));
define('SANDBOX_RATE_WINDOW', (int)(getenv('SANDBOX_RATE_WINDOW') ?: 60));
define('SANDBOX_SESSION_MAX_SIZE', (int)(getenv('SANDBOX_SESSION_MAX_SIZE') ?: (10 * 1024 * 1024)));
define('SANDBOX_JSON_OPT', JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Разрешённый origin для CORS
$SANDBOX_ALLOWED_ORIGIN = getenv('SANDBOX_ALLOWED_ORIGIN') ?: 'https://python.nayanovaacademy.ru';

// Базовый URL сайта
$SANDBOX_BASE_URL = getenv('SANDBOX_BASE_URL') ?: 'https://python.nayanovaacademy.ru';

// Доверенные прокси (список IP через запятую)
$SANDBOX_TRUSTED_PROXIES = array_filter(array_map('trim', explode(',', getenv('SANDBOX_TRUSTED_PROXIES') ?: '')));

// Стандартные модули разрешённые для импорта в Python.
// Этот список — единственный источник разрешённых импортов: AST-валидатор
// (ast_validator.py) блокирует любой импорт вне списка. Ни в коем случае
// не добавлять сюда os/sys/subprocess и прочие опасные модули — они также
// заблокированы на уровне FORBIDDEN_MODULE_ATTRS валидатора.
$SANDBOX_ALLOWED_IMPORTS = [
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
];

// Защита от ошибки конфигурации: никогда не разрешать заведомо опасные модули,
// даже если они случайно попадут в SANDBOX_ALLOWED_IMPORTS (например, через env).
$sandboxDeniedImports = [
    'os', 'sys', 'subprocess', 'shutil', 'importlib', 'site', 'socket',
    'ctypes', 'multiprocessing', 'threading', 'pickle', 'shelve', 'marshal',
    'builtins', 'code', 'codeop', 'runpy', 'pkgutil', 'inspect', 'ast',
    'urllib', 'http', 'ftplib', 'poplib', 'imaplib', 'smtplib', 'nntplib',
    'telnetlib', 'xmlrpc', 'sqlite3', 'ssl',
];
foreach ($SANDBOX_ALLOWED_IMPORTS as $sandboxMod) {
    if (in_array($sandboxMod, $sandboxDeniedImports, true)) {
        error_log('SANDBOX_ALLOWED_IMPORTS содержит запрещённый модуль: ' . $sandboxMod);
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Sandbox misconfiguration'], SANDBOX_JSON_OPT);
        exit;
    }
}

// ─── Security Headers ───
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Cache-Control: no-store, no-cache, must-revalidate');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'");

// ─── CORS ───
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $SANDBOX_ALLOWED_ORIGIN) {
    header('Access-Control-Allow-Origin: ' . $SANDBOX_ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Only POST allowed'], SANDBOX_JSON_OPT);
    exit;
}

/**
 * Проверяет rate limit для текущего IP-адреса.
 * Использует flock() для атомарного read-modify-write, предотвращая race condition.
 *
 * @return void завершает выполнение с HTTP 429 при превышении лимита
 */
function sandbox_check_rate_limit(): void {
    global $SANDBOX_TRUSTED_PROXIES;
    $rateDir = __DIR__ . '/.ratelimit';

    // Определяем клиентский IP. X-Forwarded-For используется только если
    // непосредственный клиент (REMOTE_ADDR) является доверенным прокси.
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!empty($SANDBOX_TRUSTED_PROXIES) && in_array($clientIp, $SANDBOX_TRUSTED_PROXIES, true)) {
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && $_SERVER['HTTP_X_FORWARDED_FOR'] !== '') {
            $forwarded = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'], 2);
            $forwardedIp = trim($forwarded[0]);
            if ($forwardedIp !== '' && filter_var($forwardedIp, FILTER_VALIDATE_IP)) {
                $clientIp = $forwardedIp;
            }
        }
    }

    $ipHash = md5($clientIp);
    $rateFile = $rateDir . '/' . $ipHash . '.json';

    if (!is_dir($rateDir)) {
        if (!mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Rate limiter initialization failed'], SANDBOX_JSON_OPT);
            exit;
        }
    }

    $now = time();
    $window = [];
    $handle = fopen($rateFile, 'c+');
    if ($handle === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Rate limiter file open failed'], SANDBOX_JSON_OPT);
        exit;
    }

    flock($handle, LOCK_EX);

    $content = stream_get_contents($handle);
    if ($content !== false && strlen($content) > 0) {
        $decoded = json_decode($content, true);
        $window = is_array($decoded) ? $decoded : [];
    }

    $window = array_values(array_filter($window, function ($ts) use ($now) {
        return ($now - $ts) < SANDBOX_RATE_WINDOW;
    }));

    if (count($window) >= SANDBOX_RATE_LIMIT) {
        flock($handle, LOCK_UN);
        fclose($handle);
        $oldest = $window[0];
        $retryAfter = SANDBOX_RATE_WINDOW - ($now - $oldest);
        http_response_code(429);
        header('Retry-After: ' . max(0, $retryAfter));
        echo json_encode([
            'ok' => false,
            'error' => 'Слишком много запросов. Подождите ' . max(1, $retryAfter) . ' сек.'
        ], SANDBOX_JSON_OPT);
        exit;
    }

    $window[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($window, SANDBOX_JSON_OPT));
    flock($handle, LOCK_UN);
    fclose($handle);

    // Периодическая очистка устаревших файлов (раз в 5 минут)
    $cleanupFile = $rateDir . '/.cleanup_ts';
    $lastCleanup = @filemtime($cleanupFile);
    if ($lastCleanup === false || ($now - $lastCleanup) > 300) {
        @touch($cleanupFile);
        if (is_dir($rateDir)) {
            $files = glob($rateDir . '/*.json');
            if ($files) {
                foreach ($files as $f) {
                    if (basename($f) === '.cleanup_ts') continue;
                    if ($now - filemtime($f) > SANDBOX_RATE_WINDOW * 2) {
                        @unlink($f);
                    }
                }
            }
        }
    }
}

/**
 * Читает и валидирует входные данные из тела POST-запроса.
 * Ожидает JSON с обязательным полем "code".
 *
 * @return array{code: string, [input]: string, [timeout]: int, [session_id]: string, [reset]: bool}
 */
function sandbox_read_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Empty request body'], SANDBOX_JSON_OPT);
        exit;
    }

    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['code']) || !is_string($data['code'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing "code" field in JSON'], SANDBOX_JSON_OPT);
        exit;
    }

    $code = (string)$data['code'];

    if (strlen($code) > SANDBOX_MAX_CODE_LENGTH) {
        http_response_code(413);
        echo json_encode(['ok' => false, 'error' => 'Code too long (max ' . SANDBOX_MAX_CODE_LENGTH . ' bytes)'], SANDBOX_JSON_OPT);
        exit;
    }

    if (isset($data['input']) && is_string($data['input']) && strlen($data['input']) > SANDBOX_MAX_INPUT_LENGTH) {
        http_response_code(413);
        echo json_encode(['ok' => false, 'error' => 'Input too long (max ' . SANDBOX_MAX_INPUT_LENGTH . ' bytes)'], SANDBOX_JSON_OPT);
        exit;
    }

    return $data;
}

/**
 * Возвращает системную команду для запуска Python.
 *
 * @return string 'python' на Windows, 'python3' на Unix
 */
function sandbox_python_cmd(): string {
    return DIRECTORY_SEPARATOR === '\\' ? 'python' : 'python3';
}

/**
 * Запускает Python-скрипт с заданными параметрами.
 * Создаёт временный файл, передаёт stdin, читает stdout/stderr с таймаутом.
 *
 * @param string $scriptContent содержимое Python-скрипта
 * @param string $stdinData     данные для stdin (опционально)
 * @param int    $timeout       максимальное время выполнения в секундах
 * @param int    $memoryMb      лимит памяти в мегабайтах
 * @return array{0: string|false, 1: string, 2: int} [stdout, stderr, exit_code]
 */
function sandbox_run_python(string $scriptContent, string $stdinData = '', int $timeout = 5, int $memoryMb = 128): array {
    $tmpFile = null;
    try {
        $tmpFile = tempnam(sys_get_temp_dir(), 'py_');

        // ─── Ограничение памяти (реальное, через setrlimit на Linux/macOS) ───
        $memBytes = (int)($memoryMb * 1024 * 1024);
        $prelude =
            "try:\n" .
            "    import resource\n" .
            "    resource.setrlimit(resource.RLIMIT_AS, ($memBytes, $memBytes))\n" .
            "except (ImportError, ValueError, OSError):\n" .
            "    pass  # Windows: resource module unavailable, memory limit skipped\n";
        $scriptContent = $prelude . $scriptContent;

        file_put_contents($tmpFile, $scriptContent);

        $descriptorspec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $pythonCmd = sandbox_python_cmd();
        $cmd = [$pythonCmd, '-I', '-S', '-X', 'utf8', $tmpFile];

        $process = proc_open(
            $cmd,
            $descriptorspec,
            $pipes,
            null,
            null,
            ['bypass_shell' => true]
        );

        if (!is_resource($process)) {
            return [false, 'Failed to start Python', -1];
        }

        if (strlen($stdinData) > 0) {
            $written = @fwrite($pipes[0], $stdinData);
            if ($written === false || $written < strlen($stdinData)) {
                // Partial write or failure — close and let process handle incomplete input
            }
        }
        fclose($pipes[0]);

        $startTime = microtime(true);
        $stdout = '';
        $stderr = '';

        stream_set_timeout($pipes[1], $timeout);
        stream_set_timeout($pipes[2], $timeout);

        while (!feof($pipes[1]) || !feof($pipes[2])) {
            $elapsed = microtime(true) - $startTime;
            if ($elapsed > $timeout) {
                proc_terminate($process, 9);
                $stdout = stream_get_contents($pipes[1]);
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($process);
                return [
                    $stdout ?: '',
                    ($stderr ?: '') . "\n⏱ Превышен лимит времени (" . $timeout . " сек). Выполнение остановлено.",
                    124
                ];
            }

            $read = [$pipes[1], $pipes[2]];
            $write = null;
            $except = null;
            $sel = @stream_select($read, $write, $except, 1, 0);

            if ($sel === false) {
                // stream_select interrupted (e.g. signal) — read remaining data and break
                $stdout .= stream_get_contents($pipes[1]);
                $stderr .= stream_get_contents($pipes[2]);
                break;
            }
            if ($sel > 0) {
                foreach ($read as $pipe) {
                    $data = fread($pipe, 8192);
                    if ($data === false || $data === '') {
                        continue;
                    }
                    if ($pipe === $pipes[1]) {
                        $stdout .= $data;
                    } else {
                        $stderr .= $data;
                    }
                }
            }
        }

        $stdout .= stream_get_contents($pipes[1]);
        $stderr .= stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        return [$stdout, $stderr, $exitCode];
    } finally {
        if ($tmpFile !== null && file_exists($tmpFile)) {
            @unlink($tmpFile);
        }
    }
}

/**
 * Формирует команду для запуска AST-валидатора.
 *
 * @param list<string> $allowedImports список разрешённых модулей Python
 * @return list<string>                   массив аргументов для proc_open
 */
function sandbox_build_ast_command(array $allowedImports): array {
    $importsJson = json_encode($allowedImports, JSON_UNESCAPED_UNICODE);
    $scriptPath = __DIR__ . '/ast_validator.py';
    return [sandbox_python_cmd(), '-I', '-S', $scriptPath, $importsJson];
}

/**
 * Валидирует Python-код через AST-валидатор.
 * Проверяет отсутствие опасных конструкций (exec, eval, import os, и т.д.)
 *
 * @param string        $code            Python-код для проверки
 * @param list<string>  $allowedImports  список разрешённых модулей
 * @return array{0: bool, 1: string}     [ok, error_message]
 */
function sandbox_validate_ast(string $code, array $allowedImports): array {
    $astTimeout = (int)(getenv('SANDBOX_AST_TIMEOUT') ?: 3);
    $cmd = sandbox_build_ast_command($allowedImports);
    $descriptorspec = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $process = proc_open($cmd, $descriptorspec, $pipes, null, null, ['bypass_shell' => true]);
    if (!is_resource($process)) {
        return [false, 'Failed to start AST validator'];
    }
    fwrite($pipes[0], $code);
    fclose($pipes[0]);

    stream_set_timeout($pipes[1], $astTimeout);
    stream_set_timeout($pipes[2], $astTimeout);

    $startTime = microtime(true);
    $stdout = '';
    $stderr = '';

    while (!feof($pipes[1]) || !feof($pipes[2])) {
        $elapsed = microtime(true) - $startTime;
        if ($elapsed > $astTimeout) {
            proc_terminate($process, 9);
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($process);
            return [false, 'AST validation timed out (possible DoS via deeply nested code)'];
        }

        $read = [$pipes[1], $pipes[2]];
        $write = null;
        $except = null;
        $sel = @stream_select($read, $write, $except, 1, 0);
        if ($sel === false) break;
        if ($sel > 0) {
            foreach ($read as $pipe) {
                $data = fread($pipe, 8192);
                if ($data === false || $data === '') continue;
                if ($pipe === $pipes[1]) { $stdout .= $data; } else { $stderr .= $data; }
            }
        }
    }

    $stdout .= stream_get_contents($pipes[1]);
    $stderr .= stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($process);

    $result = json_decode(trim($stdout), true);
    if (!is_array($result)) {
        return [false, 'AST validation failed: ' . ($stderr ?: 'unknown error')];
    }

    return [$result['ok'] ?? false, $result['error'] ?? 'Unknown AST error'];
}

/**
 * Отправляет ответ 403 с ошибкой AST-валидации и завершает выполнение.
 *
 * @param string $astError описание ошибки AST-валидации
 * @return void завершает выполнение скрипта
 */
function sandbox_reject_ast(string $astError): void {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => '🚫 Запрещённая конструкция: ' . htmlspecialchars($astError, ENT_QUOTES, 'UTF-8')
    ], SANDBOX_JSON_OPT);
    exit;
}
