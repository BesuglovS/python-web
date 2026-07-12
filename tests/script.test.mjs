// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { sanitizeInput, showSandboxResult } from '../src/js/modules/utils.js';

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('strips nested HTML', () => {
    expect(sanitizeInput('<div><b>bold</b></div>')).toBe('bold');
  });

  it('removes null bytes', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });

  it('truncates to MAX_LEN', () => {
    const long = 'a'.repeat(200000);
    expect(sanitizeInput(long).length).toBe(102400);
  });

  it('returns empty for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });

  it('passes through plain text', () => {
    expect(sanitizeInput('print("hello")')).toBe('print("hello")');
  });

  it('strips malformed HTML with > in attributes', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('');
  });
});

describe('showSandboxResult', () => {
  it('escapes stdout content', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: '<script>xss</script>', stderr: '', ok: true });
    expect(el.innerHTML).toContain('&lt;script&gt;');
    expect(el.innerHTML).not.toContain('<script>');
  });

  it('escapes stderr content', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: '', stderr: '<img onerror=alert(1)>', ok: false });
    expect(el.innerHTML).toContain('&lt;img');
    expect(el.innerHTML).not.toContain('<img');
  });

  it('shows success message when no output', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: '', stderr: '', ok: true });
    expect(el.innerHTML).toContain('Код выполнен без вывода');
  });

  it('shows error code when no output and not ok', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: '', stderr: '', ok: false, exit_code: 1 });
    expect(el.innerHTML).toContain('1');
  });

  it('sets display block and show class', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: 'ok', stderr: '', ok: true });
    expect(el.style.display).toBe('block');
    expect(el.className).toContain('show');
  });

  it('adds error class on failure', () => {
    const el = document.createElement('div');
    showSandboxResult(el, { stdout: '', stderr: 'err', ok: false, exit_code: 1 });
    expect(el.className).toContain('error');
  });
});

describe('_buildLessonLookup (from security module)', () => {
  const securitySrc = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'js', 'config', 'security.js'),
    'utf-8',
  );
  const stripped = securitySrc
    .replace(/^import.*from.*constants\.js[\s\S]*?;/m, '')
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/m, '');

  function loadBuildLessonLookup() {
    const fn = new Function(
      'localStorage',
      'console',
      'document',
      `
      var MAX_STORAGE_VALUE_LENGTH = 102400;
      ${stripped}
      return _buildLessonLookup;
      `,
    );
    return fn(
      { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      { warn: () => {} },
      { dispatchEvent: () => {} },
    );
  }

  const buildLookup = loadBuildLessonLookup();

  it('converts filename array to lesson number lookup', () => {
    const result = buildLookup(['01-history.html', '02-variables.html', '03-operators.html']);
    expect(result[1]).toBe(true);
    expect(result[2]).toBe(true);
    expect(result[3]).toBe(true);
    expect(result[4]).toBeUndefined();
  });

  it('handles empty array', () => {
    expect(buildLookup([])).toEqual({});
  });

  it('handles null/undefined', () => {
    expect(buildLookup(null)).toEqual({});
    expect(buildLookup(undefined)).toEqual({});
  });

  it('handles non-array input', () => {
    expect(buildLookup('not-an-array')).toEqual({});
  });

  it('extracts numbers from various filename formats', () => {
    const result = buildLookup(['50-git-intro.html', '10-loops.html']);
    expect(result[50]).toBe(true);
    expect(result[10]).toBe(true);
  });
});
