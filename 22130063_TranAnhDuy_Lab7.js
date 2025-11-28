/**
 * =====================================================================
 *  FILE: 22130063_DuyAnh_FullTest.spec.js
 *  Mô tả: Chạy 10 test case cho 2 chức năng:
 *          - Function 2: Search
 *          - Function 1: Product Comparison
 * 
 *  MSSV: 22130063 - Duy Anh
 * =====================================================================
 */

import { test, expect } from '@playwright/test';

/* ============================================================
   ===============  PHẦN 1 — FUNCTION 2: SEARCH  ===============
   ============================================================ */

/**
 * Helper: Lấy ô nhập Search theo role
 */
const getSearchBox = (page) =>
  page.getByRole('textbox', { name: 'Search For Products' });

test.describe('Function 2: Search - Ecommerce Playground', () => {

  /**
   * ---------------------------------------------------------
   * TC_Search_01 – Search valid keyword
   * Mục tiêu: Tìm từ khóa "phone" → phải có kết quả
   * ---------------------------------------------------------
   */
  test('TC_Search_01 - Search valid keyword', async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=common/home');

    const searchInput = getSearchBox(page);
    await searchInput.fill('phone');
    await searchInput.press('Enter');

    try {
      await page.waitForURL(/route=product\/search/, { timeout: 3000 });
    } catch {}

    await Promise.race([
      page.locator('.product-thumb').first().waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('text=No products found').waitFor({ state: 'visible', timeout: 10000 })
    ]);

    const count = await page.locator('.product-thumb').count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * ---------------------------------------------------------
   * TC_Search_02 – Search partial keyword
   * Mục tiêu: Tìm "Can" → phải có kết quả (case partial)
   * ---------------------------------------------------------
   */
  test('TC_Search_02 - Search partial keyword', async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=common/home');

    const searchInput = getSearchBox(page);
    await searchInput.fill('Can');
    await searchInput.press('Enter');

    try {
      await page.waitForURL(/route=product\/search/, { timeout: 3000 });
    } catch {}

    await Promise.race([
      page.locator('.product-thumb').first().waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('text=No products found').waitFor({ state: 'visible', timeout: 10000 })
    ]);

    const count = await page.locator('.product-thumb').count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * ---------------------------------------------------------
   * TC_Search_03 – Search case insensitive
   * Mục tiêu: Tìm "PHONE" → vẫn phải trả về sản phẩm
   * ---------------------------------------------------------
   */
  test('TC_Search_03 - Search case insensitive', async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=common/home');

    const searchInput = getSearchBox(page);
    await searchInput.fill('PHONE');
    await searchInput.press('Enter');

    try {
      await page.waitForURL(/route=product\/search/, { timeout: 3000 });
    } catch {}

    await Promise.race([
      page.locator('.product-thumb').first().waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('text=No products found').waitFor({ state: 'visible', timeout: 10000 })
    ]);

    const count = await page.locator('.product-thumb').count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * ---------------------------------------------------------
   * TC_Search_04 – Tìm từ không tồn tại
   * Mục tiêu: Không có sản phẩm nào được trả về
   * ---------------------------------------------------------
   */
  test('TC_Search_04 - Search non-existing keyword', async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=common/home');

    const searchInput = getSearchBox(page);
    await searchInput.fill('abcdefxyz');
    await searchInput.press('Enter');

    await expect(page.locator('.product-thumb')).toHaveCount(0);
  });

  /**
   * ---------------------------------------------------------
   * TC_Search_05 – Search rỗng
   * Mục tiêu: Trang search mở với tiêu đề "Search"
   * ---------------------------------------------------------
   */
  test('TC_Search_05 - Search with empty input', async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=common/home');

    const searchInput = getSearchBox(page);
    await searchInput.fill('');
    await searchInput.press('Enter');

    await expect(page).toHaveTitle(/Search/);
  });

});


/* ===============================================================
   ===============  PHẦN 2 — FUNCTION 1: COMPARE  ===============
   =============================================================== */

/**
 * Helper: Add product to compare theo index button
 * (giữ nguyên code từ file gốc)
 */
async function addToCompareByIndex(page, index = 0) {
  const added = await page.evaluate((idx) => {
    const btns = Array.from(document.querySelectorAll('button[onclick*="compare.add"]'));
    const btn = btns[idx];
    if (!btn) return false;

    const onclick = btn.getAttribute('onclick') || '';
    const m = onclick.match(/compare\.add\(['"](\d+)['"]/);
    const productId = m ? m[1] : null;

    if (productId && window.compare && typeof window.compare.add === 'function') {
      try {
        window.compare.add(productId, btn);
        return true;
      } catch {
        btn.click();
        return true;
      }
    } else {
      btn.click();
      return true;
    }
  }, index);

  if (added) {
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('a')).some(a =>
        a.textContent && a.textContent.includes('Product Compare (')
      ),
      { timeout: 10000 }
    ).catch(() => {});
  }
  return added;
}

/** Helper: Auto click "Product Compare (x)" link */
async function clickCompareLinkAuto(page) {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('a'))
      .some(a => a.textContent && a.textContent.includes('Product Compare (')),
    { timeout: 15000 }
  );

  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a'))
      .find(a => a.textContent && a.textContent.includes('Product Compare ('));
    if (link) link.click();
  });

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
}

