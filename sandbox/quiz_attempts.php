<?php
/**
 * API попыток квизов (только чтение).
 * GET — получить попытки (админ: любые, пользователь: свои).
 *
 * Запись попыток выполняется исключительно в sandbox/quiz.php после
 * серверной проверки ответов — клиент не может прислать «свой» балл.
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
apiCheckRateLimit('quiz_attempts', 120, 60);

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

jsonResponse(['error' => 'Метод не поддерживается'], 405);
