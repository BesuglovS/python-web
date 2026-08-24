/**
 * Service Worker — ШАБЛОН (src/sw/template.js)
 *
 * Это исходник, из которого build-sw.mjs генерирует dist/sw.js:
 *   - между маркерами PRECACHE подставляется список ресурсов;
 *   - CACHE_NAME получает content-hash финального содержимого
 *     (пересчитывается ещё раз в build-assets-hash.mjs ПОСЛЕ
 *     переписывания хэшированных ссылок).
 * Не редактируется вручную и не деплоится как есть.
 */
'use strict';

// Версия кэша автоматически обновляется build-sw.mjs (content hash)
const CACHE_NAME = 'python-web-dev';
const OFFLINE_PAGE = '/offline.html';

// Ресурсы, которые кэшируем сразу при установке SW
// Автоматически сгенерировано build-sw.mjs — не редактировать вручную
const PRECACHE = [];

// Установка: предварительное кэширование критических ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE.map((url) =>
            cache.add(url).catch(() => {
              // Игнорируем ошибки отдельных файлов — не фатально
            }),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Стратегия: Cache-first для статики, Network-first для HTML-страниц
self.addEventListener('fetch', (event) => {
  // Только GET-запросы
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Кросс-доменные запросы (auth.nayanovaacademy.ru, contest.*) не трогаем:
  // cache-first на чужом origin закэшировал бы персональные ответы API.
  if (url.origin !== self.location.origin) return;

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
  if (
    event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
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
