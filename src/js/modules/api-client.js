'use strict';

const PROGRESS_URL = 'sandbox/progress.php';
const BADGES_URL = 'sandbox/badges.php';

export async function apiGet(url) {
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch (_e) {
    console.warn('API GET failed:', _e);
    return null;
  }
}

export async function apiPost(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (_e) {
    console.warn('API POST failed:', _e);
    return null;
  }
}

export async function loadProgress() {
  return apiGet(PROGRESS_URL);
}

export async function saveProgress(lessonNumber, completed, quizScore) {
  return apiPost(PROGRESS_URL, {
    action: 'save',
    lesson_number: lessonNumber,
    completed: completed,
    quiz_score: quizScore,
  });
}

export async function bulkSaveProgress(items) {
  return apiPost(PROGRESS_URL, {
    action: 'bulk_save',
    items: items,
  });
}

export async function loadBadges() {
  return apiGet(BADGES_URL);
}

export async function checkBadges() {
  return apiPost(BADGES_URL, { action: 'check' });
}

export async function incrementCodeRuns() {
  return apiPost(BADGES_URL, { action: 'increment_code_runs' });
}

const CONTEST_API_BASE = 'https://contest.nayanovaacademy.ru';

const QUIZ_URL = 'sandbox/quiz.php';

/**
 * Загрузить вопросы урока без правильных ответов.
 * @param {number} lessonNumber 1..50 или -1 для итогового теста
 */
export async function loadQuiz(lessonNumber) {
  return apiGet(QUIZ_URL + '?lesson_number=' + encodeURIComponent(lessonNumber));
}

/**
 * Проверить один ответ на сервере (мгновенная обратная связь).
 * Сервер возвращает правильный индекс и пояснение.
 */
export async function gradeQuizAnswer(lessonNumber, questionIdx, selected) {
  return apiPost(QUIZ_URL, {
    action: 'answer',
    lesson_number: lessonNumber,
    question_idx: questionIdx,
    selected: selected,
  });
}

/**
 * Отправить все ответы: сервер считает балл, пишет попытку и лучший
 * результат. Клиентский балл не передаётся.
 */
export async function submitQuiz(lessonNumber, answers) {
  return apiPost(QUIZ_URL, {
    action: 'grade',
    lesson_number: lessonNumber,
    answers: answers,
  });
}

export async function checkContestProgress(contestId) {
  try {
    const response = await fetch(
      CONTEST_API_BASE + '/index.php?page=api&endpoint=contest_progress&contest_id=' + contestId,
      { credentials: 'include' },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (_e) {
    console.warn('Contest progress check failed:', _e);
    return null;
  }
}
