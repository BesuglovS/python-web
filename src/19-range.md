---
title: 'range()'
lesson: 19
description: 'Генерация последовательностей'
duration: 8
complexity: '2'
badge: 'range_runner'
file: '19-range.html'
layout: 'layout.njk'
permalink: '19-range.html'
subtitle: 'Генерация последовательностей чисел'
prevUrl: '18-for.html'
prevTitle: 'Цикл for'
nextUrl: '20-break-continue.html'
nextTitle: 'break и continue'
---

## Три формы range()

**range(stop)** — числа от 0 до stop-1:

```python
for i in range(5):
    print(i, end=" ")   # 0 1 2 3 4
```

**range(start, stop)** — от start до stop-1:

```python
for i in range(2, 7):
    print(i, end=" ")   # 2 3 4 5 6
```

**range(start, stop, step)** — с шагом step:

```python
for i in range(0, 10, 2):
    print(i, end=" ")   # 0 2 4 6 8

for i in range(10, 0, -2):
    print(i, end=" ")   # 10 8 6 4 2
```

## range() в цикле for

Самое частое применение — повторение N раз:

```python
for i in range(3):
    print("Hello")  # Hello Hello Hello
```

## Особенности range()

range() не создаёт список, а генерирует числа на лету (экономит память):

```python
# range — это отдельный тип
r = range(1000000)
print(type(r))  #
print(len(r))   # 1000000
print(r[0])     # 0
print(r[-1])    # 999999
```

При необходимости range можно преобразовать в настоящий список с помощью `list()`:

```python
nums = list(range(5))
print(nums)     # [0, 1, 2, 3, 4]
print(type(nums))  #
```

> **⚠️ Важно:** **📝 Что такое list()?** `list()` — это функция, которая создаёт список (коллекцию элементов) из переданной последовательности. Квадратные скобки `[0, 1, 2, 3, 4]` — это как раз внешний вид списка. Подробно списки разбираются в [уроке 22](22-lists.html).
