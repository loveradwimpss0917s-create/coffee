import { expect, test } from '@playwright/test';

/**
 * 中核ループ E2E（docs/14 §4）:
 * オンボーディング → ウィザード4ステップ → レシピ表示 → タイマー完走 → フィードバック → ログに記録
 */
test('ゲストが1杯淹れてログに記録できる', async ({ page }) => {
  // 1. オンボーディング
  await page.goto('/onboarding');
  await page.getByText('HARIO V60', { exact: true }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await page.waitForURL('**/');

  // 2. ウィザード開始
  await page
    .getByRole('link', { name: /淹れる/ })
    .first()
    .click();
  await page.waitForURL('**/brew');

  // ステップ1: 豆（デフォルトのまま次へ）
  await page.getByRole('button', { name: '次へ' }).click();

  // ステップ2: 器具
  await page.getByText('HARIO V60', { exact: true }).click();
  await page.getByRole('button', { name: '次へ' }).click();

  // ステップ3: 味の好み（デフォルトのまま次へ）
  await page.getByRole('button', { name: '次へ' }).click();

  // ステップ4: 量・温度
  await page.getByRole('button', { name: 'レシピを生成' }).click();
  await page.waitForURL('**/brew/result');

  // 3. レシピ表示: 数値が妥当レンジであることを確認
  const doseWaterText = await page.getByText(/\d+g \/ \d+g/).textContent();
  expect(doseWaterText).toBeTruthy();
  const ratioText = await page.getByText(/1 : \d+(\.\d+)?/).textContent();
  expect(ratioText).toMatch(/1 : (1[0-9]|20)/); // 1:10-1:20
  const tempText = await page.getByText(/\d+°C/).first().textContent();
  const tempC = Number(tempText?.match(/(\d+)/)?.[1]);
  expect(tempC).toBeGreaterThanOrEqual(78);
  expect(tempC).toBeLessThanOrEqual(97);

  // 4. タイマー完走
  await page.getByRole('button', { name: /抽出をはじめる/ }).click();
  await page.waitForURL('**/brew/timer');

  for (let i = 0; i < 10; i++) {
    if (page.url().includes('/brew/feedback')) break;
    const nextButton = page.getByRole('button', { name: /注ぎ終えた|抽出を完了する/ });
    if ((await nextButton.count()) === 0) break;
    // 最終ステップのクリックは即座にページ遷移し、ボタンがDOMから外れることがある。
    // その場合クリック自体は成立しているので、失敗は無視して次のループでURLを再確認する。
    await nextButton.click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(100);
  }
  await page.waitForURL('**/brew/feedback', { timeout: 5000 });

  // 5. フィードバック送信
  await page.getByRole('radiogroup', { name: '評価' }).locator('label').nth(3).click();
  await page.getByRole('button', { name: '保存する' }).click();

  // 6. ログに記録されている
  await page.waitForURL('**/log/*');
  await expect(page.getByRole('heading', { name: 'HARIO V60' })).toBeVisible();

  await page.goto('/log');
  await expect(page.getByText('HARIO V60')).toBeVisible();
});

test('ゲストデータはリロード後も永続化される', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByText('HARIO V60', { exact: true }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();
  await page.waitForURL('**/');

  await page.reload({ waitUntil: 'networkidle' });
  // オンボーディング済みなのでホームに留まる（/onboarding へ戻されない）
  await expect(page).toHaveURL('http://localhost:3000/');
  await expect(page.getByRole('heading', { name: '今日の一杯を淹れる' })).toBeVisible({
    timeout: 10000,
  });
});
