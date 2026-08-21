import { describe, it, expect } from 'vitest';
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
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/m, '')
    .replace(/^export\s+function\s+(\w+)/gm, 'function $1');
  const ls = createLocalStorage();
  const ctx = { localStorage: ls, console: { warn: () => {} }, CustomEvent: undefined, document: { dispatchEvent: () => {} }, MAX_STORAGE_VALUE_LENGTH: 102400 };
  const fn = new Function('localStorage', 'console', 'document', 'CustomEvent', `
    var MAX_STORAGE_VALUE_LENGTH = 102400;
    ${stripped};
    return { SAFE_KEYS, safeGetItem, safeSetItem, safeRemoveItem, buildLessonLookup };
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
    return { THEORY_CONTESTS, CONTEST_BASE_URL, TOTAL_LESSONS, LESSON_META, COMPLEXITY_LABELS, LESSON_BADGES };
  `);
  return fn();
}

function stripModuleSyntax(src) {
  return src
    .replace(/^import\b[^;]*;/gms, '')
    .replace(/^export\s*\{[^}]*\};?$/gm, '')
    .trim();
}

describe('config/security.js', () => {
  const sec = loadSecurity();

  describe('safeGetItem / safeSetItem / safeRemoveItem', () => {
    it('denies read for unknown keys', () => {
      expect(sec.safeGetItem('unknown-key')).toBeNull();
    });

    it('allows read/write for whitelisted keys', () => {
      expect(sec.SAFE_KEYS.has('python-web-theme')).toBe(true);
      expect(sec.SAFE_KEYS.has('python-web-dragdrop-completed')).toBe(true);
      expect(sec.SAFE_KEYS.has('python-web-scroll-positions')).toBe(true);
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

  describe('buildLessonLookup', () => {
    it('converts filename array to lesson-number lookup', () => {
      const result = sec.buildLessonLookup(['01-history.html', '05-type-casting.html']);
      expect(result[1]).toBe(true);
      expect(result[5]).toBe(true);
      expect(result[2]).toBeUndefined();
    });

    it('handles null/undefined/empty input', () => {
      expect(sec.buildLessonLookup(null)).toEqual({});
      expect(sec.buildLessonLookup(undefined)).toEqual({});
      expect(sec.buildLessonLookup([])).toEqual({});
    });

    it('handles non-array input', () => {
      expect(sec.buildLessonLookup('not-an-array')).toEqual({});
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

  const stripped = stripModuleSyntax(badgesSrc);
  const fn = new Function(`
    ${stripped};
    return { BADGES };
  `);
  const badges = fn();

  it('has at least 10 badges', () => {
    expect(badges.BADGES.length).toBeGreaterThanOrEqual(10);
  });

  it('each badge has required fields', () => {
    badges.BADGES.forEach((badge) => {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(badge.desc).toBeTruthy();
    });
  });

  it('all badge ids are unique', () => {
    const ids = badges.BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('config/courseData.js LESSON_BADGES', () => {
  const data = loadCourseData();
  const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lessons.json'), 'utf-8'));
  const badgesSrc = fs.readFileSync(path.join(configDir, 'badges.js'), 'utf-8');
  const achievementBadges = new Function(`
    ${stripModuleSyntax(badgesSrc)};
    return { BADGES };
  `)().BADGES;

  it('has an entry for every lesson matching lessons.json', () => {
    expect(data.LESSON_BADGES).toHaveLength(50);

    const badgeByNum = {};
    const fileByNum = {};
    for (const section of lessons.sections) {
      for (const lesson of section.lessons) {
        badgeByNum[lesson.num] = lesson.badge;
        fileByNum[lesson.num] = lesson.file;
      }
    }

    for (const lb of data.LESSON_BADGES) {
      expect(lb.num).toBeGreaterThan(0);
      expect(lb.id, `lesson ${lb.num} badge id must match lessons.json`).toBe(badgeByNum[lb.num]);
      expect(typeof lb.title, `lesson ${lb.num} must have title`).toBe('string');
      expect(lb.title.length, `lesson ${lb.num} title must not be empty`).toBeGreaterThan(0);
      expect(lb.file, `lesson ${lb.num} file must match lessons.json`).toBe(fileByNum[lb.num]);
    }
  });

  it('has unique ids', () => {
    const ids = data.LESSON_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids do not collide with achievement badge ids', () => {
    const achievementIds = new Set(achievementBadges.map((b) => b.id));
    for (const lb of data.LESSON_BADGES) {
      expect(
        achievementIds.has(lb.id),
        `lesson badge '${lb.id}' (урок ${lb.num}) collides with achievement badge id`,
      ).toBe(false);
    }
  });
});
