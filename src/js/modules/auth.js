'use strict';

/**
 * Auth module — checks authentication status via auth-web.
 * If not authenticated, hides page content and shows login form.
 */

import { escapeHtml } from './utils.js';

const AUTH_CHECK_URL = 'sandbox/auth_check.php';
const AUTH_LOGIN_URL = 'https://auth.nayanovaacademy.ru/index.php?page=login&redirect=';
const AUTH_LOGOUT_URL = 'https://auth.nayanovaacademy.ru/api/logout.php?redirect=';

let currentUser = null;
let lastCheckUnavailable = false;

async function checkAuth() {
  lastCheckUnavailable = false;
  try {
    const response = await fetch(AUTH_CHECK_URL, { credentials: 'include' });
    if (!response.ok) {
      // Сбой auth-web — это НЕ «не авторизован».
      lastCheckUnavailable = true;
      return null;
    }
    const data = await response.json();
    if (data.unavailable) {
      lastCheckUnavailable = true;
      return null;
    }
    if (data.authenticated && data.user) {
      return data.user;
    }
  } catch (_e) {
    lastCheckUnavailable = true;
    console.warn('Auth check failed — treating as anonymous');
  }
  return null;
}

function showAuthGate() {
  const currentUrl = encodeURIComponent(window.location.href);
  const loginUrl = AUTH_LOGIN_URL + currentUrl;

  // При недоступности auth-web не показываем кнопку «Войти» —
  // пользователь всё равно не сможет войти. Нейтральное сообщение вместо неё.
  const body = lastCheckUnavailable
    ? '<p>\u0421\u0435\u0440\u0432\u0438\u0441 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. ' +
      '\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u043f\u043e\u0437\u0436\u0435.</p>'
    : '<p>\u0414\u043b\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u0443\u0440\u043e\u043a\u0430\u043c \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e \u0432\u043e\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0443</p>' +
      '<a href="' +
      loginUrl +
      '" class="auth-gate-login">\u0412\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u0430\u043a\u043a\u0430\u0443\u043d\u0442</a>';

  const gate = document.createElement('div');
  gate.className = 'auth-gate';
  gate.innerHTML =
    '<div class="auth-gate-form">' +
    '<h1>\ud83d\udc0d Python — \u043e\u0441\u043d\u043e\u0432\u044b \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f</h1>' +
    body +
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
    const wrapper = header.querySelector('.repl-auth-wrapper');
    if (wrapper) {
      wrapper.appendChild(container);
    } else {
      header.appendChild(container);
    }
  }

  if (user) {
    container.innerHTML =
      '<span class="auth-user">' +
      escapeHtml(user.display_name) +
      '</span>' +
      '<a href="#" class="auth-link auth-logout" id="auth-logout-btn">\u0412\u044b\u0439\u0442\u0438';
  } else {
    const currentUrl = encodeURIComponent(window.location.href);
    container.innerHTML =
      '<a href="' +
      AUTH_LOGIN_URL +
      currentUrl +
      '" class="auth-link auth-login">\u0412\u043e\u0439\u0442\u0438</a>';
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

  return currentUser;
}

export function getCurrentUser() {
  return currentUser;
}
