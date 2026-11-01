import { test, expect, type Page } from "@playwright/test";

// Pin the clock to a normal day (no seasonal greeting), so these checks never depend on today's date.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-15T12:00:00+08:00"));
});

// The pages have no scroll entrance any more: every block below the fold is fully drawn from the start, so a
// visitor never sees a section waiting or showing through a dot screen.
const opacity = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => Number(getComputedStyle(el).opacity));
const animated = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => el.getAnimations().length);

for (const [route, block] of [
  ["/", ".faq-item"],
  ["/gear", ".pn > a"],
  ["/automations", "#explain > li"],
] as const) {
  test(`${route} shows ${block} at once, before and after it scrolls into view`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    expect(await opacity(page, block)).toBe(1);
    await page.locator(block).first().scrollIntoViewIfNeeded();
    expect(await opacity(page, block)).toBe(1);
    expect(await animated(page, block)).toBe(0);
  });
}

test("the last lines of a page show at the very bottom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/gear");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  expect(await opacity(page, ".foot > :last-child")).toBe(1);
});
