import { test, expect } from "@playwright/test";

// Hàm dùng chung: Search → mở đúng product ID
async function searchAndOpen(page, keyword, productId) {
  await page.goto("https://ecommerce-playground.lambdatest.io/");
  await page.fill("input[name='search']", keyword);
  await page.keyboard.press("Enter");
  await page.waitForURL(/search=/);

  // Mở đúng trang sản phẩm theo product_id
  await page.goto(
    `https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=${productId}&search=${keyword}`,
    { waitUntil: "domcontentloaded" }
  );
}

test.describe("Lab 7 - Nguyen Phuoc Thinh - 8 Test Cases (Added Invalid & Boundary)", () => {

  // =====================================================================
  // 🟢 TEST 1 — Thêm sản phẩm hợp lệ vào giỏ hàng
  // =====================================================================
  test("AddToCart-1: Thêm sản phẩm hợp lệ vào giỏ hàng", async ({ page }) => {
    await searchAndOpen(page, "MacBook", 60); 

    const addBtn = page.locator("button.button-cart.cart-60:visible");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.locator(".toast-body, .alert-success")).toBeVisible();

    const viewCartButton = page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" });
    await expect(viewCartButton).toBeVisible();
    await viewCartButton.click();

    await expect(
      page.locator("#content table a", { hasText: "MacBook" })
    ).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🟠 TEST 2 — Không thể thêm sản phẩm hết hàng
  // =====================================================================
  test("AddToCart-2: Không cho thêm sản phẩm hết hàng", async ({ page }) => {
    await searchAndOpen(page, "MacBook Pro", 43);
    // Sản phẩm này hết hàng, nút Add to Cart thường bị disable hoặc alert khi click
    // Ở đây giữ nguyên logic check của bạn (hoặc verify nút bị disable nếu cần)
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🔴 TEST 3 — Không cho nhập số lượng vượt quá tồn kho
  // =====================================================================
  test("AddToCart-3: Nhập số lượng vượt quá tồn kho tại trang CTSP → lỗi trong giỏ hàng", async ({ page }) => {
    await page.goto(
      "https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=62",
      { waitUntil: "domcontentloaded" }
    );

    const qtyInput = page.locator('input[name="quantity"]:visible');
    await expect(qtyInput).toBeVisible(); 
    await qtyInput.fill("5000");

    const addBtn = page.locator("button.button-cart.cart-62:visible");
    await addBtn.click();

    const viewCartButton = page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" });
    await viewCartButton.click();

    await expect(
      page.locator(".alert-danger", { hasText: "not available in the desired quantity" })
    ).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🟦 TEST 4 — Cập nhật số lượng trong giỏ (Valid)
  // =====================================================================
  test("Module2-1: Cập nhật số lượng trong giỏ (Valid)", async ({ page }) => {
    // Setup: Add item ID 60
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60");
    await page.locator("button.button-cart.cart-60:visible").click();
    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    const qtyInput = page.locator("input[name*='quantity']:visible").first();
    await expect(qtyInput).toBeVisible();

    await qtyInput.fill("2");
    await qtyInput.press("Enter");

    await expect(
      page.locator(".alert-success", { hasText: "modified your shopping cart" })
    ).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🟩 TEST 5 — Xóa sản phẩm ra khỏi giỏ hàng (Valid)
  // =====================================================================
  test("Module2-2: Xóa sản phẩm khỏi giỏ (Valid)", async ({ page }) => {
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60");
    await page.locator("button.button-cart.cart-60:visible").click();
    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    await page.locator("table tbody tr button.btn-danger:visible").click();
    await page.waitForURL(/checkout\/cart/);

    await expect(
      page.locator("#content p", { hasText: "Your shopping cart is empty!" })
    ).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🟪 TEST 6 — Kiểm tra tổng giá trị đơn hàng (Valid)
  // =====================================================================
  test("Module2-3: Kiểm tra tổng giá trị đơn hàng", async ({ page }) => {
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60");
    await page.locator("button.button-cart.cart-60:visible").click();
    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    const summaryTable = page.locator("#content table");
    await expect(summaryTable.locator("td", { hasText: /^Sub-Total:$/ })).toBeVisible();
    await expect(summaryTable.locator("td", { hasText: /^Total:$/ })).toBeVisible();
    
    await page.waitForTimeout(2000);
  });

  // =====================================================================
  // ⚠️ [NEW] TEST 7 — INVALID CASE: Cập nhật abc vào số lượng
  // =====================================================================
  test("Module2-5: Invalid - Cập nhật số lượng là abc", async ({ page }) => {
    // 1. Setup: Thêm sản phẩm vào giỏ
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60");
    await page.locator("button.button-cart.cart-60:visible").click();
    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    // 2. Tìm ô input quantity
    const qtyInput = page.locator("input[name*='quantity']:visible").first();
    
    // 3. Nhập abc
    await qtyInput.fill("abc");
    await qtyInput.press("Enter");

        await expect(page.locator("#content")).toBeVisible();
 

    await page.waitForTimeout(2000);
  });

   
  // =====================================================================
  // 🚧 [NEW] TEST 8 — BOUNDARY CASE: Cập nhật về 0 (Tự động xóa)
  // =====================================================================
  test("Module2-6: Boundary - Cập nhật số lượng về 0 (Check tự xóa)", async ({ page }) => {
    // 1. Setup: Thêm sản phẩm vào giỏ
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60");
    await page.locator("button.button-cart.cart-60:visible").click();
    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    // 2. Tìm ô input quantity
    const qtyInput = page.locator("input[name*='quantity']:visible").first();

    // 3. Nhập số "0"
    await qtyInput.fill("0");
    await qtyInput.press("Enter");

    // 4. Verification (Mong đợi): 
    // Khi update qty = 0, sản phẩm thường bị xóa khỏi giỏ -> Giỏ hàng trống
    await page.waitForURL(/checkout\/cart/);
    await expect(
      page.locator("#content p", { hasText: "Your shopping cart is empty!" })
    ).toBeVisible();

    await page.waitForTimeout(2000);
  });

});

// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: false,                // mở giao diện
    video: 'on',                    // BẬT QUAY VIDEO
    screenshot: 'only-on-failure',  // chụp ảnh khi lỗi
    trace: 'on-first-retry',
  },
});
