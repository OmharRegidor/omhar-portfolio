import { test, expect } from "@playwright/test";

// The theme toggle lived in the old homepage's profile card, which "/" no longer serves (the Atelier
// homepage is light only). The React routes still hydrate, so the hydration check stays, on /resume.
test("no hydration warnings on first paint", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/hydrat/i.test(t) || /did not match/i.test(t)) warnings.push(t);
  });
  await page.goto("/resume");
  await page.waitForLoadState("networkidle");
  expect(warnings).toHaveLength(0);
});
