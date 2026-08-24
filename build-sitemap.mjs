/**
 * Генерация sitemap.xml в dist/ из lessons.json.
 *
 * Раньше sitemap.xml лежал в корне репозитория с ручной lastmod —
 * даты гарантированно дрейфовали от контента. Теперь карта сайта
 * собирается на каждом билде из единственного источника истины.
 *
 * Запуск: node build-sitemap.mjs (после eleventy, до/вместо passthrough).
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const PROJECT = join(fileURLToPath(import.meta.url), '..');
const lessons = JSON.parse(readFileSync(join(PROJECT, 'lessons.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(PROJECT, 'src', '_data', 'site.json'), 'utf8'));

const baseUrl = (site.url || '').replace(/\/$/, '');
if (!baseUrl) {
  console.error('✖ src/_data/site.json: отсутствует url');
  process.exit(1);
}

const urls = [{ loc: `${baseUrl}/`, changefreq: 'weekly', priority: '1.0' }];

for (const section of lessons.sections) {
  for (const lesson of section.lessons) {
    urls.push({
      loc: `${baseUrl}/${lesson.file.replace(/\.(md|njk)$/i, '.html')}`,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }
}

// Дополнительные статические страницы
const EXTRA_PAGES = ['/final-test.html', '/repl.html', '/mindmap.html', '/cheatsheets.html'];
for (const page of EXTRA_PAGES) {
  urls.push({ loc: baseUrl + page, changefreq: 'monthly', priority: '0.6' });
}

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(PROJECT, 'dist', 'sitemap.xml'), xml, 'utf8');
console.log(`✔ sitemap.xml: ${urls.length} URL`);
