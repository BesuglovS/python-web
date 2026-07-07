---
title: "lambda-функции"
lesson: 31
description: "lambda, map(), filter(), sorted()"
duration: 12
complexity: "3"
badge: "lambda_wizard"
file: "31-lambda.html"
layout: "layout.njk"
permalink: "31-lambda.html"
subtitle: "Анонимные однострочные функции в Python"
prevUrl: "30-list-comprehensions.html"
prevTitle: "Списочные выражения"
nextUrl: "32-files.html"
nextTitle: "Файлы: чтение и запись"
---

## Что такое lambda-функция?

Lambda-функция — это короткая анонимная (безымянная) функция, которая записывается в одну строку. Полезна, когда функцию нужно использовать один раз и не хочется писать отдельный `def`.

```python
# Обычная функция
def double(x):
    return x * 2

# То же самое через lambda
double_lambda = lambda x: x * 2

print(double(5))         # 10
print(double_lambda(5))  # 10
```

Синтаксис: `lambda аргументы: выражение`

## Основной сценарий: sort() с key

Самое частое применение lambda — сортировка по определённому критерию:

```python
# Сортировка списка кортежей по второму элементу
students = [("Анна", 95), ("Борис", 82), ("Вика", 100)]
students.sort(key=lambda student: student[1])
print(students)  # [('Борис', 82), ('Анна', 95), ('Вика', 100)]

# Сортировка по длине строки
words = ["Python", "C", "Java", "JavaScript"]
words.sort(key=lambda w: len(w))
print(words)     # ['C', 'Java', 'Python', 'JavaScript']

# Сортировка словаря по значениям
grades = {"Анна": 85, "Борис": 92, "Вика": 78}
sorted_items = sorted(grades.items(), key=lambda item: item[1])
print(sorted_items)  # [('Вика', 78), ('Анна', 85), ('Борис', 92)]

# Сортировка списка словарей
users = [{"name": "Иван", "age": 30}, {"name": "Петя", "age": 25}]
users.sort(key=lambda u: u["age"])
print(users)  # [{'name': 'Петя', 'age': 25}, {'name': 'Иван', 'age': 30}]
```

## map() — применение функции к каждому элементу

```python
nums = [1, 2, 3, 4, 5]

# Возвести в квадрат каждый элемент
squares = list(map(lambda x: x**2, nums))
print(squares)  # [1, 4, 9, 16, 25]

# Перевести все строки в верхний регистр
words = ["hello", "world"]
upper_words = list(map(lambda w: w.upper(), words))
print(upper_words)  # ['HELLO', 'WORLD']

# Преобразование температур Цельсий → Фаренгейт
celsius = [0, 10, 20, 30, 40]
fahrenheit = list(map(lambda c: c * 9/5 + 32, celsius))
print(fahrenheit)   # [32.0, 50.0, 68.0, 86.0, 104.0]
```

## filter() — отбор элементов по условию

```python
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Только чётные числа
evens = list(filter(lambda x: x % 2 == 0, nums))
print(evens)  # [2, 4, 6, 8, 10]

# Строки длиннее 5 символов
words = ["a", "python", "is", "awesome"]
long_words = list(filter(lambda w: len(w) > 5, words))
print(long_words)  # ['python', 'awesome']

# Положительные числа
nums = [-3, 5, -1, 0, 8, -4]
positives = list(filter(lambda x: x > 0, nums))
print(positives)   # [5, 8]
```

## Lambda с несколькими аргументами

```python
# Сумма двух чисел
add = lambda a, b: a + b
print(add(5, 3))  # 8

# Максимум из двух
max2 = lambda a, b: a if a > b else b
print(max2(10, 20))  # 20

# Сортировка по сумме элементов кортежа
pairs = [(1, 5), (3, 2), (2, 8)]
pairs.sort(key=lambda p: p[0] + p[1])
print(pairs)  # [(3, 2), (1, 5), (2, 8)]
```

## Когда НЕ использовать lambda

> **💡 Совет:** **Правило:** если логика занимает более одной строки или требует условий с `if/elif/else`, используйте обычную функцию с `def`. Lambda — для коротких, простых выражений.
```python
# ПЛОХО: слишком сложная lambda (нечитаемо!)
process = lambda x: x**2 if x > 0 else x**3 if x < 0 else 0

# ХОРОШО: обычная функция (понятно!)
def process(x):
    if x > 0:
        return x**2
    elif x < 0:
        return x**3
    else:
        return 0
```

## Практический пример: анализ данных

```python
# Данные о продажах
sales = [
    {"product": "Ноутбук", "price": 80000, "qty": 5},
    {"product": "Мышь", "price": 2000, "qty": 30},
    {"product": "Клавиатура", "price": 4000, "qty": 15},
]

# Топ товаров по выручке (price * qty)
sales.sort(key=lambda s: s["price"] * s["qty"], reverse=True)
for item in sales:
    revenue = item["price"] * item["qty"]
    print(f"{item['product']}: {revenue:,} ₽")

# Вывод:
# Ноутбук: 400,000 ₽
# Клавиатура: 60,000 ₽
# Мышь: 60,000 ₽
```

[← Списочные выражения](30-list-comprehensions.html) [Далее: Файлы →](32-files.html)
