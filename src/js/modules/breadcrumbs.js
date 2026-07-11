'use strict';

/**
 * Breadcrumbs module
 */

export function initBreadcrumbs() {
  const el = document.getElementById('breadcrumbs');
  if (!el) return;
  const titleEl = document.querySelector('.topic-header h1');
  const title = titleEl
    ? titleEl.textContent.trim()
    : document.title.split(' — ')[0] || document.title;

  const homeLink = document.createElement('a');
  homeLink.href = 'index.html';
  homeLink.textContent = '🏠 Главная';
  el.appendChild(homeLink);

  el.appendChild(document.createTextNode(' '));

  const sep = document.createElement('span');
  sep.className = 'bc-sep';
  sep.textContent = '/';
  el.appendChild(sep);

  el.appendChild(document.createTextNode(' '));

  const current = document.createElement('span');
  current.className = 'bc-current';
  current.setAttribute('aria-current', 'page');
  current.textContent = title;
  el.appendChild(current);
}
