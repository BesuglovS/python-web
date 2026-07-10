/**
 * Service Worker — офлайн-доступ и кеширование
 * Стратегия: кеширование по мере посещения (cache-first с обновлением)
 * При установке кешируются только критически важные ресурсы.
 * HTML-страницы и JSON-данные кешируются при первом посещении.
 */
const CACHE_NAME = 'python-web-v6';
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './style.css',
  './script.js',
  './config.js',
  './repl.js',
  './mindmap.js',
  './ga.js',
  './highlight-py.min.js',
  './highlight-theme.min.css',
  './lessons.json',
  './favicon.png',
  './apple-touch-icon.png',
  './manifest.json'
];

// Установка: кешируем только критически важные ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          CRITICAL_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('SW: failed to cache critical', url, err);
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

// Перехват запросов: стратегия Stale-While-Revalidate для HTML/JS,
// кеширование по мере посещения
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Не кешируем запросы к песочнице и API
  if (url.pathname.includes('/sandbox/') || url.pathname.includes('/api/')) {
    return;
  }

  // HTML-страницы и JSON-файлы: кешируем при первом посещении (cache-first, затем обновляем)
  const isHTML = event.request.headers.get('accept')?.includes('text/html') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('/');
  const isJSON = url.pathname.endsWith('.json');

  if (isHTML || isJSON) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        // Фоновое обновление кеша из сети
        const networkFetch = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Если HTML и нет сети — показываем offline-страницу
          if (isHTML) {
            return caches.match('./offline.html');
          }
          return cached;
        });

        // Если есть в кеше — сразу отдаём, иначе ждём сеть
        return cached || networkFetch;
      })
    );
    return;
  }

  // Остальные статические ресурсы (CSS, JS, CDN): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});