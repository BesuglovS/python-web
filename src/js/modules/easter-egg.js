'use strict';

import { claimEasterEgg } from './api-client.js';

/**
 * Пасхалка «Секретный урок 51».
 *
 * По Konami-коду (↑ ↑ ↓ ↓ ← → ← → B A) на любой странице курса показывает
 * оверлей и начисляет скрытый бейдж `secret_51` через `sandbox/badges.php`.
 *
 * Раскладка не важна: используются физические клавиши (`event.code`),
 * `keyCode` оставлен как запасной вариант для старых браузеров.
 */

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

const LEGACY_KEYS = {
  38: 'ArrowUp',
  40: 'ArrowDown',
  37: 'ArrowLeft',
  39: 'ArrowRight',
  66: 'KeyB',
  65: 'KeyA',
};

let _initialized = false;
let _pos = 0;

function keyName(event) {
  if (event.code) return event.code;
  const legacy = event.keyCode || event.which;
  return LEGACY_KEYS[legacy] || '';
}

function openEgg() {
  if (document.getElementById('ee51')) return;

  const overlay = document.createElement('div');
  overlay.id = 'ee51';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Секретный урок 51');

  const card = document.createElement('div');
  card.className = 'ee51-card';

  const egg = document.createElement('div');
  egg.className = 'ee51-egg';
  egg.setAttribute('aria-hidden', 'true');
  egg.textContent = '🥚';

  const title = document.createElement('h2');
  title.textContent = 'Секретный урок 51';

  const text = document.createElement('p');
  text.appendChild(
    document.createTextNode('Ты ввёл древний код и нашёл пасхалку Академии Наяновой!'),
  );
  text.appendChild(document.createElement('br'));
  text.appendChild(
    document.createTextNode('Достижение «Секретный урок 51» добавлено в твой профиль.'),
  );
  text.appendChild(document.createElement('br'));

  const hint = document.createElement('small');
  hint.textContent = 'P.S. Настоящие хакеры не ломают, а защищают. 🐍';
  text.appendChild(hint);
  text.appendChild(document.createElement('br'));

  const author = document.createElement('small');
  author.textContent = 'by yarik ❤️🦔🐭';
  text.appendChild(author);

  const button = document.createElement('button');
  button.id = 'ee51-close';
  button.type = 'button';
  button.textContent = 'Продолжить обучение →';
  button.addEventListener('click', function () {
    overlay.remove();
  });

  card.appendChild(egg);
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(button);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Бейдж начисляется на сервере; при ошибке сети начислится при следующем
  // нахождении пасхалки — оверлей всё равно показывается.
  claimEasterEgg().catch(function () {});
}

/**
 * Инициализирует обработчик Konami-кода. Вызывается один раз при старте.
 * @returns {void}
 */
export function initEasterEgg() {
  if (_initialized) return;
  _initialized = true;

  document.addEventListener('keydown', function (event) {
    const name = keyName(event);
    if (name === KONAMI[_pos]) {
      _pos += 1;
      if (_pos === KONAMI.length) {
        _pos = 0;
        openEgg();
      }
    } else {
      _pos = name === KONAMI[0] ? 1 : 0;
    }
  });
}
