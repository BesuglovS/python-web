'use strict';

/**
 * Lesson metadata display module
 */

export function initLessonMetadata() {
  if (document.querySelector('.lesson-meta-info')) return;
  const lessonNum = parseInt(document.body.getAttribute('data-lesson'), 10);
  if (isNaN(lessonNum)) return;
  if (typeof LESSON_META === 'undefined' || typeof COMPLEXITY_LABELS === 'undefined') return;
  const meta = LESSON_META[lessonNum];
  if (!meta) return;
  const header = document.querySelector('.topic-header');
  if (!header) return;
  const subtitle = header.querySelector('.subtitle') || header.querySelector('h1');
  if (!subtitle) return;
  const infoDiv = document.createElement('div');
  infoDiv.className = 'lesson-meta-info';
  const label = COMPLEXITY_LABELS[meta.complexity] || meta.complexity;

  const durationSpan = document.createElement('span');
  durationSpan.className = 'meta-duration';
  durationSpan.textContent = '⏱ ~' + meta.duration + ' мин чтения';
  infoDiv.appendChild(durationSpan);

  infoDiv.appendChild(document.createTextNode(' '));

  const sepSpan = document.createElement('span');
  sepSpan.className = 'meta-sep';
  sepSpan.textContent = '·';
  infoDiv.appendChild(sepSpan);

  infoDiv.appendChild(document.createTextNode(' '));

  const complexitySpan = document.createElement('span');
  complexitySpan.className = 'meta-complexity';
  complexitySpan.setAttribute('data-level', meta.complexity);
  complexitySpan.textContent = label;
  infoDiv.appendChild(complexitySpan);

  subtitle.insertAdjacentElement('afterend', infoDiv);
}
