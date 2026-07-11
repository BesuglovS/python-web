'use strict';

/**
 * Quiz system module
 */

export function initQuizSystem() {
  const lessonAttr = document.body.getAttribute('data-lesson');
  const lessonNum = parseInt(lessonAttr, 10);
  if (isNaN(lessonNum) || !lessonNum) return;

  const main = document.querySelector('main, .main-content');
  if (!main) return;

  const quizContainer = document.createElement('div');
  quizContainer.className = 'quiz-container';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'quiz-loading';
  loadingDiv.textContent = '⏳ Загрузка вопросов...';
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

      if (window.LESSON_QUIZZES === undefined) {
        window.LESSON_QUIZZES = {};
      }
      window.LESSON_QUIZZES[lessonNum] = questions;

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
        h3.textContent = '🧠 Проверь себя';
        quizContainer.appendChild(h3);

        const progressDiv = document.createElement('div');
        progressDiv.className = 'quiz-progress';
        progressDiv.textContent = 'Вопрос ' + (state.idx + 1) + ' из ' + state.total;
        quizContainer.appendChild(progressDiv);

        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.textContent = q.question;
        quizContainer.appendChild(questionDiv);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'quiz-options';

        q.options.forEach(function (opt, i) {
          const optEl = document.createElement('button');
          optEl.type = 'button';
          optEl.className = 'quiz-option';
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
        feedback.setAttribute('aria-live', 'polite');
        quizContainer.appendChild(feedback);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'quiz-next-btn';
        nextBtn.textContent = 'Далее →';
        quizContainer.appendChild(nextBtn);

        bindOptionHandlers(q);
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
            if (selectedIdx === currentQuestion.correct) {
              state.correct++;
              optEl.classList.add('correct');
              feedback.textContent = '✅ Правильно! ' + (currentQuestion.explanation || '');
              feedback.className = 'quiz-feedback correct-fb show';
            } else {
              optEl.classList.add('incorrect');
              if (options[currentQuestion.correct]) {
                options[currentQuestion.correct].classList.add('correct');
              }
              feedback.textContent = '❌ Неправильно. ' + (currentQuestion.explanation || '');
              feedback.className = 'quiz-feedback incorrect-fb show';
            }

            options.forEach(function (o) {
              o.classList.add('disabled');
            });
            nextBtn.classList.add('show');
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
        const icon = scorePct === 100 ? '🥇' : scorePct >= 50 ? '👍' : '📚';
        const message =
          scorePct === 100
            ? 'Великолепно! Ты отлично усвоил материал. Урок отмечен как пройденный!'
            : scorePct >= 50
              ? 'Хорошо! Но есть куда расти — повтори материал.'
              : 'Стоит перечитать урок и попробовать снова.';

        quizContainer.textContent = '';
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'quiz-results';

        const h3 = document.createElement('h3');
        h3.textContent = icon + ' Результат';
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
        retryBtn.textContent = '🔄 Попробовать ещё раз';
        resultsDiv.appendChild(retryBtn);

        quizContainer.appendChild(resultsDiv);

        if (scorePct === 100) {
          // Save quiz score
          let quizScores;
          try {
            quizScores = JSON.parse(safeGetItem('python-web-quiz-scores') || '{}');
          } catch (_e) {
            quizScores = {};
          }
          const pageName = window.location.pathname.split('/').pop() || '';
          quizScores[pageName] = 100;
          safeSetItem('python-web-quiz-scores', JSON.stringify(quizScores));

          // Mark lesson as completed
          let completedLessons;
          try {
            completedLessons = JSON.parse(safeGetItem('python-web-progress') || '[]');
          } catch (_e) {
            completedLessons = [];
          }
          if (!completedLessons.includes(pageName)) {
            completedLessons.push(pageName);
          }
          safeSetItem('python-web-progress', JSON.stringify(completedLessons));

          // Update UI
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
            span.textContent = '✓ Урок пройден';
            label.appendChild(span);

            completeEl.appendChild(label);
          }
        }

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
