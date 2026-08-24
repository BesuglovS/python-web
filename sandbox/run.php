<?php
/**
 * Python Sandbox — безопасное выполнение Python-кода
 *
 * POST /sandbox/run.php
 *   code     — строка с кодом на Python
 *   timeout  — опциональный таймаут (сек), по умолчанию 5
 *   input    — опциональный stdin ввод
 *
 * Возвращает JSON:
 *   { "ok": true/false, "stdout": "...", "stderr": "...", "exit_code": N }
 */

require_once __DIR__ . '/sandbox_common.php';

sandbox_check_rate_limit();
sandbox_require_json_content_type();
$data = sandbox_read_input();

$code = $data['code'];
$input = $data['input'] ?? '';
$timeout = isset($data['timeout']) ? max(1, min(10, (int)$data['timeout'])) : SANDBOX_DEFAULT_TIMEOUT;

// ─── AST-валидация ───
list($astOk, $astError) = sandbox_validate_ast($code, $SANDBOX_ALLOWED_IMPORTS);
if (!$astOk) {
    sandbox_reject_ast($astError);
}

// ─── Уникальный sentinel для этого запроса (неугадываемый) ───
$sentinel = bin2hex(random_bytes(16));

$wrapper = sandbox_build_wrapper_code($code, $sentinel);
$script = $wrapper;

// ─── Выполнение через общий исполнитель ───
// sandbox_run_python() сам завершает дочерний процесс по таймауту
// (proc_terminate) и накладывает реальный лимит памяти (setrlimit).
list($rawStdout, $rawStderr, $exitCode) = sandbox_run_python($script, $input, $timeout, SANDBOX_MEMORY_LIMIT_MB);

$timedOut = ($exitCode === 124);

$parsed = sandbox_parse_sentinels($rawStdout, $sentinel);
$capturedStdout = sandbox_truncate_output($parsed['stdout']);
$capturedStderr = $parsed['stderr'];

if ($timedOut) {
    $capturedStderr = '⏱ Превышено время выполнения (' . $timeout . ' сек).'
        . ($capturedStderr ? "\n" . $capturedStderr : '');
} elseif ($rawStderr !== '') {
    // Сырой stderr процесса (не должен появляться при нормальной работе
    // обёртки): обрезаем и убираем абсолютные пути временных файлов.
    $rawStderr = sandbox_sanitize_stderr($rawStderr);
    $capturedStderr = $rawStderr . ($capturedStderr ? "\n" . $capturedStderr : '');
}

$capturedStderr = sandbox_truncate_output($capturedStderr);

echo json_encode([
    'ok'        => !$timedOut && $exitCode === 0,
    'stdout'    => $capturedStdout,
    'stderr'    => $capturedStderr,
    'exit_code' => $exitCode,
], SANDBOX_JSON_OPT);

/**
 * Формирует полный скрипт для выполнения.
 *
 * Код пользователя встраивается как base64-литерал и исполняется через
 * exec(compile(...)) в отдельном namespace с УСЕЧЁННЫМИ builtins
 * (защита в глубину на случай обхода AST-валидации).
 * Блок try/finally гарантирует, что накопленный stdout/stderr будет
 * выведен с sentinel-маркерами даже при исключении в коде пользователя
 * (иначе вывод теряется, а traceback утекает в ответ с путями /tmp).
 *
 * @param string $userCode код пользователя (уже прошедший AST-валидацию)
 * @param string $sentinel уникальный маркер запроса
 * @return string          готовый Python-скрипт
 */
