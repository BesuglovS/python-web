/**
 * Конфигурация сайта теории Python
 */

/**
 * Карта привязки уроков Python-теории к ID контестов.
 * lesson => номер урока (целое число)
 * contest_id => ID контеста на сайте contest.nayanovaacademy.ru
 * При добавлении нового контеста нужно просто дополнить этот объект.
 */
var THEORY_CONTESTS = {
  8: 7,   // Урок 8 «Операции над числами» → контест ID 7
  10: 8,  // Урок 10 «Условный оператор» → контест ID 8
  12: 10, // Урок 12 «Сложные условия» → контест ID 10
  15: 9,  // Урок 15 «Операции над строками» → контест ID 9
  17: 12, // Урок 17 «Цикл while» → контест ID 12
  19: 13, // Урок 19 «range()» → контест ID 13
  21: 14, // Урок 21 «Вложенные циклы» → контест ID 14
  22: 11, // Урок 22 «Функции» → контест ID 11
  25: 16, // Урок 25 «Списки (list)» → контест ID 16
  26: 15, // Урок 26 «Множества (set)» → контест ID 15
  27: 17, // Урок 27 «Кортежи (tuple)» → контест ID 17
  28: 20, // Урок 28 «Словари (dict)» → контест ID 20
  29: 18, // Урок 29 «split + join» → контест ID 18
  30: 19  // Урок 30 «Списочные выражения» → контест ID 19
};

/** Базовый URL контест-сайта */
var CONTEST_BASE_URL = 'https://contest.nayanovaacademy.ru/index.php?page=contest&id=';

/** URL песочницы для выполнения Python-кода */
var REPL_URL = 'sandbox/run.php';

/**
 * Метаданные уроков: продолжительность чтения и сложность.
 * lesson => { duration: минуты, complexity: 'beginner' | 'basic' | 'intermediate' }
 */
var LESSON_META = {

  1:  { duration: 5,  complexity: 'beginner' },
  2:  { duration: 8,  complexity: 'beginner' },
  3:  { duration: 7,  complexity: 'beginner' },
  4:  { duration: 8,  complexity: 'beginner' },
  5:  { duration: 6,  complexity: 'beginner' },
  6:  { duration: 7,  complexity: 'beginner' },
  7:  { duration: 10, complexity: 'basic' },
  8:  { duration: 7,  complexity: 'basic' },
  9:  { duration: 6,  complexity: 'basic' },
  10:  { duration: 8, complexity: 'beginner' },
  11: { duration: 12,  complexity: 'basic' },
  12: { duration: 8,  complexity: 'basic' },
  13: { duration: 10, complexity: 'basic' },
  14: { duration: 8,  complexity: 'basic' },
  15: { duration: 10, complexity: 'basic' },
  16: { duration: 10, complexity: 'basic' },
  17: { duration: 8,  complexity: 'basic' },
  18: { duration: 7,  complexity: 'basic' },
  19: { duration: 8,  complexity: 'basic' },
  20: { duration: 10, complexity: 'intermediate' },
  21: { duration: 12, complexity: 'basic' },
  22: { duration: 8,  complexity: 'basic' },
  23: { duration: 8,  complexity: 'basic' },
  24: { duration: 8,  complexity: 'basic' },
  25: { duration: 12, complexity: 'intermediate' },
  26: { duration: 7,  complexity: 'basic' },
  27: { duration: 10, complexity: 'intermediate' },
  28: { duration: 7,  complexity: 'basic' },
  29: { duration: 10, complexity: 'intermediate' },
  30: { duration: 12, complexity: 'intermediate' },
  31: { duration: 14, complexity: 'intermediate' },
  32: { duration: 8,  complexity: 'basic' },
  33: { duration: 10, complexity: 'intermediate' },
  34: { duration: 14, complexity: 'intermediate' },
  35: { duration: 12, complexity: 'intermediate' },
  36: { duration: 12, complexity: 'intermediate' },
  37: { duration: 14, complexity: 'intermediate' },
  38: { duration: 10, complexity: 'intermediate' },
  39: { duration: 15, complexity: 'intermediate' },
  40: { duration: 10, complexity: 'intermediate' },
  41: { duration: 12, complexity: 'intermediate' },
  42: { duration: 10, complexity: 'intermediate' },
  43: { duration: 8,  complexity: 'intermediate' },
  44: { duration: 10, complexity: 'intermediate' },
  45: { duration: 12, complexity: 'intermediate' },
  46: { duration: 8,  complexity: 'intermediate' },
  47: { duration: 10, complexity: 'intermediate' },
  48: { duration: 12, complexity: 'intermediate' },
  49: { duration: 14, complexity: 'intermediate' },
  50: { duration: 12, complexity: 'intermediate' }

};

/** Подписи уровней сложности */
var COMPLEXITY_LABELS = {
  'beginner':     '🚀 Начальный',
  'basic':        '📘 Базовый',
  'intermediate': '📗 Средний',
  'advanced':     '📙 Продвинутый'
};

