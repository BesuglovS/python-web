"""Тесты песочницы REPL (sandbox/.repl_runner.py).

Файл исполняемый (читает stdin на уровне модуля), поэтому для покрытия
он импортируется с подменёнными sys.stdin/sys.stdout: модульный код
полностью выполняется под measurement coverage.
"""

import contextlib
import importlib.util
import io
import json
import os
import sys
from pathlib import Path

import pytest

RUNNER_PATH = Path(__file__).resolve().parent.parent / 'sandbox' / '.repl_runner.py'

_module_seq = 0


def run_runner(code: str, stdin_data: str = '', session: dict | None = None,
               max_output: int = 100_000, tmp_path: Path | None = None):
    """Выполняет .repl_runner.py как модуль с подменённым stdin/stdout.

    Возвращает (result_dict, session_file_path).
    """
    global _module_seq
    _module_seq += 1

    session_file = str(Path(tmp_path) / f'session-{_module_seq}.json')
    if session is not None:
        Path(session_file).write_text(json.dumps(session), encoding='utf-8')

    payload = json.dumps({
        'session_file': session_file,
        'code': code,
        'stdin_data': stdin_data,
        'max_output': max_output,
    })

    real_stdin, real_stdout, real_dunder_stderr = sys.stdin, sys.stdout, sys.__stderr__
    captured_out = io.StringIO()
    captured_err = io.StringIO()
    sys.stdin = io.StringIO(payload)
    sys.__stderr__ = captured_err
    try:
        with contextlib.redirect_stdout(captured_out):
            spec = importlib.util.spec_from_file_location(
                f'_repl_runner_under_test_{_module_seq}', str(RUNNER_PATH),
            )
            assert spec is not None and spec.loader is not None
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            try:
                spec.loader.exec_module(module)
            finally:
                sys.modules.pop(spec.name, None)
    finally:
        sys.stdin = real_stdin
        sys.stdout = real_stdout
        sys.__stderr__ = real_dunder_stderr

    return json.loads(captured_out.getvalue()), session_file


class TestBasicExecution:
    """Базовое выполнение кода."""

    def test_print_output(self, tmp_path):
        result, _ = run_runner('print(2 + 2)', tmp_path=tmp_path)
        assert result['ok'] is True
        assert result['exit_code'] == 0
        assert '4' in result['stdout']

    def test_runtime_error_reported(self, tmp_path):
        result, _ = run_runner('x = 1 / 0', tmp_path=tmp_path)
        assert result['ok'] is False
        assert result['exit_code'] == 1
        assert 'ZeroDivisionError' in result['stderr']

    def test_error_keeps_prior_stdout(self, tmp_path):
        result, _ = run_runner("print('до ошибки')\nx = 1/0", tmp_path=tmp_path)
        assert result['ok'] is False
        assert 'до ошибки' in result['stdout']
        assert 'ZeroDivisionError' in result['stderr']


