'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const printBtn = document.getElementById('cheatsheets-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }
});
