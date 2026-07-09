---
title: "Сложные условия"
lesson: 12
description: "and, or, not"
duration: 8
complexity: "2"
badge: "logician"
file: "12-complex-conditions.html"
layout: "layout.njk"
permalink: "12-complex-conditions.html"
subtitle: "and, or, not — логические операторы"
prevUrl: "11-try-except.html"
prevTitle: "Обработка ошибок"
nextUrl: "13-nested-structures.html"
nextTitle: "Вложенные структуры"
---

## Логический оператор and

and возвращает True, только если оба условия истинны:

```python
age = 25
has_license = True

if age >= 18 and has_license:
    print("Можно водить машину")

# Таблица истинности:
# True and True   -> True
# True and False  -> False
# False and True  -> False
# False and False -> False
```

## Логический оператор or

or возвращает True, если хотя бы одно условие истинно:

```python
is_weekend = True
is_holiday = False

if is_weekend or is_holiday:
    print("Можно отдыхать!")

# Таблица истинности:
# True or True   -> True
# True or False  -> True
# False or True  -> True
# False or False -> False
```

## Логический оператор not

not инвертирует булево значение:

```python
is_raining = False
if not is_raining:
    print("Зонт не нужен")

# not True  -> False
# not False -> True
```

## Сложные составные условия

Можно комбинировать несколько операторов:

```python
age = 20
has_ticket = True
is_vip = False

if (age >= 18 and has_ticket) or is_vip:
    print("Проход разрешён")

# Скобки помогают задать порядок вычислений
```

## Short-circuit evaluation

Python вычисляет условия слева направо и останавливается, как только результат определён:

```python
# Если first() вернёт False, second() не вызовется
if first() and second():
    pass

# Если first() вернёт True, second() не вызовется
if first() or second():
    pass
```
