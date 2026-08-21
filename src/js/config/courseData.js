'use strict';

/**
 * Course configuration data from lessons.json
 * This is the single source of truth for course metadata
 */
// THEORY_CONTESTS генерируется из lessons.json (поле contest) скриптом build-config-meta.mjs.
// Источник истины — lessons.json, НЕ этот файл.
// Для обновления: node build-config-meta.mjs
const THEORY_CONTESTS = {
   8: 7,
  10: 8,
  12: 10,
  15: 9,
  17: 12,
  19: 13,
  21: 14,
  22: 11,
  25: 16,
  26: 15,
  27: 17,
  28: 20,
  29: 18,
  30: 19,
};

const CONTEST_BASE_URL = 'https://contest.nayanovaacademy.ru/index.php?page=contest&id=';
const REPL_URL = 'sandbox/run.php';
const TOTAL_LESSONS = 50;

// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.
// Источник истины — lessons.json, НЕ этот файл.
// Для обновления: node build-config-meta.mjs
const LESSON_META = {
   1: { duration: 10, complexity: 'beginner' },
   2: { duration: 8, complexity: 'beginner' },
   3: { duration: 10, complexity: 'beginner' },
   4: { duration: 12, complexity: 'beginner' },
   5: { duration: 8, complexity: 'beginner' },
   6: { duration: 10, complexity: 'beginner' },
   7: { duration: 10, complexity: 'beginner' },
   8: { duration: 10, complexity: 'beginner' },
   9: { duration: 8, complexity: 'beginner' },
  10: { duration: 12, complexity: 'basic' },
  11: { duration: 10, complexity: 'basic' },
  12: { duration: 8, complexity: 'basic' },
  13: { duration: 8, complexity: 'basic' },
  14: { duration: 12, complexity: 'basic' },
  15: { duration: 10, complexity: 'basic' },
  16: { duration: 15, complexity: 'intermediate' },
  17: { duration: 10, complexity: 'basic' },
  18: { duration: 12, complexity: 'basic' },
  19: { duration: 8, complexity: 'basic' },
  20: { duration: 8, complexity: 'basic' },
  21: { duration: 10, complexity: 'basic' },
  22: { duration: 12, complexity: 'basic' },
  23: { duration: 15, complexity: 'intermediate' },
  24: { duration: 12, complexity: 'basic' },
  25: { duration: 15, complexity: 'basic' },
  26: { duration: 10, complexity: 'basic' },
  27: { duration: 10, complexity: 'basic' },
  28: { duration: 15, complexity: 'basic' },
  29: { duration: 8, complexity: 'basic' },
  30: { duration: 12, complexity: 'intermediate' },
  31: { duration: 12, complexity: 'intermediate' },
  32: { duration: 12, complexity: 'basic' },
  33: { duration: 12, complexity: 'basic' },
  34: { duration: 15, complexity: 'intermediate' },
  35: { duration: 10, complexity: 'basic' },
  36: { duration: 12, complexity: 'intermediate' },
  37: { duration: 12, complexity: 'basic' },
  38: { duration: 10, complexity: 'basic' },
  39: { duration: 10, complexity: 'basic' },
  40: { duration: 15, complexity: 'intermediate' },
  41: { duration: 15, complexity: 'intermediate' },
  42: { duration: 15, complexity: 'intermediate' },
  43: { duration: 12, complexity: 'intermediate' },
  44: { duration: 12, complexity: 'intermediate' },
  45: { duration: 15, complexity: 'advanced' },
  46: { duration: 10, complexity: 'basic' },
  47: { duration: 12, complexity: 'intermediate' },
  48: { duration: 12, complexity: 'intermediate' },
  49: { duration: 15, complexity: 'intermediate' },
  50: { duration: 12, complexity: 'basic' },
};

const COMPLEXITY_LABELS = {
  beginner: '🚀 Начальный',
  basic: '📘 Базовый',
  intermediate: '📗 Средний',
  advanced: '📙 Продвинутый',
};

