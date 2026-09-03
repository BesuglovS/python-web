'use strict';

const LESSONS = [
  {num:1,title:'1. История'},{num:2,title:'2. IDE'},{num:3,title:'3. Переменные'},
  {num:4,title:'4. Типы данных'},{num:5,title:'5. Приведение типов'},{num:6,title:'6. Ввод/вывод'},
  {num:7,title:'7. f-строки'},{num:8,title:'8. Числа'},{num:9,title:'9. Булевы'},
  {num:10,title:'10. Условия'},{num:11,title:'11. try/except'},{num:12,title:'12. Сложные условия'},
  {num:13,title:'13. Вложенные структуры'},{num:14,title:'14. Строки: индексы'},
  {num:15,title:'15. Операции строками'},{num:16,title:'16. Regex'},{num:17,title:'17. while'},
  {num:18,title:'18. for'},{num:19,title:'19. range()'},{num:20,title:'20. break/continue'},
  {num:21,title:'21. Вложенные циклы'},{num:22,title:'22. Функции'},{num:23,title:'23. Функции: продвинутые'},
  {num:24,title:'24. Отладка'},{num:25,title:'25. Списки'},{num:26,title:'26. Множества'},
  {num:27,title:'27. Кортежи'},{num:28,title:'28. Словари'},{num:29,title:'29. split/join'},
  {num:30,title:'30. List comprehension'},{num:31,title:'31. Lambda'},{num:32,title:'32. Файлы'},
  {num:33,title:'33. JSON/CSV'},{num:34,title:'34. SQLite'},{num:35,title:'35. Модули'},
  {num:36,title:'36. itertools'},{num:37,title:'37. venv/pip'},{num:38,title:'38. math/random'},
  {num:39,title:'39. datetime'},{num:40,title:'40. NumPy/Pandas'},{num:41,title:'41. ООП: введение'},
  {num:42,title:'42. Наследование'},{num:43,title:'43. Декораторы'},{num:44,title:'44. Генераторы'},
  {num:45,title:'45. Многопоточность'},{num:46,title:'46. Type Hints'},{num:47,title:'47. pytest'},
  {num:48,title:'48. Requests/API'},{num:49,title:'49. Flask'},{num:50,title:'50. Git'}
];

const groupSelect = document.getElementById('group-select');
const lessonFrom = document.getElementById('lesson-from');
const lessonTo = document.getElementById('lesson-to');
const loadBtn = document.getElementById('load-btn');
const statusEl = document.getElementById('status');
const tableContainer = document.getElementById('table-container');

function populateLessonSelects() {
  let html = '';
  LESSONS.forEach(function(l) {
    html += '<option value="' + l.num + '">' + l.title + '</option>';
  });
  html += '<option value="-1">Итоговый тест</option>';
  lessonFrom.innerHTML = html;
  lessonTo.innerHTML = html;
  lessonFrom.value = '1';
  lessonTo.value = '50';
}
populateLessonSelects();

function apiGet(url) {
  return fetch(url, {credentials: 'include'})
    .then(function(r) { return r.ok ? r.json() : null; })
    .catch(function() { return null; });
}

function checkAuth() {
  return apiGet('/sandbox/auth_check.php').then(function(data) {
    if (!data || !data.authenticated) {
      statusEl.innerHTML = '<span class="error">Требуется авторизация. <a href="https://auth.nayanovaacademy.ru/index.php?page=login&redirect=' + encodeURIComponent(window.location.href) + '">Войти</a></span>';
      loadBtn.disabled = true;
      return null;
    }
    if (!data.user || !data.user.is_admin) {
      statusEl.innerHTML = '<span class="error">Доступ запрещён — требуются права администратора</span>';
      loadBtn.disabled = true;
      return null;
    }
    return data;
  });
}

function loadGroups() {
  apiGet('/sandbox/admin_quiz.php?action=groups').then(function(data) {
    if (!data || !data.groups || !data.groups.length) {
      groupSelect.innerHTML = '<option value="">Нет классов</option>';
      return;
    }
    let html = '<option value="">Выберите класс</option>';
    data.groups.forEach(function(g) {
      html += '<option value="' + g.id + '">' + (g.name || 'Класс #' + g.id) + '</option>';
    });
    groupSelect.innerHTML = html;
  });
}

checkAuth().then(function(auth) {
  if (auth) loadGroups();
});

function scoreClass(score) {
  if (score === null || score === undefined) return 'score-none';
  if (score === 100) return 'score-100';
  if (score > 0) return 'score-high';
  return 'score-zero';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return dd + '.' + mm + '.' + d.getFullYear() + ' ' + hh + ':' + mi;
}

function getLessonRange() {
  let from = parseInt(lessonFrom.value, 10);
  let to = parseInt(lessonTo.value, 10);
  if (isNaN(from)) from = 1;
  if (isNaN(to)) to = 50;
  const includeFinal = (from === -1 || to === -1);
  if (from === -1) from = 1;
  if (to === -1) to = 50;
  if (from > to) { const tmp = from; from = to; to = tmp; }
  const range = [];
  for (let i = from; i <= to; i++) range.push(i);
  if (includeFinal) range.push(-1);
  return range;
}

