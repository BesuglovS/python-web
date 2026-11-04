---
title: 'Типы данных'
lesson: 4
description: 'int, float, str, bool, NoneType'
layout: 'layout.njk'
permalink: '04-data-types.html'
subtitle: 'int, float, str, bool, NoneType, type(), isinstance()'
---

## Основные встроенные типы

В Python у каждого значения есть тип:

```python
# Числовые типы
x = 10          # int   — целое число
y = 3.14        # float — число с плавающей точкой
z = 1 + 2j      # complex — комплексное число (инженерия, наука)

# Строковый тип
name = "Python"  # str — строка

# Логический тип
flag = True      # bool — булево значение

# Пустой тип
result = None    # NoneType — отсутствие значения
```

## Определение типа — type() и isinstance()

```python
print(type(10))          # <class 'int'>
print(type("hello"))     # <class 'str'>
print(type(True))        # <class 'bool'>
print(type(None))        # <class 'NoneType'>

# isinstance — проверка принадлежности типу
print(isinstance(10, int))            # True
print(isinstance("abc", str))         # True
print(isinstance(10, (int, float)))   # True
```

**`bool` — подкласс `int`.** Поэтому `isinstance(True, int)` возвращает `True`, а `True == 1`. Именно поэтому булевы значения можно складывать с числами.

## Преобразование типов

Значение можно явно превратить в другой тип функциями-конструкторами:

<table class="lesson-table"><thead><tr><th scope="col">Функция</th><th scope="col">Что делает</th><th scope="col">Пример</th></tr></thead><tbody><tr><td><code>int(x)</code></td><td>Целое число (дробная часть отбрасывается)</td><td><code>int(3.99)</code> → <code>3</code></td></tr><tr><td><code>float(x)</code></td><td>Число с плавающей точкой</td><td><code>float("3.14")</code> → <code>3.14</code></td></tr><tr><td><code>str(x)</code></td><td>Строка</td><td><code>str(42)</code> → <code>"42"</code></td></tr><tr><td><code>bool(x)</code></td><td>Логическое значение</td><td><code>bool(0)</code> → <code>False</code></td></tr></tbody></table>

```python
print(int("42"))      # 42
print(int(3.99))      # 3 — дробная часть отбрасывается, а не округляется
print(float(10))      # 10.0
print(str(100))       # 100 — это уже строка, но print выводит её без кавычек
print(bool(0))        # False
```

Если строка не является числом, Python выбрасывает `ValueError`:

```python
# int("abc")     # ValueError: invalid literal for int() with base 10: 'abc'
# float("12,5")  # ValueError: нужна точка, а не запятая
```

**Правило `bool()`:** «пустые» значения дают `False`, всё остальное — `True`:

```python
print(bool(0), bool(""), bool([]), bool(None))   # False False False False
print(bool(-5), bool("0"), bool([0]))            # True True True
```

> **⚠️ Важно:** строка `"0"` и список `[0]` — **непустые**, поэтому дают `True`. Подробнее о truthy/falsy — в уроке 9.

Более подробно о правилах преобразования, ловушках и ошибках — в [уроке 5](05-type-casting.html).

### Bool как число

`True` ведёт себя как `1`, `False` — как `0`:

```python
print(int(True))       # 1
print(int(False))      # 0
print(True + 5)        # 6
print(False * 10)      # 0
```

## Точность float

`float` хранит число в двоичном формате, поэтому часть десятичных дробей представляется приближённо:

```python
print(0.1 + 0.2)             # 0.30000000000000004
print(0.1 + 0.2 == 0.3)      # False!
```

Сравнивать дробные числа «в лоб» через `==` нельзя: используйте `math.isclose()` (модуль `math` — в уроке 8). А для красивого вывода — форматирование из урока 7.

## Изменяемые и неизменяемые типы

Одни типы можно изменять после создания (изменяемые), другие — нет (неизменяемые).

**Неизменяемые (immutable):** `int`, `float`, `str`, `bool`, `NoneType`, `tuple`.

**Изменяемые (mutable):** коллекции `list`, `dict`, `set` и другие — их изучим в следующих уроках.

```python
# Строки неизменяемы
s = "hello"
# s[0] = "H"  # TypeError: 'str' object does not support item assignment
s = "H" + s[1:]  # Нужно создать новую строку
print(s)         # Hello
```

## Итоги

- У каждого значения есть тип: `type()` возвращает его, `isinstance()` — проверяет принадлежность.
- `bool` — подкласс `int`: `True == 1`, `False == 0`.
- `int()` отбрасывает дробную часть (для отрицательных — в сторону нуля), а не округляет.
- Дробные числа хранятся приближённо: `0.1 + 0.2 != 0.3`.
- `str`, `int`, `float`, `bool`, `tuple` неизменяемы; `list`, `dict`, `set` — изменяемы.
