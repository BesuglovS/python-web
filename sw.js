/**
 * Service Worker — офлайн-доступ и кеширование
 * Кеширует HTML-страницы, CSS, JS, CDN-ресурсы
 */
const CACHE_NAME = 'python-web-v3';
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
  './09-complex-conditions.html',
  './10-nested-structures.html',
  './11-priority.html',
  './12-strings-index-slice.html',
  './13-string-ops.html',
  './14-functions.html',
  './15-functions-advanced.html',
  './16-while.html',
  './17-for.html',
  './18-range.html',
  './19-break-continue.html',
  './20-nested-loops.html',
  './21-sets.html',
  './22-lists.html',
  './23-tuples.html',
  './24-dicts.html',
  './25-split-join.html',
  './26-list-comprehensions.html',
  './27-try-except.html',
  './28-files.html',
  './29-itertools.html',
  './30-modules-import.html',
  './31-math-random.html',
  './32-datetime.html',
  './33-oop-intro.html',
  './34-final-project.html',
  './final-test.html',
  './repl.html',
  './08a-type-casting.html',
  './28a-stdin.html',
  './33a-inheritance.html',
  './39-lambda.html',
  './40-decorators.html',
  './41-generators.html',
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
      .then((cache) => {
        // Кешируем файлы по одному — один сбой не ломает весь SW
        return Promise.allSettled(
          ASSETS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('SW: failed to cache', url, err);
            })
          )
        );
      })
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

// Перехват запросов: стратегия Stale-While-Revalidate
// Сначала отдаём из кеша (мгновенно), затем обновляем кеш из сети
self.addEventListener('fetch', (event) => {
  // Не кешируем POST-запросы к песочнице
  if (event.request.method !== 'GET') {
    return;
  }

  // Не кешируем запросы к API и внешним аналитикам
  const url = new URL(event.request.url);
  if (url.pathname.includes('/sandbox/') || url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Офлайн — используем только кеш
        return cached;
      });

      // Возвращаем кеш, если есть; иначе ждём сеть
      return cached || networkFetch;
    })
  );
});