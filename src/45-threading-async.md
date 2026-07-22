---
title: 'Многопоточность и asyncio'
lesson: 45
description: 'threading, multiprocessing, async/await'
badge: 'async_master'
file: '45-threading-async.html'
layout: 'layout.njk'
permalink: '45-threading-async.html'
subtitle: 'Потоки, процессы, асинхронное программирование: три подхода к параллельному выполнению'
---

## Введение

Когда программа выполняет задачи, которые можно делать параллельно (загрузка файлов, запросы к API, обработка данных), на помощь приходят многопоточность и асинхронность. Python предлагает три подхода: `threading` для I/O-задач, `multiprocessing` для CPU-задач и `asyncio` для асинхронного кода.

**📌 На этом уроке вы узнаете:**

- Модуль `threading`: запуск функций в отдельных потоках
- GIL в Python и когда потоки реально параллельны
- `ThreadPoolExecutor` из `concurrent.futures`
- Асинхронность: `async def`, `await`, `asyncio.gather()`
- Сравнение threading, multiprocessing и asyncio — что и когда использовать

## Основной материал

`threading.Thread` запускает функцию в отдельном потоке — полезно для I/O-задач (сеть, файлы), где программа ждёт ответа. GIL (Global Interpreter Lock) ограничивает параллельность CPU-задач в потоках — для них используйте `multiprocessing`. `concurrent.futures` предоставляет удобные пулы потоков и процессов. `asyncio` — современный асинхронный подход с event loop: функции `async def` и оператор `await` не блокируют выполнение других задач.

```python
import threading
import time
import asyncio

# === threading ===
def download(file_name):
    print(f"Скачиваю {file_name}...")
    time.sleep(2)  # имитация загрузки
    print(f"{file_name} скачан!")

threads = []
for f in ["a.txt", "b.txt", "c.txt"]:
    t = threading.Thread(target=download, args=(f,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
print("Все файлы скачаны!")

# === asyncio ===
async def fetch(url):
    print(f"Запрос к {url}...")
    await asyncio.sleep(1)  # асинхронное ожидание
    print(f"Ответ от {url}")
    return f"Данные от {url}"

async def main():
    tasks = [fetch("api/1"), fetch("api/2"), fetch("api/3")]
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())  # запуск главной корутины
```

## Практика

**📝 Задание:** Напишите программу, которая параллельно (через threading) вычисляет факториалы чисел 5, 10, 15, 20. Затем перепишите то же самое через concurrent.futures.ThreadPoolExecutor. Сравните время выполнения с последовательным вариантом.

[Открыть REPL для выполнения →](repl.html)

## Ключевые выводы

- `threading` — для I/O-задач (сеть, файлы), не для CPU из-за GIL
- `multiprocessing` — для CPU-задач, обходит GIL
- `concurrent.futures` — удобные пулы потоков/процессов
- `async/await` — асинхронный код с event loop для высоконагруженных сетевых приложений
- `asyncio.gather()` — параллельный запуск нескольких корутин
