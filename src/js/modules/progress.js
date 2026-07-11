'use strict';

/**
 * Progress tracking module
 */

import { createMetaInfo, createContestBadge } from './utils.js';

const PROGRESS_KEY = 'python-web-progress';

function getCompletedLessons() {
  try {
    return JSON.parse(safeGetItem(PROGRESS_KEY) || '[]');
  } catch (_e) {
    return [];
  }
}

export function initProgressTracking() {
  const pageName = window.location.pathname.split('/').pop() || '';

  // Per-lesson completion toggle
  if (!pageName || pageName === 'index.html' || pageName === '') return;

  const footer = document.querySelector('.topic-footer');
  if (!footer) return;

  let quizScores;
  try {
    quizScores = JSON.parse(safeGetItem('python-web-quiz-scores') || '{}');
  } catch (_e) {
    quizScores = {};
  }

  const completed = getCompletedLessons().includes(pageName) || quizScores[pageName] === 100;
  const quizPassed = quizScores[pageName] === 100;

  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'lesson-complete-toggle';

  if (quizPassed || completed) {
    const label = document.createElement('label');
    label.className = 'complete-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'complete-checkbox';
    checkbox.checked = completed;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' '));

    const span = document.createElement('span');
    span.className = 'complete-text';
    span.textContent = completed ? '✓ Урок пройден' : 'Отметить как пройденный';
    label.appendChild(span);

    label.querySelector('input').addEventListener('change', function (e) {
      let lessons = getCompletedLessons();
      if (e.target.checked) {
        if (!lessons.includes(pageName)) {
          lessons.push(pageName);
          label.querySelector('.complete-text').textContent = '✓ Урок пройден';
        }
      } else {
        lessons = lessons.filter(function (l) {
          return l !== pageName;
        });
        label.querySelector('.complete-text').textContent = 'Отметить как пройденный';
      }
      safeSetItem(PROGRESS_KEY, JSON.stringify(lessons));
    });

    toggleDiv.appendChild(label);
  } else {
    const msg = document.createElement('div');
    msg.className = 'quiz-required-msg';
    const line1 = document.createTextNode('🔒 Чтобы отметить урок пройденным,');
    const br = document.createElement('br');
    const line2 = document.createElement('span');
    line2.appendChild(document.createTextNode('наберите '));
    const strong100 = document.createElement('strong');
    strong100.textContent = '100%';
    line2.appendChild(strong100);
    line2.appendChild(document.createTextNode(' в квизе'));
    msg.appendChild(line1);
    msg.appendChild(br);
    msg.appendChild(line2);
    toggleDiv.appendChild(msg);
  }

  const nextLink = footer.querySelector('.next-link');
  if (nextLink) {
    footer.insertBefore(toggleDiv, nextLink);
  } else {
    footer.appendChild(toggleDiv);
  }

  // Index page: progress bar, topic cards, complexity labels
  if (pageName && pageName !== 'index.html' && pageName !== '') return;

  const completedLessons = getCompletedLessons();
  const header = document.querySelector('header');
  if (!header) return;

  const headerParagraph = header.querySelector('p');
  if (headerParagraph) {
    const count = completedLessons.length;
    const totalLessons = typeof window.TOTAL_LESSONS !== 'undefined' ? window.TOTAL_LESSONS : 50;
    const pct = Math.round((count / totalLessons) * 100);

    if (headerParagraph.querySelector('.progress-info')) {
      // Update existing
      const barContainer = headerParagraph.nextElementSibling;
      if (barContainer && barContainer.classList.contains('progress-bar-container')) {
        barContainer.querySelector('.progress-bar-fill').style.width = pct + '%';
        barContainer.querySelector('.progress-bar-fill').setAttribute('aria-valuenow', pct);
      }
      const existingInfo = headerParagraph.parentElement.querySelector('.progress-info');
      if (existingInfo) {
        existingInfo.textContent = '';
        existingInfo.appendChild(document.createTextNode('Пройдено: '));
        const strongCountUpd = document.createElement('strong');
        strongCountUpd.textContent = String(count);
        existingInfo.appendChild(strongCountUpd);
        existingInfo.appendChild(document.createTextNode(' из '));
        const strongTotalUpd = document.createElement('strong');
        strongTotalUpd.textContent = String(totalLessons);
        existingInfo.appendChild(strongTotalUpd);
        existingInfo.appendChild(document.createTextNode(' уроков (' + pct + '%)'));
      }
    } else {
      const barContainer = document.createElement('div');
      barContainer.className = 'progress-bar-container';
      const barFill = document.createElement('div');
      barFill.className = 'progress-bar-fill';
      barFill.style.width = pct + '%';
      barFill.setAttribute('role', 'progressbar');
      barFill.setAttribute('aria-valuemin', '0');
      barFill.setAttribute('aria-valuemax', '100');
      barFill.setAttribute('aria-valuenow', String(pct));
      barContainer.appendChild(barFill);
      headerParagraph.parentNode.insertBefore(barContainer, headerParagraph.nextSibling);

      const progressInfo = document.createElement('span');
      progressInfo.className = 'progress-info';
      progressInfo.appendChild(document.createTextNode('Пройдено: '));
      const strongCount = document.createElement('strong');
      strongCount.textContent = String(count);
      progressInfo.appendChild(strongCount);
      progressInfo.appendChild(document.createTextNode(' из '));
      const strongTotal = document.createElement('strong');
      strongTotal.textContent = String(totalLessons);
      progressInfo.appendChild(strongTotal);
      progressInfo.appendChild(document.createTextNode(' уроков (' + pct + '%)'));
      barContainer.parentNode.insertBefore(progressInfo, barContainer.nextSibling);
    }
  }

  // Complexity labels
  if (typeof window.COMPLEXITY_LABELS !== 'undefined') {
    document.querySelectorAll('.meta-complexity').forEach(function (el) {
      const level = el.getAttribute('data-level');
      if (level && window.COMPLEXITY_LABELS[level]) {
        el.textContent = window.COMPLEXITY_LABELS[level];
      }
    });
  }

  // Topic cards: mark completed, add metadata, contest badges
  document.querySelectorAll('.topic-card').forEach(function (card) {
    const href = card.getAttribute('href');
    if (href && completedLessons.includes(href)) {
      card.classList.add('completed');
      const numEl = card.querySelector('.topic-num');
      if (numEl && !numEl.classList.contains('completed-num')) {
        numEl.classList.add('completed-num');
      }
    }

    const lessonNum = parseInt(card.getAttribute('data-lesson'));
    if (typeof window.LESSON_META !== 'undefined') {
      const meta = window.LESSON_META[lessonNum];
      if (meta) {
        const infoDiv = card.querySelector('.topic-info');
        if (infoDiv && !infoDiv.querySelector('.topic-meta')) {
          const metaDiv = createMetaInfo(meta.duration, meta.complexity);
          if (metaDiv) infoDiv.appendChild(metaDiv);
        }
      }
    }

    const contestBadge = createContestBadge(lessonNum);
    if (contestBadge) card.appendChild(contestBadge);
  });
}
