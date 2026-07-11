---
title: 'Веб-фреймворки: Flask'
lesson: 49
description: 'Маршруты, шаблоны Jinja2, обработка форм, REST API'
duration: 15
complexity: '3'
badge: 'web_builder'
file: '49-flask.html'
layout: 'layout.njk'
permalink: '49-flask.html'
subtitle: 'Микро-фреймворк для веб-приложений: маршруты, шаблоны, API'
prevUrl: '48-requests-api.html'
prevTitle: 'Requests и API'
nextUrl: '50-git-intro.html'
nextTitle: 'Введение в Git'
---

## Введение

Flask — микро-фреймворк для создания веб-приложений на Python. Он минималистичен, но расширяем: через плагины добавляется работа с БД, аутентификация, админ-панель. Flask идеален для изучения основ веб-разработки и создания REST API.

**📌 На этом уроке вы узнаете:**

- Установка: `pip install flask`
- Маршруты: `@app.route()`, переменные в URL, методы GET/POST
- Шаблоны Jinja2: передача переменных, циклы, условия, наследование
- Обработка форм через `request.form` и редиректы
- Создание простого REST API с JSON-ответами

## Основной материал

Flask-приложение начинается с создания экземпляра `Flask(__name__)`. Декоратор `@app.route("/")` связывает URL с функцией-обработчиком. Параметры в URL передаются через . Шаблоны Jinja2 (папка `templates/`) используют `{{ }}` для вывода и `{% %}` для циклов и условий. Метод `render_template()` рендерит HTML с данными. Для REST API возвращайте словарь через `jsonify()`. Запуск: `flask run` или `app.run(debug=True)`.

```python
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Главная страница
@app.route('/')
def index():
    return render_template('index.html', title='Главная')

# Маршрут с параметром
@app.route('/user/')
def user(username):
    return f"Профиль: {username}"

# Обработка формы
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form.get('name')
        return f"Привет, {name}!"
    return render_template('login.html')

# REST API endpoint
@app.route('/api/items', methods=['GET'])
def get_items():
    items = [{"id": 1, "name": "Книга"}, {"id": 2, "name": "Ноутбук"}]
    return jsonify(items)

if __name__ == '__main__':
    app.run(debug=True)
```

## Практика

**📝 Задание:** Создайте Flask-приложение с тремя маршрутами: главная страница с приветствием, страница /time с текущим временем сервера (datetime), и /api/status с JSON {"status": "ok", "version": "1.0"}. Запустите и проверьте в браузере.

[Открыть REPL для выполнения →](repl.html)

## Ключевые выводы

- `@app.route("/")` — связывает URL с функцией
- `render_template()` — рендерит Jinja2-шаблоны с переменными
- `request.form` — данные из HTML-форм (POST)
- `jsonify()` — возвращает JSON-ответ для REST API
- `app.run(debug=True)` — запуск с авто-перезагрузкой
