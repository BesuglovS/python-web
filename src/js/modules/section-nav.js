'use strict';

/**
 * Section navigation module
 * Auto-generates section navigation from headings
 */

import { COMPLEXITY_LABELS } from '../config/courseData.js';
import { isIndexPage } from './utils.js';

export function initSectionNavigation() {
  if (!isIndexPage()) return;

  const currentSection = document.querySelector('.section-nav');
  if (!currentSection) return;

  const sections = document.querySelectorAll('[data-section]');
  const sectionsArray = Array.from(sections);

  let currentActive = 0;

  function updateActiveSection() {
    const scrollPosition = window.scrollY + 100;

    sectionsArray.forEach(function (section, index) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        if (currentActive !== index) {
          currentActive = index;
          updateNavHighlight();
        }
        return;
      }
    });
  }

  function updateNavHighlight() {
    const navLinks = currentSection.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.classList.remove('active');
    });

    if (navLinks[currentActive]) {
      navLinks[currentActive].classList.add('active');
    }
  }

  let scrollTicking = false;

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        updateActiveSection();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  updateActiveSection();
}
