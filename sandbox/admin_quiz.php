<?php
/**
 * API администратора: квизы по классам.
 * GET ?action=groups                 — список групп (классов)
 * GET ?action=class_progress&group_id=N — прогресс учеников группы
 * GET ?action=attempts&user_id=N&lesson_number=M — попытки ученика
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/AuthClient.php';

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

    jsonResponse(['students' => array_values($students)]);
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
