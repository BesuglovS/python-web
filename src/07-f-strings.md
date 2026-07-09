---
title: "f-строки"
lesson: 7
description: 'f"{переменная=}", форматирование чисел'
duration: 10
complexity: "1"
badge: "fstring_guru"
file: "07-f-strings.html"
layout: "layout.njk"
permalink: "07-f-strings.html"
subtitle: "Современное форматирование текста в Python (f-strings)"
prevUrl: "06-io.html"
prevTitle: "Ввод и вывод"
nextUrl: "08-number-ops.html"
nextTitle: "Операции над числами"
---

## Что такое f-строки?

f-строки (formatted string literals) — это самый удобный способ вставки значений переменных в строку. Появились в Python 3.6 и стали стандартом для форматирования.

```python
name = "Максим"
age = 25
print(f"Привет, {name}! Тебе {age} лет.")
# Привет, Максим! Тебе 25 лет.
```

Синтаксис: перед строкой ставится буква `f`, а переменные или выражения пишутся внутри фигурных скобок `{ }`.

## Сравнение способов форматирования

```python
name = "Анна"
age = 30

# Старый способ (оператор %)
print("Привет, %s! Тебе %d лет." % (name, age))

# Метод .format()
print("Привет, {}! Тебе {} лет.".format(name, age))

# f-строка — самый современный и читаемый
print(f"Привет, {name}! Тебе {age} лет.")
```
> **💡 Совет:** **Рекомендация:** всегда используйте f-строки для нового кода. Они быстрее и читаемее.

## Выражения внутри f-строк

```python
a = 10
b = 3
print(f"{a} + {b} = {a + b}")     # 10 + 3 = 13
print(f"{a} / {b} = {a / b:.2f}") # 10 / 3 = 3.33

# Вызов функций внутри f-строк
name = "python"
print(f"{name.upper()} — это круто!")  # PYTHON — это круто!

# Тернарный оператор
score = 85
print(f"Результат: {'Сдал' if score >= 60 else 'Не сдал'}")
```

## Форматирование чисел

<table><tbody><tr><th>Спецификация</th><th>Пример</th><th>Результат</th></tr><tr><td><code>:.2f</code></td><td><code>f"{3.14159:.2f}"</code></td><td>3.14</td></tr><tr><td><code>:.0f</code></td><td><code>f"{3.99:.0f}"</code></td><td>4 (округляет!)</td></tr><tr><td><code>:.1%</code></td><td><code>f"{0.85:.1%}"</code></td><td>85.0%</td></tr><tr><td><code>:,</code></td><td><code>f"{1000000:,}"</code></td><td>1,000,000</td></tr></tbody></table>
```python
pi = 3.1415926535
print(f"Число π ≈ {pi:.4f}")    # Число π ≈ 3.1416
print(f"Число π ≈ {pi:.2f}")    # Число π ≈ 3.14
```

## Выравнивание текста

```python
# Выравнивание по правому краю (ширина 10)
print(f"|{25:>10}|")   # |        25|

# По левому краю
print(f"|{'текст':<10}|")  # |текст     |

# По центру
print(f"|{'Python':^10}|") # |  Python  |

# Заполнение символом
print(f"|{25:0>5}|")       # |00025|
print(f"|{'abc':-^7}|")    # |--abc--|
```

## Практические примеры

```python
# Таблица умножения
for i in range(1, 5):
    for j in range(1, 5):
        print(f"{i} × {j} = {i*j:>2}", end="  ")
    print()

# Отображение цен
products = {"apple": 79.90, "milk": 120.00, "bread": 55.50}
for name, price in products.items():
    print(f"{name:.<20} {price:>8.2f} ₽")

# Вывод списка с нумерацией
fruits = ["яблоко", "банан", "вишня"]
for i, fruit in enumerate(fruits, 1):
    print(f"{i}. {fruit}")
```

## Debug-режим: {x=}

```python
x = 42
y = 3.14
print(f"{x=}")          # x=42
print(f"{x=} {y=}")    # x=42 y=3.14
print(f"{x+y=}")       # x+y=45.14

# Очень удобно для отладки:
name = "Максим"
print(f"{name=}")      # name='Максим'
```
