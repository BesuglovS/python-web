"""Unit tests for sandbox/ast_validator.py."""

import json
import subprocess
import sys
import os
import unittest

AST_VALIDATOR = os.path.join(os.path.dirname(__file__), '..', 'sandbox', 'ast_validator.py')


def run_validator(code: str, allowed_imports: list[str] | None = None) -> dict:
    """Запускает AST-валидатор и возвращает результат."""
    args = [sys.executable, '-I', '-S', AST_VALIDATOR]
    if allowed_imports is not None:
        args.append(json.dumps(allowed_imports))
    result = subprocess.run(
        args,
        input=code,
        capture_output=True,
        text=True,
        timeout=5,
    )
    return json.loads(result.stdout.strip())


class TestSyntaxErrors(unittest.TestCase):
    """Проверка обработки синтаксических ошибок."""

    def test_syntax_error(self):
        result = run_validator('def foo(:')
        self.assertFalse(result['ok'])
        self.assertIn('SyntaxError', result['error'])

    def test_valid_code(self):
        result = run_validator('x = 1 + 2\nprint(x)')
        self.assertTrue(result['ok'])


class TestDangerousCalls(unittest.TestCase):
    """Проверка блокировки опасных вызовов."""

    def test_exec_blocked(self):
        result = run_validator('exec("print(1)")')
        self.assertFalse(result['ok'])
        self.assertIn('exec()', result['error'])

    def test_eval_blocked(self):
        result = run_validator('eval("1+1")')
        self.assertFalse(result['ok'])
        self.assertIn('eval()', result['error'])

    def test_open_blocked(self):
        result = run_validator('open("file.txt")')
        self.assertFalse(result['ok'])
        self.assertIn('open()', result['error'])

    def test_compile_blocked(self):
        result = run_validator('compile("1+1", "<>", "eval")')
        self.assertFalse(result['ok'])
        self.assertIn('compile()', result['error'])

    def test_import_blocked(self):
        result = run_validator('__import__("os")')
        self.assertFalse(result['ok'])
        self.assertIn('__import__()', result['error'])

    def test_getattr_blocked(self):
        result = run_validator('getattr(obj, "attr")')
        self.assertFalse(result['ok'])
        self.assertIn('getattr()', result['error'])

    def test_globals_blocked(self):
        result = run_validator('globals()')
        self.assertFalse(result['ok'])
        self.assertIn('globals()', result['error'])


