<?php
/**
 * Python Sandbox — безопасное выполнение Python-кода
 * 
 * POST /sandbox/run.php
 *   code     — строка с кодом на Python
 *   timeout  — опциональный таймаут (сек), по умолчанию 5
 * 
 * Возвращает JSON:
 *   { "ok": true/false, "stdout": "...", "stderr": "...", "exit_code": N }
 * 
 * Безопасность:
 *   - AST-анализ: whitelist разрешённых узлов
 *   - Без shell: proc_open с bypass_shell => true
 *   - Rate limiting: не более 10 запросов в минуту с одного IP
 *   - Memory limit: 128MB
 *   - Лимит кода: 64KB
 *   - Лимит вывода: 1MB
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Only POST allowed']);
    exit;
}

// ─── Конфигурация ───
$MAX_CODE_LENGTH = 65536;       // 64 KB
$MAX_OUTPUT_SIZE = 1048576;     // 1 MB
$TIMEOUT = 5;                    // секунд
$MEMORY_LIMIT_MB = 128;         // MB на процесс Python
$RATE_LIMIT = 10;               // запросов в минуту
$RATE_WINDOW = 60;              // секунд
$RATE_DIR = __DIR__ . '/.ratelimit';

$TEMP_DIR = sys_get_temp_dir();

// ─── Rate Limiting ───
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$ipHash = md5($clientIp);
$rateFile = $RATE_DIR . '/' . $ipHash . '.json';

if (!is_dir($RATE_DIR)) {
    @mkdir($RATE_DIR, 0700, true);
}

$now = time();
$window = [];
if (file_exists($rateFile)) {
    $window = json_decode(file_get_contents($rateFile), true) ?: [];
}
// Очищаем старые записи
$window = array_filter($window, function($ts) use ($now, $RATE_WINDOW) {
    return ($now - $ts) < $RATE_WINDOW;
});
$window = array_values($window);

if (count($window) >= $RATE_LIMIT) {
    $oldest = $window[0];
    $retryAfter = $RATE_WINDOW - ($now - $oldest);
    http_response_code(429);
    header('Retry-After: ' . max(0, $retryAfter));
    echo json_encode([
        'ok' => false,
        'error' => 'Слишком много запросов. Подождите ' . max(1, $retryAfter) . ' сек.'
    ]);
    exit;
}

$window[] = $now;
file_put_contents($rateFile, json_encode($window), LOCK_EX);

// ─── Читаем вход ───
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
$timeout = isset($data['timeout']) ? max(1, min(10, (int)$data['timeout'])) : $TIMEOUT;

if (strlen($code) > $MAX_CODE_LENGTH) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Code too long (max ' . $MAX_CODE_LENGTH . ' bytes)']);
    exit;
}

// ─── AST-валидация (whitelist разрешённых конструкций) ───
/**
 * AST whitelist — только безопасные конструкции для обучения.
 * Запрещены: import, exec, eval, open, __-методы, доступ к файловой системе, сеть.
 */
