'use strict';

/**
 * Contest link injection module
 * Provides links to related contest problems for each lesson
 */

import { THEORY_CONTESTS, CONTEST_BASE_URL } from '../config/courseData.js';
import { CONTEST_OBSERVER_TIMEOUT_MS } from '../config/constants.js';

export function initContestLinkInjection() {
  if (THEORY_CONTESTS === undefined || CONTEST_BASE_URL === undefined) return;

  // На главной странице добавляем значки контестов на карточки уроков
  if (document.body.classList.contains('index-page')) {
    initIndexPageContestBadges();
    return;
  }

  const pageName = window.location.pathname.split('/').pop() || '';
  const lessonAttr = document.body.getAttribute('data-lesson');
  let lessonNum = parseInt(lessonAttr, 10);
  if (isNaN(lessonNum)) {
    const match = pageName.match(/^(\d+)/);
    if (!match) return;
    lessonNum = parseInt(match[1], 10);
  }

  const contestId = THEORY_CONTESTS[lessonNum];
  if (!contestId) return;

  const contestUrl = CONTEST_BASE_URL + contestId;
  const contestDiv = document.createElement('div');
  contestDiv.className = 'contest-link';

  const p = document.createElement('p');
  p.style.textAlign = 'center';
  p.style.marginTop = '2rem';
  p.style.padding = '1rem';
  p.style.background = '#1e3a5f';
  p.style.borderRadius = '8px';
  p.style.color = '#e0e0e0';

  const textBefore = document.createTextNode(
    '\uD83C\uDFC6 \u0420\u0435\u0448\u0430\u0439 \u0437\u0430\u0434\u0430\u0447\u0438 \u043F\u043E \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u043D\u044B\u043C \u0442\u0435\u043C\u0430\u043C \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 ',
  );
  p.appendChild(textBefore);

  const a = document.createElement('a');
  a.href = contestUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.color = '#7ec8ff';
  a.style.fontWeight = '600';
  a.style.textDecoration = 'underline';
  a.textContent = 'contest.nayanovaacademy.ru';
  a.setAttribute('aria-label', '\u0420\u0435\u0448\u0438\u0442\u044c \u0437\u0430\u0434\u0430\u043d\u0438\u044f \u043a\u043e\u043d\u0442\u0435\u0441\u0442\u0430 \u043d\u0430 contest.nayanovaacademy.ru (\u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0432 \u043d\u043e\u0432\u043e\u0439 \u0432\u043a\u043b\u0430\u0434\u043a\u0435)');
  p.appendChild(a);

  contestDiv.appendChild(p);

  const main = document.querySelector('main, .main-content');
  if (main) {
    function insertContestLink() {
      if (main.querySelector('.contest-link')) return;
      const quizEl = main.querySelector('.quiz-container');
      const completeEl = main.querySelector('.lesson-complete-toggle');
      if (quizEl) {
        quizEl.parentNode.insertBefore(contestDiv, quizEl.nextSibling);
      } else if (completeEl) {
        main.insertBefore(contestDiv, completeEl);
      } else {
        main.appendChild(contestDiv);
      }
    }

    if (main.querySelector('.quiz-container')) {
      insertContestLink();
    } else {
      const observer = new MutationObserver(function (_mutations, obs) {
        if (main.querySelector('.quiz-container')) {
          obs.disconnect();
          insertContestLink();
        }
      });
      observer.observe(main, { childList: true, subtree: true });
      setTimeout(function () {
        observer.disconnect();
      }, CONTEST_OBSERVER_TIMEOUT_MS);
    }
  }
}

/**
 * Добавляет значки контестов (🏆) на карточки уроков главной страницы.
 * Для каждого урока, у которого есть соответствующий contest ID в THEORY_CONTESTS,
 * добавляет кликабельную ссылку-значок в правый нижний угол карточки.
 */
function initIndexPageContestBadges() {
  function injectBadges() {
    const cards = document.querySelectorAll('.topic-card[data-lesson]');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.querySelector('.contest-badge')) continue;

      const num = parseInt(card.getAttribute('data-lesson'), 10);
      if (isNaN(num)) continue;

      const id = THEORY_CONTESTS[num];
      if (!id) continue;

      const url = CONTEST_BASE_URL + id;

      const badge = document.createElement('a');
      badge.className = 'contest-badge';
      badge.href = url;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.title =
        '\u0417\u0430\u0434\u0430\u0447\u0438 \u043a\u043e\u043d\u0442\u0435\u0441\u0442\u0430 \u2116' +
        id;
      badge.textContent = '\uD83C\uDFC6';
      badge.setAttribute('aria-label', '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0438 \u043a\u043e\u043d\u0442\u0435\u0441\u0442\u0430 \u2116' + id + ' (\u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0432 \u043d\u043e\u0432\u043e\u0439 \u0432\u043a\u043b\u0430\u0434\u043a\u0435)');

      card.appendChild(badge);
    }
  }

  if (document.querySelectorAll('.topic-card[data-lesson]').length > 0) {
    injectBadges();
  } else {
    const observer = new MutationObserver(function (_mutations, obs) {
      if (document.querySelectorAll('.topic-card[data-lesson]').length > 0) {
        obs.disconnect();
        injectBadges();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      observer.disconnect();
    }, CONTEST_OBSERVER_TIMEOUT_MS);
  }
}