<?php
$sentinel = bin2hex(random_bytes(16));

// Simulate the wrapper build
$stdoutBegin = '_SANDBOX_STDOUT_' . $sentinel . '_BEGIN_';
$stdoutEnd   = '_SANDBOX_STDOUT_' . $sentinel . '_END_';

$postCode = <<<PYTHON
print("{$stdoutBegin}", end="")
print("hello", end="")
print("{$stdoutEnd}", end="")
PYTHON;

echo "Sentinel begin: $stdoutBegin\n";
echo "Sentinel end: $stdoutEnd\n";
echo "PostCode:\n---\n$postCode\n---\n";

// Check if heredoc interpolated
if (strpos($postCode, $stdoutBegin) !== false) {
    echo "OK: Heredoc interpolation works\n";
} else {
    echo "FAIL: Heredoc interpolation does NOT work - literal {\$stdoutBegin} found\n";
    echo "Contains literal: " . (strpos($postCode, '{$stdoutBegin}') !== false ? 'YES' : 'NO') . "\n";
}
