/**
 * Content-hash для статических ассетов (style.css, script.js, config.js, …).
 *
 * Проблема: статика кэшируется на 1 год (CDN/браузер), поэтому после деплоя
 * новой версии клиенты могли получать старые файлы. Решение: добавляем в имя
 * файла хэш от содержимого и обновляем все ссылки в собранных HTML/JSON/SW.
 *
 * Запуск: node build-assets-hash.mjs  (в конце build:prod, после build-sw.mjs)
 */
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
  existsSync,
} from 'fs';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';

const ROOT = join(process.cwd(), 'dist');

const ASSETS = [
  'style.css',
  'script.js',
  'config.js',
  'highlight-py.min.js',
  'mindmap.js',
  'repl.js',
  'highlight-theme.min.css',
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'src',
  'sandbox',
  'tests',
  'playwright-report',
  '_site',
  '.github',
  'e2e',
  '.well-known',
  '_includes',
  '.husky',
  '.pytest_cache',
  'test-results',
]);

const REWRITE_FILES = new Set(['manifest.json', 'sw.js']);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── 1. Хэшируем и переименовываем ассеты ───
const hashes = {}; // оригинальное имя → хэшированное
for (const asset of ASSETS) {
  const src = join(ROOT, asset);
  if (!existsSync(src)) continue;

  const buf = readFileSync(src);
  const hash = createHash('md5').update(buf).digest('hex').slice(0, 8);
  const ext = extname(asset);
  const base = basename(asset, ext);
  const hashed = `${base}.${hash}${ext}`;
  hashes[asset] = hashed;

  // Удаляем старые хэшированные варианты этого ассета (чтобы не копились)
  for (const entry of readdirSync(ROOT)) {
    if (entry === hashed) continue;
    const re = new RegExp(`^${escapeRe(base)}\\.[a-f0-9]{8}\\${escapeRe(ext)}$`);
    if (re.test(entry)) {
      try {
        unlinkSync(join(ROOT, entry));
      } catch {
        /* ignore */
      }
    }
  }

  copyFileSync(src, join(ROOT, hashed));
  console.log(`✔ ${asset} → ${hashed}`);
}

// ─── 2. Обновляем ссылки во всех собранных файлах ───
function rewriteFile(file) {
  const content = readFileSync(file, 'utf-8');
  const keys = Object.keys(hashes).map(escapeRe);
  if (keys.length === 0) return;
  const re = new RegExp(`(^|[/"'>\`\\s])(${keys.join('|')})(?=["'<\\\`\\s]|$)`, 'g');
  const next = content.replace(re, (m, pre, asset) => pre + hashes[asset]);
  if (next !== content) writeFileSync(file, next, 'utf-8');
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (REWRITE_FILES.has(entry) || extname(entry) === '.html') {
      rewriteFile(full);
    }
  }
}

walk(ROOT);
console.log(`✔ Ссылки обновлены для ${Object.keys(hashes).length} ассетов`);
