'use strict';

/**
 * Auth module — checks authentication status via auth-web.
 * If not authenticated, hides page content and shows login form.
 */

import { loadProgress, bulkSaveProgress } from './api-client.js';

const AUTH_CHECK_URL = 'sandbox/auth_check.php';
const AUTH_LOGIN_URL = 'https://auth.nayanovaacademy.ru/index.php?page=login&redirect=';
const AUTH_LOGOUT_URL = 'https://auth.nayanovaacademy.ru/api/logout.php?redirect=';

let currentUser = null;

async function checkAuth() {
  try {
    const response = await fetch(AUTH_CHECK_URL, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.authenticated && data.user) {
      return data.user;
    }
  } catch (_e) {
    // Auth service unavailable — treat as anonymous
  }
  return null;
}

function showAuthGate() {
  const currentUrl = encodeURIComponent(window.location.href);
  const loginUrl = AUTH_LOGIN_URL + currentUrl;

  const gate = document.createElement('div');
  gate.className = 'auth-gate';
  gate.innerHTML =
    '<div class="auth-gate-form">' +
      '<h1>🐍 Python — основы программирования</h1>' +
      '<p>Для доступа к урокам необходимо войти в систему</p>' +
      '<a href="' + loginUrl + '" class="auth-gate-login">Войти через аккаунт</a>' +
    '</div>';

  document.body.appendChild(gate);
}

function hideContent() {
  const container = document.querySelector('.container');
  if (container) container.style.display = 'none';
}

function showContent() {
  const container = document.querySelector('.container');
  if (container) container.style.display = '';
}

function renderAuthUI(user) {
  const header = document.querySelector('.topic-header, .index-header');
  if (!header) return;

  let container = header.querySelector('.auth-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'auth-container';
    header.appendChild(container);
  }

  if (user) {
    container.innerHTML =
      '<span class="auth-user">' + escapeHtml(user.display_name) + '</span>' +
      '<a href="#" class="auth-link auth-logout" id="auth-logout-btn">Выйти';
  } else {
    const currentUrl = encodeURIComponent(window.location.href);
    container.innerHTML =
      '<a href="' + AUTH_LOGIN_URL + currentUrl + '" class="auth-link auth-login">Войти</a>';
  }

  const logoutBtn = container.querySelector('#auth-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = AUTH_LOGOUT_URL + currentUrl;
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function migrateLocalStorageToServer() {
  try {
    const progressKey = 'python-web-course-progress';
    const legacyKey = 'python-web-progress';
    const quizKey = 'python-web-quiz-scores';

    let completedLessons = [];
    try {
      const raw = localStorage.getItem(progressKey) || localStorage.getItem(legacyKey);
      if (raw) completedLessons = JSON.parse(raw);
    } catch (_e) {}

    let quizScores = {};
    try {
      const raw = localStorage.getItem(quizKey);
      if (raw) quizScores = JSON.parse(raw);
    } catch (_e) {}

    if (completedLessons.length === 0 && Object.keys(quizScores).length === 0) return;

    const items = [];
    const allSlugs = new Set(completedLessons);

    for (const slug of Object.keys(quizScores)) {
      allSlugs.add(slug);
    }

    for (const slug of allSlugs) {
      const isCompleted = completedLessons.includes(slug);
      const score = quizScores[slug] || null;
      const lessonNumber = slugToLessonNumber(slug);
      if (lessonNumber === null) continue;
      items.push({ lesson_number: lessonNumber, completed: isCompleted, quiz_score: score });
    }

    await bulkSaveProgress(items);
  } catch (_e) {
    console.warn('Failed to migrate localStorage to server:', _e);
  }
}

function slugToLessonNumber(slug) {
  if (slug === 'final-exam.html') return -1;
  const match = slug.match(/^(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

export async function initAuth() {
  currentUser = await checkAuth();

  if (!currentUser) {
    showAuthGate();
    hideContent();
    renderAuthUI(null);
    return null;
  }

  showContent();
  renderAuthUI(currentUser);

  // Sync server progress to localStorage
  let serverHasData = false;
  try {
    const data = await loadProgress();
    if (data && data.progress) {
      const completedLessons = [];
      const quizScores = {};

      for (const row of data.progress) {
        const num = parseInt(row.lesson_number, 10);
        if (isNaN(num)) continue;
        const pageName = String(num).padStart(2, '0') + '.html';

        if (row.completed) {
          completedLessons.push(pageName);
        }
        if (row.quiz_score !== null && row.quiz_score !== undefined) {
          quizScores[pageName] = row.quiz_score;
        }
      }

      if (completedLessons.length > 0) {
        localStorage.setItem('python-web-course-progress', JSON.stringify(completedLessons));
        serverHasData = true;
      }
      if (Object.keys(quizScores).length > 0) {
        localStorage.setItem('python-web-quiz-scores', JSON.stringify(quizScores));
        serverHasData = true;
      }
    }
  } catch (_e) {
    console.warn('Failed to load progress from server:', _e);
  }

  // Migrate localStorage → server only if server had no data (first login from anonymous)
  if (!serverHasData) {
    migrateLocalStorageToServer();
  }

  return currentUser;
}

export function getCurrentUser() {
  return currentUser;
}