/**
 * Вопросы для самопроверки (quiz) к каждому уроку.
 * lesson => [{ question, options: [], correct: индекс правильного, explanation }]
 * Каждый квиз содержит ровно 10 вопросов по теме урока.
 */
/**
 * Вопросы для самопроверки (quiz) — загружаются асинхронно из папки quizzes/.
 * Формат: lesson => [{ question, options: [], correct: индекс правильного, explanation }]
 * См. quizzes/{номер-урока}.json и quizzes/final-test.json
 *
 * LESSON_QUIZZES заполняется динамически при загрузке страницы урока
 * скриптом script.js (функция loadQuizForLesson).
 */
var LESSON_QUIZZES = {};

/** Система достижений (бейджей). */
var BADGES = [
  { id: "first_steps", name: "Первые шаги", icon: "🐣", desc: "Завершить первые 5 уроков", check: function(c) { return [1,2,3,4,5].every(function(n){return c[n];}); } },
  { id: "condition_master", name: "Мастер условий", icon: "🔀", desc: "Пройти уроки по условиям (9-13)", check: function(c) { return [9,10,11,12,13].every(function(n){return c[n];}); } },
  { id: "string_ninja", name: "Струнный ниндзя", icon: "🔤", desc: "Пройти уроки по строкам (7,14,15,16)", check: function(c) { return [7,14,15,16].every(function(n){return c[n];}); } },
  { id: "loop_hero", name: "Повелитель циклов", icon: "🔄", desc: "Пройти уроки по циклам (17-21)", check: function(c) { return [17,18,19,20,21].every(function(n){return c[n];}); } },
  { id: "data_wizard", name: "Хранитель данных", icon: "🗂️", desc: "Пройти уроки по структурам данных (25-31)", check: function(c) { return [25,26,27,28,29,30,31].every(function(n){return c[n];}); } },
  { id: "halfway", name: "Экватор", icon: "🌍", desc: "Пройти 25+ уроков (половина курса)", check: function(c) { var n=0; for(var k in c){if(c[k])n++;} return n>=25; } },
  { id: "func_guru", name: "Мастер функций", icon: "⚙️", desc: "Пройти уроки 22-24 (функции и отладка)", check: function(c) { return [22,23,24].every(function(n){return c[n];}); } },
  { id: "module_explorer", name: "Исследователь модулей", icon: "🧰", desc: "Пройти уроки по модулям (35-40)", check: function(c) { return [35,36,37,38,39,40].every(function(n){return c[n];}); } },
  { id: "error_handler", name: "Ловец ошибок", icon: "⚠️", desc: "Пройти урок по try/except (11)", check: function(c) { return c[11]; } },
  { id: "oop_master", name: "Архитектор классов", icon: "🏗️", desc: "Пройти уроки по ООП (41-42)", check: function(c) { return [41,42].every(function(n){return c[n];}); } },
  { id: "file_master", name: "Файловый маг", icon: "📁", desc: "Пройти уроки по файлам и БД (32-34)", check: function(c) { return [32,33,34].every(function(n){return c[n];}); } },
  { id: "tool_master", name: "Инструментальщик", icon: "🛠️", desc: "Пройти уроки по инструментам (47-50)", check: function(c) { return [47,48,49,50].every(function(n){return c[n];}); } },
  { id: "intermediate", name: "Продвинутый", icon: "🚀", desc: "Пройти продвинутые уроки (21,25,30)", check: function(c) { return [21,25,30].every(function(n){return c[n];}); } },
  { id: "all_lessons", name: "Python-эксперт", icon: "👑", desc: "Пройти все 50 уроков", check: function(c) { var all=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50]; for(var i=0;i<all.length;i++){if(!c[all[i]])return false;} return true; } },
  { id: "speedrun", name: "Спидран", icon: "⚡", desc: "Пройти 3 урока за один день", check: function(c,h) { if(!h)return false; var t=new Date().toDateString(),n=0; for(var i=0;i<h.length;i++){if(new Date(h[i].date).toDateString()===t)n++;} return n>=3; } },
  { id: "quiz_champion", name: "Знаток тестов", icon: "🏅", desc: "Пройти итоговый тест на 90%+", check: function(c,h) { return h && h.finalTestScore >= 90; } },
  { id: "quiz_perfect", name: "Идеальный результат", icon: "🎯", desc: "Пройти итоговый тест на 100%", check: function(c,h) { return h && h.finalTestScore >= 100; } },
  { id: "streak_7", name: "Недельный марафон", icon: "🔥", desc: "Заниматься 7 дней подряд", check: function(c,h) { if(!h||!h.streak)return false; return h.streak>=7; } },
  { id: "repl_10", name: "Экспериментатор", icon: "🧪", desc: "Выполнить 10+ примеров кода в REPL/упражнениях", check: function(c,h) { return h && h.codeRuns >= 10; } },
  { id: "first_complete", name: "Первый пройденный", icon: "⭐", desc: "Завершить первый урок", check: function(c) { return c[1]; } }
];
