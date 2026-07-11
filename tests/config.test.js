import { describe, it, expect } from 'vitest';

// We test the config.js logic by reading and evaluating it
import fs from 'fs';
import path from 'path';

const configSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'config.js'), 'utf-8');

// Evaluate config.js in a browser-like context
function loadConfig() {
  const ctx = {
    SAFE_KEYS: {},
    console: { warn: () => {} },
    localStorage: {
      _store: {},
      getItem(key) {
        return this._store[key] ?? null;
      },
      setItem(key, val) {
        this._store[key] = val;
      },
      removeItem(key) {
        delete this._store[key];
      },
    },
  };

  const fn = new Function(
    'localStorage',
    'console',
    `
    ${configSrc};
    return {
      SAFE_KEYS,
      safeGetItem,
      safeSetItem,
      safeRemoveItem,
      THEORY_CONTESTS,
      CONTEST_BASE_URL,
      REPL_URL,
      LESSON_META,
      COMPLEXITY_LABELS,
      BADGES,
      TOTAL_LESSONS,
      _buildLessonLookup,
    };
    `,
  );

  return fn(ctx.localStorage, ctx.console);
}

describe('config.js', () => {
  const config = loadConfig();

  describe('safeGetItem / safeSetItem / safeRemoveItem', () => {
    it('denies read for unknown keys', () => {
      expect(config.safeGetItem('unknown-key')).toBeNull();
    });

    it('allows read for whitelisted keys', () => {
      expect(config.SAFE_KEYS.has('python-web-theme')).toBe(true);
    });

    it('rejects values larger than 102400 chars', () => {
      const big = 'x'.repeat(102401);
      // safeSetItem silently fails for oversized values
      config.safeSetItem('python-web-theme', big);
      expect(config.safeGetItem('python-web-theme')).toBeNull();
    });
  });

  describe('LESSON_META', () => {
    it('has entries for lessons 1-50', () => {
      for (let i = 1; i <= 50; i++) {
        expect(config.LESSON_META[i]).toBeDefined();
        expect(config.LESSON_META[i].duration).toBeGreaterThan(0);
        expect(['beginner', 'basic', 'intermediate', 'advanced']).toContain(
          config.LESSON_META[i].complexity,
        );
      }
    });
  });

  describe('COMPLEXITY_LABELS', () => {
    it('has labels for all complexity levels', () => {
      expect(config.COMPLEXITY_LABELS.beginner).toBeTruthy();
      expect(config.COMPLEXITY_LABELS.basic).toBeTruthy();
      expect(config.COMPLEXITY_LABELS.intermediate).toBeTruthy();
      expect(config.COMPLEXITY_LABELS.advanced).toBeTruthy();
    });
  });

  describe('BADGES', () => {
    it('has at least 10 badges', () => {
      expect(config.BADGES.length).toBeGreaterThanOrEqual(10);
    });

    it('each badge has required fields', () => {
      config.BADGES.forEach((badge) => {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.icon).toBeTruthy();
        expect(typeof badge.check).toBe('function');
      });
    });

    it('first_steps badge works correctly', () => {
      const badge = config.BADGES.find((b) => b.id === 'first_steps');
      const completed5 = [
        '01-history.html',
        '02-variables.html',
        '03-operators.html',
        '04-strings.html',
        '05-conditions.html',
      ];
      expect(badge.check(completed5)).toBe(true);
      expect(badge.check(['01-history.html', '02-variables.html'])).toBe(false);
    });

    it('all_lessons badge works correctly', () => {
      const badge = config.BADGES.find((b) => b.id === 'all_lessons');
      const allCompleted = [];
      for (let i = 1; i <= 50; i++) {
        const num = String(i).padStart(2, '0');
        allCompleted.push(num + '-lesson.html');
      }
      expect(badge.check(allCompleted)).toBe(true);
      expect(badge.check(['01-lesson.html'])).toBe(false);
    });

    it('halfway badge counts array length', () => {
      const badge = config.BADGES.find((b) => b.id === 'halfway');
      const twentyFive = [];
      for (let i = 1; i <= 25; i++) twentyFive.push(i + '-lesson.html');
      expect(badge.check(twentyFive)).toBe(true);
      expect(badge.check(['01-lesson.html'])).toBe(false);
    });

    it('error_handler badge works with filename array', () => {
      const badge = config.BADGES.find((b) => b.id === 'error_handler');
      expect(badge.check(['11-try-except.html'])).toBe(true);
      expect(badge.check(['01-history.html'])).toBe(false);
    });

    it('badges handle null/undefined progress gracefully', () => {
      config.BADGES.forEach((badge) => {
        expect(badge.check(null)).toBeFalsy();
        expect(badge.check(undefined)).toBeFalsy();
        expect(badge.check([])).toBeFalsy();
      });
    });
  });

  describe('THEORY_CONTESTS', () => {
    it('has contest IDs for specific lessons', () => {
      expect(config.THEORY_CONTESTS[8]).toBe(7);
      expect(config.THEORY_CONTESTS[10]).toBe(8);
    });
  });

  describe('CONTEST_BASE_URL', () => {
    it('is a valid URL', () => {
      expect(config.CONTEST_BASE_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('REPL_URL', () => {
    it('points to sandbox', () => {
      expect(config.REPL_URL).toContain('sandbox');
    });
  });

  describe('TOTAL_LESSONS', () => {
    it('is set to 50', () => {
      expect(config.TOTAL_LESSONS).toBe(50);
    });
  });
});
