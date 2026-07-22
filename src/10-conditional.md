---
title: 'Условный оператор'
lesson: 10
description: 'if, elif, else, блоки кода, PEP 8'
badge: 'decision_maker'
file: '10-conditional.html'
layout: 'layout.njk'
permalink: '10-conditional.html'
subtitle: 'if, elif, else — ветвление программы и правила отступов'
---

## Отступы в Python

В отличие от многих языков, Python не использует фигурные скобки `{}` для выделения блоков. Вместо этого блок кода определяется **отступами** (4 пробела):

```python
if True:
    print("Этот код внутри if")
    print("Это тоже внутри if")
print("А это уже вне блока if")
```

После двоеточия `:` следующая строка **обязательно** должна иметь отступ (4 пробела). Все строки с одинаковым отступом принадлежат одному блоку.

> **⚠️ Важно:** **Стандарт PEP 8:** используйте ровно **4 пробела** для каждого уровня отступа. Не смешивайте табуляцию и пробелы!

## Простой if

Условный оператор `if` выполняет блок кода, если условие истинно:

```python
age = 18
if age >= 18:
    print("Вы совершеннолетний")
```

## if-else

Команды после `else` выполняются, если условие после `if` ложно:

```python
age = 16
if age >= 18:
    print("Вы совершеннолетний")
else:
    print("Вы несовершеннолетний")
```

## if-elif-else

`elif` (сокращение от else if) позволяет проверить несколько условий:

```python
score = 85

if score >= 90:
    grade = "Отлично"
elif score >= 75:
    grade = "Хорошо"
elif score >= 60:
    grade = "Удовлетворительно"
else:
    grade = "Неудовлетворительно"

print(f"Оценка: {grade}")  # Хорошо
```

Условия проверяются сверху вниз. Как только находится истинное, остальные пропускаются.

## Тернарный оператор

Короткая запись if-else в одну строку:

```python
age = 20
status = "Взрослый" if age >= 18 else "Ребёнок"
print(status)  # Взрослый
```

## Операторы сравнения

<table><tbody><tr><th>Оператор</th><th>Значение</th><th>Пример</th></tr><tr><td><code>==</code></td><td>Равно</td><td><code>5 == 5</code> → True</td></tr><tr><td><code>!=</code></td><td>Не равно</td><td><code>5 != 3</code> → True</td></tr><tr><td><code>></code></td><td>Больше</td><td><code>5 > 3</code> → True</td></tr><tr><td><code><</code></td><td>Меньше</td><td><code>5 < 3</code> → False</td></tr><tr><td><code>>=</code></td><td>Больше или равно</td><td><code>5 >= 5</code> → True</td></tr><tr><td><code><=</code></td><td>Меньше или равно</td><td><code>5 <= 3</code> → False</td></tr></tbody></table>

## Распространённые ошибки с отступами

- **IndentationError: unexpected indent** — лишний отступ там, где он не нужен
- **IndentationError: expected an indented block** — отсутствует отступ после `if`, `for`, `def` и т.д.
- Смешивание табуляции и пробелов приводит к трудноуловимым ошибкам

```python
# Ошибка: нет отступа после if
if True:
print("Ошибка!")
```

> **💡 Совет:** VS Code (Shift+Alt+F) и PyCharm (Ctrl+Alt+L) умеют автоформатировать отступы. Включите `Format On Save` в настройках редактора.
