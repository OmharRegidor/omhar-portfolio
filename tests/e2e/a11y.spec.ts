import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("/ has zero serious/critical a11y violations (dark)", async ({ page }) => {
  // Scroll-reveals leave below-fold blocks transiently at opacity-0 (still in the a11y
  // tree). axe (mis)reads that as a contrast failure by blending the text toward the page
  // background, though that content is off-screen and reduced-motion users see it fully.
  // Emulate reduced motion so every block is revealed → axe assesses the real rendered
  // contrast (what it checked before reveals existed).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
});
