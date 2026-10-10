import { test, expect } from "@playwright/test";

// "/", "/automations" and "/gear" are the static Atelier pages (public/atelier, served by rewrites in
// next.config.ts). "/certifications" and "/resume" are still the React routes. Project rows link out,
// so there is no /projects/[slug] page to test.
const routes = ["/", "/automations", "/gear", "/certifications", "/resume"];

for (const route of routes) {
  test(`${route} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    // The automations page keeps a hidden second <main>, so only the visible one counts.
    await expect(page.locator("main:visible")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(errors, `Console errors on ${route}`).toHaveLength(0);
  });
}

test("the Atelier pages load their own fonts, not Google's", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) outside.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.fonts.check('300 16px "Geist"'))).toBe(true);
  expect(outside).toHaveLength(0);
});

test("/automations without a workflow opens the first one", async ({ page }) => {
  await page.goto("/automations");
  await expect(page).toHaveURL(/\/automations#auto-live-inbox$/);
  await expect(page).toHaveTitle(/Live Inbox/);
});

const redirects: [string, RegExp][] = [
  ["/projects", /\/#work$/],
  ["/tech-stack", /\/#stack$/],
  ["/automations/daily-sales-pulse", /\/automations#auto-sales-pulse$/],
];
for (const [from, to] of redirects) {
  test(`${from} redirects to its new home`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  });
}
