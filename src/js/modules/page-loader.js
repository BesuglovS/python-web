'use strict';

/**
 * Page loader progress bar module
 */

export function initPageLoader() {
  let loaderBar = null;

  function getBar() {
    if (!loaderBar) {
      loaderBar = document.createElement('div');
      loaderBar.className = 'page-loader-bar';
      document.body.appendChild(loaderBar);
    }
    return loaderBar;
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (
      link &&
      link.href &&
      '#' !== link.getAttribute('href').charAt(0) &&
      link.hostname === window.location.hostname &&
      !link.hasAttribute('download') &&
      ('noopener noreferrer' !== link.getAttribute('rel') || '_blank' !== link.target) &&
      0 !== link.href.indexOf('mailto:') &&
      0 !== link.href.indexOf('tel:')
    ) {
      const bar = getBar();
      bar.classList.remove('done', 'hide');
      bar.style.width = '0%';
      requestAnimationFrame(function () {
        bar.classList.add('running');
        bar.style.width = '40%';
      });
    }
  });

  let progress = 40;
  let loaderTimer = null;
  let loaderStopped = false;
  (function tickLoader() {
    if (loaderStopped) return;
    if (loaderBar && loaderBar.classList.contains('running')) {
      progress = Math.min(progress + (10 * Math.random() + 2), 85);
      loaderBar.style.width = progress + '%';
    }
    loaderTimer = setTimeout(tickLoader, 400);
  })();

  window.addEventListener('load', function () {
    loaderStopped = true;
    if (loaderTimer) clearTimeout(loaderTimer);
    const bar = getBar();
    if (bar.classList.contains('running') || '0%' !== bar.style.width) {
      bar.classList.remove('running');
      bar.classList.add('done');
      bar.style.width = '100%';
      setTimeout(function () {
        bar.classList.add('hide');
      }, 200);
    }
  });
}
