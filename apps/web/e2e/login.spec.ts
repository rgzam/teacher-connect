import { expect, test } from '@playwright/test';

test('teacher can sign in with the demo account', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('teacher@teacherconnect.dev');
  await page.getByTestId('login-password').fill('DemoPass123!');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId('teacher-name')).toHaveText('Ly Le');
});
