'use strict';

/**
 * Utility functions shared across modules
 * Provides common utilities for the Python-Web course application
 */

import {
  THEORY_CONTESTS,
  CONTEST_BASE_URL,
  COMPLEXITY_LABELS,
} from '../config/courseData.js';
import { MAX_INPUT_LENGTH } from '../config/constants.js';

/**
 * Sanitize user input (strip HTML, limit length)
 * @param {string} text - Input text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  cleaned = textarea.value;
  cleaned = cleaned.replace(/\0/g, '');
  if (cleaned.length > MAX_INPUT_LENGTH) {
    cleaned = cleaned.substring(0, MAX_INPUT_LENGTH);
  }
  return cleaned;
}

/**
 * Shared lessons.json cache
 */
let _lessonsCache = null;
let _lessonsCachePromise = null;

/**
 * Fetch lessons data with caching
 * @returns {Promise<Object>} - Lessons data from lessons.json
 */
export function fetchLessonsData() {
  if (_lessonsCache) return Promise.resolve(_lessonsCache);
  if (_lessonsCachePromise) return _lessonsCachePromise;
  _lessonsCachePromise = fetch('lessons.json')
    .then(function (response) {
      if (!response.ok) throw new Error('lessons.json not available');
      return response.json();
    })
    .then(function (data) {
      _lessonsCache = data;
      return data;
    })
    .catch(function (err) {
      _lessonsCachePromise = null;
      throw err;
    });
  return _lessonsCachePromise;
}

/**
 * Create contest badge element
 * @param {number} lessonNum - Lesson number
 * @returns {HTMLElement|null} - Contest badge element or null
 */
export function createContestBadge(lessonNum) {
  if (!THEORY_CONTESTS || !THEORY_CONTESTS[lessonNum]) return null;
  const contestId = THEORY_CONTESTS[lessonNum];
  const baseUrl =
    (CONTEST_BASE_URL || 'https://contest.nayanovaacademy.ru/index.php?page=contest&id=') +
    contestId;
  const badge = document.createElement('a');
  badge.className = 'contest-badge';
  badge.href = baseUrl;
  badge.target = '_blank';
  badge.rel = 'noopener noreferrer';
  badge.title = 'Задачи к этой теме';
  badge.textContent = '📝';
  badge.setAttribute('aria-label', 'Открыть задачи контеста');
  return badge;
}

/**
 * Create meta info element (duration + complexity)
 * @param {number} duration - Lesson duration in minutes
 * @param {string} complexity - Lesson complexity level
 * @returns {HTMLElement|null} - Meta info element or null
 */
export function createMetaInfo(duration, complexity) {
  if (typeof COMPLEXITY_LABELS === 'undefined') return null;
  const label = COMPLEXITY_LABELS[complexity] || complexity;
  const metaDiv = document.createElement('div');
  metaDiv.className = 'topic-meta';

  const durationSpan = document.createElement('span');
  durationSpan.className = 'meta-duration';
  durationSpan.textContent = '⏱ ' + duration + ' мин';

  const sep = document.createTextNode(' · ');

  const complexitySpan = document.createElement('span');
  complexitySpan.className = 'meta-complexity';
  complexitySpan.setAttribute('data-level', complexity);
  complexitySpan.textContent = label;

  metaDiv.appendChild(durationSpan);
  metaDiv.appendChild(sep);
  metaDiv.appendChild(complexitySpan);
  return metaDiv;
}

/**
 * Theme icon mapping
 * @param {string} theme - Theme name (auto, dark, light)
 * @returns {Object} - Icon data with icon and title
 */
export function getThemeIconData(theme) {
  if (theme === 'auto') return { icon: '🔄', title: 'Авто' };
  if (theme === 'dark') return { icon: '🌙', title: 'Тёмная тема' };
  return { icon: '🌞', title: 'Светлая тема' };
}

export function updateThemeIcon(btn, theme, effectiveTheme) {
  const data = getThemeIconData(theme);
  btn.textContent = data.icon;
  btn.title = theme === 'auto' ? 'Авто (сейчас: ' + effectiveTheme + ')' : data.title;
}

/**
 * Show sandbox result in output element
 * @param {HTMLElement} outputEl - Output element
 * @param {Object} result - Sandbox execution result
 */
export function showSandboxResult(outputEl, result) {
  outputEl.textContent = '';
  if (result.stdout) {
    const stdoutDiv = document.createElement('div');
    stdoutDiv.className = 'sb-stdout';
    stdoutDiv.textContent = result.stdout;
    outputEl.appendChild(stdoutDiv);
  }
  if (result.stderr) {
    const stderrDiv = document.createElement('div');
    stderrDiv.className = 'sb-stderr';
    stderrDiv.appendChild(document.createTextNode('⚠️ '));
    stderrDiv.appendChild(document.createTextNode(result.stderr));
    outputEl.appendChild(stderrDiv);
  }
  if (!result.stdout && !result.stderr) {
    const messageDiv = document.createElement('div');
    if (result.ok) {
      messageDiv.className = 'sb-stdout';
      messageDiv.textContent = '✅ Код выполнен без вывода';
    } else {
      messageDiv.className = 'sb-stderr';
      messageDiv.textContent = '⚠️ Ошибка выполнения (код ' + result.exit_code + ')';
    }
    outputEl.appendChild(messageDiv);
  }
  outputEl.className = outputEl.className.replace(/\brunning\b/, '') + ' show';
  outputEl.classList.remove('error');
  outputEl.style.display = 'block';
  if (!result.ok) {
    outputEl.classList.add('error');
  }
}