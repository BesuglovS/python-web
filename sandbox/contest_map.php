<?php
/**
 * Соответствие урока → ID контеста для серверной проверки прогресса.
 * Источник истины — lessons.json (поле "contest" у урока).
 * Должно совпадать с THEORY_CONTESTS в src/js/config/courseData.js.
 * При изменении lessons.json обновите этот файл (или генерируйте скриптом).
 */
function contestIdForLesson(int $lessonNum): ?int
{
    $map = [
        8 => 7, 10 => 8, 12 => 10, 15 => 9, 17 => 12, 19 => 13,
        21 => 14, 22 => 11, 25 => 16, 26 => 15, 27 => 17, 28 => 20,
        29 => 18, 30 => 19,
    ];
    return $map[$lessonNum] ?? null;
}

/**
 * Проверяет, что пользователь решил все задачи контеста.
 * Возвращает:
 *   true  — контест решён полностью
 *   false — контест не решён
 *   null  — сервис контеста недоступен (вызывающий сам решает, что делать)
 */
function checkContestCompleted(int $contestId): ?bool
{
    $url = defined('CONTEST_URL') ? CONTEST_URL : 'https://contest.nayanovaacademy.ru';
    $url .= '/index.php?page=api&endpoint=contest_progress&contest_id=' . $contestId;

    $cookieHeader = '';
    if (!empty($_COOKIE['auth_session'])) {
        $cookieHeader = 'auth_session=' . $_COOKIE['auth_session'];
    }

    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => false,
    ];
    if ($cookieHeader !== '') {
        $opts[CURLOPT_COOKIE] = $cookieHeader;
    }
    curl_setopt_array($ch, $opts);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        return null;
    }
    return !empty($data['completed']);
}
