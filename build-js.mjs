/**
 * Бандлинг src/js/script.js (ES-модули) в единый script.js (IIFE, минифицированный).
 *
 * Раньше корневой script.js был сручную собранным минифицированным артефактом,
 * который не синхронизировался с src/js/modules/* — правки модулей не попадали в
 * прод. Теперь сборка идёт через esbuild (как уже сделано для highlight.py).
 *
 * Запуск: node build-js.mjs
 */
import * as esbuild from 'esbuild';
import { statSync } from 'fs';

const entry = 'src/js/script.js';
const outfile = 'dist/script.js';

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: 'iife',
  target: ['es2018'],
  platform: 'browser',
  outfile,
  legalComments: 'none',
});

const size = statSync(outfile).size;
console.log(`✔ script.js: ${(size / 1024).toFixed(1)} KB (bundled from ${entry})`);
