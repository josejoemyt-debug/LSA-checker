import { test, expect, Page } from '@playwright/test';

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

const selectors = [
  'form',
  'input[type="email"]',
  'input[name*="email" i]',
  'input[placeholder*="email" i]',
  'textarea',
  'input[type="text"]',
  'button[type="submit"]',
];

// Looks in the main page AND inside every iframe
async function findForm(page: Page): Promise<string | null> {
  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const loc = frame.locator(selector);
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < Math.min(count, 3); i++) {
        if (await loc.nth(i).isVisible().catch(() => false)) {
          return `${selector} in ${frame.url() || 'main page'}`;
        }
      }
    }
  }
  return null;
}

for (const site of sites) {
  test(`${site.name} – page loads and contact form is visible`, async ({ page }) => {
    const response = await page.goto(site.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    expect(response?.status(), `${site.name} should return a successful status`).toBeLessThan(400);

    // Let scripts and embedded forms finish loading
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Keep checking for up to ~16 seconds
    let found: string | null = null;
    for (let attempt = 0; attempt < 8 && !found; attempt++) {
      found = await findForm(page);
      if (!found) await page.waitForTimeout(2000);
    }

    // Always save a screenshot so you can see what the browser saw
    await page.screenshot({
      path: `test-results/${site.name.replace(/\s+/g, '-').toLowerCase()}-contact.png`,
      fullPage: true,
    });

    if (!found) {
      const title = await page.title();
      const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(
        `${site.name}: no contact form found.\n` +
        `Page title: "${title}"\n` +
        `Frames on page: ${page.frames().length}\n` +
        `Page text starts with: "${bodyText}"`
      );
    }

    console.log(`${site.name}: form found via ${found}`);
  });
}
