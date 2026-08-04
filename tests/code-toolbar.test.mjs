// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCodeToolbar } from '../src/js/modules/code-toolbar.js';

/**
 * Fake highlight.js that reproduces the v11 `highlightElement` contract:
 * it sets `data-highlighted` on first call and refuses to re-highlight an
 * already-highlighted element unless that flag is cleared first.
 */
function createFakeHljs() {
  const highlightElement = vi.fn(function (el) {
    if (el.dataset.highlighted) {
      console.log('Element previously highlighted. Skipping re-highlight.');
      return;
    }
    const text = el.textContent || '';
    el.innerHTML = '<span class="hljs-keyword">' + text + '</span>';
    el.dataset.highlighted = 'yes';
  });
  return { highlightElement };
}

function setupCodeBlock(codeText) {
  const pre = document.createElement('pre');
  pre.className = 'language-python';
  const code = document.createElement('code');
  code.textContent = codeText;
  pre.appendChild(code);
  const main = document.createElement('main');
  main.appendChild(pre);
  document.body.appendChild(main);
  return { pre, code };
}

let hljs;

beforeEach(() => {
  hljs = createFakeHljs();
  globalThis.hljs = hljs;
  globalThis.fetch = vi.fn(() => Promise.reject(new Error('fetch stubbed in test')));
});

afterEach(() => {
  document.body.innerHTML = '';
  delete globalThis.hljs;
  delete globalThis.fetch;
});

describe('code-toolbar re-highlight after editing', () => {
  it('re-applies syntax highlighting after finishing edit mode', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    // Simulate initial page load highlighting (initSyntaxHighlighting)
    hljs.highlightElement(code);
    expect(code.dataset.highlighted).toBe('yes');
    expect(code.innerHTML).toContain('hljs-keyword');

    const editBtn = pre.parentElement.querySelector('.edit-btn');

    // Enter edit mode
    editBtn.click();
    expect(pre.contentEditable).toBe('true');

    // User modifies the code
    code.textContent = 'x = 5';

    // Finish editing → triggers reHighlight()
    editBtn.click();
    expect(pre.contentEditable).toBe('false');

    // hljs must be invoked again and actually re-render highlighted markup
    expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
    expect(code.dataset.highlighted).toBe('yes');
    expect(code.innerHTML).toContain('hljs-keyword');
    expect(code.innerHTML).toContain('x = 5');
  });

  it('re-highlights code executed right after editing', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    hljs.highlightElement(code);

    const editBtn = pre.parentElement.querySelector('.edit-btn');

    editBtn.click();
    code.textContent = 'x = 5';
    // Run button exits edit mode and re-highlights (same reHighlight path)
    pre.parentElement.querySelector('.run-btn').click();

    expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
    expect(code.innerHTML).toContain('hljs-keyword');
  });

  it('starts editing on double-click and re-highlights via edit button', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    hljs.highlightElement(code);

    pre.dispatchEvent(new window.Event('dblclick', { bubbles: true }));
    expect(pre.contentEditable).toBe('true');

    code.textContent = 'y = 1';

    const editBtn = pre.parentElement.querySelector('.edit-btn');
    editBtn.click();

    expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
    expect(code.innerHTML).toContain('hljs-keyword');
    expect(code.innerHTML).toContain('y = 1');
  });
});
