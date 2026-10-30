import { test, expect } from "@playwright/test";

// Pin the clock to a normal day (no seasonal greeting), so these checks never depend on today's date.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-15T12:00:00+08:00"));
});

// The live assistant, the inbox demo and the time-saved estimate on the Atelier pages. The AI routes are mocked
// here so the checks hold with or without a provider key; the routes themselves are covered by unit tests.

test("the time-saved estimate shows its working and multiplies out", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#calc-hours")).toHaveText("31");
  await expect(page.locator("#calc-money")).toHaveText("$465");
  await page.locator("#calc-hrs").fill("10");
  await page.locator("#calc-ppl").fill("3");
  await page.locator("#calc-rate").fill("20");
  // 10 h x 3 people x 60% x 4.33 weeks = 77.9, so 78 h, and 78 x 20 = 1,560.
  await expect(page.locator("#calc-hours")).toHaveText("78");
  await expect(page.locator("#calc-money")).toHaveText("$1,560");
  await expect(page.locator("#calc-work")).toContainText("10 h a week × 3 people × 60% × 4.33 weeks ≈ 78 h");
});

test("a typed chat question gets the live answer, streamed in", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "x-chat-provider": "anthropic" },
      body: "Omhar builds n8n automations and web apps.\n\nMessage him: https://wa.me/639506009518?text=Hi",
    }),
  );
  await page.goto("/");
  await page.locator(".ao-launch").click();
  await page.locator("#ao-in").fill("What does he build?");
  await page.locator(".ao-form button[type=submit]").click();
  const answer = page.locator(".ao-bot").last();
  await expect(answer).toContainText("Omhar builds n8n automations and web apps.");
  await expect(answer.locator('a[href^="https://wa.me/639506009518"]').first()).toBeVisible();
});

test("when no live model answers, the chat falls back to a prepared answer", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "x-chat-provider": "static" },
      body: "Thanks for reaching out! I can't answer that right now.",
    }),
  );
  await page.goto("/");
  await page.locator(".ao-launch").click();
  await page.locator("#ao-in").fill("What tech stack does he use?");
  await page.locator(".ao-form button[type=submit]").click();
  await expect(page.locator(".ao-bot").last()).toContainText("Next.js, React, TypeScript");
});

test("the inbox demo shows both steps from the live result", async ({ page }) => {
  await page.route("**/api/demo/inbox", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ needsReply: true, reason: "Asks where an order is.", draft: "Hi Maria,\n\nYour order [order number] is on its way.\n\nThe team", provider: "anthropic" }),
    }),
  );
  await page.goto("/automations#auto-live-inbox");
  await page.locator(".try-samples button", { hasText: "Late order" }).click();
  await page.locator(".try-go").click();
  await expect(page.locator("#try-out")).toContainText("Yes, it needs a reply");
  await expect(page.locator(".try-draft")).toContainText("[order number]");
  await expect(page.locator(".try-tag")).toHaveCount(0);
});

test("with the demo offline, a sample shows its result marked as written in advance", async ({ page }) => {
  await page.route("**/api/demo/inbox", (route) =>
    route.fulfill({ status: 503, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: { code: "DEMO_OFFLINE", message: "offline" } }) }),
  );
  await page.goto("/automations#auto-live-inbox");
  await page.locator(".try-samples button", { hasText: "Sales pitch" }).click();
  await page.locator(".try-go").click();
  await expect(page.locator(".try-tag")).toContainText("sample result written in advance");
  await expect(page.locator("#try-out")).toContainText("No reply needed");
});

test("the inbox demo only appears on the CS Live Inbox page", async ({ page }) => {
  await page.goto("/automations#auto-sop");
  await expect(page.locator("#try")).toBeHidden();
});
