/**
 * Сборка CSS из модулей через esbuild (без минификации, для dev-режима).
 *
 * src/css/index.css (с @import) → dist/style.css (бандл)
 *
 * Запуск: node build-css.mjs
 */
import * as esbuild from 'esbuild';
import { statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const entry = 'src/css/index.css';
const outdir = 'dist';
const outfile = join(outdir, 'style.css');

// Удаляем старые хэшированные копии (style.abc12345.css)
for (const f of readdirSync(outdir)) {
  if (/^style\.[a-f0-9]{8}\.css$/.test(f)) {
    try { unlinkSync(join(outdir, f)); } catch { /* ignore */ }
  }
}

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  minify: false,
  sourcemap: false,
  outfile,
  legalComments: 'none',
});

const size = statSync(outfile).size;
console.log(`✔ style.css: ${(size / 1024).toFixed(1)} KB (dev bundle from ${entry})`);
