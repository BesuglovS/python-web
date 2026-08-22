import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import norunPlugin from './src/_plugins/norun.mjs';

const __filename = fileURLToPath(import.meta.url);
const PROJECT = path.dirname(__filename);
const SRC = path.join(PROJECT, 'src');

export default function (eleventyConfig) {
  // markdown-it: enable raw HTML (needed for <!-- norun --> comments)
  eleventyConfig.amendLibrary('md', (md) => {
    md.set({ html: true });
    md.use(norunPlugin);
  });
  // Passthrough copy — статические файлы, которые не обрабатываются сборкой
  // CSS собирается esbuild в minify.js / build:css → dist/style.css

  // Изображения
  eleventyConfig.addPassthroughCopy({ 'favicon.png': 'favicon.png' });
  eleventyConfig.addPassthroughCopy({ 'favicon-192x192.png': 'favicon-192x192.png' });
  eleventyConfig.addPassthroughCopy({ 'favicon-512x512.png': 'favicon-512x512.png' });
  eleventyConfig.addPassthroughCopy({ 'favicon-32x32.png': 'favicon-32x32.png' });
  eleventyConfig.addPassthroughCopy({ 'favicon.webp': 'favicon.webp' });
  eleventyConfig.addPassthroughCopy({ 'apple-touch-icon.png': 'apple-touch-icon.png' });
  eleventyConfig.addPassthroughCopy({ 'og-image.png': 'og-image.png' });

  // Данные
  eleventyConfig.addPassthroughCopy({ 'lessons.json': 'lessons.json' });
  eleventyConfig.addPassthroughCopy({ quizzes: 'quizzes' });

  // Статика
  eleventyConfig.addPassthroughCopy({ '.htaccess': '.htaccess' });
  eleventyConfig.addPassthroughCopy({ 'robots.txt': 'robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'sitemap.xml': 'sitemap.xml' });
  eleventyConfig.addPassthroughCopy({ 'offline.html': 'offline.html' });
  eleventyConfig.addPassthroughCopy({ 'highlight-theme.min.css': 'highlight-theme.min.css' });
  eleventyConfig.addPassthroughCopy({ 'manifest.json': 'manifest.json' });
  eleventyConfig.addPassthroughCopy({ 'src/js/tracking-client.js': 'tracking-client.js' });

  // PHP-песочница
  eleventyConfig.addPassthroughCopy({ sandbox: 'sandbox' });

  // Фильтр для форматирования дат
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd.MM.yyyy');
  });

  eleventyConfig.addFilter('date', (dateObj, format) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(format);
  });

  // Коллекция всех уроков (из Markdown файлов в src/)
  const lessonsGlob = path.join(SRC, '*.md');
  eleventyConfig.addCollection('lessons', function (collectionApi) {
    return collectionApi
      .getFilteredByGlob(lessonsGlob)
      .sort((a, b) => a.data.lesson - b.data.lesson);
  });

  // Коллекции по секциям для index.njk
  eleventyConfig.addCollection('sections', function (collectionApi) {
    const lessons = collectionApi
      .getFilteredByGlob(lessonsGlob)
      .sort((a, b) => a.data.lesson - b.data.lesson);

    // Секции из lessons.json
    const sections = JSON.parse(
      fs.readFileSync(path.join(PROJECT, 'lessons.json'), 'utf8'),
    ).sections;
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      lessons: section.lessons.map((l) => {
        const found = lessons.find((item) => item.data.lesson === l.num);
        return {
          ...l,
          url: found ? found.url : l.file,
        };
      }),
    }));
  });

  // ─── Dev/serve: пересборка JS/CSS при изменении исходников ───
  // `npm run build`/`build:prod` собирают JS/CSS/CSS-хайлайтер явно, но в
  // режиме `watch` (eleventy --serve) Eleventy не пересобирает внешние
  // ассеты. Отслеживаем src/js и src/css и пересобираем их после каждой
  // пересборки Eleventy, чтобы dist/ оставался актуальным и браузер
  // получал свежие script.js/config.js/style.css.
  eleventyConfig.addWatchTarget('src/js');
  eleventyConfig.addWatchTarget('src/css');

  eleventyConfig.on('eleventy.after', () => {
    try {
      execSync('node build-css.mjs && node build-js.mjs && node minify.cjs', {
        stdio: 'inherit',
        shell: true,
      });
    } catch (_e) {
      console.error('⚠ Не удалось пересобрать JS/CSS в режиме watch');
    }
  });

  return {
    dir: {
      input: SRC,
      output: path.join(PROJECT, 'dist'),
      includes: '_includes',
      data: '_data',
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html'],
  };
}
