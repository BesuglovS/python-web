<?php
/**
 * Разовая коррекция данных (backfill): ученики с quiz_score = 100
 * на уроках с контестом, у которых completed = 0 (последствие бага
 * администраторского гейта: раньше контест проверялся по сессии админа,
 * а не по прогрессу ученика).
 *
 * Для каждого ученика проверяет прогресс контеста по его user_id через API
 * contest-web (параметр user_id доступен админу) и выставляет completed=1,
 * если контест решён полностью. Работает только из CLI.
 *
 * Запуск на сервере:
 *   php scripts/backfill_contest_progress.php --session=<значение куки auth_session админа>
 *   dry-run (без изменений БД, только отчёт):
 *   php scripts/backfill_contest_progress.php --session=... --dry
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only');
}

require dirname(__DIR__) . '/sandbox/config.php';
require dirname(__DIR__) . '/sandbox/Database.php';
require dirname(__DIR__) . '/sandbox/Auth.php';
require dirname(__DIR__) . '/sandbox/contest_map.php';

$session = '';
$dryRun = false;
foreach ($argv as $arg) {
    if (preg_match('/^--session=(.+)$/', $arg, $m)) {
        $session = preg_replace('/[^A-Za-z0-9,_\-]/', '', $m[1]) ?? '';
    }
    if ($arg === '--dry') {
        $dryRun = true;
    }
}

if ($session === '') {
    fwrite(STDERR, "Использование: php scripts/backfill_contest_progress.php --session=<auth_session админа> [--dry]\n");
    exit(1);
}

/** Прогресс контеста ученика: true/false/null (null — сервис недоступен). */
function fetchContestCompleted(int $contestId, int $userId, string $session): ?bool
{
    $url = CONTEST_URL . '/index.php?page=api&endpoint=contest_progress'
        . '&contest_id=' . $contestId . '&user_id=' . $userId;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_COOKIE => 'auth_session=' . $session,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }
    $data = json_decode((string) $response, true);
    return is_array($data) ? (!empty($data['completed'])) : null;
}

$db = Database::getInstance();
$changed = $serviceFailures = $notSolved = 0;

$rows = $db->query(
    "SELECT user_id, lesson_number, quiz_score
     FROM progress
     WHERE quiz_score = 100 AND completed = 0
     ORDER BY user_id, lesson_number"
)->fetchAll();

echo 'Записей-кандидатов: ' . count($rows) . "\n";

$stmtUpdate = $db->prepare(
    "UPDATE progress SET completed = 1, completed_at = datetime('now'), updated_at = datetime('now')
     WHERE user_id = ? AND lesson_number = ? AND completed = 0"
);

$summaryUsers = [];

foreach ($rows as $row) {
    $userId = (int) $row['user_id'];
    $lessonNumber = (int) $row['lesson_number'];
    $contestId = contestIdForLesson($lessonNumber);
    if ($contestId === null) {
        continue; // урок без контеста: completed=0 не мешает отметке квиза
    }

    $ok = fetchContestCompleted($contestId, $userId, $session);
    if ($ok === null) {
        $serviceFailures++;
        echo "[fail] user {$userId}, контест {$contestId} (урок {$lessonNumber}): сервис недоступен\n";
        continue;
    }
    if ($ok !== true) {
        $notSolved++;
        echo "[skip] user {$userId}, контест {$contestId} (урок {$lessonNumber}): контест не решён\n";
        continue;
    }

    echo "[mark] user {$userId}, урок {$lessonNumber} -> completed=1\n";
    $summaryUsers[$userId] = true;
    if (!$dryRun) {
        $stmtUpdate->execute([$userId, $lessonNumber]);
        $changed++;
    }
}

if (!$dryRun && count($summaryUsers) > 0) {
    // Пересчитаем сводку курса в auth-web для затронутых учеников
    try {
        require_once __DIR__ . '/../sandbox/ProgressReporter.php';
        foreach (array_keys($summaryUsers) as $uid) {
            $stmt = $db->prepare('SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1');
            $stmt->execute([$uid]);
            $done = (int) $stmt->fetchColumn();
            try {
                ProgressReporter::report($uid, 'python', $done, MAX_COURSE_LESSONS);
            } catch (Throwable $e) {
                fwrite(STDERR, 'ProgressReporter(user ' . (int) $uid . '): ' . $e->getMessage() . "\n");
            }
        }
    } catch (Throwable $e) {
        fwrite(STDERR, 'ProgressReporter общий сбой: ' . $e->getMessage() . "\n");
    }
}

$dry = $dryRun ? ' (DRY RUN — изменения не применены)' : '';
echo "Итог{$dry}: отмечено={$changed}, не решён={$notSolved}, сервис недоступен={$serviceFailures}\n";
exit($serviceFailures > 0 ? 2 : 0);
