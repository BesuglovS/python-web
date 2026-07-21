'use strict';

const PROGRESS_URL = 'sandbox/progress.php';
const BADGES_URL = 'sandbox/badges.php';

export async function apiGet(url) {
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch (_e) {
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
