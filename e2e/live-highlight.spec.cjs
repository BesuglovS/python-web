'use strict';

const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('**/sandbox/auth_check.php', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        user: { username: 'e2e', display_name: 'E2E Тест' },
      }),
    })
  );
});

test.describe('Живая подсветка при редактировании', () => {
  test('Enter после комментария: новая строка подсвечивается и не наследует комментарий', async ({
    page,
  }) => {
    await page.goto('/22-functions.html');

    const wrapper = page
      .locator('main .code-wrapper')
      .filter({ hasText: 'print(do_nothing())  # None' });

    // Исходная подсветка применена (последний комментарий — # None)
    await expect(wrapper.locator('pre .hljs-comment').last()).toHaveText('# None');

    // Входим в режим редактирования
    await wrapper.locator('.edit-btn').click();

    // Ставим каретку в конец последнего комментария
    await wrapper.locator('pre').evaluate((pre) => {
      pre.focus();
      const comments = pre.querySelectorAll('.hljs-comment');
      const comment = comments[comments.length - 1];
      const range = document.createRange();
      range.setStart(comment.firstChild, comment.firstChild.length);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // Enter + новая строка кода
    await page.keyboard.press('Enter');
    await page.keyboard.type("print('Hello')");

    // Ждём дебаунс живой переподсветки (~150 мс)
    await page.waitForTimeout(500);

    // Во время редактирования новая строка уже подсвечена как строка, не комментарий
    const live = await wrapper.locator('pre').evaluate((pre) => {
      const code = pre.querySelector('code') || pre;
      const helloSpan = Array.from(code.querySelectorAll('span')).find((s) =>
        (s.textContent || '').includes("'Hello'")
      );
      const text = code.textContent || '';
      return {
        hasHello: text.includes("print('Hello')"),
        hasZws: text.includes('\u200B'),
        helloClass: helloSpan ? helloSpan.className : null,
        codeCount: pre.querySelectorAll('code').length,
      };
    });
    expect(live.hasHello).toBe(true);
    expect(live.hasZws).toBe(false);
    expect(live.codeCount).toBe(1);
    expect(live.helloClass).toContain('hljs-string');
    expect(live.helloClass).not.toContain('hljs-comment');

    // Завершаем редактирование
    await wrapper.locator('.edit-btn').click();

    const done = await wrapper.locator('pre').evaluate((pre) => {
      const code = pre.querySelector('code') || pre;
      const text = code.textContent || '';
      return {
        hasHello: text.includes("print('Hello')"),
        hasZws: text.includes('\u200B'),
        codeCount: pre.querySelectorAll('code').length,
        spans: code.querySelectorAll('span').length,
      };
    });
    expect(done.hasHello).toBe(true);
    expect(done.hasZws).toBe(false);
    expect(done.codeCount).toBe(1);
    expect(done.spans).toBeGreaterThan(0);
  });
});