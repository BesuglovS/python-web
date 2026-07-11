<?php
// Minimal reproduction of the run.php flow
$code = "print('Hello, IDLE!')\nprint('Python works!')";

$sentinel = bin2hex(random_bytes(16));

// Build wrapper (exactly like run.php)
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

$script = $preCode . "\n" . $code . "\n" . $postCode;

// Write to temp file
$tmpFile = tempnam(sys_get_temp_dir(), 'py_test_');
file_put_contents($tmpFile, $script);

// Run
$cmd = 'python -I -S -X utf8 "' . $tmpFile . '"';
echo "Command: $cmd\n";
echo "---FILE---\n$script\n---END FILE---\n\n";

$descriptorspec = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open($cmd, $descriptorspec, $pipes, null, null, ['bypass_shell' => true]);

if (!is_resource($process)) {
    echo "ERROR: Failed to start process\n";
    @unlink($tmpFile);
    exit(1);
}

fclose($pipes[0]);

$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);

$exitCode = proc_close($process);

echo "Exit code: $exitCode\n";
echo "Raw stdout:\n---\n" . bin2hex($stdout) . "\n---\n";
echo "Raw stdout (text):\n---\n$stdout\n---\n";
echo "Raw stderr:\n---\n$stderr\n---\n";

// Parse sentinels
$pos1 = strpos($stdout, $stdoutBegin);
$pos2 = strpos($stdout, $stdoutEnd);
echo "stdoutBegin pos: " . var_export($pos1, true) . "\n";
echo "stdoutEnd pos: " . var_export($pos2, true) . "\n";

if ($pos1 !== false && $pos2 !== false) {
    $captured = substr($stdout, $pos1 + strlen($stdoutBegin), $pos2 - $pos1 - strlen($stdoutBegin));
    echo "Captured stdout: '$captured'\n";
} else {
    echo "FAIL: Sentinels not found!\n";
}

@unlink($tmpFile);
