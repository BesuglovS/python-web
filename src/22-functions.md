---
title: 'Функции'
lesson: 22
description: 'def, return, параметры'
duration: 12
complexity: '2'
badge: 'func_creator'
file: '22-functions.html'
layout: 'layout.njk'
permalink: '22-functions.html'
subtitle: 'def, return, параметры, аргументы'
prevUrl: '21-nested-loops.html'
prevTitle: 'Вложенные циклы'
nextUrl: '23-functions-advanced.html'
nextTitle: 'Функции: продвинутые темы'
---

## Определение функции

Функция — это именованный блок кода, который можно вызывать:

```python
def greet():
    print("Привет!")

greet()  # Вызов функции -> "Привет!"
```

## Параметры и аргументы

Функции могут принимать входные данные:

```python
def greet(name):
    print(f"Привет, {name}!")

greet("Анна")  # "Привет, Анна!"
greet("Мир")   # "Привет, Мир!"
```

## Возврат значения — return

return передаёт результат обратно в вызывающий код:

```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)  # 8

# Функция без return возвращает None
def do_nothing():
    pass

print(do_nothing())  # None
```

## Параметры по умолчанию

Можно задать значения по умолчанию:

```python
def greet(name, greeting="Привет"):
    print(f"{greeting}, {name}!")

greet("Анна")           # "Привет, Анна!"
greet("Анна", "Здравствуйте")  # "Здравствуйте, Анна!"
```

## Документирование (docstring)

Строка документации сразу после def:

```python
def add(a, b):
    """Возвращает сумму двух чисел."""
    return a + b

print(add.__doc__)  # "Возвращает сумму двух чисел."
help(add)           # Покажет документацию
```

## Несколько параметров

Функция может принимать любое количество параметров через запятую:

```python
def describe_person(name, age, city):
    print(f"{name}, {age} лет, город {city}")

describe_person("Олег", 25, "Москва")
# "Олег, 25 лет, город Москва"

# Параметры передаются по порядку
def power(base, exp):
    return base ** exp

print(power(2, 10))   # 1024
print(power(10, 2))   # 100  (порядок важен!)
```

## Область видимости переменных

Переменные, созданные внутри функции, не видны снаружи (локальная область видимости):

```python
def my_func():
    x = 100        # Локальная переменная
    print(x)

my_func()          # 100
# print(x)         # Ошибка! NameError: x не определена

# Переменные снаружи функции доступны для чтения, но не для изменения
total = 0

def add_to_total(n):
    # global total     # Раскомментируйте, чтобы изменять глобальную переменную
    local = total + n   # Чтение глобальной — ОК
    return local

print(add_to_total(5))  # 5
print(total)            # 0 (не изменилась!)
```

## Именованные аргументы

При вызове можно явно указать, какому параметру присваивается значение. Это позволяет не запоминать порядок:

```python
def greet(name, greeting="Привет"):
    print(f"{greeting}, {name}!")

# Позиционные аргументы (по порядку)
greet("Анна", "Здравствуйте")     # "Здравствуйте, Анна!"

# Именованные аргументы (порядок не важен)
greet(greeting="Здравствуйте", name="Анна")  # "Здравствуйте, Анна!"
greet(name="Борис")                          # "Привет, Борис!"

# Смешанный вызов: сначала позиционные, затем именованные
greet("Виктор", greeting="Добрый день")      # "Добрый день, Виктор!"
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

## Практический пример: калькулятор

Объединим изученные концепции в одной программе:

```python
def calculate(a: float, b: float, operation: str = "+") -> float:
    """Выполняет арифметическую операцию над двумя числами.

    Аргументы:
        a, b — числа
        operation — знак операции: "+", "-", "*", "/"

    Возвращает:
        Результат вычисления.
    """
    if operation == "+":
        return a + b
    elif operation == "-":
        return a - b
    elif operation == "*":
        return a * b
    elif operation == "/":
        if b != 0:
  return a / b
        else:
  print("Ошибка: деление на ноль!")
  return None
    else:
        print(f"Неизвестная операция: {operation}")
        return None

# Использование
print(calculate(10, 5, "+"))   # 15.0
print(calculate(10, 5, "/"))   # 2.0
print(calculate(10, 0, "/"))   # Ошибка: деление на ноль! \n None
```
