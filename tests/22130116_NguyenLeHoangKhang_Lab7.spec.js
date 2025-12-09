const { test, expect } = require("@playwright/test");

test.describe("Bài Lab 7 - Nguyễn Lê Hoàng Khang - 22130116", () => {
  test("Chức năng 1: Sắp xếp sản phẩm (MP3 Players) và Đăng xuất", async ({
    page,
  }) => {
    await page.goto("https://ecommerce-playground.lambdatest.io/");
    await page.getByRole("button", { name: "My account" }).click();

    await page.getByRole("textbox", { name: "E-Mail Address" }).click();
    await page
      .getByRole("textbox", { name: "E-Mail Address" })
      .fill("baysoanhruoi@gmail.com");
    await page.getByRole("textbox", { name: "Password" }).click();
    await page.getByRole("textbox", { name: "Password" }).fill("Khang2004@#");
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByRole("button", { name: "Shop by Category" }).click();
    await page.getByRole("link", { name: "MP3 Players" }).click();
    await page
      .locator("#input-sort-212403")
      .selectOption(
        "https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=34&sort=p.price&order=ASC"
      );
    await page.waitForURL(/sort=p\.price&order=ASC/);
    await page
      .locator("#input-sort-212403")
      .selectOption(
        "https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=34&sort=p.model&order=ASC"
      );
    await page.waitForURL(/sort=p\.model&order=ASC/);
    await page
      .locator("#input-sort-212403")
      .selectOption(
        "https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=34&sort=rating&order=DESC"
      );
    await page.waitForURL(/sort=rating&order=DESC/);
    await page
      .locator("#input-sort-212403")
      .selectOption(
        "https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=34&sort=p.price&order=DESC"
      );
    await page.waitForURL(/sort=p\.price&order=DESC/);
    await page.getByRole("button", { name: "My account" }).hover();
    const logoutLink = page.getByRole("link", { name: "Logout" });

    await logoutLink.waitFor({ state: "visible" });
    await logoutLink.click();

    await expect(page).toHaveTitle("Account Logout");
    await expect(
      page.getByRole("heading", { name: "Account Logout" })
    ).toBeVisible();

    console.log(
      "--> [Khang - 22130116] Chức năng 1: Sắp xếp và Đăng xuất thành công!"
    );
  });

  test("Chức năng 2: Lọc sản phẩm (Laptop) và Đăng xuất", async ({ page }) => {
    await page.goto("https://ecommerce-playground.lambdatest.io/");
    await page.getByRole("button", { name: "My account" }).click();
    await page.getByRole("link", { name: "Login" }).click();

    await page
      .getByRole("textbox", { name: "E-Mail Address" })
      .fill("baysoanhruoi@gmail.com");
    await page.getByRole("textbox", { name: "Password" }).fill("Khang2004@#");
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByRole("button", { name: "Shop by Category" }).click();
    await page.getByRole("link", { name: "Laptops & Notebooks" }).click();
    await page
      .locator("#mz-filter-panel-0-5")
      .getByText("In stock", { exact: true })
      .first()
      .click();

    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "My account" }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "Account Logout" })
    ).toBeVisible();

    console.log(
      "--> [Khang - 22130116] Chức năng 2: Lọc và Đăng xuất thành công!"
    );
  });
});
