---
title: 'Приведение типов'
lesson: 5
description: 'int(), float(), str(), bool()'
duration: 8
complexity: '1'
badge: 'caster'
file: '05-type-casting.html'
layout: 'layout.njk'
permalink: '05-type-casting.html'
subtitle: 'int(), float(), str(), bool() — преобразование данных из одного типа в другой'
prevUrl: '04-data-types.html'
prevTitle: 'Типы данных'
nextUrl: '06-io.html'
nextTitle: 'Ввод и вывод'
---

## Зачем нужно приведение типов?

Когда вы получаете данные от пользователя через `input()`, они всегда приходят в виде строки (`str`). Чтобы выполнять математические операции, строку нужно преобразовать в число.

```python
age_str = input("Сколько вам лет? ")   # пользователь ввёл "25"
age = int(age_str)                      # теперь age = 25 (int)
print("Через год будет:", age + 1)      # 26
```

> **💡 Совет:** **Правило:** `input()` всегда возвращает строку. Если нужны вычисления — приводите к числу!

## Основные функции приведения

<table><tbody><tr><th>Функция</th><th>Назначение</th><th>Пример</th></tr><tr><td><code>int(x)</code></td><td>Преобразует в целое число</td><td><code>int("42") → 42</code></td></tr><tr><td><code>float(x)</code></td><td>Преобразует в число с плавающей точкой</td><td><code>float("3.14") → 3.14</code></td></tr><tr><td><code>str(x)</code></td><td>Преобразует в строку</td><td><code>str(42) → "42"</code></td></tr><tr><td><code>bool(x)</code></td><td>Преобразует в логическое значение</td><td><code>bool(0) → False</code></td></tr></tbody></table>

## int() — преобразование в целое число

```python
print(int("100"))      # 100
print(int(3.99))       # 3 (дробная часть отбрасывается, НЕ округляется!)
print(int("-42"))      # -42

# Ошибка при нечисловой строке:
# int("hello")  → ValueError
```

## float() — преобразование в дробное число

```python
print(float("3.14"))   # 3.14
print(float(10))       # 10.0
print(float("5"))      # 5.0
```

## str() — преобразование в строку

```python
print(str(42))         # "42"
print(str(3.14))       # "3.14"
print(str(True))       # "True"

# Полезно для склеивания чисел со строками:
age = 25
print("Мне " + str(age) + " лет.")   # Мне 25 лет.
# Без str() будет TypeError!
```

## bool() — преобразование в логическое значение

```python
print(bool(1))         # True
print(bool(0))         # False
print(bool(""))        # False (пустая строка)
print(bool("hello"))   # True  (непустая строка)
print(bool([]))        # False (пустой список)
print(bool([1, 2]))    # True  (непустой список)
```

> **💡 Совет:** **Запомните:** «Пустые» значения (`0`, `""`, `[]`, `{}`, `None`) приводятся к `False`. Всё остальное — к `True`.

## Практический пример: калькулятор

```python
a = float(input("Введите первое число: "))
b = float(input("Введите второе число: "))

print("Сумма:", a + b)
print("Разность:", a - b)
print("Произведение:", a * b)
print("Частное:", a / b if b != 0 else "на ноль делить нельзя")
```

## Частые ошибки

- `int("3.14")` — **ValueError**: строка с точкой не может быть int. Сначала `float()`, потом `int()`.
- `"Мне " + 25 + " лет"` — **TypeError**: нельзя складывать строку и число. Используйте `str(25)`.
- `int(input())` без проверки — если пользователь введёт буквы, программа упадёт. Используйте `try/except` (будет в уроке 10).
