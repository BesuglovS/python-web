/**
 * Python Web — Интерактивные улучшения
 * Подсветка синтаксиса, темы, копирование кода, поиск, прогресс, оглавление
 */


// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

/**
 * Экранирует HTML-спецсимволы для безопасного вставления текста.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Отображает результат выполнения Python-кода из песочницы.
 * @param {HTMLElement} outputEl — элемент, куда выводить результат
 * @param {object} result — объект с полями { ok, stdout, stderr, exit_code }
 */
function renderSandboxResult(outputEl, result) {
  var html = '';

  if (result.stdout) {
    html += '<div class="sb-stdout">' + escapeHtml(result.stdout) + '</div>';
  }

  if (result.stderr) {
    html += '<div class="sb-stderr">⚠️ ' + escapeHtml(result.stderr) + '</div>';
  }

  if (!result.stdout && !result.stderr) {
    if (result.ok) {
      html = '<div class="sb-stdout">✅ Код выполнен без вывода</div>';
    } else {
      html = '<div class="sb-stderr">⚠️ Ошибка выполнения (код ' + result.exit_code + ')</div>';
    }
  }

  outputEl.innerHTML = html;
  outputEl.className = outputEl.className.replace(/\brunning\b/, '') + ' show';
  if (!result.ok) {
    outputEl.classList.add('error');
  }
}

/**
 * Выполняет Python-код через песочницу (sandbox/run.php) и отображает результат.
 * @param {HTMLElement} outputEl — элемент для вывода
 * @param {string} code — код на Python
 * @param {string} userInput — ввод для input()
 */
async function executeCode(outputEl, code, userInput) {
  outputEl.className = 'sandbox-output running';
  outputEl.innerHTML = '⏳ Выполнение...';
  try {
    const response = await fetch('sandbox/run.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, input: userInput, timeout: 5 })
    });

    if (!response.ok) {
      // Попробуем извлечь сообщение об ошибке из тела ответа
      let errorMsg = 'HTTP ' + response.status + ': ' + response.statusText;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.error) {
          errorMsg = errorBody.error;
        }
      } catch (_) { /* тело ответа не JSON — используем статус */ }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    renderSandboxResult(outputEl, result);
  } catch (err) {
    outputEl.className = 'sandbox-output error';
    outputEl.innerHTML = '⚠️ Ошибка: ' + escapeHtml(err.message);
  }
}

// === ПОДСВЕТКА СИНТАКСИСА (Highlight.js) ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('pre.code-block').forEach(block => {
        // Добавляем класс python для подсветки
        block.classList.add('language-python');
        hljs.highlightElement(block);
      });
    }
  });
  // --- Клавиатурная навигация: стрелки ← → ---
  document.addEventListener('keydown', function(e) {
    // Не перехватываем, если фокус в поле ввода
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    
    if (e.key === 'ArrowLeft') {
      var prev = document.querySelector('.prev-link');
      if (prev) window.location.href = prev.getAttribute('href');
    } else if (e.key === 'ArrowRight') {
      var next = document.querySelector('.next-link');
      if (next) window.location.href = next.getAttribute('href');
    }
  });

})();

// === ТЁМНАЯ / СВЕТЛАЯ ТЕМА ===
(function () {
  const THEME_KEY = 'python-web-theme';

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  }

  function createThemeToggle() {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Переключить тему');
    const theme = getSavedTheme();
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });

    const header = document.querySelector('.topic-header') || document.querySelector('header');
    if (header) {
      header.insertBefore(btn, header.firstChild);
    } else {
      document.body.prepend(btn);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());
    createThemeToggle();
  });
})();

// === ХЛЕБНЫЕ КРОШКИ ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    const h1 = document.querySelector('.topic-header h1');
    const title = h1 ? h1.textContent.trim() : (document.title.split(' — ')[0] || document.title);

    container.innerHTML = '<a href="index.html">🏠 Главная</a> <span class="bc-sep">/</span> <span class="bc-current">' + title + '</span>';
  });
})();

