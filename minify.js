/**
 * Пост-билд минификация CSS/JS.
 * Запускается после Eleventy.
 * CSS минифицируется из корня, JS — из src/js/ в корень.
 */
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const Terser = require('terser');

const PROJECT = __dirname;
const SRC_JS = path.join(PROJECT, 'src', 'js');

const FILES = [
  { name: 'style.css', type: 'css', srcDir: PROJECT },
  { name: 'config.js', type: 'js', srcDir: SRC_JS, reserved: [] },
  {
    name: 'repl.js',
    type: 'js',
    srcDir: SRC_JS,
    reserved: ['clearHistory', 'runRepl', 'runEditor'],
  },
  { name: 'mindmap.js', type: 'js', srcDir: SRC_JS, reserved: [] },
];

// Примечание: script.js собирается отдельно через build-js.mjs (esbuild бандлит
// ES-модули из src/js/modules/*), поэтому здесь он не обрабатывается.

async function main() {
  let hasErrors = false;
  for (const file of FILES) {
    const srcPath = path.join(file.srcDir, file.name);
    const destPath = path.join(PROJECT, 'dist', file.name);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠  ${file.name} not found at ${srcPath}, skipping`);
      continue;
    }

    const content = fs.readFileSync(srcPath, 'utf-8');

    if (file.type === 'css') {
      const result = new CleanCSS({ level: 2 }).minify(content);
      if (result.errors.length) {
        console.error(`✖ ${file.name} CSS errors:`, result.errors);
        hasErrors = true;
        continue;
      }
      fs.writeFileSync(destPath, result.styles, 'utf-8');
      const saved = (((content.length - result.styles.length) / content.length) * 100).toFixed(1);
      console.log(`✔ ${file.name}: ${content.length} → ${result.styles.length} bytes (${saved}%)`);
    } else {
      const result = await Terser.minify(content, {
        compress: { passes: 2 },
        mangle: { reserved: file.reserved || [] },
      });
      if (result.error) {
        console.error(`✖ ${file.name} JS error:`, result.error);
        hasErrors = true;
        continue;
      }
      fs.writeFileSync(destPath, result.code, 'utf-8');
      const saved = (((content.length - result.code.length) / content.length) * 100).toFixed(1);
      console.log(`✔ ${file.name}: ${content.length} → ${result.code.length} bytes (${saved}%)`);
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
