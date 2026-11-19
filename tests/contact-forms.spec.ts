import { test, expect, Page, Locator } from '@playwright/test';

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

// Extra time to let the form finish rendering before the screenshot.
// Increase this number (in milliseconds) if the form is still cut off.
const EXTRA_WAIT_MS = 10000;

// Looks in the main page AND inside every iframe
async function findForm(
  page: Page
): Promise<{ description: string; locator: Locator } | null> {
  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const loc = frame.locator(selector);
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const item = loc.nth(i);
        if (await item.isVisible().catch(() => false)) {
          return {
            description: `${selector} in ${frame.url() || 'main page'}`,
            locator: item,
          };
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

    // Scroll down slowly so lazy-loaded sections (like forms) render
    await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight;
      for (let y = 0; y < height; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });

    // Keep checking for up to ~16 seconds
    let found: { description: string; locator: Locator } | null = null;
    for (let attempt = 0; attempt < 8 && !found; attempt++) {
      found = await findForm(page);
      if (!found) await page.waitForTimeout(2000);
    }

    const screenshotPath = `test-results/${site.name.replace(/\s+/g, '-').toLowerCase()}-contact.png`;

    if (!found) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const title = await page.title();
      const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(
        `${site.name}: no contact form found.\n` +
        `Page title: "${title}"\n` +
        `Frames on page: ${page.frames().length}\n` +
        `Page text starts with: "${bodyText}"`
      );
    }

    // Form found: give it extra time to finish rendering, then bring it into view
    await page.waitForTimeout(EXTRA_WAIT_MS);
    await found.locator.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1000);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`${site.name}: form found via ${found.description}`);
  });
}
