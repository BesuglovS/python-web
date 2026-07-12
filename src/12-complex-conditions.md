---
title: 'Сложные условия'
lesson: 12
description: 'and, or, not'
badge: 'logician'
file: '12-complex-conditions.html'
layout: 'layout.njk'
permalink: '12-complex-conditions.html'
subtitle: 'and, or, not — логические операторы'
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

## Законы де Моргана

Законы де Моргана позволяют преобразовать отрицание сложного выражения. Они полезны для упрощения условий и проверки «обратных» ситуаций:
<!-- norun -->

```
not (A and B)  →  (not A) or (not B)
not (A or B)   →  (not A) and (not B)
```

На практике это работает так:

```python
# Проверка, что число НЕ в диапазоне [0, 10]
x = 15

# Вариант 1: напрямую
if x < 0 or x > 10:
    print("Вне диапазона")

# Вариант 2: через отрицание и закон де Моргана
if not (x >= 0 and x <= 10):
    print("Вне диапазона")

# Оба варианта эквивалентны!
```

Ещё пример:

```python
# Не пропускать пользователей, у которых нет билета ИЛИ они не VIP
# Исходное условие: not (has_ticket and is_vip)
# По закону де Моргана: (not has_ticket) or (not is_vip)

if not (has_ticket and is_vip):
    print("Доступ запрещён")

# Эквивалентно:
if not has_ticket or not is_vip:
    print("Доступ запрещён")
```

> **💡 Совет:** Законы де Моргана часто используются, чтобы переписать условие в более читаемой форме или избежать двойного отрицания.
