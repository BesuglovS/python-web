---
title: 'Базы данных SQLite'
lesson: 34
description: 'CREATE TABLE, INSERT, SELECT, параметризованные запросы'
badge: 'sql_master'
file: '34-sqlite3.html'
layout: 'layout.njk'
permalink: '34-sqlite3.html'
subtitle: 'Подключение, CRUD-операции, параметризованные запросы, транзакции'
---

## Введение

SQLite — легковесная реляционная база данных, которая хранится в одном файле. Модуль `sqlite3` входит в стандартную библиотеку Python и позволяет выполнять SQL-запросы без установки сервера баз данных.

**📌 На этом уроке вы узнаете:**

- Подключение к базе данных `sqlite3.connect()` и создание курсора
- Создание таблиц через `CREATE TABLE` с типами данных
- CRUD-операции: `INSERT`, `SELECT`, `UPDATE`, `DELETE`
- Параметризованные запросы и защита от SQL-инъекций
- Транзакции: `commit()` и `rollback()`

## Основной материал

Работа с SQLite начинается с подключения к файлу базы данных через `sqlite3.connect()`. Курсор (`cursor()`) выполняет SQL-запросы методом `execute()`. Для вставки данных всегда используйте параметризованные запросы с `?` — это защищает от SQL-инъекций. После изменений данных вызывайте `commit()` для сохранения. Контекстный менеджер `with` автоматически управляет транзакциями.

```python
import sqlite3

# Подключение к БД (создаст файл, если нет)
conn = sqlite3.connect('library.db')
cur = conn.cursor()

# Создание таблицы
cur.execute("""
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER,
        read INTEGER DEFAULT 0
    )
""")

# INSERT — добавление записей
cur.execute(
    "INSERT INTO books (title, author, year) VALUES (?, ?, ?)",
    ("Мастер и Маргарита", "М. Булгаков", 1966)
)
conn.commit()

# SELECT — чтение данных
cur.execute("SELECT title, author FROM books WHERE year > 1900")
for row in cur.fetchall():
    print(f"{row[0]} — {row[1]}")

# UPDATE — обновление
cur.execute("UPDATE books SET read = 1 WHERE title = ?", ("Мастер и Маргарита",))
conn.commit()

# DELETE — удаление
cur.execute("DELETE FROM books WHERE year < ?", (1800,))
conn.commit()

conn.close()
```

Контекстный менеджер `with` автоматически управляет транзакциями и закрывает соединение:

```python
import sqlite3

with sqlite3.connect('library.db') as conn:
    cur = conn.cursor()
    cur.execute("SELECT title FROM books")
    for row in cur.fetchall():
        print(row[0])
# Соединение закрывается автоматически
```

## Практика

**📝 Задание:** Создайте базу данных "students.db" с таблицей students (id, name, grade, age). Добавьте 5 студентов. Напишите запрос для отбора студентов с grade > 4 и возрастом < 20. Выведите результат в консоль.

[Открыть REPL для выполнения →](repl.html)

## Ключевые выводы

- `sqlite3.connect()` — подключение к файлу БД, `cursor()` — выполнение SQL
- Параметризованные запросы с `?` защищают от SQL-инъекций
- После `INSERT/UPDATE/DELETE` обязателен `commit()`
- Контекстный менеджер `with sqlite3.connect()` упрощает работу
- `fetchone()`, `fetchall()` — получение результатов SELECT
