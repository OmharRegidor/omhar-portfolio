import { test, expect, type Page } from "@playwright/test";

/**
 * Homepage scroll-reveals. The Reveal wrapper is the `order-*` div around each
 * section; we read its computed opacity. See
 * docs/superpowers/specs/2026-06-16-scroll-reveals-design.md.
 */
function wrapperOpacity(page: Page, sectionId: string): Promise<number | null> {
  return page.evaluate((id) => {
    const labelled = document.getElementById(id); // the section's <h2>
    const wrap = labelled?.closest('div[class*="order-"]');
    return wrap ? Number(getComputedStyle(wrap).opacity) : null;
  }, sectionId);
}

test("a below-fold section starts hidden, then fades up on scroll-in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Short viewport so the Gallery (last block) is reliably below the fold.
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/");
  await page.waitForLoadState("networkidle"); // let layout settle (images/fonts)

  // The IntersectionObserver hides below-fold blocks once it reports post-layout.
  await expect
    .poll(() => wrapperOpacity(page, "section-gallery"), { timeout: 3000 })
    .toBeLessThan(0.1);

  await page.locator('section[aria-labelledby="section-gallery"]').scrollIntoViewIfNeeded();
  await expect
    .poll(() => wrapperOpacity(page, "section-gallery"), { timeout: 3000 })
    .toBeGreaterThan(0.99);
});

test("under reduced motion, deep sections are visible without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect.poll(() => wrapperOpacity(page, "section-gallery"), { timeout: 2000 }).toBe(1);
});
