import { test, expect } from '@playwright/test';

test.describe('22130026 - Registration & Login Tests', () => {
// Generate a unique email for testing
const uniqueEmail = `registerSuccess+${Date.now()}@gmail.com`;
  test('Register Successfully', async ({ page }) => {
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Fill in First Name, Last Name, Email, Telephone
    await page.fill('#input-firstname', 'Bình');
    await page.fill('#input-lastname', 'Lê Công');
    await page.fill('#input-email', uniqueEmail);
    await page.fill('#input-telephone', '0981661590');

    // Step 5: Enter Password and Confirm Password
    await page.fill('#input-password', 'Testing123!');
    await page.fill('#input-confirm', 'Testing123!');

    // Step 6: Check Privacy Policy checkbox
    // Click the label instead of the checkbox since label intercepts pointer events
    await page.click('label[for="input-agree"]');
    
    // Expected Result 6: Privacy Policy checkbox checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).toBeChecked();

    // Step 7: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 7: Redirect to "My Account" dashboard and see "Your Account Has Been Created!"
    await expect(page).toHaveURL(/account\/success/);
    await expect(page.locator('text="Your Account Has Been Created!"')).toBeVisible();
});

test('Register with Existing Email', async ({ page }) => {
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Fill in First Name, Last Name, Email (already used), and Telephone
    await page.fill('#input-firstname', 'Bình');
    await page.fill('#input-lastname', 'Lê Công');
    // Using an email that was already registered in a previous test
    const existingEmail = 'register1@gmail.com';
    await page.fill('#input-email', existingEmail);
    await page.fill('#input-telephone', '0981661590');

    // Step 5: Enter Password and Confirm Password
    await page.fill('#input-password', 'Testing123!');
    await page.fill('#input-confirm', 'Testing123!');

    // Step 6: Check Privacy Policy checkbox
    // Click the label instead of the checkbox since label intercepts pointer events
    await page.click('label[for="input-agree"]');
    
    // Expected Result 6: Privacy Policy checkbox checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).toBeChecked();

    // Step 7: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 7: Show warning message "E-Mail Address is already registered!" at Register page
    await expect(page).toHaveURL(/account\/register/);
    await expect(page.locator('text="Warning: E-Mail Address is already registered!"')).toBeVisible();
});

test('Register with Mismatch Password', async ({ page }) => {
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Fill in First Name, Last Name, Email, and Telephone
    await page.fill('#input-firstname', 'Bình');
    await page.fill('#input-lastname', 'Lê Công');
    await page.fill('#input-email', 'register2@gmail.com');
    await page.fill('#input-telephone', '0981661590');

    // Step 5: Enter mismatched Password and Confirm Password
    await page.fill('#input-password', 'abc123');
    await page.fill('#input-confirm', 'xyz123');

    // Step 6: Check Privacy Policy checkbox
    // Click the label instead of the checkbox since label intercepts pointer events
    await page.click('label[for="input-agree"]');
    
    // Expected Result 6: Privacy Policy checkbox checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).toBeChecked();

    // Step 7: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 7: Show error message "Password confirmation does not match password!" at Register page
    await expect(page).toHaveURL(/account\/register/);
    await expect(page.locator('text="Password confirmation does not match password!"')).toBeVisible();
});

test('Register without agreeing to Privacy Policy', async ({ page }) => {
    
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Fill in First Name, Last Name, Email, and Telephone
    await page.fill('#input-firstname', 'Bình');
    await page.fill('#input-lastname', 'Lê Công');
    await page.fill('#input-email', 'register3@gmail.com');
    await page.fill('#input-telephone', '0981661590');

    // Step 5: Enter Password and Confirm Password
    await page.fill('#input-password', 'Testing123!');
    await page.fill('#input-confirm', 'Testing123!');

    // Step 6: Don't check Privacy Policy checkbox

    // Expected Result 6: Privacy Policy checkbox is not checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).not.toBeChecked();
    
    // Step 7: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 7: Show error message "You must agree to the Privacy Policy!" at Register page
    await expect(page.locator(':text("Warning: You must agree to the Privacy Policy!")')).toBeVisible();
});

test('Register with empty fields', async ({ page }) => {
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Leave all fields empty

    // Step 5: Check Privacy Policy checkbox
    // Click the label instead of the checkbox since label intercepts pointer events
    await page.click('label[for="input-agree"]');

    // Expected Result 5: Privacy Policy checkbox is checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).toBeChecked();
    
    // Step 6: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 6:  this message pattern appear: 
    // "field _name must be bettween num1 and num2 character"
    await expect(page).toHaveURL(/account\/register/);
    await expect(page.locator('text="First Name must be between 1 and 32 characters!"')).toBeVisible();
    await expect(page.locator('text="Last Name must be between 1 and 32 characters!"')).toBeVisible();
    await expect(page.locator('text="E-Mail Address does not appear to be valid!"')).toBeVisible();
    await expect(page.locator('text="Telephone must be between 3 and 32 characters!"')).toBeVisible();
    await expect(page.locator('text="Password must be between 4 and 20 characters!"')).toBeVisible();
});

test('Register With Invalid Email Format', async ({ page }) => {
   // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Click Register
    await registerOption.click();
    
    // Expected Result 3: Redirect to register page layout
    await expect(page).toHaveURL(/account\/register/);

    // Step 4: Fill in First Name, Last Name, Telephone and wrong email format
    await page.fill('#input-firstname', 'Bình');
    await page.fill('#input-lastname', 'Lê Công');
    await page.fill('#input-telephone', '0981661590');
    await page.fill('#input-email', 'invalid@email');

    // Step 5: Enter Password and Confirm Password
    await page.fill('#input-password', 'Testing123!');
    await page.fill('#input-confirm', 'Testing123!');

    // Step 6: Check Privacy Policy checkbox
    // Click the label instead of the checkbox since label intercepts pointer events
    await page.click('label[for="input-agree"]');
    
    // Expected Result 6: Privacy Policy checkbox checked
    await expect(page.locator('input[type="checkbox"][name="agree"]')).toBeChecked();

    // Step 7: Click Continue
    await page.click('input[value="Continue"]');

    // Expected Result 7: Shows this email format error message at Register page: 
    // "E-Mail Address does not appear to be valid!"
    await expect(page).toHaveURL(/account\/register/);
    await expect(page.locator(':text("does not appear to be valid")')).toBeVisible();
});

test('Login with Correct Email and Password', async ({ page }) => {
    // Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Select Login
    await loginOption.click();
    
    // Expected Result 3: Redirect to login page layout
    await expect(page).toHaveURL(/account\/login/);

    // Step 4: Enter correct Email and Password
    await page.fill('#input-email', uniqueEmail);
    await page.fill('#input-password', 'Testing123!');

    // Step 5: Click Login
    await page.click('input[value="Login"]');

    // Expected Result 5: Redirect to My Account page
    await expect(page).toHaveURL(/account\/account/);
    await expect(page.locator('h1, h2').first()).toContainText('My Account');
});

test('Login with Correct Email but Wrong Password', async ({ page }) => {
// Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Select Login
    await loginOption.click();
    
    // Expected Result 3: Redirect to login page layout
    await expect(page).toHaveURL(/account\/login/);

    // Step 4: Enter correct Email but wrong Password
    await page.fill('#input-email', uniqueEmail);
    await page.fill('#input-password', 'wrongPass');

    // Step 5: Click Login
    await page.click('input[value="Login"]');

    // Expected Result 5: Show an error message about incorrect login
    await expect(page).toHaveURL(/account\/login/);
    await expect(page.locator(':text("No match for E-Mail Address")')).toBeVisible();
});

test('Login with an unregistered Email and correct Password', async ({ page }) => {
// Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Select Login
    await loginOption.click();
    
    // Expected Result 3: Redirect to login page layout
    await expect(page).toHaveURL(/account\/login/);

    // Step 4: Enter unregistered Email and correct Password
    await page.fill('#input-email', 'unknown@gmail.com');
    await page.fill('#input-password', 'Testing123!');

    // Step 5: Click Login
    await page.click('input[value="Login"]');

    // Expected Result 5: Show an error message about incorrect login
    await expect(page).toHaveURL(/account\/login/);
    await expect(page.locator(':text("No match for E-Mail Address")')).toBeVisible();
});

test('Login with empty Email and Password', async ({ page }) => {
// Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Select Login
    await loginOption.click();
    
    // Expected Result 3: Redirect to login page layout
    await expect(page).toHaveURL(/account\/login/);

    // Step 4: Leave email and password blank
    await page.fill('#input-email', '');
    await page.fill('#input-password', '');

    // Step 5: Click Login
    await page.click('input[value="Login"]');

    // Expected Result 5: Show an error message about incorrect login
    await expect(page).toHaveURL(/account\/login/);
    await expect(page.locator('text="Warning: No match for E-Mail Address and/or Password."')).toBeVisible();
});

test('Spam Login Attempts', async ({ page }) => {
// Step 1: Open the website
    await page.goto('https://ecommerce-playground.lambdatest.io/');
    
    // Expected Result 1: Redirect to the homepage layout
    await expect(page).toHaveURL('https://ecommerce-playground.lambdatest.io/');

    // Step 2: Click My account at the top
    // Navigate to account page first, which will show register/login options
    await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=account/account');
    
    // Expected Result 2: Show a menu with 2 options: Register, Login
    const loginOption = page.locator('a:has-text("Login")').last();
    const registerOption = page.locator('a:has-text("Register")').last();
    await expect(registerOption).toBeVisible();
    await expect(loginOption).toBeVisible();

    // Step 3: Select Login
    await loginOption.click();
    
    // Expected Result 3: Redirect to login page layout
    await expect(page).toHaveURL(/account\/login/);

    // Step 4: Enter correct Email but wrong Password
    // Step 5: Click Login
    // Step 6: Repeat step 4 and 5 to reach max login attempts with while loop
    let attempts = 0;
    const maxAttempts = 10; // Assuming the limit is 10 attempts
    while (attempts < maxAttempts) {
        await page.fill('#input-email', uniqueEmail);
        await page.fill('#input-password', 'wrongPass');
        await page.click('input[value="Login"]');
        attempts++;
    }
    await page.waitForTimeout(1000); // Wait for 1 second before checking the lock message

    // Expected Result 6: Show an error message about account being locked
    await expect(page.locator(':text("Warning: Your account has exceeded allowed number of login attempts. Please try again in 1 hour.")')).toBeVisible();
});
});