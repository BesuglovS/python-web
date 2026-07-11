'use strict';

/**
 * Search functionality module
 */

/**
 * Initialize search on index page
 */
export function initSearch() {
  const pageName = window.location.pathname.split('/').pop() || '';
  if (pageName && pageName !== 'index.html' && pageName !== '') return;

  const mainContent = document.querySelector('#main-content,main') || document.querySelector('nav');
  if (!mainContent || !mainContent.querySelector('.topic-card')) return;

  let searchInput = document.getElementById('lesson-search');
  if (!searchInput) {
    searchInput = document.createElement('div');
    searchInput.className = 'search-container';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'lesson-search';
    input.className = 'search-input';
    input.placeholder = '🔍 Поиск по темам... (например: цикл, список, функция)';
    input.autocomplete = 'off';
    searchInput.appendChild(input);
    mainContent.parentNode.insertBefore(searchInput, mainContent);
  }

  const input = document.getElementById('lesson-search');
  const cards = mainContent.querySelectorAll('.topic-card');

  input.addEventListener('input', function () {
    const query = input.value.toLowerCase().trim();
    let visibleCount = 0;

    cards.forEach(function (card) {
      const title = (card.querySelector('h2')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const num = (card.querySelector('.topic-num')?.textContent || '').toLowerCase();
      const matches =
        !query || title.includes(query) || desc.includes(query) || num.includes(query);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    let noResults = mainContent.querySelector('.no-results');
    if (visibleCount === 0 && query) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = '? Ничего не найдено. Попробуйте изменить запрос.';
        mainContent.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  });
}
