"""Import-based tests for sandbox/ast_validator.py.

Дополняют test_ast_validator.py (subprocess-based): импортируют функцию
validate() напрямую, что позволяет измерять покрытие CI через `coverage`.
"""
import importlib.util
import os
import unittest

AST_VALIDATOR = os.path.join(os.path.dirname(__file__), '..', 'sandbox', 'ast_validator.py')

_spec = importlib.util.spec_from_file_location('ast_validator', AST_VALIDATOR)
ast_validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ast_validator)

ALLOWED = {
    'math', 'random', 'datetime', 'itertools', 'collections',
    'functools', 'json', 're', 'string', 'statistics',
    'decimal', 'fractions', 'copy', 'pprint',
}


class TestValidateImport(unittest.TestCase):
    def test_valid_code(self):
        self.assertTrue(ast_validator.validate('x = 1 + 2\nprint(x)', ALLOWED)['ok'])

    def test_syntax_error(self):
        r = ast_validator.validate('def foo(:', ALLOWED)
        self.assertFalse(r['ok'])
        self.assertIn('SyntaxError', r['error'])

    def test_exec_blocked(self):
        r = ast_validator.validate('exec("print(1)")', ALLOWED)
        self.assertFalse(r['ok'])

    def test_allowed_import(self):
        self.assertTrue(ast_validator.validate('import math', ALLOWED)['ok'])

    def test_forbidden_import(self):
        r = ast_validator.validate('import os', ALLOWED)
        self.assertFalse(r['ok'])

    def test_forbidden_import_from(self):
        r = ast_validator.validate('from subprocess import Popen', ALLOWED)
        self.assertFalse(r['ok'])

    def test_forbidden_module_attr(self):
        r = ast_validator.validate('os.path.join("a", "b")', ALLOWED)
        self.assertFalse(r['ok'])

    def test_forbidden_dunder_attr(self):
        r = ast_validator.validate('().__class__.__bases__', ALLOWED)
        self.assertFalse(r['ok'])

    def test_forbidden_name(self):
        r = ast_validator.validate('print(__builtins__)', ALLOWED)
        self.assertFalse(r['ok'])

    def test_too_many_nodes(self):
        # 4000 одинаковых простых выражений превышают MAX_AST_NODES (3000)
        code = '\n'.join('x{0} = {0}'.format(i) for i in range(4000))
        r = ast_validator.validate(code, ALLOWED)
        self.assertFalse(r['ok'])


if __name__ == '__main__':
    unittest.main()
