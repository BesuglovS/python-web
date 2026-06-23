import sys, json, pickle, io, traceback, builtins, os
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

input_data = json.loads(sys.stdin.read())

session_file = input_data['session_file']
code = input_data['code']
stdin_data = input_data['stdin_data']
max_output = input_data['max_output']

namespace = {}
try:
    with open(session_file, 'rb') as f:
        namespace = pickle.load(f)
except:
    pass

input_lines = stdin_data.split('\n') if stdin_data else []
input_iter = iter(input_lines)
_original_input = builtins.input

def custom_input(prompt=''):
    sys.stdout.write(prompt)
    sys.stdout.flush()
    try:
        return next(input_iter)
    except StopIteration:
        return ''

builtins.input = custom_input

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

try:
    with open(session_file, 'wb') as f:
        pickle.dump(namespace, f)
except:
    pass

print(json.dumps({
    'ok': exit_code == 0,
    'stdout': captured_out,
    'stderr': captured_err,
    'exit_code': exit_code
}, ensure_ascii=False))