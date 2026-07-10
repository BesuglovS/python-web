'use strict';

// Simple build script — minify CSS and JS without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ---- Whitelist: only these files and directories go to dist/ ----

// Exact file names to include
const INCLUDE_FILES = [
  // HTML pages
  'index.html', 'cheatsheets.html', 'final-test.html', 'mindmap.html',
  'offline.html', 'repl.html',
  // CSS
  'style.css', 'highlight-theme.min.css',
  // JS
  'script.js', 'ga.js', 'sw.js', 'highlight-py.min.js', 'mindmap.js',
  'repl.js', 'config.js',
  // Data / SEO
  'lessons.json', 'manifest.json', 'sitemap.xml', 'robots.txt',
  // Icons
  'favicon.png', 'favicon.webp', 'apple-touch-icon.png',
  'favicon-32x32.png', 'favicon-192x192.png', 'favicon-512x512.png',
  // Server
  '.htaccess', 'router.php',
];

// Directories to copy recursively
const INCLUDE_DIRS = [
  'sandbox',
  'quizzes',
];

// ---- Helpers ----

// Returns true if the file name matches a numbered lesson pattern: NN-*.html
function isLessonFile(name) {
  return /^\d{2}-.+\.html$/.test(name);
}

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

function processFile(file, srcPath, destPath) {
  const ext = path.extname(file).toLowerCase();

  if (ext === '.css') {
    const src = fs.readFileSync(srcPath, 'utf8');
    const min = minifyCSS(src);
    fs.writeFileSync(destPath, min, 'utf8');
    const ratio = ((1 - min.length / src.length) * 100).toFixed(0);
    console.log(`  ✅ ${file} → ${(src.length / 1024).toFixed(1)} KB → ${(min.length / 1024).toFixed(1)} KB (${ratio}%)`);
  } else if (ext === '.js') {
    const src = fs.readFileSync(srcPath, 'utf8');
    const min = minifyJS(src);
    fs.writeFileSync(destPath, min, 'utf8');
    const ratio = ((1 - min.length / src.length) * 100).toFixed(0);
    console.log(`  ✅ ${file} → ${(src.length / 1024).toFixed(1)} KB → ${(min.length / 1024).toFixed(1)} KB (${ratio}%)`);
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ ${file} (copied)`);
  }
}

function build() {
  console.log('🔨 Building...');

  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
  }

  // 1. Copy exact whitelisted files
  const allFiles = fs.readdirSync(ROOT);
  const includedSet = new Set(INCLUDE_FILES);

  for (const file of allFiles) {
    const isDir = fs.statSync(path.join(ROOT, file)).isDirectory();
    if (isDir) continue;

    // Skip dot-files except those explicitly whitelisted (e.g., .htaccess)
    if (file.startsWith('.') && !includedSet.has(file)) continue;

    if (includedSet.has(file) || isLessonFile(file)) {
      processFile(file, path.join(ROOT, file), path.join(DIST, file));
    }
  }

  // 2. Copy whitelisted directories
  for (const dir of INCLUDE_DIRS) {
    const srcDir = path.join(ROOT, dir);
    const destDir = path.join(DIST, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, destDir);
      console.log(`  ✅ ${dir}/ (copied)`);
    }
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
      .filter(f => ['.css', '.js', '.html'].some(ext => f.endsWith(ext)));
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
