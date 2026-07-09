---
title: "Декораторы"
lesson: 43
description: "@decorator, wraps, кастомные декораторы"
duration: 12
complexity: "3"
badge: "decorator_master"
file: "43-decorators.html"
layout: "layout.njk"
permalink: "43-decorators.html"
subtitle: "Модификация поведения функций без изменения их кода"
prevUrl: "42-inheritance.html"
prevTitle: "Наследование и полиморфизм"
nextUrl: "44-generators.html"
nextTitle: "Генераторы"
---

## Что такое декоратор?

Декоратор — это функция, которая принимает другую функцию и расширяет её поведение, не изменяя исходный код.

```python
def my_decorator(func):
    def wrapper():
        print("Что-то ДО функции")
        func()
        print("Что-то ПОСЛЕ функции")
    return wrapper

@my_decorator
def say_hello():
    print("Привет!")

say_hello()
# Вывод:
# Что-то ДО функции
# Привет!
# Что-то ПОСЛЕ функции
```

Синтаксис `@имя_декоратора` — это сокращение для `say_hello = my_decorator(say_hello)`.

## Декоратор для измерения времени

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} выполнялась {end - start:.4f} сек")
        return result
    return wrapper

@timer
def slow_function():
    total = sum(range(10_000_000))
    return total

slow_function()
# slow_function выполнялась 0.1234 сек
```

## Декоратор с аргументами

```python
def repeat(n):
    def decorator(func):
        def wrapper(*args, **kwargs):
  for _ in range(n):
      func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Привет, {name}!")

greet("Мир")
# Привет, Мир!
# Привет, Мир!
# Привет, Мир!
```

## Сохранение метаданных: @wraps

```python
from functools import wraps

def logger(func):
    @wraps(func)   # сохраняет __name__ и __doc__
    def wrapper(*args, **kwargs):
        print(f"Вызов {func.__name__}({args}, {kwargs})")
        return func(*args, **kwargs)
    return wrapper

@logger
def add(a, b):
    """Складывает два числа."""
    return a + b

print(add(3, 5))         # Вызов add((3, 5), {})  /  8
print(add.__name__)      # add (без @wraps было бы "wrapper")
print(add.__doc__)       # Складывает два числа.
```

## Практические примеры

```python
# Кэширование результатов
def cache(func):
    memo = {}
    @wraps(func)
    def wrapper(*args):
        if args not in memo:
  memo[args] = func(*args)
        return memo[args]
    return wrapper

@cache
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(100))  # работает мгновенно!
```
