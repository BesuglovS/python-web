---
title: "Type Hints"
lesson: 46
description: "Аннотации типов, mypy"
duration: 10
complexity: "2"
badge: "type_hinter"
file: "46-type-hints.html"
layout: "layout.njk"
permalink: "46-type-hints.html"
subtitle: "Улучшаем читаемость кода с помощью аннотаций типов"
prevUrl: "45-threading-async.html"
prevTitle: "Многопоточность и asyncio"
nextUrl: "47-pytest.html"
nextTitle: "Unit-тесты с pytest"
---

## Что такое type hints?

Аннотации типов — способ указать, какого типа аргументы ожидает функция и что она возвращает. Python **не проверяет** типы во время выполнения, но IDE и линтеры используют их для подсказок.

```python
# Без аннотаций
def greet(name, age):
    return f"{name}, {age} лет"

# С аннотациями (type hints)
def greet(name: str, age: int) -> str:
    return f"{name}, {age} лет"
```

## Основные типы

```python
def process(
    name: str,           # строка
    age: int,            # целое число
    score: float,        # число с плавающей точкой
    active: bool         # логическое значение
) -> str:                # возвращает строку
    return f"{name}: {age} лет, балл {score}, активен: {active}"

# Переменные тоже можно аннотировать
x: int = 42
names: list[str] = ["Анна", "Борис"]
data: dict[str, int] = {"x": 10, "y": 20}
```

## Сложные типы

```python
from typing import List, Dict, Tuple, Optional, Union

# Список строк
def get_names() -> List[str]:
    return ["Анна", "Борис"]

# Словарь: строки → числа
def get_grades() -> Dict[str, int]:
    return {"Анна": 95, "Борис": 82}

# Кортеж из трёх элементов
def get_point() -> Tuple[int, int, int]:
    return (10, 20, 30)

# Опциональное значение (может быть None)
def find_user(id: int) -> Optional[str]:
    if id == 1:
        return "Анна"
    return None

# Один из нескольких типов
def process(value: Union[int, str]) -> str:
    return str(value)
```

## Практическая ценность

-   IDE (VS Code, PyCharm) показывает автодополнение и предупреждения
-   Код становится самодокументированным
-   Инструменты типа `mypy` находят ошибки до запуска

```python
# mypy найдёт ошибку:
def double(x: int) -> int:
    return x * 2

double("hello")  # mypy: error: Argument 1 to "double" has incompatible type "str"
```

[← Многопоточность и asyncio](45-threading-async.html) [Далее: pytest →](47-pytest.html)
