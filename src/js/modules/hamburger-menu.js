'use strict';

/**
 * Hamburger menu module
 */

import { fetchLessonsData } from './utils.js';

export function initHamburgerMenu() {
  const pageName = window.location.pathname.split('/').pop() || '';

  // Button
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'hamburger-menu';
  hamburgerBtn.textContent = '☰';
  hamburgerBtn.setAttribute('aria-label', 'Меню уроков');
  hamburgerBtn.title = 'Список уроков';
  document.body.appendChild(hamburgerBtn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'hamburger-overlay';
  document.body.appendChild(overlay);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'hamburger-panel';

  const hamburgerHeader = document.createElement('div');
  hamburgerHeader.className = 'hamburger-header';
  hamburgerHeader.appendChild(document.createTextNode('🐍 Уроки Python '));
  const hamburgerClose = document.createElement('span');
  hamburgerClose.className = 'hamburger-close';
  hamburgerClose.textContent = '✕';
  hamburgerHeader.appendChild(hamburgerClose);
  panel.appendChild(hamburgerHeader);

  const list = document.createElement('ul');
  list.className = 'hamburger-list';
  panel.appendChild(list);

  document.body.appendChild(panel);

  // Toggle
  hamburgerBtn.addEventListener('click', function () {
    panel.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', function () {
    panel.classList.remove('open');
    overlay.classList.remove('open');
  });
  hamburgerClose.addEventListener('click', function () {
    panel.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Load lesson list
  fetchLessonsData()
    .then(function (data) {
      const lessons = [];
      if (data.sections) {
        data.sections.forEach(function (section) {
          section.lessons.forEach(function (lesson) {
            lessons.push({ num: lesson.num, title: lesson.title, href: lesson.file });
          });
        });
      }
      lessons.push({ num: '🏆', title: 'Итоговый тест', href: 'final-test.html' });

      let completed = [];
      try {
        completed = JSON.parse(safeGetItem('python-web-progress') || '[]');
      } catch {
        /* ignore */
      }

      lessons.forEach(function (lesson) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = lesson.href;
        a.className = 'hamburger-link';

        const numSpan = document.createElement('span');
        numSpan.className = 'hamburger-num';
        numSpan.textContent = String(lesson.num);
        a.appendChild(numSpan);
        a.appendChild(document.createTextNode(' ' + lesson.title));

        if (completed.indexOf(lesson.href) !== -1) {
          const checkSpan = document.createElement('span');
          checkSpan.className = 'hamburger-check';
          checkSpan.textContent = '✓';
          a.appendChild(checkSpan);
          a.classList.add('completed-link');
        }
        if (pageName === lesson.href) {
          a.classList.add('hamburger-active');
        }

        li.appendChild(a);
        list.appendChild(li);
      });
    })
    .catch(function () {
      const errorLi = document.createElement('li');
      errorLi.style.padding = '1rem';
      errorLi.style.color = 'var(--text-muted)';
      errorLi.textContent = 'Не удалось загрузить список уроков';
      list.appendChild(errorLi);
    });
}
