'use strict';

/**
 * Quiz system module
 * Provides interactive quizzes for each lesson with full accessibility
 */

import { saveProgress, checkBadges } from './api-client.js';
import { updateLocalProgress } from './progress.js';

const _QUIZ_ALLOWED_TAGS = /^<(\/)?(code|br|b|i|em|strong)(\s[^>]*)?>$/;

function sanitizeHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, function (tag) {
    return _QUIZ_ALLOWED_TAGS.test(tag) ? tag : '';
  });
}

function lessonNumberFromPage() {
  const attr = document.body.getAttribute('data-lesson');
  if (attr !== null) {
    const num = parseInt(attr, 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

function syncQuizToServer(lessonNumber, score) {
  if (lessonNumber === null) return;
  saveProgress(lessonNumber, true, score).catch(function () {
    // Silent fail
  });
}

export function initQuizSystem() {
  const lessonAttr = document.body.getAttribute('data-lesson');
  const lessonNum = parseInt(lessonAttr, 10);
  if (isNaN(lessonNum) || !lessonNum) return;

  const main = document.querySelector('main, .main-content');
  if (!main) return;

  const quizContainer = document.createElement('section');
  quizContainer.className = 'quiz-container';
  quizContainer.setAttribute('role', 'region');
  quizContainer.setAttribute('aria-label', '\u041f\u0440\u043e\u0432\u0435\u0440\u044c \u0441\u0435\u0431\u044f');

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'quiz-loading';
  loadingDiv.textContent = '\u23f3 \u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0432\u043e\u043f\u0440\u043e\u0441\u043e\u0432...';
  quizContainer.appendChild(loadingDiv);

  const completeToggle = main.querySelector('.lesson-complete-toggle');
  if (completeToggle) {
    main.insertBefore(quizContainer, completeToggle);
  } else {
    main.appendChild(quizContainer);
  }

  fetch('quizzes/' + lessonNum + '.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Quiz not found');
      return response.json();
    })
    .then(function (questions) {
      if (!questions || !questions.length) return;

      let state = {
        idx: 0,
        correct: 0,
        answered: false,
        total: questions.length,
      };

      function renderQuestion() {
        const q = questions[state.idx];

        quizContainer.textContent = '';
        const h3 = document.createElement('h3');
        h3.id = 'quiz-heading';
        h3.textContent = '\ud83e\udde0 \u041f\u0440\u043e\u0432\u0435\u0440\u044c \u0441\u0435\u0431\u044f';
        quizContainer.appendChild(h3);
        quizContainer.setAttribute('aria-labelledby', 'quiz-heading');

        const progressDiv = document.createElement('div');
        progressDiv.className = 'quiz-progress';
        progressDiv.setAttribute('role', 'status');
        progressDiv.setAttribute('aria-live', 'polite');
        progressDiv.textContent = '\u0412\u043e\u043f\u0440\u043e\u0441 ' + (state.idx + 1) + ' \u0438\u0437 ' + state.total;
        quizContainer.appendChild(progressDiv);

        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.innerHTML = sanitizeHtml(q.question);
        quizContainer.appendChild(questionDiv);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'quiz-options';
        optionsDiv.setAttribute('role', 'radiogroup');
        optionsDiv.setAttribute('aria-label', '\u0412\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u043e\u0442\u0432\u0435\u0442\u0430');

        q.options.forEach(function (opt, i) {
          const optEl = document.createElement('button');
          optEl.type = 'button';
          optEl.className = 'quiz-option';
          optEl.setAttribute('role', 'radio');
          optEl.setAttribute('aria-checked', 'false');
          optEl.setAttribute('data-idx', String(i));

          const marker = document.createElement('span');
          marker.className = 'quiz-opt-marker';
          marker.textContent = String.fromCharCode(65 + i) + '.';

          const text = document.createElement('span');
          text.className = 'quiz-opt-text';
          text.textContent = opt;

          optEl.appendChild(marker);
          optEl.appendChild(text);

          optionsDiv.appendChild(optEl);
        });

        quizContainer.appendChild(optionsDiv);

        const feedback = document.createElement('div');
        feedback.className = 'quiz-feedback';
        feedback.setAttribute('role', 'alert');
        feedback.setAttribute('aria-live', 'assertive');
        quizContainer.appendChild(feedback);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'quiz-next-btn';
        nextBtn.textContent = state.idx + 1 < state.total ? '\u0414\u0430\u043b\u0435\u0435 \u2192' : '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442';
        quizContainer.appendChild(nextBtn);

        bindOptionHandlers(q);

        h3.focus();
      }

      function bindOptionHandlers(currentQuestion) {
        const options = quizContainer.querySelectorAll('.quiz-option');
        const feedback = quizContainer.querySelector('.quiz-feedback');
        const nextBtn = quizContainer.querySelector('.quiz-next-btn');

        options.forEach(function (optEl) {
          optEl.addEventListener('click', function () {
            if (state.answered) return;
            state.answered = true;

            const selectedIdx = parseInt(optEl.getAttribute('data-idx'), 10);
            optEl.setAttribute('aria-checked', 'true');

            if (selectedIdx === currentQuestion.correct) {
              state.correct++;
              optEl.classList.add('correct');
              feedback.textContent = '\u2705 \u041f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e! ' + (currentQuestion.explanation || '');
              feedback.className = 'quiz-feedback correct-fb show';
            } else {
              optEl.classList.add('incorrect');
              if (options[currentQuestion.correct]) {
                options[currentQuestion.correct].classList.add('correct');
                options[currentQuestion.correct].setAttribute('aria-checked', 'true');
              }
              feedback.textContent = '\u274c \u041d\u0435\u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e. ' + (currentQuestion.explanation || '');
              feedback.className = 'quiz-feedback incorrect-fb show';
            }

            options.forEach(function (o) {
              o.classList.add('disabled');
              o.setAttribute('aria-disabled', 'true');
              o.setAttribute('tabindex', '-1');
            });
            nextBtn.classList.add('show');
            nextBtn.setAttribute('tabindex', '0');
            nextBtn.focus();
          });

          // Arrow key navigation within options
          optEl.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
              e.preventDefault();
              const next = optEl.nextElementSibling;
              if (next && next.classList.contains('quiz-option') && !next.classList.contains('disabled')) {
                next.focus();
              }
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              e.preventDefault();
              const prev = optEl.previousElementSibling;
              if (prev && prev.classList.contains('quiz-option') && !prev.classList.contains('disabled')) {
                prev.focus();
              }
            }
          });
        });

        nextBtn.addEventListener('click', function () {
          state.idx++;
          state.answered = false;
          if (state.idx >= state.total) {
            showResults();
          } else {
            renderQuestion();
          }
        });
      }

      function showResults() {
        const scorePct = Math.round((state.correct / state.total) * 100);
        const icon = scorePct === 100 ? '\ud83e\udd47' : scorePct >= 50 ? '\ud83d\udc4d' : '\ud83d\udcda';
        const message =
          scorePct === 100
            ? '\u0412\u0435\u043b\u0438\u043a\u043e\u043b\u0435\u043f\u043d\u043e! \u0422\u044b \u043e\u0442\u043b\u0438\u0447\u043d\u043e \u0443\u0441\u0432\u043e\u0438\u043b \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b. \u0423\u0440\u043e\u043a \u043e\u0442\u043c\u0435\u0447\u0435\u043d \u043a\u0430\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043d\u044b\u0439!'
            : scorePct >= 50
              ? '\u0425\u043e\u0440\u043e\u0448\u043e! \u041d\u043e \u0435\u0441\u0442\u044c \u043a\u0443\u0434\u0430 \u0440\u0430\u0441\u0442\u0438 \u2014 \u043f\u043e\u0432\u0442\u043e\u0440\u0438 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b.'
              : '\u0421\u0442\u043e\u0438\u0442 \u043f\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u0442\u044c \u0443\u0440\u043e\u043a \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u043e\u0432\u0430\u0442\u044c \u0441\u043d\u043e\u0432\u0430.';

        quizContainer.textContent = '';
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'quiz-results';
        resultsDiv.setAttribute('role', 'status');
        resultsDiv.setAttribute('aria-live', 'polite');

        const h3 = document.createElement('h3');
        h3.textContent = icon + ' \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442';
        resultsDiv.appendChild(h3);

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'quiz-score';
        scoreDiv.textContent = state.correct + ' / ' + state.total + ' (' + scorePct + '%)';
        resultsDiv.appendChild(scoreDiv);

        const msgP = document.createElement('p');
        msgP.style.marginTop = '8px';
        msgP.style.color = 'var(--text-muted)';
        msgP.textContent = message;
        resultsDiv.appendChild(msgP);

        const retryBtn = document.createElement('button');
        retryBtn.className = 'quiz-retry';
        retryBtn.setAttribute('aria-label', '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u0442\u0435\u0441\u0442');
        retryBtn.textContent = '\ud83d\udd04 \u041f\u043e\u043f\u0440\u043e\u0431\u043e\u0432\u0430\u0442\u044c \u0435\u0449\u0451 \u0440\u0430\u0437';
        resultsDiv.appendChild(retryBtn);

        quizContainer.appendChild(resultsDiv);

          const lessonNumber = lessonNumberFromPage();

          // Update server and in-memory state
          syncQuizToServer(lessonNumber, scorePct);
          updateLocalProgress(lessonNumber, scorePct === 100, scorePct);

          if (scorePct === 100) {
            const completeEl = document.querySelector('.lesson-complete-toggle');
            if (completeEl) {
              completeEl.textContent = '';
              const label = document.createElement('label');
              label.className = 'complete-label';

              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.className = 'complete-checkbox';
              checkbox.checked = true;
              label.appendChild(checkbox);
              label.appendChild(document.createTextNode(' '));

              const span = document.createElement('span');
              span.className = 'complete-text';
              span.textContent = '\u2713 \u0423\u0440\u043e\u043a \u043f\u0440\u043e\u0439\u0434\u0435\u043d';
              label.appendChild(span);

              completeEl.appendChild(label);
            }
          }

          // Check badges after quiz
          checkBadges();

          h3.focus();

        quizContainer.querySelector('.quiz-retry').addEventListener('click', function () {
          state = { idx: 0, correct: 0, answered: false, total: questions.length };
          renderQuestion();
        });
      }

      renderQuestion();
    })
    .catch(function () {
      quizContainer.style.display = 'none';
    });
}
