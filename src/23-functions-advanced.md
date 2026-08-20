---
title: 'Продвинутые функции'
lesson: 23
description: 'args/kwargs, области видимости: global и nonlocal'
badge: 'func_guru'
file: '23-functions-advanced.html'
layout: 'layout.njk'
permalink: '23-functions-advanced.html'
subtitle: '*args, **kwargs, области видимости: global и nonlocal'
---

## Понадобятся два типа данных: кортеж и словарь

`*args` внутри функции — это **кортеж**, а `**kwargs` — **словарь**. Познакомимся с ними кратко — подробно разберём в [уроке 27](27-tuples.html) (кортежи) и [уроке 28](28-dicts.html) (словари):

```python
# Кортеж — упорядоченный неизменяемый набор элементов
point = (1, 2, 3)
print(point[0])   # 1 — индексация и срезы работают, как у строк
print(point[1:])  # (2, 3)
# point[0] = 5    # Ошибка! Кортеж нельзя изменять

# Словарь — набор пар «ключ: значение»
user = {"name": "Анна", "age": 25}
print(user["name"])  # Анна — доступ по ключу
for key, value in user.items():
    print(f"{key}: {value}")
```

## \*args — произвольное количество аргументов

`*args` позволяет передать любое количество позиционных аргументов. Внутри функции это кортеж (урок [27](27-tuples.html)):

```python
def sum_all(*args):
    """Суммирует все переданные числа."""
    total = 0
    for num in args:
        total += num
    return total

print(sum_all(1, 2, 3))       # 6
print(sum_all(10, 20, 30, 40)) # 100
print(sum_all())               # 0
```

> **💡 Совет:** для суммирования чисел в Python есть встроенная функция `sum()`, которая делает то же самое, что и `sum_all` выше:
>
> ```python
> print(sum((1, 2, 3, 4)))   # 10
> print(sum([10, 20, 30]))   # 60
> ```
>
> Она принимает кортеж или список чисел и возвращает их сумму.

## \*\*kwargs — именованные аргументы

`**kwargs` собирает все переданные именованные аргументы в словарь (урок [28](28-dicts.html)):

```python
def describe_person(**kwargs):
    """Выводит информацию о человеке."""
    for key, value in kwargs.items():
        print(f"{key}: {value}")

describe_person(name="Анна", age=25, city="Москва")
# name: Анна
# age: 25
# city: Москва
```

## Комбинирование \*args и \*\*kwargs

Можно использовать оба одновременно. Порядок обязателен: обычные параметры, затем \*args, затем \*\*kwargs:

```python
def full_info(title, *args, **kwargs):
    print(f"Заголовок: {title}")
    if args:
        print(f"Позиционные: {args}")
    if kwargs:
        print(f"Именованные: {kwargs}")

full_info("Отчёт", 100, 200, status="OK", user="admin")
# Заголовок: Отчёт
# Позиционные: (100, 200)
# Именованные: {'status': 'OK', 'user': 'admin'}
```

## Области видимости: global и nonlocal

Переменные внутри функции локальны. `global` разрешает изменять глобальную переменную, `nonlocal` — переменную из внешней функции:

```python
# global — изменение глобальной переменной
counter = 0

def increment():
    global counter
    counter += 1

increment()
increment()
print(counter)  # 2

# nonlocal — изменение переменной из внешней (но не глобальной) области
def outer():
    x = 10
    def inner():
        nonlocal x
        x += 5
    inner()
    print(x)  # 15

outer()
```
