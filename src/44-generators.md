---
title: 'Генераторы'
lesson: 44
description: 'yield, ленивые вычисления, generator expressions'
duration: 12
complexity: '3'
badge: 'generator_guru'
file: '44-generators.html'
layout: 'layout.njk'
permalink: '44-generators.html'
subtitle: 'yield и ленивые вычисления'
prevUrl: '43-decorators.html'
prevTitle: 'Декораторы'
nextUrl: '45-threading-async.html'
nextTitle: 'Многопоточность и asyncio'
---

## Что такое генератор?

Генератор — это функция, которая выдаёт значения по одному с помощью `yield`. В отличие от `return`, `yield` не завершает функцию, а приостанавливает её до следующего запроса. Это экономит память.

## yield vs return

```python
# Обычная функция (return)
def get_list():
    return [1, 2, 3]

# Функция-генератор (yield)
def get_generator():
    yield 1
    yield 2
    yield 3

print(get_list())         # [1, 2, 3] — сразу весь список в памяти
gen = get_generator()
print(next(gen))          # 1
print(next(gen))          # 2
print(next(gen))          # 3
# next(gen) → StopIteration
```

## Генератор с бесконечной последовательностью

```python
def infinite_counter():
    n = 0
    while True:
        yield n
        n += 1

counter = infinite_counter()
print(next(counter))  # 0
print(next(counter))  # 1
print(next(counter))  # 2
# Можно брать значения бесконечно без затрат памяти
```

## Генераторные выражения

```python
# List comprehension (создаёт список в памяти)
squares_list = [x**2 for x in range(10)]          # список: 10 элементов
print(sum(squares_list))                          # 285

# Generator expression (круглые скобки, ленивое)
squares_gen = (x**2 for x in range(10))           # генератор: почти 0 памяти
print(sum(squares_gen))                           # 285

# Огромная разница при больших объёмах:
import sys
big_list = [x**2 for x in range(1_000_000)]       # ~8 МБ
big_gen = (x**2 for x in range(1_000_000))        # ~200 байт
print(sys.getsizeof(big_gen))                     # 200
```

## Чтение большого файла построчно

```python
def read_large_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
  yield line.strip()

for line in read_large_file("huge_log.txt"):
    if "ERROR" in line:
        print(line)  # обрабатываем строки по одной, а не весь файл сразу
```