// LESSON_BADGES генерируется из lessons.json (поле badge) скриптом build-config-meta.mjs.
// Источник истины — lessons.json, НЕ этот файл.
// Для обновления: node build-config-meta.mjs
const LESSON_BADGES = [
  { num:  1, id: 'historian', title: 'История, обзор и области применения', file: '01-history.html' },
  { num:  2, id: 'ide_pioneer', title: 'Настройка IDE: IDLE, VS Code и PyCharm', file: '02-ide-setup.html' },
  { num:  3, id: 'var_master', title: 'Переменные', file: '03-variables.html' },
  { num:  4, id: 'type_explorer', title: 'Типы данных', file: '04-data-types.html' },
  { num:  5, id: 'caster', title: 'Приведение типов', file: '05-type-casting.html' },
  { num:  6, id: 'io_master', title: 'Ввод и вывод', file: '06-io.html' },
  { num:  7, id: 'fstring_guru', title: 'f-строки и форматирование', file: '07-f-strings.html' },
  { num:  8, id: 'math_wiz', title: 'Операции над числами', file: '08-number-ops.html' },
  { num:  9, id: 'bool_master', title: 'Булевы переменные', file: '09-booleans.html' },
  { num: 10, id: 'decision_maker', title: 'Условный оператор + Отступы', file: '10-conditional.html' },
  { num: 11, id: 'try_except_master', title: 'Обработка ошибок', file: '11-try-except.html' },
  { num: 12, id: 'logician', title: 'Сложные условия', file: '12-complex-conditions.html' },
  { num: 13, id: 'nested_navigator', title: 'Вложенные структуры', file: '13-nested-structures.html' },
  { num: 14, id: 'string_slicer', title: 'Строки: индексация и срезы', file: '14-strings-index-slice.html' },
  { num: 15, id: 'string_master', title: 'Операции над строками', file: '15-string-ops.html' },
  { num: 16, id: 'regex_wizard', title: 'Регулярные выражения', file: '16-regex.html' },
  { num: 17, id: 'looper', title: 'Цикл с предусловием', file: '17-while.html' },
  { num: 18, id: 'for_master', title: 'Цикл for', file: '18-for.html' },
  { num: 19, id: 'range_runner', title: 'range()', file: '19-range.html' },
  { num: 20, id: 'flow_controller', title: 'break и continue', file: '20-break-continue.html' },
  { num: 21, id: 'nested_looper', title: 'Вложенные циклы', file: '21-nested-loops.html' },
  { num: 22, id: 'func_creator', title: 'Создание простейших функций', file: '22-functions.html' },
  { num: 23, id: 'func_wizard', title: 'Функции: продвинутые темы', file: '23-functions-advanced.html' },
  { num: 24, id: 'debugger', title: 'Отладка программ', file: '24-debugging.html' },
  { num: 25, id: 'list_master', title: 'Списки', file: '25-lists.html' },
  { num: 26, id: 'set_specialist', title: 'Множества', file: '26-sets.html' },
  { num: 27, id: 'tuple_tamer', title: 'Кортежи', file: '27-tuples.html' },
  { num: 28, id: 'dict_master', title: 'Словари', file: '28-dicts.html' },
  { num: 29, id: 'string_splitter', title: 'split + join', file: '29-split-join.html' },
  { num: 30, id: 'comprehension_master', title: 'Списочные выражения', file: '30-list-comprehensions.html' },
  { num: 31, id: 'lambda_wizard', title: 'Lambda-функции', file: '31-lambda.html' },
  { num: 32, id: 'file_handler', title: 'Файлы: чтение и запись', file: '32-files.html' },
  { num: 33, id: 'data_formatter', title: 'JSON и CSV', file: '33-json-csv.html' },
  { num: 34, id: 'sql_master', title: 'Базы данных SQLite', file: '34-sqlite3.html' },
  { num: 35, id: 'module_importer', title: 'Модули и import', file: '35-modules-import.html' },
  { num: 36, id: 'itertools_guru', title: 'Модуль itertools', file: '36-itertools.html' },
  { num: 37, id: 'venv_master', title: 'Виртуальные окружения и pip', file: '37-venv-pip.html' },
  { num: 38, id: 'math_random', title: 'Модули math и random', file: '38-math-random.html' },
  { num: 39, id: 'time_traveler', title: 'Модуль datetime', file: '39-datetime.html' },
  { num: 40, id: 'data_scientist', title: 'NumPy и Pandas', file: '40-numpy-pandas.html' },
  { num: 41, id: 'class_builder', title: 'Введение в ООП', file: '41-oop-intro.html' },
  { num: 42, id: 'inheritance_guru', title: 'Наследование и полиморфизм', file: '42-inheritance.html' },
  { num: 43, id: 'decorator_master', title: 'Декораторы', file: '43-decorators.html' },
  { num: 44, id: 'generator_guru', title: 'Генераторы', file: '44-generators.html' },
  { num: 45, id: 'async_master', title: 'Многопоточность и asyncio', file: '45-threading-async.html' },
  { num: 46, id: 'type_hinter', title: 'Type Hints', file: '46-type-hints.html' },
  { num: 47, id: 'test_master', title: 'Unit-тесты с pytest', file: '47-pytest.html' },
  { num: 48, id: 'api_explorer', title: 'Requests и API', file: '48-requests-api.html' },
  { num: 49, id: 'web_builder', title: 'Веб-фреймворки: Flask', file: '49-flask.html' },
  { num: 50, id: 'git_master', title: 'Введение в Git', file: '50-git-intro.html' },
];

// Expose to window for backward compatibility (repl.js, tests)
window.THEORY_CONTESTS = THEORY_CONTESTS;
window.CONTEST_BASE_URL = CONTEST_BASE_URL;
window.TOTAL_LESSONS = TOTAL_LESSONS;
window.LESSON_META = LESSON_META;
window.COMPLEXITY_LABELS = COMPLEXITY_LABELS;
window.LESSON_BADGES = LESSON_BADGES;

export {
  THEORY_CONTESTS,
  CONTEST_BASE_URL,
  REPL_URL,
  TOTAL_LESSONS,
  LESSON_META,
  COMPLEXITY_LABELS,
  LESSON_BADGES,
};