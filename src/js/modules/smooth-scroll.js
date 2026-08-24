'use strict';

/**
 * Smooth scroll for anchor links
 * Handles smooth scrolling for internal page links
 */

export function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    let target = null;
    try {
      target = document.querySelector(href);
    } catch (_e) {
      target = document.getElementById(href.slice(1));
    }
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}
