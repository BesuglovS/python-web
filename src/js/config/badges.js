'use strict';

/**
 * Badge definitions for achievements and gamification
 */
import { _buildLessonLookup } from './security.js';
import {
  TOTAL_LESSONS,
  HALFWAY_LESSONS_COUNT,
  SPEEDRUN_LESSONS_COUNT,
  REPL_EXPERIMENTER_RUNS,
  QUIZ_CHAMPION_SCORE,
  QUIZ_PERFECT_SCORE,
  STREAK_DAYS,
} from './constants.js';
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
      return arr.length >= HALFWAY_LESSONS_COUNT;
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
      return count >= SPEEDRUN_LESSONS_COUNT;
    },
  },
  {
    id: 'quiz_champion',
    name: 'Знаток тестов',
    icon: '🏅',
    desc: 'Пройти итоговый тест на 90%+',
    check: function (_completed, meta) {
      return meta && meta.finalTestScore >= QUIZ_CHAMPION_SCORE;
    },
  },
  {
    id: 'quiz_perfect',
    name: 'Идеальный результат',
    icon: '🎯',
    desc: 'Пройти итоговый тест на 100%',
    check: function (_completed, meta) {
      return meta && meta.finalTestScore >= QUIZ_PERFECT_SCORE;
    },
  },
  {
    id: 'streak_7',
    name: 'Недельный марафон',
    icon: '🔥',
    desc: 'Заниматься 7 дней подряд',
    check: function (_completed, meta) {
      return !(!meta || !meta.streak) && meta.streak >= STREAK_DAYS;
    },
  },
  {
    id: 'repl_10',
    name: 'Экспериментатор',
    icon: '🧪',
    desc: 'Выполнить 10+ примеров кода в REPL/упражнениях',
    check: function (_completed, meta) {
      return meta && meta.codeRuns >= REPL_EXPERIMENTER_RUNS;
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

export { BADGES };