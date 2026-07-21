'use strict';

import { safeGetItem, safeSetItem, safeRemoveItem } from './config/security.js';
import { incrementCodeRuns } from './modules/api-client.js';
import {
  MAX_REPL_HISTORY,
  PERSISTED_REPL_HISTORY,
  DEFAULT_SANDBOX_TIMEOUT,
} from './config/constants.js';

// ─── UUID generation for session isolation ───
function uuidv4() {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && cryptoObj.randomUUID) return cryptoObj.randomUUID();
  const arr = new Uint8Array(16);
  cryptoObj.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  let hex = '';
  for (let i = 0; i < 16; i++) hex += arr[i].toString(16).padStart(2, '0');
  return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + hex.substring(20);
}

let sessionId = uuidv4();
let replHistory = [];

try {
  const saved = safeGetItem('python-repl-history');
  if (saved) {
    replHistory = JSON.parse(saved);
  }
} catch (_e) {
  // ignore parse errors
}

let currentReplController = null;
let currentEditorController = null;

// ─── REPL execution ───
async function runRepl() {
  const input = document.getElementById('repl-input');
  if (!input) return;

  const code = input.value.trim();
  if (!code) return;

  if (currentReplController) currentReplController.abort();
  currentReplController = new AbortController();

  const btn = document.getElementById('repl-run-btn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('running');
    btn.textContent = '\u23f3 \u0412\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f...';
    btn.setAttribute('aria-busy', 'true');
  }

  const entry = { code: code, output: '', error: '', time: Date.now() };

  try {
    const stdinEl = document.getElementById('repl-stdin');
    const stdinData = stdinEl ? stdinEl.value : '';

    const response = await fetch('sandbox/repl.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        input: stdinData,
        timeout: DEFAULT_SANDBOX_TIMEOUT,
        session_id: sessionId,
      }),
      signal: currentReplController.signal,
    });

    if (!response.ok) {
      let errorMsg = 'HTTP ' + response.status;
      try {
        const errData = await response.json();
        if (errData && errData.error) errorMsg = errData.error;
      } catch (_e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    if (result.session_id) sessionId = result.session_id;
    entry.output = result.stdout || '';
    entry.error = result.stderr || '';
    if (!entry.output && !entry.error && result.ok) {
      entry.output = '✅ Код выполнен (без вывода)';
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      entry.error = err.message;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('running');
      btn.textContent = '\u25b6 \u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c';
      btn.setAttribute('aria-busy', 'false');
    }
    currentReplController = null;
  }

  if (entry.output || entry.error) {
    replHistory.push(entry);
    if (replHistory.length > MAX_REPL_HISTORY) replHistory.shift();

    try {
      safeSetItem('python-repl-history', JSON.stringify(replHistory.slice(-PERSISTED_REPL_HISTORY)));
    } catch (_e) {
      // ignore
    }

    incrementCodeRuns();
  }

  renderHistory();
  input.value = '';
  input.focus();
}

// ─── Editor execution ───
async function runEditor() {
  const input = document.getElementById('editor-input');
  const output = document.getElementById('editor-output');
  if (!input || !output) return;

  const code = input.value.trim();
  if (!code) return;

  if (currentEditorController) currentEditorController.abort();
  currentEditorController = new AbortController();

  const btn = document.getElementById('editor-run-btn');
  if (btn) {
    btn.classList.add('running');
    btn.textContent = '\u23f3 \u0412\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f...';
    btn.setAttribute('aria-busy', 'true');
  }
  output.textContent = '\u23f3 \u0412\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f...';
  output.setAttribute('aria-busy', 'true');

  try {
    const stdinEl = document.getElementById('editor-stdin');
    const stdinData = stdinEl ? stdinEl.value : '';

    const response = await fetch('sandbox/repl.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        input: stdinData,
        timeout: 10,
        session_id: sessionId,
      }),
      signal: currentEditorController.signal,
    });

    if (!response.ok) {
      let errorMsg = 'HTTP ' + response.status;
      try {
        const errData = await response.json();
        if (errData && errData.error) errorMsg = errData.error;
      } catch (_e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    if (result.session_id) sessionId = result.session_id;
    output.textContent = '';
    output.style.color = '';
    if (result.stdout) {
      const div = document.createElement('div');
      div.style.color = 'var(--text)';
      div.textContent = result.stdout;
      output.appendChild(div);
    }
    if (result.stderr) {
      const div = document.createElement('div');
      div.style.color = '#ef4444';
      div.textContent = '⚠️ ' + result.stderr;
      output.appendChild(div);
    }
    if (!result.stdout && !result.stderr && result.ok) {
      const div = document.createElement('div');
      div.style.color = '#10b981';
      div.textContent = '✅ Код выполнен без вывода';
      output.appendChild(div);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      output.textContent = '';
      const span = document.createElement('span');
      span.style.color = '#ef4444';
      span.textContent = '⚠️ ' + err.message;
      output.appendChild(span);
    }
  } finally {
    if (btn) {
      btn.classList.remove('running');
      btn.textContent = '\u25b6 \u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c';
      btn.setAttribute('aria-busy', 'false');
    }
    output.removeAttribute('aria-busy');
    currentEditorController = null;
  }

  incrementCodeRuns();
}

// ─── Render history (DOM API, incremental update) ───
let _renderedHistoryCount = 0;

