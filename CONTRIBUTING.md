# Вклад в проект

## Быстрый старт

```bash
git clone https://github.com/BesuglovS/python-web.git
cd python-web
npm install
npm run watch       # Дев-сервер с hot-reload
```

## Цикл разработки

### Изменение контента урока

1. Редактировать `src/XX-topic.md`
2. `npm run watch` — автоматическая пересборка
3. Открыть `http://localhost:8080/XX-topic.html`

### Изменение стилей

1. Редактировать файл в `src/css/_*.css`
2. `npm run build:css` или `npm run watch`
3. Результат в `dist/style.css`

### Изменение JavaScript

1. Редактировать модули в `src/js/modules/`
2. `npm run build:js`
3. Результат в `dist/*.min.js`

### Добавление нового урока

1. Создать `src/XX-topic.md` с front matter
2. Добавить запись в `lessons.json`
3. Создать квиз `quizzes/XX.json`
4. Запустить `node build-config-meta.mjs`
5. Запустить `npm run build`

## Front matter урока

```markdown
---
layout: 'layout.njk'
lesson: 25
title: 'Списки'
subtitle: 'list, методы списков'
section: 5
---
```

**Не указывайте** `duration`, `complexity`, `prev`, `next` — они вычисляются из `lessons.json`.

## Структура квиза

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

## Код-стайл

### JavaScript

- `'use strict'` в каждом файле
- ES6 модули (`import/export`)
- JSDoc для всех экспортных функций
- `eslint` + `prettier` для форматирования

```bash
npm run lint:fix    # Автоисправление
npm run format      # Форматирование через Prettier
```

### CSS

- CSS Custom Properties для переменных
- Именование: `_module.css` (приватные модули)
- Тёмная тема через `[data-theme=dark]`

### Markdown

- Код в блоках ` ```python `
- Визуальные блоки: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`
- Ссылки на другие уроки: относительные пути

## Тестирование

```bash
npm run test:unit          # Vitest
npm run test:unit:coverage # Покрытие
npm test                   # Playwright E2E
npm run lint               # ESLint
npm run typecheck          # TypeScript
```

## Деплой

```bash
npm run build:prod         # Production-сборка
# Загрузить dist/ на сервер
```

См. [README.md — Деплой](README.md#-деплой) для подробностей.

## Вопросы и проблемы

- Issues: https://github.com/BesuglovS/python-web/issues
- Fork → Branch → PR
