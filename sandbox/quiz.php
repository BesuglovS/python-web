<?php
/**
 * API квизов: отдаёт вопросы без правильных ответов и проверяет ответы
 * на сервере. Ключ (поле correct) и пояснения никогда не попадают в
 * статический JSON — каталог /quizzes закрыт на уровне веб-сервера
 * (.htaccess / nginx), а файлы читает только PHP из файловой системы.
 *
 * GET  ?lesson_number=N
 *      → {lesson_number, questions:[{question, options}]}
 * POST {action:'answer', lesson_number, question_idx, selected}
 *      → {question_idx, is_correct, correct, explanation}
 * POST {action:'grade', lesson_number, answers:[selected,...]}
 *      → {lesson_number, score, total, correct_count}
 *        Попытка и лучший балл записываются на сервере; клиентский балл
 *        не принимается.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCorsHeaders();
    http_response_code(200);
    exit;
}

setCorsHeaders();
Database::initialize();
Auth::requireLogin();
apiCheckRateLimit('quiz', 180, 60);

$userId = Auth::getUserId();
$db = Database::getInstance();

/**
 * Ответы текущей попытки храним на сервере (в сессии), по (урок).
 * Так grade считает балл по реально выбранным вариантам, а не по данным,
 * присланным клиентом: клиентские ответы и балл не принимаются.
 */
function quizSessionKey(int $lessonNumber): string {
    return 'quiz_answers_' . $lessonNumber;
}

function quizRecordedAnswers(int $lessonNumber): array {
    $key = quizSessionKey($lessonNumber);
    return (isset($_SESSION[$key]) && is_array($_SESSION[$key])) ? $_SESSION[$key] : [];
}

