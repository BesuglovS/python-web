---
title: 'Операции над строками'
lesson: 15
description: 'Конкатенация, умножение, методы'
duration: 10
complexity: '2'
badge: 'string_master'
file: '15-string-ops.html'
layout: 'layout.njk'
permalink: '15-string-ops.html'
subtitle: 'Конкатенация, умножение, методы строк, форматирование'
prevUrl: '14-strings-index-slice.html'
prevTitle: 'Строки: индексация и срезы'
nextUrl: '16-regex.html'
nextTitle: 'Регулярные выражения'
---

## Конкатенация и умножение

Строки можно складывать (конкатенация) и умножать на число:

```python
hello = "Привет" + ", " + "мир!"   # "Привет, мир!"
repeated = "Ha" * 3                # "HaHaHa"
line = "-" * 20                    # "--------------------"
```

## Экранирование символов

Обратный слеш \\ позволяет вставлять специальные символы:

```python
text = "Он сказал: \"Привет\""
path = "C:\\Users\\Name"
newline = "Строка1\nСтрока2"
tab = "Колонка1\tКолонка2"
```

## f-строки (f-strings)

Современный способ встраивать переменные и выражения прямо в строку. Ставится буква `f` перед кавычками, а внутри `{}` — код Python:

```python
name = "Анна"
age = 17
print(f"Меня зовут {name}, мне {age} лет.")
# Меня зовут Анна, мне 17 лет.

# Внутри фигурных скобок можно писать выражения:
print(f"Через год будет {age + 1}.")
# Через год будет 18.

# Можно указывать ширину поля и выравнивание:
price = 12.5
print(f"Цена: {price:>10.2f} руб.")   # "Цена:      12.50 руб."
```

## Сырые строки (raw strings)

Если перед кавычками поставить `r`, обратный слеш не экранируется — строка остаётся «как есть». Удобно для путей и регулярных выражений:

```python
path = r"C:\Users\Name\Documents"
print(path)   # C:\Users\Name\Documents

# Без r пришлось бы писать "C:\\Users\\Name\\Documents"
```

## Многострочные строки (triple quotes)

Тройные кавычки `"""` или `'''` позволяют писать текст на нескольких строках:

```python
text = """Это многострочная
строка. Она сохраняет
переносы строк."""

print(text)
# Это многострочная
# строка. Она сохраняет
# переносы строк.
```

## Основные методы строк

Строки в Python имеют множество встроенных методов. Все методы возвращают **новую** строку — исходная не меняется:

```python
s = "  Hello, World!  "
print(s.upper())                # "  HELLO, WORLD!  "
print(s.lower())                # "  hello, world!  "
print(s.strip())                # "Hello, World!"
print(s.replace("World", "Python"))  # "  Hello, Python!  "
print(s.find("World"))          # 8 (индекс начала подстроки)
print(len(s))                   # 18 (длина строки)
```

## Методы изменения регистра

```python
word = "python programming"

print(word.capitalize())   # "Python programming" (первая буква заглавная)
print(word.title())        # "Python Programming" (каждое слово с заглавной)
print(word.swapcase())     # "PYTHON PROGRAMMING" (меняет регистр на обратный)

# upper() / lower() — перевод в верхний / нижний регистр
print(word.upper())        # "PYTHON PROGRAMMING"
print(word.lower())        # "python programming"
```

## Методы проверки символов

Возвращают `True` или `False`:

```python
print("123".isdigit())      # True  — только цифры
print("abc".isalpha())      # True  — только буквы
print("abc123".isalnum())   # True  — только буквы и цифры
print("   ".isspace())      # True  — только пробельные символы
print("Hello".isupper())    # False — не все буквы заглавные
print("HELLO".isupper())    # True
print("hello".islower())    # True
print("Hello World".istitle())  # True — каждое слово с заглавной
```

## Методы поиска и подсчёта

```python
text = "раз два раз два раз"

print(text.count("раз"))        # 3 — сколько раз встречается подстрока
print(text.startswith("раз"))   # True — начинается ли с подстроки
print(text.endswith("два"))     # True — заканчивается ли подстрокой

# find — ищет слева, возвращает индекс или -1
print(text.find("два"))         # 4
print(text.find("три"))         # -1 (не найдено)

# rfind — ищет справа
print(text.rfind("два"))        # 12

# index — как find, но вызывает ошибку, если не найдено
print(text.index("два"))        # 4
# print(text.index("три"))      # ValueError!
```

## Разделение и объединение строк

```python
# split() — разбивает строку на список по разделителю
csv = "яблоко,груша,банан"
fruits = csv.split(",")
print(fruits)                   # ['яблоко', 'груша', 'банан']

# split() без аргумента — разбивает по пробелам
words = "Привет   мир!".split()
print(words)                    # ['Привет', 'мир!']

# join() — объединяет список в строку через разделитель
joined = ", ".join(fruits)
print(joined)                   # "яблоко, груша, банан"

# partition() — делит строку на три части (до, разделитель, после)
phone = "+7-123-456-78-90"
print(phone.partition("-"))     # ('+7', '-', '123-456-78-90')
print(phone.rpartition("-"))    # ('+7-123-456-78', '-', '90')
```

## Удаление пробелов

```python
s = "  \tтекст\n  "

print(s.strip())    # "текст"       — удаляет пробелы с обоих концов
print(s.lstrip())   # "текст\n  "   — только слева
print(s.rstrip())   # "  \tтекст"   — только справа

# Можно указать, какие символы удалять:
url = "www.example.com"
print(url.strip("w"))            # ".example.com"
print(url.strip("."))            # "www.example.com"
```

## Выравнивание и заполнение

```python
text = "Привет"

print(text.center(15))          # "    Привет    "
print(text.ljust(15))           # "Привет         "
print(text.rjust(15))           # "         Привет"
print(text.center(15, "-"))     # "----Привет----"

# zfill — дополняет слева нулями (удобно для чисел)
num = "42"
print(num.zfill(5))             # "00042"
```

## Проверка вхождения (in)

Оператор `in` проверяет, содержит ли строка подстроку:

```python
text = "Python programming"
print("Python" in text)    # True
print("Java" in text)      # False

if "Python" in text:
    print("Найдено!")

# not in — проверка отсутствия
if "Java" not in text:
    print("Java не найдена")
```

## Неизменяемость строк (immutability)

Строки в Python **нельзя изменить** после создания. Любой метод строки возвращает **новую** строку, а исходная остаётся без изменений:

```python
s = "Привет"
# s[0] = "п"          # Ошибка! TypeError
s_upper = s.upper()   # Создаётся новая строка
print(s)              # "Привет" — исходная не изменилась
print(s_upper)        # "ПРИВЕТ"
```

## Сравнение строк

Строки сравниваются лексикографически (по кодам символов):

```python
print("abc" == "abc")   # True
print("abc" != "xyz")   # True
print("abc" < "abd")    # True  — 'c' < 'd'
print("abc" > "ABC")    # True  — строчные буквы имеют больший код

# Сравнение без учёта регистра:
print("Hello".lower() == "HELLO".lower())   # True
```

## Преобразование типов

```python
# Число > строка
n = 42
s = str(n)               # "42"

# Строка > число
s = "123"
n = int(s)               # 123
f = float("3.14")        # 3.14
```
