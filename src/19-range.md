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

Чтобы получить и индекс символа, и сам символ, используют `range(len())` — здесь `len()` возвращает длину строки, а `word[i]` обращается к символу по индексу `i`:

```python
word = "банан"
for i in range(len(word)):
    print(i, word[i])

# Вывод:
# 0 б
# 1 а
# 2 н
# 3 а
# 4 н
```

## Особенности range()

range() не создаёт список всех чисел сразу, а генерирует их на лету при итерации — это экономит память (ленивые вычисления).

Кроме того, у range можно получить длину и обратиться к его элементам по индексу:

```python
# range — это отдельный тип
r = range(1000000)
print(type(r))  # <class 'range'>
print(len(r))   # 1000000
print(r[0])     # 0
print(r[-1])    # 999999
```
