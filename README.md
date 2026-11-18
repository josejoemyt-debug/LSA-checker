# Website & Contact Form Monitor

This project uses **Playwright** to automatically check that your websites are up and that the Contact forms are loading correctly.

### Sites monitored
- https://www.littlescholarslkn.com/contact
- https://www.lsakannapolis.com/contact
- https://www.novareacademy.com/contact-us

### What it checks
1. The contact page returns a successful HTTP status
2. The page loads in a real browser
3. A contact form (or typical form fields like email, message, submit) becomes visible

---

## How to set it up on GitHub

1. Create a new GitHub repository (can be private).
2. Upload all the files from this folder into the repository.
3. Go to the **Actions** tab in your repository.
4. You should see the workflow **"Check Websites & Contact Forms"**.
5. Click **Run workflow** to test it manually the first time.

The workflow is already configured to run **automatically every 6 hours**.

---

## Notifications (optional but recommended)

To get notified when a check fails:

1. In your GitHub repository go to **Settings → Secrets and variables → Actions**.
2. You can later add email/Slack/Discord notifications (I can help you add this if you want).

---

## Running locally (optional)

```bash
npm install
npx playwright install chromium
npm test
```

---

## Changing the schedule

Edit `.github/workflows/check-sites.yml` and change the cron line:

```yaml
- cron: '0 */6 * * *'   # every 6 hours
```

Examples:
- `0 * * * *`     → every hour
- `0 */3 * * *`   → every 3 hours
- `0 8 * * *`     → every day at 08:00 UTC
