'use strict';

/**
 * Badges rendering module
 * Renders earned achievement badges on the index page
 */

import { getCompletedLessons } from './progress.js';
import { safeGetItem } from '../config/security.js';
import { BADGES } from '../config/badges.js';

export function initBadgesRendering() {
  if (!document.body.classList.contains('index-page')) return;

  const badgesBlock = document.getElementById('badgesBlock');
  const badgesGrid = document.getElementById('badgesGrid');
  if (!badgesBlock || !badgesGrid) return;

  const completed = getCompletedLessons();

  const meta = buildMetaFromStorage();

  const earned = [];
  for (const badge of BADGES) {
    try {
      if (badge.check(completed, meta)) {
        earned.push(badge);
      }
    } catch (_e) {
      // skip badge check errors
    }
  }

  if (earned.length === 0) {
    badgesBlock.hidden = true;
    return;
  }

  badgesBlock.hidden = false;
  badgesGrid.textContent = '';

  for (const badge of earned) {
    const el = document.createElement('div');
    el.className = 'badge-item earned';
    el.title = badge.name + ': ' + badge.desc;
    el.setAttribute('aria-label', badge.name + ' — ' + badge.desc);

    const icon = document.createElement('span');
    icon.className = 'badge-icon';
    icon.textContent = badge.icon;

    const name = document.createElement('span');
    name.className = 'badge-name';
    name.textContent = badge.name;

    el.appendChild(icon);
    el.appendChild(name);
    badgesGrid.appendChild(el);
  }

  const total = BADGES.length;
  const summary = document.createElement('div');
  summary.className = 'badge-summary';
  summary.textContent = earned.length + ' из ' + total + ' достижений';
  badgesBlock.appendChild(summary);
}

function buildMetaFromStorage() {
  const meta = {};

  try {
    const raw = safeGetItem('python-lesson-badges');
    if (raw) {
      const badges = JSON.parse(raw);
      if (badges.lessonDates) meta.lessonDates = badges.lessonDates;
      if (badges.finalTestScore !== undefined) meta.finalTestScore = badges.finalTestScore;
      if (badges.streak !== undefined) meta.streak = badges.streak;
      if (badges.codeRuns !== undefined) meta.codeRuns = badges.codeRuns;
    }
  } catch (_e) {
    // ignore
  }

  try {
    const raw = safeGetItem('python-web-quiz-scores');
    if (raw) meta.quizScores = JSON.parse(raw);
  } catch (_e) {
    // ignore
  }

  return meta;
}
