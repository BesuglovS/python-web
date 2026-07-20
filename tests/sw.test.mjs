import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf-8');

describe('Service Worker', () => {
  describe('PRECACHE list', () => {
    it('should include core pages', () => {
      expect(swSrc).toContain("'/index.html'");
      expect(swSrc).toContain("'/offline.html'");
      expect(swSrc).toContain("'/repl.html'");
      expect(swSrc).toContain("'/final-test.html'");
    });

    it('should include critical assets', () => {
      // Ассеты теперь контент-хэшированы (см. build-assets-hash.mjs)
      expect(swSrc).toMatch(/\/style\.[a-f0-9]{8}\.css/);
      expect(swSrc).toMatch(/\/script\.[a-f0-9]{8}\.js/);
      expect(swSrc).toMatch(/\/config\.[a-f0-9]{8}\.js/);
      expect(swSrc).toContain("'/manifest.json'");
    });

    it('should not cache sandbox or quiz endpoints', () => {
      const fetchHandlerMatch = swSrc.match(
        /if\s*\(url\.pathname\.startsWith\('\/sandbox\/'\)\) return;/,
      );
      expect(fetchHandlerMatch).not.toBeNull();
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

    it('should have a versioned cache name', () => {
      const cacheNameMatch = swSrc.match(/const CACHE_NAME = '([^']+)'/);
      expect(cacheNameMatch).not.toBeNull();
      expect(cacheNameMatch[1]).toMatch(/^python-web-[a-f0-9]{8}$/);
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
