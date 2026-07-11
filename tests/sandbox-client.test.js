// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSandbox } from '../src/js/modules/sandbox-client.js';

function makeEl() {
  return document.createElement('div');
}

function mockFetchOnce(result) {
  const captured = { url: null, opts: null };
  globalThis.fetch = vi.fn(async (url, opts) => {
    captured.url = url;
    captured.opts = opts;
    return {
      ok: result.ok,
      status: result.status || 200,
      statusText: result.statusText || 'OK',
      json: async () => result.json,
    };
  });
  return captured;
}

describe('runSandbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends Python code verbatim (does not strip < or >)', async () => {
    const captured = mockFetchOnce({
      ok: true,
      json: { ok: true, stdout: 'out', stderr: '', exit_code: 0 },
    });
    await runSandbox(
      makeEl(),
      'x = (a < b) if (b < c) else (c < a)',
      'in < put',
      5,
    );
    expect(captured.url).toContain('sandbox/run.php');
    const body = JSON.parse(captured.opts.body);
    expect(body.code).toBe('x = (a < b) if (b < c) else (c < a)');
    expect(body.input).toBe('in < put');
    expect(body.timeout).toBe(5);
  });

  it('does not strip HTML-like tokens from code', async () => {
    const captured = mockFetchOnce({
      ok: true,
      json: { ok: true, stdout: '', stderr: '', exit_code: 0 },
    });
    await runSandbox(makeEl(), 'print("<b>hi</b>")', '', 3);
    const body = JSON.parse(captured.opts.body);
    expect(body.code).toBe('print("<b>hi</b>")');
  });

  it('renders sandbox result on success', async () => {
    mockFetchOnce({
      ok: true,
      json: { ok: true, stdout: '42', stderr: '', exit_code: 0 },
    });
    const el = makeEl();
    await runSandbox(el, 'print(42)', '', 5);
    expect(el.textContent).toContain('42');
  });

  it('renders error when response is not ok', async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: { error: 'boom' },
    });
    const el = makeEl();
    await runSandbox(el, 'print(1)', '', 5);
    expect(el.textContent).toContain('boom');
  });

  it('posts to sandbox/run.php endpoint', async () => {
    const captured = mockFetchOnce({
      ok: true,
      json: { ok: true, stdout: '', stderr: '', exit_code: 0 },
    });
    await runSandbox(makeEl(), 'pass', '', 5);
    expect(captured.url).toBe('sandbox/run.php');
  });
});
