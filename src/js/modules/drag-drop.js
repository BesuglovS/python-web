'use strict';

/**
 * Drag-and-drop interactive exercise module
 * Provides code ordering and matching exercises for lessons
 */

import { safeGetItem, safeSetItem } from '../config/security.js';

const DRAG_DROP_STORAGE_KEY = 'python-web-dragdrop-completed';

export function initDragDropExercises() {
  const exerciseEls = document.querySelectorAll('[data-drag-drop]');
  if (!exerciseEls.length) return;

  exerciseEls.forEach(function (container) {
    const type = container.getAttribute('data-drag-drop');
    if (type === 'order') {
      initOrderExercise(container);
    } else if (type === 'match') {
      initMatchExercise(container);
    }
  });
}

function initOrderExercise(container) {
  const items = container.querySelectorAll('.drag-item');
  if (items.length < 2) return;

  let dragSrcEl = null;

  items.forEach(function (item) {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', function (e) {
      dragSrcEl = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    item.addEventListener('dragend', function () {
      item.classList.remove('dragging');
      container.querySelectorAll('.drag-item').forEach(function (el) {
        el.classList.remove('drag-over');
      });
    });

    item.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function () {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', function (e) {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (dragSrcEl !== item) {
        const allItems = Array.from(container.querySelectorAll('.drag-item'));
        const srcIdx = allItems.indexOf(dragSrcEl);
        const dstIdx = allItems.indexOf(item);
        if (srcIdx < dstIdx) {
          container.insertBefore(dragSrcEl, item.nextSibling);
        } else {
          container.insertBefore(dragSrcEl, item);
        }
      }
    });

    item.addEventListener('touchstart', function () {
      dragSrcEl = item;
      item.classList.add('dragging');
    }, { passive: true });

    item.addEventListener('touchmove', function (e) {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains('drag-item') && target !== dragSrcEl) {
        container.querySelectorAll('.drag-item').forEach(function (el) {
          el.classList.remove('drag-over');
        });
        target.classList.add('drag-over');
      }
    }, { passive: false });

    item.addEventListener('touchend', function (e) {
      item.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains('drag-item') && target !== dragSrcEl) {
        const allItems = Array.from(container.querySelectorAll('.drag-item'));
        const srcIdx = allItems.indexOf(dragSrcEl);
        const dstIdx = allItems.indexOf(target);
        if (srcIdx < dstIdx) {
          container.insertBefore(dragSrcEl, target.nextSibling);
        } else {
          container.insertBefore(dragSrcEl, target);
        }
      }
      container.querySelectorAll('.drag-item').forEach(function (el) {
        el.classList.remove('drag-over');
      });
    });
  });

  const checkBtn = container.querySelector('.drag-check-btn');
  if (checkBtn) {
    checkBtn.addEventListener('click', function () {
      checkOrderExercise(container);
    });
  }
}

function initMatchExercise(container) {
  const pairs = container.querySelectorAll('.match-pair');
  if (pairs.length < 2) return;

  let selectedEl = null;

  pairs.forEach(function (pair) {
    pair.addEventListener('click', function () {
      if (pair.classList.contains('matched') || pair.classList.contains('incorrect-match')) return;

      if (!selectedEl) {
        selectedEl = pair;
        pair.classList.add('selected');
      } else {
        if (selectedEl === pair) {
          pair.classList.remove('selected');
          selectedEl = null;
          return;
        }

        const val1 = selectedEl.getAttribute('data-match-value');
        const val2 = pair.getAttribute('data-match-value');

        if (val1 === val2) {
          selectedEl.classList.remove('selected');
          selectedEl.classList.add('matched');
          pair.classList.add('matched');
        } else {
          selectedEl.classList.remove('selected');
          selectedEl.classList.add('incorrect-match');
          pair.classList.add('incorrect-match');
          setTimeout(function () {
            selectedEl.classList.remove('incorrect-match');
            pair.classList.remove('incorrect-match');
          }, 800);
        }
        selectedEl = null;
      }
    });
  });
}

function checkOrderExercise(container) {
  const items = container.querySelectorAll('.drag-item');
  let correct = true;

  items.forEach(function (item, idx) {
    const expected = parseInt(item.getAttribute('data-correct-order'), 10);
    if (expected !== idx) {
      correct = false;
      item.classList.add('incorrect');
    } else {
      item.classList.remove('incorrect');
      item.classList.add('correct');
    }
  });

  const feedback = container.querySelector('.drag-feedback');
  if (feedback) {
    if (correct) {
      feedback.textContent = 'Правильно! Порядок верный.';
      feedback.className = 'drag-feedback correct';
      markDragDropCompleted();
    } else {
      feedback.textContent = 'Порядок неверный. Попробуйте ещё раз.';
      feedback.className = 'drag-feedback incorrect';
    }
  }
}

function tryParseDragDropData(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_e) {
    return {};
  }
}

function markDragDropCompleted() {
  const lessonId = document.body.getAttribute('data-lesson');
  if (!lessonId) return;

  try {
    const completed = tryParseDragDropData(safeGetItem(DRAG_DROP_STORAGE_KEY));
    if (!completed[lessonId]) {
      completed[lessonId] = Date.now();
      safeSetItem(DRAG_DROP_STORAGE_KEY, JSON.stringify(completed));
    }
  } catch (_e) {
    console.warn('Failed to save drag-drop progress');
  }
}
