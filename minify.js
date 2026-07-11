/**
 * Пост-билд минификация CSS/JS.
 * Запускается после Eleventy.
 * CSS минифицируется из src/css/, JS — из src/js/ в dist/.
 */
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const Terser = require('terser');

const PROJECT = __dirname;
const SRC_JS = path.join(PROJECT, 'src', 'js');
const SRC_CSS = path.join(PROJECT, 'src', 'css');

// Файлы JS для минификации
const JS_FILES = [
  { name: 'config.js', srcDir: SRC_JS, reserved: [] },
  { name: 'repl.js', srcDir: SRC_JS, reserved: ['clearHistory', 'runRepl', 'runEditor'] },
  { name: 'mindmap.js', srcDir: SRC_JS, reserved: [] },
];

// Файл CSS для dev-сборки (сборка всех модульных стилей)
const DEV_CSS_SRC = path.join(SRC_CSS, 'index.css');
const DEV_CSS_DEST = path.join(PROJECT, 'dist', 'style.css');

// Файл CSS для prod-сборки (минифицированная версия)
const PROD_CSS_DEST = path.join(PROJECT, 'dist', 'styles.css');

/**
 * Собирает и минифицирует CSS для dev-сборки
 */
async function buildDevCSS() {
  if (!fs.existsSync(DEV_CSS_SRC)) {
    console.warn('⚠  index.css not found, skipping dev CSS build');
    return;
  }

  const content = fs.readFileSync(DEV_CSS_SRC, 'utf-8');
  const result = new CleanCSS({ level: 2 }).minify(content);

  if (result.errors.length) {
    console.error('✖ CSS errors:', result.errors);
    return;
  }

  fs.writeFileSync(DEV_CSS_DEST, result.styles, 'utf-8');
  const saved = (((content.length - result.styles.length) / content.length) * 100).toFixed(1);
  console.log(`✔ style.css (dev): ${content.length} → ${result.styles.length} bytes (${saved}%)`);
}

/**
 * Минифицирует dev CSS для prod-сборки
 */
async function buildProdCSS() {
  if (!fs.existsSync(DEV_CSS_DEST)) {
    console.warn('⚠  style.css not found, skipping prod CSS build');
    return;
  }

  const content = fs.readFileSync(DEV_CSS_DEST, 'utf-8');
  const result = new CleanCSS({ level: 2 }).minify(content);

  if (result.errors.length) {
    console.error('✖ CSS errors:', result.errors);
    return;
  }

  fs.writeFileSync(PROD_CSS_DEST, result.styles, 'utf-8');
  const saved = (((content.length - result.styles.length) / content.length) * 100).toFixed(1);
  console.log(`✔ styles.css (prod): ${content.length} → ${result.styles.length} bytes (${saved}%)`);
}

/**
 * Обрабатывает файлы JS
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
  let hasErrors = false;

  try {
    // 1. Собираем dev CSS из модульных файлов
    await buildDevCSS();

    // 2. Минифицируем для prod
    await buildProdCSS();

    // 3. Обрабатываем JS файлы
    await processJSFiles();

    console.log('\n✅ Пост-билд завершен успешно!');

  } catch (err) {
    console.error('❌ Пост-билд заверšen с ошибкой:', err);
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
