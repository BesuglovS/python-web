<?php
/**
 * API достижений (бейджей) python-web.
 * GET  — получить заработанные бейджи
 * POST — пересчитать бейджи / увеличить счётчик REPL
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
    $stmt = $db->prepare("SELECT badge_id, earned_at FROM badges WHERE user_id = ? ORDER BY earned_at");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $badgeIds = array_map(function ($r) { return $r['badge_id']; }, $rows);
    $progress = computeAllBadgeProgress($db, $userId);
    jsonResponse(['badges' => $badgeIds, 'progress' => $progress]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action === 'check') {
        $earned = recalculateBadges($db, $userId);
        $progress = computeAllBadgeProgress($db, $userId);
        jsonResponse(['badges' => $earned, 'progress' => $progress]);
    }

    if ($action === 'increment_code_runs') {
        $stmt = $db->prepare(
            "INSERT INTO code_runs (user_id, run_count, updated_at)
             VALUES (?, 1, datetime('now'))
             ON CONFLICT(user_id) DO UPDATE SET
               run_count = run_count + 1,
               updated_at = datetime('now')"
        );
        $stmt->execute([$userId]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);

function recalculateBadges(PDO $db, int $userId): array {
    $progress = getCompletedProgress($db, $userId);
    $runCount = getRunCount($db, $userId);

    $completed = $progress['completed'];
    $quizScores = $progress['quizScores'];
    $dates = $progress['dates'];

    $badgeIds = [];

    // first_steps: уроки 1-5
    if (everyLesson($completed, [1, 2, 3, 4, 5])) {
        $badgeIds[] = 'first_steps';
    }

    // condition_master: уроки 9-13
    if (everyLesson($completed, [9, 10, 11, 12, 13])) {
        $badgeIds[] = 'condition_master';
    }

    // string_ninja: уроки 7,14,15,16
    if (everyLesson($completed, [7, 14, 15, 16])) {
        $badgeIds[] = 'string_ninja';
    }

    // loop_hero: уроки 17-21
    if (everyLesson($completed, [17, 18, 19, 20, 21])) {
        $badgeIds[] = 'loop_hero';
    }

    // data_wizard: уроки 25-31
    if (everyLesson($completed, [25, 26, 27, 28, 29, 30, 31])) {
        $badgeIds[] = 'data_wizard';
    }

    // halfway: 25+ уроков
    if (count($completed) >= 25) {
        $badgeIds[] = 'halfway';
    }

    // func_guru: уроки 22-24
    if (everyLesson($completed, [22, 23, 24])) {
        $badgeIds[] = 'func_guru';
    }

    // module_explorer: уроки 35-40
    if (everyLesson($completed, [35, 36, 37, 38, 39, 40])) {
        $badgeIds[] = 'module_explorer';
    }

    // error_handler: урок 11
    if (in_array(11, $completed)) {
        $badgeIds[] = 'error_handler';
    }

    // oop_master: уроки 41-42
    if (everyLesson($completed, [41, 42])) {
        $badgeIds[] = 'oop_master';
    }

    // file_master: уроки 32-34
    if (everyLesson($completed, [32, 33, 34])) {
        $badgeIds[] = 'file_master';
    }

    // tool_master: уроки 47-50
    if (everyLesson($completed, [47, 48, 49, 50])) {
        $badgeIds[] = 'tool_master';
    }

    // intermediate: уроки 21,25,30
    if (everyLesson($completed, [21, 25, 30])) {
        $badgeIds[] = 'intermediate';
    }

    // all_lessons: все 50 уроков
    $allDone = true;
    for ($i = 1; $i <= 50; $i++) {
        if (!in_array($i, $completed)) {
            $allDone = false;
            break;
        }
    }
    if ($allDone) {
        $badgeIds[] = 'all_lessons';
    }

    // first_complete: урок 1
    if (in_array(1, $completed)) {
        $badgeIds[] = 'first_complete';
    }

    // speedrun: 3+ урока за сегодня
    if (count($dates) > 0) {
        $today = date('Y-m-d');
        $todayCount = 0;
        foreach ($dates as $dateStr) {
            if ($dateStr === $today) {
                $todayCount++;
            }
        }
        if ($todayCount >= 3) {
            $badgeIds[] = 'speedrun';
        }
    }

    // quiz_champion: итоговый тест >= 90
    if (isset($quizScores[-1]) && $quizScores[-1] >= 90) {
        $badgeIds[] = 'quiz_champion';
    }

    // quiz_perfect: итоговый тест = 100
    if (isset($quizScores[-1]) && $quizScores[-1] >= 100) {
        $badgeIds[] = 'quiz_perfect';
    }

    // streak_7: 7+ дней подряд
    if (count($dates) > 0) {
        $uniqueDates = array_unique($dates);
        sort($uniqueDates);
        $maxStreak = 1;
        $currentStreak = 1;
        for ($i = 1; $i < count($uniqueDates); $i++) {
            $prev = new DateTime($uniqueDates[$i - 1]);
            $curr = new DateTime($uniqueDates[$i]);
            $diff = $prev->diff($curr)->days;
            if ($diff === 1) {
                $currentStreak++;
                if ($currentStreak > $maxStreak) {
                    $maxStreak = $currentStreak;
                }
            } elseif ($diff > 1) {
                $currentStreak = 1;
            }
        }
        if ($maxStreak >= 7) {
            $badgeIds[] = 'streak_7';
        }
    }

    // repl_10: 10+ запусков кода
    if ($runCount >= 10) {
        $badgeIds[] = 'repl_10';
    }

    $badgeIds = array_unique($badgeIds);

    // Сохраняем новые бейджи
    $stmt = $db->prepare(
        "INSERT OR IGNORE INTO badges (user_id, badge_id, earned_at)
         VALUES (?, ?, datetime('now'))"
    );
    foreach ($badgeIds as $bid) {
        $stmt->execute([$userId, $bid]);
    }

    return $badgeIds;
}

function getCompletedProgress(PDO $db, int $userId): array {
    $stmt = $db->prepare(
        "SELECT lesson_number, completed, quiz_score, completed_at, updated_at
         FROM progress
         WHERE user_id = ? AND completed = 1"
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $completed = [];
    $quizScores = [];
    $dates = [];

    foreach ($rows as $row) {
        $num = (int) $row['lesson_number'];
        $completed[] = $num;

        if ($row['quiz_score'] !== null) {
            $qs = (int) $row['quiz_score'];
            if (!isset($quizScores[$num]) || $qs > $quizScores[$num]) {
                $quizScores[$num] = $qs;
            }
        }

        // Используем completed_at (дата первого прохождения)
        // Для старых записей — fallback на updated_at
        $dateSrc = $row['completed_at'] ?? $row['updated_at'] ?? null;
        if ($dateSrc) {
            $dates[] = substr($dateSrc, 0, 10);
        }
    }

    return [
        'completed' => $completed,
        'quizScores' => $quizScores,
        'dates' => $dates,
    ];
}

function getRunCount(PDO $db, int $userId): int {
    $stmt = $db->prepare("SELECT run_count FROM code_runs WHERE user_id = ?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (int) $row['run_count'] : 0;
}

function everyLesson(array $completed, array $lessons): bool {
    foreach ($lessons as $n) {
        if (!in_array($n, $completed)) return false;
    }
    return true;
}

function countCompleted(array $completed, array $lessons): int {
    $count = 0;
    foreach ($lessons as $n) {
        if (in_array($n, $completed)) $count++;
    }
    return $count;
}

function computeAllBadgeProgress(PDO $db, int $userId): array {
    $progress = getCompletedProgress($db, $userId);
    $runCount = getRunCount($db, $userId);

    $completed = $progress['completed'];
    $quizScores = $progress['quizScores'];
    $dates = $progress['dates'];
    $totalCompleted = count($completed);

    $result = [];

    $result['first_complete'] = ['current' => in_array(1, $completed) ? 1 : 0, 'required' => 1];
    $result['first_steps'] = ['current' => countCompleted($completed, [1,2,3,4,5]), 'required' => 5];
    $result['condition_master'] = ['current' => countCompleted($completed, [9,10,11,12,13]), 'required' => 5];
    $result['string_ninja'] = ['current' => countCompleted($completed, [7,14,15,16]), 'required' => 4];
    $result['loop_hero'] = ['current' => countCompleted($completed, [17,18,19,20,21]), 'required' => 5];
    $result['data_wizard'] = ['current' => countCompleted($completed, [25,26,27,28,29,30,31]), 'required' => 7];
    $result['halfway'] = ['current' => $totalCompleted, 'required' => 25];
    $result['func_guru'] = ['current' => countCompleted($completed, [22,23,24]), 'required' => 3];
    $result['module_explorer'] = ['current' => countCompleted($completed, [35,36,37,38,39,40]), 'required' => 6];
    $result['error_handler'] = ['current' => in_array(11, $completed) ? 1 : 0, 'required' => 1];
    $result['oop_master'] = ['current' => countCompleted($completed, [41,42]), 'required' => 2];
    $result['file_master'] = ['current' => countCompleted($completed, [32,33,34]), 'required' => 3];
    $result['tool_master'] = ['current' => countCompleted($completed, [47,48,49,50]), 'required' => 4];
    $result['intermediate'] = ['current' => countCompleted($completed, [21,25,30]), 'required' => 3];
    $result['all_lessons'] = ['current' => $totalCompleted, 'required' => 50];

    // speedrun: count lessons completed today
    $todayCount = 0;
    $today = date('Y-m-d');
    foreach ($dates as $dateStr) {
        if ($dateStr === $today) $todayCount++;
    }
    $result['speedrun'] = ['current' => $todayCount, 'required' => 3];

    // quiz scores
    $quizScore = isset($quizScores[-1]) ? $quizScores[-1] : 0;
    $result['quiz_champion'] = ['current' => $quizScore, 'required' => 90];
    $result['quiz_perfect'] = ['current' => $quizScore, 'required' => 100];

    // streak: current consecutive day count
    $currentStreak = 0;
    if (count($dates) > 0) {
        $uniqueDates = array_unique($dates);
        rsort($uniqueDates);
        $todayDt = new DateTime($today);
        $expectedDt = clone $todayDt;
        foreach ($uniqueDates as $d) {
            $dDt = new DateTime($d);
            $diff = $expectedDt->diff($dDt)->days;
            if ($diff === 0 && $dDt <= $todayDt) {
                $currentStreak++;
                $expectedDt->modify('-1 day');
            } elseif ($diff === 1 && $dDt < $expectedDt) {
                $currentStreak++;
                $expectedDt->modify('-1 day');
            } else {
                break;
            }
        }
    }
    $result['streak_7'] = ['current' => $currentStreak, 'required' => 7];
    $result['repl_10'] = ['current' => $runCount, 'required' => 10];

    return $result;
}
