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
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
        jsonResponse(['error' => 'Content-Type must be application/json'], 415);
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['error' => 'Некорректный JSON'], 400);
    }
    $action = $input['action'] ?? '';

    try {

    /**
     * Номер урока: 1..50 или -1 (итоговый тест). Остальное — отклоняем.
     */
    function normalizeLessonNumber($raw): ?int {
        $n = isset($raw) ? (int) $raw : null;
        if ($n === null || ($n !== -1 && ($n < 1 || $n > MAX_COURSE_LESSONS))) {
            return null;
        }
        return $n;
    }

    /** Оценка квиза строго 0..100 либо null. */
    function normalizeQuizScore($raw): ?int {
        if (!isset($raw)) return null;
        $s = (int) $raw;
        if ($s < 0 || $s > 100) return null;
        return $s;
    }

    /**
     * Гейт контеста: для уроков с контестом completed=1 принимается только
     * при решённом контесте РЕШЕНЬЯ ученика (user_id), а не текущей сессии —
     * прогресс по контесту принадлежит ученику, а не автору запроса.
     */
    function contestGateCompleted(int $lessonNumber, int $completed, ?int $userId, array &$contestCache): int {
        if (!$completed) {
            return 0;
        }
        $contestId = contestIdForLesson($lessonNumber);
        if ($contestId === null) {
            return 1;
        }
        $cacheKey = $contestId . ':' . ($userId ?? 'self');
        if (!array_key_exists($cacheKey, $contestCache)) {
            $contestCache[$cacheKey] = checkContestCompleted($contestId, $userId);
        }
        // null (сервис недоступен) трактуем как «не блокировать» — как и раньше.
        return $contestCache[$cacheKey] === false ? 0 : 1;
    }

    if ($action === 'save') {
        $lessonNumber = normalizeLessonNumber($input['lesson_number'] ?? null);
        $completed = !empty($input['completed']) ? 1 : 0;
        $quizScore = normalizeQuizScore($input['quiz_score'] ?? null);

        if ($lessonNumber === null) {
            jsonResponse(['error' => 'lesson_number обязателен и должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
        }

        $contestCache = [];
        $completed = contestGateCompleted($lessonNumber, $completed, $userId, $contestCache);

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

        // Финальное состояние флага — клиент обязан отображать его, а не локальное.
        jsonResponse(['success' => true, 'lesson_number' => $lessonNumber, 'completed' => (int) $completed]);
    }

    /**
     * Запись только оценки квиза (запрос квиза не меняет флаг completed:
     * решённый урок нельзя «снять» повторной попыткой квиза).
     */
    if ($action === 'save_quiz_score') {
        $lessonNumber = normalizeLessonNumber($input['lesson_number'] ?? null);
        $quizScore = normalizeQuizScore($input['quiz_score'] ?? null);

        if ($lessonNumber === null) {
            jsonResponse(['error' => 'lesson_number обязателен и должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
        }

        $stmt = $db->prepare(
            "INSERT INTO progress (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
             VALUES (?, ?, 0, ?,
               NULL,
               datetime('now'))
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
        $stmt->execute([$userId, $lessonNumber, $quizScore]);

        jsonResponse(['success' => true, 'lesson_number' => $lessonNumber]);
    }

    if ($action === 'bulk_save') {
        $items = $input['items'] ?? [];
        if (!is_array($items)) {
            jsonResponse(['error' => 'items должен быть массивом'], 400);
        }
        if (count($items) > MAX_BULK_ITEMS) {
            jsonResponse(['error' => 'Слишком много элементов в items (максимум ' . MAX_BULK_ITEMS . ')'], 400);
        }

        // Проверки контестов выносим из цикла: уникальные contest_id,
        // один HTTP-вызов на каждый вместо N повторов.
        $contestCache = [];
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
        $db->beginTransaction();
        try {
            foreach ($items as $item) {
                if (!is_array($item)) continue;
                $lessonNumber = normalizeLessonNumber($item['lesson_number'] ?? null);
                if ($lessonNumber === null) continue;
                $completed = !empty($item['completed']) ? 1 : 0;
                $quizScore = normalizeQuizScore($item['quiz_score'] ?? null);

                $completed = contestGateCompleted($lessonNumber, $completed, $userId, $contestCache);

                $stmt->execute([$userId, $lessonNumber, $completed, $quizScore, $completed]);
                $count++;
            }
            $db->commit();
        } catch (Throwable $inner) {
            $db->rollBack();
            throw $inner;
        }

        reportCourseSummary($userId);

        jsonResponse(['success' => true, 'saved' => $count]);
    }

    } catch (PDOException $e) {
        error_log('progress.php PDO: ' . $e->getMessage());
        jsonResponse(['error' => 'Ошибка базы данных. Попробуйте позже.'], 500);
    } catch (Throwable $e) {
        error_log('progress.php: ' . $e->getMessage());
        jsonResponse(['error' => 'Внутренняя ошибка сервера'], 500);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);
