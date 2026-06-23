<?php
/**
 * Persistent REPL Sandbox — выполняет код с сохранением состояния между вызовами.
 * Использует pickle-файл для хранения namespace. Данные передаются через stdin.
 * Не требует фоновых процессов.
 *
 * POST /sandbox/repl.php
 *   code     — строка с кодом на Python
 *   input    — строка с stdin для input()
 *   reset    — true, чтобы сбросить сессию (опционально)
 *   timeout  — опциональный таймаут (сек), по умолчанию 5
 *
 * Возвращает JSON:
 *   { "ok": true/false, "stdout": "...", "stderr": "...", "exit_code": N }
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

$MAX_CODE_LENGTH = 65536;
$MAX_OUTPUT_SIZE = 1048576;
$SCRIPTS_DIR = __DIR__;
$SESSION_FILE = $SCRIPTS_DIR . '/.repl_session.pkl';
$PYTHON_RUNNER = $SCRIPTS_DIR . '/.repl_runner.py';

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
$reset = !empty($data['reset']);
$timeout = isset($data['timeout']) ? max(1, min(10, (int)$data['timeout'])) : 5;

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
function runPythonScript($scriptContent, $stdinData = '') {
    $tmpFile = tempnam(sys_get_temp_dir(), 'py_');
    file_put_contents($tmpFile, $scriptContent);

    $descriptorspec = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    // Используем прямой вызов python3 с файлом (UTF-8 mode)
    $process = proc_open(
        'python3 -X utf8 "' . $tmpFile . '"',
        $descriptorspec,
        $pipes
    );

    if (!is_resource($process)) {
        unlink($tmpFile);
        return [false, 'Failed to start Python'];
    }

    if (strlen($stdinData) > 0) {
        fwrite($pipes[0], $stdinData);
    }
    fclose($pipes[0]);

    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
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

    list($stdout, $stderr, $exitCode) = runPythonScript($script, $code);

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

// ─── Формируем скрипт для выполнения ───
$runnerScript = <<<'PYTHON'
import sys, json, pickle, io, traceback, builtins, os

# Force UTF-8 everywhere
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Читаем входные данные из stdin
input_data = json.loads(sys.stdin.read())

session_file = input_data['session_file']
code = input_data['code']
stdin_data = input_data['stdin_data']
max_output = input_data['max_output']

# Загружаем существующее состояние или создаём новое
namespace = {}
try:
    with open(session_file, 'rb') as f:
        namespace = pickle.load(f)
except (FileNotFoundError, pickle.UnpicklingError, EOFError):
    pass

# Подмена stdin
input_lines = stdin_data.split('\n') if stdin_data else []
input_iter = iter(input_lines)

_original_input = builtins.input
def custom_input(prompt=''):
    sys.__stdout__.write(prompt)
    sys.__stdout__.flush()
    try:
        return next(input_iter)
    except StopIteration:
        return ''
builtins.input = custom_input

# Подмена stdout/stderr
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

exit_code = 0
try:
    exec(code, namespace)
except SystemExit:
    pass
except Exception:
    traceback.print_exc(file=sys.stderr)
    exit_code = 1

builtins.input = _original_input

captured_out = sys.stdout.getvalue()
captured_err = sys.stderr.getvalue()
sys.stdout = old_stdout
sys.stderr = old_stderr

# Сохраняем состояние
try:
    with open(session_file, 'wb') as f:
        pickle.dump(namespace, f)
except Exception:
    pass

# Ограничение размера вывода
if len(captured_out) > max_output:
    captured_out = captured_out[:max_output] + '\n\n... [output truncated]'
if len(captured_err) > max_output:
    captured_err = captured_err[:max_output] + '\n\n... [output truncated]'

print(json.dumps({
    'ok': exit_code == 0,
    'stdout': captured_out,
    'stderr': captured_err,
    'exit_code': exit_code
}, ensure_ascii=False))
PYTHON;

// Сохраняем скрипт-исполнитель на диск
file_put_contents($PYTHON_RUNNER, $runnerScript);

$inputJson = json_encode([
    'session_file' => $SESSION_FILE,
    'code' => $code,
    'stdin_data' => $input,
    'max_output' => $MAX_OUTPUT_SIZE,
], JSON_UNESCAPED_UNICODE);

// Запускаем
list($stdout, $stderr, $exitCode) = runPythonScript($runnerScript, $inputJson);

if (!empty($stderr)) {
    // Если что-то пошло не так в самом runner
    $stderr = '⚠ Python error: ' . $stderr;
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