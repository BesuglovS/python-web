---
title: 'Продвинутые функции'
lesson: 23
description: 'args/kwargs, области видимости, аннотации'
duration: 15
complexity: '3'
badge: 'func_guru'
file: '23-functions-advanced.html'
layout: 'layout.njk'
permalink: '23-functions-advanced.html'
subtitle: '*args, **kwargs, области видимости, аннотации типов'
prevUrl: '22-functions.html'
prevTitle: 'Создание простейших функций'
nextUrl: '24-debugging.html'
nextTitle: 'Отладка программ'
---

## \*args — произвольное количество аргументов

`*args` позволяет передать любое количество позиционных аргументов. Внутри функции это кортеж:

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

## \*\*kwargs — именованные аргументы

`**kwargs` собирает все переданные именованные аргументы в словарь:

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

## Аннотации типов

Начиная с Python 3.5, можно указывать ожидаемые типы параметров и возвращаемого значения. Это помогает читать код и использовать автодополнение в IDE:

```python
def add(a: int, b: int) -> int:
    """Складывает два целых числа."""
    return a + b

def greet(name: str, times: int = 1) -> None:
    """Приветствует указанное количество раз."""
    for _ in range(times):
        print(f"Привет, {name}!")

result: int = add(5, 3)   # Аннотация переменной
greet("Анна", 3)           # Аннотации не проверяются во время выполнения
```

> **⚠️ Важно:** **Важно:** аннотации типов не проверяются интерпретатором. Для проверки используйте инструменты вроде `mypy`.
