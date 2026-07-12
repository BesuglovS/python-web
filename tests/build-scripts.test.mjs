import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');

// ─── build-config-meta.mjs logic ───

describe('build-config-meta.mjs', () => {
  it('generates LESSON_META matching lessons.json', () => {
    const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'lessons.json'), 'utf-8'));
    const courseDataSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'js', 'config', 'courseData.js'),
      'utf-8',
    );

    const meta = {};
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        meta[lesson.num] = { duration: lesson.duration, complexity: lesson.complexity };
      }
    }

    for (const [num, data] of Object.entries(meta)) {
      const re = new RegExp(
        `${num}:\\s*\\{\\s*duration:\\s*${data.duration},\\s*complexity:\\s*'${data.complexity}'\\s*\\}`,
      );
      expect(courseDataSrc).toMatch(re);
    }
  });

  it('has entries for all 50 lessons in courseData.js', () => {
    const courseDataSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'js', 'config', 'courseData.js'),
      'utf-8',
    );
    const metaMatch = courseDataSrc.match(/const LESSON_META = \{([\s\S]*?)\};/);
    expect(metaMatch).not.toBeNull();

    const entries = metaMatch[1].match(/^\s*(\d+):\s*\{/gm);
    expect(entries).toHaveLength(50);
  });
});

// ─── lessons.json structure ───

describe('lessons.json', () => {
  const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'lessons.json'), 'utf-8'));

  it('has total = 50', () => {
    expect(lessons.total).toBe(50);
  });

  it('every lesson has required fields', () => {
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        expect(lesson.num).toBeGreaterThan(0);
        expect(typeof lesson.file).toBe('string');
        expect(typeof lesson.title).toBe('string');
        expect(typeof lesson.desc).toBe('string');
        expect(typeof lesson.duration).toBe('number');
        expect(['beginner', 'basic', 'intermediate', 'advanced']).toContain(lesson.complexity);
      }
    }
  });

  it('has sequential lesson numbers without gaps', () => {
    const nums = [];
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        nums.push(lesson.num);
      }
    }
    nums.sort((a, b) => a - b);
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
  });

  it('has sections with unique ids', () => {
    const ids = lessons.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── build-sw.mjs markers ───

describe('sw.js template', () => {
  const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf-8');

  it('has PRECACHE markers for build-sw.mjs', () => {
    expect(swSrc).toContain('// Ресурсы, которые кэшируем сразу при установке SW');
    expect(swSrc).toContain('// Установка: предварительное кэширование критических ресурсов');
  });

  it('has cache version placeholder', () => {
    expect(swSrc).toMatch(/const CACHE_NAME = 'python-web-[^']+'/);
  });

  it('has ALL mandatory precache entries', () => {
    const mandatory = ['/', '/index.html', '/offline.html', '/404.html'];
    for (const entry of mandatory) {
      expect(swSrc).toContain(`'${entry}'`);
    }
  });
});

// ─── build-assets-hash.mjs patterns ───

describe('build-assets-hash.mjs', () => {
  const src = fs.readFileSync(path.join(ROOT, 'build-assets-hash.mjs'), 'utf-8');

  it('defines ASSETS array with core files', () => {
    const assets = ['style.css', 'script.js'];
    for (const a of assets) {
      expect(src).toContain(`'${a}'`);
    }
  });

  it('uses MD5 for content hashing', () => {
    expect(src).toContain("createHash('md5')");
  });

  it('rewrites manifest.json and sw.js', () => {
    expect(src).toContain("'manifest.json'");
    expect(src).toContain("'sw.js'");
  });
});

// ─── build-highlight.mjs ───

describe('build-highlight.mjs', () => {
  const src = fs.readFileSync(path.join(ROOT, 'build-highlight.mjs'), 'utf-8');

  it('bundles highlight.js with Python language only', () => {
    expect(src).toContain("import python from 'highlight.js/lib/languages/python'");
    expect(src).toContain("hljs.registerLanguage('python', python)");
  });

  it('outputs to dist/highlight-py.min.js', () => {
    expect(src).toContain("outfile: 'dist/highlight-py.min.js'");
  });
});

// ─── minify.js ───

describe('minify.js', () => {
  const src = fs.readFileSync(path.join(ROOT, 'minify.js'), 'utf-8');

  it('minifies repl.js and mindmap.js via Terser', () => {
    expect(src).toContain("name: 'repl.js'");
    expect(src).toContain("name: 'mindmap.js'");
  });

  it('preserves window globals in repl.js minification', () => {
    expect(src).toContain("reserved: ['clearHistory', 'runRepl', 'runEditor']");
  });
});

// ─── Quiz files ───

describe('quiz files', () => {
  it('has quizzes for lessons 1-50', () => {
    const quizzesDir = path.join(ROOT, 'quizzes');
    for (let i = 1; i <= 50; i++) {
      const quizFile = path.join(quizzesDir, `${i}.json`);
      expect(fs.existsSync(quizFile), `quizzes/${i}.json missing`).toBe(true);
    }
  });

  it('has final-test.json', () => {
    expect(fs.existsSync(path.join(ROOT, 'quizzes', 'final-test.json'))).toBe(true);
  });

  it('each quiz has valid structure', () => {
    const quizzesDir = path.join(ROOT, 'quizzes');
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      expect(Array.isArray(quiz)).toBe(true);
      expect(quiz.length).toBeGreaterThan(0);
      for (const q of quiz) {
        expect(typeof q.question).toBe('string');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(typeof q.correct).toBe('number');
      }
    }
  });
});
