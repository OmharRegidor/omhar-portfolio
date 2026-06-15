import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Behavioral contract for the Phase 2 reduced-motion guard.
 * The globally-mounted "Ask Omhar AI" launcher uses motion-safe:transition-colors,
 * so it's a good probe: motion when allowed, clamped to ~instant when reduced.
 * See docs/superpowers/specs/2026-06-15-phase2-motion-design-system-design.md.
 */
async function maxTransitionMs(el: Locator): Promise<number> {
  return el.evaluate((node) => {
    const dur = getComputedStyle(node as Element).transitionDuration;
    return Math.max(0, ...dur.split(",").map((d) => parseFloat(d) * 1000));
  });
}

const launcher = (page: Page) => page.getByRole("button", { name: "Ask Omhar AI" });

test("guard clamps transitions to ~instant and disables smooth scroll under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const btn = launcher(page);
  await expect(btn).toBeVisible();

  expect(await maxTransitionMs(btn)).toBeLessThanOrEqual(1);

  const scrollBehavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");
});

test("motion-safe transitions stay active when motion is allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const btn = launcher(page);
  await expect(btn).toBeVisible();

  // Non-zero comes from Tailwind's default transition-duration on transition-colors;
  // proves the motion-safe convention isn't always-off and the guard isn't always-on.
  expect(await maxTransitionMs(btn)).toBeGreaterThan(0);
});