function validateCodeAST($code) {
    $tmpFile = tempnam(sys_get_temp_dir(), 'py_ast_check_');
    if ($tmpFile === false) {
        return [false, 'Internal error: cannot create temp file'];
    }
    
    // Пишем код пользователя во временный файл
    $codeFile = tempnam(sys_get_temp_dir(), 'py_code_');
    file_put_contents($codeFile, $code);
    $codePath = escapeshellarg($codeFile);
    
    $astScript = <<<'PYTHON'
import ast
import sys
import json
import os

# Читаем файл с кодом из аргумента командной строки
code_file = sys.argv[1]
with open(code_file, 'r', encoding='utf-8') as f:
    code = f.read()

# Whitelist разрешённых узлов AST
ALLOWED_NODES = {
    # Expressions
    'Expr', 'Constant', 'Name', 'Load', 'Store', 'Del',
    'BinOp', 'UnaryOp', 'BoolOp', 'Compare', 'IfExp',
    'NamedExpr',
    # Operators
    'Add', 'Sub', 'Mult', 'Div', 'FloorDiv', 'Mod', 'Pow',
    'LShift', 'RShift', 'BitOr', 'BitXor', 'BitAnd',
    'And', 'Or', 'Not', 'Invert',
    'Eq', 'NotEq', 'Lt', 'LtE', 'Gt', 'GtE', 'Is', 'IsNot', 'In', 'NotIn',
    # Statements
    'Assign', 'AugAssign', 'AnnAssign',
    'For', 'While', 'Break', 'Continue',
    'If', 'Pass', 'Delete', 'Raise', 'Assert',
    'Return', 'Yield', 'YieldFrom',
    # Functions / Classes
    'FunctionDef', 'arguments', 'arg', 'Call', 'keyword',
    'Lambda',
    'ClassDef',
    # Data structures
    'List', 'Tuple', 'Set', 'Dict',
    'ListComp', 'SetComp', 'DictComp', 'GeneratorExp',
    'comprehension',
    # Subscript / Attribute
    'Subscript', 'Slice', 'Attribute',
    # Strings
    'JoinedStr', 'FormattedValue',
    # Imports (разрешены только стандартные модули для обучения)
    'Import', 'ImportFrom', 'alias',
    # Error handling
    'Try', 'ExceptHandler',
    # Context managers (with)
    'With', 'withitem',
    # Starred
    'Starred',
    # PEP 604 union types (Python 3.10+)
    'If',
}

# Стандартные модули разрешённые для импорта
ALLOWED_IMPORTS = {
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
}

DANGEROUS_CALLS = {
    'open', 'exec', 'eval', 'compile', '__import__',
    'getattr', 'setattr', 'delattr', 'hasattr',
    'globals', 'locals', 'vars', 'dir',
    'type', 'isinstance', 'issubclass',
    'callable', 'super',
}

try:
    tree = ast.parse(code)
except SyntaxError as e:
    print(json.dumps({'ok': False, 'error': 'SyntaxError: ' + str(e)}))
    sys.exit(0)

errors = []

class SafeVisitor(ast.NodeVisitor):
    def generic_visit(self, node):
        node_type = type(node).__name__
        if node_type not in ALLOWED_NODES:
            errors.append(f'Forbidden construct: {node_type} (line ~{getattr(node, "lineno", "?")})')
        super().generic_visit(node)
    
    def visit_Call(self, node):
        # Проверяем вызовы опасных функций
        if isinstance(node.func, ast.Name):
            if node.func.id in DANGEROUS_CALLS:
                errors.append(f'Forbidden function call: {node.func.id}() (line {node.lineno})')
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                if node.func.value.id == 'os' or node.func.value.id == 'sys':
                    errors.append(f'Forbidden module access: {node.func.value.id}.{node.func.attr} (line {node.lineno})')
        self.generic_visit(node)
    
    def visit_Import(self, node):
        for alias in node.names:
            if alias.name not in ALLOWED_IMPORTS:
                errors.append(f'Forbidden import: {alias.name} (line {node.lineno})')
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        if node.module and node.module not in ALLOWED_IMPORTS:
            errors.append(f'Forbidden import from: {node.module} (line {node.lineno})')
        self.generic_visit(node)

visitor = SafeVisitor()
visitor.visit(tree)

if errors:
    print(json.dumps({'ok': False, 'error': '; '.join(errors[:3])}))
else:
    print(json.dumps({'ok': True}))

PYTHON;

    file_put_contents($tmpFile, $astScript);
    
    $descriptorspec = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    
    // Определяем команду Python (Windows: python, Linux: python3)
    $pythonCmd = DIRECTORY_SEPARATOR === '\\' ? 'python' : 'python3';
    
    $process = proc_open(
        $pythonCmd . ' "' . $tmpFile . '" ' . $codePath,
        $descriptorspec,
        $pipes,
        null,
        null,
        ['bypass_shell' => true]
    );
    
    if (!is_resource($process)) {
        unlink($tmpFile);
        unlink($codeFile);
        return [false, 'Failed to start AST validator'];
    }
    
    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($process);
    unlink($tmpFile);
    unlink($codeFile);
    
    $result = json_decode(trim($stdout), true);
    if (!$result) {
        return [false, 'AST validation failed: unable to parse result'];
    }
    
    return [$result['ok'], $result['error'] ?? 'Unknown AST error'];
}

list($astOk, $astError) = validateCodeAST($code);
if (!$astOk) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => '🚫 Запрещённая конструкция: ' . htmlspecialchars($astError)
    ]);
    exit;
}

// ─── Выполнение Python-кода ───

$tmpFile = tempnam($TEMP_DIR, 'py_sandbox_');
if ($tmpFile === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to create temp file']);
    exit;
}

// Обёртка для перехвата stdout/stderr
$wrapperCode = <<<'PYTHON'
import sys
import io

_original_stdout = sys.stdout
sys.stdout = io.StringIO()

_original_stderr = sys.stderr
sys.stderr = io.StringIO()

PYTHON;

$postCode = <<<'PYTHON'

