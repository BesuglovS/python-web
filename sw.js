/**
 * Service Worker — офлайн-доступ и кеширование
 * Кеширует HTML-страницы, CSS, JS, CDN-ресурсы
 */
const CACHE_NAME = 'python-web-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './01-history.html',
  './02-ide-setup.html',
  './03-variables.html',
  './04-data-types.html',
  './05-type-casting.html',
  './06-io.html',
  './07-f-strings.html',
  './08-number-ops.html',
  './09-booleans.html',
  './10-conditional.html',
  './11-try-except.html',
  './12-complex-conditions.html',
  './13-nested-structures.html',
  './14-strings-index-slice.html',
  './15-string-ops.html',
  './16-regex.html',
  './17-while.html',
  './18-for.html',
  './19-range.html',
  './20-break-continue.html',
  './21-nested-loops.html',
  './22-functions.html',
  './23-functions-advanced.html',
  './24-debugging.html',
  './25-lists.html',
  './26-sets.html',
  './27-tuples.html',
  './28-dicts.html',
  './29-split-join.html',
  './30-list-comprehensions.html',
  './31-lambda.html',
  './32-files.html',
  './33-json-csv.html',
  './34-sqlite3.html',
  './35-modules-import.html',
  './36-itertools.html',
  './37-venv-pip.html',
  './38-math-random.html',
  './39-datetime.html',
  './40-numpy-pandas.html',
  './41-oop-intro.html',
  './42-inheritance.html',
  './43-decorators.html',
  './44-generators.html',
  './45-threading-async.html',
  './46-type-hints.html',
  './47-pytest.html',
  './48-requests-api.html',
  './49-flask.html',
  './50-git-intro.html',
  './final-test.html',
  './repl.html',
  './cheatsheets.html',
  './mindmap.html',
  './style.css',
  './script.js',
  './config.js',
  './favicon.png',
  './manifest.json',
  './lessons.json',
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