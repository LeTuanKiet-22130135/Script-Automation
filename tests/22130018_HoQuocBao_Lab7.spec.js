import { test, expect } from '@playwright/test';

// ===============================================
// Global Settings
// ===============================================

// Run all tests sequentially
test.describe.configure({ mode: 'serial' });

// Slow motion for debugging / recording video
test.use({ launchOptions: { slowMo: 800 } });


// ===============================================
// CONTACT US FORM
// ===============================================

test.describe("Contact Us Form", () => {
  let page;
  const url = "https://ecommerce-playground.lambdatest.io/index.php?route=information/contact";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // TC0 — Không nhập họ tên
  test("TC0 - Không nhập họ tên", async () => {
    console.log("Running: TC0 - Không nhập họ tên");

    await page.goto(url);
    await page.fill("#input-name", "");
    await page.fill("#input-email", "bao@gmail.com");
    await page.fill("#input-enquiry", "Hello");
    await page.click("input[value='Submit']");

    await expect(page.getByText("Name must be between")).toBeVisible();
  });

  // TC1 — Email sai
  test("TC1 - Email sai", async () => {
    console.log("Running: TC1 - Email sai");

    await page.goto(url);
    await page.fill("#input-name", "Bao");
    await page.fill("#input-email", "abc@@@");
    await page.fill("#input-enquiry", "Hello");
    await page.click("input[value='Submit']");

    await expect(page.getByText("E-Mail Address does not appear")).toBeVisible();
  });

  // TC2 — Gửi thành công
  test("TC2 - Gửi thành công", async () => {
    console.log("Running: TC2 - Gửi thành công");

    await page.goto(url);
    await page.fill("#input-name", "Bao");
    await page.fill("#input-email", "bao@gmail.com");
    await page.fill("#input-enquiry", "This is a valid message.");
    await page.click("input[value='Submit']");

    await expect(page.getByText("successfully sent")).toBeVisible();
  });

});


// ===============================================
// ADDRESS BOOK LIFECYCLE
// ===============================================

test.describe("Address Book Lifecycle", () => {
  let page;

  // Setup login before executing tests
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    console.log("Setting up login session...");

    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/login");
    await page.fill("#input-email", "hoquocbao1804@gmail.com");
    await page.fill("#input-password", "01626224120");
    await page.click("input[value='Login']");

    await expect(page).toHaveTitle(/My Account/);
  });

  test.afterAll(async () => {
    console.log("Logging out...");
    await page.click("#column-right a:has-text('Logout')");
    await page.close();
  });

  // TC3 — Thêm địa chỉ
  test("TC3 - Đánh giá hợp lệ", async () => {
    console.log("Running: TC3 - Đánh giá hợp lệ");

    await page.click("text=Address Book");
    await page.click("text=New Address");

    await page.fill("#input-firstname", "Ho");
    await page.fill("#input-lastname", "Bao");
    await page.fill("#input-address-1", "sdefs");
    await page.fill("#input-city", "fđ");
    await page.fill("#input-postcode", "232434");

    await page.selectOption("#input-country", { label: "Viet Nam" });
    await page.waitForFunction(() => !document.querySelector("#input-zone").disabled);
    await page.selectOption("#input-zone", { label: "Ha Noi" });

    await page.click("input[value='Continue']");
    await expect(page.locator(".alert-success")).toBeVisible();
  });

  // TC4 — Edit short
  test("TC4 - Đánh giá quá ngắn", async () => {
    console.log("Running: TC4 - Đánh giá quá ngắn");

    await page.click("text=Address Book");
    await page.locator("tr:last-child .btn-info").click();

    await page.fill("#input-firstname", "dss");
    await page.click("input[value='Continue']");

    await expect(page.locator(".alert-success")).toBeVisible();
  });

  // TC5 — Không nhập rating
  test("TC5 - Không có đánh giá nào được nhập", async () => {
    console.log("Running: TC5 - Không có đánh giá nào được nhập");

    await page.click("text=Address Book");
    await page.locator("tr:first-child .btn-info").click();

    await page.getByText("Yes").click();
    await page.click("input[value='Continue']");

    await expect(page.locator(".alert-success")).toBeVisible();
  });

  // TC6 — Invalid Address
  test("TC6 - Danh sách đánh giá hiển thị đúng", async () => {
    console.log("Running: TC6 - Danh sách đánh giá hiển thị đúng");

    await page.click("text=New Address");

    await page.fill("#input-firstname", "Ho");
    await page.fill("#input-lastname", "Bao");
    await page.fill("#input-address-1", "a");
    await page.fill("#input-city", "b");
    await page.fill("#input-postcode", "12345434");

    await page.selectOption("#input-country", { label: "Viet Nam" });
    await page.waitForFunction(() => !document.querySelector("#input-zone").disabled);
    await page.selectOption("#input-zone", { label: "Ha Noi" });

    await page.click("input[value='Continue']");

    await expect(page.getByText("Address must be between")).toBeVisible();
    await expect(page.getByText("City must be between")).toBeVisible();
  });

  // TC7 — Delete
  test("TC7 - Đánh giá >1000 từ", async () => {
    console.log("Running: TC7 - Đánh giá >1000 từ");

    await page.click("text=Address Book");

    page.once("dialog", dialog => {
      console.log("Dialog:", dialog.message());
      dialog.accept();
    });

    await page.locator("tr:last-child .btn-danger").click();

    await expect(page.locator(".alert-success")).toBeVisible();
  });

});
