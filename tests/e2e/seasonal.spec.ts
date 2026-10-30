import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Event greetings from public/atelier/seasonal.js on the 3 static Atelier pages. Every test pins the clock, so
// nothing here depends on today's date. Preview links (?theme=...) run on a normal day.
const NORMAL_DAY = new Date("2026-09-15T12:00:00+08:00");
const HALLOWEEN_DAY = new Date("2026-10-29T12:00:00+08:00");
const BIRTHDAY_DAY = new Date("2026-11-08T12:00:00+08:00");
const STORAGE_KEY = "atelier-seasonal-closed";

const pages = ["/", "/automations", "/gear"] as const;
const themes = [
  ["halloween", "Happy Halloween from Omhar"],
  ["christmas", "Merry Christmas from Omhar"],
  ["newyear", "Happy New Year 2027"],
  ["birthday", "It's Omhar's birthday week"],
] as const;

let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.setFixedTime(NORMAL_DAY);
});
test.afterEach(() => {
  expect(errors, "console errors").toHaveLength(0);
});

const open = async (page: Page, url: string) => {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
};

// The strip hides while readable text, the calculator card, the opening text, the deck or the footer sits in its
// corner (the bottom 118px of the window, as wide as the strip). Scroll down from where the page is, 40px at a
// time, until it shows and stays shown for 700ms (a scroll reveal can slide text into the corner just after). Returns the
// scroll position it showed at, or -1.
const findGreeting = (page: Page) =>
  page.evaluate(async () => {
    const sea = document.querySelector("aside.sea");
    if (!sea) return -1;
    const settle = (ms = 30) =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms))));
    const shown = () => !sea.classList.contains("sea-away");
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = Math.round(scrollY); y < max + 40; y += 40) {
      scrollTo({ top: Math.min(y, max), behavior: "instant" });
      await settle();
      if (shown()) {
        await settle(350);
        if (!shown()) continue;
        await settle(350);
        if (shown()) return Math.round(scrollY);
      }
    }
    return -1;
  });
const scrollToGreeting = async (page: Page) => {
  const y = await findGreeting(page);
  expect(y, "scrolled the whole page and the greeting never showed (aside.sea kept sea-away)").toBeGreaterThanOrEqual(0);
  await expect(page.locator("aside.sea")).toBeVisible();
};

const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).boundingBox();
  if (!b) throw new Error(`no box for ${selector}`);
  return b;
};

