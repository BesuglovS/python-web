'use strict';

/**
 * Интерактивная диаграмма Эйлера (круги) для наглядного показа операций
 * над множествами. Отрисовывает два пересекающихся круга, размещает элементы
 * множеств по областям и подсвечивает результат операции по нажатию кнопки.
 *
 * Разметка в уроке:
 *   <div class="sets-visual" data-sets-visual data-a="1,2,3,4" data-b="3,4,5,6"></div>
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const VIEWBOX = { w: 420, h: 250 };

const CIRCLE_A = { cx: 150, cy: 120, r: 90 };
const CIRCLE_B = { cx: 270, cy: 120, r: 90 };

// Области (пути построены для кругов: центрA(150,120), центрB(270,120), r=90)
const REGION_PATHS = {
  aOnly: 'M210,52.92 A90,90 0 1 0 210,187.08 A90,90 0 0 1 210,52.92 Z',
  inter: 'M210,52.92 A90,90 0 0 1 210,187.08 A90,90 0 0 1 210,52.92 Z',
  bOnly: 'M210,187.08 A90,90 0 1 0 210,52.92 A90,90 0 0 1 210,187.08 Z',
};

const REGION_CLASS = {
  aOnly: 'region-a-only',
  inter: 'region-inter',
  bOnly: 'region-b-only',
};

// Слоты для размещения чисел внутри каждой области
const SLOTS = {
  aOnly: [
    { x: 95, y: 98 },
    { x: 95, y: 142 },
    { x: 120, y: 60 },
    { x: 120, y: 180 },
  ],
  inter: [
    { x: 203, y: 104 },
    { x: 217, y: 136 },
    { x: 217, y: 104 },
    { x: 203, y: 136 },
  ],
  bOnly: [
    { x: 325, y: 98 },
    { x: 325, y: 142 },
    { x: 300, y: 60 },
    { x: 300, y: 180 },
  ],
};

const RESULT_DEFAULT = 'Нажмите кнопку, чтобы подсветить результат операции.';

export function initSetsVisual() {
  const containers = document.querySelectorAll('[data-sets-visual]');
  if (!containers.length) return;
  containers.forEach(buildDiagram);
}

function buildDiagram(container) {
  const a = parseSet(container.getAttribute('data-a'));
  const b = parseSet(container.getAttribute('data-b'));
  if (!a.length || !b.length) return;

  const aSet = new Set(a);
  const bSet = new Set(b);

  const inter = a.filter(function (v) { return bSet.has(v); });
  const aOnly = a.filter(function (v) { return !bSet.has(v); });
  const bOnly = b.filter(function (v) { return !aSet.has(v); });

  const svg = buildSvg(a, b, aOnly, inter, bOnly);
  const setsInfo = buildSetsInfo(a, b);
  const result = buildResult();
  const controls = buildControls({
    a: a,
    b: b,
    aOnly: aOnly,
    inter: inter,
    bOnly: bOnly,
  }, result, svg);

  container.appendChild(svg);
  container.appendChild(setsInfo);
  container.appendChild(result);
  container.appendChild(controls);
}

function parseSet(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function sortNumeric(values) {
  return values.slice().sort(function (x, y) { return Number(x) - Number(y); });
}

function formatSet(values) {
  return '{' + values.join(', ') + '}';
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }
  return el;
}

function buildSvg(a, b, aOnly, inter, bOnly) {
  const svg = svgEl('svg', {
    viewBox: '0 0 ' + VIEWBOX.w + ' ' + VIEWBOX.h,
    role: 'img',
    'aria-label': 'Диаграмма Эйлера: множества A = ' + formatSet(sortNumeric(a)) +
      ' и B = ' + formatSet(sortNumeric(b)),
  });

  const regions = svgEl('g', { class: 'regions' });
  ['aOnly', 'inter', 'bOnly'].forEach(function (key) {
    const path = svgEl('path', { d: REGION_PATHS[key], class: 'region ' + REGION_CLASS[key] });
    regions.appendChild(path);
  });
  svg.appendChild(regions);

  const outlines = svgEl('g', { class: 'circle-outlines' });
  outlines.appendChild(svgEl('circle', {
    cx: CIRCLE_A.cx,
    cy: CIRCLE_A.cy,
    r: CIRCLE_A.r,
    class: 'circle-outline circle-a',
  }));
  outlines.appendChild(svgEl('circle', {
    cx: CIRCLE_B.cx,
    cy: CIRCLE_B.cy,
    r: CIRCLE_B.r,
    class: 'circle-outline circle-b',
  }));
  svg.appendChild(outlines);

  const labels = svgEl('g', { class: 'set-labels' });
  const labelA = svgEl('text', { x: 150, y: 20, class: 'set-label', 'text-anchor': 'middle' });
  labelA.textContent = 'A';
  const labelB = svgEl('text', { x: 270, y: 20, class: 'set-label', 'text-anchor': 'middle' });
  labelB.textContent = 'B';
  labels.appendChild(labelA);
  labels.appendChild(labelB);
  svg.appendChild(labels);

  const numbers = svgEl('g', { class: 'number-bubbles' });
  appendBubbles(numbers, aOnly, 'aOnly', 'in-a');
  appendBubbles(numbers, inter, 'inter', 'in-inter');
  appendBubbles(numbers, bOnly, 'bOnly', 'in-b');
  svg.appendChild(numbers);

  return svg;
}

function appendBubbles(parent, values, region, membershipClass) {
  const slots = SLOTS[region];
  values.forEach(function (value, index) {
    const slot = slots[index % slots.length];
    const g = svgEl('g', {
      class: 'num-bubble ' + membershipClass,
    });
    g.setAttribute('data-num', value);
    g.appendChild(svgEl('circle', { cx: slot.x, cy: slot.y, r: 15 }));
    const text = svgEl('text', { x: slot.x, y: slot.y });
    text.textContent = value;
    g.appendChild(text);
    parent.appendChild(g);
  });
}

function buildSetsInfo(a, b) {
  const p = document.createElement('p');
  p.className = 'sets-visual-sets';
  p.textContent =
    'A = ' + formatSet(sortNumeric(a)) +
    '   B = ' + formatSet(sortNumeric(b));
  return p;
}

function buildResult() {
  const p = document.createElement('p');
  p.className = 'sets-visual-result';
  p.setAttribute('aria-live', 'polite');
  p.textContent = RESULT_DEFAULT;
  return p;
}

function buildControls(sets, resultEl, svg) {
  const controls = document.createElement('div');
  controls.className = 'sets-visual-controls';

  const operations = [
    { op: 'union', label: 'A ∪ B' },
    { op: 'intersection', label: 'A ∩ B' },
    { op: 'a-minus-b', label: 'A − B' },
    { op: 'b-minus-a', label: 'B − A' },
    { op: 'symdiff', label: 'A ⊕ B' },
  ];

  operations.forEach(function (item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sets-btn';
    button.setAttribute('data-op', item.op);
    button.setAttribute('aria-pressed', 'false');
    button.textContent = item.label;
    button.addEventListener('click', function () {
      applyOperation(button, item.op, sets, resultEl, svg, controls);
    });
    controls.appendChild(button);
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'sets-btn sets-btn-reset';
  reset.setAttribute('data-op', 'none');
  reset.setAttribute('aria-pressed', 'false');
  reset.textContent = 'Сброс';
  reset.addEventListener('click', function () {
    applyOperation(reset, 'none', sets, resultEl, svg, controls);
  });
  controls.appendChild(reset);

  return controls;
}

function computeOperation(op, sets) {
  switch (op) {
    case 'union':
      return {
        regions: ['aOnly', 'inter', 'bOnly'],
        text: 'A ∪ B = ' + formatSet(sortNumeric(unique(sets.a.concat(sets.b)))),
      };
    case 'intersection':
      return {
        regions: ['inter'],
        text: 'A ∩ B = ' + formatSet(sortNumeric(sets.inter)),
      };
    case 'a-minus-b':
      return {
        regions: ['aOnly'],
        text: 'A − B = ' + formatSet(sortNumeric(sets.aOnly)),
      };
    case 'b-minus-a':
      return {
        regions: ['bOnly'],
        text: 'B − A = ' + formatSet(sortNumeric(sets.bOnly)),
      };
    case 'symdiff':
      return {
        regions: ['aOnly', 'bOnly'],
        text: 'A ⊕ B = ' + formatSet(sortNumeric(unique(sets.aOnly.concat(sets.bOnly)))),
      };
    default:
      return null;
  }
}

function unique(values) {
  const seen = new Set();
  return values.filter(function (v) {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

function applyOperation(button, op, sets, resultEl, svg, controls) {
  controls.querySelectorAll('.sets-btn').forEach(function (btn) {
    const active = btn === button;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  svg.querySelectorAll('.region').forEach(function (region) {
    region.classList.remove('shaded');
  });

  const operation = computeOperation(op, sets);
  if (!operation) {
    resultEl.textContent = RESULT_DEFAULT;
    svg.querySelectorAll('.num-bubble').forEach(function (bubble) {
      bubble.classList.remove('active');
    });
    return;
  }

  operation.regions.forEach(function (key) {
    svg.querySelector('.' + REGION_CLASS[key]).classList.add('shaded');
  });

  const values = new Set();
  operation.regions.forEach(function (key) {
    const regionValues = sets[key] || [];
    regionValues.forEach(function (v) { values.add(v); });
  });

  svg.querySelectorAll('.num-bubble').forEach(function (bubble) {
    bubble.classList.toggle('active', values.has(bubble.getAttribute('data-num')));
  });

  resultEl.textContent = operation.text;
}