/**
 * Единый источник навигации/метаданных уроков.
 *
 * Раньше prevUrl/nextUrl/prevTitle/nextTitle/duration/complexity
 * дублировались в front matter каждого src/*.md И в lessons.json, что
 * неизбежно вело к рассинхрону. Теперь эти поля вычисляются на этапе
 * сборки из lessons.json (он же источник для LESSON_META и коллекции
 * sections), а из front matter они удалены. Добавить/поменять урок —
 * достаточно поправить lessons.json.
 *
 * Eleventy применяет этот глобальный файл данных как специальный ключ
 * `eleventyComputed` ко всем шаблонам. Функции получают объект data и
 * возвращают итоговое значение (переопределяя front matter).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lessons = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'lessons.json'), 'utf8'),
);

// Плоский упорядоченный список уроков (по номеру)
const FLAT = [];
for (const section of lessons.sections) {
  for (const lesson of section.lessons) {
    FLAT.push({
      num: lesson.num,
      file: lesson.file,
      title: lesson.title,
      duration: lesson.duration,
      complexity: lesson.complexity,
    });
  }
}
FLAT.sort((a, b) => a.num - b.num);

const BY_NUM = new Map(FLAT.map((l) => [l.num, l]));

function toUrl(file) {
  if (!file) return undefined;
  return file.replace(/\.(md|njk)$/i, '.html');
}

function neighbor(data, offset) {
  if (typeof data.lesson !== 'number') return undefined;
  const idx = FLAT.findIndex((l) => l.num === data.lesson);
  if (idx === -1) return undefined;
  const next = FLAT[idx + offset];
  return next || undefined;
}

export default {
  prevUrl: (data) => {
    const prev = neighbor(data, -1);
    return prev ? toUrl(prev.file) : undefined;
  },
  nextUrl: (data) => {
    const next = neighbor(data, +1);
    return next ? toUrl(next.file) : undefined;
  },
  prevTitle: (data) => neighbor(data, -1)?.title,
  nextTitle: (data) => neighbor(data, +1)?.title,
  duration: (data) => BY_NUM.get(data.lesson)?.duration,
  complexity: (data) => BY_NUM.get(data.lesson)?.complexity,
};
