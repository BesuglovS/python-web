'use strict';

// ─── Safe localStorage wrappers ───
const SAFE_KEYS = new Set([
  'python-web-theme',
  'python-web-progress',
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
      if (typeof value === 'string' && value.length > 102400) throw new Error('Value too large');
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

// ─── Course Configuration ───
const THEORY_CONTESTS = {
  8: 7, 10: 8, 12: 10, 15: 9, 17: 12, 19: 13,
  21: 14, 22: 11, 25: 16, 26: 15, 27: 17, 28: 20,
  29: 18, 30: 19,
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

// ─── Badges / Achievements ───
const BADGES = [
  {
    id: 'first_steps',
    name: 'Первые шаги',
    icon: '🐣',
    desc: 'Завершить первые 5 уроков',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [1, 2, 3, 4, 5].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'condition_master',
    name: 'Мастер условий',
    icon: '🔀',
    desc: 'Пройти уроки по условиям (9-13)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [9, 10, 11, 12, 13].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'string_ninja',
    name: 'Струнный ниндзя',
    icon: '🔤',
    desc: 'Пройти уроки по строкам (7,14,15,16)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [7, 14, 15, 16].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'loop_hero',
    name: 'Повелитель циклов',
    icon: '🔄',
    desc: 'Пройти уроки по циклам (17-21)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [17, 18, 19, 20, 21].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'data_wizard',
    name: 'Хранитель данных',
    icon: '🗂️',
    desc: 'Пройти уроки по структурам данных (25-31)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [25, 26, 27, 28, 29, 30, 31].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'halfway',
    name: 'Экватор',
    icon: '🌍',
    desc: 'Пройти 25+ уроков (половина курса)',
    check: function (completed) {
      if (!completed) return false;
      const arr = Array.isArray(completed) ? completed : [];
      return arr.length >= 25;
    },
  },
  {
    id: 'func_guru',
    name: 'Мастер функций',
    icon: '⚙️',
    desc: 'Пройти уроки 22-24 (функции и отладка)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [22, 23, 24].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'module_explorer',
    name: 'Исследователь модулей',
    icon: '🧰',
    desc: 'Пройти уроки по модулям (35-40)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [35, 36, 37, 38, 39, 40].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'error_handler',
    name: 'Ловец ошибок',
    icon: '⚠️',
    desc: 'Пройти урок по try/except (11)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return !!l[11];
    },
  },
  {
    id: 'oop_master',
    name: 'Архитектор классов',
    icon: '🏗️',
    desc: 'Пройти уроки по ООП (41-42)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [41, 42].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'file_master',
    name: 'Файловый маг',
    icon: '📁',
    desc: 'Пройти уроки по файлам и БД (32-34)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [32, 33, 34].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'tool_master',
    name: 'Инструментальщик',
    icon: '🛠️',
    desc: 'Пройти уроки по инструментам (47-50)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [47, 48, 49, 50].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'intermediate',
    name: 'Продвинутый',
    icon: '🚀',
    desc: 'Пройти продвинутые уроки (21,25,30)',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return [21, 25, 30].every(function (n) { return l[n]; });
    },
  },
  {
    id: 'all_lessons',
    name: 'Python-эксперт',
    icon: '👑',
    desc: 'Пройти все 50 уроков',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      for (let i = 1; i <= TOTAL_LESSONS; i++) {
        if (!l[i]) return false;
      }
      return true;
    },
  },
  {
    id: 'speedrun',
    name: 'Спидран',
    icon: '⚡',
    desc: 'Пройти 3 урока за один день',
    check: function (completed, meta) {
      if (!meta || !meta.lessonDates) return false;
      const today = new Date().toDateString();
      let count = 0;
      const dates = meta.lessonDates;
      for (const key in dates) {
        if (dates[key] && new Date(dates[key]).toDateString() === today) count++;
      }
      return count >= 3;
    },
  },
  {
    id: 'quiz_champion',
    name: 'Знаток тестов',
    icon: '🏅',
    desc: 'Пройти итоговый тест на 90%+',
    check: function (_completed, meta) {
      return meta && meta.finalTestScore >= 90;
    },
  },
  {
    id: 'quiz_perfect',
    name: 'Идеальный результат',
    icon: '🎯',
    desc: 'Пройти итоговый тест на 100%',
    check: function (_completed, meta) {
      return meta && meta.finalTestScore >= 100;
    },
  },
  {
    id: 'streak_7',
    name: 'Недельный марафон',
    icon: '🔥',
    desc: 'Заниматься 7 дней подряд',
    check: function (_completed, meta) {
      return !(!meta || !meta.streak) && meta.streak >= 7;
    },
  },
  {
    id: 'repl_10',
    name: 'Экспериментатор',
    icon: '🧪',
    desc: 'Выполнить 10+ примеров кода в REPL/упражнениях',
    check: function (_completed, meta) {
      return meta && meta.codeRuns >= 10;
    },
  },
  {
    id: 'first_complete',
    name: 'Первый пройденный',
    icon: '⭐',
    desc: 'Завершить первый урок',
    check: function (completed) {
      const l = _buildLessonLookup(completed);
      return !!l[1];
    },
  },
];
