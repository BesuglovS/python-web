---
title: "Вложенные циклы"
lesson: 21
description: "Циклы внутри циклов"
duration: 10
complexity: "2"
badge: "nested_looper"
file: "21-nested-loops.html"
layout: "layout.njk"
permalink: "21-nested-loops.html"
subtitle: "Циклы внутри циклов"
prevUrl: "20-break-continue.html"
prevTitle: "break и continue"
nextUrl: "22-functions.html"
nextTitle: "Создание простейших функций"
---

## Вложенные циклы for

Цикл внутри другого цикла — внешний и внутренний:

```python
for i in range(3):
    for j in range(2):
        print(f"i={i}, j={j}")

# Вывод:
# i=0, j=0
# i=0, j=1
# i=1, j=0
# i=1, j=1
# i=2, j=0
# i=2, j=1
```

## Таблица умножения

Классический пример вложенных циклов:

```python
for i in range(1, 10):
    for j in range(1, 10):
        print(f"{i}*{j}={i*j:2}", end="  ")
    print()  # новая строка
```

## break и continue во вложенных циклах

break/continue действуют только на ближайший цикл:

```python
for i in range(3):
    for j in range(3):
        if j == 1:
  break  # прерывает только внутренний цикл
        print(f"({i},{j})", end=" ")
    print()

# Вывод:
# (0,0)
# (1,0)
# (2,0)
```
