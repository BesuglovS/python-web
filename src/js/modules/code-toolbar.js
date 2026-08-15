'use strict';

/**
 * Code toolbar module (Copy, Edit, Run buttons)
 * Provides interactive code editing and execution controls
 */

import { runSandbox } from './sandbox-client.js';
import { highlightPythonFallback } from './syntax-highlight.js';

function showCopied(btn) {
  btn.textContent = '✓ Скопировано';
  btn.classList.add('copied');
  setTimeout(function () {
    btn.textContent = '📋 Копировать';
    btn.classList.remove('copied');
  }, 2000);
}

/**
 * Extract editable code text, removing the zero-width space used as a
 * plain-text caret anchor while editing.
 * @param {HTMLElement} preEl - The pre element containing code
 */
function cleanCodeText(preEl) {
  return (preEl.textContent || '').replace(/\u200B/g, '');
}

/**
 * Merge <code> elements back into one. contentEditable can split the <code>
 * element (e.g. when pressing Enter), carrying stale highlight markup.
 * @param {HTMLElement} preEl - The pre element containing code
 * @returns {HTMLElement} The single code element (or pre as fallback)
 */
function mergeCodeElements(preEl) {
  const codeEls = preEl.querySelectorAll('code');
  if (codeEls.length > 1) {
    const fullText = preEl.textContent || '';
    for (let i = codeEls.length - 1; i > 0; i--) {
      codeEls[i].parentNode.removeChild(codeEls[i]);
    }
    codeEls[0].textContent = fullText;
  }
  return preEl.querySelector('code') || preEl;
}

/**
 * Apply syntax highlighting to a code element (hljs when available, else fallback).
 * @param {HTMLElement} preEl - The pre element (used to set the language class)
 * @param {HTMLElement} code - The code element to highlight
 */
function applyHighlight(preEl, code) {
  if (typeof hljs !== 'undefined') {
    preEl.classList.add('language-python');
    delete code.dataset.highlighted;
    hljs.highlightElement(code);
  } else {
    highlightPythonFallback(code);
  }
}

/**
 * Re-highlight a code block after editing.
 * @param {HTMLElement} preEl - The pre element containing code
 */
function reHighlight(preEl) {
  const code = mergeCodeElements(preEl);
  code.textContent = (code.textContent || '').replace(/\u200B/g, '');
  applyHighlight(preEl, code);
}

/**
 * Save the caret position as a character offset into the plain code text
 * (zero-width anchors excluded so the offset matches the re-highlighted text).
 * @param {HTMLElement} code - The code element
 * @returns {number} Caret offset, or -1 if the caret is not in a text node
 */
function saveCaretOffset(code) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return -1;
  const range = sel.getRangeAt(0);
  const tgt = range.startContainer;
  const toff = range.startOffset;
  if (tgt.nodeType !== Node.TEXT_NODE) return -1;
  let off = 0;
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n === tgt) {
      const upTo = n.data.slice(0, Math.min(toff, n.length)).replace(/\u200B/g, '');
      return off + upTo.length;
    }
    off += n.data.replace(/\u200B/g, '').length;
  }
  return off;
}

/**
 * Restore the caret to the given character offset into the code text.
 * @param {HTMLElement} code - The code element
 * @param {number} offset - Character offset to place the caret at
 */
