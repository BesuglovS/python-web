/**
 * Пост-билд минификация CSS/JS.
 * Запускается после Eleventy.
 * Минифицирует: style.css, script.js, config.js, repl.js, ga.js, mindmap.js
 */
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const Terser = require('terser');

const PROJECT = __dirname;

const FILES = [
  { name: 'style.css', type: 'css' },
  { name: 'script.js', type: 'js', reserved: ['escapeHtml', '__themeUtils'] },
  { name: 'config.js', type: 'js', reserved: [] },
  { name: 'repl.js', type: 'js', reserved: ['clearHistory', 'runRepl', 'runEditor'] },
  { name: 'ga.js', type: 'js', reserved: [] },
  { name: 'mindmap.js', type: 'js', reserved: [] },
];

async function main() {
  let hasErrors = false;
  for (const file of FILES) {
    const filePath = path.join(PROJECT, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠  ${file.name} not found, skipping`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (file.type === 'css') {
      const result = new CleanCSS({ level: 2 }).minify(content);
      if (result.errors.length) {
        console.error(`✖ ${file.name} CSS errors:`, result.errors);
        hasErrors = true;
        continue;
      }
      fs.writeFileSync(filePath, result.styles, 'utf-8');
      const saved = ((content.length - result.styles.length) / content.length * 100).toFixed(1);
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
      fs.writeFileSync(filePath, result.code, 'utf-8');
      const saved = ((content.length - result.code.length) / content.length * 100).toFixed(1);
      console.log(`✔ ${file.name}: ${content.length} → ${result.code.length} bytes (${saved}%)`);
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
