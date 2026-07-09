---
title: "Цикл while"
lesson: 17
description: "while"
duration: 10
complexity: "2"
badge: "looper"
file: "17-while.html"
layout: "layout.njk"
permalink: "17-while.html"
subtitle: "while — повторение пока условие истинно"
prevUrl: "16-regex.html"
prevTitle: "Регулярные выражения"
nextUrl: "18-for.html"
nextTitle: "Цикл for"
---

## Синтаксис while

while выполняет блок кода, пока условие истинно:

```python
count = 0
while count < 5:
    print(f"Счёт: {count}")
    count += 1

# Вывод:
# Счёт: 0
# Счёт: 1
# Счёт: 2
# Счёт: 3
# Счёт: 4
```

## Бесконечный цикл

Если условие всегда истинно — цикл бесконечен. Используйте break для выхода:

```python
while True:
    cmd = input("Введите команду: ")
    if cmd == "exit":
        break
    print(f"Вы ввели: {cmd}")
```

## while с else

Блок else выполняется, если цикл завершился нормально (без break):

```python
num = 0
while num < 3:
    print(num)
    num += 1
else:
    print("Цикл завершён")

# Вывод: 0 1 2 "Цикл завершён"
```

## Пример: сумма чисел до нуля

Пользователь вводит числа, суммируем их до тех пор, пока не введёт 0:

```python
total = 0
num = int(input("Число: "))
while num != 0:
    total += num
    num = int(input("Число: "))
print(f"Сумма: {total}")
```
