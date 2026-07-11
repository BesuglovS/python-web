import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const mindmapSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'mindmap.js'), 'utf-8');

describe('mindmap.js', () => {
  it('does not use innerHTML with unescaped data', () => {
    expect(mindmapSrc).not.toContain('innerHTML');
  });

  it('sets section titles via textContent (safe DOM API)', () => {
    expect(mindmapSrc).toContain('h2.textContent =');
    expect(mindmapSrc).toContain('section.title');
  });

  it('sets lesson titles via textContent', () => {
    expect(mindmapSrc).toContain('titleDiv.textContent = lesson.title');
  });

  it('sets lesson descriptions via textContent', () => {
    expect(mindmapSrc).toContain('descDiv.textContent = lesson.desc');
  });

  it('sets error messages via textContent', () => {
    expect(mindmapSrc).toContain('p.textContent =');
    expect(mindmapSrc).toContain('err.message');
  });
});