// === ОГЛАВЛЕНИЕ УРОКА ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const toc = document.getElementById('toc');
    if (!toc) return;

    const headings = document.querySelectorAll('section h2, section h3');
    if (headings.length < 2) {
      toc.style.display = 'none';
      return;
    }

    const header = document.createElement('div');
    header.className = 'toc-title';
    header.textContent = '📑 Содержание урока';
    toc.appendChild(header);

    const ul = document.createElement('ul');
    headings.forEach((h, i) => {
      if (!h.id) {
        h.id = 'section-' + i;
      }
      const li = document.createElement('li');
      li.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';

      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(h.id).scrollIntoView({ behavior: 'smooth' });
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    toc.appendChild(ul);

    // Active section tracking on scroll
    const tocLinks = ul.querySelectorAll('a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = ul.querySelector('a[href="#' + id + '"]');
        if (link) {
          link.classList.toggle('toc-active', entry.isIntersecting);
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    headings.forEach(h => observer.observe(h));
  });
})();

// === КНОПКИ КОПИРОВАНИЯ И ЗАПУСКА КОДА ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre.code-block').forEach(pre => {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Кнопка копирования
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋';
      copyBtn.title = 'Копировать код';
      copyBtn.setAttribute('aria-label', 'Копировать код');

      copyBtn.addEventListener('click', async () => {
        const code = pre.textContent || pre.innerText;
        try {
          await navigator.clipboard.writeText(code);
          copyBtn.textContent = '✓ Скопировано';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '📋';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch {
          const textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copyBtn.textContent = '✓ Скопировано';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '📋';
            copyBtn.classList.remove('copied');
          }, 2000);
        }
      });

      wrapper.appendChild(copyBtn);

      // Делаем блок кода редактируемым
      pre.contentEditable = true;
      pre.spellcheck = false;
      pre.title = 'Кликните, чтобы отредактировать код';

      // Кнопка «Запустить в песочнице»
      const runBtn = document.createElement('button');
      runBtn.className = 'run-btn';
      runBtn.textContent = '▶';
      runBtn.title = 'Запустить код в локальной песочнице';
      runBtn.setAttribute('aria-label', 'Запустить код в песочнице');

      // Поле ввода для input() — скрыто по умолчанию
      const inputField = document.createElement('textarea');
      inputField.className = 'sandbox-input';
      inputField.placeholder = 'Введите данные для input() — каждое значение на новой строке…';
      inputField.style.display = 'none';
      wrapper.appendChild(inputField);

      // Контейнер кнопок (Выполнить + Сброс)
      const btnGroup = document.createElement('div');
      btnGroup.className = 'exercise-buttons';
      btnGroup.style.display = 'none';
      wrapper.appendChild(btnGroup);

      const executeBtn = document.createElement('button');
      executeBtn.className = 'exercise-run-btn';
      executeBtn.textContent = '▶ Выполнить';
      btnGroup.appendChild(executeBtn);

      const resetBtn = document.createElement('button');
      resetBtn.className = 'exercise-reset-btn';
      resetBtn.textContent = '✕ Сброс';
      btnGroup.appendChild(resetBtn);

      // Создаём блок вывода рядом с кодом
      const outputDiv = document.createElement('div');
      outputDiv.className = 'sandbox-output';
      outputDiv.style.display = 'none';
      wrapper.appendChild(outputDiv);

      // Клик по ▶ — если есть input(), показываем поле ввода и кнопки.
      // Если input() нет — запускаем код сразу.
      runBtn.addEventListener('click', () => {
        const code = (pre.textContent || pre.innerText).trim();
        const hasInput = /input\s*\(/.test(code);

        if (hasInput) {
          // Показываем группу кнопок и поле ввода
          btnGroup.style.display = 'flex';
          outputDiv.style.display = 'none';
          inputField.style.display = 'block';
          inputField.focus();
        } else {
          // Запускаем сразу
          btnGroup.style.display = 'none';
          inputField.style.display = 'none';
          inputField.value = '';
          outputDiv.style.display = 'block';
          executeCode(outputDiv, code, '');
        }
      });

      // Выполнить код с данными из поля ввода
      executeBtn.addEventListener('click', async () => {
        const code = (pre.textContent || pre.innerText).trim();
        const userInput = inputField.value;
        executeCode(outputDiv, code, userInput);
      });

      // Сброс — скрываем поле и результат
      resetBtn.addEventListener('click', () => {
        inputField.style.display = 'none';
        btnGroup.style.display = 'none';
        outputDiv.style.display = 'none';
        inputField.value = '';
        outputDiv.innerHTML = '';
      });

      wrapper.appendChild(runBtn);
    });
  });
})();

