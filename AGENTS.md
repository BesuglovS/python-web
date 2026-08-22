# AGENTS.md — Инструкции для ИИ-ассистентов

Статический образовательный сайт «Python — основы программирования» (50 уроков на русском).
Сайт генерируется **Eleventy (11ty) v3** из Markdown, интерактив на vanilla JS (ES6+),
серверная часть — PHP-песочница с Python AST-валидатором. Метаданные курса — в `lessons.json`.

## ⚠️ Критические правила

1. **`lessons.json` — единственный источник истины** для метаданных уроков (номер, файл,
   название, duration, complexity, badge, contest, type, interactive). НЕ редактируйте
   `src/js/config/courseData.js` вручную — блоки `LESSON_META`, `THEORY_CONTESTS`,
   `LESSON_BADGES` генерируются из `lessons.json` скриптом `node build-config-meta.mjs`.
2. **В front matter Markdown-урока не указывайте** `duration`, `complexity`, `prev`, `next`,
   `prevUrl`, `nextUrl` — они вычисляются при сборке из `lessons.json` (`src/_data/eleventyComputed.js`).
3. **`dist/` — вывод сборки.** Никогда не редактируйте файлы в `dist/`, а также сгенерированные
   корневые артефакты (`script.js`, `config.js`, `style.css`, `repl.js`, `mindmap.js`, `sw.js`,
   `highlight-py.min.js`). Правки вносятся в `src/`, затем пересборка.
4. **Не коммитьте** `.env`, `dist/`, `node_modules/` и сгенерированные файлы (см. `.gitignore`).
5. **localStorage** доступен только через `src/js/config/security.js`
   (`safeGetItem`/`safeSetItem`/`safeRemoveItem`, белый список ключей `SAFE_KEYS`,
   лимит 102400 символов). Прогресс уроков хранится на сервере (SQLite), а не в localStorage.

## 🔧 Команды (Node ≥ 18, рекомендовано 20)

```bash
npm install                # установка зависимостей
npm run watch              # дев-режим: eleventy --serve на :8080 + пересборка JS/CSS
npm run build              # полная сборка в dist/
npm run build:prod         # прод-сборка с content-hash ассетов (для CDN/кэша)
npm run build:css          # только CSS (esbuild) → dist/style.css
npm run build:js           # только JS-бандл script.js
npm run build:meta         # перегенерация courseData.js из lessons.json
npm run lint               # ESLint (eslint.config.mjs)
npm run lint:fix           # автоисправление
npm run format:check       # Prettier — проверка
npm run format             # Prettier — запись
npm run typecheck          # tsc --noEmit (tsconfig.json)
npm run test:unit          # Vitest (tests/*.test.*)
npm run test:unit:coverage # Vitest с гейтом покрытия
npm run test:python        # pytest tests/test_ast_validator.py
npm run test:php           # php tests/test_sandbox.php
npm test                   # Playwright E2E (e2e/*.spec.cjs)
npm run deploy:dry         # сухой прогон деплоя
npm run deploy             # деплой (powershell deploy.ps1)
```

CI (`.github/workflows/ci.yml`) на каждый push/PR в `main`/`master` прогоняет:
`npm audit`, `lint`, `format:check`, `typecheck`, unit-тесты с покрытием,
Python-тесты с покрытием ≥ 80% по `sandbox/*`, PHP-тесты, `npm run build`, Playwright, Lighthouse.

## 🏗 Структура

```
src/*.md                     # Уроки 01–50 (Markdown, русский язык)
src/_includes/layout.njk     # Шаблон урока; layout-index.njk — главная
src/_data/                   # site.json, lessonsData.cjs, eleventyComputed.js (навигация из lessons.json)
src/css/index.css            # точка входа CSS (@import модулей _*.css)
src/js/script.js             # точка входа JS; инициализация модулей строго по порядку (auth → progress → UI)
src/js/modules/*.js          # изолированные модули функциональности (quiz, progress, badges-render и др.)
src/js/config/*.js           # security.js, badges.js, constants.js, courseData.js (ГЕНЕРИРУЕТСЯ)
src/_plugins/norun.mjs       # плагин markdown-it
lessons.json                 # метаданные 50 уроков + секции (источник истины)
quizzes/*.json               # квизы: 1.json–50.json + final-test.json
sandbox/*.php/.py            # серверная песочница (PHP + Python AST-валидатор)
tests/                       # Vitest (.test.mjs) + Python + PHP
e2e/*.spec.cjs               # Playwright (CommonJS!)
eleventy.config.mjs          # конфиг Eleventy (passthrough copy, коллекции)
build-*.mjs, minify.cjs      # скрипты сборки
data/python.db               # SQLite: прогресс, бейджи (создаётся на сервере)
```

## 🛠 Конвейер сборки

`npm run build` (порядок важен):
1. `build-config-meta.mjs` → перегенерирует `src/js/config/courseData.js` из `lessons.json`
2. `build-highlight.mjs` → `highlight-py.min.js`
3. `build-css.mjs` → `dist/style.css` (esbuild, бандл из `src/css/index.css`)
4. `eleventy` → `dist/*.html`
5. `build-js.mjs` → `dist/script.js` (esbuild, IIFE-бандл `src/js/script.js` + модулей)
6. `minify.cjs` → CSS-минификация + бандлы `repl.js`, `mindmap.js`, `cheatsheets.js`
7. `build-sw.mjs` → `dist/sw.js` (Service Worker)

`npm run build:prod` дополнительно запускает `build-assets-hash.mjs` (content-hash ассетов
и переписывание ссылок в HTML/sw.js).

В `watch`-режиме Eleventy сам пересобирает JS/CSS после каждой пересборки
(см. `eleventy.on('eleventy.after')`).

