# Архитектура проекта Python-Web

## Обзор

Статический образовательный сайт с 50 уроками Python. Генерируется через **Eleventy (11ty)**, интерактивность реализована на **vanilla JS (ES6+)**.

## Структура проекта

```
python-web/
├── src/                          # Исходники
│   ├── *.md                      # Markdown-файлы уроков (50 шт.)
│   ├── index.njk                 # Главная страница
│   ├── _includes/
│   │   ├── layout.njk            # Шаблон урока
│   │   └── layout-index.njk      # Шаблон главной
│   ├── _data/
│   │   ├── lessonsData.js        # Данные уроков (генерируется из lessons.json)
│   │   ├── site.json             # Метаданные сайта
│   │   └── eleventyComputed.js   # Вычисляемые данные
│   ├── css/
│   │   ├── index.css             # Точка входа CSS (@import всех модулей)
│   │   ├── _variables.css        # CSS-переменные и темы
│   │   ├── _reset.css            # Сброс стилей
│   │   ├── _typography.css       # Типографика
│   │   ├── _layout.css           # Сетка и компоновка
│   │   ├── _components.css       # UI-компоненты
│   │   ├── _code.css             # Стили кода
│   │   ├── _tables.css           # Таблицы
│   │   ├── _widgets.css          # Виджеты (note/tip/warning)
│   │   ├── _interactive.css      # Интерактивные элементы
│   │   ├── _navigation.css       # Навигация
│   │   ├── _index.css            # Стили главной
│   │   ├── _repl.css             # Стили REPL
│   │   ├── _mindmap.css          # Стили mindmap
│   │   ├── _cheatsheets.css      # Стили шпаргалок
│   │   ├── _hamburger.css        # Гамбургер-меню
│   │   ├── _responsive.css       # Адаптивность
│   │   └── _print.css            # Печать
│   ├── js/
│   │   ├── script.js             # Точка входа JS
│   │   ├── config.js             # Обратная совместимость (реэкспорт)
│   │   ├── repl.js               # Python REPL (серверная сессия PHP)
│   │   ├── mindmap.js            # Mindmap
│   │   ├── cheatsheets.js        # Печать шпаргалок
│   │   ├── config/
│   │   │   ├── security.js       # Безопасные обёртки localStorage
│   │   │   ├── courseData.js     # Данные курса (уроки, мета, сложность)
│   │   │   └── badges.js         # Определения бейджей
│   │   └── modules/
│   │       ├── breadcrumbs.js    # Хлебные крошки
│   │       ├── code-toolbar.js   # Кнопки копирования/редактирования/запуска
│   │       ├── contest-link.js   # Ссылки на контесты
│   │       ├── error-tracking.js # Отслеживание ошибок
│   │       ├── hamburger-menu.js # Гамбургер-меню
│   │       ├── keyboard-nav.js   # Навигация клавиатурой
│   │       ├── lesson-meta.js    # Метаданные урока
│   │       ├── progress.js       # Прогресс-бар и отслеживание
│   │       ├── quiz.js           # Система квизов
│   │       ├── sandbox-client.js # Клиент песочницы
│   │       ├── scroll-progress.js# Прогресс прокрутки
│   │       ├── search.js         # Поиск по темам
│   │       ├── section-nav.js    # Навигация по разделам
│   │       ├── smooth-scroll.js  # Плавная прокрутка
│   │       ├── syntax-highlight.js# Подсветка синтаксиса
│   │       ├── theme.js          # Переключение темы
│   │       ├── toc.js            # Оглавление урока
│   │       └── utils.js          # Общие утилиты
│   └── _plugins/
│       └── norun.mjs             # Плагин Eleventy
├── quizzes/                      # JSON-файлы квизов (1-50 + final-test.json)
├── sandbox/                      # Серверная песочница (PHP)
├── tests/                        # Тесты
├── dist/                         # Собранные файлы (out)
├── lessons.json                  # Единый источник метаданных уроков
├── package.json                  # Зависимости и скрипты
├── eleventy.config.mjs           # Конфигурация Eleventy
├── build-css.mjs                 # Сборка CSS (esbuild)
├── build-js.mjs                  # Сборка JS (esbuild)
├── build-sw.mjs                  # Генерация Service Worker
├── build-config-meta.mjs         # Генерация LESSON_META, THEORY_CONTESTS, LESSON_BADGES из lessons.json
├── build-assets-hash.mjs         # Контент-хэширование ассетов
└── minify.cjs                    # CSS-бандл + страничные скрипты (esbuild IIFE)
```

## Конвейер сборки

```
npm run build →
  1. build-config-meta.mjs    → src/js/config/courseData.js (LESSON_META, THEORY_CONTESTS, LESSON_BADGES)
  2. build-highlight.mjs      → highlight-py.min.js
  3. build-css.mjs            → dist/style.css (esbuild, CSS bundling)
  4. eleventy                 → dist/*.html (Markdown/HTML → HTML)
  5. build-js.mjs             → dist/script.js (esbuild, IIFE бандл всех модулей)
  6. minify.cjs               → dist/style.css + бандл repl.js/mindmap.js/cheatsheets.js
  7. build-sw.mjs             → dist/sw.js (Service Worker)

npm run build:prod дополнительно →
  8. build-assets-hash.mjs    → хэширует ассеты и переписывает ссылки в HTML/sw.js
```

