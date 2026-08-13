<?php
/**
 * API прогресса python-web.
 * GET  — загрузить прогресс текущего пользователя
 * POST — сохранить прогресс урока
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/contest_map.php';
require_once __DIR__ . '/ProgressReporter.php';

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

/**
 * Отчёт курса в единый API прогресса (auth-web) для сводной карточки ученика.
 */
function reportCourseSummary(int $userId): void {
    try {
        $lessonsFile = __DIR__ . '/../lessons.json';
        $total = 50;
        if (is_file($lessonsFile)) {
            $meta = json_decode((string) file_get_contents($lessonsFile), true);
            $total = (int) ($meta['total'] ?? 50);
        }
        if ($total < 1) {
            return;
        }
        $stmt = Database::getInstance()->prepare("SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1");
        $stmt->execute([$userId]);
        $completed = (int) $stmt->fetchColumn();
        ProgressReporter::report($userId, 'python', $completed, $total);
    } catch (Throwable $e) {
        // Не ломаем основной флоу при сбое отчёта
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT lesson_number, completed, quiz_score FROM progress WHERE user_id = ?");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    jsonResponse(['progress' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    try {

    if ($action === 'save') {
        $lessonNumber = isset($input['lesson_number']) ? (int) $input['lesson_number'] : null;
        $completed = !empty($input['completed']) ? 1 : 0;
        $quizScore = isset($input['quiz_score']) ? (int) $input['quiz_score'] : null;

        if ($lessonNumber === null) {
            jsonResponse(['error' => 'lesson_number обязателен'], 400);
        }

        $contestId = contestIdForLesson($lessonNumber);
        if ($completed && $contestId !== null) {
            $contestOk = checkContestCompleted($contestId);
            if ($contestOk === false) {
                $completed = 0;
            }
        }

        $stmt = $db->prepare(
            "INSERT INTO progress (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
             VALUES (?, ?, ?, ?,
               CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
               datetime('now'))
             ON CONFLICT(user_id, lesson_number) DO UPDATE SET
               completed = excluded.completed,
               quiz_score = CASE
                 WHEN excluded.quiz_score IS NOT NULL AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score)
                 THEN excluded.quiz_score
                 ELSE progress.quiz_score
               END,
               completed_at = CASE
                 WHEN excluded.completed = 1 AND progress.completed = 0 AND progress.completed_at IS NULL
                 THEN datetime('now')
                 ELSE progress.completed_at
               END,
               updated_at = CASE
                 WHEN excluded.completed != progress.completed
                      OR (excluded.quiz_score IS NOT NULL
                          AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score))
                 THEN datetime('now')
                 ELSE progress.updated_at
               END"
        );
        $stmt->execute([$userId, $lessonNumber, $completed, $quizScore, $completed]);

        reportCourseSummary($userId);

        jsonResponse(['success' => true]);
    }

    if ($action === 'bulk_save') {
        $items = $input['items'] ?? [];
        if (!is_array($items)) {
            jsonResponse(['error' => 'items должен быть массивом'], 400);
        }

        $stmt = $db->prepare(
            "INSERT INTO progress (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
             VALUES (?, ?, ?, ?,
               CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
               datetime('now'))
             ON CONFLICT(user_id, lesson_number) DO UPDATE SET
               completed = excluded.completed,
               quiz_score = CASE
                 WHEN excluded.quiz_score IS NOT NULL AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score)
                 THEN excluded.quiz_score
                 ELSE progress.quiz_score
               END,
               completed_at = CASE
                 WHEN excluded.completed = 1 AND progress.completed = 0 AND progress.completed_at IS NULL
                 THEN datetime('now')
                 ELSE progress.completed_at
               END,
               updated_at = CASE
                 WHEN excluded.completed != progress.completed
                      OR (excluded.quiz_score IS NOT NULL
                          AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score))
                 THEN datetime('now')
                 ELSE progress.updated_at
               END"
        );

        $count = 0;
        foreach ($items as $item) {
            $lessonNumber = isset($item['lesson_number']) ? (int) $item['lesson_number'] : null;
            if ($lessonNumber === null) continue;
            $completed = !empty($item['completed']) ? 1 : 0;
            $quizScore = isset($item['quiz_score']) ? (int) $item['quiz_score'] : null;

            $contestId = contestIdForLesson($lessonNumber);
            if ($completed && $contestId !== null) {
                $contestOk = checkContestCompleted($contestId);
                if ($contestOk === false) {
                    $completed = 0;
                }
            }

            $stmt->execute([$userId, $lessonNumber, $completed, $quizScore, $completed]);
            $count++;
        }

        reportCourseSummary($userId);

        jsonResponse(['success' => true, 'saved' => $count]);
    }

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);
