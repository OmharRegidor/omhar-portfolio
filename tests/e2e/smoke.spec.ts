import { test, expect } from "@playwright/test";

const routes = ["/", "/projects", "/projects/first-project", "/tech-stack", "/certifications"];

for (const route of routes) {
  test(`${route} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(errors, `Console errors on ${route}`).toHaveLength(0);
  });
}
