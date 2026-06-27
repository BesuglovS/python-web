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
except Exception as e:
    tb = traceback.extract_tb(sys.exc_info()[2])
    user_frame = tb[-1] if tb else None
    line_no = user_frame.lineno if user_frame and user_frame.filename == '<string>' else '?'
    sys.stderr.write(f"Line {line_no}: {type(e).__name__}: {e}\n")
    exit_code = 1

builtins.input = _original_input

captured_out = sys.stdout.getvalue()
captured_err = sys.stderr.getvalue()
sys.stdout = old_stdout
sys.stderr = old_stderr

# Ограничение размера namespace: максимум 200 ключей
MAX_NAMESPACE_KEYS = 200
if len(namespace) > MAX_NAMESPACE_KEYS:
    # Удаляем лишние ключи (кроме '__builtins__'), оставляя последние 200
    keys_to_keep = set(list(namespace.keys())[-MAX_NAMESPACE_KEYS:])
    for k in list(namespace.keys()):
        if k not in keys_to_keep:
            del namespace[k]

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