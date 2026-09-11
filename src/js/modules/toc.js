'use strict';

/**
 * Table of Contents generation module
 * Generates dynamic table of contents from page headings.
 * On mobile (<= 768px) the TOC is a floating overlay toggled by a FAB button;
 * on desktop it stays a sticky sidebar.
 */

const MOBILE_QUERY = '(max-width: 768px)';

/**
 * Initialize the table of contents.
 * @returns {Function} Cleanup: removes listeners, disconnects observer, removes the toggle button.
 */
export function initTableOfContents() {
  const tocEl = document.getElementById('toc');
  if (!tocEl) return;

  const headings = document.querySelectorAll(
    'main h2, .main-content h2, main h3, .main-content h3, section h2, section h3',
  );
  if (headings.length < 2) {
    tocEl.style.display = 'none';
    return;
  }

  const titleDiv = document.createElement('div');
  titleDiv.className = 'toc-title';
  titleDiv.textContent = '📑 Содержание урока';
  tocEl.appendChild(titleDiv);

  const list = document.createElement('ul');

  headings.forEach(function (heading, idx) {
    if (!heading.id) heading.id = 'section-' + idx;
    const li = document.createElement('li');
    li.className = heading.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
    const a = document.createElement('a');
    a.href = '#' + heading.id;
    a.textContent = heading.textContent.trim();
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeToc();
      document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth' });
    });
    li.appendChild(a);
    list.appendChild(li);
  });

  tocEl.appendChild(list);

  // Mobile overlay: floating toggle button (hidden by CSS on desktop)
  const mq = window.matchMedia(MOBILE_QUERY);
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toc-mobile-toggle';
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-controls', 'toc');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-label', 'Открыть содержание урока');
  toggleBtn.textContent = '📑';
  document.body.appendChild(toggleBtn);

  function isOpen() {
    return tocEl.classList.contains('toc-open');
  }

  function openToc() {
    tocEl.classList.add('toc-open');
    toggleBtn.textContent = '✕';
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Закрыть содержание урока');
  }

  function closeToc() {
    if (!isOpen()) return;
    tocEl.classList.remove('toc-open');
    toggleBtn.textContent = '📑';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Открыть содержание урока');
  }

  function onToggleClick(e) {
    e.stopPropagation();
    if (isOpen()) {
      closeToc();
    } else {
      openToc();
    }
  }

  function onDocumentClick(e) {
    if (!mq.matches) return;
    if (tocEl.contains(e.target) || toggleBtn.contains(e.target)) return;
    closeToc();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeToc();
  }

  function onMediaChange(e) {
    // Returning to the desktop layout: drop overlay state
    if (!e.matches) closeToc();
  }

  toggleBtn.addEventListener('click', onToggleClick);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onMediaChange);
  }

  // Highlight active TOC item on scroll
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        const id = entry.target.id;
        const link = list.querySelector('a[href="#' + id + '"]');
        if (link) {
          link.classList.toggle('toc-active', entry.isIntersecting);
        }
      });
    },
    { rootMargin: '-80px 0px -70% 0px' },
  );

  headings.forEach(function (h) {
    observer.observe(h);
  });

  return function cleanup() {
    observer.disconnect();
    toggleBtn.removeEventListener('click', onToggleClick);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown);
    if (typeof mq.removeEventListener === 'function') {
      mq.removeEventListener('change', onMediaChange);
    }
    closeToc();
    toggleBtn.remove();
  };
}