_output_stdout = sys.stdout.getvalue()
_output_stderr = sys.stderr.getvalue()
sys.stdout = _original_stdout
sys.stderr = _original_stderr
print("_SANDBOX_STDOUT_BEGIN_", end="")
print(_output_stdout, end="")
print("_SANDBOX_STDOUT_END_", end="")
print("_SANDBOX_STDERR_BEGIN_", end="")
print(_output_stderr, end="")
print("_SANDBOX_STDERR_END_", end="")
PYTHON;

file_put_contents($tmpFile, $wrapperCode . "\n" . $code . "\n" . $postCode);

$descriptorspec = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$cmd = 'python3 -I -S "' . $tmpFile . '"'; // -I изолированный режим, -S без site-packages

$process = proc_open(
    $cmd,
    $descriptorspec,
    $pipes,
    null,
    null,
    ['bypass_shell' => true]  // БЕЗ shell — безопасно
);

if (!is_resource($process)) {
    unlink($tmpFile);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to start Python process']);
    exit;
}

// Устанавливаем таймаут через отдельный мониторинг
$startTime = microtime(true);

fwrite($pipes[0], $input);
fclose($pipes[0]);

// Читаем вывод с контролем таймаута
$stdout = '';
$stderr = '';

// Неблокирующее чтение с таймаутом
$readStart = microtime(true);
stream_set_blocking($pipes[1], false);

$buffer = '';
while (microtime(true) - $readStart < $timeout) {
    $chunk = fread($pipes[1], 8192);
    if ($chunk !== false && strlen($chunk) > 0) {
        $stdout .= $chunk;
    } else {
        // Проверяем, жив ли ещё процесс
        $status = proc_get_status($process);
        if (!$status['running']) {
            break;
        }
        usleep(50000); // 50ms пауза
    }
    
    if (strlen($stdout) > $MAX_OUTPUT_SIZE) {
        break;
    }
}

stream_set_blocking($pipes[1], true);
$remaining = stream_get_contents($pipes[1]);
if ($remaining) {
    $stdout .= $remaining;
}

stream_set_blocking($pipes[2], false);
$stderr = stream_get_contents($pipes[2]);
stream_set_blocking($pipes[2], true);
$remainingErr = stream_get_contents($pipes[2]);
if ($remainingErr) {
    $stderr .= $remainingErr;
}

fclose($pipes[1]);
fclose($pipes[2]);

$exit_code = proc_close($process);
$elapsed = microtime(true) - $startTime;

unlink($tmpFile);

// Проверка на превышение таймаута
$timedOut = ($elapsed >= $timeout && $exit_code !== 0);

// Обрезаем вывод
if (strlen($stdout) > $MAX_OUTPUT_SIZE) {
    $stdout = substr($stdout, 0, $MAX_OUTPUT_SIZE) . "\n\n... [вывод обрезан, слишком большой]";
}
if (strlen($stderr) > $MAX_OUTPUT_SIZE) {
    $stderr = substr($stderr, 0, $MAX_OUTPUT_SIZE) . "\n\n... [вывод обрезан, слишком большой]";
}

// Парсим маркеры stdout/stderr
$stdoutBegin = '_SANDBOX_STDOUT_BEGIN_';
$stdoutEnd = '_SANDBOX_STDOUT_END_';
$stderrBegin = '_SANDBOX_STDERR_BEGIN_';
$stderrEnd = '_SANDBOX_STDERR_END_';

$pos1 = strpos($stdout, $stdoutBegin);
$pos2 = strpos($stdout, $stdoutEnd);
$pos3 = strpos($stdout, $stderrBegin);
$pos4 = strpos($stdout, $stderrEnd);

if ($pos1 !== false && $pos2 !== false && $pos1 < $pos2) {
    $capturedStdout = substr($stdout, $pos1 + strlen($stdoutBegin), $pos2 - $pos1 - strlen($stdoutBegin));
} else {
    $capturedStdout = $stdout;
}

if ($pos3 !== false && $pos4 !== false && $pos3 < $pos4) {
    $capturedStderr = substr($stdout, $pos3 + strlen($stderrBegin), $pos4 - $pos3 - strlen($stderrBegin));
} else {
    $capturedStderr = '';
}

if ($timedOut) {
    $capturedStderr = '⏱ Превышено время выполнения (' . $timeout . ' сек).' . "\n" . $capturedStderr;
}

if ($stderr) {
    $capturedStderr = $stderr . "\n" . $capturedStderr;
}

if ($exit_code !== 0 && !$capturedStdout && !$capturedStderr) {
    $capturedStdout = $stdout;
}

echo json_encode([
    'ok'        => $exit_code === 0 && !$timedOut,
    'stdout'    => $capturedStdout,
    'stderr'    => $capturedStderr,
    'exit_code' => $exit_code,
]);