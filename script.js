/**
 * Python Web — Интерактивные улучшения
 * Подсветка синтаксиса, темы, копирование кода, поиск, прогресс, оглавление
 */
(function () {
  'use strict';

  // === U1: ИНДИКАТОР ЗАГРУЗКИ СТРАНИЦЫ (NProgress-стиль) ===
  (function () {
    var loaderBar = null;

    function getLoaderBar() {
      if (!loaderBar) {
        loaderBar = document.createElement('div');
        loaderBar.className = 'page-loader-bar';
        document.body.appendChild(loaderBar);
      }
      return loaderBar;
    }

    // Старт загрузки при клике на ссылку
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link || !link.href) return;
      // Пропускаем якорные ссылки, внешние ссылки, ссылки на скачивание, mailto, tel
      if (link.getAttribute('href').charAt(0) === '#') return;
      if (link.hostname !== window.location.hostname) return;
      if (link.hasAttribute('download')) return;
      if (link.getAttribute('rel') === 'noopener noreferrer' && link.target === '_blank') return;
      if (link.href.indexOf('mailto:') === 0 || link.href.indexOf('tel:') === 0) return;

      var bar = getLoaderBar();
      // Сброс
      bar.classList.remove('done', 'hide');
      bar.style.width = '0%';
      // Запускаем анимацию
      requestAnimationFrame(function () {
        bar.classList.add('running');
        bar.style.width = '40%';
      });
    });

    // Имитация прогресса до 85%
    var progressInterval = null;
    var progressTarget = 40;
    (function tick() {
      if (loaderBar && loaderBar.classList.contains('running')) {
        progressTarget = Math.min(progressTarget + (Math.random() * 10 + 2), 85);
        loaderBar.style.width = progressTarget + '%';
      }
      setTimeout(tick, 400);
    })();

    // При загрузке страницы — завершаем
    window.addEventListener('load', function () {
      var bar = getLoaderBar();
      if (bar.classList.contains('running') || bar.style.width !== '0%') {
        bar.classList.remove('running');
        bar.classList.add('done');
        bar.style.width = '100%';
        setTimeout(function () {
          bar.classList.add('hide');
        }, 200);
      }
    });
  })();

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

  /**
   * Экранирует HTML-спецсимволы для безопасного вставления текста.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Отображает результат выполнения Python-кода из песочницы.
   * @param {HTMLElement} outputEl — элемент, куда выводить результат
   * @param {object} result — объект с полями { ok, stdout, stderr, exit_code }
   */
  function renderSandboxResult(outputEl, result) {
    let html = '';

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
    // Явно показываем блок, т.к. он мог быть скрыт через style.display = 'none'
    outputEl.style.display = 'block';
    if (!result.ok) {
      outputEl.classList.add('error');
    }
  }

  /**
   * Санитизирует код, полученный из contentEditable или других источников:
   * — удаляет HTML-теги
   * — декодирует HTML-сущности (< → <, & → &)
   * — ограничивает максимальную длину (100 КБ)
   * — удаляет нулевые байты и другие управляющие символы
   * @param {string} code — исходная строка кода
   * @returns {string} — очищенный код
   */
  function sanitizeCode(code) {
    if (!code || typeof code !== 'string') return '';
    // 1. Удаляем HTML-теги (на случай, если код пришёл не через textContent)
    let sanitized = code.replace(/<[^>]*>/g, '');
    // 2. Декодируем HTML-сущности
    const txt = document.createElement('textarea');
    txt.innerHTML = sanitized;
    sanitized = txt.value;
    // 3. Удаляем нулевые байты
    sanitized = sanitized.replace(/\x00/g, '');
    // 4. Ограничиваем длину (100 КБ)
    const MAX_LEN = 102400;
    if (sanitized.length > MAX_LEN) {
      sanitized = sanitized.substring(0, MAX_LEN);
    }
    return sanitized;
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
    outputEl.style.display = 'block';
    try {
      const sanitizedCode = sanitizeCode(code);
      const sanitizedInput = sanitizeCode(userInput);
      const response = await fetch('sandbox/run.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sanitizedCode, input: sanitizedInput, timeout: 5 })
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
      outputEl.style.display = 'block';
      outputEl.innerHTML = '⚠️ Ошибка: ' + escapeHtml(err.message);
    }
  }

  // === ПОДСВЕТКА СИНТАКСИСА (Highlight.js + fallback) ===
  /**
   * Встроенная подсветка Python-синтаксиса (используется если highlight.js недоступен)
   * Раскрашивает: ключевые слова, строки, комментарии, числа, встроенные функции, декораторы
   */
  function highlightPythonFallback(codeEl) {
    var code = codeEl.textContent || '';
    // Экранируем HTML
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(code));
    var escaped = div.innerHTML;

    // Порядок важен: сначала строки (чтобы не задеть ключевые слова внутри строк)
    // Тройные строки (''' или """)
    escaped = escaped.replace(/('''[\\s\\S]*?'''|\"\"\"[\\s\\S]*?\"\"\")/g, '<span class="py-string">$1</span>');
    // Обычные строки (одинарные и двойные) — одинарные
    escaped = escaped.replace(/(?<!py-string[^>]*>)('[^'\\n]*')/g, '<span class="py-string">$1</span>');
    // Двойные строки
    escaped = escaped.replace(/(?<!py-string[^>]*>)(\"[^\"\\n]*\")/g, '<span class="py-string">$1</span>');
    // f-строки
    escaped = escaped.replace(/(?<!py-string[^>]*>)(f\"[^\"\\n]*\")/g, '<span class="py-fstring">$1</span>');
    escaped = escaped.replace(/(?<!py-string[^>]*>)(f'[^'\\n]*')/g, '<span class="py-fstring">$1</span>');
    // Комментарии (от # до конца строки, но не внутри строк)
    escaped = escaped.replace(/(^|[^\"'])(#.*$)/gm, '$1<span class="py-comment">$2</span>');
    // Числа (целые и дробные, включая научную нотацию)
    escaped = escaped.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?j?)\b/g, '<span class="py-number">$1</span>');
    // Ключевые слова
    var keywords = ['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield'];
    for (var i = 0; i < keywords.length; i++) {
      var kw = keywords[i];
      var re = new RegExp('\\b(' + kw + ')\\b(?![^<]*>|[^<]*<\/span>)', 'g');
      escaped = escaped.replace(re, '<span class="py-keyword">$1</span>');
    }
    // Встроенные функции
    var builtins = ['print','len','range','type','int','str','float','bool','list','dict','set','tuple','input','open','enumerate','zip','map','filter','sorted','reversed','sum','min','max','abs','round','isinstance','hasattr','getattr','setattr','super','iter','next','any','all','id','dir','help','format','ord','chr','divmod','pow','hex','oct','bin','repr','eval','exec','compile','globals','locals','vars','__import__'];
    for (var j = 0; j < builtins.length; j++) {
      var bi = builtins[j];
      var re2 = new RegExp('\\b(' + bi + ')\\b(?=[\\s\\(])', 'g');
      escaped = escaped.replace(re2, '<span class="py-builtin">$1</span>');
    }
    // Декораторы
    escaped = escaped.replace(/(@\w+)/g, '<span class="py-decorator">$1</span>');

    codeEl.innerHTML = escaped;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var allPre = document.querySelectorAll('.main-content pre, pre.code-block, .main-content pre code, pre.code-block code');
    // Если pre содержит code, берём code; иначе pre
    var blocks = [];
    allPre.forEach(function (el) {
      if (el.tagName === 'CODE' && el.parentElement.tagName === 'PRE') {
        // code внутри pre — работаем с родительским pre
        if (blocks.indexOf(el.parentElement) === -1) {
          blocks.push(el.parentElement);
        }
      } else if (el.tagName === 'PRE') {
        if (blocks.indexOf(el) === -1) {
          blocks.push(el);
        }
      }
    });

    var hljsAvailable = (typeof hljs !== 'undefined');

    blocks.forEach(function (block) {
      block.classList.add('language-python');
      if (hljsAvailable) {
        hljs.highlightElement(block);
      } else {
        // Fallback — подсветка без highlight.js
        var codeEl = block.querySelector('code') || block;
        highlightPythonFallback(codeEl);
      }
    });

    // Если highlight.js ещё не загрузился, пробуем через 500ms (на случай defer/async)
    if (!hljsAvailable) {
      setTimeout(function () {
        if (typeof hljs !== 'undefined') {
          blocks.forEach(function (block) {
            var codeEl = block.querySelector('code');
            // Сбрасываем fallback-подсветку
            if (codeEl && codeEl.querySelector('.py-keyword')) {
              codeEl.textContent = codeEl.textContent; // сброс innerHTML
            }
            hljs.highlightElement(block);
          });
        }
      }, 500);
      // Пробуем ещё позже
      setTimeout(function () {
        if (typeof hljs !== 'undefined') {
          document.querySelectorAll('.main-content pre.language-python').forEach(function (block) {
            if (!block.querySelector('.hljs')) {
              hljs.highlightElement(block);
            }
          });
        }
      }, 1500);
    }
  });

  // --- Клавиатурная навигация: стрелки ← → ---
  document.addEventListener('keydown', function(e) {
    // Не перехватываем, если фокус в поле ввода
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'ArrowLeft') {
      const prev = document.querySelector('.prev-link');
      if (prev) window.location.href = prev.getAttribute('href');
    } else if (e.key === 'ArrowRight') {
      const next = document.querySelector('.next-link');
      if (next) window.location.href = next.getAttribute('href');
    }
  });

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
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    const h1 = document.querySelector('.topic-header h1');
    const title = h1 ? h1.textContent.trim() : (document.title.split(' — ')[0] || document.title);

    container.innerHTML = '<a href="index.html">🏠 Главная</a> <span class="bc-sep">/</span> <span class="bc-current">' + title + '</span>';
  });

  // === МЕТАДАННЫЕ УРОКА: ВРЕМЯ ЧТЕНИЯ + СЛОЖНОСТЬ ===
  // Вставляется только если не было сгенерировано статически (Eleventy)
  (function () {
    document.addEventListener('DOMContentLoaded', () => {
      // Если .lesson-meta-info уже есть в HTML (сгенерирован Eleventy), не добавляем повторно
      const existingMeta = document.querySelector('.lesson-meta-info');
      if (existingMeta) return;

      const lessonNum = parseInt(document.body.getAttribute('data-lesson'), 10);
      if (isNaN(lessonNum)) return;
      if (typeof LESSON_META === 'undefined' || typeof COMPLEXITY_LABELS === 'undefined') return;

      const meta = LESSON_META[lessonNum];
      if (!meta) return;

      const topicHeader = document.querySelector('.topic-header');
      if (!topicHeader) return;

      // Ищем subtitle или h1 — вставляем после subtitle, иначе после h1
      const subtitle = topicHeader.querySelector('.subtitle');
      const insertAfter = subtitle || topicHeader.querySelector('h1');
      if (!insertAfter) return;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'lesson-meta-info';
      const complexityLabel = COMPLEXITY_LABELS[meta.complexity] || meta.complexity;
      metaDiv.innerHTML = '<span class="meta-duration">⏱ ~' + meta.duration + ' мин чтения</span> <span class="meta-sep">·</span> <span class="meta-complexity" data-level="' + meta.complexity + '">' + complexityLabel + '</span>';

      insertAfter.insertAdjacentElement('afterend', metaDiv);
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

  // === КНОПКИ КОПИРОВАНИЯ, ЗАПУСКА и РЕДАКТИРОВАНИЯ КОДА ===
  (function () {
    /**
     * Сбрасывает fallback-подсветку innerHTML на исходный текст,
     * затем переподсвечивает (либо hljs, либо снова fallback).
     */
    function recalcHighlight(pre) {
      var codeEl = pre.querySelector('code') || pre;
      // Сбрасываем HTML-подсветку к исходному тексту
      var raw = codeEl.textContent || '';
      codeEl.textContent = raw;
      if (typeof hljs !== 'undefined') {
        pre.classList.add('language-python');
        hljs.highlightElement(pre);
      } else {
        highlightPythonFallback(codeEl);
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      // Ищем все pre внутри .main-content (включая pre > code.language-python после Eleventy)
      var preElements = document.querySelectorAll('.main-content pre, pre.code-block');

      preElements.forEach(function (pre) {
        // Пропускаем, если уже обёрнут
        if (pre.parentElement.classList.contains('code-wrapper')) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // ── Панель инструментов ──
        var toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        wrapper.appendChild(toolbar);

        // ── Кнопка копирования ──
        var copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 <span class="btn-label">Копировать</span>';
        copyBtn.title = 'Копировать код в буфер обмена';
        copyBtn.setAttribute('aria-label', 'Копировать код');

        copyBtn.addEventListener('click', function () {
          var code = pre.textContent || pre.innerText || '';
          if (typeof navigator.clipboard !== 'undefined' && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(function () {
              copyBtn.innerHTML = '✓ <span class="btn-label">Скопировано</span>';
              copyBtn.classList.add('copied');
              setTimeout(function () {
                copyBtn.innerHTML = '📋 <span class="btn-label">Копировать</span>';
                copyBtn.classList.remove('copied');
              }, 2000);
            }).catch(fallbackCopy);
          } else {
            fallbackCopy();
          }
          function fallbackCopy() {
            var textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(textarea);
            copyBtn.innerHTML = '✓ <span class="btn-label">Скопировано</span>';
            copyBtn.classList.add('copied');
            setTimeout(function () {
              copyBtn.innerHTML = '📋 <span class="btn-label">Копировать</span>';
              copyBtn.classList.remove('copied');
            }, 2000);
          }
        });
        toolbar.appendChild(copyBtn);

        // ── Кнопка «Редактировать» ──
        var editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✎ <span class="btn-label">Ред.</span>';
        editBtn.title = 'Редактировать код';
        editBtn.setAttribute('aria-label', 'Редактировать код');

        var isEditing = false;
        editBtn.addEventListener('click', function () {
          isEditing = !isEditing;
          pre.contentEditable = isEditing ? 'true' : 'false';
          pre.spellcheck = false;
          if (isEditing) {
            pre.classList.add('editing');
            editBtn.classList.add('active');
            editBtn.innerHTML = '✓ <span class="btn-label">Готово</span>';
            pre.focus();
          } else {
            pre.classList.remove('editing');
            editBtn.classList.remove('active');
            editBtn.innerHTML = '✎ <span class="btn-label">Ред.</span>';
            // Переподсвечиваем после редактирования
            recalcHighlight(pre);
          }
        });

        // Повторный клик по самому pre тоже включает редактирование
        pre.addEventListener('dblclick', function () {
          if (!isEditing) {
            isEditing = true;
            pre.contentEditable = 'true';
            pre.spellcheck = false;
            pre.classList.add('editing');
            editBtn.classList.add('active');
            editBtn.innerHTML = '✓ <span class="btn-label">Готово</span>';
            pre.focus();
          }
        });

        toolbar.appendChild(editBtn);

        // ── Кнопка запуска ──
        var runBtn = document.createElement('button');
        runBtn.className = 'run-btn';
        runBtn.innerHTML = '▶ <span class="btn-label">Запустить</span>';
        runBtn.title = 'Запустить код в песочнице';
        runBtn.setAttribute('aria-label', 'Запустить код в песочнице');

        toolbar.appendChild(runBtn);

        // ── Поле ввода для input() ──
        var inputField = document.createElement('textarea');
        inputField.className = 'sandbox-input';
        inputField.placeholder = 'Введите данные для input() — каждое значение на новой строке…';
        inputField.style.display = 'none';
        wrapper.appendChild(inputField);

        // ── Контейнер кнопок управления (Выполнить + Сброс) ──
        var btnGroup = document.createElement('div');
        btnGroup.className = 'exercise-buttons';
        btnGroup.style.display = 'none';
        wrapper.appendChild(btnGroup);

        var executeBtn = document.createElement('button');
        executeBtn.className = 'exercise-run-btn';
        executeBtn.textContent = '▶ Выполнить';
        btnGroup.appendChild(executeBtn);

        var resetBtn = document.createElement('button');
        resetBtn.className = 'exercise-reset-btn';
        resetBtn.textContent = '✕ Сброс';
        btnGroup.appendChild(resetBtn);

        // ── Блок вывода ──
        var outputDiv = document.createElement('div');
        outputDiv.className = 'sandbox-output';
        outputDiv.style.display = 'none';
        wrapper.appendChild(outputDiv);

        // ── Логика запуска ──
        runBtn.addEventListener('click', function () {
          // Снимаем режим редактирования перед запуском
          if (isEditing) {
            isEditing = false;
            pre.contentEditable = 'false';
            pre.classList.remove('editing');
            editBtn.classList.remove('active');
            editBtn.innerHTML = '✎ <span class="btn-label">Ред.</span>';
            recalcHighlight(pre);
          }
          var code = (pre.textContent || pre.innerText || '').trim();
          var hasInput = /input\s*\(/.test(code);

          if (hasInput) {
            btnGroup.style.display = 'flex';
            outputDiv.style.display = 'none';
            inputField.style.display = 'block';
            inputField.focus();
          } else {
            btnGroup.style.display = 'none';
            inputField.style.display = 'none';
            inputField.value = '';
            outputDiv.style.display = 'block';
            executeCode(outputDiv, code, '');
          }
        });

        executeBtn.addEventListener('click', function () {
          var code = (pre.textContent || pre.innerText || '').trim();
          var userInput = inputField.value;
          outputDiv.style.display = 'block';
          executeCode(outputDiv, code, userInput);
        });

        resetBtn.addEventListener('click', function () {
          inputField.style.display = 'none';
          btnGroup.style.display = 'none';
          outputDiv.style.display = 'none';
          inputField.value = '';
          outputDiv.innerHTML = '';
        });
      });
    });
  })();

  // === ИНДИКАТОР ПРОГРЕССА СКРОЛЛА ===
  (function () {
    document.addEventListener('DOMContentLoaded', () => {
      const bar = document.createElement('div');
      bar.className = 'scroll-progress-bar';
      document.body.appendChild(bar);

      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
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
      const totalLessons = 50;

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
        const lessonNum = parseInt(card.getAttribute('data-lesson'));

        // Добавляем метаданные (время чтения + сложность)
        if (typeof LESSON_META !== 'undefined') {
          const meta = LESSON_META[lessonNum];
          if (meta) {
            const infoDiv = card.querySelector('.topic-info');
            if (infoDiv && !infoDiv.querySelector('.topic-meta')) {
              const metaSpan = document.createElement('div');
              metaSpan.className = 'topic-meta';
              const complexityLabel = (typeof COMPLEXITY_LABELS !== 'undefined' && COMPLEXITY_LABELS[meta.complexity])
                ? COMPLEXITY_LABELS[meta.complexity]
                : meta.complexity;
              metaSpan.innerHTML = '<span class="meta-duration">⏱ ' + meta.duration + ' мин</span> · <span class="meta-complexity" data-level="' + meta.complexity + '">' + complexityLabel + '</span>';
              infoDiv.appendChild(metaSpan);
            }
          }
        }

        // Добавляем значок контеста
        if (lessonNum && window.THEORY_CONTESTS && window.THEORY_CONTESTS[lessonNum]) {
          const contestId = window.THEORY_CONTESTS[lessonNum];
          const contestUrl = (window.CONTEST_BASE_URL || 'https://contest.nayanovaacademy.ru/c/') + contestId;
          const badge = document.createElement('a');
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

  // === ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ НАВИГАЦИИ НА ГЛАВНОЙ ИЗ lessons.json ===
  (function () {
    document.addEventListener('DOMContentLoaded', () => {
      // Только на главной странице
      const page = window.location.pathname.split('/').pop();
      if (page && page !== 'index.html' && page !== '') return;
      const nav = document.querySelector('nav');
      if (!nav || nav.querySelector('.section-group')) return; // уже сгенерировано

      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'lessons.json', true);
      xhr.onload = function () {
        if (xhr.status < 200 || xhr.status >= 300) return;
        try {
          const data = JSON.parse(xhr.responseText);
          buildNav(nav, data);
        } catch (e) {
          console.warn('Failed to parse lessons.json:', e);
        }
      };
      xhr.onerror = function () { console.warn('lessons.json not available — nav stays static'); };
      xhr.send();
    });

    function buildNav(nav, data) {
      const sections = data.sections;
      if (!sections || !sections.length) return;

      // === U2: СОЗДАЁМ STICKY ЯКОРНОЕ МЕНЮ СЕКЦИЙ ===
      var anchorNav = document.createElement('nav');
      anchorNav.className = 'section-anchor-nav';
      anchorNav.setAttribute('aria-label', 'Быстрая навигация по разделам');
      nav.parentNode.insertBefore(anchorNav, nav);

      sections.forEach(function (section) {
        var sectionId = 'section-' + section.id;
        var group = document.createElement('div');
        group.className = 'section-group';
        group.setAttribute('data-section', section.id);
        group.id = sectionId;

        const cards = document.createElement('div');
        cards.className = 'section-cards';

        section.lessons.forEach(function (lesson) {
          const a = document.createElement('a');
          a.href = lesson.file;
          a.className = 'topic-card';
          a.setAttribute('data-lesson', lesson.num);

          const numDiv = document.createElement('div');
          numDiv.className = 'topic-num';
          numDiv.textContent = lesson.num;
          a.appendChild(numDiv);

          const info = document.createElement('div');
          info.className = 'topic-info';

          const h2 = document.createElement('h2');
          h2.textContent = lesson.title;
          info.appendChild(h2);

          const p = document.createElement('p');
          p.textContent = lesson.desc;
          info.appendChild(p);

          // Метаданные: длительность + сложность
          if (typeof COMPLEXITY_LABELS !== 'undefined') {
            const metaSpan = document.createElement('div');
            metaSpan.className = 'topic-meta';
            const label = COMPLEXITY_LABELS[lesson.complexity] || lesson.complexity;
            metaSpan.innerHTML = '<span class="meta-duration">⏱ ' + lesson.duration + ' мин</span> · <span class="meta-complexity" data-level="' + lesson.complexity + '">' + label + '</span>';
            info.appendChild(metaSpan);
          }

          a.appendChild(info);

          // Значок контеста
          if (typeof window.THEORY_CONTESTS !== 'undefined' && window.THEORY_CONTESTS[lesson.num]) {
            const badge = document.createElement('a');
            badge.className = 'contest-badge';
            badge.href = (typeof window.CONTEST_BASE_URL !== 'undefined' ? window.CONTEST_BASE_URL : 'https://contest.nayanovaacademy.ru/c/') + window.THEORY_CONTESTS[lesson.num];
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.title = 'Задачи к этой теме';
            badge.innerHTML = '📝';
            badge.setAttribute('aria-label', 'Открыть задачи контеста');
            a.appendChild(badge);
          }

        cards.appendChild(a);
      });

        group.appendChild(cards);
        nav.appendChild(group);

        // Добавляем ссылку в якорное меню
        var anchorLink = document.createElement('a');
        anchorLink.href = '#' + sectionId;
        anchorLink.textContent = section.title;
        anchorLink.addEventListener('click', function (e) {
          e.preventDefault();
          var el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        });
        anchorNav.appendChild(anchorLink);
      });

      // IntersectionObserver для подсветки активной секции в якорном меню
      if ('IntersectionObserver' in window) {
        var anchorLinks = anchorNav.querySelectorAll('a');
        var sectionObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var id = entry.target.id;
            var link = anchorNav.querySelector('a[href="#' + id + '"]');
            if (link) {
              if (entry.isIntersecting) {
                anchorLinks.forEach(function (l) { l.classList.remove('active'); });
                link.classList.add('active');
              }
            }
          });
        }, { rootMargin: '-20% 0px -70% 0px' });

        nav.querySelectorAll('.section-group[id]').forEach(function (group) {
          sectionObserver.observe(group);
        });
      }

      // Секция «Итоги» (финальный тест + REPL)
      const finalGroup = document.createElement('div');
      finalGroup.className = 'section-group';
      finalGroup.setAttribute('data-section', 'final');
      const finalTitle = document.createElement('h2');
      finalTitle.className = 'section-title';
      finalTitle.textContent = '🏁 Итоги';
      finalGroup.appendChild(finalTitle);
      const finalCards = document.createElement('div');
      finalCards.className = 'section-cards';

      // Финальный тест
      const ftA = document.createElement('a');
      ftA.href = 'final-test.html';
      ftA.className = 'topic-card';
      ftA.setAttribute('data-lesson', 'final-test');
      const ftNum = document.createElement('div');
      ftNum.className = 'topic-num';
      ftNum.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      ftNum.textContent = '🏆';
      ftA.appendChild(ftNum);
      const ftInfo = document.createElement('div');
      ftInfo.className = 'topic-info';
      ftInfo.innerHTML = '<h2>Итоговый тест</h2><p>Проверка знаний по всем темам</p>';
      ftA.appendChild(ftInfo);
      finalCards.appendChild(ftA);

      // REPL
      const rA = document.createElement('a');
      rA.href = 'repl.html';
      rA.className = 'topic-card';
      rA.style.borderColor = 'var(--primary)';
      const rNum = document.createElement('div');
      rNum.className = 'topic-num';
      rNum.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      rNum.textContent = '▶';
      rA.appendChild(rNum);
      const rInfo = document.createElement('div');
      rInfo.className = 'topic-info';
      rInfo.innerHTML = '<h2>Python REPL — Интерактивная консоль</h2><p>Пиши код и сразу видь результат</p>';
      rA.appendChild(rInfo);
      finalCards.appendChild(rA);

      finalGroup.appendChild(finalCards);
      nav.appendChild(finalGroup);

      // Добавляем метаданные для уже сгенерированных карточек
      const allCards = nav.querySelectorAll('.topic-card[data-lesson]');
      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        const lessonNum = parseInt(card.getAttribute('data-lesson'));
        if (!lessonNum || isNaN(lessonNum)) continue;
        if (typeof window.THEORY_CONTESTS !== 'undefined' && window.THEORY_CONTESTS[lessonNum] && !card.querySelector('.contest-badge')) {
          const b = document.createElement('a');
          b.className = 'contest-badge';
          b.href = (typeof window.CONTEST_BASE_URL !== 'undefined' ? window.CONTEST_BASE_URL : 'https://contest.nayanovaacademy.ru/c/') + window.THEORY_CONTESTS[lessonNum];
          b.target = '_blank';
          b.rel = 'noopener noreferrer';
          b.title = 'Задачи к этой теме';
          b.innerHTML = '📝';
          b.setAttribute('aria-label', 'Открыть задачи контеста');
          card.appendChild(b);
        }
      }
    }
  })();

  // === ПЛАВНЫЙ СКРОЛЛ ДЛЯ ЯКОРНЫХ ССЫЛОК ===
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

  // === ДИНАМИЧЕСКАЯ ВСТАВКА ССЫЛКИ НА КОНТЕСТ ===
  (function () {
    if (typeof window.THEORY_CONTESTS === 'undefined' || typeof window.CONTEST_BASE_URL === 'undefined') return;

    document.addEventListener('DOMContentLoaded', () => {
      const placeholder = document.getElementById('contest-link-placeholder');
      if (!placeholder) return;

      // Определяем номер урока из имени файла (например, 06-number-ops.html → 6)
      const pageName = window.location.pathname.split('/').pop();
      const match = pageName.match(/^(\d+)/);
      if (!match) return;
      const lessonNum = parseInt(match[1], 10);

      const contestId = window.THEORY_CONTESTS[lessonNum];
      if (!contestId) return;

      const contestUrl = window.CONTEST_BASE_URL + contestId;

      const div = document.createElement('div');
      div.className = 'contest-link';
      div.innerHTML =
        '<p style="text-align: center; margin-top: 2rem; padding: 1rem; background: #1e3a5f; border-radius: 8px; color: #e0e0e0;">' +
        '🏆 Решай задачи по пройденным темам на сайте ' +
        '<a href="' + contestUrl + '" target="_blank" rel="noopener noreferrer" style="color: #7ec8ff; font-weight: 600; text-decoration: underline;">contest.nayanovaacademy.ru</a>' +
        '</p>';

      // Вставляем ссылку на контест после контейнера с квизом
      setTimeout(function () {
        const quizContainer = document.querySelector('.main-content > .quiz-container');
        if (quizContainer) {
          quizContainer.parentNode.insertBefore(div, quizContainer.nextSibling);
          placeholder.remove();
        } else {
          placeholder.parentNode.replaceChild(div, placeholder);
        }
      }, 0);
    });
  })();

  // === РЕГИСТРАЦИЯ SERVICE WORKER ===
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './' })
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration skipped'));
    });
  }

  // === МОБИЛЬНОЕ ГАМБУРГЕР-МЕНЮ (список всех уроков из lessons.json) ===
  (function () {
    document.addEventListener('DOMContentLoaded', () => {
      // Текущая страница
      const currentPage = window.location.pathname.split('/').pop();

      // Кнопка-гамбургер
      const hamburger = document.createElement('button');
      hamburger.className = 'hamburger-menu';
      hamburger.innerHTML = '☰';
      hamburger.setAttribute('aria-label', 'Меню уроков');
      hamburger.title = 'Список уроков';
      document.body.appendChild(hamburger);

      // Панель меню
      const overlay = document.createElement('div');
      overlay.className = 'hamburger-overlay';
      document.body.appendChild(overlay);

      const panel = document.createElement('div');
      panel.className = 'hamburger-panel';
      panel.innerHTML = '<div class="hamburger-header">🐍 Уроки Python <span class="hamburger-close">✕</span></div><ul class="hamburger-list"></ul>';
      document.body.appendChild(panel);

      const list = panel.querySelector('.hamburger-list');

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

      // Загружаем список уроков из lessons.json (единый источник истины)
      fetch('lessons.json')
        .then(function (response) {
          if (!response.ok) throw new Error('lessons.json not available');
          return response.json();
        })
        .then(function (data) {
          const allLessons = [];
          if (data.sections) {
            data.sections.forEach(function (section) {
              section.lessons.forEach(function (lesson) {
                allLessons.push({
                  num: lesson.num,
                  title: lesson.title,
                  href: lesson.file
                });
              });
            });
          }
          // Добавляем итоговый тест
          allLessons.push({ num: '🏆', title: 'Итоговый тест', href: 'final-test.html' });

          // === U3: ИНДИКАТОРЫ ПРОГРЕССА В МОБИЛЬНОМ МЕНЮ ===
          // Загружаем прогресс из localStorage
          var completedLessons = [];
          try {
            completedLessons = JSON.parse(localStorage.getItem('python-web-progress') || '[]');
          } catch (e) {}

          allLessons.forEach(function (lesson) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = lesson.href;
            a.className = 'hamburger-link';
            var innerHTML = '<span class="hamburger-num">' + lesson.num + '</span> ' + lesson.title;
            // Добавляем галочку, если урок пройден
            if (completedLessons.indexOf(lesson.href) !== -1) {
              innerHTML += '<span class="hamburger-check">✓</span>';
              a.classList.add('completed-link');
            }
            a.innerHTML = innerHTML;
            if (currentPage === lesson.href) {
              a.classList.add('hamburger-active');
            }
            li.appendChild(a);
            list.appendChild(li);
          });
        })
        .catch(function () {
          // Если lessons.json недоступен — показываем сообщение
          list.innerHTML = '<li style="padding:1rem;color:var(--text-muted);">Не удалось загрузить список уроков</li>';
        });
    });

    // =========================
    //  QUIZ — САМОПРОВЕРКА
    // =========================
    (function initQuiz() {
      // Номер урока: либо из data-lesson атрибута на body, либо из URL
      let lessonKey = document.body.getAttribute('data-lesson');
      const lessonNumParsed = parseInt(lessonKey, 10);
      if (!isNaN(lessonNumParsed)) {
        lessonKey = lessonNumParsed;
      }
      if (!lessonKey) return;

      // Ищем место вставки заранее (до асинхронной загрузки)
      const main = document.querySelector('.main-content');
      if (!main) return;

      // Создаём контейнер с индикатором загрузки
      const container = document.createElement('div');
      container.className = 'quiz-container';
      container.innerHTML = '<div class="quiz-loading">⏳ Загрузка вопросов...</div>';

      const toggle = main.querySelector('.lesson-complete-toggle');
      if (toggle) {
        main.insertBefore(container, toggle);
      } else {
        main.appendChild(container);
      }

      // Асинхронная загрузка quiz-данных из JSON-файла
      const quizUrl = 'quizzes/' + lessonKey + '.json';
      fetch(quizUrl)
        .then(function (response) {
          if (!response.ok) throw new Error('Quiz not found');
          return response.json();
        })
        .then(function (quiz) {
          if (!quiz || !quiz.length) return;

          // Кешируем в глобальный объект для обратной совместимости
          if (typeof window.LESSON_QUIZZES === 'undefined') {
            window.LESSON_QUIZZES = {};
          }
          window.LESSON_QUIZZES[lessonKey] = quiz;

          let state = { idx: 0, correct: 0, answered: false, total: quiz.length };

          function renderQuestion() {
            const q = quiz[state.idx];
            const optionsHtml = q.options.map(function (opt, oi) {
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
            const options = container.querySelectorAll('.quiz-option');
            const feedback = container.querySelector('.quiz-feedback');
            const nextBtn = container.querySelector('.quiz-next-btn');
            const q = quiz[state.idx];

            options.forEach(function (opt) {
              opt.addEventListener('click', function () {
                if (state.answered) return;
                state.answered = true;

                const chosen = parseInt(opt.getAttribute('data-idx'), 10);
                const isCorrect = chosen === q.correct;

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
            const pct = Math.round((state.correct / state.total) * 100);
            const emoji = pct === 100 ? '🥇' : pct >= 50 ? '👍' : '📚';
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

          renderQuestion();
        })
        .catch(function () {
          // Если quiz-файл не найден — скрываем контейнер
          container.style.display = 'none';
        });
    })();

    // =========================
    //  INLINE EXERCISES
    // =========================
    (function initExercises() {
      // Находим все .exercise-block на странице
      const blocks = document.querySelectorAll('.exercise-block');
      blocks.forEach(function (block) {
        const textarea = block.querySelector('textarea');
        const output = block.querySelector('.exercise-output');
        const runBtn = block.querySelector('.exercise-run-btn');
        const resetBtn = block.querySelector('.exercise-reset-btn');

        if (!textarea || !runBtn) return;

        // Сохраняем исходный код
        const originalCode = textarea.value;

        // Поле ввода для input() — скрыто по умолчанию
        const inputField = document.createElement('textarea');
        inputField.className = 'exercise-input';
        inputField.placeholder = 'Ввод данных для input() — каждое значение на новой строке…';
        inputField.style.display = 'none';
        inputField.style.marginTop = '8px';
        inputField.style.width = '100%';
        inputField.style.boxSizing = 'border-box';
        block.insertBefore(inputField, output);

        runBtn.addEventListener('click', async function () {
            const hasInput = /input\s*\(/.test(textarea.value);

          if (!hasInput) {
            // Нет ввода — запускаем сразу
            const code = sanitizeCode(textarea.value);
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
              output.style.display = 'block';
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
            const code = sanitizeCode(textarea.value);
            const userInput = sanitizeCode(inputField.value);
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
              output.style.display = 'block';
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
    })();
  })();

  // === СИСТЕМА ДОСТИЖЕНИЙ (BADGES) ===
  (function () {
    document.addEventListener('DOMContentLoaded', function () {
      const block = document.getElementById('badgesBlock');
      const grid = document.getElementById('badgesGrid');
      if (!block || !grid) return;

      const TOPIC_ORDER = (typeof window.TOPIC_ORDER !== 'undefined') ? window.TOPIC_ORDER : [];
      const BADGES = (typeof window.BADGES !== 'undefined') ? window.BADGES : [];
      if (!TOPIC_ORDER.length || !BADGES.length) return;

      // Показываем блок
      block.style.display = '';

      // Вычисляем прогресс
      const completed = JSON.parse(localStorage.getItem('python-lessons-completed') || '{}');
      const total = TOPIC_ORDER.length;
      let done = 0;
      const sectionsDone = {};
      TOPIC_ORDER.forEach(function (filename) {
        if (completed[filename]) {
          done++;
          // Определяем секцию по номеру урока
          const lessonNum = parseInt(filename);
          if (!isNaN(lessonNum)) {
            // Группируем по секциям (приблизительно)
            if (lessonNum >= 1 && lessonNum <= 2) sectionsDone['intro'] = (sectionsDone['intro'] || 0) + 1;
            else if (lessonNum >= 3 && lessonNum <= 8) sectionsDone['basics'] = (sectionsDone['basics'] || 0) + 1;
            else if (lessonNum >= 9 && lessonNum <= 13) sectionsDone['conditions_strings'] = (sectionsDone['conditions_strings'] || 0) + 1;
            else if (lessonNum >= 14 && lessonNum <= 18) sectionsDone['loops'] = (sectionsDone['loops'] || 0) + 1;
            else if (lessonNum >= 19 && lessonNum <= 20) sectionsDone['functions'] = (sectionsDone['functions'] || 0) + 1;
            else if (lessonNum >= 21 && lessonNum <= 26) sectionsDone['data_structures'] = (sectionsDone['data_structures'] || 0) + 1;
            else if (lessonNum >= 27 && lessonNum <= 28) sectionsDone['errors_files'] = (sectionsDone['errors_files'] || 0) + 1;
            else if (lessonNum >= 29 && lessonNum <= 32) sectionsDone['modules'] = (sectionsDone['modules'] || 0) + 1;
            else if (lessonNum >= 33) sectionsDone['oop_final'] = (sectionsDone['oop_final'] || 0) + 1;
          }
        }
      });

      const sectionNames = {
        'intro': 'Введение',
        'basics': 'Основы',
        'conditions_strings': 'Условия и строки',
        'functions': 'Функции',
        'loops': 'Циклы',
        'data_structures': 'Структуры данных',
        'errors_files': 'Ошибки и файлы',
        'modules': 'Модули',
        'oop_final': 'ООП и финал'
      };
      const sectionTotals = {
        'intro': 2,
        'basics': 6,
        'conditions_strings': 5,
        'functions': 2,
        'loops': 5,
        'data_structures': 6,
        'errors_files': 2,
        'modules': 4,
        'oop_final': 2
      };

      // Рендерим бейджи
      BADGES.forEach(function (badge) {
        let earned = false;
        if (badge.id === 'first_step' && done >= 1) earned = true;
        else if (badge.id === 'five_done' && done >= 5) earned = true;
        else if (badge.id === 'half_course' && done >= Math.floor(total / 2)) earned = true;
        else if (badge.id === 'all_done' && done >= total) earned = true;
        else if (badge.id === 'perfectionist' && done >= total) earned = true;
        else if (badge.section) {
          const secDone = sectionsDone[badge.section] || 0;
          const secTotal = sectionTotals[badge.section] || 5;
          if (secDone >= secTotal) earned = true;
        }

        const span = document.createElement('span');
        span.className = 'badge-item' + (earned ? ' earned' : ' locked');
        span.setAttribute('data-tooltip', badge.description);
        span.innerHTML = '<span class="badge-icon">' + badge.icon + '</span>' + badge.name;
        grid.appendChild(span);
      });
    });
  })();

  // Экспорт в глобальную область видимости (для обратной совместимости с repl.html)
  window.escapeHtml = escapeHtml;

})();
