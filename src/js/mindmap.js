'use strict';

function initMindmap() {
  const mmContainer = document.getElementById('mm-container');
  if (!mmContainer) return;
  const sectionIcons = ['📖', '📚', '🔀', '🔁', '🔤', '🔄', '⚙️', '🗂️', 'λ', '💾', '🧰', '🏗️', '🚀', '🌐'];

  fetch('lessons.json')
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (data) {
      const sections = data.sections;
      if (!sections || !sections.length) throw new Error('No sections');

      const fragment = document.createDocumentFragment();

      sections.forEach(function (section, idx) {
        const icon = sectionIcons[idx] || '📖';
        const lessons = section.lessons;
        if (!lessons || !lessons.length) return;

        const firstNum = lessons[0].num;
        const lastNum = lessons[lessons.length - 1].num;
        const range = firstNum === lastNum ? 'урок ' + firstNum : 'уроки ' + firstNum + '–' + lastNum;

        const stage = document.createElement('div');
        stage.className = 'mm-stage';

        const h2 = document.createElement('h2');
        h2.textContent = icon + ' ' + section.title + ' (' + range + ')';
        stage.appendChild(h2);

        for (let i = 0; i < lessons.length; i += 3) {
          const row = lessons.slice(i, i + 3);
          const rowDiv = document.createElement('div');
          rowDiv.className = 'mm-row';
          if (i > 0) rowDiv.style.marginTop = '12px';

          for (let j = 0; j < row.length; j++) {
            const lesson = row[j];
            if (j > 0) {
              const arrow = document.createElement('span');
              arrow.className = 'mm-arrow';
              arrow.textContent = '→';
              rowDiv.appendChild(arrow);
            }
            const a = document.createElement('a');
            a.href = lesson.file;
            a.className = 'mm-node';
            const numSpan = document.createElement('span');
            numSpan.className = 'num';
            numSpan.textContent = String(lesson.num);
            a.appendChild(numSpan);
            const titleDiv = document.createElement('div');
            titleDiv.className = 'title';
            titleDiv.textContent = lesson.title;
            a.appendChild(titleDiv);
            const descDiv = document.createElement('div');
            descDiv.className = 'desc';
            descDiv.textContent = lesson.desc || '';
            a.appendChild(descDiv);
            rowDiv.appendChild(a);
          }

          stage.appendChild(rowDiv);
        }

        fragment.appendChild(stage);
      });

      // Final stage
      const finalStage = document.createElement('div');
      finalStage.className = 'mm-stage';
      const finalH2 = document.createElement('h2');
      finalH2.textContent = '🏁 Финальный этап';
      finalStage.appendChild(finalH2);

      const finalRow = document.createElement('div');
      finalRow.className = 'mm-row';

      const testLink = document.createElement('a');
      testLink.href = 'final-test.html';
      testLink.className = 'mm-node';
      const testNum = document.createElement('span');
      testNum.className = 'num';
      testNum.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
      testNum.textContent = '🏆';
      testLink.appendChild(testNum);
      const testTitle = document.createElement('div');
      testTitle.className = 'title';
      testTitle.textContent = 'Итоговый тест';
      testLink.appendChild(testTitle);
      const testDesc = document.createElement('div');
      testDesc.className = 'desc';
      testDesc.textContent = 'Проверка знаний';
      testLink.appendChild(testDesc);
      finalRow.appendChild(testLink);

      const arrowEl = document.createElement('span');
      arrowEl.className = 'mm-arrow';
      arrowEl.textContent = '→';
      finalRow.appendChild(arrowEl);

      const cheatLink = document.createElement('a');
      cheatLink.href = 'cheatsheets.html';
      cheatLink.className = 'mm-node';
      const cheatNum = document.createElement('span');
      cheatNum.className = 'num';
      cheatNum.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      cheatNum.textContent = '📋';
      cheatLink.appendChild(cheatNum);
      const cheatTitle = document.createElement('div');
      cheatTitle.className = 'title';
      cheatTitle.textContent = 'Шпаргалки';
      cheatLink.appendChild(cheatTitle);
      const cheatDesc = document.createElement('div');
      cheatDesc.className = 'desc';
      cheatDesc.textContent = 'Краткие конспекты';
      cheatLink.appendChild(cheatDesc);
      finalRow.appendChild(cheatLink);

      finalStage.appendChild(finalRow);
      fragment.appendChild(finalStage);

      mmContainer.textContent = '';
      mmContainer.appendChild(fragment);
    })
    .catch(function (err) {
      mmContainer.textContent = '';
      const p = document.createElement('p');
      p.style.cssText = 'text-align:center;color:red;padding:40px;';
      p.textContent = '⚠️ Не удалось загрузить карту курса: ' + err.message;
      mmContainer.appendChild(p);
    });
}

document.addEventListener('DOMContentLoaded', initMindmap);
