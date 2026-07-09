---
title: "Булевы переменные"
lesson: 9
description: "True, False, логические операции"
duration: 12
complexity: "1"
badge: "bool_master"
file: "09-booleans.html"
layout: "layout.njk"
permalink: "09-booleans.html"
subtitle: "True, False, bool(), truthy и falsy значения. Логические операторы"
prevUrl: "08-number-ops.html"
prevTitle: "Операции над числами"
nextUrl: "10-conditional.html"
nextTitle: "Условный оператор"
---

## Тип bool

`bool` — это подтип `int`. `True` = 1, `False` = 0:

```python
is_active = True
is_finished = False

print(type(is_active))  # <class 'bool'>
print(True + 1)         # 2
print(False * 5)        # 0
```

## Функция bool()

`bool()` преобразует любое значение в `True` или `False`:

```python
# Falsy значения (преобразуются в False):
print(bool(0))        # False
print(bool(0.0))      # False
print(bool(""))       # False
print(bool(None))     # False

# Truthy значения (всё остальное):
print(bool(1))        # True
print(bool(-1))       # True
print(bool("text"))   # True
```
<table><tbody><tr><th>Falsy (→ False)</th><th>Truthy (→ True)</th></tr><tr><td><code>None</code></td><td>Любое ненулевое число</td></tr><tr><td><code>0</code>, <code>0.0</code></td><td>Непустая строка</td></tr><tr><td>Пустая строка <code>""</code></td><td><code>True</code></td></tr></tbody></table>
> **💡 Совет:** **Почему это важно?** Falsy/truthy значения позволяют писать лаконичные проверки: `if name:` вместо `if name != "":`

## Логические операторы

`and`, `or`, `not` работают с булевыми значениями:

```python
print(True and False)  # False
print(True or False)   # True
print(not True)        # False

# С truthy/falsy значениями:
print(0 and 42)        # 0 (and возвращает первое falsy)
print(3 or 0)          # 3 (or возвращает первое truthy)
print("" or "default") # "default"
print(not "")          # True (пустая строка — falsy)
```

**Правила:**

-   `and` — возвращает первое falsy-значение или последний операнд
-   `or` — возвращает первое truthy-значение или последний операнд
-   `not` — инвертирует булево значение

## Булевы переменные в условиях

Булевы переменные часто используются для управления потоком программы:

```python
is_authenticated = True
has_permission = False

if is_authenticated and has_permission:
    print("Доступ разрешён")
elif is_authenticated:
    print("Недостаточно прав")
else:
    print("Требуется авторизация")

# Сокращённая проверка (truthy/falsy)
name = "Анна"
if name:
    print(f"Привет, {name}!")  # Выполнится
else:
    print("Имя не указано")
```

## Приоритет логических операторов

Приоритет (от высшего к низшему): `not` → `and` → `or`

```python
# not применяется первым
print(not True and False)   # False: (not True) → False, затем False and False → False

# and имеет приоритет над or
print(True or True and False)  # True: True and False → False, затем True or False → True

# Скобки для ясности
print(True or (True and False))  # True — то же самое, но понятнее
```
> **💡 Совет:** **Совет:** всегда используйте скобки в сложных выражениях, даже если знаете приоритет. Код должен быть понятен другим.
