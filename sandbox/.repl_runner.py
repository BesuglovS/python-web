"""Persistent REPL Runner — выполнение Python-кода
с сохранением namespace между вызовами.

Безопасность:
  - Использует JSON (не pickle) для хранения состояния.
    JSON не поддерживает выполнение кода при десериализации,
    что устраняет вектор RCE через подделку файла сессии.
    Ограничение: сохраняются только JSON-сериализуемые типы
    (числа, строки, списки, словари, bool, None).
    Функции, классы и другие объекты не переносятся между сессиями.
  - Запускается с флагами -I -S (изолированный режим) через
    root-хелпер scripts/sandbox-python.run (mount/net/pid namespace).
  - Лимит namespace: 200 ключей.
  - Лимит размера вывода настраивается извне.
  - Защита в глубину: перед exec() опасные имена удаляются из САМОГО
    объекта builtins (не только из namespace). У функций разрешённых
    модулей __globals__ ссылается на тот же словарь, поэтому цепочка
    print.__self__.getattr / json.loads.__globals__['__builtins__']
    больше не даёт доступ к exec/open/getattr.
"""

import builtins
import io
import json
import sys
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


# ─── Изоляция builtins (защита в глубину) ───
# Разрешённые для импорта модули — синхронизированы с
# $SANDBOX_ALLOWED_IMPORTS в sandbox_common.php и _sb_allowed_modules
# в run.php.
_ALLOWED_MODULES = frozenset({
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy',
})

# Внутренние модули stdlib, которые разрешённым модулям нужны в рантайме
# (ленивые импорты: collections → heapq, datetime → time и т.п.).
# Самостоятельный импорт этих модулей пользователем по-прежнему запрещён
# AST-валидатором (его список разрешённых импортов = _ALLOWED_MODULES).
_SAFE_HELPER_MODULES = _ALLOWED_MODULES | frozenset({
    'heapq', 'bisect', '_bisect', '_heapq', 'time', 'keyword', 'enum',
    'reprlib', 'types', 'copyreg', 'numbers', 'warnings',
    '_collections_abc', 'collections.abc',
    'sre_compile', 'sre_parse', 'sre_constants',
    '_strptime', '_decimal', '_pydecimal', '_fractions', '_statistics',
    '_json', '_random', '_datetime', '_string',
})

# Ссылки, нужные самому раннеру — сохраняем ДО мутации builtins.
_real_import = builtins.__import__
_open = builtins.open
_exec = builtins.exec
_type = builtins.type
_ORIGINAL_BUILTINS = dict(builtins.__dict__)

# 1) Предзагрузка разрешённых и helper-модулей, пока builtins полные.
for _m in _SAFE_HELPER_MODULES:
    try:
        _real_import(_m)
    except Exception:
        pass


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    """__import__, разрешающий только белый список безопасных модулей."""
    if level > 0:
        raise ImportError('Относительные импорты запрещены в песочнице')
    root = name.split('.')[0]
    if root not in _SAFE_HELPER_MODULES:
        raise ImportError('Модуль "%s" недоступен в песочнице' % root)
    return _real_import(name, globals, locals, fromlist, level)


# 2) Глобальная очистка реального builtins.__dict__. У функций разрешённых
# модулей __globals__['__builtins__'] указывает на этот же словарь, поэтому
# после очистки print.__self__.getattr и json.loads.__globals__ больше не
# дают exec/open/getattr.
# ВАЖНО: type/isinstance/issubclass/callable НЕ удаляются — они нужны
# разрешённым модулям в рантайме (re, copy, statistics, fractions, decimal).
# Их вызов пользователем блокируется AST-валидатором (DANGEROUS_CALLS).
# ВАЖНО: hasattr НЕ удаляется — его использует importlib при `from X import Y`.
# hasattr возвращает только bool и не позволяет извлечь объект, поэтому не
# открывает доступ к дундер-атрибутам (в отличие от getattr).
_STRIP = (
    'open', 'exec', 'eval', 'compile',
    'getattr', 'setattr', 'delattr',
    'globals', 'locals', 'vars', 'dir',
    'breakpoint', 'help', 'exit', 'quit', 'input', 'memoryview',
    '__import__',
)
for _name in _STRIP:
    builtins.__dict__.pop(_name, None)
builtins.__dict__['__import__'] = _safe_import
builtins.__dict__['input'] = custom_input

# Явно подставляем очищенный словарь: exec() возьмёт его как __builtins__.
namespace['__builtins__'] = builtins.__dict__
namespace['__name__'] = '__main__'

# ─── Подмена stdout/stderr ───
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

# ─── Выполнение кода ───
exit_code: int = 0
try:
    try:
        _exec(code, namespace)  # noqa: S102
    except SystemExit:
        pass
    except Exception:
        # Ошибку форматируем вручную: модуль traceback и getattr недоступны
        # после очистки builtins.
        _tb = sys.exc_info()[2]
        line_no: Any = '?'
        while _tb is not None:
            try:
                if _tb.tb_frame.f_code.co_filename == '<string>':
                    line_no = _tb.tb_lineno
            except Exception:
                pass
            _tb = _tb.tb_next
        _exc = sys.exc_info()[1]
        sys.stderr.write(f"Line {line_no}: {_type(_exc).__name__}: {_exc}\n")
        exit_code = 1

    captured_out: str = sys.stdout.getvalue()
    captured_err: str = sys.stderr.getvalue()
finally:
    sys.stdout = old_stdout
    sys.stderr = old_stderr
    # Восстанавливаем builtins. В проде процесс одноразовый (не влияет),
    # в in-process тестах это делает раннер re-entrant.
    builtins.__dict__.clear()
    builtins.__dict__.update(_ORIGINAL_BUILTINS)

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
    with _open(session_file, 'w', encoding='utf-8') as f:
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
