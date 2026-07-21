'use strict';

const BADGES = [
  {
    id: 'first_steps',
    name: 'Первые шаги',
    icon: '🐣',
    desc: 'Завершить первые 5 уроков',
  },
  {
    id: 'condition_master',
    name: 'Мастер условий',
    icon: '🔀',
    desc: 'Пройти уроки по условиям (9-13)',
  },
  {
    id: 'string_ninja',
    name: 'Струнный ниндзя',
    icon: '🔤',
    desc: 'Пройти уроки по строкам (7,14,15,16)',
  },
  {
    id: 'loop_hero',
    name: 'Повелитель циклов',
    icon: '🔄',
    desc: 'Пройти уроки по циклам (17-21)',
  },
  {
    id: 'data_wizard',
    name: 'Хранитель данных',
    icon: '🗂️',
    desc: 'Пройти уроки по структурам данных (25-31)',
  },
  {
    id: 'halfway',
    name: 'Экватор',
    icon: '🌍',
    desc: 'Пройти 25+ уроков (половина курса)',
  },
  {
    id: 'func_guru',
    name: 'Мастер функций',
    icon: '⚙️',
    desc: 'Пройти уроки 22-24 (функции и отладка)',
  },
  {
    id: 'module_explorer',
    name: 'Исследователь модулей',
    icon: '🧰',
    desc: 'Пройти уроки по модулям (35-40)',
  },
  {
    id: 'error_handler',
    name: 'Ловец ошибок',
    icon: '⚠️',
    desc: 'Пройти урок по try/except (11)',
  },
  {
    id: 'oop_master',
    name: 'Архитектор классов',
    icon: '🏗️',
    desc: 'Пройти уроки по ООП (41-42)',
  },
  {
    id: 'file_master',
    name: 'Файловый маг',
    icon: '📁',
    desc: 'Пройти уроки по файлам и БД (32-34)',
  },
  {
    id: 'tool_master',
    name: 'Инструментальщик',
    icon: '🛠️',
    desc: 'Пройти уроки по инструментам (47-50)',
  },
  {
    id: 'intermediate',
    name: 'Продвинутый',
    icon: '🚀',
    desc: 'Пройти продвинутые уроки (21,25,30)',
  },
  {
    id: 'all_lessons',
    name: 'Python-эксперт',
    icon: '👑',
    desc: 'Пройти все 50 уроков',
  },
  {
    id: 'speedrun',
    name: 'Спидран',
    icon: '⚡',
    desc: 'Пройти 3 урока за один день',
  },
  {
    id: 'quiz_champion',
    name: 'Знаток тестов',
    icon: '🏅',
    desc: 'Пройти итоговый тест на 90%+',
  },
  {
    id: 'quiz_perfect',
    name: 'Идеальный результат',
    icon: '🎯',
    desc: 'Пройти итоговый тест на 100%',
  },
  {
    id: 'streak_7',
    name: 'Недельный марафон',
    icon: '🔥',
    desc: 'Заниматься 7 дней подряд',
  },
  {
    id: 'repl_10',
    name: 'Экспериментатор',
    icon: '🧪',
    desc: 'Выполнить 10+ примеров кода в REPL/упражнениях',
  },
  {
    id: 'first_complete',
    name: 'Первый пройденный',
    icon: '⭐',
    desc: 'Завершить первый урок',
  },
];

export { BADGES };
