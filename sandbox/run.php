<?php
/**
 * Python Sandbox — выполняет Python-код через python3
 * 
 * POST /sandbox/run.php
 *   code     — строка с кодом на Python
 *   timeout  — опциональный таймаут (сек), по умолчанию 5
 * 
 * Возвращает JSON:
 *   { "ok": true/false, "stdout": "...", "stderr": "...", "exit_code": N }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Разрешаем preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Only POST allowed']);
    exit;
}

// ---- Конфигурация ----
$MAX_CODE_LENGTH = 65536;     // 64 KB максимум
$MAX_OUTPUT_SIZE = 1048576;   // 1 MB — обрезаем вывод
$TIMEOUT = 5;                 // секунд по умолчанию
// Можно раскомментировать, если /tmp недоступен:
// $TEMP_DIR = __DIR__ . '/tmp';
$TEMP_DIR = sys_get_temp_dir();

// ---- Читаем вход ----
$raw = file_get_contents('php://input');
if (!$raw) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Empty request body']);
    exit;
}

$data = json_decode($raw, true);
if (!$data || !isset($data['code'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing "code" field in JSON']);
    exit;
}

$code = $data['code'];
$input = isset($data['input']) ? $data['input'] : '';
$timeout = isset($data['timeout']) ? max(1, min(30, (int)$data['timeout'])) : $TIMEOUT;

if (strlen($code) > $MAX_CODE_LENGTH) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Code too long (max ' . $MAX_CODE_LENGTH . ' bytes)']);
    exit;
}

// ---- Проверка на опасные конструкции ----
$dangerous = [
    'os.', 'subprocess', 'shutil', 'socket', 'syscalls',
    'ctypes', 'multiprocessing', 'threading', 'importlib',
    '__import__', 'exec(', 'eval(', 'compile(',
    'open(', 'open (', 'file(', '__builtins__',
    '__subclasses__', '__globals__', '__code__',
    'pty.', 'signal.', 'mmap', 'fcntl'
];

$codeLower = mb_strtolower($code);
foreach ($dangerous as $pattern) {
    if (mb_strpos($codeLower, mb_strtolower($pattern)) !== false) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Запрещённая конструкция: "' . htmlspecialchars($pattern) . '". Песочница не допускает опасные операции.'
        ]);
        exit;
    }
}

// ---- Пишем временный файл ----
$tmpFile = tempnam($TEMP_DIR, 'py_sandbox_');
if ($tmpFile === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to create temp file']);
    exit;
}

// ---- Обёртка для перехвата вывода ---- 
// (stdin не трогаем — input() будет читать из pipes[0])
$wrapperCode = <<<'PYTHON'
import sys
import io

# Перехватываем stdout
_original_stdout = sys.stdout
sys.stdout = io.StringIO()

# Перехватываем stderr
_original_stderr = sys.stderr
sys.stderr = io.StringIO()

PYTHON;

$finalCode = $wrapperCode . "\n" . $code . "\n";

// Пост-обработка: извлекаем stdout/stderr
$postCode = <<<'PYTHON'

# Извлекаем результат
_output_stdout = sys.stdout.getvalue()
_output_stderr = sys.stderr.getvalue()
sys.stdout = _original_stdout
sys.stderr = _original_stderr
# Печатаем маркер + данные
print("_SANDBOX_STDOUT_BEGIN_", end="")
print(_output_stdout, end="")
print("_SANDBOX_STDOUT_END_", end="")
print("_SANDBOX_STDERR_BEGIN_", end="")
print(_output_stderr, end="")
print("_SANDBOX_STDERR_END_", end="")
PYTHON;

file_put_contents($tmpFile, $finalCode . $postCode);

// ---- Выполняем с таймаутом ----
$descriptorspec = [
    0 => ['pipe', 'r'],  // stdin
    1 => ['pipe', 'w'],  // stdout
    2 => ['pipe', 'w'],  // stderr
];

$cmd = 'python3 "' . $tmpFile . '" 2>&1';

// Используем proc_open с таймаутом через timeout shell-команду
$timeoutCmd = 'timeout ' . $timeout . ' python3 "' . $tmpFile . '"';

$process = proc_open($timeoutCmd, $descriptorspec, $pipes, null, null, ['bypass_shell' => false]);

if (!is_resource($process)) {
    unlink($tmpFile);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to start Python process']);
    exit;
}

// Пишем пользовательский ввод в stdin (переданный как "input" в JSON)
fwrite($pipes[0], $input);
fclose($pipes[0]);

$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);

fclose($pipes[1]);
fclose($pipes[2]);

$exit_code = proc_close($process);

// Удаляем временный файл
unlink($tmpFile);

// Обрезаем вывод, если слишком большой
if (strlen($stdout) > $MAX_OUTPUT_SIZE) {
    $stdout = substr($stdout, 0, $MAX_OUTPUT_SIZE) . "\n\n... [вывод обрезан, слишком большой]";
}
if (strlen($stderr) > $MAX_OUTPUT_SIZE) {
    $stderr = substr($stderr, 0, $MAX_OUTPUT_SIZE) . "\n\n... [вывод обрезан, слишком большой]";
}

// Парсим вывод — ищем наши маркеры
$stdoutData = $stdout;
$stderrData = '';

// Извлекаем stdout между маркерами
$stdoutBegin = '_SANDBOX_STDOUT_BEGIN_';
$stdoutEnd = '_SANDBOX_STDOUT_END_';
$stderrBegin = '_SANDBOX_STDERR_BEGIN_';
$stderrEnd = '_SANDBOX_STDERR_END_';

$pos1 = strpos($stdoutData, $stdoutBegin);
$pos2 = strpos($stdoutData, $stdoutEnd);
$pos3 = strpos($stdoutData, $stderrBegin);
$pos4 = strpos($stdoutData, $stderrEnd);

if ($pos1 !== false && $pos2 !== false && $pos1 < $pos2) {
    $capturedStdout = substr($stdoutData, $pos1 + strlen($stdoutBegin), $pos2 - $pos1 - strlen($stdoutBegin));
} else {
    $capturedStdout = $stdoutData;
}

if ($pos3 !== false && $pos4 !== false && $pos3 < $pos4) {
    $capturedStderr = substr($stdoutData, $pos3 + strlen($stderrBegin), $pos4 - $pos3 - strlen($stderrBegin));
} else {
    $capturedStderr = '';
}

// Если exit_code = 124, это таймаут от команды timeout
if ($exit_code === 124) {
    $capturedStderr = '⏱ Превышено время выполнения (' . $timeout . ' сек).' . "\n" . $capturedStderr;
}

// Если есть реальный stderr (когда наша обёртка не сработала)
if ($stderr) {
    $capturedStderr = $stderr . "\n" . $capturedStderr;
}

// Если код вернул ошибку, но мы ничего не поймали — показываем весь вывод
if ($exit_code !== 0 && !$capturedStdout && !$capturedStderr) {
    $capturedStdout = $stdoutData;
}

echo json_encode([
    'ok'        => $exit_code === 0,
    'stdout'    => $capturedStdout,
    'stderr'    => $capturedStderr,
    'exit_code' => $exit_code,
]);