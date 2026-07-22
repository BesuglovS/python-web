---
title: 'Обработка исключений'
lesson: 11
description: 'try, except, finally, raise'
badge: 'error_handler'
file: '11-try-except.html'
layout: 'layout.njk'
permalink: '11-try-except.html'
subtitle: 'try / except / finally / raise — как сделать программу устойчивой к ошибкам'
---

## Зачем нужна обработка ошибок?

Во время выполнения программы могут возникать ошибки (исключения): деление на ноль, неверный тип данных, отсутствующий файл. Если не обработать исключение — программа **аварийно завершится**.

Python предоставляет механизм `try/except` для «перехвата» ошибок и безопасной реакции на них.

```python
# Без обработки — программа упадёт
x = int(input("Введите число: "))   # Если ввести "abc" → ValueError
print(10 / x)                        # Если x = 0 → ZeroDivisionError
```

## Синтаксис try/except

Опасный код помещается в блок `try`, а реакция на ошибку — в `except`:

```python
try:
    x = int(input("Введите число: "))
    print("10 /", x, "=", 10 / x)
except ValueError:
    print("❌ Это не число!")
except ZeroDivisionError:
    print("❌ На ноль делить нельзя!")
```

> **⚠️ Важно:** как только в блоке `try` возникает ошибка, выполнение сразу переходит в соответствующий `except`. Оставшаяся часть `try` не выполняется.

## Несколько типов исключений в одном except

Можно перехватывать несколько типов ошибок в одном блоке:

```python
try:
    x = int(input("Введите число: "))
    print(10 / x)
except (ValueError, ZeroDivisionError) as e:
    print(f"Ошибка: {e}")
```

Ключевое слово `as` позволяет получить сам объект исключения и вывести его описание.

## Универсальный except

`except:` без указания типа (или `except Exception:`) перехватывает **любую** ошибку. Используйте осторожно:

```python
try:
    risky_code()
except Exception as e:
    print(f"Что-то пошло не так: {e}")
```

> **⚠️ Важно:** **Совет:** перехватывайте конкретные типы исключений. Голый `except:` может скрыть ошибки, которые вы не ожидали, и усложнить отладку.

## Блок else

`else` выполняется, **только если ошибок не было**:

```python
try:
    x = int(input("Число: "))
except ValueError:
    print("Это не число!")
else:
    print(f"Отлично! Вы ввели {x}")
```

## Блок finally

`finally` выполняется **всегда** — была ошибка или нет. Используется для очистки ресурсов (закрытие файлов, соединений):

```python
f = None
try:
    f = open("data.txt", "r")
    content = f.read()
except FileNotFoundError:
    print("Файл не найден!")
finally:
    if f:
        f.close()        # Выполнится всегда
    print("Файл закрыт")
```

## Полный порядок блоков

Стандартная структура: `try → except → else → finally`

```python
try:
    # Код, который может вызвать ошибку
    result = 10 / int(input("Число: "))
except ValueError:
    # Если не число
    print("Нужно число!")
except ZeroDivisionError:
    # Если ноль
    print("Не дели на ноль!")
else:
    # Если ошибок НЕ было
    print("Результат:", result)
finally:
    # Выполнится ВСЕГДА
    print("Конец операции")
```

## Оператор raise — создаём свои ошибки

`raise` позволяет **вручную** вызвать исключение. Полезно для проверки входных данных:

```python
def set_age(age):
    if age < 0:
        raise ValueError("Возраст не может быть отрицательным!")
    if age > 150:
        raise ValueError("Слишком большой возраст!")
    print(f"Возраст: {age}")

try:
    set_age(-5)
except ValueError as e:
    print(e)   # "Возраст не может быть отрицательным!"
```

## Создание своих типов исключений

Можно создать собственный класс исключения, унаследовав от `Exception`:

