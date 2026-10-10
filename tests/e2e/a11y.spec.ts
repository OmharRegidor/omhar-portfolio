import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/automations", "/gear", "/resume"]) {
  test(`${route} has zero serious/critical a11y violations`, async ({ page }) => {
    // Reduced motion so entrance fades and slideshows sit still, and axe reads the real rendered contrast
    // instead of text caught mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
}