function buildAttemptsHtml(attempts) {
  if (!attempts || !attempts.length) return '<div style="color:#999;padding:4px 0">Нет попыток</div>';
  let html = '';
  attempts.forEach(function(a) {
    let answersInfo = '';
    if (a.answers && a.answers.length) {
      const wrong = a.answers.filter(function(x) { return !x.is_correct; }).length;
      answersInfo = ' | Ошибок: ' + wrong;
    }
    html += '<div class="attempt-row">' +
      '<span class="attempt-score ' + scoreClass(a.score) + '">' + a.score + '%</span>' +
      '<span class="attempt-detail">' + a.correct_count + '/' + a.total_questions + answersInfo + '</span>' +
      '<span class="attempt-time">' + formatDate(a.attempted_at) + '</span>' +
    '</div>';
  });
  return html;
}

loadBtn.addEventListener('click', function() {
  const groupId = groupSelect.value;
  if (!groupId) {
    statusEl.innerHTML = '<span class="error">Выберите класс</span>';
    return;
  }

  statusEl.textContent = 'Загрузка...';
  tableContainer.style.display = 'none';
  loadBtn.disabled = true;

  apiGet('/sandbox/admin_quiz.php?action=class_progress&group_id=' + groupId)
    .then(function(data) {
      if (!data || !data.students) {
        statusEl.innerHTML = '<span class="error">Ошибка загрузки данных</span>';
        loadBtn.disabled = false;
        return;
      }

      const maxLesson = data.max_lesson_with_quizzes || 50;
      lessonTo.value = String(maxLesson);

      const range = getLessonRange();
      const students = data.students;

      if (!students.length) {
        statusEl.textContent = 'Нет учеников в этом классе';
        loadBtn.disabled = false;
        return;
      }

      let html = '<table><thead><tr><th class="student-name">Ученик</th>';
      range.forEach(function(n) {
        const label = n === -1 ? 'Итог' : String(n);
        html += '<th class="lesson-header" title="' + (n === -1 ? 'Итоговый тест' : 'Урок ' + n) + '">' + label + '</th>';
      });
      html += '<th>Уроков</th></tr></thead><tbody>';

      students.forEach(function(s) {
        html += '<tr><td class="student-name">' + escapeHtml(s.name) + '</td>';
        let completedCount = 0;
        range.forEach(function(n) {
          const lesson = s.lessons[n] || {};
          const score = lesson.quiz_score !== undefined ? lesson.quiz_score : null;
          const completed = score === 100;
          if (completed) completedCount++;

          const cls = scoreClass(score);
          const display = score !== null ? String(score) : '—';
          const cellId = 'cell-' + s.id + '-' + n;

          html += '<td class="score ' + cls + '" data-user="' + s.id + '" data-lesson="' + n + '" id="' + cellId + '" title="' +
            (score !== null ? 'Лучший балл: ' + score + '%' : 'Нет данных') +
            '">' + display + '</td>';
        });
        html += '<td style="font-weight:600">' + completedCount + '/' + range.length + '</td>';
        html += '</tr>';
      });

      html += '</tbody></table>';
      html += '<div id="attempts-container"></div>';

      tableContainer.innerHTML = html;
      tableContainer.style.display = 'block';
      statusEl.textContent = 'Класс: ' + groupSelect.options[groupSelect.selectedIndex].text +
        ' | Учеников: ' + students.length;
      loadBtn.disabled = false;

      const cells = tableContainer.querySelectorAll('td.score');
      cells.forEach(function(cell) {
        cell.addEventListener('click', function() {
          const uid = cell.getAttribute('data-user');
          const lessonNum = parseInt(cell.getAttribute('data-lesson'), 10);
          showAttempts(uid, lessonNum, cell);
        });
      });
    })
    .catch(function() {
      statusEl.innerHTML = '<span class="error">Ошибка сети</span>';
      loadBtn.disabled = false;
    });
});

function showAttempts(userId, lessonNum, anchorCell) {
  const container = document.getElementById('attempts-container');
  const existingId = 'attempts-' + userId + '-' + lessonNum;
  const existing = document.getElementById(existingId);
  if (existing) {
    existing.classList.toggle('open');
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'attempts-panel open';
  panel.id = existingId;

  const lessonLabel = lessonNum === -1 ? 'Итоговый тест' : 'Урок ' + lessonNum;
  const studentName = anchorCell.parentElement.querySelector('.student-name').textContent;
  panel.innerHTML = '<h4>' + escapeHtml(studentName) + ' — ' + lessonLabel + ': попытки</h4><div style="color:#888">Загрузка...</div>';

  container.innerHTML = '';
  container.appendChild(panel);

  apiGet('/sandbox/admin_quiz.php?action=attempts&user_id=' + userId + '&lesson_number=' + lessonNum)
    .then(function(data) {
      if (!data || !data.attempts) {
        panel.innerHTML = '<h4>' + escapeHtml(studentName) + ' — ' + lessonLabel + '</h4><div style="color:#c0392b">Ошибка загрузки</div>';
        return;
      }
      let html = '<h4>' + escapeHtml(studentName) + ' — ' + lessonLabel + ': попытки (' + data.attempts.length + ')</h4>';
      html += buildAttemptsHtml(data.attempts);
      panel.innerHTML = html;
    });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
