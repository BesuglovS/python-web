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

function handleCodeTabKey(e) {
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
  }
}

/**
 * Re-highlight a code block
 * @param {HTMLElement} preEl - The pre element containing code
 */
function reHighlight(preEl) {
  const code = preEl.querySelector('code') || preEl;
  const text = code.textContent || '';
  code.textContent = text;
  if (typeof hljs !== 'undefined') {
    preEl.classList.add('language-python');
    hljs.highlightElement(code);
  } else {
    highlightPythonFallback(code);
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
      const text = pre.textContent || pre.innerText || '';

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

    let isEditing = false;

    editBtn.addEventListener('click', function () {
      isEditing = !isEditing;
      pre.contentEditable = isEditing ? 'true' : 'false';
      pre.spellcheck = false;
      if (isEditing) {
        pre.classList.add('editing');
        editBtn.classList.add('active');
        editBtn.textContent = '✓ Готово';
        pre.focus();
        pre.addEventListener('keydown', handleCodeTabKey);
      } else {
        pre.classList.remove('editing');
        editBtn.classList.remove('active');
        editBtn.textContent = '✎ Ред.';
        pre.removeEventListener('keydown', handleCodeTabKey);
        reHighlight(pre);
      }
    });

    pre.addEventListener('dblclick', function () {
      if (isEditing) return;
      isEditing = true;
      pre.contentEditable = 'true';
      pre.spellcheck = false;
      pre.classList.add('editing');
      editBtn.classList.add('active');
      editBtn.textContent = '✓ Готово';
      pre.focus();
      pre.addEventListener('keydown', handleCodeTabKey);
    });

    toolbar.appendChild(editBtn);

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
          isEditing = false;
          pre.contentEditable = 'false';
          pre.classList.remove('editing');
          editBtn.classList.remove('active');
          editBtn.textContent = '✎ Ред.';
          reHighlight(pre);
        }
        const code = (pre.textContent || pre.innerText || '').trim();
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
        const code = (pre.textContent || pre.innerText || '').trim();
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