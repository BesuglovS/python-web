---
title: "Списки"
lesson: 25
description: "list, методы списков"
duration: 15
complexity: "2"
badge: "list_master"
file: "25-lists.html"
layout: "layout.njk"
permalink: "25-lists.html"
subtitle: "list, методы списков"
prevUrl: "24-debugging.html"
prevTitle: "Отладка программ"
nextUrl: "26-sets.html"
nextTitle: "Множества"
---

## Создание списков

Список — упорядоченная изменяемая коллекция:

```python
# Пустой список
empty = []
empty = list()

# С элементами
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]
nested = [[1, 2], [3, 4]]  # список списков
```

## Индексация и срезы

Работает так же, как со строками:

```python
nums = [10, 20, 30, 40, 50]

print(nums[0])     # 10
print(nums[-1])    # 50
print(nums[1:4])   # [20, 30, 40]
print(nums[::-1])  # [50, 40, 30, 20, 10]

# В отличие от строк, списки можно изменять
nums[0] = 100
print(nums)  # [100, 20, 30, 40, 50]
```

## Методы списков

Основные методы для работы со списками:

```python
nums = [1, 2, 3]

nums.append(4)        # [1, 2, 3, 4] — добавить в конец
nums.extend([5, 6])   # [1, 2, 3, 4, 5, 6] — расширить
nums.insert(0, 0)     # [0, 1, 2, 3, 4, 5, 6] — вставить
nums.remove(3)        # [0, 1, 2, 4, 5, 6] — удалить по значению
popped = nums.pop()   # 6 — удалить и вернуть последний
popped = nums.pop(0)  # 0 — удалить и вернуть по индексу
nums.sort()           # сортировка
nums.reverse()        # разворот
print(nums.index(4))  # 2 — индекс элемента
print(nums.count(2))  # 1 — количество вхождений
```

[< Функции: продвинутые](24-debugging.html) [Далее: Множества →](26-sets.html)
