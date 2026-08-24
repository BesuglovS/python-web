"""Persistent REPL Runner — выполнение Python-кода
с сохранением namespace между вызовами.

Безопасность:
  - Использует JSON (не pickle) для хранения состояния.
    JSON не поддерживает выполнение кода при десериализации,
    что устраняет вектор RCE через подделку файла сессии.
    Ограничение: сохраняются только JSON-сериализуемые типы
    (числа, строки, списки, словари, bool, None).
    Функции, классы и другие объекты не переносятся между сессиями.
  - Запускается с флагами -I -S (изолированный режим).
  - Лимит namespace: 200 ключей.
  - Лимит размера вывода настраивается извне.
"""

import builtins
import io
import json
import sys
import traceback
from typing import Any

# Force UTF-8 everywhere (even if -X utf8 is not set)
try:
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception as e:
    sys.__stderr__.write(f"Warning: UTF-8 reconfigure failed: {e}\n")

# Читаем входные данные из stdin
input_data: dict[str, Any] = json.loads(sys.stdin.read())

session_file: str = input_data['session_file']
code: str = input_data['code']
stdin_data: str = input_data['stdin_data']
max_output: int = input_data['max_output']

# ─── Загружаем состояние из JSON ───
namespace: dict[str, Any] = {}
try:
    with open(session_file, 'r', encoding='utf-8') as f:
        loaded: Any = json.load(f)
        if isinstance(loaded, dict):
            # Ограничиваем количество ключей при загрузке
            MAX_LOAD_KEYS = 200
            if len(loaded) > MAX_LOAD_KEYS:
                loaded = dict(list(loaded.items())[-MAX_LOAD_KEYS:])
            namespace.update(loaded)
except (FileNotFoundError, json.JSONDecodeError, ValueError):
    pass

# ─── Подмена stdin ───
input_lines: list[str] = stdin_data.split('\n') if stdin_data else []
input_iter = iter(input_lines)

_original_input = builtins.input


def custom_input(prompt: str = '') -> str:
    """Подмена builtins.input для перенаправления данных из stdin."""
    # Пишем в текущий sys.stdout: во время exec() это захваченный StringIO,
    # поэтому промпт попадает в вывод сессии, а не в JSON-конверт протокола.
    sys.stdout.write(prompt)
    sys.stdout.flush()
    try:
        return next(input_iter)
    except StopIteration:
        return ''


# ─── Усечённые builtins (защита в глубину) ───
# AST-валидатор — основной рубеж; здесь мы дополнительно лишаем код
# доступа к опасным встроенным функциям на случай обхода статики.
# Список исключений синхронизирован с DANGEROUS_CALLS/BLOCKED_NAMES
# в ast_validator.py.
_RUNTIME_BLOCKED_BUILTINS = frozenset({
    'open', 'exec', 'eval', 'compile',
    'getattr', 'setattr', 'delattr', 'hasattr',
    'globals', 'locals', 'vars', 'dir',
    'type', 'isinstance', 'issubclass', 'callable',
    'help', 'memoryview', 'exit', 'quit',
})

# Разрешённые для импорта модули — синхронизированы с
# $SANDBOX_ALLOWED_IMPORTS в sandbox_common.php.
_RUNTIME_ALLOWED_MODULES = frozenset({
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
})

_real_import = builtins.__import__


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    """__import__, разрешающий только белый список безопасных модулей."""
    if level > 0:
        raise ImportError('Относительные импорты запрещены в песочнице')
    root = name.split('.')[0]
    if root not in _RUNTIME_ALLOWED_MODULES:
        raise ImportError(f'Модуль "{root}" недоступен в песочнице')
    return _real_import(name, globals, locals, fromlist, level)


SAFE_BUILTINS: dict[str, Any] = {
    name: getattr(builtins, name)
    for name in dir(builtins)
    if not name.startswith('_') and name not in _RUNTIME_BLOCKED_BUILTINS
}
# Служебные имена с подчёркиваниями, необходимые легитимному коду:
# __build_class__ — работа оператора class, __debug__ — оператор assert,
# __import__ — ограниченная версия для разрешённых импортов.
SAFE_BUILTINS['__build_class__'] = builtins.__build_class__
SAFE_BUILTINS['__debug__'] = True
SAFE_BUILTINS['__import__'] = _safe_import
SAFE_BUILTINS['input'] = custom_input

# ─── Подмена stdout/stderr ───
old_stdout = sys.stdout
old_stderr = sys.stderr
# Явно подставляем усечённые builtins: без этого exec() автоматически
# подставляет ПОЛНЫЙ словарь builtins в namespace.
namespace['__builtins__'] = SAFE_BUILTINS
# __build_class__ (оператор class) читает __name__ из globals сессии.
namespace['__name__'] = '__main__'

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

# ─── Выполнение кода ───
exit_code: int = 0
try:
    exec(code, namespace)  # noqa: S102
except SystemExit:
    pass
except Exception:
    tb = traceback.extract_tb(sys.exc_info()[2])
    user_frame = tb[-1] if tb else None
    line_no = user_frame.lineno if user_frame and user_frame.filename == '<string>' else '?'
    sys.stderr.write(f"Line {line_no}: {type(sys.exc_info()[1]).__name__}: {sys.exc_info()[1]}\n")
    exit_code = 1

builtins.input = _original_input

captured_out: str = sys.stdout.getvalue()
captured_err: str = sys.stderr.getvalue()
sys.stdout = old_stdout
sys.stderr = old_stderr

# ─── Сериализация namespace → JSON ───
# Сохраняем только JSON-сериализуемые значения.
# Несериализуемые (функции, классы, модули, объекты) пропускаются.

JSON_SAFE_TYPES = (str, int, float, bool, list, dict, tuple, type(None))


def sanitize_for_json(obj: Any) -> Any:
    """Рекурсивно очищает значение, оставляя только JSON-совместимые типы."""
    if isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, dict):
        result: dict[str, Any] = {}
        for k, v in obj.items():
            if isinstance(k, (str, int, float, bool)):
                result[str(k)] = sanitize_for_json(v)
        return result
    elif isinstance(obj, (set, frozenset)):
        return [sanitize_for_json(item) for item in obj]
    else:
        # Функции, классы, модули и прочие не-JSON типы — пропускаем
        return None


sanitized_namespace: dict[str, Any] = {}
for key, value in namespace.items():
    # Пропускаем приватные и системные ключи
    if key.startswith('__') and key.endswith('__'):
        continue
    if isinstance(key, str) and not key.startswith('_'):
        sanitized = sanitize_for_json(value)
        if sanitized is not None:
            sanitized_namespace[key] = sanitized

# Ограничение размера namespace: максимум 200 ключей
MAX_NAMESPACE_KEYS = 200
if len(sanitized_namespace) > MAX_NAMESPACE_KEYS:
    # Оставляем последние 200 ключей
    keys_to_keep = list(sanitized_namespace.keys())[-MAX_NAMESPACE_KEYS:]
    sanitized_namespace = {k: sanitized_namespace[k] for k in keys_to_keep}

# Сохраняем состояние в JSON
try:
    with open(session_file, 'w', encoding='utf-8') as f:
        json.dump(sanitized_namespace, f, ensure_ascii=False, separators=(',', ':'))
except OSError as e:
    sys.__stderr__.write(f"Warning: failed to save session to {session_file}: {e}\n")

# ─── Ограничение размера вывода ───
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