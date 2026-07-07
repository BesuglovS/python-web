'use strict';

/**
 * Конвертирует статические HTML-уроки в Markdown с frontmatter для Eleventy.
 * Запуск: node convert-lessons.js
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const lessonsMeta = require('./lessons.json');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

// Собираем плоский массив всех уроков из lessons.json
const allLessons = [];
for (const section of lessonsMeta.sections) {
  for (const lesson of section.lessons) {
    allLessons.push(lesson);
  }
}

// Карта: num -> метаданные
const metaMap = {};
for (const l of allLessons) {
  metaMap[l.num] = l;
}

// Настройка Turndown с кастомными правилами
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  preformattedCode: true,
});

// Правило для <pre class="code-block"> — преобразуем в fenced code block
turndownService.addRule('codeBlock', {
  filter: function (node) {
    return (
      node.nodeName === 'PRE' &&
      node.classList.contains('code-block')
    );
  },
  replacement: function (content, node) {
    // Извлекаем текст без HTML-сущностей
    const code = node.textContent || '';
    return '\n```python\n' + code.trim() + '\n```\n';
  },
});

// Правило для <div class="tip">
turndownService.addRule('tip', {
  filter: function (node) {
    return (
      node.nodeName === 'DIV' &&
      node.classList.contains('tip')
    );
  },
  replacement: function (content) {
    return '\n> **💡 Совет:** ' + content.trim() + '\n';
  },
});

// Правило для <div class="note">
turndownService.addRule('note', {
  filter: function (node) {
    return (
      node.nodeName === 'DIV' &&
      node.classList.contains('note')
    );
  },
  replacement: function (content) {
    return '\n> **⚠️ Важно:** ' + content.trim() + '\n';
  },
});

// Правило для <p class="note"> (иногда используется как класс на p)
turndownService.addRule('pNote', {
  filter: function (node) {
    return (
      node.nodeName === 'P' &&
      node.classList.contains('note')
    );
  },
  replacement: function (content) {
    return '\n> **⚠️ Важно:** ' + content.trim() + '\n';
  },
});

// Правило для <strong> внутри tip/note — уже обрабатывается выше
// Убираем лишние пробелы в code
turndownService.addRule('inlineCode', {
  filter: function (node) {
    return node.nodeName === 'CODE';
  },
  replacement: function (content) {
    return '`' + content + '`';
  },
});

// Правило для <table> — Turndown плохо конвертирует таблицы, используем HTML
turndownService.addRule('table', {
  filter: ['table'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  },
});

/**
 * Извлекает номер урока из атрибута data-lesson на body
 */
