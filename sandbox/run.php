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

$wrapper = sandbox_build_wrapper_code($sentinel);
$script = $wrapper['pre'] . "\n" . $code . "\n" . $wrapper['post'];

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
    $capturedStderr = $rawStderr . ($capturedStderr ? "\n" . $capturedStderr : '');
}

echo json_encode([
    'ok'        => !$timedOut && $exitCode === 0,
    'stdout'    => $capturedStdout,
    'stderr'    => $capturedStderr,
    'exit_code' => $exitCode,
], SANDBOX_JSON_OPT);

/**
 * Обёртка перехватывает stdout/stderr пользователя и помечает их
 * уникальными sentinel-маркерами, чтобы разделить вывод после выполнения.
 */
function sandbox_build_wrapper_code(string $sentinel): array
{
    $preCode = <<<'PYTHON'
import sys
import io

_original_stdout = sys.stdout
sys.stdout = io.StringIO()

_original_stderr = sys.stderr
sys.stderr = io.StringIO()

PYTHON;

    $stdoutBegin = '_SANDBOX_STDOUT_' . $sentinel . '_BEGIN_';
    $stdoutEnd   = '_SANDBOX_STDOUT_' . $sentinel . '_END_';
    $stderrBegin = '_SANDBOX_STDERR_' . $sentinel . '_BEGIN_';
    $stderrEnd   = '_SANDBOX_STDERR_' . $sentinel . '_END_';

    $postCode = <<<PYTHON

_output_stdout = sys.stdout.getvalue()
_output_stderr = sys.stderr.getvalue()
sys.stdout = _original_stdout
sys.stderr = _original_stderr
print("{$stdoutBegin}", end="")
print(_output_stdout, end="")
print("{$stdoutEnd}", end="")
print("{$stderrBegin}", end="")
print(_output_stderr, end="")
print("{$stderrEnd}", end="")
PYTHON;

    return ['pre' => $preCode, 'post' => $postCode];
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
