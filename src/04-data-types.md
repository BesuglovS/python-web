---
title: 'Типы данных'
lesson: 4
description: 'int, float, str, bool, NoneType'
badge: 'type_explorer'
file: '04-data-types.html'
layout: 'layout.njk'
permalink: '04-data-types.html'
subtitle: 'int, float, str, bool, NoneType, type(), isinstance()'
---

## Основные встроенные типы

В Python у каждого значения есть тип:

```python
# Числовые типы
x = 10          # int — целое число
y = 3.14        # float — число с плавающей точкой
z = 1 + 2j      # complex — комплексное число

# Строковый тип
name = "Python"  # str — строка

# Логический тип
flag = True      # bool — булево значение

# Пустой тип
result = None    # NoneType — отсутствие значения
```

## Определение типа — type() и isinstance()

Узнать тип переменной:

```python
print(type(10))          # <class 'int'>
print(type("hello"))     # <class 'str'>
print(type(True))        # <class 'bool'>

# isinstance — проверка принадлежности типу
print(isinstance(10, int))       # True
print(isinstance("abc", str))    # True
print(isinstance(10, (int, float)))  # True
```

## Преобразование типов

Явное преобразование (приведение) типов — превращение значения из одного типа в другой с помощью функций-конструкторов: `int()`, `float()`, `str()`, `bool()`.

### Числовые преобразования

```python
# int > float
print(float(5))        # 5.0

# float > int (дробная часть отбрасывается!)
print(int(3.14))       # 3
print(int(3.99))       # 3  (не округляет, а отбрасывает)

# int > str
print(str(100))        # "100"

# float > str
print(str(3.14))       # "3.14"
```

### Преобразование строк в числа

```python
# Строка > int
print(int("42"))       # 42

# Строка > float
print(float("2.5"))    # 2.5
print(float("3"))      # 3.0  (float допускает целое в строке)
```

**Ошибка преобразования.** Если строка не является числом, Python выбросит ошибку `ValueError`:

```python
# int("abc")    # ValueError: invalid literal for int()
# float("12,5") # ValueError: 12,5 — нужна точка, а не запятая
```

### Преобразование в bool

Любое значение можно превратить в `bool`. Правило простое: «пустые» значения дают `False`, всё остальное — `True`. Подробнее о truthy и falsy значениях — в уроке 9.

```python
print(bool(1))         # True
print(bool(0))         # False   (ноль — «пустое» число)
print(bool(-5))        # True
print(bool(""))        # False   (пустая строка)
print(bool("text"))    # True    (непустая строка)
print(bool(None))      # False
```

### Bool как число

`True` ведёт себя как `1`, `False` — как `0`:

```python
print(int(True))       # 1
print(int(False))      # 0
print(True + 5)        # 6
print(False * 10)      # 0
```

## Изменяемые и неизменяемые типы

Одни типы можно изменять после создания (изменяемые), другие — нет (неизменяемые):

Неизменяемые (immutable): int, float, str, bool

Изменяемые (mutable) мы изучим позже — к ним относятся list, dict, set и другие коллекции.

```python
# Строки неизменяемы
s = "hello"
# s[0] = "H"  # Ошибка! Нельзя изменить символ
s = "H" + s[1:]  # Нужно создать новую строку
```
