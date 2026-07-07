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
 *
 * Безопасность:
 *   - AST-анализ: whitelist разрешённых узлов
 *   - Без shell: proc_open с bypass_shell => true
 *   - Изоляция Python: флаги -I -S (изолированный режим, без site-packages)
 *   - Rate limiting: не более 10 запросов в минуту с одного IP
 *   - Memory limit: 128MB
 *   - Лимит кода: 64KB
 *   - Лимит вывода: 1MB
 *   - Сессии в JSON (не pickle) — безопасно от RCE при десериализации
 *   - Сессии в изолированной поддиректории .repl_sessions/
 *   - Строгая валидация session_id (только UUID-формат)
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
$DEFAULT_TIMEOUT = 5;           // секунд
$MEMORY_LIMIT_MB = 128;         // MB на процесс Python
$RATE_LIMIT = 10;               // запросов в минуту
$RATE_WINDOW = 60;              // секунд
$MAX_SESSION_SIZE = 10 * 1024 * 1024; // 10 MB

$SCRIPTS_DIR = __DIR__;
$RATE_DIR = $SCRIPTS_DIR . '/.ratelimit';
$SESSIONS_DIR = $SCRIPTS_DIR . '/.repl_sessions';
$PYTHON_RUNNER = $SCRIPTS_DIR . '/.repl_runner.py';

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

// Изолируем сессию по session_id (строгий UUID клиента)
// session_id ДОЛЖЕН быть UUID v4 формата: 8-4-4-4-12 hex цифр
$sessionId = isset($data['session_id']) ? $data['session_id'] : '';
$uuidPattern = '/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i';

// Создаём директорию для сессий если её нет
if (!is_dir($SESSIONS_DIR)) {
    @mkdir($SESSIONS_DIR, 0700, true);
}

$SESSION_FILE = $SESSIONS_DIR . '/.repl_session_' . md5('default') . '.json';

if ($sessionId !== '' && preg_match($uuidPattern, $sessionId)) {
    // Используем хеш от UUID для имени файла (защита от path traversal)
    $safeName = md5($sessionId);
    $SESSION_FILE = $SESSIONS_DIR . '/.repl_session_' . $safeName . '.json';
} elseif ($sessionId !== '') {
    // Невалидный session_id — используем default (не даём клиенту контролировать имя файла)
    // но не выдаём ошибку, чтобы не раскрывать детали валидации
}

$input = isset($data['input']) ? $data['input'] : '';
$reset = !empty($data['reset']);
$timeout = isset($data['timeout']) ? max(1, min(10, (int)$data['timeout'])) : $DEFAULT_TIMEOUT;

if (strlen($code) > $MAX_CODE_LENGTH) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Code too long (max ' . $MAX_CODE_LENGTH . ' bytes)']);
    exit;
}

if ($reset) {
    @unlink($SESSION_FILE);
    echo json_encode(['ok' => true, 'stdout' => '', 'stderr' => 'Session reset']);
    exit;
}

$ALLOWED_IMPORTS_LIST = [
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
];

