'use strict';

// Simple build script — minify CSS and JS without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ---- Minifiers ----

function minifyCSS(css) {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove whitespace around {};:,
  css = css.replace(/\s*{\s*/g, '{');
  css = css.replace(/\s*}\s*/g, '}');
  css = css.replace(/\s*;\s*/g, ';');
  css = css.replace(/\s*:\s*/g, ':');
  css = css.replace(/\s*,\s*/g, ',');
  // Remove last semicolon before }
  css = css.replace(/;}/g, '}');
  // Collapse multiple spaces
  css = css.replace(/\s+/g, ' ');
  // Remove spaces around > + ~ in selectors
  css = css.replace(/\s*>\s*/g, '>');
  css = css.replace(/\s*\+\s*/g, '+');
  css = css.replace(/\s*~\s*/g, '~');
  // Trim
  css = css.trim();
  return css;
}

function minifyJS(js) {
  // Remove single-line comments
  js = js.replace(/\/\/.*$/gm, '');
  // Remove block comments (but not /*! comments)
  js = js.replace(/\/\*[^*!][\s\S]*?\*\//g, '');
  // Collapse whitespace (preserve newlines to avoid ASI issues)
  js = js.replace(/[ \t]+/g, ' ');
  // Remove spaces around operators/brackets
  js = js.replace(/ ?([{}();,:+\-*/<>=!&|?]) ?/g, (m, c) => c === '}' || c === '{' || c === ';' ? c : c);
  // Remove blank lines
  js = js.replace(/[\r\n]+/g, '\n');
  js = js.replace(/\n+/g, '\n');
  // Trim each line
  js = js.split('\n').map(l => l.trim()).join('\n');
  js = js.trim();
  return js;
}

// ---- Build ----

function build() {
  console.log('🔨 Building...');

  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
  }

  // Copy non-CSS/JS static files into dist
  const staticFiles = fs.readdirSync(ROOT)
    .filter(f => !f.startsWith('.') && !['dist', 'node_modules', 'sandbox', 'quizzes', 'build.js', 'package.json', 'package-lock.json'].includes(f));
  for (const file of staticFiles) {
    const srcPath = path.join(ROOT, file);
    const destPath = path.join(DIST, file);
    if (fs.statSync(srcPath).isFile()) {
      if (file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.xml') || file.endsWith('.txt') || file.endsWith('.php') || file.endsWith('.webmanifest')) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ ${file} (copied)`);
      } else if (file.endsWith('.css')) {
        const src = fs.readFileSync(srcPath, 'utf8');
        const min = minifyCSS(src);
        fs.writeFileSync(destPath, min, 'utf8');
        const ratio = ((1 - min.length / src.length) * 100).toFixed(0);
        console.log(`  ✅ ${file} → ${(src.length / 1024).toFixed(1)} KB → ${(min.length / 1024).toFixed(1)} KB (${ratio}%)`);
      } else if (file.endsWith('.js')) {
        const src = fs.readFileSync(srcPath, 'utf8');
        const min = minifyJS(src);
        fs.writeFileSync(destPath, min, 'utf8');
        const ratio = ((1 - min.length / src.length) * 100).toFixed(0);
        console.log(`  ✅ ${file} → ${(src.length / 1024).toFixed(1)} KB → ${(min.length / 1024).toFixed(1)} KB (${ratio}%)`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ ${file} (copied binary)`);
      }
    }
  }

  // Copy sandbox directory
  const sandboxSrc = path.join(ROOT, 'sandbox');
  const sandboxDest = path.join(DIST, 'sandbox');
  if (fs.existsSync(sandboxSrc)) {
    copyDir(sandboxSrc, sandboxDest);
    console.log('  ✅ sandbox/ (copied)');
  }

  // Copy quizzes directory
  const quizzesSrc = path.join(ROOT, 'quizzes');
  const quizzesDest = path.join(DIST, 'quizzes');
  if (fs.existsSync(quizzesSrc)) {
    copyDir(quizzesSrc, quizzesDest);
    console.log('  ✅ quizzes/ (copied)');
  }

  // Generate cache-busted hashes
  const hash = Date.now().toString(36);
  console.log(`\n📦 Build hash: ${hash}`);
  console.log('✔️  Build complete → dist/');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---- CLI ----

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  console.log('👀 Watching for changes... (Ctrl+C to stop)');
  build();
  // Simple polling watcher
  let lastBuild = Date.now();
  setInterval(() => {
    const files = fs.readdirSync(ROOT)
      .filter(f => ['.css', '.js'].some(ext => f.endsWith(ext)));
    let changed = false;
    for (const file of files) {
      const stat = fs.statSync(path.join(ROOT, file));
      if (stat.mtimeMs > lastBuild) {
        changed = true;
        break;
      }
    }
    if (changed) {
      lastBuild = Date.now();
      build();
    }
  }, 2000);
} else {
  build();
}
