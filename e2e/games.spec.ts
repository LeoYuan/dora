import { test, expect } from '@playwright/test';

test.describe('Games', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await expect(page.getByText('Dora')).toBeVisible();
  });

  test.describe('Game Panel Navigation', () => {
    test('can open game panel from main menu', async ({ page }) => {
      // Click game button
      await page.getByRole('button', { name: /游戏/ }).click();

      // Verify game panel is open
      await expect(page.getByText('算24点')).toBeVisible();
      await expect(page.getByText('数独')).toBeVisible();
      await expect(page.getByText('扫雷')).toBeVisible();
    });

    test('can switch between games', async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();

      // Switch to Sudoku
      await page.getByRole('button', { name: '数独' }).click();
      await expect(page.getByText('时间:', { exact: false })).toBeVisible();

      // Switch to Minesweeper
      await page.getByRole('button', { name: '扫雷' }).click();
      await expect(page.getByText('剩余:')).toBeVisible();

      // Switch back to 24
      await page.getByRole('button', { name: '算24点' }).click();
      await expect(page.getByPlaceholder(/输入算式/)).toBeVisible();
    });

    test('can close game panel', async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await expect(page.getByText('算24点')).toBeVisible();

      // Click close button
      await page.getByLabel(/Close game panel/).click();

      // Verify back to main menu
      await expect(page.getByRole('button', { name: /开始聊天/ })).toBeVisible();
    });
  });

  test.describe('24 Game', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await page.getByRole('button', { name: '算24点' }).click();
    });

    test('displays game elements', async ({ page }) => {
      await expect(page.getByText('算 24 点')).toBeVisible();
      await expect(page.getByText(/得分:/)).toBeVisible();
      await expect(page.getByText(/尝试:/)).toBeVisible();
      await expect(page.getByPlaceholder(/输入算式/)).toBeVisible();
      await expect(page.getByRole('button', { name: '提交' })).toBeVisible();
      await expect(page.getByRole('button', { name: '提示' })).toBeVisible();
      await expect(page.getByRole('button', { name: '换一组' })).toBeVisible();
    });

    test('shows error for invalid expression', async ({ page }) => {
      const input = page.getByPlaceholder(/输入算式/);
      await input.fill('invalid');
      await page.getByRole('button', { name: '提交' }).click();

      await expect(page.getByText(/算式格式错误/)).toBeVisible();
    });

    test('shows error for wrong numbers', async ({ page }) => {
      const input = page.getByPlaceholder(/输入算式/);
      await input.fill('1 + 1 + 1 + 1');
      await page.getByRole('button', { name: '提交' }).click();

      await expect(page.getByText(/必须使用这四个数字/)).toBeVisible();
    });

    test('shows hint when clicked', async ({ page }) => {
      await page.getByRole('button', { name: '提示' }).click();
      await expect(page.getByText(/提示：尝试不同的组合/)).toBeVisible();
    });

    test('can generate new cards', async ({ page }) => {
      await page.getByRole('button', { name: '换一组' }).click();
      await expect(page.getByText('算 24 点')).toBeVisible();
    });
  });

  test.describe('Sudoku Game', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await page.getByRole('button', { name: '数独' }).click();
    });

    test('displays game elements', async ({ page }) => {
      await expect(page.getByText('数独')).toBeVisible();
      await expect(page.getByText(/时间:/)).toBeVisible();
      await expect(page.getByText(/难度:/)).toBeVisible();

      // Check number pad
      for (let i = 1; i <= 9; i++) {
        await expect(page.getByRole('button', { name: i.toString() })).toBeVisible();
      }

      await expect(page.getByRole('button', { name: '清除' })).toBeVisible();
    });

    test('can change difficulty', async ({ page }) => {
      await page.getByRole('button', { name: '中等' }).click();
      await expect(page.getByText(/难度:中等/)).toBeVisible();

      await page.getByRole('button', { name: '困难' }).click();
      await expect(page.getByText(/难度:困难/)).toBeVisible();

      await page.getByRole('button', { name: '简单' }).click();
      await expect(page.getByText(/难度:简单/)).toBeVisible();
    });

    test('can select cell and input number', async ({ page }) => {
      // Find an empty cell (white background)
      const cells = page.locator('button').filter({ hasText: /^$/ });
      const firstEmpty = cells.first();

      await firstEmpty.click();
      await page.getByRole('button', { name: '5' }).click();

      // Cell should now show 5
      await expect(firstEmpty).toHaveText('5');
    });

    test('can clear cell', async ({ page }) => {
      // Find an empty cell
      const cells = page.locator('button').filter({ hasText: /^$/ });
      const firstEmpty = cells.first();

      // Input number
      await firstEmpty.click();
      await page.getByRole('button', { name: '7' }).click();
      await expect(firstEmpty).toHaveText('7');

      // Clear it
      await page.getByRole('button', { name: '清除' }).click();
      await expect(firstEmpty).toHaveText('');
    });
  });

  test.describe('Minesweeper Game', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await page.getByRole('button', { name: '扫雷' }).click();
    });

    test('displays game elements', async ({ page }) => {
      await expect(page.getByText('扫雷')).toBeVisible();
      await expect(page.getByText(/时间:/)).toBeVisible();
      await expect(page.getByText(/剩余:/)).toBeVisible();

      // Check difficulty buttons
      await expect(page.getByRole('button', { name: '简单' })).toBeVisible();
      await expect(page.getByRole('button', { name: '中等' })).toBeVisible();
      await expect(page.getByRole('button', { name: '困难' })).toBeVisible();
    });

    test('can change difficulty', async ({ page }) => {
      await page.getByRole('button', { name: '中等' }).click();
      await expect(page.getByText('扫雷')).toBeVisible();

      await page.getByRole('button', { name: '困难' }).click();
      await expect(page.getByText('扫雷')).toBeVisible();
    });

    test('can click cells', async ({ page }) => {
      // Find unrevealed cells
      const cells = page.locator('button[class*="bg-slate-300"]');
      const count = await cells.count();

      if (count > 0) {
        await cells.first().click();
        // Game should still be running or show result
        await expect(page.getByText('扫雷')).toBeVisible();
      }
    });

    test('can flag cells with right click', async ({ page }) => {
      // Find unrevealed cells
      const cells = page.locator('button[class*="bg-slate-300"]');
      const count = await cells.count();

      if (count > 0) {
        const firstCell = cells.first();
        await firstCell.click({ button: 'right' });

        // Should show flag
        await expect(firstCell).toHaveText('🚩');
      }
    });

    test('can toggle flag with multiple right clicks', async ({ page }) => {
      const cells = page.locator('button[class*="bg-slate-300"]');
      const count = await cells.count();

      if (count > 0) {
        const firstCell = cells.first();

        // Flag
        await firstCell.click({ button: 'right' });
        await expect(firstCell).toHaveText('🚩');

        // Unflag
        await firstCell.click({ button: 'right' });
        await expect(firstCell).toHaveText('');
      }
    });
  });
});
