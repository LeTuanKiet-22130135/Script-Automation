import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '22130135_LeTuanKiet_Data.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

test.describe.configure({ mode: 'serial' });
test.use({ launchOptions: { slowMo: 1000 } });

test.describe('Address Book & Password Tests (Mapped to Doc)', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    console.log("--- Login ---");
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=account/login");
    await page.fill("#input-email", 'lekiet1900@qa.team');
    await page.fill("#input-password", '1234');
    await page.click("input[value='Login']");
    await expect(page).toHaveTitle(/My Account/);
  });

  test.afterAll(async () => {
    console.log("--- Logout ---");
    await page.click("#column-right a:has-text('Logout')");
    await page.close();
  });

  test('[Module_QuanLyDiaChi-1] Thêm địa chỉ mới hợp lệ (Positive)', async () => {
    console.log("Running: [Module_QuanLyDiaChi-1] Thêm địa chỉ mới hợp lệ");
    await page.click("text=Address Book");
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
        await page.click("text=Address Book");
    }
    await page.locator("tr:last-child .btn-info").click();
    await page.fill("#input-firstname", 'dss');
    await page.click("input[value='Continue']");
    await expect(page.locator(".alert-success")).toContainText("Your address has been successfully updated");
  });

  test('[Module_QuanLyDiaChi-3] Đặt 1 địa chỉ làm địa chỉ mặc định', async () => {
    console.log("Running: [Module_QuanLyDiaChi-3] Đặt 1 địa chỉ làm địa chỉ mặc định");
    if (!page.url().includes('route=account/address')) {
        await page.click("text=Address Book");
    }
    await page.locator("tr:first-child .btn-info").click();
    await page.getByText('Yes').click();
    await page.click("input[value='Continue']");
    await expect(page.locator(".alert-success")).toContainText("Your address has been successfully updated");
  });

  for (const data of testData.invalidAddresses) {
    test(`[Module_QuanLyDiaChi-2] Thêm địa chỉ không hợp lệ (Negative): ${data.scenario}`, async () => {
      console.log(`Running Data Driven Test: ${data.scenario}`);

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
      
      await page.click("text=Address Book");
    });
  }

  test('[Module_QuanLyDiaChi-3] Xóa địa chỉ thành công', async () => {
    console.log("Running: [Module_QuanLyDiaChi-3] Xóa địa chỉ thành công");
    if (!page.url().includes('route=account/address')) {
        await page.click("text=Address Book");
    }
    page.once('dialog', dialog => dialog.accept());
    await page.locator("tr:last-child .btn-danger").click();
    await expect(page.locator(".alert-success")).toContainText("Your address has been successfully deleted");
  });

  test('[Module_ThayDoiMatKhau-1] Đổi mật khẩu thành công (Positive)', async () => {
    console.log("Running: [Module_ThayDoiMatKhau-1] Đổi mật khẩu thành công");
    await page.click("#column-right a:has-text('Password')");

    await page.fill("#input-password", '1234');
    await page.fill("#input-confirm", '1234');
    
    await page.click("input[value='Continue']");
    
    await expect(page.locator(".alert-success")).toContainText("Success: Your password has been successfully updated.");
  });

  test('[Module_ThayDoiMatKhau-2] Đổi mật khẩu khi ô "Confirm Password" không khớp', async () => {
    console.log("Running: [Module_ThayDoiMatKhau-2] Confirm Password không khớp");
    await page.click("#column-right a:has-text('Password')");
    
    await page.fill("#input-password", '12345'); 
    await page.fill("#input-confirm", '123456');
    
    await page.click("input[value='Continue']");
    
    await expect(page.getByText("Password confirmation does not match password!")).toBeVisible();
  });

  for (const data of testData.invalidPasswords) {
    test(`[Module_ThayDoiMatKhau-2] Đổi mật khẩu với độ dài quá ngắn: ${data.length}`, async () => {
      console.log(`Running Data Driven Test: ${data.length}`);
      
      await page.click("#column-right a:has-text('Password')");
      
      await page.fill("#input-password", data.pass);
      await page.fill("#input-confirm", data.pass);
      
      await page.click("input[value='Continue']");
      
      await expect(page.getByText(data.error)).toBeVisible();
    });
  }
});