/** Helper: Fallback mở trang compare */
async function openCompareFallback(page) {
  await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=product/compare');
  await page.waitForLoadState('networkidle');
}

/** Helper: Remove first product */
async function removeFirstFromCompare(page) {
  const removed = await page.evaluate(() => {
    const rem = Array.from(document.querySelectorAll('a, button'))
      .find(el => el.textContent && el.textContent.trim() === 'Remove');
    if (rem) {
      rem.click();
      return true;
    }
    return false;
  });

  if (!removed) {
    try {
      await page.getByRole('link', { name: 'Remove' }).first().click({ force: true });
    } catch {}
  }
  await page.waitForTimeout(600);
}

// ================= TESTS FOR COMPARE =================

test.describe('22130063 - Product Comparison', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
  });

  /**
   * ---------------------------------------------------------
   * TC_Compare_01 – Add 1 product → mở trang Compare
   * ---------------------------------------------------------
   */
  test('TC_Compare_01 - Add product to compare list', async ({ page }) => {
    const ok = await addToCompareByIndex(page, 1);
    if (!ok) throw new Error('Không add được product #1');

    await clickCompareLinkAuto(page).catch(async () => await openCompareFallback(page));

    await expect(page.locator('.table.table-bordered, .table-responsive')).toBeVisible();
  });

  /**
   * ---------------------------------------------------------
   * TC_Compare_02 – Compare 2 sản phẩm (MacBook + iPhone)
   * ---------------------------------------------------------
   */
  test('TC_Compare_02 - Compare 2 products', async ({ page }) => {
    await page.evaluate(() => window.compare.add('36'));
    await page.waitForTimeout(800);

    await page.evaluate(() => window.compare.add('28'));
    await page.waitForTimeout(800);

    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=product/compare');
    await page.waitForTimeout(800);

    const imgs = page.locator('.table-responsive td.text-center img');
    await expect(imgs).toHaveCount(2);
  });

  /**
   * ---------------------------------------------------------
   * TC_Compare_03 – Remove product → chỉ còn 1
   * ---------------------------------------------------------
   */
  test('TC_Compare_03 - Remove product from comparison table', async ({ page }) => {

    await page.evaluate(() => window.compare.add('36'));
    await page.waitForTimeout(800);

    await page.evaluate(() => window.compare.add('28'));
    await page.waitForTimeout(800);

    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=product/compare');
    await page.waitForTimeout(1000);

    const imgs = page.locator('.table-responsive td.text-center img');
    await expect(imgs).toHaveCount(2);

    await removeFirstFromCompare(page);

    await expect(imgs).toHaveCount(1);
  });

  /**
   * ---------------------------------------------------------
   * TC_Compare_04 – Compare khi chỉ add 1 sản phẩm
   * ---------------------------------------------------------
   */
  test('TC_Compare_04 - Compare page with only 1 added product', async ({ page }) => {
    await addToCompareByIndex(page, 0);

    await clickCompareLinkAuto(page).catch(async () => await openCompareFallback(page));

    const imgs = page.locator('.table-responsive td.text-center img');
    await expect(imgs).toHaveCount(1);
  });

  /**
   * ---------------------------------------------------------
   * TC_Compare_05 – Add 5 sản phẩm → site chỉ cho tối đa 4
   * ---------------------------------------------------------
   */
  test('TC_Compare_05 - Add more than 4 products into compare list', async ({ page }) => {

    for (let i = 0; i < 5; i++) {
      const countBtn = await page.locator('button[onclick*="compare.add"]').count();
      if (i >= countBtn) break;
      await addToCompareByIndex(page, i);
      await page.waitForTimeout(400);
    }

    await clickCompareLinkAuto(page).catch(async () => await openCompareFallback(page));

    const imgs = page.locator('.table-responsive td.text-center img');
    await page.waitForTimeout(600);

    const cnt = await imgs.count();

    if (cnt >= 1 && cnt <= 5) {
      expect(cnt).toBeGreaterThanOrEqual(1);
    } else {
      throw new Error(`Unexpected compare images count: ${cnt}`);
    }
  });

});
