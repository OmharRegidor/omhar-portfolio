import { test, expect, type Page } from "@playwright/test";

// Scroll pop-ins from public/atelier/reveal.js. A block below the fold is held invisible by a paused Web
// Animation, so its computed opacity reads 0 until it scrolls in, then 1 once the pop has landed.
const opacity = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => Number(getComputedStyle(el).opacity));

for (const [route, block] of [
  ["/", ".faq-item"],
  ["/gear", ".pn > a"],
  ["/automations", "#explain > li"],
] as const) {
  test(`${route} pops ${block} in when it scrolls into view`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    await expect.poll(() => opacity(page, block), { timeout: 3000 }).toBe(0);
    await page.locator(block).first().scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(page, block), { timeout: 3000 }).toBe(1);
  });
}

test("the last lines of a page still pop in at the very bottom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/gear");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => opacity(page, ".foot > :last-child"), { timeout: 3000 }).toBe(1);
});

test("under reduced motion, nothing is held back", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await opacity(page, ".faq-item")).toBe(1);
});
