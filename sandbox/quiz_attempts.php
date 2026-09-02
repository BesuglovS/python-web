<?php
/**
 * API попыток квизов.
 * POST  — сохранить попытку квиза
 * GET   — получить попытки (админ: любые, пользователь: свои)
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

$userId = Auth::getUserId();
$db = Database::getInstance();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $targetUserId = $userId;
    if (isset($_GET['user_id']) && Auth::isAdmin()) {
        $targetUserId = (int) $_GET['user_id'];
    }

    $lessonNumber = isset($_GET['lesson_number']) ? (int) $_GET['lesson_number'] : null;

    if ($lessonNumber !== null && ($lessonNumber === -1 || ($lessonNumber >= 1 && $lessonNumber <= MAX_COURSE_LESSONS))) {
        $stmt = $db->prepare(
            "SELECT id, score, total_questions, correct_count, answers, attempted_at
             FROM quiz_attempts
             WHERE user_id = ? AND lesson_number = ?
             ORDER BY attempted_at DESC"
        );
        $stmt->execute([$targetUserId, $lessonNumber]);
    } else {
        $stmt = $db->prepare(
            "SELECT id, lesson_number, score, total_questions, correct_count, answers, attempted_at
             FROM quiz_attempts
             WHERE user_id = ?
             ORDER BY lesson_number, attempted_at DESC"
        );
        $stmt->execute([$targetUserId]);
    }

    $attempts = $stmt->fetchAll();
    foreach ($attempts as &$a) {
        if ($a['answers'] !== null) {
            $a['answers'] = json_decode($a['answers'], true);
        }
        $a['score'] = (int) $a['score'];
        $a['total_questions'] = (int) $a['total_questions'];
        $a['correct_count'] = (int) $a['correct_count'];
    }
    unset($a);

    jsonResponse(['attempts' => $attempts]);
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

    if ($action === 'save_attempt') {
        $lessonNumber = isset($input['lesson_number']) ? (int) $input['lesson_number'] : null;
        if ($lessonNumber === null || ($lessonNumber !== -1 && ($lessonNumber < 1 || $lessonNumber > MAX_COURSE_LESSONS))) {
            jsonResponse(['error' => 'lesson_number обязателен (1-50 или -1)'], 400);
        }

        $score = isset($input['score']) ? (int) $input['score'] : null;
        if ($score === null || $score < 0 || $score > 100) {
            jsonResponse(['error' => 'score обязателен (0-100)'], 400);
        }

        $totalQuestions = isset($input['total_questions']) ? (int) $input['total_questions'] : null;
        if ($totalQuestions === null || $totalQuestions < 1) {
            jsonResponse(['error' => 'total_questions обязателен'], 400);
        }

        $correctCount = isset($input['correct_count']) ? (int) $input['correct_count'] : null;
        if ($correctCount === null || $correctCount < 0) {
            jsonResponse(['error' => 'correct_count обязателен'], 400);
        }

        $answers = $input['answers'] ?? null;
        $answersJson = null;
        if ($answers !== null) {
            if (!is_array($answers)) {
                jsonResponse(['error' => 'answers должен быть массивом'], 400);
            }
            $answersJson = json_encode($answers, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($answersJson === false) {
                jsonResponse(['error' => 'Ошибка кодирования answers'], 400);
            }
        }

        $stmt = $db->prepare(
            "INSERT INTO quiz_attempts (user_id, lesson_number, score, total_questions, correct_count, answers)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $lessonNumber, $score, $totalQuestions, $correctCount, $answersJson]);

        jsonResponse(['success' => true, 'attempt_id' => (int) $db->lastInsertId()]);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);
