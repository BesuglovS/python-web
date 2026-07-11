// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { sanitizeInput, showSandboxResult } from '../src/js/modules/utils.js';

describe('sanitizeInput (real implementation)', () => {
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

describe('showSandboxResult (real implementation)', () => {
  function createOutputEl() {
    const el = document.createElement('div');
    return el;
  }

  it('escapes stdout content', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: '<script>xss</script>', stderr: '', ok: true });
    expect(el.innerHTML).toContain('&lt;script&gt;');
    expect(el.innerHTML).not.toContain('<script>');
  });

  it('escapes stderr content', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: '', stderr: '<img onerror=alert(1)>', ok: false });
    expect(el.innerHTML).toContain('&lt;img');
    expect(el.innerHTML).not.toContain('<img');
  });

  it('shows success message when no output', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: '', stderr: '', ok: true });
    expect(el.innerHTML).toContain('Код выполнен без вывода');
  });

  it('shows error code when no output and not ok', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: '', stderr: '', ok: false, exit_code: 1 });
    expect(el.innerHTML).toContain('1');
  });

  it('sets display block and show class', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: 'ok', stderr: '', ok: true });
    expect(el.style.display).toBe('block');
    expect(el.className).toContain('show');
  });

  it('adds error class on failure', () => {
    const el = createOutputEl();
    showSandboxResult(el, { stdout: '', stderr: 'err', ok: false, exit_code: 1 });
    expect(el.className).toContain('error');
  });
});
