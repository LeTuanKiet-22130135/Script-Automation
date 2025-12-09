import { test, expect } from '@playwright/test';

// ==========================================
// EMBEDDED TEST DATA
// ==========================================
const testData = {
  "invalidAddresses": [
    {
      "scenario": "Address too short",
      "firstname": "Le",
      "lastname": "kiet",
      "address": "aa",
      "city": "Hanoi",
      "postcode": "123456",
      "expectedError": "Address must be between 3 and 128 characters!"
    },
    {
      "scenario": "City too short",
      "firstname": "Le",
      "lastname": "kiet",
      "address": "Valid Address 123",
      "city": "b",
      "postcode": "123456",
      "expectedError": "City must be between 2 and 128 characters!"
    }
  ],
  "invalidPasswords": [
    { 
      "length": "3 chars (Too Short)", 
      "pass": "123", 
      "error": "Password must be between 4 and 20 characters!" 
    },
    { 
      "length": "21 chars (Too Long)", 
      "pass": "123456789012345678901", 
      "error": "Password must be between 4 and 20 characters!" 
    }
  ]
};

// ==========================================
// TEST CONFIGURATION
// ==========================================
test.describe.configure({ mode: 'serial' });
test.use({ launchOptions: { slowMo: 1000 } });

test.describe('Address Book & Password Tests (Mapped to Doc)', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    console.log("--- Login ---");
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/login");
    await page.fill("#input-email", 'user144@example.com'); // Ensure this user exists
    await page.fill("#input-password", '1234');
    await page.click("input[value='Login']");
    await expect(page).toHaveTitle(/My Account/);
  });

  test.afterAll(async () => {
    console.log("--- Logout ---");
    try {
        if (!page.isClosed()) {
            await page.click("#column-right a:has-text('Logout')");
            await page.close();
        }
    } catch (e) {
        console.log("Logout cleanup failed (page might be closed already): " + e);
    }
  });

  // --- ADDRESS BOOK TESTS ---

  test('[Module_QuanLyDiaChi-1] Thêm địa chỉ mới hợp lệ (Positive)', async () => {
    console.log("Running: [Module_QuanLyDiaChi-1] Thêm địa chỉ mới hợp lệ");
    if (!page.url().includes('route=account/address')) {
      await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
    }
    await page.click("text=New Address");

    await page.fill("#input-firstname", 'Le');
    await page.fill("#input-lastname", 'kiet');
    await page.fill("#input-address-1", 'sdefs');
    await page.fill("#input-city", 'fđ');
    await page.fill("#input-postcode", '232434');

    await page.selectOption("#input-country", { label: "Viet Nam" });
    await page.waitForFunction(() => !document.querySelector("#input-zone").disabled);
    await page.selectOption("#input-zone", { label: "Ha Noi" });

    await page.click("input[value='Continue']");

    const successAlert = page.locator(".alert-success");
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText("Your address has been successfully added");
  });

  test('[Module_QuanLyDiaChi-2] Sửa địa chỉ thành công', async () => {
    console.log("Running: [Module_QuanLyDiaChi-2] Sửa địa chỉ thành công");
    if (!page.url().includes('route=account/address')) {
        await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
    }
    
    // Safety check: ensure we have at least one address
    if (await page.locator("tr .btn-info").count() > 0) {
        await page.locator("tr:last-child .btn-info").click();
        await page.fill("#input-firstname", 'dss');
        await page.click("input[value='Continue']");
        await expect(page.locator(".alert-success")).toContainText("Your address has been successfully updated");
    } else {
        console.log("Skipping Edit: No address found.");
    }
  });

  test('[Module_QuanLyDiaChi-3] Đặt 1 địa chỉ làm địa chỉ mặc định', async () => {
    console.log("Running: [Module_QuanLyDiaChi-3] Đặt 1 địa chỉ làm địa chỉ mặc định");
    if (!page.url().includes('route=account/address')) {
        await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
    }
    
    if (await page.locator("tr .btn-info").count() > 0) {
        await page.locator("tr:first-child .btn-info").click();
        
        // Sometimes "Default Address" is already Yes, so we check first
        const yesRadio = page.getByText('Yes', { exact: true });
        if (await yesRadio.isVisible()) {
            await yesRadio.click();
        }
        
        await page.click("input[value='Continue']");
        await expect(page.locator(".alert-success")).toContainText("Your address has been successfully updated");
    }
  });

  // Data Driven Tests for Invalid Address
  for (const data of testData.invalidAddresses) {
    test(`[Module_QuanLyDiaChi-2] Thêm địa chỉ không hợp lệ (Negative): ${data.scenario}`, async () => {
      console.log(`Running Data Driven Test: ${data.scenario}`);
      
      if (!page.url().includes('route=account/address')) {
        await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
      }
      
      await page.click("text=New Address");

      await page.fill("#input-firstname", data.firstname);
      await page.fill("#input-lastname", data.lastname);
      await page.fill("#input-address-1", data.address);
      await page.fill("#input-city", data.city);
      await page.fill("#input-postcode", data.postcode);

      await page.selectOption("#input-country", { label: "Viet Nam" });
      await page.waitForFunction(() => !document.querySelector("#input-zone").disabled);
      await page.selectOption("#input-zone", { label: "Ha Noi" });

      await page.click("input[value='Continue']");

      await expect(page.getByText(data.expectedError)).toBeVisible();
      
      // Go back to list to prevent getting stuck on error page
      await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
    });
  }

  test('[Module_QuanLyDiaChi-3] Xóa địa chỉ thành công', async () => {
    console.log("Running: [Module_QuanLyDiaChi-3] Xóa địa chỉ thành công");
    if (!page.url().includes('route=account/address')) {
        await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/address");
    }
    
    const deleteBtn = page.locator("tr:last-child .btn-danger");
    if (await deleteBtn.count() > 0) {
        page.once('dialog', dialog => dialog.accept());
        await deleteBtn.click();
        await expect(page.locator(".alert-success")).toContainText("Your address has been successfully deleted");
    } else {
        console.log("Skipping Delete: No address found.");
    }
  });

  // --- PASSWORD TESTS ---

  test('[Module_ThayDoiMatKhau-1] Đổi mật khẩu thành công (Positive)', async () => {
    console.log("Running: [Module_ThayDoiMatKhau-1] Đổi mật khẩu thành công");
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/password");

    await page.fill("#input-password", '1234');
    await page.fill("#input-confirm", '1234');
    
    await page.click("input[value='Continue']");
    
    await expect(page.locator(".alert-success")).toContainText("Success: Your password has been successfully updated.");
  });

  test('[Module_ThayDoiMatKhau-2] Đổi mật khẩu khi ô "Confirm Password" không khớp', async () => {
    console.log("Running: [Module_ThayDoiMatKhau-2] Confirm Password không khớp");
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/password");
    
    await page.fill("#input-password", '12345'); 
    await page.fill("#input-confirm", '123456');
    
    await page.click("input[value='Continue']");
    
    await expect(page.getByText("Password confirmation does not match password!")).toBeVisible();
  });

  // Data Driven Tests for Invalid Password
  for (const data of testData.invalidPasswords) {
    test(`[Module_ThayDoiMatKhau-2] Đổi mật khẩu với độ dài quá ngắn: ${data.length}`, async () => {
      console.log(`Running Data Driven Test: ${data.length}`);
      
      await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/password");
      
      await page.fill("#input-password", data.pass);
      await page.fill("#input-confirm", data.pass);
      
      await page.click("input[value='Continue']");
      
      await expect(page.getByText(data.error)).toBeVisible();
    });
  }
});