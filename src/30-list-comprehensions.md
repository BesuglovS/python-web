---
title: "Списочные выражения"
lesson: 30
description: "[x for x in ... if ...]"
duration: 12
complexity: "3"
badge: "comprehension_master"
file: "30-list-comprehensions.html"
layout: "layout.njk"
permalink: "30-list-comprehensions.html"
subtitle: "[x for x in ... if ...]"
prevUrl: "29-split-join.html"
prevTitle: "split + join"
nextUrl: "31-lambda.html"
nextTitle: "Lambda-функции"
---

## Базовый синтаксис

Списочное выражение (list comprehension) — компактный способ создания списков:

```python
# Обычный цикл
squares = []
for x in range(5):
    squares.append(x**2)

# То же через list comprehension
squares = [x**2 for x in range(5)]
print(squares)  # [0, 1, 4, 9, 16]
```

## С условием (if)

Можно добавить фильтрацию:

```python
# Только чётные числа
evens = [x for x in range(10) if x % 2 == 0]
print(evens)  # [0, 2, 4, 6, 8]

# Квадраты только нечётных
odd_squares = [x**2 for x in range(10) if x % 2 != 0]
print(odd_squares)  # [1, 9, 25, 49, 81]
```

## Вложенные списочные выражения

Можно использовать несколько for:

```python
# Матрица 3x3
matrix = [[i * 3 + j for j in range(3)] for i in range(3)]
print(matrix)  # [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

# "Сплющивание" матрицы
flat = [num for row in matrix for num in row]
print(flat)  # [0, 1, 2, 3, 4, 5, 6, 7, 8]
```

## Словарные выражения

Аналогично для словарей:

```python
# Словарь квадратов
squares_dict = {x: x**2 for x in range(5)}
print(squares_dict)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Фильтрация словаря
original = {"a": 1, "b": 2, "c": 3, "d": 4}
filtered = {k: v for k, v in original.items() if v > 2}
print(filtered)  # {"c": 3, "d": 4}
```
