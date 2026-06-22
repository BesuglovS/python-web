/**
 * Конфигурация сайта теории Python
 */

/**
 * Карта привязки уроков Python-теории к ID контестов.
 * lesson => номер урока (целое число)
 * contest_id => ID контеста на сайте contest.nayanovaacademy.ru
 * При добавлении нового контеста нужно просто дополнить этот объект.
 */
var THEORY_CONTESTS = {
  6: 7,   // Урок 6 «Операции над числами» → контест ID 7 (ввод/вывод, присваивание)
  7: 8,   // Урок 7 «Условный оператор + Отступы» → контест ID 8 (условный оператор)
  10: 9,  // Урок 10 «Операции над строками» → контест ID 9 (операции над строками)
  11: 10, // Урок 11 «Сложные условия» → контест ID 10 (and, or, not)
  14: 11, // Урок 14 «Создание простейших функций» → контест ID 11 (функции)
  16: 12, // Урок 16 «Цикл с предусловием (while)» → контест ID 12
  18: 13, // Урок 18 «range()» → контест ID 13
  20: 14, // Урок 20 «Вложенные циклы» → контест ID 14
  21: 15, // Урок 21 «Множества (set)» → контест ID 15
  22: 16, // Урок 22 «Списки (list)» → контест ID 16
  23: 17, // Урок 23 «Кортежи (tuple)» → контест ID 17
  24: 20, // Урок 24 «Словари (dict)» → контест ID 20
  25: 18, // Урок 25 «split + join» → контест ID 18
  26: 19  // Урок 26 «Списочные выражения» → контест ID 19
};

/** Базовый URL контест-сайта */
var CONTEST_BASE_URL = 'https://contest.nayanovaacademy.ru/index.php?page=contest&id=';

/**
 * Метаданные уроков: продолжительность чтения и сложность.
 * lesson => { duration: минуты, complexity: 'beginner' | 'basic' | 'intermediate' }
 */
var LESSON_META = {
  1:  { duration: 5,  complexity: 'beginner' },
  2:  { duration: 8,  complexity: 'beginner' },
  3:  { duration: 7,  complexity: 'beginner' },
  4:  { duration: 8,  complexity: 'beginner' },
  5:  { duration: 7,  complexity: 'beginner' },
  6:  { duration: 8,  complexity: 'beginner' },
  7:  { duration: 12, complexity: 'basic' },
  8:  { duration: 8,  complexity: 'basic' },
  9:  { duration: 10, complexity: 'basic' },
  10: { duration: 8,  complexity: 'basic' },
  11: { duration: 10, complexity: 'basic' },
  12: { duration: 10, complexity: 'basic' },
  13: { duration: 7,  complexity: 'basic' },
  14: { duration: 12, complexity: 'basic' },
  15: { duration: 8,  complexity: 'basic' },
  16: { duration: 10, complexity: 'basic' },
  17: { duration: 8,  complexity: 'basic' },
  18: { duration: 7,  complexity: 'basic' },
  19: { duration: 8,  complexity: 'basic' },
  20: { duration: 10, complexity: 'intermediate' },
  21: { duration: 8,  complexity: 'basic' },
  22: { duration: 12, complexity: 'intermediate' },
  23: { duration: 7,  complexity: 'basic' },
  24: { duration: 10, complexity: 'intermediate' },
  25: { duration: 7,  complexity: 'basic' },
  26: { duration: 10, complexity: 'intermediate' },
  27: { duration: 15, complexity: 'intermediate' },
  28: { duration: 12, complexity: 'intermediate' },
  29: { duration: 14, complexity: 'intermediate' }
};

/** Подписи уровней сложности */
var COMPLEXITY_LABELS = {
  'beginner':     '🚀 Начальный',
  'basic':        '📘 Базовый',
  'intermediate': '📗 Средний'
};

/**
 * Вопросы для самопроверки (quiz) к каждому уроку.
 * lesson => [{ question, options: [], correct: индекс правильного, explanation }]
 */
