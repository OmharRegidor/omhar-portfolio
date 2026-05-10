import { test, expect } from "@playwright/test";

test("playwright works", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
