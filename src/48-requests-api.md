---
title: 'Requests + API'
lesson: 48
description: 'GET, POST, работа с JSON-сервисами'
badge: 'api_explorer'
file: '48-requests-api.html'
layout: 'layout.njk'
permalink: '48-requests-api.html'
subtitle: 'Взаимодействие с веб-сервисами через HTTP'
---

## Что такое API?

API (Application Programming Interface) — способ взаимодействия программ друг с другом через HTTP-запросы. Библиотека `requests` — стандарт для отправки таких запросов в Python.

<!-- norun -->

```bash
# Установка
pip install requests
```

## GET-запрос — получение данных

```python
import requests

# Получить список пользователей с JSON-API
response = requests.get("https://jsonplaceholder.typicode.com/users")

print(response.status_code)  # 200 = успех
users = response.json()       # парсим JSON в список словарей

for user in users:
    print(f"{user['name']} — {user['email']}")

# Вывод:
# Leanne Graham — Sincere@april.biz
# Ervin Howell — Shanna@melissa.tv
# ...
```

## Параметры GET-запроса

```python
import requests

# Параметры через params (автоматически добавляются к URL)
response = requests.get(
    "https://jsonplaceholder.typicode.com/posts",
    params={"userId": 1, "_limit": 5}  # ?userId=1&_limit=5
)

posts = response.json()
for post in posts:
    print(post["title"])
```

## POST-запрос — отправка данных

```python
import requests

new_post = {
    "title": "Мой первый пост",
    "body": "Привет, мир! Это тестовый пост.",
    "userId": 1
}

response = requests.post(
    "https://jsonplaceholder.typicode.com/posts",
    json=new_post
)

print(response.status_code)  # 201 = создано
print(response.json()["id"])  # 101
```

## Обработка ошибок

```python
import requests

try:
    response = requests.get("https://api.example.com/data", timeout=5)
    response.raise_for_status()   # выбросит исключение при ошибке 4xx/5xx
    data = response.json()
except requests.exceptions.Timeout:
    print("Сервер не ответил за 5 секунд")
except requests.exceptions.HTTPError as e:
    print(f"Ошибка HTTP: {e}")
except requests.exceptions.ConnectionError:
    print("Не удалось подключиться к серверу")
else:
    print("Данные получены успешно!")
```

## Практический пример: погода через API

```python
import requests

API_KEY = "ваш_ключ"  # возьмите на openweathermap.org
city = "Москва"

response = requests.get(
    "https://api.openweathermap.org/data/2.5/weather",
    params={
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"
    }
)

if response.status_code == 200:
    data = response.json()
    temp = data["main"]["temp"]
    desc = data["weather"][0]["description"]
    print(f"Погода в {city}: {temp}°C, {desc}")
else:
    print(f"Ошибка: {response.status_code}")
```
