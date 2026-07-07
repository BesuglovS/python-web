---
title: "Кортежи"
lesson: 27
description: "tuple, неизменяемые последовательности"
duration: 10
complexity: "2"
badge: "tuple_tamer"
file: "27-tuples.html"
layout: "layout.njk"
permalink: "27-tuples.html"
subtitle: "tuple, неизменяемые последовательности"
prevUrl: "26-sets.html"
prevTitle: "Множества"
nextUrl: "28-dicts.html"
nextTitle: "Словари"
---

## Создание кортежей

Кортеж — неизменяемая упорядоченная коллекция:

```python
# Через круглые скобки
point = (3, 4)
colors = ("red", "green", "blue")

# Без скобок (кортеж создаётся запятыми)
point = 3, 4

# Кортеж из одного элемента
single = (1,)  # запятая обязательна!

# Через функцию tuple()
nums = tuple([1, 2, 3])  # (1, 2, 3)
```

## Неизменяемость

Кортеж нельзя изменить после создания:

```python
point = (3, 4)
print(point[0])   # 3
print(point[1])   # 4

# point[0] = 10  # Ошибка! TypeError

# Но если кортеж содержит список, список можно изменить
mixed = (1, [2, 3])
mixed[1].append(4)  # (1, [2, 3, 4])
```

## Распаковка кортежей

Кортежи удобно распаковывать в переменные:

```python
point = (3, 4)
x, y = point
print(x)  # 3
print(y)  # 4

# Обмен значений через кортеж
a, b = 1, 2
a, b = b, a
print(a, b)  # 2 1

# Методы кортежа
print(point.count(3))  # 1
print(point.index(4))  # 1
```

[< Списки (list)](26-sets.html) [Далее: Словари →](28-dicts.html)
