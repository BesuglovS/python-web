'use strict';

/**
 * Keyboard navigation (arrow keys for prev/next lesson)
 */

export function initKeyboardNavigation() {
  document.addEventListener('keydown', function (e) {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    )
      return;

    if (e.key === 'ArrowLeft') {
      const prevLink = document.querySelector('.prev-link');
      if (prevLink) window.location.href = prevLink.getAttribute('href');
    } else if (e.key === 'ArrowRight') {
      const nextLink = document.querySelector('.next-link');
      if (nextLink) window.location.href = nextLink.getAttribute('href');
    }
  });
}
