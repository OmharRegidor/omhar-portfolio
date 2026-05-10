import { test, expect } from "@playwright/test";

test("theme toggle persists across reloads", async ({ page }) => {
  await page.goto("/");
  await page.click('button[aria-label*="Switch to light"]');
  const cls = await page.locator("html").getAttribute("class");
  expect(cls).not.toContain("dark");
  await page.reload();
  const cls2 = await page.locator("html").getAttribute("class");
  expect(cls2).not.toContain("dark");
});

test("no hydration warnings on first paint", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/hydrat/i.test(t) || /did not match/i.test(t)) warnings.push(t);
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(warnings).toHaveLength(0);
});
