'use strict';

/**
 * Progress tracking module
 * Server-only progress: reads from API, writes to API + updates in-memory state.
 * All data keyed by lesson number (integer), no slugs or localStorage.
 */

import { apiGet, saveProgress, checkBadges, checkContestProgress } from './api-client.js';
import { createMetaInfo, createContestBadge, lessonNumberFromPage } from './utils.js';
import { TOTAL_LESSONS, COMPLEXITY_LABELS, LESSON_META, THEORY_CONTESTS } from '../config/courseData.js';

const PROGRESS_URL = 'sandbox/progress.php';

const _progress = new Map();

export async function loadProgressFromServer() {
  try {
    const data = await apiGet(PROGRESS_URL);
    if (data && data.progress) {
      _progress.clear();
      for (const row of data.progress) {
        const num = parseInt(row.lesson_number, 10);
        if (isNaN(num)) continue;
        _progress.set(num, {
          completed: !!row.completed,
          quiz_score: row.quiz_score !== null && row.quiz_score !== undefined ? parseInt(row.quiz_score, 10) : null,
        });
      }
    }
  } catch (_e) {
    console.warn('Progress server unavailable — starting empty');
  }
}

export function isLessonCompleted(lessonNumber) {
  const entry = _progress.get(lessonNumber);
  return entry ? entry.completed : false;
}

export function getQuizScore(lessonNumber) {
  const entry = _progress.get(lessonNumber);
  return entry ? entry.quiz_score : null;
}

export function getCompletedLessonNumbers() {
  const result = [];
  for (const [num, entry] of _progress) {
    if (entry.completed) result.push(num);
  }
  return result;
}

export function updateLocalProgress(lessonNumber, completed, quizScore) {
  const existing = _progress.get(lessonNumber) || { completed: false, quiz_score: null };
  _progress.set(lessonNumber, {
    completed: completed !== undefined ? completed : existing.completed,
    quiz_score: quizScore !== undefined ? quizScore : existing.quiz_score,
  });
}

function syncToServer(lessonNumber, completed, quizScore) {
  if (lessonNumber === null) return;
  saveProgress(lessonNumber, completed, quizScore).catch(function (err) {
    console.warn('Progress sync failed (offline?):', err);
  });
}

export function initProgressTracking() {
  const pageName = window.location.pathname.split('/').pop() || '';
  const isIndexPage = !pageName || pageName === 'index.html' || pageName === '';

  if (!isIndexPage) {
    renderLessonPage();
  }

  renderIndexPage();
}

function buildCompleteToggle(container, lessonNum, completed) {
  container.className = 'lesson-complete-toggle';

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
  span.textContent = completed ? '\u2713 \u0423\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d' : '\u041e\u0442\u043c\u0435\u0442\u0438\u0442\u044c \u043a\u0430\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043d\u044b\u0439';
  label.appendChild(span);

  label.querySelector('input').addEventListener('change', function (e) {
    const isChecked = e.target.checked;
    updateLocalProgress(lessonNum, isChecked, undefined);
    syncToServer(lessonNum, isChecked, undefined);
    span.textContent = isChecked ? '\u2713 \u0423\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d' : '\u041e\u0442\u043c\u0435\u0442\u0438\u0442\u044c \u043a\u0430\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043d\u044b\u0439';
    if (isChecked) checkBadges();
  });

  container.appendChild(label);
}

function buildContestRequiredMsg(container) {
  container.className = 'lesson-complete-toggle';
  const msg = document.createElement('div');
  msg.className = 'quiz-required-msg';
  const line1 = document.createTextNode('\ud83c\udfc6 \u041a\u0432\u0438\u0437 \u043f\u0440\u043e\u0439\u0434\u0435\u043d!');
  const br = document.createElement('br');
  const line2 = document.createElement('span');
  line2.appendChild(document.createTextNode('\u0420\u0435\u0448\u0438 \u0432\u0441\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u043a\u043e\u043d\u0442\u0435\u0441\u0442\u0430, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043c\u0435\u0442\u0438\u0442\u044c \u0443\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043d\u044b\u043c'));
  msg.appendChild(line1);
  msg.appendChild(br);
  msg.appendChild(line2);
  container.appendChild(msg);
}

function buildQuizRequiredMsg(container) {
  container.className = 'lesson-complete-toggle';
  const msg = document.createElement('div');
  msg.className = 'quiz-required-msg';
  const line1 = document.createTextNode('\ud83d\udd12 \u0427\u0442\u043e\u0431\u044b \u043e\u0442\u043c\u0435\u0442\u0438\u0442\u044c \u0443\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043d\u044b\u043c,');
  const br = document.createElement('br');
  const line2 = document.createElement('span');
  line2.appendChild(document.createTextNode('\u043d\u0430\u0431\u0435\u0440\u0438\u0442\u0435 '));
  const strong100 = document.createElement('strong');
  strong100.textContent = '100%';
  line2.appendChild(strong100);
  line2.appendChild(document.createTextNode(' \u0432 \u043a\u0432\u0438\u0437\u0435'));
  msg.appendChild(line1);
  msg.appendChild(br);
  msg.appendChild(line2);
  container.appendChild(msg);
}