## 📝 Редактирование контента

### Урок (`src/XX-topic.md`)

Допустимые поля front matter (пример):

```yaml
---
layout: 'layout.njk'
lesson: 25
title: 'Списки'
subtitle: 'list, методы списков'
description: 'list, методы списков'   # опционально, для SEO/meta
section: 5
---
```

Контент: заголовки `##`, блоки ` ```python `, визуальные блоки `> [!NOTE]`, `> [!TIP]`,
`> [!WARNING]`, ссылки на другие уроки — относительные (`25-lists.html`). Комментарии в
примерах кода на русском. Язык контента — **русский**.

### Новый урок (полный цикл)

1. Создать `src/XX-topic.md` (front matter по образцу выше; `lesson`, `section` — как в lessons.json)
2. Добавить запись в `lessons.json` (в нужную секцию, поля `num/file/title/desc/duration/complexity/badge/type/tags/interactive`, опц. `contest`)
3. Создать `quizzes/XX.json` (см. формат ниже)
4. `node build-config-meta.mjs` → перегенерация courseData.js
5. `npm run build` и проверка в браузере

### Квиз (`quizzes/NN.json`)

```json
[
  {
    "question": "Что выведет <code>print(type([]))</code>?",
    "options": ["<code>list</code>", "<code>tuple</code>", "<code>dict</code>", "<code>set</code>"],
    "correct": 0,
    "explanation": "<code>[]</code> создаёт пустой список типа list."
  }
]
```

## 💻 Конвенции кода

### JavaScript (`src/js/`)
- `'use strict'` в каждом файле; ES6-модули (`import/export`); JSDoc для экспортных функций
- `eqeqeq` (строгое сравнение), `no-var` (только `let`/`const`), `no-console` разрешён
- Модули в `src/js/modules/` — одна изолированная функция на файл, инициализация через
  `initXxx()`, возвращают cleanup/функции обратного вызова
- Точка входа `script.js`: критический порядок — синхронные модули → `initAuth()`
  (без авторизации выполнение останавливается, показывается auth-гейт) →
  `loadProgressFromServer()` → рендер прогресса → все остальные модули через `Promise.allSettled`
- Новые модули добавляются в `script.js` с учётом зависимостей (auth-гейт обязателен)

### CSS (`src/css/`)
- Модули `_*.css` импортируются из `index.css`; CSS Custom Properties; BEM-подобные имена
- Тёмная тема через `[data-theme="dark"]` (атрибут на `html`)

### PHP (`sandbox/`)
- PHP 7.4+ (совместимость), строгая типизация возвратов/аргументов в новых функциях
- Все эндпоинты проходят через `config.php` (CORS-заголовки, сессия, CSRF),
  JSON-ответы через `jsonResponse()`
- Код пользователя выполняется только после AST-валидации (`ast_validator.py`) и rate-limit
- Прогресс/бейджи требуют `Auth::requireLogin()` серверно; статический HTML — нет

### Markdown
- Блоки кода с языком `python`; спойлеры `> [!NOTE|TIP|WARNING]`; перенос строк 120 символов

## 🧪 Тестирование

- **Unit (Vitest)**: файлы `tests/*.test.{js,mjs,ts}`, `globals: true`, окружение `node`.
  Многие тесты загружают модули через `new Function` со stripped import/export синтаксисом —
  при изменении публичного API модулей обновляйте тесты в `tests/`.
- **E2E (Playwright)**: `e2e/*.spec.cjs` (CommonJS, `'use strict'`). Auth-гейт мокается через
  `page.route('**/sandbox/auth_check.php', ...)`. Перед запуском нужна сборка (`npm run build`),
  сервер стартует автоматически (`npx http-server dist -p 8080`).
- **Python**: `tests/test_ast_validator.py`, `tests/test_ast_validator_import.py` (pytest).
- **PHP**: `tests/test_sandbox.php` (самодостаточный скрипт).

Перед сдачей изменений прогоняйте минимум: `npm run lint`, `npm run format:check`,
`npm run typecheck`, `npm run test:unit`. При изменении `src/js/` — также `npm run build`.

## 🚀 Деплой

- Содержимое `dist/` загружается на сервер **целиком** (включая `lessons.json`, `quizzes/`,
  `sandbox/`, `data/`). Сервер: Apache 2.4+/Nginx 1.18+, PHP 7.4+, Python 3.10+.
- Конфиги сервера: `.htaccess` (Apache) и `python.nayanovaacademy.ru` (Nginx).
- Песочница: ограничения в php.ini — `open_basedir`, `disable_functions`, `max_execution_time=10`.
- Авторизация — SSO через `auth.nayanovaacademy.ru` (кука `auth_session`); прогресс и бейджи
  через `sandbox/progress.php` и `sandbox/badges.php` (SQLite `data/python.db`).
- Контесты: `contest.nayanovaacademy.ru` (cross-domain, `credentials: 'include'`).

## 🔒 Безопасность (не ломать)

- CSP жёстко задан в `layout.njk` (script-src `'self'` + mc.yandex.ru и т.д.) — при добавлении
  внешних ресурсов обновляйте CSP и проверяйте `sandbox`/`auth`/`contest` домены в `connect-src`.
- Песочница изолирует Python-код: AST-валидация запрещённых импортов, rate-limit, таймаут,
  лимит памяти/вывода. Не ослабляйте проверки.
- Вся разметка от пользовательских данных (ответы квизов, данные lessons.json при рендере)
  проходит через `escapeHtml()` (`src/js/modules/utils.js`).
- Редиректы auth ограничены доменом `nayanovaacademy.ru`.