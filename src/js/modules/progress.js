'use strict';

/**
 * Progress tracking module
 * Tracks user progress through course lessons with server sync
 */

import { saveProgress, checkBadges } from './api-client.js';
import { createMetaInfo, createContestBadge } from './utils.js';
import { safeGetItem, safeSetItem } from '../config/security.js';
import { TOTAL_LESSONS, COMPLEXITY_LABELS, LESSON_META } from '../config/courseData.js';

const CONSOLIDATED_PROGRESS_KEY = 'python-web-course-progress';
const LEGACY_PROGRESS_KEY = 'python-web-progress';

export function getCompletedLessons() {
  try {
    let progress = safeGetItem(CONSOLIDATED_PROGRESS_KEY);
    if (!progress) {
      progress = safeGetItem(LEGACY_PROGRESS_KEY);
      if (progress) {
        safeSetItem(CONSOLIDATED_PROGRESS_KEY, progress);
      }
    }
    return progress ? JSON.parse(progress) : [];
  } catch (_e) {
    return [];
  }
}

function saveCompletedLessons(lessons) {
  safeSetItem(CONSOLIDATED_PROGRESS_KEY, JSON.stringify(lessons));
}

function lessonNumberFromPage() {
  const attr = document.body.getAttribute('data-lesson');
  if (attr !== null) {
    const num = parseInt(attr, 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

function syncToServer(lessonNumber, completed, quizScore) {
  if (lessonNumber === null) return;
  saveProgress(lessonNumber, completed, quizScore).catch(function () {
    // Silent fail — offline or network error
  });
}

export function initProgressTracking() {
  const pageName = window.location.pathname.split('/').pop() || '';

  if (!pageName || pageName === 'index.html' || pageName === '') return;

  const footer = document.querySelector('.topic-footer');
  if (!footer) return;

  let quizScores;
  try {
    quizScores = JSON.parse(safeGetItem('python-web-quiz-scores') || '{}');
  } catch (_e) {
    quizScores = {};
  }

  const manuallyCompleted = getCompletedLessons().includes(pageName);
  const quizPassed = quizScores[pageName] === 100;
  const showToggle = manuallyCompleted || quizPassed;

  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'lesson-complete-toggle';

  if (showToggle) {
    if (quizPassed && !manuallyCompleted) {
      const msg = document.createElement('div');
      msg.className = 'complete-label';
      const span = document.createElement('span');
      span.className = 'complete-text';
      span.textContent = '✓ Урок пройден (квиз)';
      msg.appendChild(span);
      toggleDiv.appendChild(msg);
    } else {
      const label = document.createElement('label');
      label.className = 'complete-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'complete-checkbox';
      checkbox.checked = manuallyCompleted;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' '));

      const span = document.createElement('span');
      span.className = 'complete-text';
      span.textContent = manuallyCompleted ? '✓ Урок пройден' : 'Отметить как пройденный';
      label.appendChild(span);

      label.querySelector('input').addEventListener('change', function (e) {
        let lessons = getCompletedLessons();
        const lessonNumber = lessonNumberFromPage();
        const wasCompleted = lessons.includes(pageName);
        if (e.target.checked) {
          if (!wasCompleted) {
            lessons.push(pageName);
            label.querySelector('.complete-text').textContent = '✓ Урок пройден';
          }
          syncToServer(lessonNumber, true, null);
          if (!wasCompleted) checkBadges();
        } else {
          lessons = lessons.filter(function (l) {
            return l !== pageName;
          });
          label.querySelector('.complete-text').textContent = 'Отметить как пройденный';
          syncToServer(lessonNumber, false, null);
        }
        saveCompletedLessons(lessons);
      });

      toggleDiv.appendChild(label);
    }
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

  if (pageName && pageName !== 'index.html' && pageName !== '') return;

  const completedLessons = getCompletedLessons();
  const header = document.querySelector('header');
  if (!header) return;

  const headerParagraph = header.querySelector('p');
  if (headerParagraph) {
    const count = completedLessons.length;
    const totalLessons = typeof TOTAL_LESSONS !== 'undefined' ? TOTAL_LESSONS : 50;
    const pct = Math.round((count / totalLessons) * 100);

    if (headerParagraph.querySelector('.progress-info')) {
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

  if (typeof COMPLEXITY_LABELS !== 'undefined') {
    document.querySelectorAll('.meta-complexity').forEach(function (el) {
      const level = el.getAttribute('data-level');
      if (level && COMPLEXITY_LABELS[level]) {
        el.textContent = COMPLEXITY_LABELS[level];
      }
    });
  }

  document.querySelectorAll('.topic-card').forEach(function (card) {
    const href = card.getAttribute('href');
    if (href && completedLessons.includes(href)) {
      card.classList.add('completed');
      const numEl = card.querySelector('.topic-num');
      if (numEl && !numEl.classList.contains('completed-num')) {
        numEl.classList.add('completed-num');
      }
    }

    const lessonNum = parseInt(card.getAttribute('data-lesson'), 10);
    if (typeof LESSON_META !== 'undefined') {
      const meta = LESSON_META[lessonNum];
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