function sandbox_build_wrapper_code(string $userCode, string $sentinel): string
{
    $encoded = base64_encode($userCode);

    $stdoutBegin = '_SANDBOX_STDOUT_' . $sentinel . '_BEGIN_';
    $stdoutEnd   = '_SANDBOX_STDOUT_' . $sentinel . '_END_';
    $stderrBegin = '_SANDBOX_STDERR_' . $sentinel . '_BEGIN_';
    $stderrEnd   = '_SANDBOX_STDERR_' . $sentinel . '_END_';

    $template = <<<'PYTHON'
import sys
import io
import builtins as _sb_builtins
import base64 as _sb_base64

_original_stdout = sys.stdout
sys.stdout = io.StringIO()

_original_stderr = sys.stderr
sys.stderr = io.StringIO()

_sb_blocked = frozenset({
    'open', 'exec', 'eval', 'compile',
    'getattr', 'setattr', 'delattr', 'hasattr',
    'globals', 'locals', 'vars', 'dir',
    'type', 'isinstance', 'issubclass', 'callable',
    'help', 'memoryview', 'exit', 'quit',
})
_sb_allowed_modules = frozenset({
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
})
_sb_real_import = _sb_builtins.__import__

def _sb_safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level > 0:
        raise ImportError('Относительные импорты запрещены в песочнице')
    root = name.split('.')[0]
    if root not in _sb_allowed_modules:
        raise ImportError('Модуль "%s" недоступен в песочнице' % root)
    return _sb_real_import(name, globals, locals, fromlist, level)

_sb_safe_builtins = {
    _n: getattr(_sb_builtins, _n)
    for _n in dir(_sb_builtins)
    if not _n.startswith('_') and _n not in _sb_blocked
}
# Служебные имена для class/assert/import (см. .repl_runner.py — держать синхронно)
_sb_safe_builtins['__build_class__'] = _sb_builtins.__build_class__
_sb_safe_builtins['__debug__'] = True
_sb_safe_builtins['__import__'] = _sb_safe_import
_sb_globals = {'__name__': '__main__', '__builtins__': _sb_safe_builtins}

try:
    exec(compile(_sb_base64.b64decode('%CODE%').decode('utf-8'), '<lesson>', 'exec'), _sb_globals)
except SystemExit:
    raise
except BaseException as _sb_exc:
    sys.stderr.write(type(_sb_exc).__name__ + ': ' + str(_sb_exc) + '\n')
    sys.exit(1)
finally:
    _output_stdout = sys.stdout.getvalue()
    _output_stderr = sys.stderr.getvalue()
    sys.stdout = _original_stdout
    sys.stderr = _original_stderr
    print("%STDOUT_BEGIN%", end="")
    print(_output_stdout, end="")
    print("%STDOUT_END%", end="")
    print("%STDERR_BEGIN%", end="")
    print(_output_stderr, end="")
    print("%STDERR_END%", end="")
PYTHON;

    return str_replace(
        ['%CODE%', '%STDOUT_BEGIN%', '%STDOUT_END%', '%STDERR_BEGIN%', '%STDERR_END%'],
        [$encoded, $stdoutBegin, $stdoutEnd, $stderrBegin, $stderrEnd],
        $template
    );
}

/**
 * Убирает из сырого stderr абсолютные пути временных файлов и системных
 * каталогов, чтобы не раскрывать структуру файловой системы сервера.
 */
function sandbox_sanitize_stderr(string $stderr): string
{
    $stderr = preg_replace('/\/tmp\/[A-Za-z0-9._-]+/', '[file]', $stderr);
    $stderr = str_replace(sys_get_temp_dir(), '[temp]', (string)$stderr);
    return $stderr;
}

/**
 * Извлекает stdout/stderr из вывода по sentinel-маркерам.
 */
function sandbox_parse_sentinels(string $rawStdout, string $sentinel): array
{
    $stdoutBegin = '_SANDBOX_STDOUT_' . $sentinel . '_BEGIN_';
    $stdoutEnd   = '_SANDBOX_STDOUT_' . $sentinel . '_END_';
    $stderrBegin = '_SANDBOX_STDERR_' . $sentinel . '_BEGIN_';
    $stderrEnd   = '_SANDBOX_STDERR_' . $sentinel . '_END_';

    $pos1 = strpos($rawStdout, $stdoutBegin);
    $pos2 = strpos($rawStdout, $stdoutEnd);
    $pos3 = strpos($rawStdout, $stderrBegin);
    $pos4 = strpos($rawStdout, $stderrEnd);

    if ($pos1 !== false && $pos2 !== false && $pos1 < $pos2) {
        $stdout = substr($rawStdout, $pos1 + strlen($stdoutBegin), $pos2 - $pos1 - strlen($stdoutBegin));
    } else {
        $stdout = $rawStdout;
    }

    if ($pos3 !== false && $pos4 !== false && $pos3 < $pos4) {
        $stderr = substr($rawStdout, $pos3 + strlen($stderrBegin), $pos4 - $pos3 - strlen($stderrBegin));
    } else {
        $stderr = '';
    }

    return ['stdout' => $stdout, 'stderr' => $stderr];
}

/**
 * Ограничение размера вывода.
 */
function sandbox_truncate_output($output)
{
    if (strlen($output) > SANDBOX_MAX_OUTPUT_SIZE) {
        return substr($output, 0, SANDBOX_MAX_OUTPUT_SIZE) . "\n\n... [вывод обрезан, слишком большой]";
    }
    return $output;
}