function renderHistory() {
  const container = document.getElementById('repl-history');
  const countEl = document.getElementById('history-count');

  if (!container) return;

  if (!container.getAttribute('role')) {
    container.setAttribute('role', 'log');
    container.setAttribute('aria-label', '\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u043a\u043e\u043c\u0430\u043d\u0434 REPL');
    container.setAttribute('aria-live', 'polite');
  }

  if (countEl) {
    countEl.textContent = replHistory.length + ' команд';
  }

  // Full rebuild needed when history shrinks (clear) or on first render
  if (_renderedHistoryCount > replHistory.length || _renderedHistoryCount === 0) {
    container.textContent = '';
    _renderedHistoryCount = 0;
  }

  // Append only new entries (incremental)
  for (let i = _renderedHistoryCount; i < replHistory.length; i++) {
    const entry = replHistory[i];
    const entryDiv = document.createElement('div');
    entryDiv.className = 'repl-entry';

    const inputLine = document.createElement('div');
    inputLine.className = 'repl-input-line';
    const prompt = document.createElement('span');
    prompt.className = 'repl-prompt';
    prompt.textContent = '>>> ';
    inputLine.appendChild(prompt);
    inputLine.appendChild(document.createTextNode(entry.code));
    entryDiv.appendChild(inputLine);

    if (entry.output) {
      const outputDiv = document.createElement('div');
      outputDiv.className = 'repl-output';
      outputDiv.textContent = entry.output;
      entryDiv.appendChild(outputDiv);
    }
    if (entry.error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'repl-error';
      errorDiv.textContent = '⚠️ ' + entry.error;
      entryDiv.appendChild(errorDiv);
    }

    container.appendChild(entryDiv);
  }

  _renderedHistoryCount = replHistory.length;

  if (replHistory.length > 0) {
    container.scrollTop = container.scrollHeight;
  } else {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'color: var(--text-muted); text-align: center; padding: 0 30px;';
    placeholder.textContent = 'Пока нет Python-кода. Нажмите ';
    const strong = document.createElement('strong');
    strong.textContent = '▶ Запустить';
    placeholder.appendChild(strong);
    container.appendChild(placeholder);
  }
}

// ─── DOMContentLoaded ───
document.addEventListener('DOMContentLoaded', function () {
  // Initialize snippets
  (function () {
    const snippetsEl = document.getElementById('repl-snippets');
    if (!snippetsEl) return;

    const snippets = [
      { label: 'print()', code: 'print("Привет, мир!")' },
      { label: 'range()', code: 'for i in range(5):\n    print(i, end=" ")' },
      {
        label: 'sorted()',
        code: 'numbers = [3, 1, 4, 1, 5, 9]\nprint(sorted(numbers))\nprint(sorted(numbers, reverse=True))',
      },
      { label: 'lambda', code: 'square = lambda x: x**2\nprint(square(7))' },
      { label: 'list comp', code: 'squares = [x**2 for x in range(10)]\nprint(squares)' },
      { label: 'dict', code: 'd = {"a": 1, "b": 2}\nfor k, v in d.items():\n    print(k, "→", v)' },
      {
        label: 'zip',
        code: 'names = ["Аня", "Боря"]\nages = [16, 17]\nfor n, a in zip(names, ages):\n    print(f"{n} — {a}")',
      },
    ];

    snippets.forEach(function (s) {
      const btn = document.createElement('button');
      btn.className = 'repl-snippet';
      btn.setAttribute('data-code', s.code);
      btn.textContent = s.label;
      btn.setAttribute('aria-label', '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043f\u0440\u0438\u043c\u0435\u0440: ' + s.label);
      snippetsEl.appendChild(btn);
    });

    snippetsEl.querySelectorAll('.repl-snippet').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const input = document.getElementById('repl-input');
        if (input) {
          input.value = btn.getAttribute('data-code');
          input.focus();
        }
      });
    });
  })();

  // Tab switching
  const tabContainer = document.querySelector('.repl-toolbar .repl-tabs');
  if (tabContainer) {
    tabContainer.setAttribute('role', 'tablist');
  }
  document.querySelectorAll('.repl-toolbar button[data-tab]').forEach(function (btn) {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
    btn.addEventListener('click', function () {
      const tab = btn.dataset.tab;
      const replTab = document.getElementById('tab-repl');
      const editorTab = document.getElementById('tab-editor');

      if (replTab) replTab.style.display = tab === 'repl' ? '' : 'none';
      if (editorTab) editorTab.style.display = tab === 'editor' ? '' : 'none';

      document.querySelectorAll('.repl-toolbar button[data-tab]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
      });
    });
  });

  // Set ARIA on tab panels
  const replTabPanel = document.getElementById('tab-repl');
  const editorTabPanel = document.getElementById('tab-editor');
  if (replTabPanel) { replTabPanel.setAttribute('role', 'tabpanel'); replTabPanel.setAttribute('aria-label', 'REPL'); }
  if (editorTabPanel) { editorTabPanel.setAttribute('role', 'tabpanel'); editorTabPanel.setAttribute('aria-label', '\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440'); }

  // Keyboard shortcuts
  const replInput = document.getElementById('repl-input');
  if (replInput) {
    replInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runRepl();
      }
    });
  }

  const editorInput = document.getElementById('editor-input');
  if (editorInput) {
    editorInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        runEditor();
      }
    });
  }

  renderHistory();
});

// ─── Public API ───
window.clearHistory = function () {
  replHistory = [];
  _renderedHistoryCount = 0;
  safeRemoveItem('python-repl-history');
  renderHistory();

  fetch('sandbox/repl.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '', reset: true, session_id: sessionId }),
  }).catch(function () {
    // ignore
  });
};

window.runRepl = runRepl;
window.runEditor = runEditor;

// Reset session on page unload
window.addEventListener('beforeunload', function () {
  const data = JSON.stringify({ code: '', reset: true, session_id: sessionId });
  navigator.sendBeacon('sandbox/repl.php', new Blob([data], { type: 'application/json' }));
});
