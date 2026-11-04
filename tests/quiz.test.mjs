// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  sanitizeHtml,
  shuffleCopy,
  buildQuizPresentation,
  initQuizSystem,
} from '../src/js/modules/quiz.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.body.removeAttribute('data-lesson');
});

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('preserves allowed tags and entities', () => {
    expect(sanitizeHtml('<code>print(1)</code>')).toBe('<code>print(1)</code>');
    expect(sanitizeHtml('text<br><b>bold</b>')).toBe('text<br><b>bold</b>');
    expect(sanitizeHtml('a &lt; b &nbsp; c')).toBe('a &lt; b &nbsp; c');
  });

  it('escapes literal < and > in text', () => {
    expect(sanitizeHtml('while i < 3:')).toBe('while i &lt; 3:');
    expect(sanitizeHtml('/user/<id>')).toBe('/user/&lt;id&gt;');
  });

  it('keeps a <br> that follows a comparison sign', () => {
    expect(sanitizeHtml('while i < 3:<br>print(i)')).toBe('while i &lt; 3:<br>print(i)');
  });

  it('escapes comparisons inside code blocks without breaking line breaks', () => {
    const input = '<code>i = 0<br>while i < 3:<br>&nbsp;&nbsp;&nbsp;&nbsp;print(i)</code>';
    expect(sanitizeHtml(input)).toBe(
      '<code>i = 0<br>while i &lt; 3:<br>&nbsp;&nbsp;&nbsp;&nbsp;print(i)</code>',
    );
  });

  it('renders unknown tags as escaped text (no HTML injection)', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(sanitizeHtml('<div><b>bold</b></div>')).toBe('&lt;div&gt;<b>bold</b>&lt;/div&gt;');
  });
});

describe('shuffleCopy', () => {
  it('returns a new array with the same elements', () => {
    const source = [1, 2, 3, 4, 5];
    const snapshot = source.slice();
    const result = shuffleCopy(source);

    expect(result).not.toBe(source);
    expect(source).toEqual(snapshot);
    expect(result.slice().sort()).toEqual(snapshot.slice().sort());
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffleCopy([])).toEqual([]);
    expect(shuffleCopy([7])).toEqual([7]);
  });
});

describe('buildQuizPresentation', () => {
  const questions = [
    { options: ['a', 'b', 'c'] },
    { options: ['a', 'b'] },
    { options: ['a', 'b', 'c', 'd'] },
  ];

  function identity(n) {
    return Array.from({ length: n }, function (_item, i) {
      return i;
    });
  }

  it('covers every question exactly once', () => {
    const presentation = buildQuizPresentation(questions);
    expect(presentation.length).toBe(questions.length);
    expect(
      presentation
        .map(function (slot) {
          return slot.q;
        })
        .sort(function (a, b) {
          return a - b;
        }),
    ).toEqual(identity(questions.length));
  });

  it('keeps a valid option permutation for each question', () => {
    const presentation = buildQuizPresentation(questions);
    presentation.forEach(function (slot) {
      expect(
        slot.opts.slice().sort(function (a, b) {
          return a - b;
        }),
      ).toEqual(identity(questions[slot.q].options.length));
    });
  });

  it('reorders questions and options over repeated attempts', () => {
    let questionsReordered = false;
    let optionsReordered = false;

    for (let attempt = 0; attempt < 200; attempt++) {
      const presentation = buildQuizPresentation(questions);
      if (
        presentation
          .map(function (slot) {
            return slot.q;
          })
          .join('') !== '012'
      ) {
        questionsReordered = true;
      }
      presentation.forEach(function (slot) {
        if (slot.opts.join('') !== identity(slot.opts.length).join('')) {
          optionsReordered = true;
        }
      });
      if (questionsReordered && optionsReordered) break;
    }

    expect(questionsReordered).toBe(true);
    expect(optionsReordered).toBe(true);
  });

  it('handles missing or empty input', () => {
    expect(buildQuizPresentation([])).toEqual([]);
    expect(buildQuizPresentation(null)).toEqual([]);
    expect(buildQuizPresentation(undefined)).toEqual([]);
  });

  it('handles a question without options', () => {
    const presentation = buildQuizPresentation([{}]);
    expect(presentation).toEqual([{ q: 0, opts: [] }]);
  });
});

describe('initQuizSystem: ответы при перемешанном порядке', () => {
  const CANON = [
    { question: 'Q0', options: ['A0', 'B0', 'C0'], correct: 2 },
    { question: 'Q1', options: ['A1', 'B1'], correct: 1 },
  ];

  function stubQuizApi() {
    const answerCalls = [];
    const fetchMock = vi.fn(function (url, options) {
      if (String(url).indexOf('sandbox/quiz.php') === -1) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
      }
      if (!options || options.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lesson_number: 3,
              questions: CANON.map(function (q) {
                return { question: q.question, options: q.options };
              }),
            }),
        });
      }
      const body = JSON.parse(options.body);
      if (body.action === 'grade') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lesson_number: 3,
              score: 100,
              total: CANON.length,
              correct_count: CANON.length,
            }),
        });
      }
      answerCalls.push(body);
      const question = CANON[body.question_idx];
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            question_idx: body.question_idx,
            is_correct: body.selected === question.correct,
            correct: question.correct,
            explanation: 'так надо',
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    return answerCalls;
  }

  async function waitFor(getValue, label) {
    for (let i = 0; i < 100; i++) {
      const value = getValue();
      if (value) return value;
      await new Promise(function (resolve) {
        setTimeout(resolve, 0);
      });
    }
    throw new Error('Не дождались: ' + label);
  }

  it('шлёт на сервер канонические индексы и подсвечивает верный вариант', async () => {
    document.body.setAttribute('data-lesson', '3');
    document.body.innerHTML = '<main><div class="lesson-complete-toggle"></div></main>';
    const answerCalls = stubQuizApi();

    initQuizSystem();

    function options() {
      return Array.from(document.querySelectorAll('.quiz-option'));
    }

    for (let step = 0; step < CANON.length; step++) {
      const questionText = await waitFor(function () {
        const el = document.querySelector('.quiz-question');
        return el ? el.textContent : null;
      }, 'текст вопроса');
      const canonical = CANON.filter(function (q) {
        return q.question === questionText;
      })[0];
      expect(canonical, 'вопрос должен быть из quizzes/N.json').toBeTruthy();

      await waitFor(function () {
        return options().length === canonical.options.length ? true : null;
      }, 'варианты ответа');

      const correctText = canonical.options[canonical.correct];
      const target = options().filter(function (btn) {
        return btn.querySelector('.quiz-opt-text').textContent === correctText;
      })[0];
      expect(target, 'на экране есть верный вариант').toBeTruthy();

      target.click();

      const highlighted = await waitFor(function () {
        return document.querySelector('.quiz-option.correct');
      }, 'подсветка верного варианта');
      expect(highlighted.querySelector('.quiz-opt-text').textContent).toBe(correctText);

      const call = answerCalls[answerCalls.length - 1];
      expect(CANON[call.question_idx]).toBe(canonical);
      expect(canonical.options[call.selected]).toBe(correctText);

      document.querySelector('.quiz-next-btn').click();
    }

    const score = await waitFor(function () {
      return document.querySelector('.quiz-score');
    }, 'итоговый балл');
    expect(score.textContent).toBe('2 / 2 (100%)');
  });
});
