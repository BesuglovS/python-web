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
  6: 7,   // Урок 6 «Операции над числами» → контест ID 7
  7: 8,   // Урок 7 «Условный оператор» → контест ID 8
  9: 10,  // Урок 9 «Сложные условия» → контест ID 10
  13: 9,  // Урок 13 «Операции над строками» → контест ID 9
  14: 11, // Урок 14 «Функции» → контест ID 11
  16: 12, // Урок 16 «Цикл while» → контест ID 12
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

/** URL песочницы для выполнения Python-кода */
var REPL_URL = 'sandbox/run.php';

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
  27: { duration: 12, complexity: 'intermediate' },
  28: { duration: 14, complexity: 'intermediate' },
  29: { duration: 10, complexity: 'intermediate' },
  30: { duration: 14, complexity: 'intermediate' },
  31: { duration: 12, complexity: 'intermediate' },
  32: { duration: 12, complexity: 'intermediate' },
  33: { duration: 14, complexity: 'intermediate' },
  34: { duration: 15, complexity: 'intermediate' }
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
  1: [
    { question: 'Кто создал язык Python?', options: ['Билл Гейтс', 'Гвидо ван Россум', 'Линус Торвальдс', 'Деннис Ритчи'], correct: 1, explanation: 'Python создал Гвидо ван Россум (Guido van Rossum) в 1991 году. Название языка — отсылка к комик-группе Monty Python, а не к змее.' },
    { question: 'Какая философия лежит в основе дизайна Python?', options: ['Максимальная сложность', 'Читаемость кода и простота', 'Только для веб-разработки', 'Компиляция в машинный код'], correct: 1, explanation: 'Python делает упор на читаемость и минимализм. Девиз языка: «Beautiful is better than ugly» («Красивое лучше, чем уродливое»).' }
  ],
  2: [
    { question: 'Что такое IDE?', options: ['Язык программирования', 'Интегрированная среда разработки', 'Интернет-протокол', 'База данных'], correct: 1, explanation: 'IDE (Integrated Development Environment) — программа, объединяющая редактор кода, отладчик, терминал и другие инструменты для разработки.' },
    { question: 'Как запустить Python-скрипт из командной строки?', options: ['run script.py', 'python script.py', 'execute script.py', 'compile script.py'], correct: 1, explanation: 'Для запуска Python-скрипта используется команда python (или python3). Например: python myscript.py.' }
  ],
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
  12: [
    { question: 'Что такое вложенная структура в Python?', options: ['Структура внутри другой структуры (if в if, цикл в if)', 'Список внутри функции', 'Программа с несколькими файлами', 'Ошибка в коде'], correct: 0, explanation: 'Вложенные структуры — это когда одна конструкция (if, цикл) находится внутри другой. Например, if внутри if или цикл внутри условия.' },
    { question: 'Сколько уровней вложенности допускается в Python?', options: ['Не более 2', 'Не более 5', 'Любое количество', 'Не более 10'], correct: 2, explanation: 'Python не ограничивает уровни вложенности, но PEP 8 рекомендует избегать слишком глубокой вложенности (более 3-4 уровней) для читаемости кода.' }
  ],
  13: [
    { question: 'Что вычислится первым в выражении <code>2 + 3 * 4</code>?', options: ['Сложение 2 + 3', 'Умножение 3 * 4', 'Оба одновременно', 'Зависит от порядка записи'], correct: 1, explanation: 'Умножение имеет более высокий приоритет, чем сложение, поэтому 3 * 4 = 12, потом 2 + 12 = 14.' },
    { question: 'Что выведет <code>not True or False and True</code>?', options: ['True', 'False', 'Ошибка', 'None'], correct: 1, explanation: 'Приоритет: not → and → or. not True = False; False and True = False; False or False = False.' }
  ],
  14: [
    { question: 'Что такое параметр функции?', options: ['Возвращаемое значение', 'Переменная, передаваемая в функцию', 'Имя функции', 'Тип данных'], correct: 1, explanation: 'Параметры — это переменные, которые функция принимает при вызове.' },
    { question: 'Что вернёт функция без <code>return</code>?', options: ['0', 'False', 'None', 'Ошибка'], correct: 2, explanation: 'Если в функции нет return или он пустой, она неявно возвращает None.' }
  ],
  15: [
    { question: 'Что такое *args в Python?', options: ['Обязательный параметр', 'Список всех аргументов функции', 'Кортеж из позиционных аргументов переменной длины', 'Строковый аргумент'], correct: 2, explanation: '*args собирает все переданные позиционные аргументы в кортеж. Позволяет функции принимать любое количество аргументов.' },
    { question: 'Что делает ключевое слово global внутри функции?', options: ['Создаёт новую переменную', 'Позволяет изменить глобальную переменную изнутри функции', 'Удаляет переменную', 'Экспортирует функцию'], correct: 1, explanation: 'global указывает, что переменная внутри функции ссылается на глобальную область видимости, а не создаёт локальную копию.' }
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
  19: [
    { question: 'Что делает оператор continue в цикле?', options: ['Завершает цикл', 'Пропускает текущую итерацию и переходит к следующей', 'Перезапускает цикл с начала', 'Удаляет переменную цикла'], correct: 1, explanation: 'continue пропускает оставшуюся часть тела цикла для текущей итерации и переходит к проверке условия (или следующему элементу).' },
    { question: 'Что выведет код: <code>for i in range(5):<br>    if i == 2: continue<br>    print(i)</code>?', options: ['0 1 2 3 4', '0 1 3 4', '2', '0 1 2'], correct: 1, explanation: 'При i = 2 срабатывает continue, итерация прерывается, print(2) не выполняется. Остальные числа выводятся.' }
  ],
  20: [
    { question: 'Что такое вложенный цикл?', options: ['Цикл, который выполняется один раз', 'Цикл внутри другого цикла', 'Цикл без условия', 'Бесконечный цикл'], correct: 1, explanation: 'Вложенный цикл — это цикл, находящийся в теле другого цикла. Внутренний цикл полностью выполняется на каждой итерации внешнего.' },
    { question: 'Сколько раз выполнится print во вложенных циклах: for i in range(2): for j in range(3): print(i,j)?', options: ['2', '3', '5', '6'], correct: 3, explanation: 'Внешний цикл — 2 итерации, внутренний — 3. Общее количество = 2 × 3 = 6.' }
  ],
  21: [
    { question: 'Чем множество (set) отличается от списка?', options: ['Ничем', 'Множество хранит только уникальные элементы и не гарантирует порядок', 'Множество хранит только числа', 'Множество нельзя изменять'], correct: 1, explanation: 'set — неупорядоченная коллекция уникальных элементов. В отличие от списка, дубликаты автоматически удаляются.' },
    { question: 'Что выведет <code>len({1, 2, 2, 3, 3, 3})</code>?', options: ['6', '3', '2', 'Ошибка'], correct: 1, explanation: 'Множество удаляет дубликаты: {1, 2, 3}. Уникальных элементов — 3.' }
  ],
  22: [
    { question: 'Как добавить элемент в конец списка?', options: ['.add()', '.append()', '.insert()', '.push()'], correct: 1, explanation: 'Метод .append(x) добавляет элемент x в конец списка.' },
    { question: 'Что вернёт <code>len([1, 2, 3])</code>?', options: ['2', '3', '4', '[1, 2, 3]'], correct: 1, explanation: 'len() возвращает количество элементов в списке.' }
  ],
  23: [
    { question: 'Чем кортеж (tuple) отличается от списка?', options: ['Ничем', 'Кортеж неизменяем, список изменяем', 'Кортеж быстрее', 'Кортеж не поддерживает индексацию'], correct: 1, explanation: 'Кортежи неизменяемы (immutable): после создания нельзя добавить, удалить или изменить элементы. Списки изменяемы.' },
    { question: 'Как создать кортеж из одного элемента?', options: ['(1)', 'tuple(1)', '(1,)', '[1]'], correct: 2, explanation: 'Для кортежа из одного элемента нужна запятая: (1,). Без запятой (1) — это просто число 1 в скобках.' }
  ],
  24: [
    { question: 'Как получить значение по ключу "name" из словаря d?', options: ['d.name', 'd["name"]', 'd.get("name")', 'Второй и третий варианты'], correct: 3, explanation: 'Оба способа d["name"] и d.get("name") работают. .get() безопаснее: возвращает None при отсутствии ключа.' },
    { question: 'Могут ли ключи словаря повторяться?', options: ['Да', 'Нет', 'Только если значения разные', 'Только строки'], correct: 1, explanation: 'Ключи в словаре уникальны. При повторном присваивании старое значение перезаписывается.' }
  ],
  25: [
    { question: 'Что делает метод split()?', options: ['Объединяет строки', 'Разбивает строку на список подстрок по разделителю', 'Удаляет пробелы', 'Переворачивает строку'], correct: 1, explanation: 'split() разделяет строку на части по указанному разделителю и возвращает список. По умолчанию разделитель — пробел.' },
    { question: 'Что выведет <code>",".join(["a", "b", "c"])</code>?', options: ['"a,b,c"', '"abc"', '"a b c"', 'Ошибка'], correct: 0, explanation: 'join() объединяет элементы списка в строку, вставляя между ними указанный разделитель. Результат: "a,b,c".' }
  ],
  26: [
    { question: 'Что такое list comprehension?', options: ['Копирование списка', 'Сжатый способ создания списка из итератора в одну строку', 'Сортировка списка', 'Удаление дубликатов'], correct: 1, explanation: 'List comprehension — это компактный синтаксис для создания списков: [выражение for элемент in итератор if условие].' },
    { question: 'Что создаст <code>[x**2 for x in range(5) if x % 2 == 0]</code>?', options: ['[0, 4, 16]', '[0, 1, 4, 9, 16]', '[1, 9]', '[0, 2, 4]'], correct: 0, explanation: 'range(5) → 0,1,2,3,4. Фильтр x % 2 == 0 оставляет 0,2,4. Возведение в квадрат даёт [0, 4, 16].' }
  ],
  27: [
    { question: 'Что произойдёт при выполнении <code>int("abc")</code>?', options: ['Вернёт 0', 'Вызовет ValueError', 'Вернёт None', 'Программа завершится без ошибки'], correct: 1, explanation: 'int() не может преобразовать строку "abc" в число и выбрасывает исключение ValueError.' },
    { question: 'Какой блок выполнится ВСЕГДА, независимо от того, была ошибка или нет?', options: ['try', 'except', 'else', 'finally'], correct: 3, explanation: 'Блок finally выполняется всегда — и при успешном выполнении, и при возникновении исключения.' },
    { question: 'Для чего используется <code>raise</code>?', options: ['Для обработки ошибок', 'Чтобы вручную вызвать исключение', 'Для импорта модулей', 'Для создания функции'], correct: 1, explanation: 'Оператор raise позволяет программисту самому вызвать исключение в нужный момент, например при некорректных данных.' }
  ],
  28: [
    { question: 'Какой режим нужно указать в open() для чтения файла?', options: ['"w"', '"r"', '"a"', '"rw"'], correct: 1, explanation: 'Режим "r" (read) открывает файл для чтения. Файл при этом должен существовать.' },
    { question: 'Что делает конструкция <code>with open(...) as f:</code>?', options: ['Открывает файл в режиме только для записи', 'Автоматически закрывает файл после выхода из блока', 'Создаёт новый файл', 'Копирует файл'], correct: 1, explanation: 'with ... as гарантирует, что файл будет закрыт автоматически, даже если внутри блока произошла ошибка.' },
    { question: 'Что вернёт <code>"  42  \\n".strip()</code>?', options: ['"  42  "', '"42"', '"42\n"', '"  42  \n"'], correct: 1, explanation: 'strip() удаляет пробельные символы (пробелы, табуляцию, \\n) с обоих концов строки.' },
    { question: 'Дан файл с одной строкой "10 20 30 40". Как получить список чисел?', options: ['int(f.read())', '[int(x) for x in f.readline()]', 'f.read().split()', 'int(f.readline())'], correct: 1, explanation: 'Сначала читаем строку и делим её по пробелам. Каждый фрагмент превращаем в число с помощью функции int.' },
    { question: 'Что произойдёт при попытке открыть несуществующий файл в режиме "r"?', options: ['Создастся пустой файл', 'Вызовется FileNotFoundError', 'Вернётся None', 'Программа зависнет'], correct: 1, explanation: 'Режим "r" требует, чтобы файл существовал. Если его нет — Python выбрасывает FileNotFoundError.' }
  ],
  29: [
    { question: 'Какая функция из itertools возвращает все упорядоченные комбинации (порядок важен)?', options: ['product()', 'permutations()', 'combinations()', 'chain()'], correct: 1, explanation: 'permutations() генерирует все упорядоченные подмножества. Порядок элементов важен: (1,2) и (2,1) — разные комбинации.' },
    { question: 'Что вернёт <code>list(product("AB", repeat=2))</code>?', options: ['[("A","B"), ("B","A")]', '[("A","A"), ("A","B"), ("B","A"), ("B","B")]', '[("A","A"), ("B","B")]', '["AB", "BA"]'], correct: 1, explanation: 'product с repeat=2 даёт декартово произведение множества на себя. Всего 2×2 = 4 комбинации, включая повторения.' },
    { question: 'Чем отличаются combinations() от permutations()?', options: ['Ничем', 'В combinations() порядок не важен, в permutations() — важен', 'В combinations() элементы могут повторяться', 'permutations() работает только с числами'], correct: 1, explanation: 'В combinations() порядок не имеет значения: (A,B) и (B,A) — одно и то же. В permutations() это разные комбинации.' },
    { question: 'Что делает функция chain()?', options: ['Группирует одинаковые элементы', 'Объединяет несколько итераторов в один', 'Бесконечно повторяет элементы', 'Создаёт декартово произведение'], correct: 1, explanation: 'chain() последовательно перебирает элементы из нескольких итераторов, как если бы они были одним.' },
    { question: 'Какое важное условие нужно соблюсти перед использованием groupby()?', options: ['Данные должны быть числами', 'Данные должны быть отсортированы по ключу группировки', 'В данных не должно быть повторений', 'Данные должны быть строками'], correct: 1, explanation: 'groupby() группирует только последовательные одинаковые элементы. Чтобы получить правильные группы, данные нужно предварительно отсортировать по тому же ключу.' }
  ],
   30: [
    { question: 'Какая команда импортирует модуль math?', options: ['include math', 'import math', 'using math', 'require math'], correct: 1, explanation: 'Для подключения модуля в Python используется ключевое слово import: import math.' },
    { question: 'Что делает <code>from math import sqrt</code>?', options: ['Импортирует весь модуль math', 'Импортирует только функцию sqrt, можно вызывать без префикса math.', 'Удаляет модуль math', 'Переименовывает sqrt'], correct: 1, explanation: 'from ... import ... импортирует конкретное имя. После этого sqrt() можно использовать напрямую, без math.sqrt().' },
    { question: 'Что делает <code>import math as m</code>?', options: ['Импортирует модуль m', 'Импортирует math под псевдонимом m', 'Объединяет два модуля', 'Вызывает ошибку'], correct: 1, explanation: 'Ключевое слово as создаёт псевдоним. После этого можно писать m.sqrt(25) вместо math.sqrt(25).' }
  ],
  31: [
    { question: 'Чему равно <code>math.sqrt(16)</code>?', options: ['4', '4.0', '8', '256'], correct: 1, explanation: 'math.sqrt() всегда возвращает float: 4.0.' },
    { question: 'Что вернёт <code>random.randint(1, 6)</code>?', options: ['Случайное целое от 0 до 6', 'Случайное целое от 1 до 6 включительно', 'Случайное число с плавающей точкой', 'Список из 6 случайных чисел'], correct: 1, explanation: 'randint(a, b) возвращает случайное целое N, где a <= N <= b. Обе границы включены.' },
    { question: 'Что делает <code>random.shuffle(my_list)</code>?', options: ['Создаёт новый перемешанный список', 'Перемешивает список на месте и возвращает None', 'Сортирует список', 'Удаляет дубликаты'], correct: 1, explanation: 'shuffle() перемешивает элементы в исходном списке (изменяет его) и ничего не возвращает (None).' },
    { question: 'Для чего нужен <code>random.seed()</code>?', options: ['Для ускорения генерации', 'Чтобы случайные числа были воспроизводимыми', 'Для генерации целых чисел', 'Для перемешивания'], correct: 1, explanation: 'seed() фиксирует начальное состояние генератора. С одинаковым seed последовательность случайных чисел всегда одинакова — удобно для отладки.' }
  ],
  32: [
    { question: 'Что вернёт <code>datetime.now()</code>?', options: ['Только текущую дату', 'Только текущее время', 'Текущие дату и время', 'Строку с датой'], correct: 2, explanation: 'datetime.now() возвращает объект datetime с текущими датой и временем.' },
    { question: 'Как превратить дату в строку формата «ДД.ММ.ГГГГ»?', options: ['date.toString()', 'date.strftime("%d.%m.%Y")', 'date.strptime("%d.%m.%Y")', 'date.format()'], correct: 1, explanation: 'strftime (string format time) форматирует дату в строку по шаблону. %d — день, %m — месяц, %Y — год.' },
    { question: 'Что делает <code>timedelta(days=1)</code>?', options: ['Создаёт дату завтрашнего дня', 'Создаёт промежуток в 1 день для арифметики с датами', 'Изменяет текущую дату', 'Форматирует дату'], correct: 1, explanation: 'timedelta представляет разницу во времени. Её можно прибавлять к датам и вычитать из них.' }
  ],
  33: [
    { question: 'Что такое класс в Python?', options: ['Переменная специального типа', 'Шаблон (чертёж) для создания объектов', 'Файл с кодом', 'Встроенная функция'], correct: 1, explanation: 'Класс — это чертёж, описывающий структуру и поведение будущих объектов.' },
    { question: 'Как называется метод, который вызывается при создании объекта?', options: ['__create__', '__new__', '__init__', 'constructor'], correct: 2, explanation: '__init__ — конструктор класса. Вызывается автоматически при создании объекта: obj = MyClass().' },
    { question: 'Что означает self в методах класса?', options: ['Ключевое слово для создания класса', 'Ссылка на текущий экземпляр объекта', 'Глобальная переменная', 'Имя файла'], correct: 1, explanation: 'self — первый параметр каждого метода. Через self метод получает доступ к атрибутам и другим методам своего объекта.' }
  ],
  34: [
    { question: 'Что должно быть в финальном проекте?', options: ['Только одна функция', 'Работающая программа, использующая несколько изученных тем', 'Только код из интернета', 'Только print("Hello World")'], correct: 1, explanation: 'Финальный проект должен демонстрировать комплексное применение изученного: переменные, условия, циклы, функции, структуры данных и, возможно, работу с файлами.' },
    { question: 'Какой первый шаг при создании проекта?', options: ['Сразу писать код', 'Продумать архитектуру и разбить задачу на подзадачи', 'Скачать чужой проект', 'Написать документацию'], correct: 1, explanation: 'Перед написанием кода важно спланировать структуру программы, определить необходимые функции и данные. Это экономит время на отладке.' }
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

/** Система достижений (бейджей). */
var BADGES = [
  { id: "first_steps", name: "Первые шаги", icon: "🐣", desc: "Завершить первые 5 уроков", check: function(c) { return [1,2,3,4,5].every(function(n){return c[n];}); } },
  { id: "condition_master", name: "Мастер условий", icon: "🔀", desc: "Пройти уроки по условиям (7-8,9-11)", check: function(c) { return [7,8,9,10,11].every(function(n){return c[n];}); } },
  { id: "string_ninja", name: "Струнный ниндзя", icon: "🔤", desc: "Пройти уроки по строкам (12,13,25)", check: function(c) { return [12,13,25].every(function(n){return c[n];}); } },
  { id: "loop_hero", name: "Повелитель циклов", icon: "🔄", desc: "Пройти уроки по циклам (16-20)", check: function(c) { return [16,17,18,19,20].every(function(n){return c[n];}); } },
  { id: "data_wizard", name: "Хранитель данных", icon: "🗂️", desc: "Пройти уроки по структурам данных (21-24,26)", check: function(c) { return [21,22,23,24,26].every(function(n){return c[n];}); } },
  { id: "halfway", name: "Экватор", icon: "🌍", desc: "Пройти 17+ уроков (половина курса)", check: function(c) { var n=0; for(var k in c){if(c[k])n++;} return n>=17; } },
  { id: "func_guru", name: "Мастер функций", icon: "⚙️", desc: "Пройти уроки 14-15 (функции)", check: function(c) { return [14,15].every(function(n){return c[n];}); } },
  { id: "module_explorer", name: "Исследователь модулей", icon: "🧰", desc: "Пройти уроки по модулям (29-32)", check: function(c) { return [29,30,31,32].every(function(n){return c[n];}); } },
  { id: "error_handler", name: "Ловец ошибок", icon: "⚠️", desc: "Пройти урок по try/except (27)", check: function(c) { return c[27]; } },
  { id: "oop_beginner", name: "Конструктор объектов", icon: "🏗️", desc: "Пройти урок по ООП (33)", check: function(c) { return c[33]; } },
  { id: "file_master", name: "Файловый маг", icon: "📁", desc: "Пройти урок по файлам (28)", check: function(c) { return c[28]; } },
  { id: "intermediate", name: "Продвинутый", icon: "🚀", desc: "Пройти продвинутые уроки (20,22,26)", check: function(c) { return [20,22,26].every(function(n){return c[n];}); } },
  { id: "final_project", name: "Финишёр", icon: "🏁", desc: "Завершить финальный проект (34)", check: function(c) { return c[34]; } },
  { id: "all_lessons", name: "Python-эксперт", icon: "👑", desc: "Пройти все 34 урока", check: function(c) { for(var i=1;i<=34;i++){if(!c[i])return false;} return true; } },
  { id: "speedrun", name: "Спидран", icon: "⚡", desc: "Пройти 3 урока за один день", check: function(c,h) { if(!h)return false; var t=new Date().toDateString(),n=0; for(var i=0;i<h.length;i++){if(new Date(h[i].date).toDateString()===t)n++;} return n>=3; } },
  { id: "quiz_champion", name: "Знаток тестов", icon: "🏅", desc: "Пройти итоговый тест на 90%+", check: function(c,h) { return h && h.finalTestScore >= 90; } },
  { id: "quiz_perfect", name: "Идеальный результат", icon: "🎯", desc: "Пройти итоговый тест на 100%", check: function(c,h) { return h && h.finalTestScore >= 100; } },
  { id: "streak_7", name: "Недельный марафон", icon: "🔥", desc: "Заниматься 7 дней подряд", check: function(c,h) { if(!h||!h.streak)return false; return h.streak>=7; } },
  { id: "repl_10", name: "Экспериментатор", icon: "🧪", desc: "Выполнить 10+ примеров кода в REPL/упражнениях", check: function(c,h) { return h && h.codeRuns >= 10; } },
  { id: "first_complete", name: "Первый пройденный", icon: "⭐", desc: "Завершить первый урок", check: function(c) { return c[1]; } }
];
