'use strict';

/**
 * Section navigation module - builds dynamic navigation from lessons.json
 */

import { fetchLessonsData, createMetaInfo, createContestBadge } from './utils.js';

/**
 * Initialize section navigation on index page
 */
export function initSectionNavigation() {
  const pageName = window.location.pathname.split('/').pop() || '';
  if (pageName && pageName !== 'index.html' && pageName !== '') return;

  const mainContent = document.querySelector('#main-content,main') || document.querySelector('nav');
  if (!mainContent || mainContent.querySelector('.section-group')) return;

  fetchLessonsData()
    .then(function (data) {
      buildSectionNav(mainContent, data);
    })
    .catch(function () {
      console.warn('lessons.json not available — nav stays static');
    });

  function buildSectionNav(container, data) {
    const sections = data.sections;
    if (!sections || !sections.length) return;

    // Section anchor nav
    const anchorNav = document.createElement('nav');
    anchorNav.className = 'section-anchor-nav';
    anchorNav.setAttribute('aria-label', 'Быстрая навигация по разделам');
    container.parentNode.insertBefore(anchorNav, container);

    sections.forEach(function (section) {
      const sectionId = 'section-' + section.id;
      const sectionGroup = document.createElement('div');
      sectionGroup.className = 'section-group';
      sectionGroup.setAttribute('data-section', section.id);
      sectionGroup.id = sectionId;

      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'section-cards';

      section.lessons.forEach(function (lesson) {
        const card = document.createElement('a');
        card.href = lesson.file;
        card.className = 'topic-card';
        card.setAttribute('data-lesson', lesson.num);

        const numDiv = document.createElement('div');
        numDiv.className = 'topic-num';
        numDiv.textContent = lesson.num;
        card.appendChild(numDiv);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'topic-info';

        const h2 = document.createElement('h2');
        h2.textContent = lesson.title;
        infoDiv.appendChild(h2);

        const p = document.createElement('p');
        p.textContent = lesson.desc;
        infoDiv.appendChild(p);

        if (typeof COMPLEXITY_LABELS !== 'undefined') {
          const metaDiv = createMetaInfo(lesson.duration, lesson.complexity);
          if (metaDiv) infoDiv.appendChild(metaDiv);
        }

        card.appendChild(infoDiv);

        // Contest badge
        const lessonBadge = createContestBadge(lesson.num);
        if (lessonBadge) card.appendChild(lessonBadge);

        cardsContainer.appendChild(card);
      });

      sectionGroup.appendChild(cardsContainer);
      container.appendChild(sectionGroup);

      // Anchor link
      const anchor = document.createElement('a');
      anchor.href = '#' + sectionId;
      anchor.textContent = section.title;
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
      anchorNav.appendChild(anchor);
    });

    // IntersectionObserver for active section highlighting
    if ('IntersectionObserver' in window) {
      const anchorLinks = anchorNav.querySelectorAll('a');
      const sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            const id = entry.target.id;
            const link = anchorNav.querySelector('a[href="#' + id + '"]');
            if (link && entry.isIntersecting) {
              anchorLinks.forEach(function (a) {
                a.classList.remove('active');
              });
              link.classList.add('active');
            }
          });
        },
        { rootMargin: '-20% 0px -70% 0px' },
      );

      container.querySelectorAll('.section-group[id]').forEach(function (group) {
        sectionObserver.observe(group);
      });
    }

    // Final section
    const finalGroup = document.createElement('div');
    finalGroup.className = 'section-group';
    finalGroup.setAttribute('data-section', 'final');

    const finalTitle = document.createElement('h2');
    finalTitle.className = 'section-title';
    finalTitle.textContent = '🏁 Итоги';
    finalGroup.appendChild(finalTitle);

    const finalCards = document.createElement('div');
    finalCards.className = 'section-cards';

    // Final test card
    const finalTestLink = document.createElement('a');
    finalTestLink.href = 'final-test.html';
    finalTestLink.className = 'topic-card';
    finalTestLink.setAttribute('data-lesson', 'final-test');
    const finalNum = document.createElement('div');
    finalNum.className = 'topic-num';
    finalNum.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    finalNum.textContent = '🏆';
    finalTestLink.appendChild(finalNum);
    const finalInfo = document.createElement('div');
    finalInfo.className = 'topic-info';
    const finalH2 = document.createElement('h2');
    finalH2.textContent = 'Итоговый тест';
    finalInfo.appendChild(finalH2);
    const finalP = document.createElement('p');
    finalP.textContent = 'Проверка знаний по всем темам';
    finalInfo.appendChild(finalP);
    finalTestLink.appendChild(finalInfo);
    finalCards.appendChild(finalTestLink);

    // REPL card
    const replLink = document.createElement('a');
    replLink.href = 'repl.html';
    replLink.className = 'topic-card';
    replLink.style.borderColor = 'var(--primary)';
    const replNum = document.createElement('div');
    replNum.className = 'topic-num';
    replNum.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    replNum.textContent = '▶';
    replLink.appendChild(replNum);
    const replInfo = document.createElement('div');
    replInfo.className = 'topic-info';
    const replH2 = document.createElement('h2');
    replH2.textContent = 'Python REPL — Интерактивная консоль';
    replInfo.appendChild(replH2);
    const replP = document.createElement('p');
    replP.textContent = 'Пиши код и сразу видь результат';
    replInfo.appendChild(replP);
    replLink.appendChild(replInfo);
    finalCards.appendChild(replLink);

    finalGroup.appendChild(finalCards);
    container.appendChild(finalGroup);

    // Add missing contest badges to any cards that were already present
    const existingCards = container.querySelectorAll('.topic-card[data-lesson]');
    for (let i = 0; i < existingCards.length; i++) {
      const card = existingCards[i];
      const num = parseInt(card.getAttribute('data-lesson'));
      if (num && !isNaN(num) && !card.querySelector('.contest-badge')) {
        const badge = createContestBadge(num);
        if (badge) card.appendChild(badge);
      }
    }
  }
}
