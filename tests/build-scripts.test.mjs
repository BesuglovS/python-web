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

  it('generates LESSON_BADGES matching lessons.json', () => {
    const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'lessons.json'), 'utf-8'));
    const courseDataSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'js', 'config', 'courseData.js'),
      'utf-8',
    );

    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        expect(courseDataSrc).toMatch(
          new RegExp(`num:\\s*${lesson.num},\\s*id:\\s*'${lesson.badge}'`),
        );
        expect(courseDataSrc).toMatch(
          new RegExp(`num:\\s*${lesson.num},[^\\n]*file:\\s*'${lesson.file}'`),
        );
      }
    }
  });

  it('LESSON_BADGES has entries for all 50 lessons', () => {
    const courseDataSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'js', 'config', 'courseData.js'),
      'utf-8',
    );
    const badgesMatch = courseDataSrc.match(/const LESSON_BADGES = \[([\s\S]*?)\];/);
    expect(badgesMatch).not.toBeNull();

    const entries = badgesMatch[1].match(/^\s*\{ num:/gm);
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
        expect(typeof lesson.badge).toBe('string');
      }
    }
  });

  it('every lesson has tags array', () => {
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        expect(Array.isArray(lesson.tags), `lesson ${lesson.num} must have tags array`).toBe(true);
        expect(lesson.tags.length, `lesson ${lesson.num} must have at least 1 tag`).toBeGreaterThanOrEqual(1);
        lesson.tags.forEach((tag) => {
          expect(typeof tag, `lesson ${lesson.num} tag must be string`).toBe('string');
        });
      }
    }
  });

  it('every lesson has type field', () => {
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        expect(['theory', 'practice', 'mixed']).toContain(lesson.type);
      }
    }
  });

  it('every lesson has interactive object', () => {
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        expect(typeof lesson.interactive, `lesson ${lesson.num} must have interactive object`).toBe('object');
        expect(lesson.interactive !== null, `lesson ${lesson.num} interactive must not be null`).toBe(true);
        expect(typeof lesson.interactive.exercise, `lesson ${lesson.num} interactive.exercise must be boolean`).toBe('boolean');
        expect(typeof lesson.interactive.quiz, `lesson ${lesson.num} interactive.quiz must be boolean`).toBe('boolean');
        expect(typeof lesson.interactive.dragDrop, `lesson ${lesson.num} interactive.dragDrop must be boolean`).toBe('boolean');
        expect(typeof lesson.interactive.game, `lesson ${lesson.num} interactive.game must be boolean`).toBe('boolean');
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

// ─── minify.cjs ───

describe('minify.cjs', () => {
  const src = fs.readFileSync(path.join(ROOT, 'minify.cjs'), 'utf-8');

  it('bundles page scripts via esbuild', () => {
    expect(src).toContain("name: 'repl.js'");
    expect(src).toContain("name: 'mindmap.js'");
    expect(src).toContain("name: 'cheatsheets.js'");
  });

  it('bundles repl.js (IIFE) so module imports are resolved', () => {
    expect(src).toContain("format: 'iife'");
    expect(src).toContain('bundle: true');
    expect(src).not.toContain('Terser');
  });
});

// ─── Quiz files ───

describe('quiz files', () => {
  const quizzesDir = path.join(ROOT, 'quizzes');

  it('has quizzes for lessons 1-50', () => {
    for (let i = 1; i <= 50; i++) {
      const quizFile = path.join(quizzesDir, `${i}.json`);
      expect(fs.existsSync(quizFile), `quizzes/${i}.json missing`).toBe(true);
    }
  });

  it('has final-test.json', () => {
    expect(fs.existsSync(path.join(quizzesDir, 'final-test.json'))).toBe(true);
  });

  it('each quiz has valid structure', () => {
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

// ─── Quiz JSON Schema validation ───

describe('quiz JSON schema validation', () => {
  const quizzesDir = path.join(ROOT, 'quizzes');

  function validateQuizQuestion(q, quizFile, idx) {
    expect(typeof q.question, `${quizFile}[${idx}].question must be string`).toBe('string');
    expect(q.question.length, `${quizFile}[${idx}].question must not be empty`).toBeGreaterThan(0);

    expect(Array.isArray(q.options), `${quizFile}[${idx}].options must be array`).toBe(true);
    expect(q.options.length, `${quizFile}[${idx}].options must have 2+ items`).toBeGreaterThanOrEqual(2);
    expect(q.options.length, `${quizFile}[${idx}].options must have at most 6 items`).toBeLessThanOrEqual(6);
    q.options.forEach((opt, oi) => {
      expect(typeof opt, `${quizFile}[${idx}].options[${oi}] must be string`).toBe('string');
      expect(opt.length, `${quizFile}[${idx}].options[${oi}] must not be empty`).toBeGreaterThan(0);
    });

    expect(typeof q.correct, `${quizFile}[${idx}].correct must be number`).toBe('number');
    expect(Number.isInteger(q.correct), `${quizFile}[${idx}].correct must be integer`).toBe(true);
    expect(q.correct, `${quizFile}[${idx}].correct must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(q.correct, `${quizFile}[${idx}].correct must be < options.length`).toBeLessThan(q.options.length);

    if (q.explanation !== undefined) {
      expect(typeof q.explanation, `${quizFile}[${idx}].explanation must be string`).toBe('string');
    }
  }

  it('all quiz questions pass JSON schema validation', () => {
    for (let i = 1; i <= 50; i++) {
      const file = `${i}.json`;
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, file), 'utf-8'));
      quiz.forEach((q, idx) => validateQuizQuestion(q, file, idx));
    }
  });

  it('final-test.json passes JSON schema validation', () => {
    const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, 'final-test.json'), 'utf-8'));
    quiz.forEach((q, idx) => validateQuizQuestion(q, 'final-test.json', idx));
  });

  it('lesson quizzes have exactly 10 questions', () => {
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      expect(quiz.length, `quizzes/${i}.json must have 10 questions`).toBe(10);
    }
  });

  it('final-test.json has 50 questions', () => {
    const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, 'final-test.json'), 'utf-8'));
    expect(quiz.length, 'final-test.json must have 50 questions').toBe(50);
  });

  it('no quiz has duplicate correct answers in a single question', () => {
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      quiz.forEach((q, idx) => {
        expect(
          q.options.indexOf(q.options[q.correct]),
          `quizzes/${i}.json[${idx}]: correct answer must match options[correct]`,
        ).toBe(q.correct);
      });
    }
  });

  it('no quiz has empty option strings', () => {
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      quiz.forEach((q, idx) => {
        q.options.forEach((opt, oi) => {
          expect(
            opt.trim().length > 0,
            `quizzes/${i}.json[${idx}].options[${oi}] must not be empty/whitespace`,
          ).toBe(true);
        });
      });
    }
  });

  it('no quiz has duplicate option text within a single question', () => {
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      quiz.forEach((q, idx) => {
        const unique = new Set(q.options);
        expect(
          unique.size,
          `quizzes/${i}.json[${idx}]: options must be unique`,
        ).toBe(q.options.length);
      });
    }
  });

  it('all quizzes are valid JSON (no parse errors)', () => {
    for (let i = 1; i <= 50; i++) {
      const raw = fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8');
      expect(() => JSON.parse(raw), `quizzes/${i}.json must be valid JSON`).not.toThrow();
    }
    const raw = fs.readFileSync(path.join(quizzesDir, 'final-test.json'), 'utf-8');
    expect(() => JSON.parse(raw), 'final-test.json must be valid JSON').not.toThrow();
  });

  it('all quizzes have explanation field on every question', () => {
    for (let i = 1; i <= 50; i++) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, `${i}.json`), 'utf-8'));
      quiz.forEach((q, idx) => {
        expect(
          typeof q.explanation === 'string' && q.explanation.length > 0,
          `quizzes/${i}.json[${idx}] must have non-empty explanation`,
        ).toBe(true);
      });
    }
    const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, 'final-test.json'), 'utf-8'));
    quiz.forEach((q, idx) => {
      expect(
        typeof q.explanation === 'string' && q.explanation.length > 0,
        `final-test.json[${idx}] must have non-empty explanation`,
      ).toBe(true);
    });
  });

  it('no question text contains unescaped < or unknown tags', () => {
    const allowedTag = /^<\/?(code|br|b|i|em|strong)(\s[^>]*)?>$/;
    const files = [];
    for (let i = 1; i <= 50; i++) files.push(`${i}.json`);
    files.push('final-test.json');
    for (const file of files) {
      const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, file), 'utf-8'));
      quiz.forEach((q, idx) => {
        const matches = q.question.match(/<[^>]*>/g) || [];
        matches.forEach((m) => {
          expect(
            allowedTag.test(m),
            `${file}[${idx}]: unescaped tag/expression ${JSON.stringify(m)} in question — escape comparison signs as &lt;/&gt;`,
          ).toBe(true);
        });
      });
    }
  });
});
