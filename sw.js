/**
 * Service Worker — кэширование статических ресурсов и офлайн-доступ
 * для python.nayanovaacademy.ru
 */
'use strict';

const CACHE_NAME = 'python-web-v2';
const OFFLINE_PAGE = '/offline.html';

// Ресурсы, которые кэшируем сразу при установке SW
const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/repl.html',
  '/final-test.html',
  '/mindmap.html',
  '/cheatsheets.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/repl.js',
  '/mindmap.js',
  '/highlight-theme.min.css',
  '/highlight-py.min.js',
  '/favicon.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/manifest.json',
  '/robots.txt',
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
  if (url.pathname.startsWith('/quizzes/')) return;

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
    const response = await fetch(request);
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
