'use strict';

/**
 * Theme toggling module
 * Handles dark/light theme switching and persistence
 */

import { updateThemeIcon } from './utils.js';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../config/security.js';
import { BACK_TO_TOP_THRESHOLD, SCROLL_DEBOUNCE_MS } from '../config/constants.js';

const THEME_KEY = 'python-web-theme';

/**
 * Get system preferred theme
 * @returns {'dark'|'light'} - Preferred theme
 */
function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get saved theme preference
 * @returns {string|null} - 'light', 'dark', or null for auto
 */
function getSavedTheme() {
  return safeGetItem(THEME_KEY);
}

/**
 * Apply theme to document
 * @param {'light'|'dark'} theme - Theme to apply
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Get effective theme (saved or system preferred)
 * @returns {'light'|'dark'} - Effective theme
 */
function getEffectiveTheme() {
  const saved = getSavedTheme();
  return saved === 'light' || saved === 'dark' ? saved : getSystemTheme();
}

/**
 * Update theme toggle icon
 * @param {string} saved - Saved theme preference
 */
function updateThemeToggleIcon(saved) {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  updateThemeIcon(btn, saved || 'auto', getSystemTheme());
}

export function initThemeSystem() {
  const saved = getSavedTheme();
  applyTheme(getEffectiveTheme());
  updateThemeToggleIcon(saved || 'auto');

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!getSavedTheme()) {
        applyTheme(getSystemTheme());
        updateThemeToggleIcon('auto');
      }
    });
  }

  // Expose for other modules
  window.__themeUtils = {
    THEME_KEY: THEME_KEY,
    getSystemTheme: getSystemTheme,
    getSavedTheme: getSavedTheme,
    applyTheme: applyTheme,
    updateThemeToggleIcon: updateThemeToggleIcon,
    getEffectiveTheme: getEffectiveTheme,
  };
}

export function initBackToTopAndThemeToggle() {
  const container = document.createElement('div');
  container.className = 'bottom-controls';
  document.body.appendChild(container);

  // Back to top
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.textContent = '⬆';
  backToTop.title = 'Наверх страницы';
  backToTop.setAttribute('aria-label', 'Прокрутить наверх');
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  container.appendChild(backToTop);

  // Theme toggle
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', '\u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0442\u0435\u043c\u0443');
  themeToggle.setAttribute('role', 'switch');

  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'sr-only';
  document.body.appendChild(liveRegion);

  let currentTheme = getEffectiveTheme();
  let hideTimeout;

  function getEffective() {
    return currentTheme === 'auto' ? getSystemTheme() : currentTheme;
  }

  function updateIcon() {
    updateThemeIcon(themeToggle, currentTheme, getEffective());
    const labels = { light: '\u0421\u0432\u0435\u0442\u043b\u0430\u044f', dark: '\u0422\u0451\u043c\u043d\u0430\u044f', auto: '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f' };
    themeToggle.setAttribute('aria-checked', getEffective() === 'dark' ? 'true' : 'false');
    liveRegion.textContent = '\u0422\u0435\u043c\u0430: ' + (labels[currentTheme] || '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f');
  }

  updateIcon();

  themeToggle.addEventListener('click', function () {
    let next;
    if (currentTheme === 'light') {
      next = 'dark';
    } else if (currentTheme === 'dark') {
      next = 'auto';
    } else {
      next = 'light';
    }
    currentTheme = next;

    if (next === 'auto') {
      safeRemoveItem(THEME_KEY);
      currentTheme = 'auto';
    } else {
      safeSetItem(THEME_KEY, next);
    }

    const effective = getEffective();
    document.documentElement.setAttribute('data-theme', effective);
    updateIcon();
  });

  container.appendChild(themeToggle);

  // Show/hide on scroll
  window.addEventListener('scroll', function () {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(function () {
      container.classList.toggle('visible', window.scrollY > BACK_TO_TOP_THRESHOLD);
    }, SCROLL_DEBOUNCE_MS);
  });
}