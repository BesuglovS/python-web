'use strict';

import { loadBadges } from './api-client.js';
import { BADGES } from '../config/badges.js';

export function initBadgesRendering() {
  if (!document.body.classList.contains('index-page')) return;

  const badgesBlock = document.getElementById('badgesBlock');
  const badgesGrid = document.getElementById('badgesGrid');
  if (!badgesBlock || !badgesGrid) return;

  loadBadges().then(function (data) {
    if (!data || !data.badges || data.badges.length === 0) {
      badgesBlock.hidden = true;
      return;
    }

    const earnedIds = data.badges;
    badgesBlock.hidden = false;
    badgesGrid.textContent = '';

    const badgeMap = {};
    for (const b of BADGES) {
      badgeMap[b.id] = b;
    }

    for (const id of earnedIds) {
      const badge = badgeMap[id];
      if (!badge) continue;

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
    const summaryEl = document.createElement('div');
    summaryEl.className = 'badge-summary';
    summaryEl.textContent = earnedIds.length + ' из ' + total + ' достижений';
    badgesBlock.appendChild(summaryEl);
  }).catch(function () {
    badgesBlock.hidden = true;
  });
}
