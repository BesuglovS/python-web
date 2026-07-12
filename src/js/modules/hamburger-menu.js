'use strict';

/**
 * Hamburger menu module
 * Creates collapsible lesson navigation menu with full keyboard accessibility
 */

import { fetchLessonsData } from './utils.js';
import { safeGetItem } from '../config/security.js';

export function initHamburgerMenu() {
  const pageName = window.location.pathname.split('/').pop() || '';

  // Button
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'hamburger-menu';
  hamburgerBtn.textContent = '\u2630';
  hamburgerBtn.setAttribute('aria-label', '\u041c\u0435\u043d\u044e \u0443\u0440\u043e\u043a\u043e\u0432');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.title = '\u0421\u043f\u0438\u0441\u043e\u043a \u0443\u0440\u043e\u043a\u043e\u0432';
  document.body.appendChild(hamburgerBtn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'hamburger-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'hamburger-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f \u043f\u043e \u0443\u0440\u043e\u043a\u0430\u043c');
  panel.setAttribute('aria-modal', 'true');
  panel.id = 'hamburger-panel';

  hamburgerBtn.setAttribute('aria-controls', 'hamburger-panel');

  const hamburgerHeader = document.createElement('div');
  hamburgerHeader.className = 'hamburger-header';
  hamburgerHeader.appendChild(document.createTextNode('\ud83d\udc0d \u0423\u0440\u043e\u043a\u0438 Python '));

  const hamburgerClose = document.createElement('button');
  hamburgerClose.className = 'hamburger-close';
  hamburgerClose.textContent = '\u2715';
  hamburgerClose.setAttribute('aria-label', '\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e');
  hamburgerHeader.appendChild(hamburgerClose);
  panel.appendChild(hamburgerHeader);

  const list = document.createElement('ul');
  list.className = 'hamburger-list';
  list.setAttribute('role', 'list');
  panel.appendChild(list);

  document.body.appendChild(panel);

  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    hamburgerClose.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.focus();
  }

  // Toggle
  hamburgerBtn.addEventListener('click', function () {
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });
  overlay.addEventListener('click', closePanel);
  hamburgerClose.addEventListener('click', closePanel);

  // Escape key closes panel
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
      return;
    }
    // Focus trap: Tab cycles within the panel
    if (e.key === 'Tab') {
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  // Escape key from anywhere when panel is open
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
    }
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
      lessons.push({ num: '\ud83c\udfc6', title: '\u0418\u0442\u043e\u0433\u043e\u0432\u044b\u0439 \u0442\u0435\u0441\u0442', href: 'final-test.html' });

      let completed = [];
      try {
        completed = JSON.parse(safeGetItem('python-web-course-progress') || '[]');
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
          checkSpan.textContent = '\u2713';
          a.appendChild(checkSpan);
          a.classList.add('completed-link');
          a.setAttribute('aria-current', 'false');
        }
        if (pageName === lesson.href) {
          a.classList.add('hamburger-active');
          a.setAttribute('aria-current', 'page');
        }

        li.appendChild(a);
        list.appendChild(li);
      });
    })
    .catch(function () {
      const errorLi = document.createElement('li');
      errorLi.style.padding = '1rem';
      errorLi.style.color = 'var(--text-muted)';
      errorLi.textContent = '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a \u0443\u0440\u043e\u043a\u043e\u0432';
      list.appendChild(errorLi);
    });
}
