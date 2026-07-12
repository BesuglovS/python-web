---
title: 'Отладка'
lesson: 24
description: 'pdb, print-отладка, assert, логирование'
badge: 'debugger'
file: '24-debugging.html'
layout: 'layout.njk'
permalink: '24-debugging.html'
subtitle: 'print(), pdb, логирование — как находить и исправлять ошибки в коде'
---

## Зачем нужна отладка?

Даже опытные программисты пишут код с ошибками. Умение быстро находить и исправлять ошибки — один из важнейших навыков разработчика.

> **💡 Совет:** **Виды ошибок:**

- **Синтаксические** — пропущенные скобки, двоеточия, неверные отступы
- **Логические** — программа работает, но выдаёт неверный результат
- **Исключения (runtime)** — ошибки во время выполнения: деление на ноль, неверный тип данных

## Отладка с помощью print()

Самый простой и часто используемый способ — вывод промежуточных значений:

```python
def calculate_total(prices, discount):
    print(f"DEBUG: prices = {prices}")        # смотрим входные данные
    total = sum(prices)
    print(f"DEBUG: total = {total}")           # промежуточный результат
    final = total * (1 - discount)
    print(f"DEBUG: final = {final}")           # итог
    return final

result = calculate_total([100, 200, 300], 0.1)
print(f"Результат: {result}")
```

> **💡 Совет:** используйте префикс `DEBUG:` или `>>>`, чтобы легко отличить отладочный вывод от основного и быстро удалить его потом.

## f-строки для отладки (Python 3.8+)

Специальный синтаксис `{var=}` выводит имя переменной и её значение:

```python
name = "Анна"
age = 25
print(f"{name=} {age=}")   # name='Анна' age=25

x = 10
y = 20
print(f"{x + y = }")       # x + y = 30
```

## Встроенный отладчик pdb

Python включает интерактивный отладчик `pdb`. Он позволяет выполнять код по шагам, просматривать значения переменных и находить ошибки.

```python
import pdb

def buggy_function(a, b):
    result = a / b
    return result

# Устанавливаем точку останова
pdb.set_trace()  # выполнение остановится здесь
x = 10
y = 0
print(buggy_function(x, y))
```

Основные команды pdb:

<table><tbody><tr><th>Команда</th><th>Действие</th></tr><tr><td><code>n</code> (next)</td><td>Выполнить следующую строку</td></tr><tr><td><code>s</code> (step)</td><td>Зайти внутрь функции</td></tr><tr><td><code>c</code> (continue)</td><td>Продолжить выполнение</td></tr><tr><td><code>p переменная</code></td><td>Вывести значение переменной</td></tr><tr><td><code>l</code> (list)</td><td>Показать текущий участок кода</td></tr><tr><td><code>q</code> (quit)</td><td>Выйти из отладчика</td></tr></tbody></table>

## Модуль logging

`logging` — более продвинутый способ отслеживания работы программы. В отличие от `print()`, позволяет настраивать уровни важности сообщений и выводить их в файл.

```python
import logging

# Настройка: уровень INFO и выше, запись в файл
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    filename='app.log'
)

def divide(a, b):
    logging.info(f"divide({a}, {b}) вызвана")
    if b == 0:
        logging.error("Деление на ноль!")
        return None
    result = a / b
    logging.debug(f"Результат: {result}")
    return result

print(divide(10, 2))   # 5.0
print(divide(10, 0))   # None
```

Уровни логирования (по возрастанию):

- `DEBUG` — подробная отладочная информация
- `INFO` — общая информация о работе программы
- `WARNING` — предупреждения
- `ERROR` — ошибки
- `CRITICAL` — критические ошибки

## Горячие клавиши отладки в IDE

Каждая среда разработки предоставляет горячие клавиши для отладки. Вот основные:

<table><tbody><tr><th>Действие</th><th>IDLE</th><th>VS Code</th><th>PyCharm</th></tr><tr><td>Точка останова (breakpoint)</td><td>—</td><td><code>F9</code></td><td>Клик на номер строки</td></tr><tr><td>Запуск отладки</td><td>—</td><td><code>F5</code></td><td><code>Shift+F9</code></td></tr><tr><td>Следующая строка (Step Over)</td><td>—</td><td><code>F10</code></td><td><code>F8</code></td></tr><tr><td>Зайти внутрь (Step Into)</td><td>—</td><td><code>F11</code></td><td><code>F7</code></td></tr><tr><td>Выйти из функции (Step Out)</td><td>—</td><td><code>Shift+F11</code></td><td><code>Shift+F8</code></td></tr><tr><td>Продолжить до следующей точки (Continue)</td><td>—</td><td><code>F5</code></td><td><code>F9</code></td></tr><tr><td>Запуск файла</td><td><code>F5</code></td><td><code>Ctrl+F5</code> / кнопка ▶</td><td><code>Shift+F10</code></td></tr><tr><td>Остановка выполнения</td><td><code>Ctrl+C</code></td><td><code>Shift+F5</code></td><td><code>Ctrl+F2</code></td></tr><tr><td>Перезапуск</td><td><code>F5</code></td><td><code>Ctrl+Shift+F5</code></td><td><code>Ctrl+F5</code></td></tr></tbody></table>

> **💡 Совет:** IDLE — простая среда без встроенного отладчика. Для пошаговой отладки используйте VS Code или PyCharm.

## Практические советы

- **Читайте сообщения об ошибках внимательно** — Python указывает файл, строку и тип ошибки
- **Проверяйте входные данные** — ошибка часто не там, где программа упала, а там, откуда пришли некорректные данные
- **Упрощайте** — если не можете найти ошибку в большом коде, выделите проблемный участок и проверьте его отдельно
- **Используйте метод резиновой уточки (rubber duck)** — объясняя код вслух, вы часто сами находите ошибку
- **Git** — делайте коммиты после каждой работающей версии, чтобы можно было откатиться