```python
class NegativeAgeError(Exception):
    """Возраст не может быть отрицательным"""
    pass

def set_age(age):
    if age < 0:
        raise NegativeAgeError(f"Возраст {age} < 0!")
    print(f"OK: {age}")

try:
    set_age(-10)
except NegativeAgeError as e:
    print(f"Поймано своё исключение: {e}")
```

## Основные встроенные исключения Python

<table class="exceptions-table"><thead><tr><th>Исключение</th><th>Когда возникает</th></tr></thead><tbody><tr><td><code>ValueError</code></td><td>Неверное значение (например, <code>int("abc")</code>)</td></tr><tr><td><code>TypeError</code></td><td>Неверный тип данных (например, <code>"a" + 5</code>)</td></tr><tr><td><code>IndexError</code></td><td>Индекс за пределами списка/строки</td></tr><tr><td><code>KeyError</code></td><td>Отсутствующий ключ в словаре</td></tr><tr><td><code>ZeroDivisionError</code></td><td>Деление на ноль</td></tr><tr><td><code>FileNotFoundError</code></td><td>Файл не найден</td></tr><tr><td><code>NameError</code></td><td>Использование необъявленной переменной</td></tr><tr><td><code>SyntaxError</code></td><td>Синтаксическая ошибка в коде</td></tr><tr><td><code>ImportError</code></td><td>Не удалось импортировать модуль</td></tr><tr><td><code>AttributeError</code></td><td>Обращение к несуществующему атрибуту объекта</td></tr></tbody></table>

## Практический пример: безопасный ввод числа

Классический паттерн — запрашивать ввод, пока пользователь не введёт корректное значение:

```python
def get_number(prompt="Введите число: "):
    """Запрашивает число, пока не будет введено корректное"""
    while True:
        try:
            return int(input(prompt))
        except ValueError:
            print("❌ Это не число! Попробуйте ещё раз.")

age = get_number("Ваш возраст: ")
print(f"Ваш возраст: {age}")
```

## Практический пример: безопасное деление

```python
def safe_divide(a, b):
    """Безопасное деление с обработкой ошибок"""
    try:
        result = a / b
    except ZeroDivisionError:
        print(f"❌ Ошибка: деление {a} на 0 невозможно")
        return None
    except TypeError as e:
        print(f"❌ Ошибка типа: {e}")
        return None
    else:
        print(f"✅ {a} / {b} = {result:.2f}")
        return result

safe_divide(10, 2)    # ✅ 10 / 2 = 5.00
safe_divide(10, 0)    # ❌ Ошибка: деление 10 на 0 невозможно
safe_divide(10, "a")  # ❌ Ошибка типа: ...
```

## Цепочка исключений (raise from)

Можно связать новое исключение с исходным:

```python
try:
    x = int("abc")
except ValueError as original_error:
    raise RuntimeError("Не удалось обработать ввод") from original_error
```

## Резюме

- `try` — код, который может вызвать ошибку
- `except ТипОшибки` — перехват конкретной ошибки
- `except (Тип1, Тип2)` — перехват нескольких типов
- `as переменная` — получить объект исключения
- `else` — выполняется, если ошибок не было
- `finally` — выполняется всегда (очистка ресурсов)
- `raise` — вызвать исключение вручную
- Свои исключения — наследование от `Exception`

> **⚠️ Важно:** Перехватывайте только те исключения, которые можете осмысленно обработать. Не используйте голый `except:` без крайней необходимости.

### ✏️ Упражнение: Безопасный ввод

Напишите код, который запрашивает у пользователя два числа и выводит результат их деления. Обработайте ситуации:

1.  Пользователь ввёл не число (`ValueError`)
2.  Деление на ноль (`ZeroDivisionError`)

```python
# ВАШ КОД — напишите функцию safe_calculator()
def safe_calculator():
    try:
        a = float(input("Первое число: "))
        b = float(input("Второе число: "))
        print(f"Результат: {a / b}")
    except ValueError:
        print("Ошибка: нужно ввести число!")
    except ZeroDivisionError:
        print("Ошибка: на ноль делить нельзя!")

safe_calculator()
```
