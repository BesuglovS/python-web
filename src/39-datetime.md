---
title: 'datetime'
lesson: 39
description: 'Даты, время, timedelta'
badge: 'time_traveler'
file: '39-datetime.html'
layout: 'layout.njk'
permalink: '39-datetime.html'
subtitle: 'Работа с датами и временем: сейчас, завтра, через неделю, в любом формате'
---

## Зачем нужен datetime?

Модуль `datetime` — основной инструмент Python для работы с датами и временем. Он входит в стандартную библиотеку и позволяет:

- Получать текущую дату и время
- Форматировать даты в любом виде
- Разбирать даты из строк
- Вычислять разницу между датами
- Работать с часовыми поясами (через `zoneinfo` в Python 3.9+)

## Основные классы модуля datetime

<table><tbody><tr><th>Класс</th><th>Что хранит</th><th>Пример</th></tr><tr><td><code>date</code></td><td>Год, месяц, день</td><td>2026-06-23</td></tr><tr><td><code>time</code></td><td>Часы, минуты, секунды</td><td>14:30:00</td></tr><tr><td><code>datetime</code></td><td>Дата + время</td><td>2026-06-23 14:30:00</td></tr><tr><td><code>timedelta</code></td><td>Разница между датами</td><td>3 дня, 5 часов</td></tr></tbody></table>
```python
from datetime import date, time, datetime, timedelta
```

## Получение текущей даты и времени

```python
from datetime import date, datetime

# Только сегодняшняя дата
today = date.today()
print(today)  # 2026-06-23

# Текущие дата и время
now = datetime.now()
print(now)    # 2026-06-23 14:30:15.123456

# Отдельные компоненты
print(now.year)    # 2026
print(now.month)   # 6
print(now.day)     # 23
print(now.hour)    # 14
print(now.minute)  # 30
print(now.second)  # 15
print(now.weekday())  # 1 (понедельник = 0, вторник = 1, ..., воскресенье = 6)
```

## Создание конкретной даты

```python
from datetime import date, datetime, time

# Конкретная дата
d = date(2026, 12, 31)
print(d)  # 2026-12-31

# Дата и время
dt = datetime(2026, 6, 15, 18, 30, 0)
print(dt)  # 2026-06-15 18:30:00

# Только время
t = time(14, 30, 0)
print(t)   # 14:30:00
```

## strftime() — форматирование даты в строку

`strftime` (string format time) преобразует дату в строку по шаблону.

<table><tbody><tr><th>Код</th><th>Значение</th><th>Пример</th></tr><tr><td><code>%Y</code></td><td>Год (4 цифры)</td><td>2026</td></tr><tr><td><code>%m</code></td><td>Месяц (01-12)</td><td>06</td></tr><tr><td><code>%d</code></td><td>День (01-31)</td><td>23</td></tr><tr><td><code>%H</code></td><td>Часы (00-23)</td><td>14</td></tr><tr><td><code>%M</code></td><td>Минуты (00-59)</td><td>30</td></tr><tr><td><code>%S</code></td><td>Секунды (00-59)</td><td>15</td></tr><tr><td><code>%A</code></td><td>День недели (полный)</td><td>Tuesday</td></tr><tr><td><code>%a</code></td><td>День недели (сокр.)</td><td>Tue</td></tr><tr><td><code>%B</code></td><td>Месяц (полный)</td><td>June</td></tr><tr><td><code>%b</code></td><td>Месяц (сокр.)</td><td>Jun</td></tr></tbody></table>
```python
from datetime import datetime

now = datetime.now()

print(now.strftime("%d.%m.%Y")) # 23.06.2026
print(now.strftime("%H:%M:%S")) # 14:30:15
print(now.strftime("%d %B %Y года, %A")) # 23 June 2026 года, Tuesday
print(now.strftime("%Y-%m-%d %H:%M")) # 2026-06-23 14:30 (ISO-формат)

```

## strptime() — разбор строки в дату

`strptime` (string parse time) — обратная операция: превращает строку в объект даты.

```python
from datetime import datetime

# Разбор строки в дату
date_str = "23.06.2026"
d = datetime.strptime(date_str, "%d.%m.%Y")
print(d)  # 2026-06-23 00:00:00

# Разбор строки с временем
dt_str = "2026-06-23 14:30:00"
dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
print(dt)  # 2026-06-23 14:30:00

# Разбор нестандартного формата
dt2 = datetime.strptime("23 June 2026, 2:30 PM", "%d %B %Y, %I:%M %p")
print(dt2)  # 2026-06-23 14:30:00
```

## timedelta — разница между датами

`timedelta` представляет промежуток времени. Можно прибавлять и вычитать из дат.

```python
from datetime import datetime, timedelta

now = datetime.now()

# Создание промежутка
one_day = timedelta(days=1)
one_week = timedelta(weeks=1)
three_hours = timedelta(hours=3)
complex_delta = timedelta(days=2, hours=5, minutes=30)

# Арифметика с датами
tomorrow = now + one_day
yesterday = now - one_day
next_week = now + one_week

print(f"Сегодня: {now.date()}")
print(f"Завтра:  {tomorrow.date()}")
print(f"Вчера:   {yesterday.date()}")

# Разница между датами
deadline = datetime(2026, 12, 31)
delta = deadline - now
print(f"До Нового года осталось {delta.days} дней")
print(f"Или {delta.total_seconds() / 3600:.1f} часов")
```

## Практический пример: калькулятор возраста

```python
from datetime import datetime, date

def calculate_age(birth_date_str):
    """Считает возраст по дате рождения (формат ДД.ММ.ГГГГ)."""
    birth = datetime.strptime(birth_date_str, "%d.%m.%Y")
    today = date.today()

    age = today.year - birth.year
    # Проверяем, был ли день рождения в этом году
    if today.month < birth.month or (today.month == birth.month and today.day < birth.day):
        age -= 1

    return age

print(f"Возраст: {calculate_age('15.05.1995')} лет")
# Пример: Возраст: 31 год
```

## Итоги

- `datetime.now()` — текущие дата и время
- `date.today()` — только сегодняшняя дата
- `strftime(шаблон)` — дата → строка по формату
- `strptime(строка, шаблон)` — строка → дата
- `timedelta` — разница между датами, арифметика с датами
- Коды форматирования: `%Y %m %d %H %M %S` — основа
- `.weekday()` — день недели (0 = понедельник)
