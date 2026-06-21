import { test, expect, type Page } from "@playwright/test";

/**
 * ⌘K command palette — quick-nav overlay.
 * See docs/superpowers/specs/2026-06-17-command-palette-design.md.
 * The trigger button and the combobox both have the accessible name "Go to page";
 * the role disambiguates them.
 */
const trigger = (page: Page) => page.getByRole("button", { name: "Go to page" });
const palette = (page: Page) => page.getByRole("combobox", { name: "Go to page" });

test("opens via the trigger button, filters, and navigates", async ({ page }) => {
  await page.goto("/");
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();

  await palette(page).fill("proj");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
});

test("opens with the Ctrl+K shortcut and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
});

test("works under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();
});

test("is usable on mobile via the visible trigger (no keyboard shortcut)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await expect(trigger(page)).toBeVisible();
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();
});
