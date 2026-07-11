import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { createHash } from 'crypto';

const PROJECT = process.cwd();
const ROOT = join(PROJECT, 'dist');
const TEMPLATE = join(PROJECT, 'sw.js');
const SW_PATH = join(ROOT, 'sw.js');

// Directories to scan for precacheable assets
const SCAN_DIRS = ['', 'quizzes'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'tests',
  'sandbox',
  'src',
  '.github',
  'playwright-report',
  '_site',
  'e2e',
]);

// Файлы сборки/инструментария — не кэшируем как контент сайта
const SKIP_FILES =
  /^(playwright\.config|build-|minify|eslint\.config|vitest\.config)\.|package\.json|package-lock\.json|\.mjs$|tsconfig\.json|lighthouserc\.json/;

// Контент-хэшированные копии ассетов (style.3647cdfb.css и т.п.) — их
// не сканируем: ссылки на них появляются в PRECACHE через rewrite build-assets-hash.mjs.
const HASHED_ASSET = /\.[a-f0-9]{8}\.(css|js|png|ico|woff2)$/;

// File extensions to include in precache
const INCLUDE_EXTS = new Set(['.html', '.css', '.js', '.json', '.png', '.ico', '.txt', '.woff2']);

// Files to always include (even if not found by scan)
const ALWAYS_INCLUDE = [
  '/',
  '/offline.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/repl.js',
  '/mindmap.js',
  '/highlight-theme.min.css',
  '/highlight-py.min.js',
  '/favicon.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/manifest.json',
  '/robots.txt',
];

function scanDir(dir, base) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_FILES.test(entry)) continue;
    if (HASHED_ASSET.test(entry)) continue;
    if (entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    const relPath = '/' + relative(base, fullPath).replace(/\\/g, '/');

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...scanDir(fullPath, base));
    } else if (stat.isFile() && INCLUDE_EXTS.has(extname(entry))) {
      results.push(relPath);
    }
  }
  return results;
}

// Scan all directories
const files = new Set(ALWAYS_INCLUDE);
for (const subdir of SCAN_DIRS) {
  const dir = join(ROOT, subdir);
  for (const f of scanDir(dir, ROOT)) {
    files.add(f);
  }
}

// Sort for deterministic output
const sorted = [...files].sort();

// Generate PRECACHE block
const precacheBlock = `// Ресурсы, которые кэшируем сразу при установке SW
// Автоматически сгенерировано build-sw.mjs — не редактировать вручную
const PRECACHE = [
${sorted.map((f) => `  '${f}',`).join('\n')}
];`;

// Read template sw.js from project root
let sw = readFileSync(TEMPLATE, 'utf-8');

// Replace PRECACHE block
const startMarker = '// Ресурсы, которые кэшируем сразу при установке SW';
const endMarker = '// Установка: предварительное кэширование критических ресурсов';
const startIdx = sw.indexOf(startMarker);
const endIdx = sw.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find PRECACHE block markers in sw.js');
  process.exit(1);
}
sw = sw.slice(0, startIdx) + precacheBlock + '\n\n' + sw.slice(endIdx);

// Bump cache version with hash
const hash = createHash('md5').update(sw).digest('hex').slice(0, 8);
sw = sw.replace(/const CACHE_NAME = 'python-web-[^']*'/, `const CACHE_NAME = 'python-web-${hash}'`);

writeFileSync(SW_PATH, sw, 'utf-8');
console.log(`✔ sw.js updated: ${sorted.length} precache entries, cache=${hash}`);