// === ИНДИКАТОР ПРОГРЕССА СКРОЛЛА ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      bar.style.width = pct + '%';
    });
  });
})();

// === КНОПКА «НАВЕРХ» ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '⬆';
    btn.title = 'Наверх страницы';
    btn.setAttribute('aria-label', 'Прокрутить наверх');
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);

    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        btn.classList.toggle('visible', window.scrollY > 400);
      }, 50);
    });
  });
})();

// === ОТСЛЕЖИВАНИЕ ПРОГРЕССА ===
(function () {
  const PROGRESS_KEY = 'python-web-progress';

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveProgress(arr) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(arr));
  }

  // На странице урока — добавляем переключатель «отметить как пройденный»
  document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();
    if (!page || page === 'index.html' || page === '') return;

    const footer = document.querySelector('.topic-footer');
    if (!footer) return;

    const progress = getProgress();
    const isCompleted = progress.includes(page);

    // Создаём контейнер для переключателя
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'lesson-complete-toggle';

    const label = document.createElement('label');
    label.className = 'complete-label';
    label.innerHTML = '<input type="checkbox" class="complete-checkbox"' + (isCompleted ? ' checked' : '') + '> <span class="complete-text">' + (isCompleted ? '✓ Урок пройден' : 'Отметить как пройденный') + '</span>';

    label.querySelector('input').addEventListener('change', (e) => {
      let progress = getProgress();
      if (e.target.checked) {
        if (!progress.includes(page)) {
          progress.push(page);
          label.querySelector('.complete-text').textContent = '✓ Урок пройден';
        }
      } else {
        progress = progress.filter(p => p !== page);
        label.querySelector('.complete-text').textContent = 'Отметить как пройденный';
      }
      saveProgress(progress);
    });

    toggleContainer.appendChild(label);
    // Вставляем переключатель внутрь footer'а, между prev/next ссылками
    const nextLink = footer.querySelector('.next-link');
    if (nextLink) {
      footer.insertBefore(toggleContainer, nextLink);
    } else {
      footer.appendChild(toggleContainer);
    }
  });

  // На главной — показываем прогресс
  document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();
    if (page && page !== 'index.html' && page !== '') return; // только на главной

    const progress = getProgress();
    const totalLessons = 29;

    // Создаём индикатор прогресса, если его ещё нет
    const headerEl = document.querySelector('header');
    if (!headerEl) return;

    // Обновляем заголовок с прогрессом
    const existingP = headerEl.querySelector('p');
    if (existingP) {
      const done = progress.length;
      const pct = Math.round((done / totalLessons) * 100);
      const barHtml = '<span class="progress-info">Пройдено: <strong>' + done + '</strong> из <strong>' + totalLessons + '</strong> уроков (' + pct + '%)</span>';
      if (!existingP.querySelector('.progress-info')) {
        existingP.insertAdjacentHTML('afterend', '<div class="progress-bar-container"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' + barHtml);
      } else {
        existingP.nextElementSibling && existingP.nextElementSibling.classList.contains('progress-bar-container') &&
          (existingP.nextElementSibling.querySelector('.progress-bar-fill').style.width = pct + '%');
        const info = existingP.parentElement.querySelector('.progress-info');
        if (info) {
          info.innerHTML = 'Пройдено: <strong>' + done + '</strong> из <strong>' + totalLessons + '</strong> уроков (' + pct + '%)';
        }
      }
    }

    // Отмечаем пройденные уроки галочками
    const cards = document.querySelectorAll('.topic-card');
    cards.forEach(card => {
      const href = card.getAttribute('href');
      if (href && progress.includes(href)) {
        card.classList.add('completed');
        const numDiv = card.querySelector('.topic-num');
        if (numDiv && !numDiv.classList.contains('completed-num')) {
          numDiv.classList.add('completed-num');
        }
      }

      // Определяем номер урока
      var lessonNum = parseInt(card.getAttribute('data-lesson'));

      // Добавляем метаданные (время чтения + сложность)
      if (typeof LESSON_META !== 'undefined') {
        var meta = LESSON_META[lessonNum];
        if (meta) {
          var infoDiv = card.querySelector('.topic-info');
          if (infoDiv && !infoDiv.querySelector('.topic-meta')) {
            var metaSpan = document.createElement('div');
            metaSpan.className = 'topic-meta';
            var complexityLabel = (typeof COMPLEXITY_LABELS !== 'undefined' && COMPLEXITY_LABELS[meta.complexity])
              ? COMPLEXITY_LABELS[meta.complexity]
              : meta.complexity;
            metaSpan.innerHTML = '<span class="meta-duration">⏱ ' + meta.duration + ' мин</span> · <span class="meta-complexity" data-level="' + meta.complexity + '">' + complexityLabel + '</span>';
            infoDiv.appendChild(metaSpan);
          }
        }
      }

      // Добавляем значок контеста
      if (lessonNum && THEORY_CONTESTS[lessonNum]) {
        var contestId = THEORY_CONTESTS[lessonNum];
        var contestUrl = CONTEST_BASE_URL + contestId;
        var badge = document.createElement('a');
        badge.className = 'contest-badge';
        badge.href = contestUrl;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.title = 'Задачи к этой теме';
        badge.innerHTML = '📝';
        badge.setAttribute('aria-label', 'Открыть задачи контеста');
        card.appendChild(badge);
      }
    });
  });
})();