for (const path of pages) {
  for (const [id, text] of themes) {
    test(`${path}?theme=${id} shows the greeting with its drawings`, async ({ page }) => {
      await open(page, `${path}?theme=${id}`);
      await scrollToGreeting(page);
      const sea = page.locator("aside.sea");
      await expect(sea).toHaveAttribute("data-sea", id);
      await expect(sea.locator(".sea-text")).toHaveText(text);
      const drawings = await sea.locator(".sea-deco svg").count();
      expect(drawings).toBeGreaterThanOrEqual(3);
      expect(drawings).toBeLessThanOrEqual(5);
      await expect(page.locator("a.logo .sea-mark").first()).toBeAttached();
    });
  }

  test(`${path}?theme=christmas has zero serious or critical a11y issues`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, `${path}?theme=christmas`);
    await scrollToGreeting(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test(`${path} on a normal day adds nothing`, async ({ page }) => {
    await open(page, path);
    await expect(page.locator(".sea")).toHaveCount(0);
    await expect(page.locator("#sea-css")).toHaveCount(0);
    await expect(page.locator(".sea-mark")).toHaveCount(0);
  });

  test(`${path}?theme=none inside an event window adds nothing`, async ({ page }) => {
    await page.clock.setFixedTime(HALLOWEEN_DAY);
    await open(page, `${path}?theme=none`);
    await expect(page.locator(".sea")).toHaveCount(0);
    await expect(page.locator("#sea-css")).toHaveCount(0);
  });
}

test("a URL value off the list is ignored and adds no markup", async ({ page }) => {
  let dialog = false;
  page.on("dialog", (d) => {
    dialog = true;
    void d.dismiss();
  });
  await open(page, `/gear?theme=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
  await expect(page.locator(".sea")).toHaveCount(0);
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  expect(dialog).toBe(false);
});

test("the X closes a preview, and the same preview shows again on reload", async ({ page }) => {
  await open(page, "/gear?theme=christmas");
  await scrollToGreeting(page);
  await page.locator("aside.sea button.sea-x").click();
  await expect(page.locator(".sea")).toHaveCount(0);
  await expect(page.locator("#sea-css")).toHaveCount(0);
  expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBeNull();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await scrollToGreeting(page);
});

test("by date, Halloween shows, the X keeps it closed, and the birthday still shows later", async ({ page }) => {
  await page.clock.setFixedTime(HALLOWEEN_DAY);
  await open(page, "/automations");
  // Close the automations preview pill if it shows, so the strip is not held away by it.
  await page.evaluate(() => {
    const pill = document.getElementById("pill");
    if (pill) pill.hidden = true;
  });
  await expect(page.locator("aside.sea .sea-text")).toHaveText("Happy Halloween from Omhar");
  await scrollToGreeting(page);
  await page.locator("aside.sea button.sea-x").click();
  await expect(page.locator(".sea")).toHaveCount(0);
  expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe("halloween-2026");

  await open(page, "/gear");
  await expect(page.locator(".sea")).toHaveCount(0);
  await expect(page.locator("#sea-css")).toHaveCount(0);

  await page.clock.setFixedTime(BIRTHDAY_DAY);
  await open(page, "/gear");
  await expect(page.locator("aside.sea .sea-text")).toHaveText("It's Omhar's birthday week");
  await scrollToGreeting(page);
});

test("on the homepage the strip waits while the opening text and the deck sit in its corner", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, "/?theme=halloween");
  const sea = page.locator("aside.sea");
  await expect(sea).toHaveClass(/sea-away/);
  await expect(sea).toBeHidden();

  await page.locator("#deck").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const deck = document.querySelector("#deck");
    if (deck) scrollTo(0, deck.getBoundingClientRect().top + scrollY + 2000);
  });
  await expect(sea).toBeHidden();

  await scrollToGreeting(page);
});

test("the automations preview pill keeps the strip away while it shows", async ({ page }) => {
  await open(page, "/automations?theme=halloween");
  const sea = page.locator("aside.sea");
  const setPill = (hidden: boolean) =>
    page.evaluate((hidden) => {
      const pill = document.getElementById("pill");
      if (pill) pill.hidden = hidden;
    }, hidden);
  await setPill(true);
  await scrollToGreeting(page);
  await setPill(false);
  await expect(sea).toBeHidden();
  await setPill(true);
  await expect(sea).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`at ${width}px the strip and the chat bubble never overlap`, async ({ page }) => {
    // The homepage greeting first shows well below the deck, so the scroll search there takes a while.
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    for (const path of pages) {
      await open(page, `${path}?theme=halloween`);
      await scrollToGreeting(page);
      await expect(page.locator(".ao-launch")).toHaveClass(/\bon\b/);
      const a = await box(page, "aside.sea");
      const b = await box(page, ".ao-launch");
      const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(overlap, `${path} strip ${JSON.stringify(a)} bubble ${JSON.stringify(b)}`).toBe(false);
    }
  });
}

test("the open phone menu hides the strip", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/gear?theme=christmas");
  const sea = page.locator("aside.sea");
  await scrollToGreeting(page);
  await page.locator(".mm-btn").click();
  await expect(page.locator("html")).toHaveClass(/mm-open/);
  await expect(sea).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveClass(/mm-open/);
  await expect(sea).toBeVisible();
});

const seaAnimations = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".sea, .sea *, .sea-mark")].reduce((n, el) => n + el.getAnimations().length, 0),
  );

test("under reduced motion nothing on the strip animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/gear?theme=halloween");
  await scrollToGreeting(page);
  expect(await seaAnimations(page)).toBe(0);
});

test("with motion allowed, the drawings settle and stop within 6 seconds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/gear?theme=halloween");
  // The entrance is queued as soon as the script runs, then every animation ends on its own, nothing loops.
  expect(await seaAnimations(page)).toBeGreaterThan(0);
  await expect.poll(() => seaAnimations(page), { timeout: 6000 }).toBe(0);
});

// Scroll the whole page, 40px at a time, and at every spot where the greeting shows list what sits under the strip
// or any of its drawings: each line of visible text in main (the box of the words themselves, so a chip's padding
// does not count) and the calculator's result card. Returns { scrollY: [what is covered] } for the bad spots.
const textUnderStrip = (page: Page) =>
  page.evaluate(async () => {
    const sea = document.querySelector("aside.sea");
    const main = document.querySelector("main");
    if (!sea || !main) return { missing: ["no strip or no main"] };
    const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 20))));
    const covered = () => {
      const areas = [sea, ...sea.querySelectorAll(".sea-d")].map((el) => el.getBoundingClientRect());
      const hit = (r: DOMRect) =>
        r.width > 0 && r.height > 0 && areas.some((a) => r.left < a.right && a.left < r.right && r.top < a.bottom && a.top < r.bottom);
      const hits: string[] = [];
      for (const card of main.querySelectorAll(".calc-out")) if (hit(card.getBoundingClientRect())) hits.push(".calc-out");
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        const text = n.textContent?.trim();
        if (!el || !text || getComputedStyle(el).visibility !== "visible") continue;
        range.selectNodeContents(n);
        if ([...range.getClientRects()].some(hit)) hits.push(`${el.tagName.toLowerCase()} "${text.slice(0, 30)}"`);
      }
      return hits;
    };
    const bad: Record<string, string[]> = {};
    let shownAnywhere = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y < max + 40; y += 40) {
      scrollTo({ top: Math.min(y, max), behavior: "instant" });
      await settle();
      if (sea.classList.contains("sea-away")) continue;
      shownAnywhere = true;
      const hits = covered();
      if (hits.length) bad[Math.round(scrollY)] = hits;
    }
    if (!shownAnywhere) bad.never = ["the greeting never showed"];
    return bad;
  });

for (const width of [390, 1440]) {
  test(`at ${width}px the greeting and its drawings never sit on text, anywhere down the page`, async ({ page }) => {
    test.setTimeout(120_000);
    // Reduced motion: the drawings rest in place from the start and scroll reveals show at once, so each spot
    // is measured where it ends up rather than mid-slide.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 844 });
    for (const path of pages) {
      await open(page, `${path}?theme=christmas`);
      expect.soft(await textUnderStrip(page), `${path} at ${width}px: scroll positions where the strip covers text`).toEqual({});
    }
  });
}

test("at 320px every greeting fits on one line and keeps clear of the chat bubble", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const [id, text] of themes) {
    await open(page, `/gear?theme=${id}`);
    await scrollToGreeting(page);
    const label = page.locator("aside.sea .sea-text");
    await expect(label).toHaveText(text);
    const fit = await label.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(fit.scroll, `${id} text is cut off ${JSON.stringify(fit)}`).toBeLessThanOrEqual(fit.client);
    await expect(page.locator(".ao-launch")).toHaveClass(/\bon\b/);
    const a = await box(page, "aside.sea");
    const b = await box(page, ".ao-launch");
    expect(b.x - (a.x + a.width), `${id} gap to the bubble`).toBeGreaterThanOrEqual(8);
  }
});
