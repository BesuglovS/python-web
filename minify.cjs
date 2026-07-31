/**
 * Пост-билд сборка CSS и JS.
 * Запускается после Eleventy.
 *
 * CSS: esbuild бандлит модули из src/css/index.css → dist/style.css
 * JS:  esbuild бандлит + минифицирует страничные скрипты
 *      (repl.js, mindmap.js, cheatsheets.js) → dist/*.js
 *      Бандлинг обязателен: repl.js импортирует ./config/* и ./modules/*.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const PROJECT = __dirname;
const SRC_JS = path.join(PROJECT, 'src', 'js');
const SRC_CSS = path.join(PROJECT, 'src', 'css');

const CSS_ENTRY = path.join(SRC_CSS, 'index.css');
const CSS_OUT = path.join(PROJECT, 'dist', 'style.css');

// Файлы JS для бандлинга (классические скрипты, доступны глобально на своих страницах)
const JS_FILES = [
  { name: 'repl.js' },
  { name: 'mindmap.js' },
  { name: 'cheatsheets.js' },
];

/**
 * Собирает CSS из модулей через esbuild (bundle + minify)
 */
async function buildCSS() {
  if (!fs.existsSync(CSS_ENTRY)) {
    console.warn('⚠  src/css/index.css not found, skipping CSS build');
    return;
  }

  const distDir = path.dirname(CSS_OUT);
  for (const f of fs.readdirSync(distDir)) {
    if (/^style\.[a-f0-9]{8}\.css$/.test(f)) {
      try { fs.unlinkSync(path.join(distDir, f)); } catch { /* ignore */ }
    }
  }

  await esbuild.build({
    entryPoints: [CSS_ENTRY],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: CSS_OUT,
    legalComments: 'none',
  });

  const size = fs.statSync(CSS_OUT).size;
  console.log(`✔ style.css: ${(size / 1024).toFixed(1)} KB (bundled from src/css/index.css)`);
}

/**
 * Бандлит и минифицирует страничные JS-скрипты через esbuild (IIFE).
 */
async function processJSFiles() {
  for (const file of JS_FILES) {
    const srcPath = path.join(SRC_JS, file.name);
    const destPath = path.join(PROJECT, 'dist', file.name);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠  ${file.name} not found at ${srcPath}, skipping`);
      continue;
    }

    try {
      await esbuild.build({
        entryPoints: [srcPath],
        bundle: true,
        minify: true,
        sourcemap: false,
        format: 'iife',
        target: ['es2018'],
        platform: 'browser',
        outfile: destPath,
        legalComments: 'none',
      });
      console.log(`✔ ${file.name}: bundled → dist/${file.name}`);
    } catch (err) {
      console.error(`✖ ${file.name} bundle error:`, err);
    }
  }
}

async function main() {
  try {
    await buildCSS();
    await processJSFiles();
    console.log('\n✅ Пост-билд завершен успешно!');
  } catch (err) {
    console.error('❌ Пост-билд завершен с ошибкой:', err);
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
