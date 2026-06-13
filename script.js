/**
 * Python Web — Интерактивные улучшения
 * Подсветка синтаксиса, темы, копирование кода, поиск, прогресс, оглавление
 */


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

// === КНОПКИ КОПИРОВАНИЯ КОДА ===
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre.code-block').forEach(pre => {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = '📋';
      btn.title = 'Копировать код';
      btn.setAttribute('aria-label', 'Копировать код');

      btn.addEventListener('click', async () => {
        const code = pre.textContent || pre.innerText;
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = '✓ Скопировано';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '📋';
            btn.classList.remove('copied');
          }, 2000);
        } catch {
          // Fallback для старых браузеров
          const textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          btn.textContent = '✓ Скопировано';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '📋';
            btn.classList.remove('copied');
          }, 2000);
        }
      });

      wrapper.appendChild(btn);
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
    const totalLessons = 27;

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

      // Добавляем значок контеста
      var lessonNum = parseInt(card.getAttribute('data-lesson'));
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
