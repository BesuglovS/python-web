---
title: 'ООП: введение'
lesson: 41
description: 'Классы, объекты, __init__, self'
badge: 'oop_master'
file: '41-oop-intro.html'
layout: 'layout.njk'
permalink: '41-oop-intro.html'
subtitle: 'Классы, объекты, конструктор __init__, методы, self — первые шаги в ООП'
---

## Что такое ООП и зачем оно нужно?

**ООП (объектно-ориентированное программирование)** — это подход, при котором программа строится из **объектов**, объединяющих данные и поведение.

До сих пор мы писали процедурный код: функции отдельно, данные отдельно. С ростом программы это становится неудобно:

- Трудно отслеживать, какие данные к какой функции относятся
- Легко запутаться в глобальных переменных
- Код плохо переиспользуется

ООП решает эти проблемы, группируя связанные данные и функции в **классы**.

## Класс и объект — в чём разница?

**Класс** — это чертёж, шаблон. Например, чертёж автомобиля. **Объект (экземпляр)** — конкретная машина, созданная по этому чертежу.

```python
# Класс — чертёж
class Car:
    pass

# Объекты — конкретные машины
my_car = Car()
friends_car = Car()

print(type(my_car))      # <class '__main__.Car'>
print(type(friends_car)) # <class '__main__.Car'> — оба одного класса
```

Ключевое слово `class` объявляет новый класс. `pass` — заглушка («ничего не делай»), нужна, чтобы класс был синтаксически корректным.

## \_\_init\_\_ — инициализатор

`__init__` — специальный метод (инициализатор), который вызывается автоматически при создании объекта. Он инициализирует начальное состояние объекта. (Настоящий конструктор в Python — это `__new__`, но на практике почти всегда используется `__init__`.)

```python
class Car:
    def __init__(self, brand, model, year):
        """Конструктор: вызывается при Car(...)."""
        self.brand = brand
        self.model = model
        self.year = year

my_car = Car("Toyota", "Camry", 2020)

print(my_car.brand)  # Toyota
print(my_car.model)  # Camry
print(my_car.year)   # 2020
```

Параметры `__init__`: `self` ссылается на создаваемый объект (всегда первый параметр), остальные — обычные аргументы, переданные при создании.

> **⚠️ Важно:** **self** — не ключевое слово, а соглашение. Можно назвать иначе, но всё сообщество Python использует именно `self`. Не нарушайте традицию.

## Методы — функции внутри класса

Обычные функции, определённые внутри класса, называются **методами**. Они автоматически получают `self` первым аргументом.

```python
class Car:
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year
        self.odometer = 0  # начальный пробег

    def drive(self, km):
        """Проехать км километров."""
        self.odometer += km
        print(f"Проехали {km} км. Пробег: {self.odometer} км")

    def info(self):
        """Вернуть информацию о машине."""
        return f"{self.brand} {self.model} ({self.year})"

car = Car("Honda", "Civic", 2022)
print(car.info())     # Honda Civic (2022)
car.drive(150)         # Проехали 150 км. Пробег: 150 км
car.drive(80)          # Проехали 80 км. Пробег: 230 км
```

## Атрибуты класса vs атрибуты экземпляра

```python
class Car:
    wheels = 4  # атрибут КЛАССА — общий для всех

    def __init__(self, brand):
        self.brand = brand  # атрибут ЭКЗЕМПЛЯРА — у каждого свой

car1 = Car("Toyota")
car2 = Car("Honda")

print(car1.wheels, car2.wheels)  # 4 4 — общее значение
Car.wheels = 6                   # меняем атрибут класса
print(car1.wheels, car2.wheels)  # 6 6 — изменилось у всех

print(car1.brand, car2.brand)    # Toyota Honda — у каждого своё
```

**Правило:** общие для всех машин свойства (количество колёс) — атрибуты класса. Индивидуальные свойства (марка) — атрибуты экземпляра (через `self`).

## Практический пример: класс Student

```python
class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.grades = []  # список оценок

    def add_grade(self, grade):
        """Добавить оценку (2-5)."""
        if 2 <= grade <= 5:
            self.grades.append(grade)
            print(f"Оценка {grade} добавлена для {self.name}")
        else:
            print(f"Ошибка: оценка {grade} недопустима. Допустимы 2-5.")

    def average(self):
        """Средний балл."""
        if not self.grades:
            return 0
        return sum(self.grades) / len(self.grades)

    def info(self):
        """Полная информация о студенте."""
        return f"{self.name}, {self.age} лет, средний балл: {self.average():.2f}"

# Использование
s = Student("Анна", 20)
s.add_grade(5)
s.add_grade(4)
s.add_grade(5)
s.add_grade(11)        # Ошибка: оценка 11 недопустима
print(s.info())        # Анна, 20 лет, средний балл: 4.67
```

## Специальные методы (dunder)

Методы с двойными подчёркиваниями (`__метод__`) называются «dunder» (double underscore). Python вызывает их автоматически в определённых ситуациях.

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        """Вызывается при print() и str()."""
        return f"Point({self.x}, {self.y})"

    def __repr__(self):
        """Вызывается при repr() и в интерактивной консоли."""
        return f"Point({self.x}, {self.y})"

    def __eq__(self, other):
        """Вызывается при сравнении ==."""
        if not isinstance(other, Point):
            return False
        return self.x == other.x and self.y == other.y

p1 = Point(3, 4)
p2 = Point(3, 4)
p3 = Point(5, 6)

print(p1)           # Point(3, 4) — работает __str__
print(p1 == p2)     # True — работает __eq__
print(p1 == p3)     # False
```

## Итоги

- `class` — создаёт новый класс (чертёж объектов)
- `__init__(self, ...)` — конструктор, инициализирует объект
- `self` — первый параметр всех методов, ссылка на сам объект
- Методы — обычные функции внутри класса, работают с данными объекта через `self`
- Атрибуты класса — общие для всех экземпляров
- Атрибуты экземпляра (через `self.`) — у каждого свои
- Специальные методы (`__str__`, `__eq__`, etc.) — встроенное поведение
- ООП помогает организовать код, когда программа вырастает за пределы одного файла
