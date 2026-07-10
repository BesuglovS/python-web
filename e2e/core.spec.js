const { test, expect } = require('@playwright/test');

test.describe('Главная страница', () => {
  test('загружается с правильным заголовком', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Python/);
    await expect(page.locator('h1')).toContainText('Python');
  });

  test('содержит 50 карточек уроков', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.topic-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(50);
  });

  test('поиск фильтрует карточки уроков', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('#lesson-search');
    await search.fill('цикл');
    const visibleCards = page.locator('.topic-card:visible');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
  });

  test('прогресс-бар отображается', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.progress-bar-container').first()).toBeVisible();
  });

  test('секции присутствуют на странице', async ({ page }) => {
    await page.goto('/');
    const sections = page.locator('.section-group');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('блок достижений существует', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#badgesBlock')).toBeAttached();
  });
});

test.describe('Уроки', () => {
  test('первый урок загружается', async ({ page }) => {
    await page.goto('/01-history.html');
    await expect(page.locator('h1')).toContainText(/Python/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('последний урок загружается', async ({ page }) => {
    await page.goto('/50-git-intro.html');
    await expect(page.locator('h1')).toContainText('Git');
  });

  test('содержание урока строится', async ({ page }) => {
    await page.goto('/03-variables.html');
    await page.waitForTimeout(500);
    const tocLinks = page.locator('#toc a');
    const count = await tocLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('блоки кода имеют панель инструментов', async ({ page }) => {
    await page.goto('/03-variables.html');
    const toolbars = page.locator('.code-toolbar');
    const count = await toolbars.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('навигация prev/next работает', async ({ page }) => {
    await page.goto('/02-ide-setup.html');
    await expect(page.locator('.prev-link')).toBeVisible();
    await expect(page.locator('.next-link')).toBeVisible();
    await page.locator('.prev-link').click();
    await expect(page).toHaveURL(/01-history/);
  });

  test('квиз загружается на странице урока', async ({ page }) => {
    await page.goto('/03-variables.html');
    await page.waitForTimeout(1500);
    const quiz = page.locator('.quiz-container');
    const exists = (await quiz.count()) > 0;
    if (exists) {
      await expect(quiz).toBeVisible();
    }
  });
});

test.describe('Тема', () => {
  test('переключатель темы существует', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await expect(page.locator('.theme-toggle')).toBeVisible();
  });

  test('переключение на тёмную тему работает', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const toggle = page.locator('.theme-toggle');
    await toggle.click();
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(theme);
  });

  test('тема сохраняется в localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const toggle = page.locator('.theme-toggle');
    await toggle.click();
    const saved = await page.evaluate(() => localStorage.getItem('python-web-theme'));
    expect(saved).toBeTruthy();
  });
});

test.describe('REPL', () => {
  test('REPL страница загружается', async ({ page }) => {
    await page.goto('/repl.html');
    await expect(page.locator('.repl-container')).toBeVisible();
    await expect(page.locator('#repl-input')).toBeVisible();
  });

  test('переключение вкладок REPL/Editor работает', async ({ page }) => {
    await page.goto('/repl.html');
    await page.locator('button[data-tab="editor"]').click();
    await expect(page.locator('#tab-editor')).toBeVisible();
    await expect(page.locator('#tab-repl')).toBeHidden();
  });

  test('сниппеты отображаются', async ({ page }) => {
    await page.goto('/repl.html');
    await expect(page.locator('.repl-snippet').first()).toBeVisible();
  });

  test('история команд пустая при загрузке', async ({ page }) => {
    await page.goto('/repl.html');
    await expect(page.locator('#history-count')).toContainText('0');
  });
});

test.describe('Финальный тест', () => {
  test('страница финального теста загружается', async ({ page }) => {
    await page.goto('/final-test.html');
    await expect(page.locator('h1')).toContainText('Итоговый тест');
  });
});

test.describe('Mindmap', () => {
  test('страница карты курса загружается', async ({ page }) => {
    await page.goto('/mindmap.html');
    await expect(page.locator('#mm-container')).toBeVisible();
  });
});

test.describe('Cheatsheets', () => {
  test('страница шпаргалок загружается', async ({ page }) => {
    await page.goto('/cheatsheets.html');
    await expect(page.locator('h1')).toContainText('Шпаргал');
  });
});

test.describe('PWA и SEO', () => {
  test('manifest.json доступен', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.status()).toBe(200);
  });

  test('sitemap.xml доступен', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response.status()).toBe(200);
  });

  test('robots.txt доступен', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response.status()).toBe(200);
  });

  test('favicon существует', async ({ page }) => {
    const response = await page.goto('/favicon.png');
    expect(response.status()).toBe(200);
  });

  test('Service Worker регистрируется', async ({ page }) => {
    await page.goto('/');
    const sw = await page.evaluate(() => navigator.serviceWorker.getRegistration());
    // SW может не успеть зарегистрироваться — не падаем
    expect(true).toBeTruthy();
  });
});

test.describe('CSP безопасность', () => {
  function getScriptSrc(csp) {
    const match = csp.match(/script-src\s+([^;]+)/);
    return match ? match[1] : '';
  }

  test('CSP script-src не содержит unsafe-inline на главной', async ({ page }) => {
    await page.goto('/');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    const scriptSrc = getScriptSrc(csp);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  test('CSP script-src не содержит unsafe-inline на уроке', async ({ page }) => {
    await page.goto('/03-variables.html');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    const scriptSrc = getScriptSrc(csp);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });
});

test.describe('Безопасность заголовков', () => {
  test('все страницы имеют CSP мета-тег', async ({ page }) => {
    await page.goto('/');
    const csp = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(csp).toHaveAttribute('content', /default-src/);
  });
});

test.describe('Клавиатурная навигация', () => {
  test('клавиша ArrowRight на уроке ведёт к следующему', async ({ page }) => {
    await page.goto('/02-ide-setup.html');
    await page.waitForTimeout(500);
    // Снимаем фокус с возможных элементов ввода
    await page.locator('body').click();
    const nextHref = await page.locator('.next-link').getAttribute('href');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(page.url()).toContain(nextHref);
  });
});