// === ПОИСК ПО УРОКАМ (главная страница) ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();
    if (page && page !== 'index.html' && page !== '') return;

    const nav = document.querySelector('nav');
    if (!nav || !nav.querySelector('.topic-card')) return;

    // Создаём строку поиска
    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-container';
    searchDiv.innerHTML = '<input type="text" id="lesson-search" class="search-input" placeholder="🔍 Поиск по темам... (например: цикл, список, функция)" autocomplete="off">';
    nav.parentNode.insertBefore(searchDiv, nav);

    const searchInput = document.getElementById('lesson-search');
    const cards = nav.querySelectorAll('.topic-card');

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();

      let visibleCount = 0;
      cards.forEach(card => {
        const title = (card.querySelector('h2')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
        const num = (card.querySelector('.topic-num')?.textContent || '').toLowerCase();

        const matches = !query || title.includes(query) || desc.includes(query) || num.includes(query);

        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
      });

      // Показываем сообщение, если ничего не найдено
      let noResults = nav.querySelector('.no-results');
      if (visibleCount === 0 && query) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.textContent = '😕 Ничего не найдено. Попробуйте изменить запрос.';
          nav.appendChild(noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
    });
  });
})();

// === ПЛАВНЫЙ СКРОЛЛ ДЛЯ ЯКОРНЫХ ССЫЛОК ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

// === ДИНАМИЧЕСКАЯ ВСТАВКА ССЫЛКИ НА КОНТЕСТ ===
(function () {
  if (typeof THEORY_CONTESTS === 'undefined' || typeof CONTEST_BASE_URL === 'undefined') return;

  document.addEventListener('DOMContentLoaded', () => {
    var placeholder = document.getElementById('contest-link-placeholder');
    if (!placeholder) return;

    // Определяем номер урока из имени файла (например, 06-number-ops.html → 6)
    var pageName = window.location.pathname.split('/').pop();
    var match = pageName.match(/^(\d+)/);
    if (!match) return;
    var lessonNum = parseInt(match[1], 10);

    var contestId = THEORY_CONTESTS[lessonNum];
    if (!contestId) return;

    var contestUrl = CONTEST_BASE_URL + contestId;

    var div = document.createElement('div');
    div.className = 'contest-link';
    div.innerHTML =
      '<p style="text-align: center; margin-top: 2rem; padding: 1rem; background: #1e3a5f; border-radius: 8px; color: #e0e0e0;">' +
      '🏆 Решай задачи по пройденным темам на сайте ' +
      '<a href="' + contestUrl + '" target="_blank" rel="noopener noreferrer" style="color: #7ec8ff; font-weight: 600; text-decoration: underline;">contest.nayanovaacademy.ru</a>' +
      '</p>';

    placeholder.parentNode.replaceChild(div, placeholder);
  });
})();

