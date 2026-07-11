/**
 * Генерирует LESSON_META в src/js/config.js из lessons.json.
 * Запуск: node build-config-meta.mjs
 *
 * lessons.json остаётся единственным источником истины для метаданных уроков.
 * Этот скрипт обновляет блок LESSON_META в config.js, сохраняя остальной код.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const lessons = JSON.parse(readFileSync(join(ROOT, 'lessons.json'), 'utf-8'));

// Собираем LESSON_META из sections
const meta = {};
for (const section of lessons.sections) {
  for (const lesson of section.lessons) {
    meta[lesson.num] = { duration: lesson.duration, complexity: lesson.complexity };
  }
}

// Форматируем как JS-объект
const lines = [];
for (const [num, data] of Object.entries(meta).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const padded = String(num).padStart(2, ' ');
  lines.push(`  ${padded}: { duration: ${data.duration}, complexity: '${data.complexity}' },`);
}

// Читаем config.js и находим блок LESSON_META по строкам
const configPath = join(ROOT, 'src', 'js', 'config.js');
const config = readFileSync(configPath, 'utf-8');
const allLines = config.split('\n');

// Ищем начало блока LESSON_META (строка с комментарием)
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < allLines.length; i++) {
  if (
    allLines[i].includes(
      '// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.',
    )
  ) {
    startIdx = i;
  }
  if (startIdx !== -1 && allLines[i].trim() === '};' && i > startIdx + 1) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find LESSON_META block in config.js');
  process.exit(1);
}

// Собираем новый блок
const newBlock = [
  '// LESSON_META генерируется из lessons.json скриптом build-config-meta.mjs.',
  '// Источник истины — lessons.json, НЕ этот файл.',
  '// Для обновления: node build-config-meta.mjs',
  'const LESSON_META = {',
  ...lines,
  '};',
];

// Заменяем старый блок на новый
const newLines = [...allLines.slice(0, startIdx), ...newBlock, ...allLines.slice(endIdx + 1)];

writeFileSync(configPath, newLines.join('\n'), 'utf-8');
console.log(
  `✔ LESSON_META обновлён в config.js: ${Object.keys(meta).length} уроков из lessons.json`,
);
