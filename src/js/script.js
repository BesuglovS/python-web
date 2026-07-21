'use strict';

/**
 * Main entry point for Python-Web interactive course
 * Imports and initializes all modules using promise-based initialization
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
import { initBadgesRendering } from './modules/badges-render.js';
import { initDragDropExercises } from './modules/drag-drop.js';
import { initScrollRestore } from './modules/scroll-restore.js';
import { initErrorTracking } from './modules/error-tracking.js';
import { initAuth } from './modules/auth.js';

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(function () { console.log('SW registered'); })
      .catch(function () { console.log('SW registration skipped'); });
  });
}

/**
 * Initialize application modules with error handling and prioritization
 */
function initializeApplication() {
  const initPromises = [
    Promise.resolve(initErrorTracking()),
    Promise.resolve(initThemeSystem()),
    Promise.resolve(initBackToTopAndThemeToggle()),
    Promise.resolve(initProgressTracking()),
    Promise.resolve(initSyntaxHighlighting()),
    Promise.resolve(initKeyboardNavigation()),
    Promise.resolve(initBreadcrumbs()),
    Promise.resolve(initLessonMetadata()),
    Promise.resolve(initTableOfContents()),
    Promise.resolve(initCodeToolbar()),
    Promise.resolve(initScrollProgressBar()),
    Promise.resolve(initSearch()),
    Promise.resolve(initSectionNavigation()),
    Promise.resolve(initSmoothScroll()),
    Promise.resolve(initContestLinkInjection()),
    Promise.resolve(initHamburgerMenu()),
    Promise.resolve(initQuizSystem()),
    Promise.resolve(initBadgesRendering()),
    Promise.resolve(initDragDropExercises()),
    Promise.resolve(initScrollRestore()),
    Promise.resolve(initAuth()),
  ];

  return Promise.allSettled(initPromises)
    .then(function (results) {
      const errors = [];
      results.forEach(function (result, index) {
        if (result.status === 'rejected') {
          const moduleNames = [
            'Error Tracking', 'Theme System', 'Theme Toggle', 'Progress Tracking',
            'Syntax Highlighting', 'Keyboard Navigation', 'Breadcrumbs', 'Lesson Metadata',
            'Table of Contents', 'Code Toolbar', 'Scroll Progress', 'Search',
            'Section Navigation', 'Smooth Scroll', 'Contest Links', 'Hamburger Menu', 'Quiz System', 'Badges Rendering', 'Drag-Drop Exercises', 'Scroll Restore', 'Auth'
          ];
          errors.push(moduleNames[index] + ': ' + (result.reason?.message || 'Unknown error'));
          console.error('Failed to initialize:', moduleNames[index], result.reason);
        }
      });

      if (errors.length > 0) {
        console.warn('Some modules failed to initialize:', errors.join(', '));
      }

      console.log('Application initialization complete');
    })
    .catch(function (error) {
      console.error('Critical initialization error:', error);
    });
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  initializeApplication();
});