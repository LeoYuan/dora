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

      // Verify game panel is open - check for game tab buttons
      await expect(page.getByRole('button', { name: '算24点' })).toBeVisible();
      await expect(page.getByRole('button', { name: '数独' })).toBeVisible();
      await expect(page.getByRole('button', { name: '扫雷' })).toBeVisible();
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
      await expect(page.getByText('第 1 关')).toBeVisible();
    });

    test('can close game panel', async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await expect(page.getByRole('button', { name: '算24点' })).toBeVisible();

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
      await expect(page.getByText('第 1 关')).toBeVisible();
      await expect(page.getByText(/得分:/)).toBeVisible();
      await expect(page.getByText(/时间:/)).toBeVisible();
      await expect(page.getByRole('button', { name: '提示' })).toBeVisible();
      await expect(page.getByRole('button', { name: '重玩' })).toBeVisible();
      await expect(page.getByRole('button', { name: '新游戏' })).toBeVisible();
      await expect(page.getByRole('button', { name: '排行榜' })).toBeVisible();
    });

    test('can start game', async ({ page }) => {
      // Should show start overlay
      await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();

      // Click start
      await page.getByRole('button', { name: '开始游戏' }).click();

      // Game should be started - cards should be visible
      await expect(page.locator('.grid.grid-cols-2 button')).toHaveCount(4);
    });

    test('shows hint when clicked', async ({ page }) => {
      // Start the game first
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '提示' }).click();

      // Hint should show solution
      await expect(page.getByText(/提示：.*= 24/)).toBeVisible();
    });

    test('can reset game', async ({ page }) => {
      // Start the game
      await page.getByRole('button', { name: '开始游戏' }).click();

      // Click reset
      await page.getByRole('button', { name: '重玩' }).click();

      // Should still show game elements
      await expect(page.getByText('第 1 关')).toBeVisible();
    });
  });

  test.describe('Sudoku Game', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await page.getByRole('button', { name: '数独' }).click();
    });

    test('displays game elements', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '数独' })).toBeVisible();
      await expect(page.getByText(/时间:/)).toBeVisible();
      await expect(page.getByText(/难度:/)).toBeVisible();

      // Check difficulty buttons
      await expect(page.getByRole('button', { name: '简单' })).toBeVisible();
      await expect(page.getByRole('button', { name: '中等' })).toBeVisible();
      await expect(page.getByRole('button', { name: '困难' })).toBeVisible();

      // Check start button
      await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
    });

    test('can change difficulty', async ({ page }) => {
      await page.getByRole('button', { name: '中等' }).click();
      await expect(page.getByText(/难度:中等/)).toBeVisible();

      await page.getByRole('button', { name: '困难' }).click();
      await expect(page.getByText(/难度:困难/)).toBeVisible();

      await page.getByRole('button', { name: '简单' }).click();
      await expect(page.getByText(/难度:简单/)).toBeVisible();
    });

    test('can start game', async ({ page }) => {
      // Click start
      await page.getByRole('button', { name: '开始游戏' }).click();

      // Wait for start overlay to disappear
      await expect(page.getByRole('button', { name: '开始游戏' })).not.toBeVisible();

      // Game board should be visible (check for the sudoku grid specifically)
      await expect(page.locator('.grid').first()).toBeVisible();
    });
  });

  test.describe('Minesweeper Game', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      await page.getByRole('button', { name: '扫雷' }).click();
    });

    test('displays game elements', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '扫雷' })).toBeVisible();
      await expect(page.getByText(/时间:/)).toBeVisible();
      await expect(page.getByText(/剩余:/)).toBeVisible();

      // Check difficulty buttons
      await expect(page.getByRole('button', { name: '简单' })).toBeVisible();
      await expect(page.getByRole('button', { name: '中等' })).toBeVisible();
      await expect(page.getByRole('button', { name: '困难' })).toBeVisible();

      // Check start button
      await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
    });

    test('can change difficulty', async ({ page }) => {
      await page.getByRole('button', { name: '中等' }).click();
      await expect(page.getByRole('heading', { name: '扫雷' })).toBeVisible();

      await page.getByRole('button', { name: '困难' }).click();
      await expect(page.getByRole('heading', { name: '扫雷' })).toBeVisible();
    });

    test('can start game and click cells', async ({ page }) => {
      // Click start
      await page.getByRole('button', { name: '开始游戏' }).click();

      // Wait for start overlay to disappear
      await expect(page.getByRole('button', { name: '开始游戏' })).not.toBeVisible();

      // Find unrevealed cells
      const cells = page.locator('button[class*="bg-slate-300"]');
      const count = await cells.count();

      if (count > 0) {
        await cells.first().click();
        // Game should still be running or show result
        await expect(page.getByRole('heading', { name: '扫雷' })).toBeVisible();
      }
    });

    test('can flag cells with right click', async ({ page }) => {
      // Click start
      await page.getByRole('button', { name: '开始游戏' }).click();
      await expect(page.getByRole('button', { name: '开始游戏' })).not.toBeVisible();

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
  });

  test.describe('Leaderboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /游戏/ }).click();
      // Clear localStorage to ensure clean state
      await page.evaluate(() => localStorage.removeItem('dora-game-leaderboard'));
    });

    test('can open leaderboard from 24 game', async ({ page }) => {
      await page.getByRole('button', { name: '算24点' }).click();

      // Start the game first to dismiss the overlay
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '排行榜' }).click();

      // Verify leaderboard modal is shown
      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByRole('heading', { name: '排行榜' })).toBeVisible();
      await expect(leaderboardModal.getByText('前20名')).toBeVisible();

      // Check all game tabs are visible
      await expect(leaderboardModal.getByRole('button', { name: '算24点' })).toBeVisible();
      await expect(leaderboardModal.getByRole('button', { name: '数独' })).toBeVisible();
      await expect(leaderboardModal.getByRole('button', { name: '扫雷' })).toBeVisible();
    });

    test('can open leaderboard from sudoku game', async ({ page }) => {
      await page.getByRole('button', { name: '数独' }).click();
      await page.getByRole('button', { name: '查看排行榜' }).click();

      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByRole('heading', { name: '排行榜' })).toBeVisible();
      await expect(leaderboardModal.getByText('前20名')).toBeVisible();
    });

    test('can open leaderboard from minesweeper game', async ({ page }) => {
      await page.getByRole('button', { name: '扫雷' }).click();
      await page.getByRole('button', { name: '排行榜' }).click();

      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByRole('heading', { name: '排行榜' })).toBeVisible();
      await expect(leaderboardModal.getByText('前20名')).toBeVisible();
    });

    test('can close leaderboard', async ({ page }) => {
      await page.getByRole('button', { name: '算24点' }).click();

      // Start the game first to dismiss the overlay
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '排行榜' }).click();

      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByRole('heading', { name: '排行榜' })).toBeVisible();

      // Click close button (X)
      await leaderboardModal.getByRole('button', { name: '✕' }).click();

      // Leaderboard should be closed, game should be visible
      await expect(page.getByText('第 1 关')).toBeVisible();
    });

    test('can switch between game tabs in leaderboard', async ({ page }) => {
      await page.getByRole('button', { name: '算24点' }).click();

      // Start the game first to dismiss the overlay
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '排行榜' }).click();

      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });

      // Switch to Sudoku tab
      await leaderboardModal.getByRole('button', { name: '数独' }).click();
      // Check active tab has amber color
      await expect(leaderboardModal.locator('button').filter({ hasText: '数独' }).locator('..').locator('[class*="text-amber-500"]')).toBeVisible();

      // Switch to Minesweeper tab
      await leaderboardModal.getByRole('button', { name: '扫雷' }).click();
      await expect(leaderboardModal.locator('button').filter({ hasText: '扫雷' }).locator('..').locator('[class*="text-amber-500"]')).toBeVisible();
    });

    test('shows empty state when no scores', async ({ page }) => {
      await page.getByRole('button', { name: '算24点' }).click();

      // Start the game first to dismiss the overlay
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '排行榜' }).click();

      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByText('暂无记录')).toBeVisible();
      await expect(leaderboardModal.getByText('快来挑战，创造你的最佳成绩！')).toBeVisible();
    });

    test('leaderboard persists scores in localStorage', async ({ page }) => {
      await page.getByRole('button', { name: '算24点' }).click();

      // Start the game first to dismiss the overlay
      await page.getByRole('button', { name: '开始游戏' }).click();

      await page.getByRole('button', { name: '排行榜' }).click();

      // Initially empty
      const leaderboardModal = page.locator('.z-50').filter({ hasText: '排行榜' });
      await expect(leaderboardModal.getByText('暂无记录')).toBeVisible();

      // Close leaderboard
      await leaderboardModal.getByRole('button', { name: '✕' }).click();

      // Simulate a completed game by directly saving a score
      await page.evaluate(() => {
        const leaderboard = {
          '24': [{ playerName: 'TestPlayer', time: 30, date: new Date().toISOString() }],
          'sudoku': [],
          'minesweeper': []
        };
        localStorage.setItem('dora-game-leaderboard', JSON.stringify(leaderboard));
      });

      // Reopen leaderboard
      await page.getByRole('button', { name: '排行榜' }).click();

      // Should now show the score
      await expect(leaderboardModal.getByText('TestPlayer')).toBeVisible();
      await expect(leaderboardModal.getByText('00:30')).toBeVisible();
    });
  });
});
