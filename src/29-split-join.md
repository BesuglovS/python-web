---
title: "split() и join()"
lesson: 29
description: "Разделение и объединение строк"
duration: 8
complexity: "2"
badge: "string_splitter"
file: "29-split-join.html"
layout: "layout.njk"
permalink: "29-split-join.html"
subtitle: "Разделение и объединение строк"
prevUrl: "28-dicts.html"
prevTitle: "Словари"
nextUrl: "30-list-comprehensions.html"
nextTitle: "Списочные выражения"
---

## split() — разделение строки

split() разбивает строку на список подстрок:

```python
text = "яблоко банан вишня"
words = text.split()
print(words)  # ["яблоко", "банан", "вишня"]

# С указанием разделителя
csv = "1,2,3,4,5"
nums = csv.split(",")
print(nums)  # ["1", "2", "3", "4", "5"]

# Ограничение количества разбиений
data = "a-b-c-d"
print(data.split("-", 2))  # ["a", "b", "c-d"]
```

## join() — объединение в строку

join() объединяет список строк через разделитель:

```python
words = ["Python", "это", "здорово"]
sentence = " ".join(words)
print(sentence)  # "Python это здорово"

# Другие разделители
print("-".join(["1", "2", "3"]))  # "1-2-3"
print(", ".join(["a", "b", "c"]))  # "a, b, c"

# join() работает только со строками!
nums = [1, 2, 3]
# ", ".join(nums)  # Ошибка!
print(", ".join(map(str, nums)))  # "1, 2, 3"
```

## Практический пример

Парсинг и форматирование данных:

```python
data = "Иван,25,Москва"
fields = data.split(",")
name, age, city = fields
print(f"{name} из {city}, возраст {age}")

# Обратно в строку
new_data = ";".join(fields)
print(new_data)  # "Иван;25;Москва"
```

[< Словари (dict)](28-dicts.html) [Далее: Списочные выражения →](30-list-comprehensions.html)
