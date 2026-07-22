'use strict';

/**
 * Progress tracking module
 * Server-only progress: reads from API, writes to API + updates in-memory state.
 * All data keyed by lesson number (integer), no slugs or localStorage.
 */

import { apiGet, saveProgress, checkBadges } from './api-client.js';
import { createMetaInfo, createContestBadge } from './utils.js';
import { TOTAL_LESSONS, COMPLEXITY_LABELS, LESSON_META } from '../config/courseData.js';

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
    // Server unavailable — progress stays empty
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
  const isIndexPage = !pageName || pageName === 'index.html' || pageName === '';

  if (!isIndexPage) {
    renderLessonPage();
  }

  renderIndexPage();
}

function renderLessonPage() {
  const lessonNum = lessonNumberFromPage();
  if (lessonNum === null) return;

  const footer = document.querySelector('.topic-footer');
  if (!footer) return;

  const completed = isLessonCompleted(lessonNum);
  const quizScore = getQuizScore(lessonNum);
  const quizPassed = quizScore === 100;
  const showToggle = completed || quizPassed;

  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'lesson-complete-toggle';

  if (showToggle) {
    if (quizPassed && !completed) {
      const msg = document.createElement('div');
      msg.className = 'complete-label';
      const span = document.createElement('span');
      span.className = 'complete-text';
      span.textContent = '\u2713 \u0423\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d (\u043a\u0432\u0438\u0437)';
      msg.appendChild(span);
      toggleDiv.appendChild(msg);
    } else {
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

      toggleDiv.appendChild(label);
    }
  } else {
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
    toggleDiv.appendChild(msg);
  }

  const nextLink = footer.querySelector('.next-link');
  if (nextLink) {
    footer.insertBefore(toggleDiv, nextLink);
  } else {
    footer.appendChild(toggleDiv);
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

  const headerParagraph = header.querySelector('p');
  if (!headerParagraph) return;

  if (headerParagraph.querySelector('.progress-info')) {
    const barContainer = headerParagraph.nextElementSibling;
    if (barContainer && barContainer.classList.contains('progress-bar-container')) {
      barContainer.querySelector('.progress-bar-fill').style.width = pct + '%';
      barContainer.querySelector('.progress-bar-fill').setAttribute('aria-valuenow', pct);
    }
    const existingInfo = headerParagraph.parentElement.querySelector('.progress-info');
    if (existingInfo) {
      existingInfo.textContent = '';
      existingInfo.appendChild(document.createTextNode('\u041f\u0440\u043e\u0439\u0434\u0435\u043d\u043e: '));
      const strongCountUpd = document.createElement('strong');
      strongCountUpd.textContent = String(count);
      existingInfo.appendChild(strongCountUpd);
      existingInfo.appendChild(document.createTextNode(' \u0438\u0437 '));
      const strongTotalUpd = document.createElement('strong');
      strongTotalUpd.textContent = String(totalLessons);
      existingInfo.appendChild(strongTotalUpd);
      existingInfo.appendChild(document.createTextNode(' \u0443\u0440\u043e\u043a\u043e\u0432 (' + pct + '%)'));
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
    progressInfo.appendChild(document.createTextNode('\u041f\u0440\u043e\u0439\u0434\u0435\u043d\u043e: '));
    const strongCount = document.createElement('strong');
    strongCount.textContent = String(count);
    progressInfo.appendChild(strongCount);
    progressInfo.appendChild(document.createTextNode(' \u0438\u0437 '));
    const strongTotal = document.createElement('strong');
    strongTotal.textContent = String(totalLessons);
    progressInfo.appendChild(strongTotal);
    progressInfo.appendChild(document.createTextNode(' \u0443\u0440\u043e\u043a\u043e\u0432 (' + pct + '%)'));
    barContainer.parentNode.insertBefore(progressInfo, barContainer.nextSibling);
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
