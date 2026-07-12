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

const CLIENT_VALIDATION_RULES = [
  { pattern: /\bexec\s*\(/i, message: 'Функция exec() запрещена' },
  { pattern: /\beval\s*\(/i, message: 'Функция eval() запрещена' },
  { pattern: /\bcompile\s*\(/i, message: 'Функция compile() запрещена' },
  { pattern: /\b__import__\s*\(/i, message: '__import__() запрещён' },
  { pattern: /\b__builtins__\b/i, message: '__builtins__ запрещён' },
  { pattern: /\bos\b\s*\.\s*(system|popen|exec|remove|rmdir|rename)\s*\(/i, message: 'Опасный вызов os' },
  { pattern: /\bsubprocess\b/i, message: 'Модуль subprocess запрещён' },
  { pattern: /\bshutil\b/i, message: 'Модуль shutil запрещён' },
  { pattern: /\bsocket\b/i, message: 'Модуль socket запрещён' },
  { pattern: /\bhttp\b/i, message: 'Модуль http запрещён' },
  { pattern: /\brequests\b/i, message: 'Модуль requests запрещён' },
  { pattern: /\bctypes\b/i, message: 'Модуль ctypes запрещён' },
  { pattern: /\bopen\s*\(/i, message: 'Функция open() запрещена' },
  { pattern: /__\s*subclasses?\s*__/i, message: 'Обход __subclasses__ запрещён' },
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