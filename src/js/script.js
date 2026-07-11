'use strict';

/**
 * Main entry point for Python-Web interactive course
 * Imports and initializes all modules
 */

// Module initializers
import { initSyntaxHighlighting } from './modules/syntax-highlight.js';
import { initKeyboardNavigation } from './modules/keyboard-nav.js';
import { initBreadcrumbs } from './modules/breadcrumbs.js';
import { initLessonMetadata } from './modules/lesson-meta.js';
import { initTableOfContents } from './modules/toc.js';
import { initCodeToolbar } from './modules/code-toolbar.js';
import { initScrollProgressBar } from './modules/scroll-progress.js';
import { initThemeSystem, initBackToTopAndThemeToggle } from './modules/theme.js';
import { initProgressTracking } from './modules/progress.js';
import { initSearch } from './modules/search.js';
import { initSectionNavigation } from './modules/section-nav.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initContestLinkInjection } from './modules/contest-link.js';
import { initHamburgerMenu } from './modules/hamburger-menu.js';
import { initQuizSystem } from './modules/quiz.js';

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(function () { console.log('SW registered'); })
      .catch(function () { console.log('SW registration skipped'); });
  });
}

// Single DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', function () {
  initSyntaxHighlighting();
  initKeyboardNavigation();
  initBreadcrumbs();
  initLessonMetadata();
  initTableOfContents();
  initCodeToolbar();
  initScrollProgressBar();
  initThemeSystem();
  initBackToTopAndThemeToggle();
  initProgressTracking();
  initSearch();
  initSectionNavigation();
  initSmoothScroll();
  initContestLinkInjection();
  initHamburgerMenu();
  initQuizSystem();
});