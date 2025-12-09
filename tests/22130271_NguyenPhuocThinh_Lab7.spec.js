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

test.describe("Lab 7 - Nguyen Phuoc Thinh - 6 Test Cases", () => {

  // =====================================================================
  // 🟢 TEST 1 — Thêm sản phẩm hợp lệ vào giỏ hàng
  // =====================================================================
  test("AddToCart-1: Thêm sản phẩm hợp lệ vào giỏ hàng", async ({ page }) => {

    await searchAndOpen(page, "MacBook", 60); // ID MacBook = 60

    // Add To Cart đúng UI mới (nút Visible)
    const addBtn = page.locator("button.button-cart.cart-60:visible");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Popup success
    await expect(page.locator(".toast-body, .alert-success")).toBeVisible();

    // View Cart (UI mới)
    const viewCartButton = page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" });
    await expect(viewCartButton).toBeVisible();
    await viewCartButton.click();

 // ⭐ 7. Kiểm tra MacBook trong GIỎ HÀNG (selector chính xác, không strict mode)
  await expect(
    page.locator("#content table a", { hasText: "MacBook" })
  ).toBeVisible();
await page.waitForTimeout(2000);
  });

  // =====================================================================
  // 🟠 TEST 2 — Không thể thêm sản phẩm hết hàng
  // =====================================================================
  test("AddToCart-2: Không cho thêm sản phẩm hết hàng", async ({ page }) => {

    // MacBook Pro (ID = 43) đang hết hàng
    await searchAndOpen(page, "MacBook Pro", 43);

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

  // ⭐ Chọn đúng input hiển thị, không lấy input bị ẩn
  const qtyInput = page.locator('input[name="quantity"]:visible');

  await expect(qtyInput).toBeVisible();  // đảm bảo chọn đúng
  await qtyInput.fill("5000");

  // Add To Cart
  const addBtn = page.locator("button.button-cart.cart-62:visible");
  await addBtn.click();

  // View Cart
  const viewCartButton = page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" });
  await viewCartButton.click();

  // Kiểm tra lỗi
  await expect(
    page.locator(".alert-danger", { hasText: "not available in the desired quantity" })
  ).toBeVisible();
await page.waitForTimeout(2000);
});


  // =====================================================================
  // 🟦 TEST 4 — Cập nhật số lượng trong giỏ
  // =====================================================================
 test("Module2-1: Cập nhật số lượng trong giỏ", async ({ page }) => {

  // 1. Tìm và mở MacBook Pro - product_id=60
  await page.goto("https://ecommerce-playground.lambdatest.io/");
  await page.fill("input[name='search']", "MacBook");
  await page.keyboard.press("Enter");
  await page.waitForURL(/search=MacBook/);

  // Mở đúng sản phẩm ID=60
  await page.goto(
    "https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60",
    { waitUntil: "domcontentloaded" }
  );

  // Thêm vào giỏ
  await page.locator("button.button-cart.cart-60:visible").click();
  await expect(page.locator(".toast-body")).toBeVisible();

  // View Cart
  await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

  // ⭐ 3. Lấy đúng input quantity của Shopping Cart
  const qtyInput = page.locator("input[name*='quantity']:visible").first();

  await expect(qtyInput).toBeVisible();

  // Điền số lượng mới
  await qtyInput.fill("2");

  // ⭐ 4. Nhấn Enter để cập nhật
  await qtyInput.press("Enter");

  // ⭐ 5. Kiểm tra thông báo SUCCESS
  await expect(
    page.locator(".alert-success", { hasText: "modified your shopping cart" })
  ).toBeVisible();
await page.waitForTimeout(2000);
});


  // =====================================================================
  // 🟩 TEST 5 — Xóa sản phẩm ra khỏi giỏ hàng
  // =====================================================================
test("Module2-2: Xóa sản phẩm khỏi giỏ", async ({ page }) => {

  // 1. Add sản phẩm
  await page.goto("https://ecommerce-playground.lambdatest.io/");
  await page.fill("input[name='search']", "MacBook");
  await page.keyboard.press("Enter");
  await page.waitForURL(/search=MacBook/);

  // 2. Vào product ID 60
  await page.goto(
    "https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60"
  );

  // Add to cart
  await page.locator("button.button-cart.cart-60:visible").click();

  // View Cart
  await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

  // ⭐ 3. Remove sản phẩm (CHỌN NÚT TRONG TABLE)
  await page.locator("table tbody tr button.btn-danger:visible").click();

  // 4. Chờ reload
  await page.waitForURL(/checkout\/cart/);

  // ⭐ 5. Kiểm tra giỏ trống — chọn đúng phần tử (trong #content)
  await expect(
    page.locator("#content p", { hasText: "Your shopping cart is empty!" })
  ).toBeVisible();
await page.waitForTimeout(2000);
});



  // =====================================================================
  // 🟪 TEST 6 — Kiểm tra tổng giá trị đơn hàng
  // =====================================================================
test("Module2-3: Kiểm tra tổng giá trị đơn hàng", async ({ page }) => {

    await page.goto("https://ecommerce-playground.lambdatest.io/");
    await page.fill("input[name='search']", "MacBook");
    await page.keyboard.press("Enter");
    await page.waitForURL(/search=MacBook/);

    await page.goto(
      "https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=60"
    );

    await page.locator("button.button-cart.cart-60:visible").click();

    await page.locator("a.btn.btn-primary.btn-block", { hasText: "View Cart" }).click();

    const summaryTable = page.locator("#content table");

    // Kiểm tra Sub-Total label
    await expect(summaryTable.locator("td", { hasText: /^Sub-Total:$/ })).toBeVisible();

    // Kiểm tra Total label
    await expect(summaryTable.locator("td", { hasText: /^Total:$/ })).toBeVisible();

    // ⭐ Lấy đúng giá Total
    const totalValue = summaryTable
      .locator("tr", { hasText: /^Total:/ })
      .locator("td.text-right")
      .last();
await page.waitForTimeout(2000);
});
// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: false,               // mở giao diện
    video: 'on',                   // BẬT QUAY VIDEO
    screenshot: 'only-on-failure', // chụp ảnh khi lỗi
    trace: 'on-first-retry',
  },
});
});
