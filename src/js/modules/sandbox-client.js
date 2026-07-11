'use strict';

/**
 * Sandbox client - shared sandbox execution logic
 */

import { showSandboxResult } from './utils.js';

const activeFetchControllers = new WeakMap();

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
  const totalTimeout = (timeout || 5) * 1000 + 2000;
  const timeoutSignal = createTimeoutSignal(totalTimeout);

  function onTimeoutAbort() {
    controller.abort();
  }

  timeoutSignal.addEventListener('abort', onTimeoutAbort);
  controller.signal.addEventListener('abort', function () {
    timeoutSignal.removeEventListener('abort', onTimeoutAbort);
  });

  activeFetchControllers.set(outputEl, controller);

  outputEl.className = 'sandbox-output running';
  outputEl.textContent = '⏳ Выполнение...';
  outputEl.style.display = 'block';

  try {
    // Код и stdin отправляются как есть. Серверная песочница сама
    // валидирует AST и ограничивает размер ввода, поэтому клиентская
    // «санитизация» только портит легитимный Python (например, сравнения `a < b`).
    const response = await fetch('sandbox/run.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        input: stdin,
        timeout: timeout || 5,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMsg = 'HTTP ' + response.status + ': ' + response.statusText;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) errorMsg = errJson.error;
      } catch (_e) {
        /* ignore parse error */
      }
      throw new Error(errorMsg);
    }

    showSandboxResult(outputEl, await response.json());
  } catch (err) {
    if (err.name === 'AbortError') {
      outputEl.className = 'sandbox-output running';
      outputEl.textContent = '⏳ Запрос прерван новым запуском';
    } else {
      outputEl.className = 'sandbox-output error';
      outputEl.style.display = 'block';
      outputEl.textContent = '⚠️ Ошибка: ' + err.message;
    }
  } finally {
    activeFetchControllers.delete(outputEl);
  }
}