## Архитектура JavaScript

### Модульная система

- **ES6 модули** с `import/export`
- `script.js` — точка входа, инициализирует все модули
- `config.js` — обратная совместимость (реэкспорт из `config/`)
- Модули в `modules/` — изолированная функциональность

### Инициализация

```javascript
// script.js — promise-based инициализация
document.addEventListener('DOMContentLoaded', function () {
  initializeApplication().then(function () {
    console.log('Application initialization complete');
  });
});
```

### Хранение данных

Прогресс уроков и результаты квизов хранятся на сервере (SQLite `data/python.db`, ключ — глобальный `user_id` из auth-web). В `localStorage` остаются только предпочтения и локальное состояние:

| Ключ | Назначение |
|------|-----------|
| `python-web-course-progress` | Локальный кэш прогресса (источник — сервер) |
| `python-web-theme` | Предпочтения темы |
| `python-web-quiz-scores` | Локальный кэш результатов квизов |
| `python-repl-history` | История REPL |
| `sw-version` | Версия Service Worker |

### Безопасный доступ к localStorage

Все обращения к `localStorage` проходят через `config/security.js`:
```javascript
import { safeGetItem, safeSetItem } from '../config/security.js';
safeSetItem('python-web-course-progress', JSON.stringify(lessons));
```

## CSS архитектура

- **CSS Custom Properties** для тем и переменных
- **CSS Modules** через `@import` в `index.css`
- **BEM-подобная** методология именования
- **Две темы**: светлая и тёмная (через `[data-theme]`)

## Серверная песочница

- **PHP** (`sandbox/run.php`) — выполнение Python-кода
- **Python 3.10+** — интерпретатор
- **AST-валидация** (`sandbox/ast_validator.py`) — проверка безопасности
- Ограничения: `open_basedir`, `disable_functions`, `max_execution_time`

## Интеграция с внешними сервисами

### Авторизация (auth.nayanovaacademy.ru)

Единый вход (SSO) через общую куку `auth_session` на домене `.nayanovaacademy.ru`, которую выставляет сервис auth-web:

- Браузер → `sandbox/auth_check.php` (same-origin прокси с проверкой Origin/Referer) → cURL `auth.nayanovaacademy.ru/api/check.php` с кукой `auth_session`.
- `sandbox/Auth.php` кэширует результат в PHP-сессии (`python_session`) на 5 минут; кэш привязан к значению куки `auth_session`.
- Вход: `auth.nayanovaacademy.ru/index.php?page=login&redirect=…`; выход: `/api/logout.php?redirect=…` (редиректы ограничены доменом nayanovaacademy.ru).
- Прогресс/бейджи требуют `Auth::requireLogin()` серверно; сам статический HTML доступен и без авторизации.

### Контесты (contest.nayanovaacademy.ru)

- Связка урок→контест: поле `contest` в `lessons.json`; клиентский `THEORY_CONTESTS` в `src/js/config/courseData.js` генерируется скриптом `build-config-meta.mjs`. Серверный дубль — `sandbox/contest_map.php`.
- Ссылки на контесты: `contest-link.js` (страницы уроков, бейджи на главной).
- Проверка прогресса: `checkContestProgress()` (`modules/api-client.js`) → кросс-доменный GET `contest.nayanovaacademy.ru/index.php?page=api&endpoint=contest_progress&contest_id=N` с `credentials: 'include'`.
- Гейт «урок пройден»: квиз 100% **и** все задачи контеста решены (проверяется и на клиенте, и на сервере в `sandbox/progress.php` через `sandbox/contest_map.php`).

### Бейджи

Два уровня достижений с раздельными витринами; источник истины для обоих — `lessons.json` и `src/js/config/badges.js`:

- **Достижения** (`src/js/config/badges.js`) — за серии уроков, стрики, итоговый тест и т.п. Правила выдачи дублируются серверно в `sandbox/badges.php` (`recalculateBadges()`). Витрина: блок «🏆 Достижения» на главной (только заработанные) и модалка «Все достижения» с прогрессом.
- **Per-lesson бейджи** — поле `badge` каждого урока в `lessons.json`. Клиентская копия (`LESSON_BADGES` в `courseData.js`, с полем `file` для ссылок) генерируется `build-config-meta.mjs`; серверная выдача — `loadLessonBadgeMap()` в `sandbox/badges.php`, читающая `lessons.json` напрямую (файл копируется в dist рядом с `sandbox/`). Бейдж за урок выдаётся при его завершении; id per-lesson бейджей не должны пересекаться с id достижений (проверяется тестом в `tests/config.test.mjs`). Витрина: блок «🎓 Карта прогресса» на главной — 50 плиток-ссылок на уроки (пройденные подсвечены); в модалке достижений per-lesson бейджи не показываются.
- Отображение: `modules/badges-render.js` рендерит обе витрины из одного ответа `badges.php`.

## Тестирование

| Тип | Инструмент | Команда |
|-----|-----------|---------|
| E2E | Playwright | `npm test` |
| Unit | Vitest | `npm run test:unit` |
| Python | pytest | `npm run test:python` |
| PHP | phpunit | `npm run test:php` |
| Lint | ESLint | `npm run lint` |
| TypeCheck | TypeScript | `npm run typecheck` |
