---
title: 'range()'
lesson: 19
description: 'Генерация последовательностей'
badge: 'range_runner'
file: '19-range.html'
layout: 'layout.njk'
permalink: '19-range.html'
subtitle: 'Генерация последовательностей чисел'
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

## range(len()) — перебор по индексам

Чтобы получить и индекс элемента, и сам элемент, используют `range(len())` — здесь `len()` возвращает длину коллекции, а `words[i]` обращается к элементу по индексу `i`:

```python
words = ["яблоко", "банан", "вишня"]
for i in range(len(words)):
    print(i, words[i])

# Вывод:
# 0 яблоко
# 1 банан
# 2 вишня
```

## Особенности range()

range() не создаёт список, а генерирует числа на лету (экономит память):

```python
# range — это отдельный тип
r = range(1000000)
print(type(r))  # <class 'range'>
print(len(r))   # 1000000
print(r[0])     # 0
print(r[-1])    # 999999
```

При необходимости range можно преобразовать в настоящий список с помощью `list()`:

```python
nums = list(range(5))
print(nums)     # [0, 1, 2, 3, 4]
print(type(nums))  # <class 'list'>
```

> **📝 Что такое list()?** `list()` — это функция, которая создаёт список (коллекцию элементов) из переданной последовательности. Квадратные скобки `[0, 1, 2, 3, 4]` — это как раз внешний вид списка. Подробно списки разбираются в [уроке 25](25-lists.html).
