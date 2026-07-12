'use strict';

/**
 * Security utilities for safe localStorage access
 */

import { MAX_STORAGE_VALUE_LENGTH } from './constants.js';

const SAFE_KEYS = new Set([
  'python-web-theme',
  'python-web-progress',
  'python-web-course-progress',
  'python-repl-history',
  'python-lessons-completed',
  'python-lesson-badges',
  'sw-version',
  'python-web-quiz-scores',
]);

function safeGetItem(key) {
  if (!SAFE_KEYS.has(key)) {
    console.warn('localStorage: denied read for', key);
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (_e) {
    return null;
  }
}

function safeSetItem(key, value) {
  if (SAFE_KEYS.has(key)) {
    try {
      if (typeof value === 'string' && value.length > MAX_STORAGE_VALUE_LENGTH) {
        throw new Error('Value too large');
      }
      localStorage.setItem(key, value);
    } catch (_e) {
      console.warn('localStorage: failed to save', key, '- progress may not persist');
      try {
        if (typeof CustomEvent !== 'undefined') {
          const ev = new CustomEvent('storage-warning', { detail: { key: key } });
          document.dispatchEvent(ev);
        }
      } catch (_e2) {
        // non-browser environment
      }
    }
  } else {
    console.warn('localStorage: denied write for', key);
  }
}

function safeRemoveItem(key) {
  if (SAFE_KEYS.has(key)) {
    try {
      localStorage.removeItem(key);
    } catch (_e) {
      // silently fail
    }
  } else {
    console.warn('localStorage: denied remove for', key);
  }
}

// ─── Helper: convert progress array to lesson-number lookup ───
// Progress is stored as ["01-history.html", "02-variables.html", ...]
// This builds {"1": true, "2": true, ...} for badge checks.
function _buildLessonLookup(progress) {
  const lookup = {};
  if (!progress) return lookup;
  const arr = Array.isArray(progress) ? progress : [];
  for (let i = 0; i < arr.length; i++) {
    const m = String(arr[i]).match(/^(\d+)/);
    if (m) lookup[parseInt(m[1], 10)] = true;
  }
  return lookup;
}

export {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  _buildLessonLookup,
};