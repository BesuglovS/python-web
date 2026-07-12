import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '..', 'src', 'js');
const configDir = path.join(srcDir, 'config');

function createLocalStorage() {
  const store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; },
    _store: store,
  };
}

function loadSecurity() {
  const src = fs.readFileSync(path.join(configDir, 'security.js'), 'utf-8');
  const stripped = src
    .replace(/^import.*from.*constants\.js[\s\S]*?;/m, '')
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/m, '');
  const ls = createLocalStorage();
  const ctx = { localStorage: ls, console: { warn: () => {} }, CustomEvent: undefined, document: { dispatchEvent: () => {} }, MAX_STORAGE_VALUE_LENGTH: 102400 };
  const fn = new Function('localStorage', 'console', 'document', 'CustomEvent', `
    var MAX_STORAGE_VALUE_LENGTH = 102400;
    ${stripped};
    return { SAFE_KEYS, safeGetItem, safeSetItem, safeRemoveItem, _buildLessonLookup };
  `);
  return { ...fn(ctx.localStorage, ctx.console, ctx.document, ctx.CustomEvent), _ls: ls };
}

function loadCourseData() {
  const src = fs.readFileSync(path.join(configDir, 'courseData.js'), 'utf-8');
  const stripped = src
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/m, '')
    .replace(/^window\.\w+\s*=.*$/gm, '');
  const fn = new Function(`
    var window = { THEORY_CONTESTS: {}, CONTEST_BASE_URL: '', TOTAL_LESSONS: 0, LESSON_META: {}, COMPLEXITY_LABELS: {} };
    ${stripped};
    return { THEORY_CONTESTS, CONTEST_BASE_URL, TOTAL_LESSONS, LESSON_META, COMPLEXITY_LABELS };
  `);
  return fn();
}

describe('config/security.js', () => {
  const sec = loadSecurity();

  describe('safeGetItem / safeSetItem / safeRemoveItem', () => {
    it('denies read for unknown keys', () => {
      expect(sec.safeGetItem('unknown-key')).toBeNull();
    });

    it('allows read/write for whitelisted keys', () => {
      expect(sec.SAFE_KEYS.has('python-web-theme')).toBe(true);
      expect(sec.SAFE_KEYS.has('python-web-course-progress')).toBe(true);
      expect(sec.SAFE_KEYS.has('python-web-quiz-scores')).toBe(true);
    });

    it('persists values for allowed keys', () => {
      sec.safeSetItem('python-web-theme', 'dark');
      expect(sec.safeGetItem('python-web-theme')).toBe('dark');
    });

    it('rejects values larger than 102400 chars', () => {
      sec.safeRemoveItem('python-web-theme');
      const big = 'x'.repeat(102401);
      sec.safeSetItem('python-web-theme', big);
      expect(sec.safeGetItem('python-web-theme')).toBeNull();
    });

    it('removeItem removes the key', () => {
      sec.safeSetItem('python-web-theme', 'light');
      sec.safeRemoveItem('python-web-theme');
      expect(sec.safeGetItem('python-web-theme')).toBeNull();
    });
  });

  describe('_buildLessonLookup', () => {
    it('converts filename array to lesson-number lookup', () => {
      const result = sec._buildLessonLookup(['01-history.html', '05-type-casting.html']);
      expect(result[1]).toBe(true);
      expect(result[5]).toBe(true);
      expect(result[2]).toBeUndefined();
    });

    it('handles null/undefined/empty input', () => {
      expect(sec._buildLessonLookup(null)).toEqual({});
      expect(sec._buildLessonLookup(undefined)).toEqual({});
      expect(sec._buildLessonLookup([])).toEqual({});
    });

    it('handles non-array input', () => {
      expect(sec._buildLessonLookup('not-an-array')).toEqual({});
    });
  });
});

