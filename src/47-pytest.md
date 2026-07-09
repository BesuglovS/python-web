---
title: "pytest"
lesson: 47
description: "assert, parametrize, проверка исключений"
duration: 12
complexity: "3"
badge: "test_master"
file: "47-pytest.html"
layout: "layout.njk"
permalink: "47-pytest.html"
subtitle: "Проверяем, что код работает правильно"
prevUrl: "46-type-hints.html"
prevTitle: "Type Hints"
nextUrl: "48-requests-api.html"
nextTitle: "Requests и API"
---

## Зачем нужны тесты?

Тесты автоматически проверяют, что ваш код работает правильно. Особенно важно при изменениях: тесты сразу покажут, если что-то сломалось.

## Установка и первый тест

```python
# Установка
pip install pytest

# Файл: mycode.py
def double(x):
    return x * 2

# Файл: test_mycode.py
from mycode import double

def test_double_positive():
    assert double(2) == 4

def test_double_zero():
    assert double(0) == 0

def test_double_negative():
    assert double(-3) == -6
```
```python
# Запуск тестов в терминале:
pytest test_mycode.py

# Результат:
# 3 passed in 0.01s
```

## Полезные проверки

```python
import pytest

def divide(a, b):
    if b == 0:
        raise ValueError("Деление на ноль!")
    return a / b

def test_divide_normal():
    assert divide(10, 2) == 5.0
    assert divide(7, 2) == 3.5

def test_divide_by_zero():
    with pytest.raises(ValueError):
        divide(10, 0)

def test_float_comparison():
    assert divide(1, 3) == pytest.approx(0.33333, rel=1e-3)
```

## Параметризованные тесты

```python
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 6),
    (-1, 5, -5),
    (0, 100, 0),
    (7, 7, 49),
])
def test_multiply(a, b, expected):
    assert a * b == expected
```
