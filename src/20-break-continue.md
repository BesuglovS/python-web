---
title: 'break и continue'
lesson: 20
description: 'Прерывание и пропуск итераций'
badge: 'flow_controller'
file: '20-break-continue.html'
layout: 'layout.njk'
permalink: '20-break-continue.html'
subtitle: 'Управление потоком цикла — прерывание и пропуск итераций'
---

## break: прерывание цикла

`break` немедленно завершает текущий цикл:

```python
for i in range(10):
    if i == 5:
        break
    print(i)  # 0 1 2 3 4

print("Цикл завершён")
```

После `break` выполнение продолжается со следующей строки после цикла.

## Поиск с break

`break` удобен для поиска элемента — как только нашли, цикл не нужно продолжать:

```python
# Ищем цифру 5 в строке
text = "371942"
search = "9"

for char in text:
    if char == search:
        print(f"Нашли {search}!")
        break
else:
    print(f"{search} не найден")
```

> **⚠️ Важно:** **for...else:** блок `else` выполняется только если цикл завершился _без_ `break`.

## break в while

Часто используется для выхода из бесконечного цикла:

```python
while True:
    cmd = input("Введите команду > ")
    if cmd == "quit":
        break
    print(f"Выполняю: {cmd}")
```

## continue: пропуск итерации

`continue` пропускает оставшуюся часть **текущей** итерации и переходит к следующей:

```python
for i in range(5):
    if i == 2:
        continue
    print(i)  # 0 1 3 4 (пропустили 2)
```

## Примеры с continue

Печать только чётных чисел:

```python
for num in range(1, 11):
    if num % 2 != 0:
        continue
    print(num)  # 2 4 6 8 10
```

`continue` в `while` — важно обновить счётчик до `continue`:

```python
num = 0
while num < 10:
    num += 1          # обновляем ДО проверки!
    if num % 3 == 0:
        continue
    print(num)        # 1 2 4 5 7 8 10
```

## break vs continue vs return

Сравнение всех трёх способов управления потоком:

```python
# break — выход из всего цикла
for i in range(5):
    if i == 3:
        break
    print(i)  # 0 1 2

# continue — пропуск одной итерации
for i in range(5):
    if i == 3:
        continue
    print(i)  # 0 1 2 4

# return — выход из всей функции
def find_first_even(limit):
    for num in range(limit + 1):
        if num % 2 == 0:
  return num  # завершает функцию
    return None
```

<table><tbody><tr><th>Оператор</th><th>Действие</th><th>Что завершает</th></tr><tr><td><code>break</code></td><td>Выход из цикла</td><td>Только текущий цикл</td></tr><tr><td><code>continue</code></td><td>Пропуск итерации</td><td>Текущую итерацию цикла</td></tr><tr><td><code>return</code></td><td>Возврат значения</td><td>Всю функцию</td></tr></tbody></table>