describe('config/courseData.js', () => {
  const data = loadCourseData();

  describe('LESSON_META', () => {
    it('has entries for lessons 1-50', () => {
      for (let i = 1; i <= 50; i++) {
        expect(data.LESSON_META[i]).toBeDefined();
        expect(data.LESSON_META[i].duration).toBeGreaterThan(0);
        expect(['beginner', 'basic', 'intermediate', 'advanced']).toContain(
          data.LESSON_META[i].complexity,
        );
      }
    });
  });

  describe('COMPLEXITY_LABELS', () => {
    it('has labels for all complexity levels', () => {
      expect(data.COMPLEXITY_LABELS.beginner).toBeTruthy();
      expect(data.COMPLEXITY_LABELS.basic).toBeTruthy();
      expect(data.COMPLEXITY_LABELS.intermediate).toBeTruthy();
      expect(data.COMPLEXITY_LABELS.advanced).toBeTruthy();
    });
  });

  describe('THEORY_CONTESTS', () => {
    it('has contest IDs for specific lessons', () => {
      expect(data.THEORY_CONTESTS[8]).toBe(7);
      expect(data.THEORY_CONTESTS[10]).toBe(8);
    });
  });

  describe('CONTEST_BASE_URL', () => {
    it('is a valid URL', () => {
      expect(data.CONTEST_BASE_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('TOTAL_LESSONS', () => {
    it('is set to 50', () => {
      expect(data.TOTAL_LESSONS).toBe(50);
    });
  });
});

describe('config/badges.js', () => {
  const badgesSrc = fs.readFileSync(path.join(configDir, 'badges.js'), 'utf-8');
  const sec = loadSecurity();

  function stripModuleSyntax(src) {
    return src
      .replace(/^import\b[^;]*;/gms, '')
      .replace(/^export\s*\{[^}]*\};?$/gm, '')
      .trim();
  }

  const stripped = stripModuleSyntax(badgesSrc);
  const fn = new Function('_buildLessonLookup', `
    var TOTAL_LESSONS = 50;
    var HALFWAY_LESSONS_COUNT = 25;
    var SPEEDRUN_LESSONS_COUNT = 3;
    var REPL_EXPERIMENTER_RUNS = 10;
    var QUIZ_CHAMPION_SCORE = 90;
    var QUIZ_PERFECT_SCORE = 100;
    var STREAK_DAYS = 7;
    ${stripped};
    return { BADGES };
  `);
  const badges = fn(sec._buildLessonLookup);

  it('has at least 10 badges', () => {
    expect(badges.BADGES.length).toBeGreaterThanOrEqual(10);
  });

  it('each badge has required fields', () => {
    badges.BADGES.forEach((badge) => {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(typeof badge.check).toBe('function');
    });
  });

  it('first_steps badge works correctly', () => {
    const badge = badges.BADGES.find((b) => b.id === 'first_steps');
    const completed5 = [
      '01-history.html',
      '02-ide-setup.html',
      '03-variables.html',
      '04-data-types.html',
      '05-type-casting.html',
    ];
    expect(badge.check(completed5)).toBe(true);
    expect(badge.check(['01-history.html', '02-ide-setup.html'])).toBe(false);
  });

  it('all_lessons badge works correctly', () => {
    const badge = badges.BADGES.find((b) => b.id === 'all_lessons');
    const allCompleted = [];
    for (let i = 1; i <= 50; i++) {
      const num = String(i).padStart(2, '0');
      allCompleted.push(num + '-lesson.html');
    }
    expect(badge.check(allCompleted)).toBe(true);
    expect(badge.check(['01-lesson.html'])).toBe(false);
  });

  it('halfway badge counts array length', () => {
    const badge = badges.BADGES.find((b) => b.id === 'halfway');
    const twentyFive = [];
    for (let i = 1; i <= 25; i++) twentyFive.push(i + '-lesson.html');
    expect(badge.check(twentyFive)).toBe(true);
    expect(badge.check(['01-lesson.html'])).toBe(false);
  });

  it('badges handle null/undefined progress gracefully', () => {
    badges.BADGES.forEach((badge) => {
      expect(badge.check(null)).toBeFalsy();
      expect(badge.check(undefined)).toBeFalsy();
      expect(badge.check([])).toBeFalsy();
    });
  });
});
