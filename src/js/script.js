'use strict';

/**
 * Main entry point for Python-Web interactive course
 * Imports and initializes all modules using sequential initialization
 */

// Module initializers
import { initSyntaxHighlighting } from './modules/syntax-highlight.js';
import { initKeyboardNavigation } from './modules/keyboard-nav.js';
import { initLessonMetadata } from './modules/lesson-meta.js';
import { initTableOfContents } from './modules/toc.js';
import { initCodeToolbar } from './modules/code-toolbar.js';
import { initScrollProgressBar } from './modules/scroll-progress.js';
import { initThemeSystem, initBackToTopAndThemeToggle } from './modules/theme.js';
import { initProgressTracking, loadProgressFromServer } from './modules/progress.js';
import { initSearch } from './modules/search.js';
import { initSectionNavigation } from './modules/section-nav.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initContestLinkInjection } from './modules/contest-link.js';
import { initHamburgerMenu } from './modules/hamburger-menu.js';
import { initQuizSystem } from './modules/quiz.js';
import { initBadgesRendering } from './modules/badges-render.js';
import { initDragDropExercises } from './modules/drag-drop.js';
import { initScrollRestore } from './modules/scroll-restore.js';
import { initErrorTracking } from './modules/error-tracking.js';
import { initAuth } from './modules/auth.js';
import { initSetsVisual } from './modules/sets-visual.js';

// Service Worker Registration
// Регистрируем SW только в secure context (https) и не в headless-браузерах
// (Lighthouse/HeadlessChrome). На http://localhost и при прогоне Lighthouse SW
// не нужен, а его перехват fetch может ломать навигацию ("Chrome prevented page
// load with an interstitial"). userAgent-проверка страхует на случай, если LHCI
// переиспользует профиль с ранее зарегистрированным SW.
const _ua = navigator.userAgent || '';
const _isHeadless = /HeadlessChrome|Lighthouse/i.test(_ua);
if ('serviceWorker' in navigator && location.protocol === 'https:' && !_isHeadless) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(function () { console.log('SW registered'); })
      .catch(function () { console.log('SW registration skipped'); });
  });
}

/**
 * Initialize application modules with sequential ordering.
 *
 * Critical path: fast sync modules → auth → load progress → render progress UI → everything else.
 * Auth must complete before progress loading; progress must load before UI rendering.
 */
async function initializeApplication() {
  try {
    // 1. Fast synchronous modules (no deps)
    initErrorTracking();
    initThemeSystem();
    initBackToTopAndThemeToggle();

    // 2. Authentication (must complete first)
    const user = await initAuth();
    if (!user) return; // Auth gate shown, stop here

    // 3. Load progress from server DB
    await loadProgressFromServer();

    // 4. Render progress UI (data is now available)
    initProgressTracking();

    // 5. All remaining modules (can run concurrently)
    await Promise.allSettled([
      initSyntaxHighlighting(),
      initKeyboardNavigation(),
      initLessonMetadata(),
      initTableOfContents(),
      initCodeToolbar(),
      initScrollProgressBar(),
      initSearch(),
      initSectionNavigation(),
      initSmoothScroll(),
      initContestLinkInjection(),
      initHamburgerMenu(),
      initQuizSystem(),
      initBadgesRendering(),
      initDragDropExercises(),
      initSetsVisual(),
      initScrollRestore(),
    ]);
  } catch (error) {
    console.error('Critical initialization error:', error);
  }
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  initializeApplication();
});
