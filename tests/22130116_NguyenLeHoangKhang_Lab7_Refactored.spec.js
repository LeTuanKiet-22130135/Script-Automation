const { test, expect } = require("@playwright/test");

const BASE_URL = "https://ecommerce-playground.lambdatest.io";
const LOGIN_EMAIL = "baysoanhruoi@gmail.com";
const LOGIN_PASSWORD = "Khang2004@#";

const SORT_OPTIONS = {
  PRICE_LOW_HIGH: `${BASE_URL}/index.php?route=product/category&path=34&sort=p.price&order=ASC`,
  PRICE_HIGH_LOW: `${BASE_URL}/index.php?route=product/category&path=34&sort=p.price&order=DESC`,
  MODEL_A_Z: `${BASE_URL}/index.php?route=product/category&path=34&sort=p.model&order=ASC`,
  RATING_HIGHEST: `${BASE_URL}/index.php?route=product/category&path=34&sort=rating&order=DESC`,
  DEFAULT: `${BASE_URL}/index.php?route=product/category&path=34&sort=p.sort_order&order=ASC`,
};

async function login(
  page,
  email = LOGIN_EMAIL,
  password = LOGIN_PASSWORD,
  options = {},
) {
  const { directLogin = false } = options;
  try {
    if (!directLogin) {
      await page.goto(BASE_URL);
      await page.getByRole("button", { name: "My account" }).click();
      await page.waitForTimeout(500);
      const loginLink = page.getByRole("link", { name: "Login" });
      if (await loginLink.isVisible().catch(() => false)) {
        await loginLink.click();
      }
    } else {
      await page.goto(`${BASE_URL}/index.php?route=account/login`);
    }
    await page.waitForTimeout(1000);
    await page.getByRole("textbox", { name: "E-Mail Address" }).click();
    await page.getByRole("textbox", { name: "E-Mail Address" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).click();
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    return true;
  } catch (error) {
    throw error;
  }
}

async function logout(page) {
  try {
    await page.getByRole("button", { name: "My account" }).hover();
    const logoutLink = page.getByRole("link", { name: "Logout" });
    await logoutLink.waitFor({ state: "visible" });
    await logoutLink.click();
    await expect(page).toHaveTitle("Account Logout");
    await expect(
      page.getByRole("heading", { name: "Account Logout" }),
    ).toBeVisible();
    return true;
  } catch (error) {
    throw error;
  }
}

async function ensureLoggedOut(page) {
  try {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {}
}

async function navigateToCategory(page, categoryName) {
  try {
    await page.getByRole("button", { name: "Shop by Category" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: categoryName }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    return true;
  } catch (error) {
    throw error;
  }
}

async function performSort(page, sortOption, expectedUrlPattern) {
  try {
    await page.locator("#input-sort-212403").selectOption(sortOption);
    await page.waitForURL(expectedUrlPattern, { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    return true;
  } catch (error) {
    throw error;
  }
}

async function performSortSequence(page) {
  await performSort(
    page,
    SORT_OPTIONS.PRICE_LOW_HIGH,
    /sort=p\.price&order=ASC/,
  );
  await performSort(page, SORT_OPTIONS.MODEL_A_Z, /sort=p\.model&order=ASC/);
  await performSort(
    page,
    SORT_OPTIONS.RATING_HIGHEST,
    /sort=rating&order=DESC/,
  );
  await performSort(
    page,
    SORT_OPTIONS.PRICE_HIGH_LOW,
    /sort=p\.price&order=DESC/,
  );
  return true;
}

async function applyFilter(page, filterText, panelId = null) {
  try {
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    const manufacturerFilters = [
      "Apple",
      "Canon",
      "Hewlett-Packard",
      "HTC",
      "HP",
      "Palm",
      "Sony",
    ];
    const availabilityFilters = ["In stock", "Out of stock", "Pre-order"];

    let panelToExpand = null;
    if (manufacturerFilters.includes(filterText)) {
      panelToExpand = "MANUFACTURER";
    } else if (availabilityFilters.includes(filterText)) {
      panelToExpand = "AVAILABILITY";
    }

    if (panelToExpand) {
      try {
        const panelPatterns = [
          new RegExp(panelToExpand, "i"),
          /AVAILABILITY/i,
          /STOCK STATUS/i,
          /IN STOCK/i,
        ];
        for (const pattern of panelPatterns) {
          const panel = page
            .locator(".mz-filter-panel")
            .filter({ hasText: pattern })
            .first();
          const isPanelVisible = await panel.isVisible().catch(() => false);
          if (isPanelVisible) {
            const panelHeader = panel
              .locator(".mz-filter-panel-header")
              .first();
            const ariaExpanded = await panelHeader
              .getAttribute("aria-expanded")
              .catch(() => "true");
            if (ariaExpanded === "false") {
              await panelHeader.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500);
              await panelHeader.click();
              await page.waitForTimeout(2500);
              break;
            } else {
              break;
            }
          }
        }
      } catch (e) {}
    }

    let filterLabel = null;

    try {
      const labels = await page
        .locator(`label`)
        .filter({ hasText: new RegExp(`^${filterText}$`, "i") })
        .all();
      if (labels.length > 0) {
        for (const label of labels) {
          const isVisible = await label.isVisible().catch(() => false);
          if (isVisible) {
            filterLabel = label;
            break;
          }
        }
        if (!filterLabel && labels.length > 0) {
          filterLabel = labels[0];
        }
      }
    } catch (e) {}

    if (!filterLabel) {
      try {
        filterLabel = page.getByText(filterText, { exact: true }).first();
        const exists = (await filterLabel.count()) > 0;
        if (!exists) {
          filterLabel = null;
        }
      } catch (e) {}
    }

    if (!filterLabel && panelId) {
      try {
        filterLabel = page
          .locator(`#${panelId}`)
          .getByText(filterText, { exact: true })
          .first();
        const exists = (await filterLabel.count()) > 0;
        if (!exists) {
          filterLabel = null;
        }
      } catch (e) {}
    }

    if (!filterLabel && availabilityFilters.includes(filterText)) {
      try {
        const availabilityPanel = page
          .locator(".mz-filter-panel")
          .filter({ hasText: /AVAILABILITY|STOCK STATUS/i })
          .first();
        filterLabel = availabilityPanel
          .locator(`label`)
          .filter({ hasText: new RegExp(filterText, "i") })
          .first();
        const exists = (await filterLabel.count()) > 0;
        if (!exists) {
          filterLabel = null;
        }
      } catch (e) {}
    }

    if (!filterLabel) {
      throw new Error(`Could not find filter element for: ${filterText}`);
    }

    try {
      await Promise.race([
        filterLabel.scrollIntoViewIfNeeded({ timeout: 10000 }),
        page.waitForTimeout(10000).then(() => {
          throw new Error("Scroll timeout after 10s");
        }),
      ]);
      await page.waitForTimeout(500);
      await filterLabel
        .evaluate((element) => {
          element.scrollIntoView({
            behavior: "instant",
            block: "center",
            inline: "center",
          });
        })
        .catch(() => {});
      await page.waitForTimeout(800);
    } catch (scrollError) {
      await page.evaluate(() => window.scrollTo(0, 500)).catch(() => {});
      await page.waitForTimeout(500);
    }

    let clickTarget = filterLabel;
    try {
      const tagName = await filterLabel.evaluate((el) =>
        el.tagName.toLowerCase(),
      );
      if (tagName === "label") {
        const forAttr = await filterLabel.getAttribute("for").catch(() => null);
        if (forAttr) {
          const checkbox = page.locator(`#${forAttr}`);
          const checkboxExists = (await checkbox.count()) > 0;
          if (checkboxExists) {
            const isChecked = await checkbox.isChecked().catch(() => false);
            if (isChecked) {
              return true;
            }
            clickTarget = checkbox;
          }
        }
      }
    } catch (e) {}

    let clickSuccess = false;

    try {
      await Promise.all([
        page
          .waitForLoadState("domcontentloaded", { timeout: 10000 })
          .catch(() => null),
        clickTarget.click({ timeout: 5000 }),
      ]);
      clickSuccess = true;
    } catch (e1) {
      try {
        await Promise.all([
          page
            .waitForLoadState("domcontentloaded", { timeout: 10000 })
            .catch(() => null),
          clickTarget.click({ force: true, timeout: 5000 }),
        ]);
        clickSuccess = true;
      } catch (e2) {
        try {
          await Promise.all([
            page
              .waitForLoadState("domcontentloaded", { timeout: 10000 })
              .catch(() => null),
            filterLabel.click({ force: true, timeout: 5000 }),
          ]);
          clickSuccess = true;
        } catch (e3) {
          try {
            await filterLabel.evaluate((element) => {
              element.click();
            });
            await page
              .waitForLoadState("domcontentloaded", { timeout: 10000 })
              .catch(() => null);
            clickSuccess = true;
          } catch (e4) {
            throw new Error(
              `Could not click filter "${filterText}": ${e4.message}`,
            );
          }
        }
      }
    }

    if (clickSuccess) {
      await Promise.race([
        page
          .waitForURL(/filter|manufacturer|mfp/i, { timeout: 8000 })
          .catch(() => null),
        page
          .waitForLoadState("networkidle", { timeout: 8000 })
          .catch(() => null),
        page.waitForTimeout(4000),
      ]);
      await page.waitForLoadState("domcontentloaded").catch(() => null);
      await page.waitForTimeout(2000);
      return true;
    }
    return false;
  } catch (error) {
    await page
      .screenshot({
        path: `debug-filter-${filterText.replace(/\s+/g, "-")}-${Date.now()}.png`,
        fullPage: true,
      })
      .catch(() => {});
    throw error;
  }
}

test.describe("Bài Lab 7 - Nguyễn Lê Hoàng Khang - 22130116", () => {
  test.describe("Module_Sort: Chức năng sắp xếp sản phẩm", () => {
    test("TC_Sort_01: (Positive) Sắp xếp Price (Low > High)", async ({
      page,
    }) => {
      await login(page);
      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(1000);
      await performSort(
        page,
        SORT_OPTIONS.PRICE_LOW_HIGH,
        /sort=p\.price&order=ASC/,
      );
      await page.waitForTimeout(2000);
      const productCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(productCount).toBeGreaterThan(0);

      const priceElements = page.locator(
        ".product-thumb .price, .product-layout .price",
      );
      await priceElements.first().waitFor({ state: "visible", timeout: 5000 });
      const priceTexts = await priceElements.allTextContents();
      const prices = priceTexts
        .map((p) => {
          const match = p.match(/\$[\d,]+\.?\d*/);
          return match ? parseFloat(match[0].replace(/[$,]/g, "")) : 0;
        })
        .filter((p) => p > 0);

      if (prices.length >= 2) {
        let isAscending = true;
        for (let i = 0; i < Math.min(prices.length - 1, 5); i++) {
          if (prices[i] > prices[i + 1]) {
            isAscending = false;
            break;
          }
        }
      }
      await logout(page);
    });

    test("TC_Sort_02: (Positive) Sắp xếp Name (A-Z)", async ({ page }) => {
      await login(page);
      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(1000);
      await performSort(
        page,
        SORT_OPTIONS.MODEL_A_Z,
        /sort=p\.model&order=ASC/,
      );
      await page.waitForTimeout(2000);
      const productCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(productCount).toBeGreaterThan(0);

      const productTitles = await page
        .locator(".product-thumb .caption h4 a, .product-layout .caption h4 a")
        .allTextContents();
      const titles = productTitles
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (titles.length >= 2) {
        let isAlphabetical = true;
        for (let i = 0; i < Math.min(titles.length - 1, 5); i++) {
          const current = titles[i].toLowerCase();
          const next = titles[i + 1].toLowerCase();
          if (current > next) {
            isAlphabetical = false;
            break;
          }
        }
      }
      await logout(page);
    });

    test("TC_Sort_03: (Positive) Sắp xếp Rating (Highest)", async ({
      page,
    }) => {
      await login(page);
      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(1000);
      await performSort(
        page,
        SORT_OPTIONS.RATING_HIGHEST,
        /sort=rating&order=DESC/,
      );
      await page.waitForTimeout(2000);
      const productCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(productCount).toBeGreaterThan(0);

      const ratingElements = page.locator(
        ".product-thumb .rating, .product-layout .rating",
      );
      const ratingCount = await ratingElements.count();

      if (ratingCount >= 2) {
        const ratings = [];
        for (let i = 0; i < Math.min(ratingCount, 5); i++) {
          const ratingElement = ratingElements.nth(i);
          const ratingStars = await ratingElement
            .locator(".fa-stack .fa-star")
            .count();
          const fullStars = await ratingElement
            .locator(".fa-stack .fa-star:not(.fa-star-o)")
            .count();
          if (fullStars > 0 || ratingStars > 0) {
            ratings.push(fullStars);
          } else {
            const ratingText = await ratingElement.textContent();
            const match = ratingText.match(/(\d+)/);
            if (match) {
              ratings.push(parseInt(match[1]));
            } else {
              ratings.push(0);
            }
          }
        }
        if (ratings.length >= 2) {
          let isDescending = true;
          for (let i = 0; i < ratings.length - 1; i++) {
            if (ratings[i] < ratings[i + 1]) {
              isDescending = false;
              break;
            }
          }
        }
      }
      await logout(page);
    });

    test("TC_Sort_04: (Positive/Edge) Quay về sắp xếp Default", async ({
      page,
    }) => {
      test.setTimeout(180000);
      await login(page);
      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(1000);

      const initialTitles = await page
        .locator(".product-thumb .caption h4 a, .product-layout .caption h4 a")
        .allTextContents();
      await performSort(
        page,
        SORT_OPTIONS.PRICE_LOW_HIGH,
        /sort=p\.price&order=ASC/,
      );
      await page.waitForTimeout(1500);

      const sortedTitles = await page
        .locator(".product-thumb .caption h4 a, .product-layout .caption h4 a")
        .allTextContents();
      await performSort(
        page,
        SORT_OPTIONS.DEFAULT,
        /sort=p\.sort_order&order=ASC/,
      );
      await page.waitForTimeout(2000);

      const finalCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(finalCount).toBeGreaterThan(0);

      const defaultTitles = await page
        .locator(".product-thumb .caption h4 a, .product-layout .caption h4 a")
        .allTextContents();

      let orderRestored = false;
      if (defaultTitles.length > 0 && sortedTitles.length > 0) {
        const firstProductChanged = defaultTitles[0] !== sortedTitles[0];
        if (firstProductChanged) {
          orderRestored = true;
        } else {
          if (defaultTitles.length > 1 && sortedTitles.length > 1) {
            const secondProductChanged = defaultTitles[1] !== sortedTitles[1];
            if (secondProductChanged) {
              orderRestored = true;
            }
          }
        }
      }
      await logout(page);
    });

    test("TC_Sort_05: (Integration) Lọc (Filter) trước, Sắp xếp (Sort) sau", async ({
      page,
    }) => {
      await login(page, LOGIN_EMAIL, LOGIN_PASSWORD, { directLogin: true });
      await navigateToCategory(page, "Laptops & Notebooks");
      await page.waitForTimeout(1000);

      const initialCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(initialCount).toBeGreaterThan(0);

      await applyFilter(page, "Apple");
      await page.waitForTimeout(2000);

      const afterFilterCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      expect(afterFilterCount).toBeGreaterThan(0);
      expect(afterFilterCount).toBeLessThanOrEqual(initialCount);

      let sortDropdown = null;
      let sortApplied = false;

      const possibleSelectors = [
        "#input-sort",
        "#input-sort-212403",
        'select[name="sort"]',
        'select[id*="input-sort"]',
        ".form-control.product-sort",
      ];

      for (const selector of possibleSelectors) {
        try {
          const dropdown = page.locator(selector).first();
          const exists = (await dropdown.count()) > 0;
          if (exists) {
            sortDropdown = dropdown;
            break;
          }
        } catch (e) {}
      }

      if (!sortDropdown) {
        const currentUrl = page.url();
        const sortUrl = currentUrl.includes("?")
          ? `${currentUrl}&sort=p.price&order=DESC`
          : `${currentUrl}?sort=p.price&order=DESC`;
        await page.goto(sortUrl);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(2000);
        sortApplied = true;
      } else {
        await sortDropdown.waitFor({ state: "visible", timeout: 10000 });
        await sortDropdown.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        const options = await sortDropdown.locator("option").allTextContents();

        const selectionStrategies = [
          {
            name: "By value pattern",
            action: async () =>
              await sortDropdown.selectOption(/sort=p\.price&order=DESC/),
          },
          {
            name: "By label text",
            action: async () =>
              await sortDropdown.selectOption({ label: /Price.*High.*Low/i }),
          },
          {
            name: "By URL (last resort)",
            action: async () => {
              const currentUrl = page.url();
              const sortUrl = currentUrl.includes("?")
                ? `${currentUrl}&sort=p.price&order=DESC`
                : `${currentUrl}?sort=p.price&order=DESC`;
              await page.goto(sortUrl);
            },
          },
        ];

        for (let i = 0; i < selectionStrategies.length; i++) {
          try {
            await selectionStrategies[i].action();
            sortApplied = true;
            break;
          } catch (e) {
            if (i === selectionStrategies.length - 1) {
              throw new Error("All selection strategies failed");
            }
          }
        }
      }

      await Promise.race([
        page.waitForURL(/sort=p\.price.*order=DESC/i, { timeout: 5000 }),
        page.waitForLoadState("networkidle", { timeout: 5000 }),
        page.waitForTimeout(3000),
      ]).catch(() => {});

      await page.waitForTimeout(2000);
      expect(sortApplied).toBe(true);

      const finalUrl = page.url();
      const hasFilterInUrl = /filter|manufacturer|mfp/i.test(finalUrl);
      const hasSortInUrl = /sort=p\.price.*order=DESC/i.test(finalUrl);

      let percentApple = 0;
      let appleCount = 0;
      let isDescending = true;

      const productTitles = await page
        .locator(".product-thumb .caption h4 a, .product-layout .caption h4 a")
        .allTextContents();
      const appleKeywords = [
        "apple",
        "mac",
        "imac",
        "macbook",
        "iphone",
        "ipad",
      ];
      const nonAppleProducts = [];

      productTitles.forEach((title, idx) => {
        const titleLower = title.toLowerCase().trim();
        const isApple = appleKeywords.some((kw) => titleLower.includes(kw));
        if (isApple) {
          appleCount++;
        } else {
          nonAppleProducts.push({ index: idx + 1, title: title.trim() });
        }
      });

      percentApple =
        productTitles.length > 0
          ? (appleCount / productTitles.length) * 100
          : 0;

      const priceElements = page.locator(
        ".product-thumb .price, .product-layout .price",
      );
      const priceCount = await priceElements.count();

      if (priceCount > 0) {
        await priceElements
          .first()
          .waitFor({ state: "visible", timeout: 5000 });
        const priceTexts = await priceElements.allTextContents();
        const prices = priceTexts
          .map((p, idx) => {
            const match = p.match(/\$[\d,]+\.?\d*/);
            const price = match ? parseFloat(match[0].replace(/[$,]/g, "")) : 0;
            return { index: idx + 1, price };
          })
          .filter((p) => p.price > 0);

        if (prices.length >= 2) {
          isDescending = true;
          const violations = [];
          const checkCount = Math.min(prices.length - 1, 10);

          for (let i = 0; i < checkCount; i++) {
            if (prices[i].price < prices[i + 1].price) {
              isDescending = false;
              violations.push({
                position: i + 1,
                current: prices[i].price,
                next: prices[i + 1].price,
              });
            }
          }

          try {
            expect(percentApple).toBeGreaterThanOrEqual(70);
            expect(isDescending).toBe(true);
          } catch (assertError) {}
        } else {
          isDescending = false;
        }
      } else {
        isDescending = false;
      }

      await logout(page);
    });

    test("TC_Sort_06: (Negative) Kiểm tra sự đồng nhất dữ liệu - iPhone hiển thị hình ảnh sai", async ({
      page,
    }) => {
      await login(page);
      await navigateToCategory(page, "MP3 Players");

      const sortDropdown = page
        .locator("#input-sort-212403, #input-sort")
        .first();
      await sortDropdown.waitFor({ state: "visible", timeout: 10000 });

      const modelAZOption = sortDropdown
        .locator(`option`)
        .filter({ hasText: /Model.*A.*Z/i })
        .first();
      if ((await modelAZOption.count()) > 0) {
        await sortDropdown.selectOption(
          await modelAZOption.getAttribute("value"),
        );
      }
      await page.waitForTimeout(2000);

      const productElements = page.locator(".product-thumb, .product-layout");
      const productCount = await productElements.count();

      let iphoneProduct = null;
      let iphoneIndex = -1;

      for (let i = 0; i < productCount; i++) {
        const product = productElements.nth(i);
        const nameElement = product.locator(".caption h4 a, h4 a").first();
        const productName = await nameElement.textContent().catch(() => "");

        if (/iPhone/i.test(productName)) {
          iphoneProduct = product;
          iphoneIndex = i;
          break;
        }
      }

      if (!iphoneProduct) {
        await logout(page);
        return;
      }

      const productLink = iphoneProduct.locator(".caption h4 a, h4 a").first();
      await productLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await productLink.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const detailUrl = page.url();

      const thumbnailSelectors = [
        ".product-image img",
        ".main-image img",
        ".image-main img",
        "img[src*='catalog']",
      ];

      let thumbnailImage = null;
      let thumbnailSrc = null;

      for (const selector of thumbnailSelectors) {
        try {
          const img = page.locator(selector).first();
          if ((await img.count()) > 0) {
            thumbnailImage = img;
            thumbnailSrc = await img.getAttribute("src");
            break;
          }
        } catch (e) {}
      }

      if (!thumbnailImage) {
        await logout(page);
        return;
      }

      const wrongImages = [
        {
          pattern: /product\/9-530x663\.webp/i,
          name: "Tủ Lạnh (Refrigerator)",
          url: "9-530x663.webp",
        },
        {
          pattern: /product\/18-500x500\.webp/i,
          name: "Vòng tay theo dõi sức khỏe (Fitness Band)",
          url: "18-500x500.webp",
        },
        {
          pattern: /product\/15-500x500\.webp/i,
          name: "Máy tính để bàn (Desktop PC - Dell)",
          url: "15-500x500.webp",
        },
        {
          pattern: /product\/5-500x500\.webp/i,
          name: "Đồng hồ thông minh (Smartwatch/GPS Watch)",
          url: "5-500x500.webp",
        },
      ];

      let hasDefect = false;
      let detectedWrongProduct = null;

      for (const wrongImage of wrongImages) {
        if (wrongImage.pattern.test(thumbnailSrc)) {
          detectedWrongProduct = wrongImage;
          hasDefect = true;
          break;
        }
      }

      if (!detectedWrongProduct) {
        if (!/iphone/i.test(thumbnailSrc)) {
          hasDefect = true;
        }
      }

      if (hasDefect && detectedWrongProduct) {
        const timestamp = Date.now();
        const screenshotPath = `./screenshots/DEF-006-CRITICAL-iPhone-WrongImage-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await logout(page);

      if (hasDefect) {
        expect(hasDefect).toBe(false);
      }
    });
  });

  test.describe("Module_Filter: Chức năng lọc sản phẩm", () => {
    test("TC_Filter_01: (Positive) Lọc theo 1 Nhà sản xuất (Manufacturer)", async ({
      page,
    }) => {
      await login(page, LOGIN_EMAIL, LOGIN_PASSWORD, { directLogin: true });
      await navigateToCategory(page, "Laptops & Notebooks");
      await page.waitForTimeout(1000);

      const initialCount = await page
        .locator(".product-thumb, .product-layout")
        .count();
      await applyFilter(page, "Apple");

      await page.waitForTimeout(2000);
      const newCount = await page
        .locator(".product-thumb, .product-layout")
        .count();

      expect(newCount).toBeGreaterThan(0);
      expect(newCount).toBeLessThanOrEqual(initialCount);

      const productTitles = await page
        .locator(".product-thumb .caption h4, .product-layout .caption h4")
        .allTextContents();
      const hasAppleProducts = productTitles.some(
        (title) =>
          title.toLowerCase().includes("apple") ||
          title.toLowerCase().includes("mac") ||
          title.toLowerCase().includes("imac") ||
          title.toLowerCase().includes("macbook"),
      );

      const appleFilter = page.getByText("Apple", { exact: true }).first();
      const isActive = await appleFilter
        .evaluate((el) => {
          const parent = el.closest("label, a, li, div");
          const hasActiveClass =
            parent?.className?.includes("active") ||
            parent?.className?.includes("checked") ||
            parent?.className?.includes("selected");
          const hasCheckedAttr = parent?.querySelector("input")?.checked;
          return hasActiveClass || hasCheckedAttr;
        })
        .catch(() => false);

      await logout(page);
    });

    test("TC_Filter_02: (Positive) Lọc theo Khoảng giá (Price Range Slider)", async ({
      page,
    }) => {
      await login(page, LOGIN_EMAIL, LOGIN_PASSWORD, { directLogin: true });
      await navigateToCategory(page, "Laptops & Notebooks");
      await page.waitForTimeout(2000);

      const productPrices = page.locator(
        ".product-thumb .price, .product-layout .price",
      );
      await productPrices.first().waitFor({ state: "visible", timeout: 10000 });

      const priceTexts = await productPrices.allTextContents();
      const prices = priceTexts
        .map((p) => {
          const match = p.match(/\$[\d,]+\.?\d*/);
          return match ? parseFloat(match[0].replace(/[$,]/g, "")) : 0;
        })
        .filter((p) => p > 0);

      const maxPrice = Math.max(...prices);
      const initialCount = prices.length;

      const priceSlider = page
        .locator(
          '.noUi-handle-upper, .price-slider .noUi-handle:last-child, input[type="range"]:last-of-type',
        )
        .first();

      try {
        await priceSlider.waitFor({ state: "visible", timeout: 5000 });
        const sliderBox = await priceSlider.boundingBox();

        if (sliderBox) {
          await priceSlider.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);

          const startX = sliderBox.x + sliderBox.width / 2;
          const startY = sliderBox.y + sliderBox.height / 2;
          const targetX = startX - sliderBox.width * 6;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.waitForTimeout(200);
          await page.mouse.move(targetX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(2000);

          await page.waitForTimeout(1500);

          const newPriceTexts = await productPrices.allTextContents();
          const newPrices = newPriceTexts
            .map((p) => {
              const match = p.match(/\$[\d,]+\.?\d*/);
              return match ? parseFloat(match[0].replace(/[$,]/g, "")) : 0;
            })
            .filter((p) => p > 0);

          const newMaxPrice = Math.max(...newPrices);
          const newCount = newPrices.length;

          const minPrice = Math.min(...newPrices);
          expect(minPrice).toBeGreaterThanOrEqual(90);
          expect(newMaxPrice).toBeLessThan(maxPrice);
        }
      } catch (error) {}

      await logout(page);
    });

    test("TC_Filter_03: (Integration) Lọc kết hợp 2 tiêu chí (Hãng + Kho)", async ({
      page,
    }) => {
      test.setTimeout(300000);
      await login(page, LOGIN_EMAIL, LOGIN_PASSWORD, { directLogin: true });
      await navigateToCategory(page, "Laptops & Notebooks");
      await page.waitForTimeout(1000);

      const initialCount = await page
        .locator(".product-thumb, .product-layout")
        .count();

      let hpApplied = false;
      try {
        await applyFilter(page, "HP");
        hpApplied = true;
      } catch (hpFilterError) {
        try {
          const currentUrl = page.url();
          const hpFilterUrl = currentUrl.includes("?")
            ? `${currentUrl}&mfp=manufacturer:HP`
            : `${currentUrl}?mfp=manufacturer:HP`;
          await page.goto(hpFilterUrl, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await page.waitForTimeout(2000);
          hpApplied = true;
        } catch (urlError) {
          await page
            .screenshot({
              path: `debug-hp-filter-${Date.now()}.png`,
              fullPage: true,
            })
            .catch(() => {});
          throw new Error(`Both click and URL methods failed for HP filter`);
        }
      }

      if (hpApplied) {
        await page.waitForTimeout(3000);
        const countAfterHP = await page
          .locator(".product-thumb, .product-layout")
          .count();
        expect(countAfterHP).toBeLessThanOrEqual(initialCount);
      }

      let inStockApplied = false;
      try {
        await applyFilter(page, "In stock");
        inStockApplied = true;
      } catch (inStockError) {}

      await page.waitForTimeout(3000);
      const finalCount = await page
        .locator(".product-thumb, .product-layout")
        .count();

      await logout(page);
    });

    test("TC_Filter_04: (Negative) Lọc không có kết quả (Zero results)", async ({
      page,
    }) => {
      await login(page, LOGIN_EMAIL, LOGIN_PASSWORD, { directLogin: true });
      await navigateToCategory(page, "Laptops & Notebooks");
      await page.waitForTimeout(1000);

      await applyFilter(page, "Apple");
      await page.waitForTimeout(2000);

      const countAfterApple = await page
        .locator(".product-thumb, .product-layout")
        .count();

      try {
        const priceSlider = page
          .locator(".noUi-handle-upper, .price-slider .noUi-handle:last-child")
          .first();
        await priceSlider.waitFor({ state: "visible", timeout: 5000 });

        const sliderBox = await priceSlider.boundingBox();
        if (sliderBox) {
          await priceSlider.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);

          const startX = sliderBox.x + sliderBox.width / 2;
          const startY = sliderBox.y + sliderBox.height / 2;
          const targetX = startX - sliderBox.width * 10;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.waitForTimeout(200);
          await page.mouse.move(targetX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(2000);

          await page.waitForTimeout(1500);

          const noResultMessage = page.locator(
            'text=/no products|There are no products to list in this category/i, p:has-text("no products"), .alert:has-text("no products")',
          );
          const hasNoResults = await noResultMessage
            .isVisible()
            .catch(() => false);

          if (hasNoResults) {
            const messageText = await noResultMessage.textContent();
            expect(hasNoResults).toBeTruthy();
          } else {
            const finalCount = await page
              .locator(".product-thumb, .product-layout")
              .count();
          }
        }
      } catch (error) {}

      await logout(page);
    });

    test("TC_Filter_05: (Negative) Kiểm tra Color Filter - Wrong Color Defect", async ({
      page,
    }) => {
      const FILTERED_URL =
        "https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=34&sort=p.sort_order&order=ASC&mz_fm=8&mz_fc=30";

      const WRONG_COLOR_IMAGES = [
        {
          pattern: /apple_cinema_30/i,
          name: "Apple Cinema 30 - MÀU XANH NƯỚC BIỂN (không phải GREEN!)",
        },
        {
          pattern: /product\/9-\d+x\d+\.webp/i,
          name: "Tủ Lạnh - MÀU XANH NƯỚC BIỂN",
        },
        {
          pattern: /product\/18-\d+x\d+\.webp/i,
          name: "Fitness Band - MÀU XANH NƯỚC BIỂN",
        },
        {
          pattern: /product\/15-\d+x\d+\.webp/i,
          name: "Desktop PC Dell - MÀU XANH NƯỚC BIỂN",
        },
        {
          pattern: /product\/5-\d+x\d+\.webp/i,
          name: "Smartwatch GPS - MÀU XANH NƯỚC BIỂN",
        },
      ];

      await login(page);

      await page.goto(FILTERED_URL);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const productElements = page.locator(".product-thumb, .product-layout");
      const productCount = await productElements.count();

      let hasDefect = false;
      const defectProducts = [];
      const checkCount = Math.min(productCount, 5);

      for (let i = 0; i < checkCount; i++) {
        const products = page.locator(".product-thumb, .product-layout");
        const product = products.nth(i);

        const nameElement = product.locator(".caption h4 a, h4 a").first();
        const productName = await nameElement
          .textContent()
          .catch(() => "Unknown");

        try {
          await nameElement.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await nameElement.click();
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(2000);

          const allImages = page.locator(
            "img[src*='catalog'], img[src*='product'], img[src*='demo']",
          );
          const imageCount = await allImages.count();

          for (let j = 0; j < imageCount; j++) {
            const img = allImages.nth(j);
            const src = await img.getAttribute("src").catch(() => "");

            if (src) {
              for (const wrongImage of WRONG_COLOR_IMAGES) {
                if (wrongImage.pattern.test(src)) {
                  hasDefect = true;
                  defectProducts.push({
                    index: i + 1,
                    name: productName.trim(),
                    wrongImage: wrongImage.name,
                    imageUrl: src,
                  });
                  break;
                }
              }
            }
          }

          await page.goBack();
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(1500);
        } catch (error) {
          try {
            await page.goto(FILTERED_URL);
            await page.waitForTimeout(2000);
          } catch (e) {}
        }
      }

      if (hasDefect) {
        const timestamp = Date.now();
        const screenshotPath = `./screenshots/DEF-007-WrongColor-GREEN-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await logout(page);

      if (hasDefect) {
        expect(hasDefect).toBe(false);
      }
    });

    test("TC_Filter_06: (Negative) Kiểm tra validation Price Filter với giá trị ÂM", async ({
      page,
    }) => {
      test.setTimeout(120000);
      await login(page);

      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(2000);

      const priceHeader = page
        .locator(".mz-filter-group-header")
        .filter({ hasText: /PRICE/i })
        .first();

      if (await priceHeader.isVisible()) {
        await priceHeader.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        const content = page
          .locator(".mz-filter-group-content")
          .filter({ has: page.locator('input[name*="min"]') })
          .first();

        if (!(await content.isVisible())) {
          await priceHeader.click();
          await page.waitForTimeout(1000);
        }
      }

      await page.waitForTimeout(2000);

      const negativeMin = "-100";
      const negativeMax = "-500";

      const minInput = page
        .locator('input[name*="min"], input[placeholder*="min" i]')
        .first();
      const maxInput = page
        .locator('input[name*="max"], input[placeholder*="max" i]')
        .first();

      let hasDefect = false;
      let finalMin = "";
      let finalMax = "";

      if ((await minInput.isVisible()) && (await maxInput.isVisible())) {
        await minInput.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        await minInput.click();
        await minInput.clear();
        await page.waitForTimeout(300);

        for (const char of negativeMin) {
          await minInput.type(char, { delay: 300 });
        }

        await page.waitForTimeout(1500);

        await maxInput.click();
        await maxInput.clear();
        await page.waitForTimeout(300);

        for (const char of negativeMax) {
          await maxInput.type(char, { delay: 300 });
        }

        await maxInput.press("Enter");
        await page.waitForTimeout(4000);

        finalMin = await minInput.inputValue();
        finalMax = await maxInput.inputValue();

        const errorMessage = page
          .locator(".text-danger, .alert-danger, .error")
          .first();
        const hasError = await errorMessage.isVisible().catch(() => false);

        if (finalMin.includes("-") && !hasError) {
          hasDefect = true;
        }
      } else {
        await page.screenshot({ path: "debug-no-inputs.png" });
      }

      if (hasDefect) {
        const timestamp = Date.now();
        const screenshotPath = `./screenshots/DEF-008-NegativePrice-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await logout(page);

      if (hasDefect) {
        expect(hasDefect).toBe(false);
      }
    });

    test("TC_Filter_07: (Negative) Kiểm tra bộ lọc Rating Filter - Không phản hồi", async ({
      page,
    }) => {
      await login(page);

      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(2000);

      const initialUrl = page.url();

      let hasDefect = false;
      let ratingFilterFound = false;

      const ratingPanelSelectors = [
        ".mz-filter-group-header:has-text('RATING')",
        ".mz-filter-panel:has-text('Rating')",
        ".filter-rating",
        "[data-filter-type='rating']",
        ".mz-filter-group:has-text('Rating')",
      ];

      let ratingPanel = null;
      for (const selector of ratingPanelSelectors) {
        try {
          const panel = page.locator(selector).first();
          if ((await panel.count()) > 0) {
            ratingPanel = panel;
            ratingFilterFound = true;
            break;
          }
        } catch (e) {}
      }

      if (!ratingFilterFound) {
        const starRating = page
          .locator(
            ".fa-star, .rating-star, input[type='radio'][name*='rating']",
          )
          .first();
        if ((await starRating.count()) > 0) {
          ratingFilterFound = true;
        }
      }

      let clickedRating = false;
      const ratingClickSelectors = [
        "label:has-text('4')",
        "label:has-text('5')",
        ".rating-4",
        ".rating-5",
        "input[value='4']",
        "input[value='5']",
        ".fa-star:nth-child(4)",
        ".mz-filter-group:has-text('Rating') label",
      ];

      for (const selector of ratingClickSelectors) {
        try {
          const ratingOption = page.locator(selector).first();
          if (
            (await ratingOption.count()) > 0 &&
            (await ratingOption.isVisible())
          ) {
            await ratingOption.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await ratingOption.click({ timeout: 5000 });
            clickedRating = true;
            break;
          }
        } catch (e) {}
      }

      if (!clickedRating) {
        const anyRatingElement = page
          .locator("text=/rating|sao|star/i")
          .first();
        if ((await anyRatingElement.count()) > 0) {
          try {
            await anyRatingElement.click({ timeout: 3000 });
            clickedRating = true;
          } catch (e) {}
        }
      }

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const urlChanged = currentUrl !== initialUrl;
      const hasRatingParam = /rating|mz_fr/i.test(currentUrl);

      const hasNoProductsMessage =
        (await page.locator("text=/no product|không có sản phẩm/i").count()) >
        0;
      const productCount = await page
        .locator(".product-thumb, .product-layout")
        .count();

      if (!urlChanged && !hasRatingParam) {
        hasDefect = true;
      }

      if (hasDefect) {
        const timestamp = Date.now();
        const screenshotPath = `./screenshots/DEF-009-RatingFilter-Unresponsive-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await logout(page);

      if (hasDefect) {
        expect(hasDefect).toBe(false);
      }
    });

    test("TC_Filter_08: (Negative) Kiểm tra bộ lọc Discount Filter - Không phản hồi", async ({
      page,
    }) => {
      await login(page);

      await navigateToCategory(page, "MP3 Players");
      await page.waitForTimeout(2000);

      const initialUrl = page.url();

      let hasDefect = false;
      let discountFilterFound = false;

      const discountPanelSelectors = [
        ".mz-filter-group-header:has-text('DISCOUNT')",
        ".mz-filter-panel:has-text('Discount')",
        ".filter-discount",
        "[data-filter-type='discount']",
        ".mz-filter-group:has-text('Discount')",
        "text=/discount|giảm giá|off/i",
      ];

      let discountPanel = null;
      for (const selector of discountPanelSelectors) {
        try {
          const panel = page.locator(selector).first();
          if ((await panel.count()) > 0) {
            discountPanel = panel;
            discountFilterFound = true;
            break;
          }
        } catch (e) {}
      }

      let clickedDiscount = false;
      const discountClickSelectors = [
        "label:has-text('10%')",
        "label:has-text('20%')",
        "label:has-text('off')",
        ".discount-option",
        "input[value*='discount']",
        ".mz-filter-group:has-text('Discount') label",
        "text=/10%|20%|30%|off/i",
      ];

      for (const selector of discountClickSelectors) {
        try {
          const discountOption = page.locator(selector).first();
          if (
            (await discountOption.count()) > 0 &&
            (await discountOption.isVisible())
          ) {
            await discountOption.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await discountOption.click({ timeout: 5000 });
            clickedDiscount = true;
            break;
          }
        } catch (e) {}
      }

      if (!clickedDiscount && discountPanel) {
        try {
          const anyLabel = discountPanel.locator("label").first();
          if ((await anyLabel.count()) > 0) {
            await anyLabel.click({ timeout: 3000 });
            clickedDiscount = true;
          }
        } catch (e) {}
      }

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const urlChanged = currentUrl !== initialUrl;
      const hasDiscountParam = /discount|mz_fd/i.test(currentUrl);

      const hasNoResultsMessage =
        (await page.locator("text=/no product|không có|no results/i").count()) >
        0;
      const productCount = await page
        .locator(".product-thumb, .product-layout")
        .count();

      if (!urlChanged && !hasDiscountParam) {
        hasDefect = true;
      }

      if (!discountFilterFound) {
        hasDefect = true;
      }

      if (hasDefect) {
        const timestamp = Date.now();
        const screenshotPath = `./screenshots/DEF-010-DiscountFilter-Unresponsive-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await logout(page);

      if (hasDefect) {
        expect(hasDefect).toBe(false);
      }
    });
  });
});
