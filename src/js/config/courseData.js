'use strict';

/**
 * Course configuration data from lessons.json
 * This is the single source of truth for course metadata
 */
// THEORY_CONTESTS генерируется из lessons.json (поле contest) скриптом build-config-meta.mjs.
// Источник истины — lessons.json, НЕ этот файл.
// Для обновления: node build-config-meta.mjs
const THEORY_CONTESTS = {
   8: 7,
  10: 8,
  12: 10,
  15: 9,
  17: 12,
  19: 13,
  21: 14,
  22: 11,
  25: 16,
  26: 15,
  27: 17,
  28: 20,
  29: 18,
  30: 19,
};

const CONTEST_BASE_URL = 'https://contest.nayanovaacademy.ru/index.php?page=contest&id=';
const REPL_URL = 'sandbox/run.php';
const TOTAL_LESSONS = 50;

// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.
// Источник истины — lessons.json, НЕ этот файл.
// Для обновления: node build-config-meta.mjs
const LESSON_META = {
   1: { duration: 10, complexity: 'beginner' },
   2: { duration: 8, complexity: 'beginner' },
   3: { duration: 10, complexity: 'beginner' },
   4: { duration: 12, complexity: 'beginner' },
   5: { duration: 8, complexity: 'beginner' },
   6: { duration: 10, complexity: 'beginner' },
   7: { duration: 10, complexity: 'beginner' },
   8: { duration: 10, complexity: 'beginner' },
   9: { duration: 8, complexity: 'beginner' },
  10: { duration: 12, complexity: 'basic' },
  11: { duration: 10, complexity: 'basic' },
  12: { duration: 8, complexity: 'basic' },
  13: { duration: 8, complexity: 'basic' },
  14: { duration: 12, complexity: 'basic' },
  15: { duration: 10, complexity: 'basic' },
  16: { duration: 15, complexity: 'intermediate' },
  17: { duration: 10, complexity: 'basic' },
  18: { duration: 12, complexity: 'basic' },
  19: { duration: 8, complexity: 'basic' },
  20: { duration: 8, complexity: 'basic' },
  21: { duration: 10, complexity: 'basic' },
  22: { duration: 12, complexity: 'basic' },
  23: { duration: 15, complexity: 'intermediate' },
  24: { duration: 12, complexity: 'basic' },
  25: { duration: 15, complexity: 'basic' },
  26: { duration: 10, complexity: 'basic' },
  27: { duration: 10, complexity: 'basic' },
  28: { duration: 15, complexity: 'basic' },
  29: { duration: 8, complexity: 'basic' },
  30: { duration: 12, complexity: 'intermediate' },
  31: { duration: 12, complexity: 'intermediate' },
  32: { duration: 12, complexity: 'basic' },
  33: { duration: 12, complexity: 'basic' },
  34: { duration: 15, complexity: 'intermediate' },
  35: { duration: 10, complexity: 'basic' },
  36: { duration: 12, complexity: 'intermediate' },
  37: { duration: 12, complexity: 'basic' },
  38: { duration: 10, complexity: 'basic' },
  39: { duration: 10, complexity: 'basic' },
  40: { duration: 15, complexity: 'intermediate' },
  41: { duration: 15, complexity: 'intermediate' },
  42: { duration: 15, complexity: 'intermediate' },
  43: { duration: 12, complexity: 'intermediate' },
  44: { duration: 12, complexity: 'intermediate' },
  45: { duration: 15, complexity: 'advanced' },
  46: { duration: 10, complexity: 'basic' },
  47: { duration: 12, complexity: 'intermediate' },
  48: { duration: 12, complexity: 'intermediate' },
  49: { duration: 15, complexity: 'intermediate' },
  50: { duration: 12, complexity: 'basic' },
};

const COMPLEXITY_LABELS = {
  beginner: '🚀 Начальный',
  basic: '📘 Базовый',
  intermediate: '📗 Средний',
  advanced: '📙 Продвинутый',
};

// Expose to window for backward compatibility (repl.js, tests)
window.THEORY_CONTESTS = THEORY_CONTESTS;
window.CONTEST_BASE_URL = CONTEST_BASE_URL;
window.TOTAL_LESSONS = TOTAL_LESSONS;
window.LESSON_META = LESSON_META;
window.COMPLEXITY_LABELS = COMPLEXITY_LABELS;

export {
  THEORY_CONTESTS,
  CONTEST_BASE_URL,
  REPL_URL,
  TOTAL_LESSONS,
  LESSON_META,
  COMPLEXITY_LABELS,
};