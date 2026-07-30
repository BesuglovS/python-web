---
title: 'itertools'
lesson: 36
description: 'product, permutations, chain, groupby и другие функции'
badge: 'itertools_guru'
file: '36-itertools.html'
layout: 'layout.njk'
permalink: '36-itertools.html'
subtitle: 'product, permutations, combinations, cycle, chain, groupby — комбинаторные генераторы'
---

## Что такое itertools?

Модуль `itertools` — это встроенная библиотека Python, которая предоставляет быстрые и эффективные функции для работы с итераторами. Она особенно полезна для комбинаторных задач — перебора всех возможных комбинаций, перестановок, декартовых произведений.

> **💡 Про импорт:** Чтобы использовать любой модуль Python, его нужно подключить командой `import`. Например, `from itertools import product` берёт функцию `product` из модуля `itertools`. Подробно импорт разбирается в [предыдущем уроке](35-modules-import.html), а пока просто скопируйте команду импорта — это стандартная конструкция Python.

Эти функции часто встречаются в задачах **ЕГЭ по информатике**, а также в олимпиадном программировании. Вместо того чтобы писать вложенные циклы вручную, можно использовать готовые функции из itertools.

Подключается модуль одной строкой:

```python
from itertools import product, permutations, combinations
```

Если нужны все функции сразу, можно импортировать весь модуль:

```python
import itertools
```

> **⚠️ Важно:** все функции itertools возвращают **итераторы**, а не списки. Чтобы получить список, нужно обернуть вызов в `list()`. Итераторы экономят память, но пройти по ним можно только один раз.

## product() — декартово произведение

Функция `product(*iterables, repeat=1)` возвращает декартово произведение переданных итерируемых объектов. Проще говоря — она порождает все возможные комбинации, где каждый элемент берётся из соответствующего списка.

**Разбор ЕГЭ:** именно с помощью `product` удобно перебирать все возможные строки длины `n` из заданного алфавита.

### Пример: все двузначные числа из цифр 1, 2, 3

```python
from itertools import product

digits = [1, 2, 3]
for combo in product(digits, repeat=2):
    print(combo)

# (1, 1)
# (1, 2)
# (1, 3)
# (2, 1)
# (2, 2)
# (2, 3)
# (3, 1)
# (3, 2)
# (3, 3)
```

Параметр `repeat=2` означает, что мы берём декартово произведение списка `digits` самого на себя 2 раза. Всего получаем 3² = 9 комбинаций.

### Пример: составление кода из букв и цифр

Пусть код состоит из 3 символов: первый — буква A, B или C, второй — цифра 1 или 2, третий — буква X или Y:

```python
from itertools import product

letters = ['A', 'B', 'C']
digits = [1, 2]
ends = ['X', 'Y']

for code in product(letters, digits, ends):
    print(''.join(map(str, code)))

# A1X  A1Y  A2X  A2Y  B1X  B1Y  B2X  B2Y  C1X  C1Y  C2X  C2Y
```

Всего 3 × 2 × 2 = 12 вариантов. `product` сам построит все комбинации, без вложенных циклов.

## permutations() — все перестановки

Функция `permutations(iterable, r=None)` генерирует все **упорядоченные** подмножества длины `r` из элементов переданной последовательности. Порядок элементов **важен**. Если `r` не указан, берётся длина всей последовательности.

Количество перестановок: P(n, r) = n! / (n − r)!

### Пример: перестановки из трёх букв

```python
from itertools import permutations

for p in permutations('ABC', 2):
    print(''.join(p))

# AB  AC  BA  BC  CA  CB
```

Всего 3! / (3−2)! = 6 вариантов. Порядок важен: AB и BA — разные комбинации.

### Пример: рассадка 4 человек на 2 места

```python
from itertools import permutations

people = ['Анна', 'Борис', 'Вика', 'Глеб']
for perm in permutations(people, 2):
    print(f'{perm[0]} и {perm[1]}')

# Всего 4 × 3 = 12 вариантов
```

## combinations() — сочетания

Функция `combinations(iterable, r)` генерирует все **неупорядоченные** подмножества длины `r`. Порядок элементов **не важен** — комбинации (A, B) и (B, A) считаются одинаковыми.

Количество сочетаний: C(n, r) = n! / (r! (n − r)!)

```python
from itertools import combinations

for c in combinations('ABCD', 2):
    print(''.join(c))

# AB  AC  AD  BC  BD  CD
```

Всего C(4, 2) = 6 вариантов. Обратите внимание: AB есть, а BA — нет, потому что порядок не важен.

### Пример: выбор 3 учеников из 5

```python
from itertools import combinations

students = ['Анна', 'Борис', 'Вика', 'Глеб', 'Дима']
for team in combinations(students, 3):
    print(', '.join(team))

# Всего C(5, 3) = 10 вариантов
```

> **⚠️ Важно:** запомните разницу:

- `permutations` — порядок важен; (1,2) ≠ (2,1)
- `combinations` — порядок не важен; (1,2) = (2,1)
- `product` — элементы могут повторяться; каждый выбирается независимо