function renderLessonPage() {
  const lessonNum = lessonNumberFromPage();
  if (lessonNum === null) return;

  const footer = document.querySelector('.topic-footer');
  if (!footer) return;

  const completed = isLessonCompleted(lessonNum);
  const quizScore = getQuizScore(lessonNum);
  const quizPassed = quizScore === 100;

  const contestId = THEORY_CONTESTS ? THEORY_CONTESTS[lessonNum] : null;

  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'lesson-complete-toggle';

  if (completed) {
    buildCompleteToggle(toggleDiv, lessonNum, true);
  } else if (quizPassed && !contestId) {
    buildCompleteToggle(toggleDiv, lessonNum, false);
  } else if (quizPassed && contestId) {
    toggleDiv.textContent = '\u23f3 \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441\u0430 \u043a\u043e\u043d\u0442\u0435\u0441\u0442\u0430...';
  } else {
    buildQuizRequiredMsg(toggleDiv);
  }

  const nextLink = footer.querySelector('.next-link');
  if (nextLink) {
    footer.insertBefore(toggleDiv, nextLink);
  } else {
    footer.appendChild(toggleDiv);
  }

  if (quizPassed && contestId && !completed) {
    checkContestProgress(contestId).then(function (contestData) {
      if (contestData && contestData.completed) {
        updateLocalProgress(lessonNum, true, undefined);
        syncToServer(lessonNum, true, undefined);
        toggleDiv.textContent = '';
        buildCompleteToggle(toggleDiv, lessonNum, true);
        checkBadges();
      } else {
        toggleDiv.textContent = '';
        buildContestRequiredMsg(toggleDiv);
      }
    }).catch(function () {
      toggleDiv.textContent = '';
      buildContestRequiredMsg(toggleDiv);
    });
  }
}

function renderIndexPage() {
  if (!document.body.classList.contains('index-page')) return;

  const completedNumbers = getCompletedLessonNumbers();
  const count = completedNumbers.length;
  const totalLessons = typeof TOTAL_LESSONS !== 'undefined' ? TOTAL_LESSONS : 50;
  const pct = Math.round((count / totalLessons) * 100);

  const header = document.querySelector('header');
  if (!header) return;

  let barContainer = header.querySelector('.progress-bar-container');
  if (!barContainer) {
    barContainer = document.createElement('div');
    barContainer.className = 'progress-bar-container';
    barContainer.setAttribute('role', 'progressbar');
    barContainer.setAttribute('aria-valuemin', '0');
    barContainer.setAttribute('aria-valuemax', '100');
    barContainer.setAttribute('aria-label', '\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u043a\u0443\u0440\u0441\u0430');
    const headerParagraph = header.querySelector('p');
    if (headerParagraph) {
      headerParagraph.parentNode.insertBefore(barContainer, headerParagraph.nextSibling);
    } else {
      header.appendChild(barContainer);
    }
  }

  let barFill = barContainer.querySelector('.progress-bar-fill');
  if (!barFill) {
    barFill = document.createElement('div');
    barFill.className = 'progress-bar-fill';
    barContainer.appendChild(barFill);
  }
  barFill.style.width = pct + '%';
  barContainer.setAttribute('aria-valuenow', String(pct));

  let progressInfo = header.querySelector('.progress-info');
  if (!progressInfo) {
    progressInfo = document.createElement('span');
    progressInfo.className = 'progress-info';
    barContainer.parentNode.insertBefore(progressInfo, barContainer.nextSibling);
  }

  progressInfo.textContent = '';
  progressInfo.appendChild(document.createTextNode('\u041f\u0440\u043e\u0439\u0434\u0435\u043d\u043e: '));
  const strongCount = document.createElement('strong');
  strongCount.textContent = String(count);
  progressInfo.appendChild(strongCount);
  progressInfo.appendChild(document.createTextNode(' \u0438\u0437 '));
  const strongTotal = document.createElement('strong');
  strongTotal.textContent = String(totalLessons);
  progressInfo.appendChild(strongTotal);
  progressInfo.appendChild(document.createTextNode(' \u0443\u0440\u043e\u043a\u043e\u0432 (' + pct + '%)'));

  if (typeof COMPLEXITY_LABELS !== 'undefined') {
    document.querySelectorAll('.meta-complexity').forEach(function (el) {
      const level = el.getAttribute('data-level');
      if (level && COMPLEXITY_LABELS[level]) {
        el.textContent = COMPLEXITY_LABELS[level];
      }
    });
  }

  document.querySelectorAll('.topic-card').forEach(function (card) {
    const lessonNum = parseInt(card.getAttribute('data-lesson'), 10);
    if (!isNaN(lessonNum) && isLessonCompleted(lessonNum)) {
      card.classList.add('completed');
      const numEl = card.querySelector('.topic-num');
      if (numEl && !numEl.classList.contains('completed-num')) {
        numEl.classList.add('completed-num');
      }
    }

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