class TestForbiddenImports(unittest.TestCase):
    """Проверка блокировки запрещённых импортов."""

    def test_import_os_blocked(self):
        result = run_validator('import os', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden import: os', result['error'])

    def test_import_sys_blocked(self):
        result = run_validator('import sys', allowed_imports=['math'])
        self.assertFalse(result['ok'])

    def test_import_from_os_blocked(self):
        result = run_validator('from os import path', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden import from: os', result['error'])

    def test_allowed_import_math(self):
        result = run_validator('import math\nprint(math.pi)', allowed_imports=['math', 'json'])
        self.assertTrue(result['ok'])

    def test_allowed_import_json(self):
        result = run_validator('import json\nprint(json.dumps({}))', allowed_imports=['json'])
        self.assertTrue(result['ok'])

    def test_allowed_from_import(self):
        result = run_validator('from math import sqrt', allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_empty_allowed_imports(self):
        result = run_validator('import math', allowed_imports=[])
        self.assertFalse(result['ok'])


class TestForbiddenModules(unittest.TestCase):
    """Проверка блокировки доступа к атрибутам os/sys/subprocess."""

    def test_os_path_join(self):
        # Now blocked by FORBIDDEN_MODULE_ATTRS
        result = run_validator('import os\nos.path.join("a", "b")', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: os.path', result['error'])

    def test_os_path_exists(self):
        result = run_validator('import os\nos.path.exists("file.txt")', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: os.path', result['error'])

    def test_os_environ(self):
        result = run_validator('import os\nos.environ', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: os.environ', result['error'])

    def test_os_system(self):
        result = run_validator('import os\nos.system("ls")', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: os.system', result['error'])

    def test_sys_path(self):
        result = run_validator('import sys\nsys.path', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: sys.path', result['error'])

    def test_sys_exit(self):
        result = run_validator('import sys\nsys.exit(0)', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: sys.exit', result['error'])

    def test_subprocess_run(self):
        result = run_validator('import subprocess\nsubprocess.run(["ls"])', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: subprocess.run', result['error'])

    def test_subprocess_popen(self):
        result = run_validator('import subprocess\nsubprocess.Popen(["ls"])', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden module attribute access: subprocess.Popen', result['error'])


class TestSafeCode(unittest.TestCase):
    """Проверка прохождения безопасного кода."""

    def test_basic_operations(self):
        code = 'x = 1\ny = 2\nz = x + y\nprint(z)'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_list_comprehension(self):
        code = 'squares = [x**2 for x in range(10)]\nprint(squares)'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_function_def(self):
        code = 'def add(a, b):\n    return a + b\nprint(add(1, 2))'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_class_def(self):
        code = 'class Foo:\n    def bar(self):\n        return 42'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_try_except(self):
        code = 'try:\n    x = 1\nexcept ValueError:\n    x = 0'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_for_loop(self):
        code = 'for i in range(5):\n    print(i)'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_while_loop(self):
        code = 'x = 0\nwhile x < 5:\n    x += 1'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_lambda(self):
        code = 'f = lambda x: x * 2\nprint(f(5))'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_import_allowed(self):
        code = 'import math\nprint(math.sqrt(16))'
        result = run_validator(code, allowed_imports=['math', 'random'])
        self.assertTrue(result['ok'])

    def test_from_import_allowed(self):
        code = 'from random import randint\nprint(randint(1, 10))'
        result = run_validator(code, allowed_imports=['random'])
        self.assertTrue(result['ok'])

    def test_multiple_imports(self):
        code = 'import math\nimport json\nimport random'
        result = run_validator(code, allowed_imports=['math', 'json', 'random'])
        self.assertTrue(result['ok'])


class TestEdgeCases(unittest.TestCase):
    """Проверка граничных случаев."""

    def test_empty_code(self):
        result = run_validator('')
        self.assertTrue(result['ok'])

    def test_comment_only(self):
        result = run_validator('# just a comment')
        self.assertTrue(result['ok'])

    def test_string_with_dangerous_content(self):
        code = 'x = "import os"'
        result = run_validator(code, allowed_imports=['math'])
        self.assertTrue(result['ok'])

    def test_no_args(self):
        """Проверка без аргументов allowed imports."""
        result = run_validator('x = 1')
        self.assertTrue(result['ok'])

    def test_max_errors_reported(self):
        """Проверка что сообщается максимум 3 ошибки."""
        code = 'import os\nimport sys\nimport subprocess\nimport shutil'
        result = run_validator(code, allowed_imports=[])
        self.assertFalse(result['ok'])
        errors = result['error'].split('; ')
        self.assertLessEqual(len(errors), 3)


class TestDunderBypassPrevention(unittest.TestCase):
    """Проверка блокировки обхода через дандер-атрибуты."""

    def test_class_bypass(self):
        result = run_validator('x = ().__class__')
        self.assertFalse(result['ok'])
        self.assertIn('__class__', result['error'])

    def test_bases_bypass(self):
        result = run_validator('x = ().__class__.__bases__')
        self.assertFalse(result['ok'])

    def test_mro_bypass(self):
        result = run_validator('x = ().__class__.__mro__')
        self.assertFalse(result['ok'])

    def test_subclasses_bypass(self):
        result = run_validator('x = ().__class__.__bases__[0].__subclasses__()')
        self.assertFalse(result['ok'])

    def test_builtins_bypass(self):
        result = run_validator('x = __builtins__["__import__"]')
        self.assertFalse(result['ok'])

    def test_dict_bypass(self):
        result = run_validator('x = vars().__dict__')
        self.assertFalse(result['ok'])

    def test_globals_bypass(self):
        result = run_validator('x = globals()')
        self.assertFalse(result['ok'])

    def test_getattribute_bypass(self):
        result = run_validator('x = ().__getattribute__("__class__")')
        self.assertFalse(result['ok'])

    def test_importlib_not_allowed(self):
        result = run_validator('import importlib', allowed_imports=['math'])
        self.assertFalse(result['ok'])
        self.assertIn('Forbidden import: importlib', result['error'])

    def test_breakpoint_blocked(self):
        """breakpoint() can invoke arbitrary code."""
        result = run_validator('breakpoint()')
        self.assertFalse(result['ok'])

    def test_safe_dunder_not_blocked(self):
        """Normal dunder usage like __name__ should not be blocked
        unless it's on a dangerous chain."""
        # __name__ is not in BLOCKED_DUNDER_ATTRS, so this should be safe
        result = run_validator('x = __name__', allowed_imports=[])
        # __name__ is a Name node with id='__name__', not an Attribute
        # It won't be caught by visit_Attribute. However, it's a valid
        # module-level name. Let's check it passes.
        # Actually __name__ as a Name node is not in DANGEROUS_CALLS
        # and the node type is 'Name' which is allowed.
        self.assertTrue(result['ok'])


class TestGlobalNonlocalAllowed(unittest.TestCase):
    """Ключевое слово global/nonlocal разрешено (учится в уроках 22-23)."""

    def test_global_allowed(self):
        result = run_validator(
            'count = 10\n'
            'def set_count():\n'
            '    global count\n'
            '    count = 5\n'
            'set_count()\n'
            'print(count)'
        )
        self.assertTrue(result['ok'])

    def test_nonlocal_allowed(self):
        result = run_validator(
            'def outer():\n'
            '    x = 1\n'
            '    def inner():\n'
            '        nonlocal x\n'
            '        x = 2\n'
            '    inner()\n'
            '    return x'
        )
        self.assertTrue(result['ok'])


if __name__ == '__main__':
    unittest.main()
