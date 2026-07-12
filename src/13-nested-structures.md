---
title: 'Вложенные структуры'
lesson: 13
description: 'Условия внутри условий'
badge: 'nested_navigator'
file: '13-nested-structures.html'
layout: 'layout.njk'
permalink: '13-nested-structures.html'
subtitle: 'Условия внутри условий, вложенные блоки'
---

## Вложенные условные операторы

if может находиться внутри другого if:

```python
age = 20
has_id = True

if age >= 18:
    print("Возраст подходит")
    if has_id:
        print("Вход разрешён")
    else:
        print("Нужно удостоверение личности")
else:
    print("Вход запрещён")
```

## Глубокое вложение

Избегайте слишком глубокого вложения (более 3-4 уровней):

```python
# Сложно читать:
if a:
    if b:
        if c:
  print("Все условия выполнены")

# Лучше:
if a and b and c:
    print("Все условия выполнены")
```

## Вложенные циклы (анонс)

Циклы тоже могут быть вложенными — один цикл внутри другого (подробнее в теме 18). Например, конструкция while может находиться внутри другого while:

```python
i = 1
while i <= 3:
    j = 1
    while j <= 2:
        print(f"i={i}, j={j}")
        j += 1
    i += 1
```
