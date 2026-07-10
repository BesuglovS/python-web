<?php
/**
 * Серверная валидация ответов итогового теста.
 * Принимает JSON: {"answers": {"1": "a", "2": "b", ...}}
 * Возвращает: {"score": 85, "total": 51, "correct": [1,3,...], "wrong": [2,...], "certificate": "uuid"}
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён. Используйте POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['answers']) || !is_array($input['answers'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ожидается JSON с полем answers (словарь номер_вопроса → ответ).'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Эталонные ответы (номер вопроса → правильный вариант)
$correctAnswers = [
    // Раздел 1: Введение и основы (1-5)
    1  => 'd', // Что такое Python?
    2  => 'a', // Какая IDE рекомендуется?
    3  => 'b', // Как объявить переменную в Python?
    4  => 'c', // Какой тип у значения 3.14?
    5  => 'b', // Какой результат у int("42")?
    // Раздел 2: Операции и типы (6-12)
    6  => 'a', // Функция для вывода на экран
    7  => 'c', // Что выведет: print(f"{2+2}")?
    8  => 'd', // Результат 10 % 3
    9  => 'b', // Тип булевых значений
    10 => 'a', // Ключевое слово для условия
    11 => 'c', // Блок для перехвата исключений
    12 => 'd', // Логический оператор "и"
    // Раздел 3: Строки и структуры (13-20)
    13 => 'b', // Вложенный if — это...
    14 => 'a', // Что такое срез строки?
    15 => 'c', // Метод для замены подстроки
    16 => 'b', // Модуль для регулярных выражений
    17 => 'a', // Цикл с предусловием
    18 => 'c', // Как перебрать элементы списка в цикле?
    19 => 'd', // Что возвращает range(5)?
    20 => 'b', // Оператор для выхода из цикла
    // Раздел 4: Циклы и функции (21-28)
    21 => 'a', // Цикл внутри цикла
    22 => 'c', // Ключевое слово для объявления функции
    23 => 'd', // *args в функции — это...
    24 => 'b', // Инструмент для отладки
    25 => 'a', // Как создать пустой список?
    26 => 'c', // Чем множество отличается от списка?
    27 => 'b', // Чем кортеж отличается от списка?
    28 => 'a', // Как получить значение из словаря?
    29 => 'c', // Метод для объединения строк
    30 => 'b', // Синтаксис list comprehension
    // Раздел 5: Продвинутые темы (31-38)
    31 => 'a', // Что такое lambda-функция?
    32 => 'c', // Режим открытия файла для чтения
    33 => 'b', // Модуль для работы с JSON
    34 => 'a', // SQLite — это...
    35 => 'c', // Ключевое слово для импорта модуля
    36 => 'd', // Что делает itertools.permutations?
    37 => 'b', // Команда для создания виртуального окружения
    38 => 'a', // Что делает random.randint(1, 10)?
    // Раздел 6: Библиотеки и ООП (39-45)
    39 => 'c', // Как получить текущую дату?
    40 => 'b', // DataFrame — структура из какой библиотеки?
    41 => 'a', // Конструктор класса в Python
    42 => 'c', // Как объявить наследование?
    43 => 'd', // Синтаксис декоратора
    44 => 'b', // Ключевое слово для генератора
    45 => 'a', // Модуль для многопоточности
    // Раздел 7: Инструменты разработки (46-51)
    46 => 'b', // Type hints в Python
    47 => 'a', // Фреймворк для тестирования
    48 => 'c', // Библиотека для HTTP-запросов
    49 => 'd', // Микрофреймворк для веб-приложений
    50 => 'a', // Команда git для сохранения изменений
    51 => 'b', // Что делает git push?
];

$answers = $input['answers'];
$correct = [];
$wrong = [];
$total = count($correctAnswers);
$score = 0;

foreach ($correctAnswers as $questionNum => $correctOption) {
    $userAnswer = $answers[(string)$questionNum] ?? $answers[$questionNum] ?? null;
    if ($userAnswer !== null && strtolower(trim($userAnswer)) === $correctOption) {
        $correct[] = (int)$questionNum;
        $score++;
    } else {
        $wrong[] = (int)$questionNum;
    }
}

$percentage = round($score / $total * 100, 1);

// Генерация сертификата (упрощённый UUID-v4, не криптографический)
$certificate = null;
if ($percentage >= 70) {
    $certificate = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

echo json_encode([
    'score'       => $score,
    'total'       => $total,
    'percentage'  => $percentage,
    'correct'     => $correct,
    'wrong'       => $wrong,
    'passed'      => $percentage >= 70,
    'certificate' => $certificate,
], JSON_UNESCAPED_UNICODE);
