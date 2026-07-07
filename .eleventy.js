const path = require("path");
const { DateTime } = require("luxon");

const PROJECT = __dirname;
const SRC = path.join(PROJECT, "src");

module.exports = function (eleventyConfig) {
  // Passthrough copy — статические файлы (уже в корне, не трогаем)
  // Уроки генерируются в корень, перезаписывая старые HTML

  // Фильтр для форматирования дат
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd.MM.yyyy"
    );
  });

  // Коллекция всех уроков (из Markdown файлов в src/)
  const lessonsGlob = path.join(SRC, "*.md");
  eleventyConfig.addCollection("lessons", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob(lessonsGlob)
      .sort((a, b) => a.data.lesson - b.data.lesson);
  });

  // Коллекции по секциям для index.njk
  eleventyConfig.addCollection("sections", function (collectionApi) {
    const lessons = collectionApi
      .getFilteredByGlob(lessonsGlob)
      .sort((a, b) => a.data.lesson - b.data.lesson);

    // Секции из lessons.json
    const sections = require(path.join(PROJECT, "lessons.json")).sections;
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
      output: PROJECT,
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};
