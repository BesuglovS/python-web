import * as esbuild from 'esbuild';

// Custom highlight.js bundle: core + Python only
const entry = `
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
hljs.registerLanguage('python', python);
window.hljs = hljs;
`;

await esbuild.build({
  stdin: {
    contents: entry,
    resolveDir: '.',
    sourcefile: 'highlight-custom.js',
  },
  bundle: true,
  minify: true,
  outfile: 'dist/highlight-py.min.js',
  format: 'iife',
  target: 'es2017',
  platform: 'browser',
});

const fs = await import('fs');
const stat = fs.statSync('dist/highlight-py.min.js');
console.log(`✔ highlight-py.min.js: ${(stat.size / 1024).toFixed(1)} KB`);