var LESSON_QUIZZES = {
  3: [
    { question: 'Какое имя переменной допустимо в Python?', options: ['2nd_place', 'my-var', '_count', 'class'], correct: 2, explanation: 'Имена могут начинаться с буквы или _, но не с цифры и не могут быть ключевыми словами. Нельзя использовать дефис в именах переменных. Питон принимает его за минус.' },
    { question: 'Что произойдёт при выполнении <code>x = 5; x = "hello"</code>?', options: ['Ошибка: нельзя менять тип', 'x станет строкой "hello"', 'x останется 5', 'Создастся вторая переменная'], correct: 1, explanation: 'Python использует динамическую типизацию: переменная может менять тип в любой момент.' }
  ],
  4: [
    { question: 'Какой тип у значения <code>3.14</code>?', options: ['int', 'float', 'str', 'bool'], correct: 1, explanation: 'Числа с десятичной точкой имеют тип float (числа с плавающей точкой).' },
    { question: 'Что вернёт <code>type("42")</code>?', options: ['int', 'float', 'str', 'bool'], correct: 2, explanation: 'Значение в кавычках — это строка (str), даже если внутри цифры.' }
  ],
  5: [
    { question: 'Что делает функция <code>input()</code>?', options: ['Выводит текст на экран', 'Читает ввод пользователя', 'Сохраняет файл', 'Открывает окно'], correct: 1, explanation: 'input() приостанавливает программу и ждёт, пока пользователь введёт строку.' },
    { question: 'Какой тип возвращает <code>input()</code>?', options: ['int', 'float', 'str', 'Зависит от ввода'], correct: 2, explanation: 'input() всегда возвращает строку (str). Для чисел нужно явное преобразование: int(input()).' }
  ],
  6: [
    { question: 'Чему равно <code>17 % 5</code>?', options: ['3', '2', '3.4', '5'], correct: 1, explanation: 'Оператор % возвращает остаток от деления: 17 = 3 × 5 + 2, остаток 2.' },
    { question: 'Чему равно <code>2 ** 3</code>?', options: ['6', '8', '9', '5'], correct: 1, explanation: '** — это возведение в степень: 2³ = 8.' }
  ],
  7: [
    { question: 'Сколько пробелов рекомендуется для отступа по PEP 8?', options: ['2', '3', '4', 'Tab'], correct: 2, explanation: 'PEP 8 рекомендует 4 пробела на каждый уровень отступа.' },
    { question: 'Что выведет код?<br><code>x = 10<br>if x > 5:<br>    print("A")<br>elif x > 8:<br>    print("B")</code>', options: ['A', 'B', 'A и B', 'Ничего'], correct: 0, explanation: 'Условия проверяются сверху вниз. Первое истинное условие (x > 5) выполняется, остальные пропускаются.' }
  ],
  8: [
    { question: 'Чему равно <code>True and False</code>?', options: ['True', 'False', 'None', 'Ошибка'], correct: 1, explanation: 'and возвращает True только если оба операнда истинны.' },
    { question: 'Чему равно <code>not (5 > 3)</code>?', options: ['True', 'False', '5', '3'], correct: 1, explanation: '5 > 3 — True, оператор not инвертирует результат в False.' }
  ],
  9: [
    { question: 'Что вернёт <code>"Python"[0]</code>?', options: ['P', 'y', 'n', 'Python'], correct: 0, explanation: 'Индексация начинается с 0. Первый символ строки — P.' },
    { question: 'Что вернёт <code>"Python"[1:4]</code>?', options: ['Pyt', 'yth', 'ytho', 'Py'], correct: 1, explanation: 'Срез [1:4] берёт символы с индексом 1, 2, 3 (не включая 4) — "yth".' }
  ],
  10: [
    { question: 'Что вернёт <code>"hello".upper()</code>?', options: ['Hello', 'HELLO', 'hello', 'Ошибка'], correct: 1, explanation: 'Метод .upper() преобразует все буквы в верхний регистр.' },
    { question: 'Как объединить строки "a" и "b"?', options: ['"a" + "b"', '"a" & "b"', 'concat("a", "b")', '"a" . "b"'], correct: 0, explanation: 'В Python строки объединяются оператором + (конкатенация).' }
  ],
  11: [
    { question: 'Когда <code>x > 0 and x < 10</code> истинно?', options: ['x = -5', 'x = 0', 'x = 5', 'x = 15'], correct: 2, explanation: 'Оба условия должны быть истинны: 5 > 0 и 5 < 10 — верно.' },
    { question: 'Что выведет <code>3 > 5 or 8 > 6</code>?', options: ['True', 'False', '3', '8'], correct: 0, explanation: 'or возвращает True, если хотя бы один операнд истинен. 8 > 6 — True.' }
  ],
  14: [
    { question: 'Что такое параметр функции?', options: ['Возвращаемое значение', 'Переменная, передаваемая в функцию', 'Имя функции', 'Тип данных'], correct: 1, explanation: 'Параметры — это переменные, которые функция принимает при вызове.' },
    { question: 'Что вернёт функция без <code>return</code>?', options: ['0', 'False', 'None', 'Ошибка'], correct: 2, explanation: 'Если в функции нет return или он пустой, она неявно возвращает None.' }
  ],
  16: [
    { question: 'Сколько раз выполнится тело цикла?<br><code>i = 0<br>while i < 3:<br>    print(i)<br>    i += 1</code>', options: ['2', '3', '4', 'Бесконечно'], correct: 1, explanation: 'Цикл выполнится для i = 0, 1, 2 — три итерации. При i = 3 условие i < 3 ложно.' },
    { question: 'Что делает <code>break</code> внутри while?', options: ['Пропускает итерацию', 'Завершает цикл', 'Начинает заново', 'Ничего'], correct: 1, explanation: 'break немедленно прерывает выполнение цикла.' }
  ],
  17: [
    { question: 'Что перебирает <code>for x in "abc"</code>?', options: ['Индексы 0, 1, 2', 'Символы a, b, c', 'Буквы A, B, C', 'Числа 97, 98, 99'], correct: 1, explanation: 'Цикл for перебирает элементы последовательности напрямую — отдельные символы строки.' },
    { question: 'Что выведет <code>for i in [10, 20, 30]: print(i)</code>?', options: ['0 1 2', '10 20 30', '[10, 20, 30]', '0, 1, 2'], correct: 1, explanation: 'for перебирает значения списка: сначала 10, потом 20, потом 30.' }
  ],
  18: [
    { question: 'Что генерирует <code>range(3)</code>?', options: ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3', '3'], correct: 1, explanation: 'range(n) генерирует числа от 0 до n-1 включительно.' },
    { question: 'Что генерирует <code>range(2, 5)</code>?', options: ['2, 3, 4, 5', '2, 3, 4', '0, 1, 2', '5, 4, 3, 2'], correct: 1, explanation: 'range(start, stop) идёт от start до stop-1.' }
  ],
  22: [
    { question: 'Как добавить элемент в конец списка?', options: ['.add()', '.append()', '.insert()', '.push()'], correct: 1, explanation: 'Метод .append(x) добавляет элемент x в конец списка.' },
    { question: 'Что вернёт <code>len([1, 2, 3])</code>?', options: ['2', '3', '4', '[1, 2, 3]'], correct: 1, explanation: 'len() возвращает количество элементов в списке.' }
  ],
  24: [
    { question: 'Как получить значение по ключу "name" из словаря d?', options: ['d.name', 'd["name"]', 'd.get("name")', 'Второй и третий варианты'], correct: 3, explanation: 'Оба способа d["name"] и d.get("name") работают. .get() безопаснее: возвращает None при отсутствии ключа.' },
    { question: 'Могут ли ключи словаря повторяться?', options: ['Да', 'Нет', 'Только если значения разные', 'Только строки'], correct: 1, explanation: 'Ключи в словаре уникальны. При повторном присваивании старое значение перезаписывается.' }
  ],
  29: [
    { question: 'Какой режим нужно указать в open() для чтения файла?', options: ['"w"', '"r"', '"a"', '"rw"'], correct: 1, explanation: 'Режим "r" (read) открывает файл для чтения. Файл при этом должен существовать.' },
    { question: 'Что делает конструкция <code>with open(...) as f:</code>?', options: ['Открывает файл в режиме только для записи', 'Автоматически закрывает файл после выхода из блока', 'Создаёт новый файл', 'Копирует файл'], correct: 1, explanation: 'with ... as гарантирует, что файл будет закрыт автоматически, даже если внутри блока произошла ошибка.' },
    { question: 'Что вернёт <code>"  42  \\n".strip()</code>?', options: ['"  42  "', '"42"', '"42\n"', '"  42  \n"'], correct: 1, explanation: 'strip() удаляет пробельные символы (пробелы, табуляцию, \\n) с обоих концов строки.' },
    { question: 'Дан файл с одной строкой "10 20 30 40". Как получить список чисел?', options: ['int(f.read())', '[int(x) for x in f.readline()]', 'f.read().split()', 'int(f.readline())'], correct: 1, explanation: 'Сначала читаем строку и делим её по пробелам. Каждый фрагмент превращаем в число с помощью функции int.' },
    { question: 'Что произойдёт при попытке открыть несуществующий файл в режиме "r"?', options: ['Создастся пустой файл', 'Вызовется FileNotFoundError', 'Вернётся None', 'Программа зависнет'], correct: 1, explanation: 'Режим "r" требует, чтобы файл существовал. Если его нет — Python выбрасывает FileNotFoundError.' }
  ],
  28: [
    { question: 'Что произойдёт при выполнении <code>int("abc")</code>?', options: ['Вернёт 0', 'Вызовет ValueError', 'Вернёт None', 'Программа завершится без ошибки'], correct: 1, explanation: 'int() не может преобразовать строку "abc" в число и выбрасывает исключение ValueError.' },
    { question: 'Какой блок выполнится ВСЕГДА, независимо от того, была ошибка или нет?', options: ['try', 'except', 'else', 'finally'], correct: 3, explanation: 'Блок finally выполняется всегда — и при успешном выполнении, и при возникновении исключения.' },
    { question: 'Для чего используется <code>raise</code>?', options: ['Для обработки ошибок', 'Чтобы вручную вызвать исключение', 'Для импорта модулей', 'Для создания функции'], correct: 1, explanation: 'Оператор raise позволяет программисту самому вызвать исключение в нужный момент, например при некорректных данных.' }
  ],
  "final-test": [
    { question: 'Какая функция используется для вывода данных на экран?', options: ['input()', 'print()', 'echo()', 'console.log()'], correct: 1, explanation: 'print() — встроенная функция Python для вывода данных на экран.' },
    { question: 'Какой тип данных будет у значения <code>3.14</code>?', options: ['int', 'float', 'str', 'bool'], correct: 1, explanation: 'Числа с десятичной точкой — это float (числа с плавающей запятой).' },
    { question: 'Что выведет код: <code>print(10 % 3)</code>?', options: ['3', '3.33', '1', '0'], correct: 2, explanation: 'Оператор % возвращает остаток от деления. 10 // 3 = 3, остаток = 1.' },
    { question: 'Какое ключевое слово используется для создания функции?', options: ['func', 'function', 'define', 'def'], correct: 3, explanation: 'В Python функции создаются с помощью ключевого слова def.' },
    { question: 'Что выведет код: <code>print(True and False)</code>?', options: ['True', 'False', 'None', 'Ошибка'], correct: 1, explanation: 'Оператор and возвращает True, только если оба операнда истинны. True and False → False.' },
    { question: 'Какой цикл используется, когда количество итераций известно заранее?', options: ['while', 'for', 'loop', 'until'], correct: 1, explanation: 'Цикл for обычно используется, когда количество итераций известно (например, перебор элементов списка).' },
    { question: 'Что делает метод списков .append(x)?', options: ['Удаляет элемент x', 'Вставляет x в начало', 'Добавляет x в конец списка', 'Заменяет x на другой элемент'], correct: 2, explanation: 'Метод append() добавляет элемент в конец списка.' },
    { question: 'Чем отличается tuple (кортеж) от list (списка)?', options: ['Ничем', 'Кортеж неизменяем, список изменяем', 'Список быстрее', 'Кортеж поддерживает только числа'], correct: 1, explanation: 'Кортежи (tuple) — неизменяемые последовательности. После создания их нельзя изменить. Списки — изменяемые.' },
    { question: 'Что выведет код: <code>print(len(\'Python\'))</code>?', options: ['5', '6', '7', 'Ошибка'], correct: 1, explanation: 'Функция len() возвращает длину строки. В слове \'Python\' 6 символов.' },
    { question: 'Как получить срез строки от начала до 3-го символа (невключительно)?', options: ['s[:3]', 's[0:2]', 's[::3]', 's[:-3]'], correct: 0, explanation: 's[:3] означает "от начала до индекса 3 (невключительно)", т.е. символы с индексами 0, 1, 2.' },
    { question: 'Что такое словарь (dict) в Python?', options: ['Упорядоченный список', 'Коллекция пар "ключ-значение"', 'Алфавитный указатель', 'Тип для хранения только строк'], correct: 1, explanation: 'Словарь (dict) — структура данных, хранящая пары "ключ: значение".' },
    { question: 'Что выведет код: <code>for i in range(3): print(i)</code>?', options: ['1 2 3', '0 1 2 3', '0 1 2', '1 2'], correct: 2, explanation: 'range(3) генерирует числа 0, 1, 2 (от 0 до n-1).' },
    { question: 'Какое ключевое слово используется для перехвата ошибок?', options: ['catch', 'except', 'rescue', 'trap'], correct: 1, explanation: 'Python использует except для обработки исключений в блоке try/except.' },
    { question: 'Что делает оператор break в цикле?', options: ['Переходит к следующей итерации', 'Завершает программу', 'Прерывает выполнение цикла', 'Удаляет переменную'], correct: 2, explanation: 'break немедленно завершает выполнение цикла, даже если условие ещё истинно.' },
    { question: 'Какое списочное выражение создаст список квадратов чисел от 0 до 4?', options: ['[x*2 for x in range(5)]', '[x**2 for x in range(5)]', '[x*x for x in range(4)]', '[square(x) for x in range(5)]'], correct: 1, explanation: 'x**2 — возведение в квадрат. range(5) даёт 0,1,2,3,4. Результат: [0,1,4,9,16].' }
  ]
};