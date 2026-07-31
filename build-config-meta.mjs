/**
 * Генерирует LESSON_META и THEORY_CONTESTS в src/js/config/courseData.js из lessons.json.
 * Запуск: node build-config-meta.mjs
 *
 * lessons.json остаётся единственным источником истины для метаданных уроков.
 * Этот скрипт обновляет блоки LESSON_META и THEORY_CONTESTS в courseData.js,
 * сохраняя остальной код.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const lessons = JSON.parse(readFileSync(join(ROOT, 'lessons.json'), 'utf-8'));

// Собираем LESSON_META и THEORY_CONTESTS из sections
const meta = {};
const contests = {};
for (const section of lessons.sections) {
  for (const lesson of section.lessons) {
    meta[lesson.num] = { duration: lesson.duration, complexity: lesson.complexity };
    if (lesson.contest !== undefined) {
      contests[lesson.num] = lesson.contest;
    }
  }
}

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

// Читаем courseData.js и находим блок LESSON_META по строкам
const configPath = join(ROOT, 'src', 'js', 'config', 'courseData.js');
const config = readFileSync(configPath, 'utf-8');
const allLines = config.split('\n');

// Ищем начало блока LESSON_META (строка с комментарием)
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < allLines.length; i++) {
  if (
    allLines[i].includes('LESSON_META') &&
    (allLines[i].includes('is generated') || allLines[i].includes('генерируется'))
  ) {
    startIdx = i;
  }
  if (startIdx !== -1 && allLines[i].trim() === '};' && i > startIdx + 1) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find LESSON_META block in courseData.js');
  process.exit(1);
}

// Ищем начало блока THEORY_CONTESTS (строка с комментарием)
let tcStartIdx = -1;
let tcEndIdx = -1;
for (let i = 0; i < allLines.length; i++) {
  if (
    allLines[i].includes('THEORY_CONTESTS') &&
    (allLines[i].includes('is generated') || allLines[i].includes('генерируется'))
  ) {
    tcStartIdx = i;
  }
  if (tcStartIdx !== -1 && allLines[i].trim() === '};' && i > tcStartIdx + 1) {
    tcEndIdx = i;
    break;
  }
}

if (tcStartIdx === -1 || tcEndIdx === -1) {
  console.error('Could not find THEORY_CONTESTS block in courseData.js');
  process.exit(1);
}

// Собираем новые блоки
const newMetaBlock = [
  '// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.',
  '// Источник истины — lessons.json, НЕ этот файл.',
  '// Для обновления: node build-config-meta.mjs',
  'const LESSON_META = {',
  ...metaLines,
  '};',
];

const newTcBlock = [
  '// THEORY_CONTESTS генерируется из lessons.json (поле contest) скриптом build-config-meta.mjs.',
  '// Источник истины — lessons.json, НЕ этот файл.',
  '// Для обновления: node build-config-meta.mjs',
  'const THEORY_CONTESTS = {',
  ...contestLines,
  '};',
];

// Заменяем старые блоки на новые (замена с конца файла, чтобы индексы не сбивались)
let newLines = allLines;
if (tcEndIdx > endIdx) {
  newLines = [
    ...newLines.slice(0, tcStartIdx),
    ...newTcBlock,
    ...newLines.slice(tcEndIdx + 1),
  ];
  newLines = [
    ...newLines.slice(0, startIdx),
    ...newMetaBlock,
    ...newLines.slice(endIdx + 1),
  ];
} else {
  newLines = [
    ...newLines.slice(0, startIdx),
    ...newMetaBlock,
    ...newLines.slice(endIdx + 1),
  ];
  newLines = [
    ...newLines.slice(0, tcStartIdx),
    ...newTcBlock,
    ...newLines.slice(tcEndIdx + 1),
  ];
}

writeFileSync(configPath, newLines.join('\n'), 'utf-8');
console.log(
  `✔ courseData.js обновлён: LESSON_META — ${Object.keys(meta).length} уроков, THEORY_CONTESTS — ${Object.keys(contests).length} контестов из lessons.json`,
);