function extractLessonNum(html) {
  const match = html.match(/data-lesson="(\d+)"/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Извлекает содержимое .main-content (внутренности уроков)
 */
function extractBodyContent(html) {
  // Ищем всё между <div class="main-content"> и ближайшим </div> (конец main-content)
  // Но проще — найти начало и конец по структуре
  const startMarker = '<div class="main-content">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';

  // Ищем закрывающий </div> который соответствует main-content
  // Простой подход: обрезаем всё после начала и ищем закрывающие div
  let rest = html.substring(startIdx + startMarker.length);
  // Найти закрывающий div который соответствует main-content (он прямо перед </footer> или </div> закрывающим content-layout)
  // Ищем: сначала идёт </div> закрывающий main-content, потом </div> закрывающий content-layout
  // Можно найти позицию первого </div> который идёт перед следующим </div>
  // Более надёжно: найти </div>\n      </div>\n      <footer (или </div>\n    </div>\n    <footer)

  const endPatterns = [
    '</div>\n      </div>',
    '</div>\n    </div>',
  ];

  let endIdx = rest.length;
  for (const pattern of endPatterns) {
    const idx = rest.indexOf(pattern);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  rest = rest.substring(0, endIdx).trim();

  // Убираем отступы в начале строк (2 пробела)
  rest = rest.replace(/^          /gm, '');

  return rest;
}

/**
 * Извлекает title из h1 (без span.lesson-badge)
 */
function extractTitle(html) {
  // Ищем <h1>...содержимое...</h1>
  const h1Match = html.match(/<h1>(.*?)<\/h1>/s);
  if (!h1Match) return 'Урок';

  let h1Content = h1Match[1];
  // Убираем span с классом lesson-badge
  h1Content = h1Content.replace(/<span class="lesson-badge">.*?<\/span>\s*/, '');
  // Убираем HTML-теги
  h1Content = h1Content.replace(/<[^>]+>/g, '').trim();
  return h1Content;
}

/**
 * Извлекает subtitle из p.subtitle
 */
function extractSubtitle(html) {
  const match = html.match(/<p class="subtitle">(.*?)<\/p>/s);
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, '').trim();
}

/**
 * Конвертирует один HTML-файл в Markdown с frontmatter
 */
function convertFile(htmlFile) {
  const htmlPath = path.join(ROOT, htmlFile);
  if (!fs.existsSync(htmlPath)) {
    console.log(`  ⚠️  Файл не найден: ${htmlFile}`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  const lessonNum = extractLessonNum(html);
  if (!lessonNum) {
    console.log(`  ⚠️  Номер урока не найден в: ${htmlFile}`);
    return;
  }

  const meta = metaMap[lessonNum];
  if (!meta) {
    console.log(`  ⚠️  Метаданные не найдены для урока ${lessonNum}`);
    return;
  }

  const title = extractTitle(html);
  const subtitle = extractSubtitle(html);
  const bodyHtml = extractBodyContent(html);

  // Конвертируем HTML тела в Markdown
  let bodyMd = turndownService.turndown(bodyHtml);

  // Очищаем пустые строки
  bodyMd = bodyMd.replace(/\n{3,}/g, '\n\n');
  bodyMd = bodyMd.trim();

    // Экранирование YAML-строк (заменяем опасные символы)
  function yamlEscape(str) {
    // Если есть двойные кавычки или спецсимволы — оборачиваем в одинарные и удваиваем одинарные внутри
    if (str.includes('"') || str.includes('{') || str.includes('}') || str.includes('=') || str.includes(':') || str.includes('#')) {
      return "'" + str.replace(/'/g, "''") + "'";
    }
    return '"' + str + '"';
  }

  // Формируем Markdown с frontmatter
  const frontmatter = [
    '---',
    `title: ${yamlEscape(title)}`,
    `lesson: ${lessonNum}`,
    `description: ${yamlEscape(meta.desc)}`,
    `duration: ${meta.duration}`,
    `complexity: "${meta.complexity}"`,
    `badge: "${meta.badge}"`,
    `file: "${htmlFile}"`,
    `layout: "layout.njk"`,
    `permalink: "${htmlFile}"`,
    ...(subtitle ? [`subtitle: ${yamlEscape(subtitle)}`] : []),
  ];

  // Вычисляем предыдущий и следующий уроки
  const sortedNums = allLessons.map(l => l.num).sort((a, b) => a - b);
  const idx = sortedNums.indexOf(lessonNum);

  if (idx > 0) {
    const prevNum = sortedNums[idx - 1];
    const prevMeta = metaMap[prevNum];
    frontmatter.push(`prevUrl: "${prevMeta.file}"`);
    frontmatter.push(`prevTitle: "${prevMeta.title}"`);
  }

  if (idx < sortedNums.length - 1) {
    const nextNum = sortedNums[idx + 1];
    const nextMeta = metaMap[nextNum];
    frontmatter.push(`nextUrl: "${nextMeta.file}"`);
    frontmatter.push(`nextTitle: "${nextMeta.title}"`);
  }

  frontmatter.push('---');
  frontmatter.push('');
  frontmatter.push(bodyMd);
  frontmatter.push('');

  const mdContent = frontmatter.join('\n');

  // Имя выходного файла
  const mdFileName = htmlFile.replace('.html', '.md');
  const mdPath = path.join(SRC, mdFileName);

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`  ✅ ${htmlFile} → src/${mdFileName} (урок ${lessonNum})`);
}

// Главная функция
function main() {
  console.log('🔧 Конвертация HTML-уроков в Markdown...\n');

  if (!fs.existsSync(SRC)) {
    fs.mkdirSync(SRC, { recursive: true });
  }

  // Получаем список всех HTML-файлов уроков (##-*.html)
  const htmlFiles = fs.readdirSync(ROOT)
    .filter(f => /^\d{2}-.+\.html$/.test(f))
    .sort();

  console.log(`Найдено ${htmlFiles.length} HTML-файлов\n`);

  let count = 0;
  for (const file of htmlFiles) {
    convertFile(file);
    count++;
  }

  console.log(`\n✔️  Сконвертировано: ${count} уроков → src/*.md`);
}

main();
