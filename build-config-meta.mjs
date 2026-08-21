/**
 * Генерирует LESSON_META, THEORY_CONTESTS и LESSON_BADGES в src/js/config/courseData.js из lessons.json.
 * Запуск: node build-config-meta.mjs
 *
 * lessons.json остаётся единственным источником истины для метаданных уроков.
 * Этот скрипт обновляет блоки LESSON_META, THEORY_CONTESTS и LESSON_BADGES
 * в courseData.js, сохраняя остальной код.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const lessons = JSON.parse(readFileSync(join(ROOT, 'lessons.json'), 'utf-8'));

// Собираем LESSON_META, THEORY_CONTESTS и LESSON_BADGES из sections
const meta = {};
const contests = {};
const lessonBadges = [];
for (const section of lessons.sections) {
  for (const lesson of section.lessons) {
    meta[lesson.num] = { duration: lesson.duration, complexity: lesson.complexity };
    if (lesson.contest !== undefined) {
      contests[lesson.num] = lesson.contest;
    }
    if (lesson.badge !== undefined) {
      lessonBadges.push({ num: lesson.num, id: lesson.badge, title: lesson.title, file: lesson.file });
    }
  }
}
lessonBadges.sort((a, b) => a.num - b.num);

// Форматируем как JS-объект
const metaLines = [];
for (const [num, data] of Object.entries(meta).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const padded = String(num).padStart(2, ' ');
  metaLines.push(`  ${padded}: { duration: ${data.duration}, complexity: '${data.complexity}' },`);
}

const contestLines = [];
for (const [num, id] of Object.entries(contests).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const padded = String(num).padStart(2, ' ');
  contestLines.push(`  ${padded}: ${id},`);
}

const badgeLines = [];
for (const lb of lessonBadges) {
  const padded = String(lb.num).padStart(2, ' ');
  const title = String(lb.title).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  badgeLines.push(`  { num: ${padded}, id: '${lb.id}', title: '${title}', file: '${lb.file}' },`);
}

// Читаем courseData.js
const configPath = join(ROOT, 'src', 'js', 'config', 'courseData.js');
const config = readFileSync(configPath, 'utf-8');
const allLines = config.split('\n');

/**
 * Находит диапазон генерируемого блока: строка-комментарий с именем блока
 * и пометкой «генерируется» ... завершающая строка '};' или '];'.
 * Пустой однострочный блок (const NAME = [];) тоже считается валидным.
 */
function findBlock(lines, name) {
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes(name) &&
      (lines[i].includes('is generated') || lines[i].includes('генерируется'))
    ) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return null;
  const declRe = new RegExp('^const\\s+' + name + '\\s*=');
  let declSeen = false;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!declSeen && declRe.test(lines[i])) {
      declSeen = true;
      if (/=\s*(\[\]|\{\});?$/.test(trimmed)) return [startIdx, i];
      continue;
    }
    if (declSeen && (trimmed === '};' || trimmed === '];')) return [startIdx, i];
  }
  return null;
}

const blocks = [
  {
    name: 'LESSON_META',
    range: findBlock(allLines, 'LESSON_META'),
    body: [
      '// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.',
      '// Источник истины — lessons.json, НЕ этот файл.',
      '// Для обновления: node build-config-meta.mjs',
      'const LESSON_META = {',
      ...metaLines,
      '};',
    ],
  },
  {
    name: 'THEORY_CONTESTS',
    range: findBlock(allLines, 'THEORY_CONTESTS'),
    body: [
      '// THEORY_CONTESTS генерируется из lessons.json (поле contest) скриптом build-config-meta.mjs.',
      '// Источник истины — lessons.json, НЕ этот файл.',
      '// Для обновления: node build-config-meta.mjs',
      'const THEORY_CONTESTS = {',
      ...contestLines,
      '};',
    ],
  },
  {
    name: 'LESSON_BADGES',
    range: findBlock(allLines, 'LESSON_BADGES'),
    body: [
      "// LESSON_BADGES генерируется из lessons.json (поле badge) скриптом build-config-meta.mjs.",
      '// Источник истины — lessons.json, НЕ этот файл.',
      '// Для обновления: node build-config-meta.mjs',
      'const LESSON_BADGES = [',
      ...badgeLines,
      '];',
    ],
  },
];

// Проверяем, что все блоки найдены
for (const block of blocks) {
  if (!block.range) {
    console.error(`Could not find ${block.name} block in courseData.js`);
    process.exit(1);
  }
}

// Заменяем блоки с конца файла, чтобы индексы не сбивались
let newLines = allLines;
const sorted = [...blocks].sort((a, b) => b.range[0] - a.range[0]);
for (const block of sorted) {
  const [startIdx, endIdx] = block.range;
  newLines = [...newLines.slice(0, startIdx), ...block.body, ...newLines.slice(endIdx + 1)];
}

writeFileSync(configPath, newLines.join('\n'), 'utf-8');
console.log(
  `✔ courseData.js обновлён: LESSON_META — ${Object.keys(meta).length} уроков, ` +
    `THEORY_CONTESTS — ${Object.keys(contests).length} контестов, ` +
    `LESSON_BADGES — ${lessonBadges.length} бейджей из lessons.json`,
);