## combinations\_with\_replacement()

Эта функция похожа на `combinations`, но допускает **повторение** элементов. То есть один и тот же элемент может быть выбран несколько раз.

```python
from itertools import combinations_with_replacement

for c in combinations_with_replacement('ABC', 2):
    print(''.join(c))

# AA  AB  AC  BB  BC  CC
```

В обычных `combinations` не было бы AA, BB, CC. Всего C(n + r − 1, r) = C(3+2−1, 2) = C(4, 2) = 6 комбинаций.

## chain() — цепочка итераторов

`chain(*iterables)` последовательно перебирает элементы из нескольких итераторов, как если бы они были одним.

```python
from itertools import chain

list1 = [1, 2, 3]
list2 = ['a', 'b', 'c']
result = list(chain(list1, list2))
print(result)  # [1, 2, 3, 'a', 'b', 'c']
```

Это удобно, когда нужно объединить несколько последовательностей без создания нового списка.

## cycle() — бесконечный цикл

`cycle(iterable)` бесконечно повторяет элементы переданной последовательности. Используйте с осторожностью — без break цикл будет выполняться вечно.

```python
from itertools import cycle

colors = ['красный', 'синий', 'зелёный']
counter = 0
for color in cycle(colors):
    print(color)
    counter += 1
    if counter >= 5:
        break

# красный  синий  зелёный  красный  синий
```

`cycle` удобен при распределении задач между элементами по кругу (round-robin).

## groupby() — группировка

`groupby(iterable, key=None)` группирует последовательные одинаковые элементы. Важное условие: перед группировкой данные должны быть **отсортированы** по тому же ключу, по которому делается группировка.

```python
from itertools import groupby

data = ['aa', 'ab', 'aa', 'aa', 'bc', 'bc', 'cd']
data.sort()  # обязательно сортируем!
for key, group in groupby(data):
    print(f'{key}: {list(group)}')

# 'aa': ['aa', 'aa', 'aa']
# 'ab': ['ab']
# 'bc': ['bc', 'bc']
# 'cd': ['cd']
```

Каждая группа — это итератор, поэтому перед использованием его нужно преобразовать в список.

## Другие полезные функции

<table class="exceptions-table"><thead><tr><th>Функция</th><th>Описание</th></tr></thead><tbody><tr><td><code>count(start, step)</code></td><td>Бесконечный счётчик (start, start+step, start+2*step …)</td></tr><tr><td><code>repeat(x, times)</code></td><td>Повторяет элемент x указанное число раз</td></tr><tr><td><code>accumulate(iterable)</code></td><td>Накопленные суммы (или результаты другой бинарной операции)</td></tr><tr><td><code>compress(data, selectors)</code></td><td>Фильтрует data, оставляя элементы, где selectors истинен</td></tr><tr><td><code>dropwhile(predicate, iterable)</code></td><td>Пропускает элементы, пока истинен предикат, затем возвращает остальные</td></tr><tr><td><code>takewhile(predicate, iterable)</code></td><td>Возвращает элементы, пока истинен предикат, затем останавливается</td></tr><tr><td><code>zip_longest(*iterables)</code></td><td>Аналог zip(), но заполняет недостающие элементы fillvalue</td></tr><tr><td><code>tee(iterable, n)</code></td><td>Создаёт n независимых копий итератора</td></tr></tbody></table>

## Сравнение: itertools vs вложенные циклы

Часто функции itertools позволяют заменить вложенные циклы одной строкой. Сравните:

### Перебор всех пар (i, j) для i, j от 1 до 3

Вложенные циклы:

```python
pairs = []
for i in range(1, 4):
    for j in range(1, 4):
        pairs.append((i, j))

# [(1,1), (1,2), (1,3), (2,1), (2,2), (2,3), (3,1), (3,2), (3,3)]
```

С itertools:

```python
from itertools import product
pairs = list(product(range(1, 4), repeat=2))
```

Чем больше уровней вложенности, тем выигрышнее выглядит itertools. А для комбинаторных задач (перестановки, сочетания) itertools — вообще единственный разумный способ.

## Резюме

- `product(iter1, iter2, ..., repeat=n)` — декартово произведение, все комбинации с повторением
- `permutations(iterable, r)` — все упорядоченные размещения (порядок важен)
- `combinations(iterable, r)` — все неупорядоченные сочетания (порядок не важен, без повторов)
- `combinations_with_replacement(iterable, r)` — сочетания с повторениями
- `chain(*iterables)` — объединение нескольких итераторов в один
- `cycle(iterable)` — бесконечное повторение элементов
- `groupby(iterable, key)` — группировка последовательных элементов
- Все функции возвращают **итераторы** — используйте `list()` для преобразования в список
- Модуль `itertools` — мощный инструмент для решения комбинаторных задач и задач ЕГЭ

> **💡 Совет:** потренируйтесь вручную посчитать количество комбинаций для разных значений, а потом проверьте себя с помощью itertools. Это поможет лучше понять комбинаторику и сэкономит время на экзамене.
