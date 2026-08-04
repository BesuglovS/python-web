'use strict';

/**
 * Syntax highlighting module (fallback for highlight.js)
 */

export function highlightPythonFallback(el) {
  const text = el.textContent || '';
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(document.createTextNode(text));
  let html = tempDiv.innerHTML;

  // Strings — marker-based approach to avoid nested spans (Safari-compatible, no lookbehind)
  let _s = 0;
  const markers = {};
  function _mark(m) {
    const k = '\x00S' + _s++ + '\x00';
    markers[k] = m;
    return k;
  }

  html = html.replace(/('''[\s\S]*?'''|"""[\s\S]*?""")/g, function (m) {
    return _mark('<span class="py-string">' + m + '</span>');
  });
  html = html.replace(/(f"[^"\n]*"|f'[^'\n]*')/g, function (m) {
    return _mark('<span class="py-fstring">' + m + '</span>');
  });
  html = html.replace(/("[^"\n]*"|'[^'\n]*')/g, function (m) {
    return _mark('<span class="py-string">' + m + '</span>');
  });

  // Comments
  html = html.replace(/(^|[^"'])(#.*$)/gm, '$1<span class="py-comment">$2</span>');
  // Numbers
  html = html.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?j?)\b/g, '<span class="py-number">$1</span>');

  // Restore string markers
  for (const mk in markers) {
    html = html.replace(mk, markers[mk]);
  }

  // Keywords
  const keywords = [
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
  ];
  for (let i = 0; i < keywords.length; i++) {
    const kwRegex = new RegExp('\\b(' + keywords[i] + ')\\b(?![^<]*>|[^<]*</span>)', 'g');
    html = html.replace(kwRegex, '<span class="py-keyword">$1</span>');
  }

  // Built-in functions
  const builtins = [
    'print',
    'len',
    'range',
    'type',
    'int',
    'str',
    'float',
    'bool',
    'list',
    'dict',
    'set',
    'tuple',
    'input',
    'open',
    'enumerate',
    'zip',
    'map',
    'filter',
    'sorted',
    'reversed',
    'sum',
    'min',
    'max',
    'abs',
    'round',
    'isinstance',
    'hasattr',
    'getattr',
    'setattr',
    'super',
    'iter',
    'next',
    'any',
    'all',
    'id',
    'dir',
    'help',
    'format',
    'ord',
    'chr',
    'divmod',
    'pow',
    'hex',
    'oct',
    'bin',
    'repr',
    'eval',
    'exec',
    'compile',
    'globals',
    'locals',
    'vars',
    '__import__',
  ];
  for (let j = 0; j < builtins.length; j++) {
    const builtinRegex = new RegExp('\\b(' + builtins[j] + ')\\b(?=[\\s\\(])', 'g');
    html = html.replace(builtinRegex, '<span class="py-builtin">$1</span>');
  }

  // Decorators
  html = html.replace(/(@\w+)/g, '<span class="py-decorator">$1</span>');

  el.innerHTML = html;
}

export function initSyntaxHighlighting() {
  const codeBlocks = document.querySelectorAll(
    'main pre, .main-content pre, pre.code-block, main pre code, .main-content pre code, pre.code-block code',
  );
  const preElements = [];

  codeBlocks.forEach(function (el) {
    if (el.tagName === 'CODE' && el.parentElement.tagName === 'PRE') {
      if (preElements.indexOf(el.parentElement) === -1) {
        preElements.push(el.parentElement);
      }
    } else if (el.tagName === 'PRE') {
      if (preElements.indexOf(el) === -1) {
        preElements.push(el);
      }
    }
  });

  const hljsAvailable = typeof hljs !== 'undefined';

  preElements.forEach(function (pre) {
    pre.classList.add('language-python');
    const codeEl = pre.querySelector('code') || pre;
    if (hljsAvailable) {
      hljs.highlightElement(codeEl);
    } else {
      highlightPythonFallback(codeEl);
    }
  });

  // Retry with hljs if it loads late
  if (!hljsAvailable) {
    setTimeout(function () {
      if (typeof hljs !== 'undefined') {
        preElements.forEach(function (pre) {
          const code = pre.querySelector('code');
          const target = code || pre;
          if (code && code.querySelector('.py-keyword')) {
            // eslint-disable-next-line no-self-assign
            code.textContent = code.textContent;
          }
          delete target.dataset.highlighted;
          hljs.highlightElement(target);
        });
      }
    }, 500);

    setTimeout(function () {
      if (typeof hljs !== 'undefined') {
        document
          .querySelectorAll('main pre.language-python, .main-content pre.language-python')
          .forEach(function (pre) {
            const codeEl = pre.querySelector('code');
            if (codeEl && !codeEl.dataset.highlighted) {
              hljs.highlightElement(codeEl);
            }
          });
      }
    }, 1500);
  }
}
