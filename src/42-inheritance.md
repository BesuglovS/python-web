---
title: 'Наследование'
lesson: 42
description: 'class Child(Parent), super(), переопределение'
badge: 'inheritance_guru'
file: '42-inheritance.html'
layout: 'layout.njk'
permalink: '42-inheritance.html'
subtitle: 'super(), переопределение методов, полиморфизм'
---

## Что такое наследование?

Наследование позволяет создавать новый класс на основе существующего. Дочерний класс получает все атрибуты и методы родительского и может добавлять свои или изменять существующие.

```python
# Родительский класс
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "???"

# Дочерний класс (наследует от Animal)
class Dog(Animal):
    def speak(self):
        return f"{self.name} говорит: Гав!"

class Cat(Animal):
    def speak(self):
        return f"{self.name} говорит: Мяу!"

dog = Dog("Шарик")
cat = Cat("Мурка")
print(dog.speak())  # Шарик говорит: Гав!
print(cat.speak())  # Мурка говорит: Мяу!
```

Синтаксис: `class Дочерний(Родительский):`

## super() — вызов родительского метода

`super()` позволяет вызвать метод родительского класса из дочернего. Особенно важно для `__init__`:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def info(self):
        return f"{self.name}, {self.age} лет"

class Student(Person):
    def __init__(self, name, age, group):
        super().__init__(name, age)   # вызываем __init__ родителя
        self.group = group

    def info(self):
        base_info = super().info()     # вызываем info() родителя
        return f"{base_info}, группа {self.group}"

student = Student("Анна", 20, "П-101")
print(student.info())  # Анна, 20 лет, группа П-101
```

## Переопределение методов (override)

Если метод дочернего класса имеет то же имя, что и метод родителя, — он **переопределяет** его:

```python
class Shape:
    def area(self):
        return 0

    def describe(self):
        return f"Фигура с площадью {self.area()}"

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):                   # переопределяем!
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):                   # переопределяем!
        import math
        return math.pi * self.radius ** 2

shapes = [Rectangle(10, 5), Circle(7)]
for shape in shapes:
    print(shape.describe())

# Вывод:
# Фигура с площадью 50
# Фигура с площадью 153.93804002589985
```

## Полиморфизм

Полиморфизм («много форм») — возможность использовать объекты разных классов через единый интерфейс. В примере выше `rectangle.describe()` и `circle.describe()` работают одинаково, хотя внутри вызывают разные `area()`. Это и есть полиморфизм.

```python
# Все животные умеют speak(), но каждый по-своему
animals = [Dog("Бобик"), Cat("Мурзик"), Dog("Рекс")]

for animal in animals:
    print(animal.speak())

# Вывод:
# Бобик говорит: Гав!
# Мурзик говорит: Мяу!
# Рекс говорит: Гав!
```

## Множественное наследование

Python поддерживает наследование от нескольких классов одновременно:

```python
class Flyer:
    def fly(self):
        return "Я лечу!"

class Swimmer:
    def swim(self):
        return "Я плыву!"

class Duck(Flyer, Swimmer):
    def speak(self):
        return "Кря!"

duck = Duck()
print(duck.fly())    # Я лечу!
print(duck.swim())   # Я плыву!
print(duck.speak())  # Кря!
```

> **💡 Совет:** MRO (Method Resolution Order) — Python ищет методы слева направо по цепочке наследования.

## isinstance() и issubclass()

```python
class Animal:
    pass

class Dog(Animal):
    pass

dog = Dog()

print(isinstance(dog, Dog))       # True
print(isinstance(dog, Animal))    # True (т.к. Dog наследует от Animal)
print(isinstance(42, Animal))     # False

print(issubclass(Dog, Animal))    # True
print(issubclass(Animal, Dog))    # False
```

## Практический пример: система сотрудников

```python
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def get_bonus(self):
        return self.salary * 0.10

    def get_total(self):
        return self.salary + self.get_bonus()

class Manager(Employee):
    def get_bonus(self):
        return self.salary * 0.20   # менеджеры получают больше

class Developer(Employee):
    def __init__(self, name, salary, lang):
        super().__init__(name, salary)
        self.lang = lang

    def get_bonus(self):
        return self.salary * 0.15 + 10000  # надбавка за язык

staff = [
    Employee("Иван", 50000),
    Manager("Петя", 80000),
    Developer("Анна", 100000, "Python"),
]

for person in staff:
    print(f"{person.name}: {person.get_total():,.0f} ₽")

# Вывод:
# Иван: 55,000 ₽
# Петя: 96,000 ₽
# Анна: 125,000 ₽
```
