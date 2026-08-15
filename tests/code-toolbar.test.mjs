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

  it('keeps highlight markup when entering edit mode', () => {
    const { pre, code } = setupCodeBlock('x = 1  # comment');

    initCodeToolbar();

    hljs.highlightElement(code);
    expect(code.querySelector('span')).not.toBeNull();

    pre.parentElement.querySelector('.edit-btn').click();

    // Highlight stays visible while editing; Enter escapes comment spans instead
    expect(code.querySelector('span')).not.toBeNull();
    expect(code.textContent).toBe('x = 1  # comment');
  });

  it('removes the keydown handler when exiting edit mode via Run', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    hljs.highlightElement(code);

    const editBtn = pre.parentElement.querySelector('.edit-btn');
    editBtn.click();
    expect(pre.contentEditable).toBe('true');

    pre.parentElement.querySelector('.run-btn').click();

    const evt = new window.KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    pre.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
  });

  it('merges split <code> elements created by Enter and drops stale comment markup', () => {
    const { pre, code } = setupCodeBlock('print(do_nothing())  # None');

    initCodeToolbar();

    hljs.highlightElement(code);

    const editBtn = pre.parentElement.querySelector('.edit-btn');
    editBtn.click();

    // Chromium splits the <code> element when pressing Enter inside contentEditable,
    // cloning the current formatting (here a comment span) into a second element.
    const split = document.createElement('code');
    split.className = 'language-python hljs';
    split.dataset.highlighted = 'yes';
    split.innerHTML = '<span class="hljs-comment">print(\'Hello\')</span>';
    pre.appendChild(split);

    editBtn.click();

    expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
    expect(pre.querySelectorAll('code').length).toBe(1);
    expect(code.textContent).toContain('print(do_nothing())  # None');
    expect(code.textContent).toContain("print('Hello')");
  });
});

describe('code-toolbar live editing', () => {
  function setCaretInTextNode(node, offset) {
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function findTextNode(parent, data) {
    return Array.from(parent.childNodes).find(function (n) {
      return n.nodeType === Node.TEXT_NODE && n.data === data;
    });
  }

  it('Enter after a comment breaks the line outside the comment span and leaves a plain anchor', () => {
    const { pre, code } = setupCodeBlock('print(do_nothing())  # None');

    initCodeToolbar();

    // Simulate highlighted markup with a real comment span
    code.innerHTML =
      '<span class="hljs-keyword">print(do_nothing())  </span>' +
      '<span class="hljs-comment"># None</span>';

    pre.parentElement.querySelector('.edit-btn').click();

    const commentSpan = code.querySelector('.hljs-comment');
    setCaretInTextNode(commentSpan.firstChild, commentSpan.firstChild.length);

    pre.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    // No second <code> element is created
    expect(pre.querySelectorAll('code').length).toBe(1);
    // Comment markup is preserved on its own line
    expect(code.querySelector('.hljs-comment').textContent).toBe('# None');
    // A real newline and the plain-text anchor follow the comment span
    expect(findTextNode(code, '\n')).not.toBeNull();
    const anchor = findTextNode(code, '\u200B');
    expect(anchor).not.toBeNull();
    // Caret sits at the start of the anchor so typing stays outside the spans
    const sel = window.getSelection();
    expect(sel.rangeCount).toBe(1);
    expect(sel.getRangeAt(0).startContainer).toBe(anchor);
    expect(sel.getRangeAt(0).startOffset).toBe(0);
  });

  it('reHighlight strips the zero-width editing anchor', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    hljs.highlightElement(code);

    const editBtn = pre.parentElement.querySelector('.edit-btn');
    editBtn.click();

    code.textContent = 'print("hi")\u200B';

    editBtn.click();

    expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
    expect(code.textContent).toContain('print("hi")');
    expect(code.textContent).not.toContain('\u200B');
    expect(code.innerHTML).toContain('hljs-keyword');
  });

  it('re-highlights live (debounced) while editing', () => {
    const { pre, code } = setupCodeBlock('print("hi")');

    initCodeToolbar();

    hljs.highlightElement(code);
    expect(hljs.highlightElement).toHaveBeenCalledTimes(1);

    const editBtn = pre.parentElement.querySelector('.edit-btn');
    editBtn.click();

    vi.useFakeTimers();
    try {
      pre.dispatchEvent(new window.Event('input'));

      // Before the debounce window nothing happened
      vi.advanceTimersByTime(100);
      expect(hljs.highlightElement).toHaveBeenCalledTimes(1);

      // After the debounce window the block is re-highlighted
      vi.advanceTimersByTime(50);
      expect(hljs.highlightElement).toHaveBeenCalledTimes(2);
      expect(code.dataset.highlighted).toBe('yes');
      expect(code.innerHTML).toContain('hljs-keyword');
    } finally {
      vi.useRealTimers();
    }
  });
});
