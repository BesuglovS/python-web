---
title: 'Модули и import'
lesson: 35
description: 'import, from, as, стандартная библиотека'
badge: 'module_importer'
file: '35-modules-import.html'
layout: 'layout.njk'
permalink: '35-modules-import.html'
subtitle: 'Как подключать готовый код: import, from...import, псевдонимы, стандартная библиотека'
---

## Зачем нужны модули?

Модуль в Python — это просто файл с расширением `.py`, содержащий функции, классы и переменные. Вместо того чтобы писать весь код в одном файле, программисты разбивают программу на модули. Это делает код:

- **Переиспользуемым** — один модуль можно подключить в разных программах
- **Структурированным** — каждый модуль отвечает за свою часть логики
- **Поддерживаемым** — легче находить и исправлять ошибки

Python поставляется с огромной **стандартной библиотекой** — сотнями готовых модулей для работы с математикой, датами, файлами, сетью и многим другим.

## import — подключение модуля целиком

Самый простой способ — импортировать весь модуль. После этого ко всем его функциям нужно обращаться через префикс `имя_модуля.`:

```python
import math

print(math.sqrt(16))    # 4.0
print(math.pi)          # 3.141592653589793
print(math.factorial(5)) # 120
```

> **⚠️ Важно:** **Правило:** `import module` загружает модуль и создаёт пространство имён. Обращаться к содержимому нужно через точку: `module.function()`.

Это самый безопасный способ: вы всегда видите, из какого модуля взята функция, и избегаете конфликтов имён.

## from...import — импорт конкретных имён

Если вам нужна только одна функция или переменная, можно импортировать её напрямую. Тогда не нужно писать префикс модуля:

```python
from math import sqrt, pi

print(sqrt(25))  # 5.0
print(pi)        # 3.141592653589793
```

Можно импортировать сразу всё содержимое модуля через `*`:

```python
from math import *

print(sin(0))    # 0.0
print(cos(0))    # 1.0
print(e)         # 2.718281828459045
```

> **⚠️ Важно:** **Осторожно!** `from module import *` засоряет пространство имён. Вы можете случайно переопределить встроенную функцию или переменную. В production-коде так делать не рекомендуется.

## as — псевдонимы модулей

Если имя модуля длинное, или вы хотите избежать конфликта имён, используйте `as`:

```python
import numpy as np
import matplotlib.pyplot as plt
import itertools as it

arr = np.array([1, 2, 3])
print(arr)  # [1 2 3]

for combo in it.product('AB', repeat=2):
    print(combo)
```

Общепринятые сокращения:

<table><tbody><tr><th>Модуль</th><th>Псевдоним</th><th>Назначение</th></tr><tr><td>numpy</td><td>np</td><td>Научные вычисления</td></tr><tr><td>pandas</td><td>pd</td><td>Анализ данных</td></tr><tr><td>matplotlib.pyplot</td><td>plt</td><td>Графики</td></tr><tr><td>itertools</td><td>it</td><td>Комбинаторика</td></tr></tbody></table>

## Обзор стандартной библиотеки

Python поставляется с богатым набором модулей «из коробки». Вот самые полезные:

<table><tbody><tr><th>Модуль</th><th>Назначение</th><th>Пример использования</th></tr><tr><td><code>math</code></td><td>Математические функции</td><td>sqrt, sin, cos, log, pi, e</td></tr><tr><td><code>random</code></td><td>Генерация случайных чисел</td><td>randint, choice, shuffle, random</td></tr><tr><td><code>datetime</code></td><td>Дата и время</td><td>now(), timedelta, strftime</td></tr><tr><td><code>os</code></td><td>Операционная система</td><td>Работа с путями, переменные окружения</td></tr><tr><td><code>sys</code></td><td>Системные функции</td><td>argv, exit, path</td></tr><tr><td><code>json</code></td><td>Работа с JSON</td><td>loads, dumps, load, dump</td></tr><tr><td><code>re</code></td><td>Регулярные выражения</td><td>search, findall, sub</td></tr><tr><td><code>collections</code></td><td>Дополнительные структуры данных</td><td>Counter, defaultdict, deque</td></tr><tr><td><code>pathlib</code></td><td>Современная работа с путями</td><td>Path('.').glob('*.py')</td></tr><tr><td><code>time</code></td><td>Время и задержки</td><td>sleep, time_ns</td></tr></tbody></table>

## Создание собственного модуля

Любой `.py`\-файл может быть модулем. Создадим файл `utils.py`:

```python
# utils.py
def greet(name):
    """Приветствие."""
    return f"Привет, {name}!"

def add(a, b):
    """Сложение двух чисел."""
    return a + b

PI = 3.14159
```

Теперь используем его в другом файле (в той же папке):

```python
# main.py
import utils

print(utils.greet("Мир"))   # Привет, Мир!
print(utils.add(3, 5))      # 8
print(utils.PI)             # 3.14159
```

> **⚠️ Важно:** при импорте Python выполняет весь код модуля. Чтобы защитить исполняемый код от запуска при импорте, используйте конструкцию `if __name__ == '__main__':`.

```python
# utils.py с защитой от запуска при импорте
def greet(name):
    return f"Привет, {name}!"

if __name__ == '__main__':
    # Этот код выполнится только при прямом запуске utils.py
    print(greet("Тест"))
```

## Итоги

- `import module` — импорт всего модуля (безопасно, ясно)
- `from module import name` — импорт конкретной функции/переменной
- `from module import *` — импорт всего (не рекомендуется)
- `import module as alias` — короткий псевдоним
- Стандартная библиотека Python содержит сотни готовых модулей
- Свой модуль — это просто `.py`\-файл в той же папке (или в PYTHONPATH)
- `if __name__ == '__main__':` защищает код от выполнения при импорте
