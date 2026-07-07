---
title: "math и random"
lesson: 38
description: "Математика, случайные числа"
duration: 10
complexity: "2"
badge: "math_random"
file: "38-math-random.html"
layout: "layout.njk"
permalink: "38-math-random.html"
subtitle: "Математические вычисления и генерация случайных чисел"
prevUrl: "37-venv-pip.html"
prevTitle: "Виртуальные окружения и pip"
nextUrl: "39-datetime.html"
nextTitle: "Модуль datetime"
---

## Модуль math — математика в Python

Модуль `math` предоставляет доступ к основным математическим функциям и константам. Это стандартный модуль — устанавливать ничего не нужно.

```python
import math
```

## Константы

```python
import math

print(math.pi)   # 3.141592653589793 — число π
print(math.e)    # 2.718281828459045 — число Эйлера (e)
print(math.tau)  # 6.283185307179586 — τ = 2π
print(math.inf)  # бесконечность
print(math.nan)  # не число (Not a Number)
```

## Округление

<table><tbody><tr><th>Функция</th><th>Описание</th><th>Пример</th></tr><tr><td><code>ceil(x)</code></td><td>Округление вверх</td><td>math.ceil(3.1) → 4</td></tr><tr><td><code>floor(x)</code></td><td>Округление вниз</td><td>math.floor(3.9) → 3</td></tr><tr><td><code>trunc(x)</code></td><td>Отбрасывание дробной части</td><td>math.trunc(-3.9) → -3</td></tr></tbody></table>
```python
import math

print(math.ceil(3.1))    # 4
print(math.floor(3.9))   # 3
print(math.trunc(-3.9))  # -3
```

## Корни, степени, логарифмы

```python
import math

# Квадратный корень
print(math.sqrt(25))      # 5.0

# Возведение в степень (аналог **), но возвращает float
print(math.pow(2, 10))    # 1024.0

# Натуральный логарифм (по основанию e)
print(math.log(math.e))   # 1.0

# Логарифм по основанию 10
print(math.log10(100))    # 2.0

# Логарифм по основанию 2
print(math.log2(8))       # 3.0

# Экспонента: e^x
print(math.exp(2))        # 7.38905609893065
```

## Тригонометрия

**Важно:** все тригонометрические функции работают с **радианами**, а не с градусами!

```python
import math

# sin, cos, tan принимают угол в радианах
print(math.sin(math.pi / 2))   # 1.0 — синус 90°
print(math.cos(math.pi))       # -1.0 — косинус 180°
print(math.tan(0))             # 0.0 — тангенс 0°

# Конвертация градусы ↔ радианы
print(math.radians(180))       # 3.14159... — 180° в радианах
print(math.degrees(math.pi))   # 180.0 — π радиан в градусах

# Обратные тригонометрические функции
print(math.asin(1))            # 1.57079... — arcsin(1) = π/2
print(math.atan2(1, 1))        # 0.78539... — угол вектора (1, 1) в радианах

# Гипотенуза: sqrt(x² + y²)
print(math.hypot(3, 4))        # 5.0
```

## Модуль random — случайные числа

Модуль `random` генерирует псевдослучайные числа. Отлично подходит для игр, симуляций, случайного выбора.

```python
import random
```
> **⚠️ Важно:** **Важно:** для криптографических целей используйте модуль `secrets`, а не `random`. `random` не обеспечивает криптографическую стойкость.

## random.randint() и random.randrange()

```python
import random

# Случайное целое от a до b ВКЛЮЧИТЕЛЬНО
print(random.randint(1, 10))     # например, 7

# Случайное целое из range(start, stop, step)
print(random.randrange(0, 100, 5))  # например, 45 (одно из 0, 5, 10, ..., 95)

# Случайное число от 0.0 до 1.0 (не включая 1.0)
print(random.random())           # например, 0.723459...
```

## random.choice() и random.choices()

```python
import random

fruits = ['яблоко', 'банан', 'апельсин', 'груша']

# Случайный элемент из последовательности
print(random.choice(fruits))     # например, апельсин

# Несколько случайных элементов с возвращением (могут повторяться)
print(random.choices(fruits, k=3))  # ['яблоко', 'яблоко', 'груша']

# Несколько случайных элементов БЕЗ возвращения (без повторов)
print(random.sample(fruits, k=2))   # ['банан', 'груша']
```

## random.shuffle() — перемешивание

`shuffle` перемешивает список **на месте** (изменяет исходный список).

```python
import random

cards = ['A', 'K', 'Q', 'J', '10', '9']
random.shuffle(cards)
print(cards)  # ['Q', 'A', '9', 'K', '10', 'J'] — случайный порядок
```

## random.seed() — воспроизводимость

Для отладки или повторяемых экспериментов можно зафиксировать «зерно» генератора:

```python
import random

random.seed(42)
print(random.randint(1, 100))  # всегда 82

random.seed(42)
print(random.randint(1, 100))  # снова 82 — последовательность повторяется
```

## Практический пример: генератор паролей

```python
import random
import string

def generate_password(length=12):
    """Генерирует случайный пароль заданной длины."""
    chars = string.ascii_letters + string.digits + "!@#$%&*"
    password = ''.join(random.choices(chars, k=length))
    return password

print(generate_password(16))
# Пример вывода: aB3#xK9!mN2&qW5p
```

## Итоги

<table><tbody><tr><th>Модуль</th><th>Функция</th><th>Назначение</th></tr><tr><td>math</td><td><code>sqrt(x)</code></td><td>Квадратный корень</td></tr><tr><td>math</td><td><code>ceil/floor/trunc</code></td><td>Округление</td></tr><tr><td>math</td><td><code>sin/cos/tan</code></td><td>Тригонометрия (в радианах)</td></tr><tr><td>math</td><td><code>log/log10/log2</code></td><td>Логарифмы</td></tr><tr><td>math</td><td><code>pi, e, tau</code></td><td>Математические константы</td></tr><tr><td>random</td><td><code>randint(a, b)</code></td><td>Случайное целое [a, b]</td></tr><tr><td>random</td><td><code>choice(seq)</code></td><td>Случайный элемент</td></tr><tr><td>random</td><td><code>shuffle(list)</code></td><td>Перемешивание на месте</td></tr><tr><td>random</td><td><code>sample(seq, k)</code></td><td>k уникальных элементов</td></tr><tr><td>random</td><td><code>seed(n)</code></td><td>Фиксация зерна для повторяемости</td></tr></tbody></table>

[← venv и pip](37-venv-pip.html) [Далее: Дата и время →](39-datetime.html)
