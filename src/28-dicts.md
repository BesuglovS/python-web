---
title: 'Словари'
lesson: 28
description: 'dict, ключи и значения'
badge: 'dict_master'
file: '28-dicts.html'
layout: 'layout.njk'
permalink: '28-dicts.html'
subtitle: 'dict, ключи и значения, методы'
---

## Создание словаря

Словарь — упорядоченная коллекция пар ключ-значение (начиная с Python 3.7 порядок вставки сохраняется):

```python
# Через фигурные скобки
student = {
    "name": "Иван",
    "age": 20,
    "city": "Москва"
}

# Через функцию dict()
person = dict(name="Анна", age=25, city="СПб")

# Пустой словарь
empty = {}
empty = dict()
```

## Доступ к элементам

Получение и изменение значений:

```python
student = {"name": "Иван", "age": 20}

# Через ключ
print(student["name"])   # "Иван"

# Через get() — безопасно (не вызывает ошибку)
print(student.get("age"))     # 20
print(student.get("grade"))   # None
print(student.get("grade", "Нет"))  # "Нет" (значение по умолчанию)

# Изменение
student["age"] = 21
student["grade"] = 5  # добавление нового ключа
```

## Методы словарей

Основные методы:

```python
d = {"a": 1, "b": 2, "c": 3}

print(d.keys())    # dict_keys(['a', 'b', 'c'])
print(d.values())  # dict_values([1, 2, 3])
print(d.items())   # dict_items([('a', 1), ('b', 2), ('c', 3)])

# Обновление
d.update({"b": 20, "d": 4})  # {"a": 1, "b": 20, "c": 3, "d": 4}

# Удаление
val = d.pop("a")     # удаляет и возвращает значение
last = d.popitem()   # удаляет и возвращает последнюю пару
d.clear()            # очищает словарь

# Проверка наличия ключа
print("a" in d)  # True/False
```

## Перебор словаря

Итерация по словарю:

```python
d = {"a": 1, "b": 2, "c": 3}

# По ключам
for key in d:
    print(key, d[key])

# По парам
for key, value in d.items():
    print(f"{key}: {value}")

# Только значения
for value in d.values():
    print(value)
```

## Кортежи как ключи словарей

Ключи словаря должны быть **неизменяемыми**. Поэтому кортеж можно использовать в качестве ключа, а список — нельзя:

```python
coordinates = {
    (0, 0): "начало координат",
    (1, 2): "точка A",
}

print(coordinates[(0, 0)])  # "начало координат"
# coordinates[[1, 2]] = "x"  # Ошибка! TypeError — список изменяем, ключом быть не может
```

Однако ключом может быть только кортеж, содержащий неизменяемые элементы. Кортеж со списком внутри тоже не подойдёт:

```python
# {(1, [2, 3]): "x"}  # Ошибка! TypeError — список внутри кортежа изменяем
```
