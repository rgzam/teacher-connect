import { expect, test, type Page } from '@playwright/test';

async function selectFirstSlot(page: Page) {
  const slot = page.getByTestId('time-slot').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
}

async function selectMeetingType(page: Page, name: string) {
  const meetingType = page.getByTestId('meeting-type');
  const value = await meetingType.evaluate((select: HTMLSelectElement, needle) => {
    const option = [...select.options].find((item) => item.text.includes(needle));
    return option?.value ?? '';
  }, name);
  await meetingType.selectOption(value);
}

test.describe('parent booking', () => {
  test('shows virtual and home visit, and requires student names', async ({
    page,
  }) => {
    await page.goto('/book/ly-le');
    const meetingType = page.getByTestId('meeting-type');
    await expect(meetingType).toBeVisible();
    await expect(meetingType).toContainText('Virtual Meeting');
    await expect(meetingType).toContainText('Home Visit');

    await selectFirstSlot(page);
    await page.getByTestId('guardian-first').fill('Elena');
    await page.getByTestId('guardian-last').fill('Rivera');
    await page.getByTestId('confirm-booking').click();

    const studentFirstMissing = await page
      .getByTestId('student-first')
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing);
    expect(studentFirstMissing).toBe(true);
  });

  test('home visit explains that a coworker comes along', async ({ page }) => {
    await page.goto('/book/ly-le');
    await selectMeetingType(page, 'Home Visit');
    await expect(page.getByTestId('home-visit-note')).toBeVisible();
    await expect(page.getByTestId('home-visit-address')).toBeVisible();
    await expect(page.getByTestId('virtual-meeting-name')).toHaveCount(0);
  });

  test('parent can book a virtual meeting', async ({ page }) => {
    const stamp = Date.now();
    await page.goto('/book/ly-le');
    await selectMeetingType(page, 'Virtual Meeting');
    await selectFirstSlot(page);
    await page.getByTestId('guardian-first').fill('Elena');
    await page.getByTestId('guardian-last').fill('Rivera');
    await page.getByTestId('student-first').fill('Playwright');
    await page.getByTestId('student-last').fill(`Student${stamp}`);
    await page.getByTestId('virtual-meeting-name').fill('Rivera family check-in');
    await page.getByTestId('confirm-booking').click();

    await expect(page.getByTestId('booking-confirmation')).toHaveText(
      'You are booked',
    );
    await expect(page.getByText('Virtual meeting name: Rivera family check-in'))
      .toBeVisible();
  });
});
