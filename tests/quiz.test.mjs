// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/js/modules/quiz.js';

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('preserves allowed tags and entities', () => {
    expect(sanitizeHtml('<code>print(1)</code>')).toBe('<code>print(1)</code>');
    expect(sanitizeHtml('text<br><b>bold</b>')).toBe('text<br><b>bold</b>');
    expect(sanitizeHtml('a &lt; b &nbsp; c')).toBe('a &lt; b &nbsp; c');
  });

  it('escapes literal < and > in text', () => {
    expect(sanitizeHtml('while i < 3:')).toBe('while i &lt; 3:');
    expect(sanitizeHtml('/user/<id>')).toBe('/user/&lt;id&gt;');
  });

  it('keeps a <br> that follows a comparison sign', () => {
    expect(sanitizeHtml('while i < 3:<br>print(i)')).toBe('while i &lt; 3:<br>print(i)');
  });

  it('escapes comparisons inside code blocks without breaking line breaks', () => {
    const input = '<code>i = 0<br>while i < 3:<br>&nbsp;&nbsp;&nbsp;&nbsp;print(i)</code>';
    expect(sanitizeHtml(input)).toBe(
      '<code>i = 0<br>while i &lt; 3:<br>&nbsp;&nbsp;&nbsp;&nbsp;print(i)</code>',
    );
  });

  it('renders unknown tags as escaped text (no HTML injection)', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(sanitizeHtml('<div><b>bold</b></div>')).toBe('&lt;div&gt;<b>bold</b>&lt;/div&gt;');
  });
});
