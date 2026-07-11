'use strict';

/**
 * Theme toggling module
 */

import { updateThemeIcon } from './utils.js';

const THEME_KEY = 'python-web-theme';

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getSavedTheme() {
  return safeGetItem(THEME_KEY);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function getEffectiveTheme() {
  const saved = getSavedTheme();
  return saved === 'light' || saved === 'dark' ? saved : getSystemTheme();
}

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
  themeToggle.setAttribute('aria-label', 'Переключить тему');

  let currentTheme = safeGetItem(THEME_KEY) || 'auto';
  let hideTimeout;

  function getEffective() {
    return currentTheme === 'auto'
      ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : currentTheme;
  }

  function updateIcon() {
    updateThemeIcon(themeToggle, currentTheme, getEffective());
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
      container.classList.toggle('visible', window.scrollY > 400);
    }, 50);
  });
}
