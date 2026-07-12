'use strict';

/**
 * Table of Contents generation module
 * Generates dynamic table of contents from page headings
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
      document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth' });
    });
    li.appendChild(a);
    list.appendChild(li);
  });

  tocEl.appendChild(list);

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

  // Disconnect on page unload to prevent memory leaks
  window.addEventListener('beforeunload', function () {
    observer.disconnect();
  });
}