function quizRecordAnswer(int $lessonNumber, int $questionIdx, int $selected): int {
    $key = quizSessionKey($lessonNumber);
    if (!isset($_SESSION[$key]) || !is_array($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    if (!array_key_exists($questionIdx, $_SESSION[$key])) {
        $_SESSION[$key][$questionIdx] = $selected;
    }
    return (int) $_SESSION[$key][$questionIdx];
}

function quizResetAnswers(int $lessonNumber): void {
    unset($_SESSION[quizSessionKey($lessonNumber)]);
}

/**
 * Номер урока: 1..50 или -1 (итоговый тест). Остальное — отклоняем.
 */
function quizNormalizeLessonNumber($raw): ?int {
    if (!is_int($raw) && !(is_string($raw) && is_numeric($raw))) {
        return null;
    }
    $n = (int) $raw;
    if ($n !== -1 && ($n < 1 || $n > MAX_COURSE_LESSONS)) {
        return null;
    }
    return $n;
}

/**
 * Загружает вопросы квиза из quizzes/. Имя файла вычисляется из числа,
 * поэтому path traversal невозможен.
 *
 * @return array<int, array<string, mixed>>|null
 */
function quizLoadQuestions(int $lessonNumber): ?array {
    $file = $lessonNumber === -1 ? 'final-test.json' : $lessonNumber . '.json';
    $path = __DIR__ . '/../quizzes/' . $file;
    if (!is_file($path)) {
        return null;
    }
    $data = json_decode((string) file_get_contents($path), true);
    if (!is_array($data) || $data === []) {
        return null;
    }
    return array_values($data);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $lessonNumber = quizNormalizeLessonNumber($_GET['lesson_number'] ?? null);
    if ($lessonNumber === null) {
        jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
    }

    $questions = quizLoadQuestions($lessonNumber);
    if ($questions === null) {
        jsonResponse(['error' => 'Квиз не найден'], 404);
    }

    // Наружу отдаём только формулировку и варианты: correct/explanation
    // остаются на сервере до проверки ответа.
    $public = [];
    foreach ($questions as $q) {
        $public[] = [
            'question' => (string) ($q['question'] ?? ''),
            'options' => array_values(array_map('strval', (array) ($q['options'] ?? []))),
        ];
    }

    // Новый прогон квиза — старые ответы попытки сбрасываем.
    quizResetAnswers($lessonNumber);

    jsonResponse(['lesson_number' => $lessonNumber, 'questions' => $public]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
        jsonResponse(['error' => 'Content-Type must be application/json'], 415);
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['error' => 'Некорректный JSON'], 400);
    }

    $action = $input['action'] ?? '';
    $lessonNumber = quizNormalizeLessonNumber($input['lesson_number'] ?? null);
    if ($lessonNumber === null) {
        jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
    }

    $questions = quizLoadQuestions($lessonNumber);
    if ($questions === null) {
        jsonResponse(['error' => 'Квиз не найден'], 404);
    }
    $total = count($questions);

    if ($action === 'answer') {
        $rawIdx = $input['question_idx'] ?? null;
        $rawSelected = $input['selected'] ?? null;
        if (!is_numeric($rawIdx) || !is_numeric($rawSelected)) {
            jsonResponse(['error' => 'question_idx и selected обязательны'], 400);
        }
        $questionIdx = (int) $rawIdx;
        $selected = (int) $rawSelected;
        if ($questionIdx < 0 || $questionIdx >= $total) {
            jsonResponse(['error' => 'question_idx вне диапазона'], 400);
        }
        $question = $questions[$questionIdx];
        $optionCount = count((array) ($question['options'] ?? []));
        if ($selected < 0 || $selected >= $optionCount) {
            jsonResponse(['error' => 'selected вне диапазона'], 400);
        }
        $correct = (int) ($question['correct'] ?? -1);
        // Фиксируем первый выбор по вопросу; повторный ответ его не перезаписывает.
        $selected = quizRecordAnswer($lessonNumber, $questionIdx, $selected);

        jsonResponse([
            'question_idx' => $questionIdx,
            'is_correct' => $selected === $correct,
            'correct' => $correct,
            'explanation' => (string) ($question['explanation'] ?? ''),
        ]);
    }

    if ($action === 'grade') {
        // Балл считаем только по серверно записанным ответам попытки.
        $answers = quizRecordedAnswers($lessonNumber);

        $correctCount = 0;
        $log = [];
        foreach ($questions as $i => $question) {
            $selected = array_key_exists($i, $answers) ? (int) $answers[$i] : -1;
            $correct = (int) ($question['correct'] ?? -1);
            $isCorrect = $selected === $correct;
            if ($isCorrect) {
                $correctCount++;
            }
            $log[] = [
                'question_idx' => $i,
                'selected' => $selected,
                'correct' => $correct,
                'is_correct' => $isCorrect,
            ];
        }

        $score = (int) round($correctCount / $total * 100);

        $answersJson = json_encode($log, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt = $db->prepare(
            "INSERT INTO quiz_attempts (user_id, lesson_number, score, total_questions, correct_count, answers)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $lessonNumber, $score, $total, $correctCount, $answersJson]);

        // Лучший балл пишем на сервере; флаг completed здесь не трогаем
        // (его выставляет save/save_quiz-score админ или авто-завершение).
        $stmt = $db->prepare(
            "INSERT INTO progress (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
             VALUES (?, ?, 0, ?, NULL, datetime('now'))
             ON CONFLICT(user_id, lesson_number) DO UPDATE SET
               quiz_score = CASE
                 WHEN excluded.quiz_score IS NOT NULL AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score)
                 THEN excluded.quiz_score
                 ELSE progress.quiz_score
               END,
               updated_at = CASE
                 WHEN excluded.quiz_score IS NOT NULL
                      AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score)
                 THEN datetime('now')
                 ELSE progress.updated_at
               END"
        );
        $stmt->execute([$userId, $lessonNumber, $score]);

        // Попытка учтена — сбрасываем записанные ответы (следующий прогон с чистого листа).
        quizResetAnswers($lessonNumber);

        jsonResponse([
            'lesson_number' => $lessonNumber,
            'score' => $score,
            'total' => $total,
            'correct_count' => $correctCount,
        ]);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);
