'use strict';

/**
 * Sandbox client - shared sandbox execution logic
 */

import { showSandboxResult } from './utils.js';
import {
  MAX_SANDBOX_CODE_LENGTH,
  DEFAULT_SANDBOX_TIMEOUT,
  SANDBOX_TIMEOUT_BUFFER_MS,
} from '../config/constants.js';

const activeFetchControllers = new WeakMap();

function hasDangerousBracketNotation(code) {
  const bracketPatterns = [
    /\[["'`]system["'`]\]/i,
    /\[["'`]popen["'`]\]/i,
    /\[["'`]exec["'`]\]/i,
    /\[["'`]spawn["'`]\]/i,
    /\[["'`]fork["'`]\]/i,
    /\[["'`]remove["'`]\]/i,
    /\[["'`]rmdir["'`]\]/i,
    /\[["'`]__import__["'`]\]/i,
    /\[["'`]__builtins__["'`]\]/i,
    /\[["'`]__class__["'`]\]/i,
    /\[["'`]__subclasses__["'`]\]/i,
    /\[["'`]__bases__["'`]\]/i,
    /\[["'`]__globals__["'`]\]/i,
    /\[["'`]__code__["'`]\]/i,
  ];
  return bracketPatterns.some(function (re) { return re.test(code); });
}

function hasUnicodeBypass(code) {
  const dangerousIdentifiers = ['exec', 'eval', 'open', 'system', 'popen', '__import__', '__builtins__', '__class__', '__subclasses__', '__bases__', '__globals__'];
  for (let i = 0; i < dangerousIdentifiers.length; i++) {
    const kw = dangerousIdentifiers[i];
    let idx = 0;
    while ((idx = code.indexOf(kw[0], idx)) !== -1) {
      let found = true;
      for (let j = 1; j < kw.length; j++) {
        const ch = code[idx + j] || '';
        const expected = kw[j];
        if (ch !== expected && (ch.charCodeAt(0) > 127 || expected.charCodeAt(0) > 127)) {
          found = false;
          break;
        }
        if (ch !== expected) {
          found = false;
          break;
        }
      }
      if (found) {
        return false;
      }
      if (code.charCodeAt(idx) > 127) {
        return true;
      }
      idx++;
    }
  }
  return false;
}

const CLIENT_VALIDATION_RULES = [
  { pattern: /\bexec\s*\(/i, message: 'Функция exec() запрещена' },
  { pattern: /\beval\s*\(/i, message: 'Функция eval() запрещена' },
  { pattern: /\bcompile\s*\(/i, message: 'Функция compile() запрещена' },
  { pattern: /\b__import__\s*\(/i, message: '__import__() запрещён' },
  { pattern: /\b__builtins__\b/i, message: '__builtins__ запрещён' },
  { pattern: /\bos\b\s*\.\s*(?:system|popen|exec|remove|rmdir|rename|spawn|fork|kill|chdir|getcwd|listdir|walk|getenv|putenv|uname|getlogin|getpid|getuid|setuid)\s*\(/i, message: 'Опасный вызов os' },
  { pattern: /\bsubprocess\b/i, message: 'Модуль subprocess запрещён' },
  { pattern: /\bshutil\b/i, message: 'Модуль shutil запрещён' },
  { pattern: /\bsocket\b/i, message: 'Модуль socket запрещён' },
  { pattern: /\bhttp(?:\.|$)/i, message: 'Модуль http запрещён' },
  { pattern: /\brequests\b(?!\s*(?:==|!=|>=|<=|>|<))/i, message: 'Модуль requests запрещён' },
  { pattern: /\bctypes\b/i, message: 'Модуль ctypes запрещён' },
  { pattern: /\bopen\s*\(/i, message: 'Функция open() запрещена' },
  { pattern: /__\s*subclasses?\s*__/i, message: 'Обход __subclasses__ запрещён' },
  { pattern: /\bos\s*\[/, message: 'Опасный доступ к os через скобки' },
  { pattern: /\bsys\s*\[/, message: 'Опасный доступ к sys через скобки' },
  { pattern: /\b(?:__class__|__bases__|__mro__|__subclasses__|__globals__|__code__)\b/, message: 'Доступ к дандер-атрибутам через скобки' },
];

/**
 * Validate Python code client-side before sending to sandbox.
 * Defense-in-depth: server-side AST validation is the primary check.
 *
 * @param {string} code
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateCode(code) {
  if (!code || !code.trim()) {
    return { ok: false, error: 'Пустой код' };
  }
  if (code.length > MAX_SANDBOX_CODE_LENGTH) {
    return { ok: false, error: 'Код слишком длинный (максимум 64 КБ)' };
  }
  if (hasDangerousBracketNotation(code)) {
    return { ok: false, error: 'Обход через скобочную нотацию запрещён' };
  }
  if (hasUnicodeBypass(code)) {
    return { ok: false, error: 'Подозрительные Unicode-символы в коде' };
  }
  for (const rule of CLIENT_VALIDATION_RULES) {
    if (rule.pattern.test(code)) {
      return { ok: false, error: rule.message };
    }
  }
  return { ok: true };
}

/**
 * Create an AbortSignal with timeout
 */
export function createTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(function () {
    controller.abort();
  }, timeoutMs);
  return controller.signal;
}

/**
 * Run code in the sandbox
 */
export async function runSandbox(outputEl, code, stdin, timeout) {
  if (activeFetchControllers.has(outputEl)) {
    activeFetchControllers.get(outputEl).abort();
  }

  const controller = new AbortController();
  const totalTimeout = (timeout || DEFAULT_SANDBOX_TIMEOUT) * 1000 + SANDBOX_TIMEOUT_BUFFER_MS;
  const timeoutSignal = createTimeoutSignal(totalTimeout);

  function onTimeoutAbort() {
    controller.abort();
  }

  timeoutSignal.addEventListener('abort', onTimeoutAbort);
  activeFetchControllers.set(outputEl, controller);

  const body = JSON.stringify({
    code: code,
    input: stdin || '',
    timeout: timeout || 5,
  });

  try {
    showSandboxResult(outputEl, { ok: true, stdout: '⏳ Выполнение...', stderr: '' });

    const response = await fetch('sandbox/run.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      signal: controller.signal,
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
    showSandboxResult(outputEl, result);
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      showSandboxResult(outputEl, { ok: false, stderr: '⚠️ Таймаут выполнения' });
    } else {
      showSandboxResult(outputEl, { ok: false, stderr: '⚠️ Ошибка sandbox: ' + error.message });
    }
  } finally {
    activeFetchControllers.delete(outputEl);
    timeoutSignal.removeEventListener('abort', onTimeoutAbort);
  }
}