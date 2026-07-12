---
title: 'JSON и CSV'
lesson: 33
description: 'json.dump/load, csv.reader/writer'
badge: 'data_formatter'
file: '33-json-csv.html'
layout: 'layout.njk'
permalink: '33-json-csv.html'
subtitle: 'Чтение и запись структурированных данных в популярных форматах'
---

## JSON — JavaScript Object Notation

JSON — самый популярный формат обмена данными. В Python данные преобразуются между объектами Python и JSON-строками:

<table><tbody><tr><th>Python</th><th>JSON</th></tr><tr><td><code>dict</code></td><td>object</td></tr><tr><td><code>list</code>, <code>tuple</code></td><td>array</td></tr><tr><td><code>str</code></td><td>string</td></tr><tr><td><code>int</code>, <code>float</code></td><td>number</td></tr><tr><td><code>True</code>, <code>False</code></td><td><code>true</code>, <code>false</code></td></tr><tr><td><code>None</code></td><td><code>null</code></td></tr></tbody></table>

## Чтение JSON из файла

```python
import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["name"])          # доступ как к обычному словарю
print(data["hobbies"][0])    # доступ к спискам внутри
```

Пример содержимого `data.json`:

<!-- norun -->

```python
{
    "name": "Максим",
    "age": 25,
    "hobbies": ["Python", "шахматы", "бег"],
    "active": true
}
```

## Запись в JSON

```python
import json

data = {
    "name": "Максим",
    "age": 25,
    "hobbies": ["Python", "шахматы", "бег"],
    "active": True
}

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Файл сохранён!")
```

> **💡 Совет:** **Параметры `json.dump()`:**  
> `ensure_ascii=False` — сохраняет кириллицу как есть  
> `indent=4` — красивое форматирование с отступами

## JSON-строка ↔ Python-объект

```python
import json

# Из строки JSON в Python
json_str = '{"name": "Анна", "score": 95}'
data = json.loads(json_str)
print(data["name"])          # Анна
print(type(data))            #

# Из Python в строку JSON
person = {"name": "Борис", "age": 30}
json_str = json.dumps(person, ensure_ascii=False)
print(json_str)              # {"name": "Борис", "age": 30}
```

`load`/`dump` — работа с **файлами** (`f` — file)  
`loads`/`dumps` — работа со **строками** (`s` — string)

## CSV — Comma-Separated Values

CSV — простой текстовый формат для табличных данных (строки и столбцы). Отлично открывается в Excel.

Пример `students.csv`:

<!-- norun -->

```python
name,age,grade
Анна,20,5
Борис,21,4
Вика,19,5
```

## Чтение CSV

```python
import csv

with open("students.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['name']}: {row['age']} лет, оценка {row['grade']}")

# Вывод:
# Анна: 20 лет, оценка 5
# Борис: 21 лет, оценка 4
# Вика: 19 лет, оценка 5
```

`DictReader` читает каждую строку как словарь, где ключи — названия столбцов.

## Запись CSV

```python
import csv

data = [
    {"name": "Анна", "age": 20, "grade": 5},
    {"name": "Борис", "age": 21, "grade": 4},
    {"name": "Вика", "age": 19, "grade": 5},
]

with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "age", "grade"])
    writer.writeheader()      # записать заголовки столбцов
    writer.writerows(data)    # записать все строки

print("CSV сохранён!")
```

> **💡 Совет:** **Важно:** всегда указывайте `newline=""` при открытии CSV-файлов на Windows — иначе появятся лишние пустые строки.

## Практический пример: конвертер JSON → CSV

```python
import json, csv

# Читаем список пользователей из JSON
with open("users.json", "r", encoding="utf-8") as f:
    users = json.load(f)

# Сохраняем в CSV (только нужные поля)
with open("users.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "email", "age"])
    writer.writeheader()
    for user in users:
        writer.writerow({
  "name": user["name"],
  "email": user["email"],
  "age": user["age"]
        })

print("Конвертация завершена!")
```
