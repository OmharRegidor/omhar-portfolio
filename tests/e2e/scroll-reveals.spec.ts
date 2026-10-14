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

    // A busy machine can take a few seconds to report the first scroll check, so these waits are generous.
    await expect.poll(() => opacity(page, block), { timeout: 8000 }).toBe(0);
    await page.locator(block).first().scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(page, block), { timeout: 8000 }).toBe(1);
  });
}

test("the last lines of a page still pop in at the very bottom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/gear");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => opacity(page, ".foot > :last-child"), { timeout: 8000 }).toBe(1);
});

test("the homepage numbers count up from 0 and land on their real values", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const facts = page.locator(".qa-facts dd");
  await facts.first().scrollIntoViewIfNeeded();
  // Mid-count the visible digits differ, but the text a screen reader gets is still the real value.
  await expect(page.locator(".qa-facts dd [aria-hidden]").first()).toBeAttached();
  await expect(page.locator(".qa-facts")).toMatchAriaSnapshot(`
    - definition: "9"
    - definition: "3"
    - definition: "2021"
    - definition: "2025"
  `);
  await expect.poll(() => facts.allTextContents(), { timeout: 4000 }).toEqual(["9", "3", "2021", "2025"]);
  await expect(page.locator(".qa-facts dd span")).toHaveCount(0);
});

test("under reduced motion, nothing is held back", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await opacity(page, ".faq-item")).toBe(1);
});
