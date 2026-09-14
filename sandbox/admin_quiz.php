<?php
/**
 * API администратора: квизы по классам.
 * GET  ?action=groups                 — список групп (классов)
 * GET  ?action=class_progress&group_id=N — прогресс учеников группы
 * GET  ?action=attempts&user_id=N&lesson_number=M — попытки ученика
 * GET  ?action=recent&limit=N       — последние по времени решённые квизы
 * POST {action:'mark_quiz', user_id, lesson_number, quiz_score, completed}
 *      — записать ученику пройденный квиз (только админ).
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/AuthClient.php';
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
Auth::requireAdmin();

$action = $_GET['action'] ?? '';

/**
 * POST: админ записывает ученику пройденный квиз (см. mark_quiz ниже).
 * Защита от CSRF: POST только с Content-Type: application/json (как в
 * progress.php) + SameSite=Lax кука + CORS-whitelist.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
        jsonResponse(['error' => 'Content-Type must be application/json'], 415);
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['error' => 'Некорректный JSON'], 400);
    }

    try {
        $postAction = $input['action'] ?? '';

        if ($postAction === 'clear_quiz') {
            $clearUserId = isset($input['user_id']) ? (int) $input['user_id'] : 0;
            if ($clearUserId <= 0) {
                jsonResponse(['error' => 'user_id обязателен'], 400);
            }

            $clearLesson = isset($input['lesson_number']) ? (int) $input['lesson_number'] : null;
            if ($clearLesson === null || ($clearLesson !== -1 && ($clearLesson < 1 || $clearLesson > MAX_COURSE_LESSONS))) {
                jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
            }

            // Обученость: идентифицируем ученика через auth-web
            $fFound = false;
            foreach ((AuthClient::getUsers() ?? []) as $u) {
                if ((int) ($u['id'] ?? 0) === $clearUserId) {
                    $fFound = true;
                }
            }
            if (!$fFound) {
                jsonResponse(['error' => 'Ученик не найден'], 404);
            }

            $db = Database::getInstance();
            $stmt = $db->prepare('DELETE FROM progress WHERE user_id = ? AND lesson_number = ?');
            $stmt->execute([$clearUserId, $clearLesson]);
            $deleted = $stmt->rowCount() > 0;

            // сводка курса в auth-web: пересчитать
            try {
                $stmt = $db->prepare("SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1");
                $stmt->execute([$clearUserId]);
                $done = (int) $stmt->fetchColumn();
                ProgressReporter::report($clearUserId, 'python', $done, MAX_COURSE_LESSONS);
            } catch (Throwable $e) {
                error_log('admin_quiz clear_quiz report: ' . $e->getMessage());
            }

            jsonResponse([
                'success' => true,
                'deleted' => $deleted,
                'lesson_number' => $clearLesson,
            ]);
        }

        if ($postAction !== 'mark_quiz') {
            jsonResponse(['error' => 'Неизвестное действие'], 400);
        }

        $userId = isset($input['user_id']) ? (int) $input['user_id'] : 0;
        if ($userId <= 0) {
            jsonResponse(['error' => 'user_id обязателен'], 400);
        }

            // Ученик должен существовать в auth-web (не числится ли id случайно)
            $found = false;
            foreach ((AuthClient::getUsers() ?? []) as $u) {
                if ((int) ($u['id'] ?? 0) === $userId) {
                    $found = !empty($u['is_admin']) ? false : true;
                }
            }
            if (!$found) {
                jsonResponse(['error' => 'Ученик не найден'], 404);
            }

        $lessonNumber = isset($input['lesson_number']) ? (int) $input['lesson_number'] : null;
        if ($lessonNumber === null || ($lessonNumber !== -1 && ($lessonNumber < 1 || $lessonNumber > MAX_COURSE_LESSONS))) {
            jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS . ' (или -1 для итогового теста)'], 400);
        }

        $quizScore = isset($input['quiz_score']) ? (int) $input['quiz_score'] : null;
        if ($quizScore !== null && ($quizScore < 0 || $quizScore > 100)) {
            jsonResponse(['error' => 'quiz_score должен быть от 0 до 100 (или null)'], 400);
        }

        $completed = !empty($input['completed']) ? 1 : 0;

        // Контест-привязка: уроки с контестом считаются пройденными только
        // совместно с решением контеста — прогресс проверяется УЧЕНИКА,
        // у которого ставится отметка, а не сессии админа (та же логика, что в progress.php).
        $contestOk = null;
        $contestId = contestIdForLesson($lessonNumber);
        if ($completed && $contestId !== null) {
            $contestOk = checkContestCompleted($contestId, $userId);
            if ($contestOk === false) {
                $completed = 0;
            }
        }

        $db = Database::getInstance();
        $stmt = $db->prepare(
            "INSERT INTO progress (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
             VALUES (?, ?, ?, ?,
               CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
               datetime('now'))
             ON CONFLICT(user_id, lesson_number) DO UPDATE SET
               completed = CASE WHEN excluded.completed = 1 THEN 1 ELSE progress.completed END,
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
               updated_at = datetime('now')"
        );
        $stmt->execute([$userId, $lessonNumber, $completed, $quizScore, $completed]);

        // Сводка курса в auth-web: пересчитать как в progress.php
        try {
            $stmt = $db->prepare("SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1");
            $stmt->execute([$userId]);
            $done = (int) $stmt->fetchColumn();
            ProgressReporter::report($userId, 'python', $done, MAX_COURSE_LESSONS);
        } catch (Throwable $e) {
            error_log('admin_quiz mark_quiz report: ' . $e->getMessage());
        }

        jsonResponse([
            'success' => true,
            'lesson_number' => $lessonNumber,
            'quiz_score' => $quizScore,
            'completed' => $completed,
            'contest_ok' => $contestOk,
        ]);
    } catch (PDOException $e) {
        error_log('admin_quiz POST PDO: ' . $e->getMessage());
        jsonResponse(['error' => 'Ошибка базы данных. Попробуйте позже.'], 500);
    } catch (Throwable $e) {
        error_log('admin_quiz POST: ' . $e->getMessage());
        jsonResponse(['error' => 'Внутренняя ошибка сервера'], 500);
    }
}

if ($action === 'groups') {
    $groups = AuthClient::getGroups();
    jsonResponse(['groups' => $groups ?? []]);
}

if ($action === 'class_progress') {
    $groupId = (int) ($_GET['group_id'] ?? 0);
    if ($groupId <= 0) {
        jsonResponse(['error' => 'group_id обязателен'], 400);
    }

    $memberships = AuthClient::getMemberships() ?? [];
    $userIds = [];
    foreach ($memberships as $m) {
        if ((int) $m['group_id'] === $groupId) {
            $userIds[] = (int) $m['user_id'];
        }
    }

    if (empty($userIds)) {
        jsonResponse(['students' => []]);
    }

    $users = AuthClient::getUsers() ?? [];
    $usersMap = [];
    foreach ($users as $u) {
        $uid = (int) $u['id'];
        $usersMap[$uid] = $u['display_name'] ?? $u['login'] ?? 'ID:' . $uid;
    }

    $db = Database::getInstance();
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $stmt = $db->prepare(
        "SELECT user_id, lesson_number, completed, quiz_score
         FROM progress
         WHERE user_id IN ($placeholders)"
    );
    $stmt->execute($userIds);
    $progress = $stmt->fetchAll();

    $students = [];
    foreach ($userIds as $uid) {
        $students[$uid] = [
            'id' => $uid,
            'name' => $usersMap[$uid] ?? 'ID:' . $uid,
            'lessons' => [],
        ];
    }
    foreach ($progress as $row) {
        $uid = (int) $row['user_id'];
        if (isset($students[$uid])) {
            $num = (int) $row['lesson_number'];
            $students[$uid]['lessons'][$num] = [
                'completed' => (int) $row['completed'],
                'quiz_score' => $row['quiz_score'] !== null ? (int) $row['quiz_score'] : null,
            ];
        }
    }

    foreach ($students as &$s) {
        ksort($s['lessons']);
    }
    unset($s);

    $maxLesson = 0;
    foreach ($students as $s) {
        foreach ($s['lessons'] as $num => $lesson) {
            if ($num > 0 && $lesson['quiz_score'] !== null && $num > $maxLesson) {
                $maxLesson = $num;
            }
        }
    }

    jsonResponse(['students' => array_values($students), 'max_lesson_with_quizzes' => $maxLesson]);
}

if ($action === 'recent') {
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
    if ($limit < 1) {
        $limit = 100;
    }
    if ($limit > 500) {
        $limit = 500;
    }

    $db = Database::getInstance();

    // Последние по времени попытки из quiz_attempts.
    // Лучший балл из progress (если записи нет — берём балл попытки).
    $stmt = $db->prepare(
        "SELECT qa.user_id, qa.lesson_number, qa.score, qa.total_questions,
                qa.correct_count, qa.attempted_at,
                p.quiz_score AS best_score, p.completed AS completed
         FROM quiz_attempts qa
         LEFT JOIN progress p
           ON p.user_id = qa.user_id AND p.lesson_number = qa.lesson_number
         WHERE qa.id IN (
           SELECT id FROM quiz_attempts ORDER BY attempted_at DESC, id DESC LIMIT ?
         )
         ORDER BY qa.attempted_at DESC, qa.id DESC"
    );
    $stmt->execute([$limit]);
    $rows = $stmt->fetchAll();

    // Имена из auth-web
    $usersMap = [];
    foreach ((AuthClient::getUsers() ?? []) as $u) {
        $uid = (int) $u['id'];
        $usersMap[$uid] = $u['display_name'] ?? $u['login'] ?? 'ID:' . $uid;
    }

    $recent = [];
    foreach ($rows as $row) {
        $uid = (int) $row['user_id'];
        $lesson = (int) $row['lesson_number'];
        $recent[] = [
            'user_id' => $uid,
            'name' => $usersMap[$uid] ?? 'ID:' . $uid,
            'lesson_number' => $lesson,
            'score' => (int) $row['score'],
            'best_score' => $row['best_score'] !== null ? (int) $row['best_score'] : null,
            'completed' => $row['completed'] !== null ? (int) $row['completed'] : null,
            'total_questions' => (int) $row['total_questions'],
            'correct_count' => (int) $row['correct_count'],
            'attempted_at' => $row['attempted_at'],
        ];
    }

    jsonResponse(['recent' => $recent]);
}

if ($action === 'attempts') {
    $targetUserId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;
    if ($targetUserId === null || $targetUserId <= 0) {
        jsonResponse(['error' => 'user_id обязателен'], 400);
    }

    $lessonNumber = isset($_GET['lesson_number']) ? (int) $_GET['lesson_number'] : null;

    $db = Database::getInstance();

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

jsonResponse(['error' => 'Неизвестное действие'], 400);
