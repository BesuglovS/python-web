'use strict';

/**
 * Scroll position restore module
 * Saves and restores scroll position within lessons
 */

import { safeGetItem, safeSetItem } from '../config/security.js';

const SCROLL_STORAGE_KEY = 'python-web-scroll-positions';
const RESTORE_DELAY_MS = 100;
const SAVE_DEBOUNCE_MS = 500;

export function initScrollRestore() {
  const pageName = window.location.pathname.split('/').pop() || '';
  if (!pageName || pageName === 'index.html' || pageName === '') return;

  const saved = getScrollPosition(pageName);
  if (saved > 0) {
    setTimeout(function () {
      window.scrollTo(0, saved);
      showToast();
    }, RESTORE_DELAY_MS);
  }

  let saveTimer = null;
  window.addEventListener('scroll', function () {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveScrollPosition(pageName, window.scrollY);
    }, SAVE_DEBOUNCE_MS);
  }, { passive: true });
}

function getScrollPosition(pageName) {
  try {
    const raw = safeGetItem(SCROLL_STORAGE_KEY);
    if (!raw) return 0;
    const positions = JSON.parse(raw);
    return positions[pageName] || 0;
  } catch (_e) {
    return 0;
  }
}

function tryParseScrollData(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_e) {
    return {};
  }
}

function saveScrollPosition(pageName, y) {
  try {
    const raw = safeGetItem(SCROLL_STORAGE_KEY);
    const positions = tryParseScrollData(raw);
    positions[pageName] = y;
    safeSetItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch (_e) {
    console.warn('Failed to save scroll position');
  }
}

function showToast() {
  const toast = document.createElement('div');
  toast.className = 'scroll-restored-toast';
  toast.textContent = 'Позиция чтения восстановлена';
  document.body.appendChild(toast);
  setTimeout(function () {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2200);
}
