'use strict';

// ─── UUID generation for session isolation ───
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let sessionId = uuidv4();
let history = [];

try {
  const saved = safeGetItem('python-repl-history');
  if (saved) {
    history = JSON.parse(saved);
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
    btn.textContent = '⏳ Выполняется...';
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
        timeout: 5,
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
      btn.textContent = '▶ Запустить';
    }
    currentReplController = null;
  }

  history.push(entry);
  if (history.length > 100) history.shift();

  try {
    safeSetItem('python-repl-history', JSON.stringify(history.slice(-50)));
  } catch (_e) {
    // ignore
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
    btn.textContent = '⏳ Выполняется...';
  }
  output.textContent = '⏳ Выполняется...';
  output.style.color = 'var(--text-muted)';

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
      btn.textContent = '▶ Запустить';
    }
    currentEditorController = null;
  }
}

// ─── Render history (DOM API, incremental update) ───
let _renderedHistoryCount = 0;

function renderHistory() {
  const container = document.getElementById('repl-history');
  const countEl = document.getElementById('history-count');

  if (!container) return;

  if (countEl) {
    countEl.textContent = history.length + ' команд';
  }

  // Full rebuild needed when history shrinks (clear) or on first render
  if (_renderedHistoryCount > history.length || _renderedHistoryCount === 0) {
    container.textContent = '';
    _renderedHistoryCount = 0;
  }

  // Append only new entries (incremental)
  for (let i = _renderedHistoryCount; i < history.length; i++) {
    const entry = history[i];
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

  _renderedHistoryCount = history.length;

  if (history.length > 0) {
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
  document.querySelectorAll('.repl-toolbar button[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tab = btn.dataset.tab;
      const replTab = document.getElementById('tab-repl');
      const editorTab = document.getElementById('tab-editor');

      if (replTab) replTab.style.display = tab === 'repl' ? '' : 'none';
      if (editorTab) editorTab.style.display = tab === 'editor' ? '' : 'none';

      document.querySelectorAll('.repl-toolbar button[data-tab]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === tab);
      });
    });
  });

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
  history = [];
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