function restoreCaretOffset(code, offset) {
  if (offset < 0) return;
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let last = null;
  let n;
  while ((n = walker.nextNode())) {
    if (acc + n.length >= offset) {
      const r = document.createRange();
      r.setStart(n, Math.max(0, offset - acc));
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    last = n;
    acc += n.length;
  }
  if (last) {
    const r = document.createRange();
    r.setStart(last, last.length);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

/**
 * Insert a line break at the caret, escaping highlighted spans so that the
 * following line doesn't inherit their styling, and leaving a non-empty plain
 * text anchor for Chromium to keep typing outside the spans.
 * @param {HTMLElement} pre - The pre element being edited
 */
function insertLineBreak(pre) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  let range = sel.getRangeAt(0);
  if (!range.collapsed) {
    range.deleteContents();
    range = sel.getRangeAt(0);
  }
  const node = range.startContainer;
  const offset = range.startOffset;
  let nl;
  if (node.nodeType === Node.TEXT_NODE) {
    let span = null;
    let el = node.parentElement;
    while (el && el !== pre) {
      if (el.tagName === 'SPAN' && /hljs-/.test(el.className || '')) span = el;
      el = el.parentElement;
    }
    const tail = node.splitText(offset);
    nl = document.createTextNode('\n');
    if (span) {
      const codeEl = span.parentNode;
      codeEl.insertBefore(nl, span.nextSibling);
      codeEl.insertBefore(tail, nl.nextSibling);
    } else {
      tail.parentNode.insertBefore(nl, tail);
    }
  } else {
    nl = document.createTextNode('\n');
    node.insertBefore(nl, node.childNodes[offset] || null);
  }
  // Non-empty plain anchor so Chromium types outside highlighted spans
  const anchor = document.createTextNode('\u200B');
  nl.parentNode.insertBefore(anchor, nl.nextSibling);
  const r = document.createRange();
  r.setStart(anchor, 0);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function handleCodeKeyDown(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const value = e.target.value;
    if (value !== undefined) {
      // Это textarea — вставляем табуляцию
      e.target.value = value.substring(0, start) + '    ' + value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 4;
    } else {
      // Это contentEditable — вставляем 4 пробела
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode('    '));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  } else if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    insertLineBreak(e.currentTarget);
  }
}

export function initCodeToolbar() {
  document.querySelectorAll('main pre, .main-content pre, pre.code-block').forEach(function (pre) {
    if (!pre.parentElement || pre.parentElement.classList.contains('code-wrapper')) return;

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    wrapper.appendChild(toolbar);

    // ── Copy Button ──
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 Копировать';
    copyBtn.title = 'Копировать код в буфер обмена';
    copyBtn.setAttribute('aria-label', 'Копировать код');

    copyBtn.addEventListener('click', function () {
      const text = cleanCodeText(pre);

      function fallbackCopy() {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } catch (_e) {
          console.warn('Fallback copy failed');
        }
        document.body.removeChild(ta);
        if (ok) showCopied(copyBtn);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(function () {
            showCopied(copyBtn);
          })
          .catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });

    toolbar.appendChild(copyBtn);

    // ── Edit Button ──
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✎ Ред.';
    editBtn.title = 'Редактировать код';
    editBtn.setAttribute('aria-label', 'Редактировать код');

    toolbar.appendChild(editBtn);

    let isEditing = false;
    let liveTimer = null;

    function cancelLiveHighlight() {
      if (liveTimer !== null) {
        clearTimeout(liveTimer);
        liveTimer = null;
      }
    }

    function runLiveHighlight() {
      liveTimer = null;
      if (!isEditing) return;
      const code = pre.querySelector('code') || pre;
      const sel = window.getSelection();
      const caretInside =
        sel && sel.rangeCount && code.contains(sel.getRangeAt(0).startContainer);
      const offset = caretInside ? saveCaretOffset(code) : -1;
      mergeCodeElements(pre);
      code.textContent = (code.textContent || '').replace(/\u200B/g, '');
      applyHighlight(pre, code);
      if (offset >= 0) restoreCaretOffset(code, offset);
    }

    function scheduleLiveHighlight() {
      if (liveTimer !== null) clearTimeout(liveTimer);
      liveTimer = setTimeout(runLiveHighlight, 150);
    }

    function onCodeInput(e) {
      if (e.isComposing) return;
      scheduleLiveHighlight();
    }

    function onCodePaste(e) {
      e.preventDefault();
      const text = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
      if (text) {
        document.execCommand('insertText', false, text);
      }
      scheduleLiveHighlight();
    }

    function enterEditMode() {
      isEditing = true;
      pre.contentEditable = 'true';
      pre.spellcheck = false;
      pre.classList.add('editing');
      editBtn.classList.add('active');
      editBtn.textContent = '✓ Готово';
      pre.addEventListener('keydown', handleCodeKeyDown);
      pre.addEventListener('input', onCodeInput);
      pre.addEventListener('paste', onCodePaste);
      pre.focus();
    }

    function exitEditMode() {
      isEditing = false;
      pre.contentEditable = 'false';
      pre.classList.remove('editing');
      editBtn.classList.remove('active');
      editBtn.textContent = '✎ Ред.';
      pre.removeEventListener('keydown', handleCodeKeyDown);
      pre.removeEventListener('input', onCodeInput);
      pre.removeEventListener('paste', onCodePaste);
      cancelLiveHighlight();
      reHighlight(pre);
    }

    editBtn.addEventListener('click', function () {
      if (isEditing) {
        exitEditMode();
      } else {
        enterEditMode();
      }
    });

    pre.addEventListener('dblclick', function () {
      if (isEditing) return;
      enterEditMode();
    });

    // ── Run Button (skipped for data-norun blocks) ──
    if (!pre.closest('[data-norun]')) {
      const runBtn = document.createElement('button');
      runBtn.className = 'run-btn';
      runBtn.textContent = '▶ Запустить';
      runBtn.title = 'Запустить код в песочнице';
      runBtn.setAttribute('aria-label', 'Запустить код в песочнице');
      toolbar.appendChild(runBtn);

      // ── Sandbox Input ──
      const sandboxInput = document.createElement('textarea');
      sandboxInput.className = 'sandbox-input';
      sandboxInput.placeholder = 'Введите данные для input() — каждое значение на новой строке…';
      sandboxInput.style.display = 'none';
      wrapper.appendChild(sandboxInput);

      // ── Exercise Buttons ──
      const exerciseButtons = document.createElement('div');
      exerciseButtons.className = 'exercise-buttons';
      exerciseButtons.style.display = 'none';
      wrapper.appendChild(exerciseButtons);

      const exerciseRunBtn = document.createElement('button');
      exerciseRunBtn.className = 'exercise-run-btn';
      exerciseRunBtn.textContent = '▶ Выполнить';
      exerciseButtons.appendChild(exerciseRunBtn);

      const exerciseResetBtn = document.createElement('button');
      exerciseResetBtn.className = 'exercise-reset-btn';
      exerciseResetBtn.textContent = '✕ Сброс';
      exerciseButtons.appendChild(exerciseResetBtn);

      // ── Sandbox Output ──
      const sandboxOutput = document.createElement('div');
      sandboxOutput.className = 'sandbox-output';
      sandboxOutput.style.display = 'none';
      wrapper.appendChild(sandboxOutput);

      // ── Run handler ──
      runBtn.addEventListener('click', function () {
        if (isEditing) {
          exitEditMode();
        }
        const code = cleanCodeText(pre).trim();
        if (/input\s*\(/.test(code)) {
          exerciseButtons.style.display = 'flex';
          sandboxOutput.style.display = 'none';
          sandboxInput.style.display = 'block';
          sandboxInput.focus();
        } else {
          exerciseButtons.style.display = 'none';
          sandboxInput.style.display = 'none';
          sandboxInput.value = '';
          sandboxOutput.style.display = 'block';
          runSandbox(sandboxOutput, code, '');
        }
      });

      // ── Exercise run handler ──
      exerciseRunBtn.addEventListener('click', function () {
        const code = cleanCodeText(pre).trim();
        const input = sandboxInput.value;
        sandboxOutput.style.display = 'block';
        runSandbox(sandboxOutput, code, input);
      });

      // ── Exercise reset handler ──
      exerciseResetBtn.addEventListener('click', function () {
        sandboxInput.style.display = 'none';
        exerciseButtons.style.display = 'none';
        sandboxOutput.style.display = 'none';
        sandboxInput.value = '';
        sandboxOutput.textContent = '';
      });
    }
  });
}