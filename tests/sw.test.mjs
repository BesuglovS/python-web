import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Тестируем ШАБЛОН Service Worker (src/sw/template.js) — из него
// build-sw.mjs генерирует dist/sw.js. Сгенерированный PRECACHE
// проверяется сборкой, а не юнит-тестами.
const swSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'sw', 'template.js'), 'utf-8');

describe('Service Worker template', () => {
  describe('PRECACHE block', () => {
    it('has markers for build-sw.mjs', () => {
      expect(swSrc).toContain('// Ресурсы, которые кэшируем сразу при установке SW');
      expect(swSrc).toContain('// Установка: предварительное кэширование критических ресурсов');
    });

    it('has an empty placeholder PRECACHE in the template', () => {
      expect(swSrc).toMatch(/const PRECACHE = \[\s*\];/);
    });
  });

  describe('Fetch strategies', () => {
    it('should not cache sandbox or quiz endpoints', () => {
      const fetchHandlerMatch = swSrc.match(
        /if\s*\(url\.pathname\.startsWith\('\/sandbox\/'\)\) return;/,
      );
      expect(fetchHandlerMatch).not.toBeNull();
    });

    it('should ignore cross-origin requests (auth/contest API)', () => {
      expect(swSrc).toContain('url.origin !== self.location.origin');
    });

    it('should cache quizzes with network-first strategy', () => {
      const quizNetworkFirst = swSrc.match(
        /if\s*\(url\.pathname\.startsWith\('\/quizzes\/'\)\)\s*\{[\s\S]*?networkFirst/,
      );
      expect(quizNetworkFirst).not.toBeNull();
    });
  });

  describe('Cache strategies', () => {
    it('should use network-first for HTML documents', () => {
      expect(swSrc).toContain('networkFirst');
      expect(swSrc).toContain("event.request.destination === 'document'");
    });

    it('should use cache-first for static assets', () => {
      expect(swSrc).toContain('cacheFirst');
    });

    it('should only handle GET requests', () => {
      expect(swSrc).toContain("event.request.method !== 'GET'");
    });
  });

  describe('Offline support', () => {
    it('should return offline page for navigation requests', () => {
      expect(swSrc).toContain("request.mode === 'navigate'");
      expect(swSrc).toContain('OFFLINE_PAGE');
    });

    it('has a cache name placeholder replaced by the build', () => {
      const cacheNameMatch = swSrc.match(/const CACHE_NAME = '([^']+)'/);
      expect(cacheNameMatch).not.toBeNull();
      expect(cacheNameMatch[1]).toMatch(/^python-web-/);
    });
  });

  describe('Lifecycle events', () => {
    it('should register install listener', () => {
      expect(swSrc).toContain("self.addEventListener('install'");
    });

    it('should register activate listener', () => {
      expect(swSrc).toContain("self.addEventListener('activate'");
    });

    it('should register fetch listener', () => {
      expect(swSrc).toContain("self.addEventListener('fetch'");
    });

    it('should call skipWaiting on install', () => {
      expect(swSrc).toContain('self.skipWaiting()');
    });

    it('should call clients.claim on activate', () => {
      expect(swSrc).toContain('self.clients.claim()');
    });

    it('should clean up old caches on activate', () => {
      expect(swSrc).toContain('caches.delete');
    });
  });
});
