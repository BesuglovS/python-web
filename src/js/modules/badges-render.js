'use strict';

import { loadBadges } from './api-client.js';
import { BADGES } from '../config/badges.js';
import { LESSON_BADGES } from '../config/courseData.js';

let _earnedIds = [];
let _earnedSet = {};
let _badgeProgress = {};

export function initBadgesRendering() {
  if (!document.body.classList.contains('index-page')) return;

  const badgesBlock = document.getElementById('badgesBlock');
  const badgesGrid = document.getElementById('badgesGrid');
  const badgesAllBtn = document.getElementById('badgesAllBtn');
  if (!badgesBlock || !badgesGrid) return;

  loadBadges().then(function (data) {
    if (!data) {
      badgesBlock.hidden = true;
      return;
    }

    _earnedIds = data.badges || [];
    _badgeProgress = data.progress || {};
    _earnedSet = {};
    for (let i = 0; i < _earnedIds.length; i++) {
      _earnedSet[_earnedIds[i]] = true;
    }

    renderAchievementsBlock(badgesBlock, badgesGrid, badgesAllBtn);
    renderLessonMap();
  }).catch(function () {
    badgesBlock.hidden = true;
  });
}

function renderAchievementsBlock(badgesBlock, badgesGrid, badgesAllBtn) {
  badgesBlock.hidden = false;
  badgesGrid.textContent = '';

  const badgeMap = buildBadgeMap(BADGES);

  for (let j = 0; j < _earnedIds.length; j++) {
    const badge = badgeMap[_earnedIds[j]];
    if (!badge) continue;

    const el = document.createElement('div');
    el.className = 'badge-item earned';
    el.setAttribute('data-tooltip', badge.name + ': ' + badge.desc);
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

  const summaryEl = document.createElement('div');
  summaryEl.className = 'badge-summary';
  summaryEl.textContent = countEarnedFrom(BADGES) + ' из ' + BADGES.length + ' достижений';
  badgesBlock.appendChild(summaryEl);

  if (badgesAllBtn) {
    badgesAllBtn.addEventListener('click', function () {
      openAchievementsModal();
    });
  }
}

/**
 * «Карта прогресса» — витрина per-lesson бейджей на главной.
 * 50 плиток-ссылок на уроки: пройденные подсвечены, остальные приглушены.
 */
function renderLessonMap() {
  const mapBlock = document.getElementById('lessonMapBlock');
  const mapGrid = document.getElementById('lessonMapGrid');
  const mapCounter = document.getElementById('lessonMapCounter');
  if (!mapBlock || !mapGrid) return;

  mapBlock.hidden = false;
  mapGrid.textContent = '';

  let earnedCount = 0;
  for (let i = 0; i < LESSON_BADGES.length; i++) {
    const lb = LESSON_BADGES[i];
    const isEarned = !!_earnedSet[lb.id];
    if (isEarned) earnedCount++;

    const tile = document.createElement('a');
    tile.className = 'lesson-map-tile' + (isEarned ? ' earned' : '');
    tile.href = lb.file;
    tile.textContent = lb.num;
    tile.setAttribute('data-tooltip', 'Урок ' + lb.num + '. ' + lb.title + (isEarned ? ' — пройден' : ''));
    tile.setAttribute(
      'aria-label',
      'Урок ' + lb.num + '. ' + lb.title + (isEarned ? ' (пройден)' : ' (не пройден)'),
    );

    mapGrid.appendChild(tile);
  }

  if (mapCounter) {
    mapCounter.textContent = 'Пройдено ' + earnedCount + ' из ' + LESSON_BADGES.length;
  }
}

function buildBadgeMap(badges) {
  const map = {};
  for (let i = 0; i < badges.length; i++) {
    map[badges[i].id] = badges[i];
  }
  return map;
}

function countEarnedFrom(badges) {
  let count = 0;
  for (let i = 0; i < badges.length; i++) {
    if (_earnedSet[badges[i].id]) count++;
  }
  return count;
}

function openAchievementsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal achievements-modal';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.textContent = '🏆 Достижения';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.type = 'button';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Закрыть');

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';

  const counter = document.createElement('div');
  counter.className = 'achievements-counter';
  counter.textContent = countEarnedFrom(BADGES) + ' из ' + BADGES.length + ' получено';
  body.appendChild(counter);

  const grid = document.createElement('div');
  grid.className = 'achievements-grid';

  for (let j = 0; j < BADGES.length; j++) {
    const b = BADGES[j];
    grid.appendChild(createAchievementCard(b.icon, b.name, b.desc, b.id));
  }

  body.appendChild(grid);
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);

  requestAnimationFrame(function () {
    overlay.classList.add('active');
  });

  function closeModal() {
    overlay.classList.remove('active');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handler);
    }
  });
}

function createAchievementCard(icon, name, desc, badgeId) {
  const isEarned = !!_earnedSet[badgeId];
  const progress = _badgeProgress[badgeId] || { current: 0, required: 1 };

  const card = document.createElement('div');
  card.className = 'achievement-card' + (isEarned ? ' earned' : '');

  const cardIcon = document.createElement('div');
  cardIcon.className = 'achievement-icon';
  cardIcon.textContent = icon;

  const cardName = document.createElement('div');
  cardName.className = 'achievement-name';
  cardName.textContent = name;

  const cardDesc = document.createElement('div');
  cardDesc.className = 'achievement-desc';
  cardDesc.textContent = desc;

  const cardProgress = document.createElement('div');
  cardProgress.className = 'achievement-progress';

  if (isEarned) {
    const earnedLabel = document.createElement('span');
    earnedLabel.className = 'achievement-earned-label';
    earnedLabel.textContent = '✓ Получено';
    cardProgress.appendChild(earnedLabel);
  } else {
    const current = Math.min(progress.current, progress.required);
    const required = progress.required;

    const progressBar = document.createElement('div');
    progressBar.className = 'achievement-progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'achievement-progress-fill';
    const pct = required > 0 ? Math.round((current / required) * 100) : 0;
    progressFill.style.width = pct + '%';
    progressBar.appendChild(progressFill);

    const progressText = document.createElement('div');
    progressText.className = 'achievement-progress-text';
    progressText.textContent = current + ' / ' + required;

    cardProgress.appendChild(progressBar);
    cardProgress.appendChild(progressText);
  }

  card.appendChild(cardIcon);
  card.appendChild(cardName);
  card.appendChild(cardDesc);
  card.appendChild(cardProgress);
  return card;
}