class TestStdinInput:
    """Подмена builtins.input данными из stdin."""

    def test_input_consumed(self, tmp_path):
        result, _ = run_runner(
            "name = input()\nprint('Привет,', name)",
            stdin_data='Аня\n',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True
        assert 'Привет, Аня' in result['stdout']

    def test_input_without_data_returns_empty(self, tmp_path):
        result, _ = run_runner("v = input()\nprint(len(v))", tmp_path=tmp_path)
        assert result['ok'] is True
        assert '0' in result['stdout']

    def test_prompt_goes_into_captured_output(self, tmp_path):
        result, _ = run_runner(
            "age = input('Возраст: ')\nprint(age)",
            stdin_data='17\n',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True
        assert 'Возраст:' in result['stdout']
        assert '17' in result['stdout']


class TestRuntimeBuiltinsRestriction:
    """Усечённые builtins — защита в глубину после AST-валидатора."""

    @pytest.mark.parametrize('snippet', [
        'print(eval)',
        'f = exec',
        'open',
        'compile',
        'globals',
    ])
    def test_dangerous_names_unavailable(self, snippet, tmp_path):
        result, _ = run_runner(snippet, tmp_path=tmp_path)
        assert result['ok'] is False
        assert 'NameError' in result['stderr']

    def test_direct_dunder_import_call_restricted(self, tmp_path):
        # __import__ доступен, но только для белого списка модулей
        result, _ = run_runner("print(__import__('os'))", tmp_path=tmp_path)
        assert result['ok'] is False
        assert 'ImportError' in result['stderr']
        ok_result, _ = run_runner(
            "print(__import__('json').dumps([1, 2]))",
            tmp_path=tmp_path,
        )
        assert ok_result['ok'] is True
        assert '[1, 2]' in ok_result['stdout']

    def test_safe_builtins_still_work(self, tmp_path):
        result, _ = run_runner(
            'print(len([1, 2, 3]), sum(range(5)), sorted("баг"))',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True
        assert '3 10' in result['stdout']

    def test_exceptions_available(self, tmp_path):
        result, _ = run_runner(
            'try:\n'
            '    int("abc")\n'
            'except ValueError as e:\n'
            '    print("перехвачено")',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True
        assert 'перехвачено' in result['stdout']

    def test_class_definition_works(self, tmp_path):
        # __build_class__ должен быть доступен: уроки ООП (41-42)
        result, _ = run_runner(
            'class Dog:\n'
            '    def speak(self):\n'
            '        return "Гав"\n'
            'print(Dog().speak())',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True, result['stderr']
        assert 'Гав' in result['stdout']

    def test_assert_statement_works(self, tmp_path):
        # assert ссылается на __debug__ из builtins
        result, _ = run_runner('assert 1 + 1 == 2\nprint("ok")', tmp_path=tmp_path)
        assert result['ok'] is True, result['stderr']

    def test_allowed_import_works(self, tmp_path):
        result, _ = run_runner(
            'import math\n'
            'from random import randint\n'
            'print(math.sqrt(4))',
            tmp_path=tmp_path,
        )
        assert result['ok'] is True, result['stderr']
        assert '2.0' in result['stdout']

    @pytest.mark.parametrize('snippet', [
        'import os',
        'import sys',
        'from subprocess import run',
        'import math.os',
    ])
    def test_forbidden_import_blocked_at_runtime(self, snippet, tmp_path):
        result, _ = run_runner(snippet, tmp_path=tmp_path)
        assert result['ok'] is False
        assert 'ImportError' in result['stderr'] or 'ModuleNotFoundError' in result['stderr']


class TestSessionPersistence:
    """Состояние между вызовами через JSON-файл сессии."""

    def test_variable_survives_across_runs(self, tmp_path):
        _, session_file = run_runner('counter = 41', tmp_path=tmp_path)
        second, _ = run_runner(
            'counter += 1\nprint(counter)',
            session=json.loads(Path(session_file).read_text(encoding='utf-8')),
            tmp_path=tmp_path,
        )
        assert second['ok'] is True
        assert '42' in second['stdout']

    def test_non_json_values_not_persisted(self, tmp_path):
        _, session_file = run_runner(
            'def fn(): pass\n'
            'class Cls: pass\n'
            'value = 7',
            tmp_path=tmp_path,
        )
        saved = json.loads(Path(session_file).read_text(encoding='utf-8'))
        assert saved == {'value': 7}

    def test_private_and_dunder_keys_skipped(self, tmp_path):
        _, session_file = run_runner(
            '_hidden = 1\n'
            '__magic__ = 2\n'
            'visible = 3',
            tmp_path=tmp_path,
        )
        saved = json.loads(Path(session_file).read_text(encoding='utf-8'))
        assert list(saved.keys()) == ['visible']

    def test_missing_session_file_starts_empty(self, tmp_path):
        result, _ = run_runner("try:\n    old\nexcept NameError:\n    print('чисто')",
                               tmp_path=tmp_path)
        assert result['ok'] is True
        assert 'чисто' in result['stdout']


class TestOutputLimits:
    """Ограничение размера вывода."""

    def test_stdout_truncated(self, tmp_path):
        result, _ = run_runner(
            "print('x' * 5000)",
            max_output=100,
            tmp_path=tmp_path,
        )
        assert '[output truncated]' in result['stdout']
        assert len(result['stdout']) < 300


class TestProtocolEdgeCases:
    '''Граничные случаи протокола.'''

    def test_systemexit_is_silent(self, tmp_path):
        result, _ = run_runner('raise SystemExit', tmp_path=tmp_path)
        # SystemExit перехватывается: это не ошибка выполнения для ученика
        assert result['exit_code'] == 0

    def test_unicode_roundtrip(self, tmp_path):
        result, _ = run_runner("s = 'жёлтый ёж'\nprint(s)", tmp_path=tmp_path)
        assert result['ok'] is True
        assert 'жёлтый ёж' in result['stdout']
