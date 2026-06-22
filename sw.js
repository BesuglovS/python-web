/**
 * Service Worker — офлайн-доступ и кеширование
 * Кеширует HTML-страницы, CSS, JS, CDN-ресурсы
 */
const CACHE_NAME = 'python-web-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './01-history.html',
  './02-ide-setup.html',
  './03-variables.html',
  './04-data-types.html',
  './05-io.html',
  './06-number-ops.html',
  './07-conditional.html',
  './08-booleans.html',
  './09-strings-index-slice.html',
  './10-string-ops.html',
  './11-complex-conditions.html',
  './12-nested-structures.html',
  './13-priority.html',
  './14-functions.html',
  './15-while.html',
  './16-for.html',
  './17-range.html',
  './18-functions-advanced.html',
  './19-break-continue.html',
  './20-nested-loops.html',
  './21-sets.html',
  './22-lists.html',
  './23-tuples.html',
  './24-dicts.html',
  './25-split-join.html',
  './26-list-comprehensions.html',
  './27-final-project.html',
  './style.css',
  './script.js',
  './config.js',
  './favicon.png',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/vs2015.min.css'
];

// Установка: кешируем все ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов: стратегия Cache First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Возвращаем из кеша, а в фоне обновляем кеш по сети
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached); // если сеть упала — отдаём кеш
      return cached || fetchPromise;
    })
  );
});