---
title: 'venv и pip'
lesson: 37
description: 'venv, pip install, requirements.txt'
badge: 'venv_master'
file: '37-venv-pip.html'
layout: 'layout.njk'
permalink: '37-venv-pip.html'
subtitle: 'Установка библиотек и изоляция проектов'
---

## pip — менеджер пакетов Python

`pip` (Pip Installs Packages) — инструмент для установки библиотек из **PyPI** (Python Package Index). С его помощью вы можете добавить в проект тысячи готовых модулей.

<!-- norun -->

```bash
# Основные команды pip (выполняются в терминале):
pip install requests           # установить библиотеку
pip install numpy==1.24.0      # установить конкретную версию
pip uninstall requests         # удалить библиотеку
pip list                       # показать все установленные пакеты
pip show requests              # информация о пакете
pip freeze > requirements.txt  # сохранить список зависимостей
```

## Зачем нужны виртуальные окружения?

Без виртуальных окружений все библиотеки устанавливаются глобально. Проблемы:

- Разные проекты требуют **разные версии** одной библиотеки
- Глобальная установка засоряет систему
- Нельзя точно воспроизвести окружение на другом компьютере

Виртуальное окружение (venv) — это изолированная копия Python для одного проекта.

## Создание виртуального окружения (Windows)

<!-- norun -->

```bash
# Создать виртуальное окружение
python -m venv myenv

# Активировать
myenv\Scripts\activate

# В консоли появится префикс (myenv):
(myenv) C:\Projects\myapp>

# Деактивировать
deactivate
```

## Создание виртуального окружения (Linux / macOS)

<!-- norun -->

```bash
# Создать виртуальное окружение
python3 -m venv myenv

# Активировать
source myenv/bin/activate

# В консоли появится префикс (myenv):
(myenv) $

# Деактивировать
deactivate
```

## requirements.txt — список зависимостей

Файл, в котором перечислены все библиотеки проекта с версиями:

<!-- norun -->

```text
# requirements.txt
requests==2.31.0
numpy==1.24.0
pandas==2.0.0
```

<!-- norun -->

```bash
# Сохранить текущие зависимости
pip freeze > requirements.txt

# Установить все зависимости из файла
pip install -r requirements.txt
```

> **💡 Совет:** **Добавьте `venv/` в `.gitignore`** — виртуальное окружение не должно попадать в Git. В репозиторий кладите только `requirements.txt`.

## Популярные библиотеки для старта

<table><tbody><tr><th>Библиотека</th><th>Назначение</th><th>pip install</th></tr><tr><td>requests</td><td>HTTP-запросы, работа с API</td><td><code>pip install requests</code></td></tr><tr><td>numpy</td><td>Научные вычисления, массивы</td><td><code>pip install numpy</code></td></tr><tr><td>pandas</td><td>Анализ данных, таблицы</td><td><code>pip install pandas</code></td></tr><tr><td>matplotlib</td><td>Построение графиков</td><td><code>pip install matplotlib</code></td></tr><tr><td>flask</td><td>Веб-фреймворк</td><td><code>pip install flask</code></td></tr><tr><td>pytest</td><td>Тестирование кода</td><td><code>pip install pytest</code></td></tr></tbody></table>

## Типичный workflow для нового проекта

<!-- norun -->

```bash
# 1. Создать папку проекта
mkdir myproject
cd myproject

# 2. Создать виртуальное окружение
python -m venv venv

# 3. Активировать его
venv\Scripts\activate

# 4. Установить нужные библиотеки
pip install requests pandas

# 5. Заморозить зависимости
pip freeze > requirements.txt

# 6. Готово — можно писать код!
```
