<?php
// Test stream_select behavior on Windows pipes

$code = "import sys; sys.stdout.write('Привет, IDLE!\\n'); sys.stdout.write('Python работает!\\n'); sys.stdout.flush()";

$tmpFile = tempnam(sys_get_temp_dir(), 'py_test_');
file_put_contents($tmpFile, $code);

$cmd = 'python -I -S -X utf8 "' . $tmpFile . '"';
echo "Command: $cmd\n";

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

$stdout = '';
$stderr = '';

stream_set_timeout($pipes[1], 5);
stream_set_timeout($pipes[2], 5);

// Simulate the exact logic from sandbox_run_python
while (!feof($pipes[1]) || !feof($pipes[2])) {
    $read = [$pipes[1], $pipes[2]];
    $write = null;
    $except = null;
    $sel = @stream_select($read, $write, $except, 1, 0);

    echo "stream_select returned: " . var_export($sel, true) . "\n";

    if ($sel === false) {
        echo "stream_select failed - breaking\n";
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

echo "After loop - reading remaining:\n";
$stdout2 = stream_get_contents($pipes[1]);
$stderr2 = stream_get_contents($pipes[2]);
echo "stream_get_contents stdout: " . var_export($stdout2, true) . "\n";
echo "First stdout from loop: " . var_export($stdout, true) . "\n";

fclose($pipes[1]);
fclose($pipes[2]);

$exitCode = proc_close($process);
echo "Exit code: $exitCode\n";
echo "Total stdout: " . var_export($stdout . $stdout2, true) . "\n";

@unlink($tmpFile);
