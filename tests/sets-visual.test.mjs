// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSetsVisual } from '../src/js/modules/sets-visual.js';

function setupDiagram() {
  const container = document.createElement('div');
  container.setAttribute('data-sets-visual', '');
  container.setAttribute('data-a', '1,2,3,4');
  container.setAttribute('data-b', '3,4,5,6');
  document.body.appendChild(container);
  initSetsVisual();
  return container;
}

function activeNumbers(container) {
  return Array.from(container.querySelectorAll('.num-bubble.active'))
    .map(function (b) { return b.getAttribute('data-num'); })
    .sort(function (x, y) { return Number(x) - Number(y); });
}

function activeRegions(container) {
  return Array.from(container.querySelectorAll('.region.shaded')).map(function (r) {
    return r.getAttribute('class').split(' ')[1];
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('sets-visual Euler diagram', () => {
  it('builds an SVG with all 6 numbers placed in bubbles', () => {
    const container = setupDiagram();

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    const bubbles = container.querySelectorAll('.num-bubble');
    expect(bubbles.length).toBe(6);

    const nums = Array.from(bubbles)
      .map(function (b) { return b.getAttribute('data-num'); })
      .sort();
    expect(nums).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('shows default message and no active state before any click', () => {
    const container = setupDiagram();

    expect(container.querySelector('.sets-visual-result').textContent).toContain('Нажмите кнопку');
    expect(container.querySelectorAll('.num-bubble.active').length).toBe(0);
    expect(container.querySelectorAll('.region.shaded').length).toBe(0);
  });

  it('union highlights every number', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="union"]').click();

    expect(activeNumbers(container)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(activeRegions(container).sort()).toEqual(['region-a-only', 'region-b-only', 'region-inter'].sort());
    expect(container.querySelector('.sets-visual-result').textContent).toBe('A ∪ B = {1, 2, 3, 4, 5, 6}');
  });

  it('intersection highlights only the common numbers', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="intersection"]').click();

    expect(activeNumbers(container)).toEqual(['3', '4']);
    expect(activeRegions(container)).toEqual(['region-inter']);
    expect(container.querySelector('.sets-visual-result').textContent).toBe('A ∩ B = {3, 4}');
  });

  it('A − B highlights numbers unique to A', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="a-minus-b"]').click();

    expect(activeNumbers(container)).toEqual(['1', '2']);
    expect(activeRegions(container)).toEqual(['region-a-only']);
    expect(container.querySelector('.sets-visual-result').textContent).toBe('A − B = {1, 2}');
  });

  it('B − A highlights numbers unique to B', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="b-minus-a"]').click();

    expect(activeNumbers(container)).toEqual(['5', '6']);
    expect(activeRegions(container)).toEqual(['region-b-only']);
    expect(container.querySelector('.sets-visual-result').textContent).toBe('B − A = {5, 6}');
  });

  it('symmetric difference highlights non-common numbers', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="symdiff"]').click();

    expect(activeNumbers(container)).toEqual(['1', '2', '5', '6']);
    expect(activeRegions(container).sort()).toEqual(['region-a-only', 'region-b-only'].sort());
    expect(container.querySelector('.sets-visual-result').textContent).toBe('A ⊕ B = {1, 2, 5, 6}');
  });

  it('reset clears the highlighted result', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="union"]').click();
    container.querySelector('[data-op="none"]').click();

    expect(container.querySelectorAll('.num-bubble.active').length).toBe(0);
    expect(container.querySelectorAll('.region.shaded').length).toBe(0);
    expect(container.querySelector('.sets-visual-result').textContent).toContain('Нажмите кнопку');
  });

  it('marks exactly one active button at a time', () => {
    const container = setupDiagram();

    container.querySelector('[data-op="union"]').click();
    container.querySelector('[data-op="intersection"]').click();

    const activeButtons = container.querySelectorAll('.sets-btn.active');
    expect(activeButtons.length).toBe(1);
    expect(activeButtons[0].getAttribute('data-op')).toBe('intersection');
    expect(activeButtons[0].getAttribute('aria-pressed')).toBe('true');
  });
});