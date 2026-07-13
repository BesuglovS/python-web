/**
 * Пост-билд сборка CSS и минификация JS.
 * Запускается после Eleventy.
 *
 * CSS: esbuild бандлит модули из src/css/index.css → dist/style.css
 * JS:  Terser минифицирует repl.js и mindmap.js
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const Terser = require('terser');

const PROJECT = __dirname;
const SRC_JS = path.join(PROJECT, 'src', 'js');
const SRC_CSS = path.join(PROJECT, 'src', 'css');

const CSS_ENTRY = path.join(SRC_CSS, 'index.css');
const CSS_OUT = path.join(PROJECT, 'dist', 'style.css');

// Файлы JS для минификации (classic scripts)
const JS_FILES = [
  { name: 'repl.js', srcDir: SRC_JS, reserved: ['clearHistory', 'runRepl', 'runEditor'] },
  { name: 'mindmap.js', srcDir: SRC_JS, reserved: [] },
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
 * Минифицирует JS файлы через Terser
 */
async function processJSFiles() {
  for (const file of JS_FILES) {
    const srcPath = path.join(file.srcDir, file.name);
    const destPath = path.join(PROJECT, 'dist', file.name);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠  ${file.name} not found at ${srcPath}, skipping`);
      continue;
    }

    const content = fs.readFileSync(srcPath, 'utf-8');

    const result = await Terser.minify(content, {
      compress: { passes: 2 },
      mangle: { reserved: file.reserved || [] },
    });

    if (result.error) {
      console.error(`✖ ${file.name} JS error:`, result.error);
      continue;
    }

    fs.writeFileSync(destPath, result.code, 'utf-8');
    const saved = (((content.length - result.code.length) / content.length) * 100).toFixed(1);
    console.log(`✔ ${file.name}: ${content.length} → ${result.code.length} bytes (${saved}%)`);
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
