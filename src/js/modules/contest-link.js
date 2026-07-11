'use strict';

/**
 * Contest link injection module
 */

export function initContestLinkInjection() {
  if (window.THEORY_CONTESTS === undefined || window.CONTEST_BASE_URL === undefined) return;

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

  const contestId = window.THEORY_CONTESTS[lessonNum];
  if (!contestId) return;

  const contestUrl = window.CONTEST_BASE_URL + contestId;
  const contestDiv = document.createElement('div');
  contestDiv.className = 'contest-link';

  const p = document.createElement('p');
  p.style.textAlign = 'center';
  p.style.marginTop = '2rem';
  p.style.padding = '1rem';
  p.style.background = '#1e3a5f';
  p.style.borderRadius = '8px';
  p.style.color = '#e0e0e0';

  const textBefore = document.createTextNode('🏆 Решай задачи по пройденным темам на сайте ');
  p.appendChild(textBefore);

  const a = document.createElement('a');
  a.href = contestUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.color = '#7ec8ff';
  a.style.fontWeight = '600';
  a.style.textDecoration = 'underline';
  a.textContent = 'contest.nayanovaacademy.ru';
  p.appendChild(a);

  contestDiv.appendChild(p);

  const main = document.querySelector('main, .main-content');
  if (main) {
    setTimeout(function () {
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
    }, 500);
  }
}

/**
 * Добавляет значки контестов (🏆) на карточки уроков главной страницы.
 * Для каждого урока, у которого есть соответствующий contest ID в THEORY_CONTESTS,
 * добавляет кликабельную ссылку-значок в правый нижний угол карточки.
 */
function initIndexPageContestBadges() {
  setTimeout(function () {
    var cards = document.querySelectorAll('.topic-card[data-lesson]');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      // Пропускаем, если значок уже добавлен
      if (card.querySelector('.contest-badge')) continue;

      var lessonNum = parseInt(card.getAttribute('data-lesson'), 10);
      if (isNaN(lessonNum)) continue;

      var contestId = window.THEORY_CONTESTS[lessonNum];
      if (!contestId) continue;

      var contestUrl = window.CONTEST_BASE_URL + contestId;

      var badge = document.createElement('a');
      badge.className = 'contest-badge';
      badge.href = contestUrl;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.title = 'Задачи контеста №' + contestId;
      badge.textContent = '🏆';

      card.appendChild(badge);
    }
  }, 500);
}
