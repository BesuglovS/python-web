/**
 * Service Worker — кэширование статических ресурсов и офлайн-доступ
 * для python.nayanovaacademy.ru
 */
'use strict';

// Версия кэша автоматически обновляется build-sw.mjs (content hash)
const CACHE_NAME = 'python-web-9b625e58';
const OFFLINE_PAGE = '/offline.html';

// Ресурсы, которые кэшируем сразу при установке SW
// Автоматически сгенерировано build-sw.mjs — не редактировать вручную
const PRECACHE = [
  '/',
  '/01-history.html',
  '/02-ide-setup.html',
  '/03-variables.html',
  '/04-data-types.html',
  '/05-type-casting.html',
  '/06-io.html',
  '/07-f-strings.html',
  '/08-number-ops.html',
  '/09-booleans.html',
  '/10-conditional.html',
  '/11-try-except.html',
  '/12-complex-conditions.html',
  '/13-nested-structures.html',
  '/14-strings-index-slice.html',
  '/15-string-ops.html',
  '/16-regex.html',
  '/17-while.html',
  '/18-for.html',
  '/19-range.html',
  '/20-break-continue.html',
  '/21-nested-loops.html',
  '/22-functions.html',
  '/23-functions-advanced.html',
  '/24-debugging.html',
  '/25-lists.html',
  '/26-sets.html',
  '/27-tuples.html',
  '/28-dicts.html',
  '/29-split-join.html',
  '/30-list-comprehensions.html',
  '/31-lambda.html',
  '/32-files.html',
  '/33-json-csv.html',
  '/34-sqlite3.html',
  '/35-modules-import.html',
  '/36-itertools.html',
  '/37-venv-pip.html',
  '/38-math-random.html',
  '/39-datetime.html',
  '/40-numpy-pandas.html',
  '/404.html',
  '/41-oop-intro.html',
  '/42-inheritance.html',
  '/43-decorators.html',
  '/44-generators.html',
  '/45-threading-async.html',
  '/46-type-hints.html',
  '/47-pytest.html',
  '/48-requests-api.html',
  '/49-flask.html',
  '/50-git-intro.html',
  '/500.html',
  '/apple-touch-icon.png',
  '/cheatsheets.html',
  '/config.ee3253eb.js',
  '/favicon-192x192.png',
  '/favicon-32x32.png',
  '/favicon-512x512.png',
  '/favicon.png',
  '/final-test.html',
  '/highlight-py.min.73eff37f.js',
  '/highlight-theme.min.ef63721f.css',
  '/index.html',
  '/lessons.json',
  '/manifest.json',
  '/mindmap.html',
  '/mindmap.148a42ba.js',
  '/offline.html',
  '/og-image.png',
  '/quizzes/1.json',
  '/quizzes/10.json',
  '/quizzes/11.json',
  '/quizzes/12.json',
  '/quizzes/13.json',
  '/quizzes/14.json',
  '/quizzes/15.json',
  '/quizzes/16.json',
  '/quizzes/17.json',
  '/quizzes/18.json',
  '/quizzes/19.json',
  '/quizzes/2.json',
  '/quizzes/20.json',
  '/quizzes/21.json',
  '/quizzes/22.json',
  '/quizzes/23.json',
  '/quizzes/24.json',
  '/quizzes/25.json',
  '/quizzes/26.json',
  '/quizzes/27.json',
  '/quizzes/28.json',
  '/quizzes/29.json',
  '/quizzes/3.json',
  '/quizzes/30.json',
  '/quizzes/31.json',
  '/quizzes/32.json',
  '/quizzes/33.json',
  '/quizzes/34.json',
  '/quizzes/35.json',
  '/quizzes/36.json',
  '/quizzes/37.json',
  '/quizzes/38.json',
  '/quizzes/39.json',
  '/quizzes/4.json',
  '/quizzes/40.json',
  '/quizzes/41.json',
  '/quizzes/42.json',
  '/quizzes/43.json',
  '/quizzes/44.json',
  '/quizzes/45.json',
  '/quizzes/46.json',
  '/quizzes/47.json',
  '/quizzes/48.json',
  '/quizzes/49.json',
  '/quizzes/5.json',
  '/quizzes/50.json',
  '/quizzes/6.json',
  '/quizzes/7.json',
  '/quizzes/8.json',
  '/quizzes/9.json',
  '/quizzes/final-test.json',
  '/repl.html',
  '/repl.ab683cfa.js',
  '/robots.txt',
  '/script.e2ad10e8.js',
  '/style.3647cdfb.css',
  '/sw.js',
  '/ym-init.js',
];

// Установка: предварительное кэширование критических ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            // Игнорируем ошибки отдельных файлов — не фатально
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Стратегия: Cache-first для статики, Network-first для HTML-страниц
self.addEventListener('fetch', (event) => {
  // Только GET-запросы к нашему origin
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Не кэшируем запросы к песочнице и API
  if (url.pathname.startsWith('/sandbox/')) return;

  // Квизы кэшируем отдельно (Network-first для свежести)
  if (url.pathname.startsWith('/quizzes/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Данные курса (lessons.json) — Network-first для свежести
  if (url.pathname === '/lessons.json') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Для HTML-страниц используем Network-first (всегда свежий контент)
  if (event.request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Для статических ресурсов — Cache-first
  event.respondWith(cacheFirst(event.request));
});

// Cache-first стратегия: сначала кэш, потом сеть
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Для изображений можно вернуть заглушку, для остального — ошибка
    return new Response('', { status: 504 });
  }
}

// Network-first стратегия: сначала сеть, при ошибке — кэш, при отсутствии — офлайн-страница
async function networkFirst(request) {
  try {
    // cache: 'no-store' — игнорируем HTTP-кэш браузера, всегда запрашиваем сеть,
    // чтобы обновления контента появлялись без Ctrl+Shift+R.
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Возвращаем офлайн-страницу для navigation-запросов
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
    }

    return new Response('Офлайн. Проверьте подключение к интернету.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
