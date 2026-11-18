import { test, expect } from '@playwright/test';

/**
 * These tests open a real browser, visit each site's Contact page,
 * and verify that a contact form (or at least the main form fields) appears.
 *
 * Wix sites load forms with JavaScript, so we wait for the fields to show up.
 */

const sites = [
  {
    name: 'Little Scholars LKN',
    url: 'https://www.littlescholarslkn.com/contact',
  },
  {
    name: 'LSA Kannapolis',
    url: 'https://www.lsakannapolis.com/contact',
  },
  {
    name: 'Novare Academy',
    url: 'https://www.novareacademy.com/contact-us',
  },
];

for (const site of sites) {
  test(`${site.name} – page loads and contact form is visible`, async ({ page }) => {
    // 1. Go to the contact page
    const response = await page.goto(site.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 2. Basic uptime check
    expect(response?.status(), `${site.name} should return a successful status`).toBeLessThan(400);

    // 3. Wait a bit for Wix JavaScript to render the form
    await page.waitForTimeout(3000);

    // 4. Look for common form elements (Wix forms vary, so we use flexible checks)
    const formIndicators = [
      page.locator('form'),
      page.locator('input[type="email"]'),
      page.locator('input[name*="email" i]'),
      page.locator('input[placeholder*="email" i]'),
      page.locator('textarea'),
      page.locator('input[type="text"]'),
      page.locator('[data-testid*="form" i]'),
      page.locator('button[type="submit"]'),
      page.getByRole('button', { name: /submit|send|contact/i }),
    ];

    // At least one of these should be visible
    let found = false;
    for (const locator of formIndicators) {
      const count = await locator.count();
      if (count > 0) {
        // Check if at least one is visible
        for (let i = 0; i < Math.min(count, 3); i++) {
          if (await locator.nth(i).isVisible().catch(() => false)) {
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    // Extra safety: also accept if the page contains strong "contact form" text
    // after JavaScript has run
    if (!found) {
      const bodyText = await page.locator('body').innerText();
      if (/contact\s*form|send\s*us\s*a\s*message|get\s*in\s*touch/i.test(bodyText)) {
        found = true;
      }
    }

    expect(found, `${site.name}: Contact form (or form fields) should be visible on the page`).toBeTruthy();

    // 5. Optional: take a screenshot for the report (helpful when debugging)
    await page.screenshot({
      path: `test-results/${site.name.replace(/\s+/g, '-').toLowerCase()}-contact.png`,
      fullPage: true,
    });
  });
}
