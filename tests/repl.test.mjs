import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const replSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'repl.js'), 'utf-8');

function extractFunction(name, src) {
  const re = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = src.match(re);
  if (!m) throw new Error(`Function ${name} not found`);
  return new Function(m[1], m[2]);
}

// ─── uuidv4 ───

describe('uuidv4', () => {
  const uuidv4 = extractFunction('uuidv4', replSrc);

  it('returns a string in UUID v4 format', () => {
    const id = uuidv4();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(uuidv4());
    }
    expect(ids.size).toBe(100);
  });

  it('has correct version nibble (4)', () => {
    const id = uuidv4();
    expect(id[14]).toBe('4');
  });

  it('has correct variant bits', () => {
    const id = uuidv4();
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });
});

// ─── renderHistory ───

describe('renderHistory', () => {
  it('uses textContent for safe rendering of history entries', () => {
    expect(replSrc).toContain('inputLine.appendChild(document.createTextNode(entry.code))');
    expect(replSrc).toContain('outputDiv.textContent = entry.output');
    expect(replSrc).toContain('errorDiv.textContent =');
  });

  it('does not use innerHTML for rendering history', () => {
    const historySection = replSrc.substring(
      replSrc.indexOf('function renderHistory'),
      replSrc.indexOf('// ─── DOMContentLoaded'),
    );
    expect(historySection).not.toContain('innerHTML');
  });

  it('incrementally appends new entries only', () => {
    expect(replSrc).toContain('_renderedHistoryCount');
  });
});

// ─── Security: data injection prevention ───

describe('REPL security', () => {
  it('uses textContent for all dynamic content in editor output', () => {
    const editorSection = replSrc.substring(
      replSrc.indexOf('async function runEditor'),
      replSrc.indexOf('// ─── Render history'),
    );
    expect(editorSection).toContain('div.textContent = result.stdout');
    expect(editorSection).toContain('div.textContent = ');
    expect(editorSection).toContain('span.textContent =');
    expect(editorSection).not.toContain('innerHTML');
  });

  it('snippets use safe DOM API for code injection', () => {
    const snippetSection = replSrc.substring(
      replSrc.indexOf('snippets.forEach'),
      replSrc.indexOf('snippetsEl.querySelectorAll'),
    );
    expect(snippetSection).toContain("setAttribute('data-code', s.code)");
    expect(snippetSection).not.toContain('.innerHTML');
  });
});

// ─── Session management ───

describe('session management', () => {
  it('generates unique session ID per page load', () => {
    const uuidv4 = extractFunction('uuidv4', replSrc);
    const id1 = uuidv4();
    const id2 = uuidv4();
    expect(id1).not.toBe(id2);
  });

  it('session ID is used in fetch calls', () => {
    expect(replSrc).toContain('session_id: sessionId');
  });

  it('reset sends correct payload', () => {
    expect(replSrc).toContain('reset: true');
  });
});