// === РЕГИСТРАЦИЯ SERVICE WORKER ===
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './' })
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration skipped'));
    });
  }
})();

// === МОБИЛЬНОЕ ГАМБУРГЕР-МЕНЮ (список всех уроков) ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Список всех уроков (для всех страниц)
    var lessons = [
      { num: 1, title: 'История, обзор и области применения', href: '01-history.html' },
      { num: 2, title: 'Настройка IDE', href: '02-ide-setup.html' },
      { num: 3, title: 'Переменные', href: '03-variables.html' },
      { num: 4, title: 'Типы данных', href: '04-data-types.html' },
      { num: 5, title: 'Ввод и вывод', href: '05-io.html' },
      { num: 6, title: 'Операции над числами', href: '06-number-ops.html' },
      { num: 7, title: 'Условный оператор + Отступы', href: '07-conditional.html' },
      { num: 8, title: 'Булевы переменные', href: '08-booleans.html' },
      { num: 9, title: 'Строки: индексация и срезы', href: '09-strings-index-slice.html' },
      { num: 10, title: 'Операции над строками', href: '10-string-ops.html' },
      { num: 11, title: 'Сложные условия', href: '11-complex-conditions.html' },
      { num: 12, title: 'Вложенные структуры', href: '12-nested-structures.html' },
      { num: 13, title: 'Приоритет операций', href: '13-priority.html' },
      { num: 14, title: 'Создание простейших функций', href: '14-functions.html' },
      { num: 15, title: 'Функции: продвинутые темы', href: '15-functions-advanced.html' },
      { num: 16, title: 'Цикл while', href: '16-while.html' },
      { num: 17, title: 'Цикл for', href: '17-for.html' },
      { num: 18, title: 'range()', href: '18-range.html' },
      { num: 19, title: 'break и continue', href: '19-break-continue.html' },
      { num: 20, title: 'Вложенные циклы', href: '20-nested-loops.html' },
      { num: 21, title: 'Множества', href: '21-sets.html' },
      { num: 22, title: 'Списки', href: '22-lists.html' },
      { num: 23, title: 'Кортежи', href: '23-tuples.html' },
      { num: 24, title: 'Словари', href: '24-dicts.html' },
      { num: 25, title: 'split + join', href: '25-split-join.html' },
      { num: 26, title: 'Списочные выражения', href: '26-list-comprehensions.html' },
      { num: 27, title: 'Финальный проект', href: '27-final-project.html' },
      { num: 28, title: 'Обработка ошибок', href: '28-try-except.html' },
      { num: 29, title: 'Файлы: чтение и запись', href: '29-files.html' },
      { num: '🏆', title: 'Итоговый тест', href: 'final-test.html' }
    ];

    // Текущая страница
    var currentPage = window.location.pathname.split('/').pop();

    // Кнопка-гамбургер
    var hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.innerHTML = '☰';
    hamburger.setAttribute('aria-label', 'Меню уроков');
    hamburger.title = 'Список уроков';
    document.body.appendChild(hamburger);

    // Панель меню
    var overlay = document.createElement('div');
    overlay.className = 'hamburger-overlay';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.className = 'hamburger-panel';
    panel.innerHTML = '<div class="hamburger-header">🐍 Уроки Python <span class="hamburger-close">✕</span></div><ul class="hamburger-list"></ul>';
    document.body.appendChild(panel);

    var list = panel.querySelector('.hamburger-list');
    lessons.forEach(function (lesson) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = lesson.href;
      a.className = 'hamburger-link';
      a.innerHTML = '<span class="hamburger-num">' + lesson.num + '</span> ' + lesson.title;
      if (currentPage === lesson.href) {
        a.classList.add('hamburger-active');
      }
      li.appendChild(a);
      list.appendChild(li);
    });

    // Открыть/закрыть меню
    hamburger.addEventListener('click', () => {
      panel.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      panel.classList.remove('open');
      overlay.classList.remove('open');
    });
    panel.querySelector('.hamburger-close').addEventListener('click', () => {
      panel.classList.remove('open');
      overlay.classList.remove('open');
    });
  });

  // =========================
  //  QUIZ — САМОПРОВЕРКА
  // =========================
  (function initQuiz() {
    // Номер урока: либо из data-lesson атрибута на body, либо из URL
    // Поддержка числовых и строковых ключей (например, "final-test")
    var lessonKey = document.body.getAttribute('data-lesson');
    var lessonNum = parseInt(lessonKey, 10);
    if (!isNaN(lessonNum)) {
      lessonKey = lessonNum;
    }
    if (!lessonKey || !LESSON_QUIZZES || !LESSON_QUIZZES[lessonKey]) return;

    var quiz = LESSON_QUIZZES[lessonKey];
    if (!quiz || !quiz.length) return;

    var state = { idx: 0, correct: 0, answered: false, total: quiz.length };

    // Ищем место вставки: перед lesson-complete-toggle или в конце main-content
    var main = document.querySelector('.main-content');
    if (!main) return;

    var container = document.createElement('div');
    container.className = 'quiz-container';

    function renderQuestion() {
      var q = quiz[state.idx];
      var optionsHtml = q.options.map(function (opt, oi) {
        return '<div class="quiz-option" data-idx="' + oi + '">' +
          '  <span class="quiz-opt-marker">' + String.fromCharCode(65 + oi) + '.</span>' +
          '  <span class="quiz-opt-text">' + opt + '</span>' +
          '</div>';
      }).join('');

      container.innerHTML =
        '<h3>🧠 Проверь себя</h3>' +
        '<div class="quiz-progress">Вопрос <strong>' + (state.idx + 1) + '</strong> из ' + state.total + '</div>' +
        '<div class="quiz-question">' + q.question + '</div>' +
        '<div class="quiz-options">' + optionsHtml + '</div>' +
        '<div class="quiz-feedback"></div>' +
        '<button class="quiz-next-btn">Далее →</button>';

      bindQuizEvents();
    }

    function bindQuizEvents() {
      var options = container.querySelectorAll('.quiz-option');
      var feedback = container.querySelector('.quiz-feedback');
      var nextBtn = container.querySelector('.quiz-next-btn');
      var q = quiz[state.idx];

      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (state.answered) return;
          state.answered = true;

          var chosen = parseInt(opt.getAttribute('data-idx'), 10);
          var isCorrect = chosen === q.correct;

          if (isCorrect) {
            state.correct++;
            opt.classList.add('correct');
            feedback.textContent = '✅ Правильно! ' + (q.explanation || '');
            feedback.className = 'quiz-feedback correct-fb show';
          } else {
            opt.classList.add('incorrect');
            // Подсветить правильный ответ
            options[q.correct].classList.add('correct');
            feedback.textContent = '❌ Неправильно. ' + (q.explanation || '');
            feedback.className = 'quiz-feedback incorrect-fb show';
          }

          // Заблокировать все опции
          options.forEach(function (o) { o.classList.add('disabled'); });

          // Показать кнопку «Далее»
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
      var pct = Math.round((state.correct / state.total) * 100);
      var emoji = pct === 100 ? '🥇' : pct >= 50 ? '👍' : '📚';
      container.innerHTML =
        '<div class="quiz-results">' +
        '  <h3>' + emoji + ' Результат</h3>' +
        '  <div class="quiz-score">' + state.correct + ' / ' + state.total + ' (' + pct + '%)</div>' +
        '  <p style="margin-top:8px;color:var(--text-muted);">' +
        (pct === 100 ? 'Великолепно! Ты отлично усвоил материал.' :
         pct >= 50 ? 'Хорошо! Но есть куда расти — повтори материал.' :
         'Стоит перечитать урок и попробовать снова.') +
        '  </p>' +
        '  <button class="quiz-retry">🔄 Попробовать ещё раз</button>' +
        '</div>';

      container.querySelector('.quiz-retry').addEventListener('click', function () {
        state = { idx: 0, correct: 0, answered: false, total: quiz.length };
        renderQuestion();
      });
    }

    // Вставляем перед toggle-блоком, если он есть
    var toggle = main.querySelector('.lesson-complete-toggle');
    if (toggle) {
      main.insertBefore(container, toggle);
    } else {
      main.appendChild(container);
    }
    renderQuestion();
  })();

  // =========================
  //  INLINE EXERCISES
  // =========================
  (function initExercises() {
    // Находим все .exercise-block на странице
    var blocks = document.querySelectorAll('.exercise-block');
    blocks.forEach(function (block) {
      var textarea = block.querySelector('textarea');
      var output = block.querySelector('.exercise-output');
      var runBtn = block.querySelector('.exercise-run-btn');
      var resetBtn = block.querySelector('.exercise-reset-btn');

      if (!textarea || !runBtn) return;

      // Сохраняем исходный код
      var originalCode = textarea.value;

      // Поле ввода для input() — скрыто по умолчанию
      var inputField = document.createElement('textarea');
      inputField.className = 'exercise-input';
      inputField.placeholder = 'Ввод данных для input() — каждое значение на новой строке…';
      inputField.style.display = 'none';
      inputField.style.marginTop = '8px';
      inputField.style.width = '100%';
      inputField.style.boxSizing = 'border-box';
      block.insertBefore(inputField, output);

      // Первый клик — если есть input(), показываем поле ввода.
      // Если input() нет — запускаем код сразу.
      // Первый клик: если нет input() — запускаем сразу.
      // Если есть input(): первый клик показывает поле ввода, второй — выполняет код.
      runBtn.addEventListener('click', async function () {
        var hasInput = /input\s*\(/.test(textarea.value);

        if (!hasInput) {
          // Нет ввода — запускаем сразу
          var code = textarea.value;
          output.className = 'exercise-output running';
          output.innerHTML = '⏳ Выполнение...';
          try {
            const response = await fetch('sandbox/run.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code, input: '', timeout: 5 })
            });
            if (!response.ok) {
              let errorMsg = 'HTTP ' + response.status + ': ' + response.statusText;
              try {
                const errorBody = await response.json();
                if (errorBody && errorBody.error) {
                  errorMsg = errorBody.error;
                }
              } catch (_) { }
              throw new Error(errorMsg);
            }
            const result = await response.json();
            renderSandboxResult(output, result);
          } catch (err) {
            output.className = 'exercise-output error';
            output.innerHTML = '⚠️ Ошибка: ' + escapeHtml(err.message);
          }
          return;
        }

        // Есть input()
        if (inputField.style.display === 'none') {
          // Первый клик — показываем поле ввода
          inputField.style.display = 'block';
          inputField.focus();
          output.classList.remove('show', 'error');
          output.textContent = '';
        } else {
          // Второй клик — поле уже видимо, выполняем код
          var code = textarea.value;
          var userInput = inputField.value;
          output.className = 'exercise-output running';
          output.innerHTML = '⏳ Выполнение...';
          try {
            const response = await fetch('sandbox/run.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code, input: userInput, timeout: 5 })
            });
            if (!response.ok) {
              let errorMsg = 'HTTP ' + response.status + ': ' + response.statusText;
              try {
                const errorBody = await response.json();
                if (errorBody && errorBody.error) {
                  errorMsg = errorBody.error;
                }
              } catch (_) { }
              throw new Error(errorMsg);
            }
            const result = await response.json();
            renderSandboxResult(output, result);
          } catch (err) {
            output.className = 'exercise-output error';
            output.innerHTML = '⚠️ Ошибка: ' + escapeHtml(err.message);
          }
        }
      });

      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          textarea.value = originalCode;
          inputField.value = '';
          inputField.style.display = 'none';
          output.classList.remove('show', 'error');
          output.textContent = '';
        });
      }
    });

    /**
     * Простейший симулятор Python (для демонстрационных упражнений).
     * Поддерживает print(), простые арифметические операции, переменные.
     * Для реального выполнения нужен Skulpt/Pyodide — здесь заглушка,
     * которая даёт правдоподобный вывод для типовых упражнений.
     */
    function simulatePython(code, outputEl) {
      var lines = code.replace(/\r/g, '').split('\n');
      var result = [];
      var vars = {};

      try {
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || line.startsWith('#')) continue;

          // print(...)
          var printMatch = line.match(/^print\s*\(\s*(.+?)\s*\)\s*$/);
          if (printMatch) {
            var expr = printMatch[1];
            // Простая замена переменных
            Object.keys(vars).forEach(function (v) {
              var re = new RegExp('\\b' + v + '\\b', 'g');
              expr = expr.replace(re, vars[v]);
            });
            // Простые строки в кавычках
            var strMatch = expr.match(/^["'](.+)["']$/);
            if (strMatch) {
              result.push(strMatch[1]);
            } else if (expr.match(/^["'].*["']\s*[+]\s*["'].*["']$/)) {
              // Конкатенация строк
              var parts = expr.match(/["']([^"']*)["']/g);
              if (parts) {
                result.push(parts.map(function(p) { return p.slice(1, -1); }).join(''));
              }
            } else {
              // Арифметика
              try {
                var safeExpr = expr.replace(/[^0-9+\-*/%.() ]/g, '');
                var val = Function('"use strict"; return (' + (safeExpr || '0') + ')')();
                result.push(String(val));
              } catch (e) {
                result.push(expr);
              }
            }
            continue;
          }

          // Присваивание: var = expr
          var assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
          if (assignMatch) {
            var varName = assignMatch[1];
            var rhs = assignMatch[2];
            // Подставить переменные
            Object.keys(vars).forEach(function (v) {
              var re = new RegExp('\\b' + v + '\\b', 'g');
              rhs = rhs.replace(re, vars[v]);
            });
            if (rhs.match(/^["']/)) {
              vars[varName] = rhs.slice(1, -1);
            } else if (rhs.match(/^(True|False)$/)) {
              vars[varName] = rhs;
            } else {
              try {
                var safeRhs = rhs.replace(/[^0-9+\-*/%.() ]/g, '');
                vars[varName] = Function('"use strict"; return (' + (safeRhs || '0') + ')')();
              } catch (e) {
                vars[varName] = rhs;
              }
            }
            continue;
          }

          // for i in range(...)
          var forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*$/);
          if (forMatch) {
            var fVar = forMatch[1];
            var fLimit = parseInt(forMatch[2], 10);
            // Ищем тело цикла (отступы!)
            var bodyStart = i + 1;
            while (bodyStart < lines.length && (lines[bodyStart].match(/^    /) || lines[bodyStart].match(/^\t/))) {
              bodyStart++;
            }
            // Извлекаем тело
            var bodyLines = lines.slice(i + 1, bodyStart).map(function (l) { return l.replace(/^(    |\t)/, ''); });
            for (var fi = 0; fi < fLimit; fi++) {
              vars[fVar] = fi;
              bodyLines.forEach(function (bl) {
                var pm = bl.match(/^print\s*\(\s*(.+?)\s*\)\s*$/);
                if (pm) {
                  var ex = pm[1];
                  Object.keys(vars).forEach(function (v) {
                    var re = new RegExp('\\b' + v + '\\b', 'g');
                    ex = ex.replace(re, vars[v]);
                  });
                  var sm = ex.match(/^["'](.+)["']$/);
                  if (sm) {
                    result.push(sm[1]);
                  } else {
                    try {
                      result.push(String(Function('"use strict"; return (' + (ex.replace(/[^0-9+\-*/%.() ]/g, '') || '0') + ')')()));
                    } catch(e2) {
                      result.push(ex);
                    }
                  }
                }
              });
            }
            i = bodyStart - 1;
            continue;
          }

          // Если ничего не поняли
          if (/^[a-zA-Z_]/.test(line) && !/^print|^if|^for|^while|^def|^import/.test(line)) {
            // Возможно, выражение, которое нужно вычислить как в REPL
            try {
              var replVal = Function('"use strict"; return (' + line + ')')();
              result.push(String(replVal));
            } catch(e3) { /* ignore */ }
          }
        }

        outputEl.textContent = result.join('\n');
        outputEl.classList.remove('error');
        outputEl.classList.add('show');
      } catch (err) {
        outputEl.textContent = '⚠️ Ошибка при выполнении: ' + err.message;
        outputEl.classList.add('show', 'error');
      }
    }
  })();
})();