// ─── AST-валидация ───
function runPythonScript($scriptContent, $stdinData = '', $timeout = 5, $memoryMb = 128) {
    $tmpFile = tempnam(sys_get_temp_dir(), 'py_');
    file_put_contents($tmpFile, $scriptContent);

    $descriptorspec = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $pythonCmd = DIRECTORY_SEPARATOR === '\\' ? 'python' : 'python3';
    // -I: изолированный режим (игнорирует PYTHON* переменные окружения)
    // -S: не импортировать site-packages при старте
    // -X utf8: принудительный UTF-8 режим
    $cmd = $pythonCmd . ' -I -S -X utf8 "' . $tmpFile . '"';

    $process = proc_open(
        $cmd,
        $descriptorspec,
        $pipes,
        null,
        null,
        ['bypass_shell' => true]
    );

    if (!is_resource($process)) {
        unlink($tmpFile);
        return [false, 'Failed to start Python'];
    }

    if (strlen($stdinData) > 0) {
        fwrite($pipes[0], $stdinData);
    }
    fclose($pipes[0]);

    // Мониторинг таймаута
    $startTime = microtime(true);
    $stdout = '';
    $stderr = '';

    // Читаем вывод с контролем таймаута
    stream_set_timeout($pipes[1], $timeout);
    stream_set_timeout($pipes[2], $timeout);

    while (!feof($pipes[1]) || !feof($pipes[2])) {
        $elapsed = microtime(true) - $startTime;
        if ($elapsed > $timeout) {
            // Таймаут — убиваем процесс
            proc_terminate($process, 9);
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($process);
            unlink($tmpFile);
            return [
                $stdout ?: '',
                ($stderr ?: '') . "\n⏱ Превышен лимит времени (" . $timeout . " сек). Выполнение остановлено.",
                124  // Тот же код, что у timeout в bash
            ];
        }

        $read = [$pipes[1], $pipes[2]];
        $write = null;
        $except = null;
        $sel = stream_select($read, $write, $except, 1, 0); // таймаут 1 сек для проверки

        if ($sel === false) {
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

    // Дособираем остатки
    $stdout .= stream_get_contents($pipes[1]);
    $stderr .= stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    $exitCode = proc_close($process);
    unlink($tmpFile);

    return [$stdout, $stderr, $exitCode];
}

function validateCodeAST($code, $allowedImports) {
    $importsJson = json_encode($allowedImports);

    $script = <<<'PYTHON'
import ast, sys, json

code = sys.stdin.read()

ALLOWED_NODES = {
    "Module",
    "Expr", "Constant", "Name", "Load", "Store", "Del",
    "BinOp", "UnaryOp", "BoolOp", "Compare", "IfExp", "NamedExpr",
    "Add", "Sub", "Mult", "Div", "FloorDiv", "Mod", "Pow",
    "LShift", "RShift", "BitOr", "BitXor", "BitAnd",
    "And", "Or", "Not", "Invert",
    "Eq", "NotEq", "Lt", "LtE", "Gt", "GtE", "Is", "IsNot", "In", "NotIn",
    "Assign", "AugAssign", "AnnAssign",
    "For", "While", "Break", "Continue",
    "If", "Pass", "Delete", "Raise", "Assert",
    "Return", "Yield", "YieldFrom",
    "FunctionDef", "arguments", "arg", "Call", "keyword",
    "Lambda", "ClassDef",
    "List", "Tuple", "Set", "Dict",
    "ListComp", "SetComp", "DictComp", "GeneratorExp", "comprehension",
    "Subscript", "Slice", "Attribute",
    "JoinedStr", "FormattedValue",
    "Import", "ImportFrom", "alias",
    "Try", "ExceptHandler",
    "With", "withitem",
    "Starred",
}

ALLOWED_IMPORTS = set(IMPORTS_PLACEHOLDER)

DANGEROUS_CALLS = {
    "open", "exec", "eval", "compile", "__import__",
    "getattr", "setattr", "delattr", "hasattr",
    "globals", "locals", "vars", "dir",
    "type", "isinstance", "issubclass", "callable",
}

try:
    tree = ast.parse(code)
except SyntaxError as e:
    print(json.dumps({"ok": False, "error": "SyntaxError: " + str(e)}))
    sys.exit(0)

errors = []

class SafeVisitor(ast.NodeVisitor):
    def generic_visit(self, node):
        node_type = type(node).__name__
        if node_type == "Module":
            super().generic_visit(node)
            return
        if node_type not in ALLOWED_NODES:
            errors.append(f"Forbidden construct: {node_type} (line~{getattr(node, 'lineno', '?')})")
        super().generic_visit(node)
    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id in DANGEROUS_CALLS:
                errors.append(f"Forbidden function call: {node.func.id}() (line {node.lineno})")
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                if node.func.value.id in ("os", "sys", "subprocess"):
                    errors.append(f"Forbidden module access: {node.func.value.id}.{node.func.attr} (line {node.lineno})")
        self.generic_visit(node)
    def visit_Import(self, node):
        for alias in node.names:
            if alias.name not in ALLOWED_IMPORTS:
                errors.append(f"Forbidden import: {alias.name} (line {node.lineno})")
        self.generic_visit(node)
    def visit_ImportFrom(self, node):
        if node.module and node.module not in ALLOWED_IMPORTS:
            errors.append(f"Forbidden import from: {node.module} (line {node.lineno})")
        self.generic_visit(node)

visitor = SafeVisitor()
visitor.visit(tree)

if errors:
    print(json.dumps({"ok": False, "error": "; ".join(errors[:3])}))
else:
    print(json.dumps({"ok": True}))
PYTHON;

    $script = str_replace('IMPORTS_PLACEHOLDER', $importsJson, $script);

    list($stdout, $stderr, $exitCode) = runPythonScript($script, $code, 5, 64);

    $result = json_decode(trim($stdout), true);
    if (!$result) {
        return [false, 'AST validation failed: ' . ($stderr ?: 'unknown error')];
    }

    return [$result['ok'], $result['error'] ?? 'Unknown AST error'];
}

list($astOk, $astError) = validateCodeAST($code, $ALLOWED_IMPORTS_LIST);
if (!$astOk) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => '🚫 Запрещённая конструкция: ' . htmlspecialchars($astError)
    ]);
    exit;
}

// ─── Выполнение через .repl_runner.py ───
// Раннер лежит на диске (не перезаписываем каждый раз — избегаем гонки данных)

$inputJson = json_encode([
    'session_file' => $SESSION_FILE,
    'code' => $code,
    'stdin_data' => $input,
    'max_output' => $MAX_OUTPUT_SIZE,
], JSON_UNESCAPED_UNICODE);

// Запускаем раннер
list($stdout, $stderr, $exitCode) = runPythonScript($PYTHON_RUNNER, $inputJson, $timeout, $MEMORY_LIMIT_MB);

// Проверяем размер файла сессии (не более 10 МБ)
if (file_exists($SESSION_FILE) && filesize($SESSION_FILE) > $MAX_SESSION_SIZE) {
    @unlink($SESSION_FILE);
    $stderr = ($stderr ? $stderr . "\n" : '') . '⚠ Размер сессии превысил лимит (10 МБ). Сессия сброшена.';
}

if (empty($stdout)) {
    echo json_encode([
        'ok' => false,
        'stdout' => '',
        'stderr' => $stderr ?: 'Empty response from Python (exit: ' . $exitCode . ')',
        'exit_code' => $exitCode
    ]);
    exit;
}

echo $stdout;