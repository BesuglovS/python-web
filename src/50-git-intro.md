---
title: 'Git: введение'
lesson: 50
description: 'Коммиты, ветки, GitHub, .gitignore'
duration: 12
complexity: '2'
badge: 'git_master'
file: '50-git-intro.html'
layout: 'layout.njk'
permalink: '50-git-intro.html'
subtitle: 'Система контроля версий: репозиторий, коммиты, ветки, GitHub'
prevUrl: '49-flask.html'
prevTitle: 'Веб-фреймворки: Flask'
---

## Введение

Git — самая популярная система контроля версий. Она отслеживает изменения в коде, позволяет возвращаться к любым версиям, работать над разными функциями параллельно (ветки) и сотрудничать с другими разработчиками через GitHub (или GitLab, Bitbucket).

**📌 На этом уроке вы узнаете:**

- Установка и `git init` — инициализация репозитория
- Основные команды: `git add`, `git commit`, `git status`, `git log`
- Ветки: `git branch`, `git checkout`, `git merge`
- `.gitignore` — что не нужно отслеживать
- Работа с удалённым репозиторием: `git push`, `git pull`

## Основной материал

Работа с Git начинается с `git init` в папке проекта. После изменений файлы подготавливаются к коммиту через `git add` (индексация), затем `git commit -m "сообщение"` фиксирует состояние. `git status` показывает текущее состояние, `git log` — историю коммитов. Ветки (`git branch feature`) изолируют разработку, `git merge` объединяет изменения. Удалённые репозитории подключаются через `git remote add origin URL`, `git push` отправляет изменения, `git pull` забирает новые.

```bash
# Инициализация репозитория
git init

# Добавление файлов и коммит
git add *.py
git commit -m "Добавлены файлы проекта"

# Работа с ветками
git branch feature-auth     # создание ветки
git checkout feature-auth   # переключение на ветку
# или одной командой: git checkout -b feature-auth

# Слияние веток
git checkout main
git merge feature-auth      # объединение feature-auth в main

# Работа с GitHub
git remote add origin https://github.com/user/repo.git
git push -u origin main     # первая отправка
git pull                     # получение изменений с сервера
```

## Практика

**📝 Задание:** Создайте локальный Git-репозиторий для папки с вашими кодами. Сделайте первый коммит. Создайте ветку `practice`, внесите изменения и добавьте новый файл. Слейте ветку practice в main. Посмотрите историю через `git log --oneline --graph`.

[Открыть REPL для выполнения →](repl.html)

## Ключевые выводы

- `git init` — создаёт новый репозиторий в текущей папке
- `git add` → `git commit` — стандартный цикл работы
- Ветки (`branch`) позволяют работать над функциями изолированно
- `git merge` объединяет изменения из разных веток
- `.gitignore` исключает служебные файлы из репозитория
- `git push` / `git pull` — синхронизация с GitHub
