'use strict';

/**
 * Error tracking module
 * Captures unhandled errors and promise rejections for debugging
 */

import { MAX_TRACKED_ERRORS } from '../config/constants.js';

const errors = [];

/**
 * Format error for storage
 * @param {Error} error - The error object
 * @param {string} source - Error source ('error' or 'unhandledrejection')
 * @returns {Object} - Formatted error object
 */
function formatError(error, source) {
  return {
    message: error.message || String(error),
    stack: error.stack || '',
    source: source,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

/**
 * Handle global errors
 * @param {ErrorEvent} event - The error event
 */
function onError(event) {
  if (errors.length >= MAX_TRACKED_ERRORS) return;
  errors.push(formatError(event.error || new Error(event.message), 'error'));
}

/**
 * Handle unhandled promise rejections
 * @param {PromiseRejectionEvent} event - The rejection event
 */
function onRejection(event) {
  if (errors.length >= MAX_TRACKED_ERRORS) return;
  const reason = event.reason;
  errors.push(formatError(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledrejection'));
}

/**
 * Initialize error tracking
 */
export function initErrorTracking() {
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  // Expose debug API
  window.__errors = {
    list: function () {
      return errors.slice();
    },
    count: function () {
      return errors.length;
    },
    clear: function () {
      errors.length = 0;
    },
  };
}