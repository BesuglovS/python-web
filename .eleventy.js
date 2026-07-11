const path = require('path');
const { DateTime } = require('luxon');

const PROJECT = __dirname;
const SRC = path.join(PROJECT, 'src');

module.exports = function (eleventyConfig) {
  // Passthrough copy — статические файлы, которые не обрабатываются сборкой
  eleventyConfig.addPassthroughCopy({ 'src/js/ym-init.js': 'ym-init.js' });

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

  // PHP-песочница
  eleventyConfig.addPassthroughCopy({ sandbox: 'sandbox' });

  // Фильтр для форматирования дат
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd.MM.yyyy');
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
    const sections = require(path.join(PROJECT, 'lessons.json')).sections;
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
};
