import { test, expect, type Page } from "@playwright/test";

// Goal checks for the event greetings (.noxa/add-seasonal-holiday-themes/goals.md, G1 to G11). Each test acts out
// one goal the way a visitor would. Every test pins the clock, so nothing here depends on today's date.
test.use({ video: "on" });

const NORMAL_DAY = new Date("2026-09-15T12:00:00+08:00");
const HALLOWEEN_DAY = new Date("2026-10-29T12:00:00+08:00");
const BIRTHDAY_DAY = new Date("2026-11-08T12:00:00+08:00");
const STORAGE_KEY = "atelier-seasonal-closed";
const INK = "rgb(18, 20, 19)";
const PAPER = "rgb(247, 246, 242)";

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

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

// The greeting hides while readable text, the calculator card, the opening text, the deck or the footer sits in
// its corner (the bottom 118px of the window, as wide as the strip). Scroll down from where the page is, 40px at a
// time, until it shows and stays shown for 700ms. Same helper as tests/e2e/seasonal.spec.ts (a spec file cannot
// import another spec without registering its tests twice).
const scrollToGreeting = async (page: Page) => {
  const y = await page.evaluate(async () => {
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
  expect(y, "scrolled the whole page and the greeting never showed (aside.sea kept sea-away)").toBeGreaterThanOrEqual(0);
  await expect(page.locator("aside.sea")).toBeVisible();
};

const box = async (page: Page, selector: string): Promise<Box> => {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`no box for ${selector}`);
  return b;
};

const seaAnimations = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".sea, .sea *, .sea-mark")].reduce((n, el) => n + el.getAnimations().length, 0),
  );

// The drawings: how many, whether every line is ink or paper, and whether each rests on the pill's top edge.
const drawings = (page: Page) =>
  page.evaluate(() => {
    const sea = document.querySelector("aside.sea");
    if (!sea) return null;
    const top = sea.getBoundingClientRect().top;
    const items = [...sea.querySelectorAll(".sea-d")];
    const strokes = new Set(
      [...sea.querySelectorAll(".sea-d .ink, .sea-d .halo")].map((g) => getComputedStyle(g).stroke),
    );
    const fills = new Set([...sea.querySelectorAll(".sea-d svg")].map((s) => getComputedStyle(s).fill));
    const bottoms = items.map((d) => Math.round(d.getBoundingClientRect().bottom - top));
    return { count: items.length, strokes: [...strokes], fills: [...fills], bottoms };
  });

const expectGreeting = async (page: Page, id: string, text: string) => {
  const sea = page.locator("aside.sea");
  await scrollToGreeting(page);
  await expect(sea).toHaveAttribute("data-sea", id);
  await expect(sea.locator(".sea-text")).toHaveText(text);
  // Wait for the drift to end, then check the drawings are resting on the pill's top edge.
  await expect.poll(() => seaAnimations(page), { timeout: 5000 }).toBe(0);
  const d = await drawings(page);
  if (!d) throw new Error("no strip");
  expect(d.count).toBeGreaterThanOrEqual(3);
  expect(d.count).toBeLessThanOrEqual(5);
  // Each drawing's foot tucks at most 12px into the pill's top edge (the design overlaps it by 9px), or floats a little above.
  for (const b of d.bottoms) expect(b, `drawing bottom ${b}px from the pill top`).toBeLessThanOrEqual(12);
  for (const b of d.bottoms) expect(b).toBeGreaterThanOrEqual(-40);
  // Black and white only.
  expect(d.fills).toEqual(["none"]);
  for (const s of d.strokes) expect([INK, PAPER]).toContain(s);
};

for (const width of [390, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("G1 Each preview link shows its theme on all three pages", async ({ page }) => {
      // Four pages, each waiting about 5 seconds for its drawings to settle.
      test.setTimeout(120_000);
      await test.step("/gear?theme=christmas shows the Christmas greeting", async () => {
        await open(page, "/gear?theme=christmas");
        await expectGreeting(page, "christmas", "Merry Christmas from Omhar");
      });
      await test.step("/automations?theme=halloween shows the Halloween greeting", async () => {
        await open(page, "/automations?theme=halloween");
        await expectGreeting(page, "halloween", "Happy Halloween from Omhar");
      });
      await test.step("/?theme=birthday shows the birthday greeting further down", async () => {
        await open(page, "/?theme=birthday");
        await expectGreeting(page, "birthday", "It's Omhar's birthday week");
      });
      await test.step("/?theme=newyear shows the New Year greeting further down", async () => {
        await open(page, "/?theme=newyear");
        await expectGreeting(page, "newyear", "Happy New Year 2027");
      });
    });

    test("G5 A normal day looks exactly like today", async ({ page }) => {
      for (const path of ["/", "/automations", "/gear"]) {
        await test.step(`${path} on 15 September has nothing added`, async () => {
          await open(page, path);
          await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
          await expect(page.locator(".sea")).toHaveCount(0);
          await expect(page.locator("#sea-css")).toHaveCount(0);
          await expect(page.locator(".sea-mark")).toHaveCount(0);
          await expect(page.locator("a.logo").first().locator("> *")).toHaveCount(2);
        });
      }
      await test.step("/gear?theme=none on 29 October has nothing added", async () => {
        await page.clock.setFixedTime(HALLOWEEN_DAY);
        await open(page, "/gear?theme=none");
        await expect(page.locator(".sea")).toHaveCount(0);
        await expect(page.locator("#sea-css")).toHaveCount(0);
        await expect(page.locator(".sea-mark")).toHaveCount(0);
      });
    });

    test("G6 The header is never covered and still turns into the floating bar", async ({ page }) => {
      await test.step("at the top of /?theme=halloween the header is flat and uncovered", async () => {
        await open(page, "/?theme=halloween");
        const top = page.locator(".top");
        await expect(top).toBeVisible();
        await expect(top).not.toHaveClass(/\bsolid\b/);
        if (width > 860) await expect(top.locator(".nav a").first()).toBeVisible();
        else await expect(page.locator(".mm-btn")).toBeVisible();
        const header = await box(page, ".top");
        const sea = await box(page, "aside.sea");
        expect(overlaps(header, sea)).toBe(false);
        expect(sea.y).toBeGreaterThan(900 / 2);
        // The point under the logo belongs to the header, nothing sits on it.
        const onLogo = await page.evaluate(() => {
          const logo = document.querySelector("a.logo");
          if (!logo) return false;
          const r = logo.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + 10, r.top + r.height / 2);
          return Boolean(hit && hit.closest(".top"));
        });
        expect(onLogo).toBe(true);
      });
      await test.step("after 200px of scroll it becomes the floating bar", async () => {
        await page.mouse.wheel(0, 200);
        const top = page.locator(".top");
        await expect(top).toHaveClass(/\bsolid\b/);
        await expect.poll(async () => (await box(page, ".top")).y, { timeout: 2000 }).toBeGreaterThanOrEqual(8);
        const radius = await top.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
        expect(radius).toBeGreaterThanOrEqual(20);
      });
      await test.step("/gear?theme=halloween keeps the header clear too", async () => {
        await open(page, "/gear?theme=halloween");
        const header = await box(page, ".top");
        const sea = await box(page, "aside.sea");
        expect(overlaps(header, sea)).toBe(false);
        expect(sea.y).toBeGreaterThan(900 / 2);
      });
    });

    test("G7 The project deck on the homepage works as before with a theme on", async ({ page }) => {
      await open(page, "/?theme=christmas");
      const sea = page.locator("aside.sea");
      const cap = page.locator(".dk-cap .h");
      const deckAt = (k: number) =>
        page.evaluate((k) => {
          const dk = document.getElementById("deck");
          if (!dk) return;
          const n = dk.querySelectorAll(".dk-card").length;
          const top = dk.getBoundingClientRect().top + scrollY;
          scrollTo(0, top + ((dk.offsetHeight - innerHeight) * k) / (n - 1));
        }, k);

      await test.step("the deck pins full screen with the greeting hidden", async () => {
        await deckAt(0);
        await expect(page.locator("#deck")).toHaveClass(/\bon\b/);
        const stage = await box(page, ".dk-stage");
        expect(Math.abs(stage.y)).toBeLessThanOrEqual(1);
        expect(stage.height).toBeGreaterThanOrEqual(899);
        await expect(sea).toHaveClass(/sea-away/);
        await expect(sea).toBeHidden();
      });
      const names: string[] = [];
      for (const k of [0, 1, 2]) {
        await test.step(`card ${k + 1} shows with its caption fully visible`, async () => {
          await deckAt(k);
          const previous = names.at(-1);
          if (previous !== undefined) await expect(cap).not.toHaveText(previous);
          await expect(cap).not.toHaveText("");
          names.push((await cap.textContent()) ?? "");
          await expect(page.locator(".dk-cap")).toBeInViewport({ ratio: 1 });
          await expect(sea).toBeHidden();
        });
      }
      await test.step("the greeting comes back after the deck", async () => {
        expect(new Set(names).size).toBe(3);
        await scrollToGreeting(page);
        await expect(sea).not.toHaveClass(/sea-away/);
      });
    });

    test("G8 The chat bubble opens and is never blocked by the greeting", async ({ page }) => {
      await test.step("the pill and the bubble sit side by side", async () => {
        await open(page, "/gear?theme=newyear");
        await scrollToGreeting(page);
        await expect(page.locator(".ao-launch")).toHaveClass(/\bon\b/);
        const a = await box(page, "aside.sea");
        const b = await box(page, ".ao-launch");
        expect(overlaps(a, b), `strip ${JSON.stringify(a)} bubble ${JSON.stringify(b)}`).toBe(false);
        expect(b.x - (a.x + a.width)).toBeGreaterThanOrEqual(8);
      });
      await test.step("pressing the bubble opens the chat panel", async () => {
        await page.locator(".ao-launch").click();
        await expect(page.locator(".ao-panel")).toHaveClass(/\bon\b/);
        await expect(page.locator(".ao-panel")).toBeVisible();
      });
    });

    test("G11 A themed drawing sits next to the name in the top menu", async ({ page }) => {
      const header = async () =>
        page.evaluate(() => {
          const top = document.querySelector(".top");
          const logo = document.querySelector("a.logo");
          if (!top || !logo) return null;
          return { topH: Math.round(top.getBoundingClientRect().height), logoY: Math.round(logo.getBoundingClientRect().y) };
        });
      const expectMark = async () => {
        const mark = page.locator("a.logo .sea-mark");
        await expect(mark).toHaveCount(1);
        await expect(mark).toBeVisible();
        const colours = await page.evaluate(() => {
          const logo = document.querySelector("a.logo");
          const mark = document.querySelector("a.logo .sea-mark");
          return logo && mark ? [getComputedStyle(mark).stroke, getComputedStyle(logo).color] : [];
        });
        expect(colours[0]).toBe(colours[1]);
      };
      for (const url of ["/?theme=halloween", "/automations?theme=christmas", "/gear?theme=birthday"]) {
        await test.step(`${url} shows the drawing after the name, header unchanged`, async () => {
          const plain = url.replace(/theme=\w+/, "theme=none");
          await open(page, plain);
          const before = await header();
          await open(page, url);
          await expectMark();
          expect(await header()).toEqual(before);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        });
      }
      await test.step("the X removes the drawing with the greeting", async () => {
        await scrollToGreeting(page);
        await page.locator("aside.sea button.sea-x").click();
        await expect(page.locator(".sea")).toHaveCount(0);
        await expect(page.locator(".sea-mark")).toHaveCount(0);
      });
      await test.step("?theme=none shows no drawing", async () => {
        await open(page, "/?theme=none");
        await expect(page.locator(".sea-mark")).toHaveCount(0);
      });
    });
  });
}

test.describe("at 390px only", () => {
  test.use({ viewport: { width: 390, height: 900 } });

  test("G2 The X hides the greeting and it stays hidden until the next event", async ({ page }) => {
    await page.clock.setFixedTime(HALLOWEEN_DAY);
    await test.step("/gear shows Halloween by date", async () => {
      await open(page, "/gear");
      await expect(page.locator("aside.sea .sea-text")).toHaveText("Happy Halloween from Omhar");
      await scrollToGreeting(page);
    });
    await test.step("pressing Close the greeting hides it and saves it", async () => {
      await page.getByRole("button", { name: "Close the greeting" }).click();
      await expect(page.locator(".sea")).toHaveCount(0);
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe("halloween-2026");
    });
    await test.step("/automations shows no greeting", async () => {
      await open(page, "/automations");
      await expect(page.locator(".sea")).toHaveCount(0);
    });
    await test.step("/ shows no greeting after a screen of scroll", async () => {
      await open(page, "/");
      await page.mouse.wheel(0, 900);
      await expect(page.locator(".sea")).toHaveCount(0);
      await expect(page.locator(".sea-mark")).toHaveCount(0);
    });
    await test.step("on 8 November /gear shows the birthday greeting", async () => {
      await page.clock.setFixedTime(BIRTHDAY_DAY);
      await open(page, "/gear");
      await expect(page.locator("aside.sea .sea-text")).toHaveText("It's Omhar's birthday week");
      await scrollToGreeting(page);
    });
  });

  test("G9 The phone menu covers the greeting", async ({ page }) => {
    await open(page, "/gear?theme=halloween");
    const sea = page.locator("aside.sea");
    await test.step("the greeting shows", async () => {
      await scrollToGreeting(page);
    });
    await test.step("the open menu hides every part of the greeting", async () => {
      await page.locator(".mm-btn").click();
      await expect(page.locator("html")).toHaveClass(/mm-open/);
      await expect(sea).toBeHidden();
      const shown = await page.evaluate(
        () => [...document.querySelectorAll(".sea, .sea *")].filter((el) => getComputedStyle(el).visibility === "visible").length,
      );
      expect(shown).toBe(0);
      await expect(page.locator(".mm-panel")).toBeVisible();
    });
    await test.step("closing the menu brings the greeting back", async () => {
      await page.locator(".mm-btn").click();
      await expect(page.locator("html")).not.toHaveClass(/mm-open/);
      await expect(sea).toBeVisible();
    });
  });

  test("G10 Visitors who turn off motion see the drawings standing still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const where = () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".sea-d")].map((d) => {
          const r = d.getBoundingClientRect();
          return `${Math.round(r.x)},${Math.round(r.y)}`;
        }),
      );
    let early: string[] = [];
    await test.step("as soon as the greeting shows, the snowflakes already rest on the pill", async () => {
      await page.goto("/gear?theme=christmas");
      await scrollToGreeting(page);
      early = await where();
      expect(early.length).toBe(4);
      expect(await seaAnimations(page)).toBe(0);
      const d = await drawings(page);
      if (!d) throw new Error("no strip");
      for (const b of d.bottoms) expect(b).toBeLessThanOrEqual(12);
    });
    await test.step("2.5 seconds later nothing has moved", async () => {
      await page.waitForTimeout(2500);
      expect(await where()).toEqual(early);
      expect(await seaAnimations(page)).toBe(0);
    });
  });
});

test.describe("at 1440px only", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("G3 A preview link is never remembered as closed", async ({ page }) => {
    await test.step("the X hides the Christmas preview", async () => {
      await open(page, "/gear?theme=christmas");
      await expect(page.locator("aside.sea .sea-text")).toHaveText("Merry Christmas from Omhar");
      await scrollToGreeting(page);
      await page.getByRole("button", { name: "Close the greeting" }).click();
      await expect(page.locator(".sea")).toHaveCount(0);
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBeNull();
    });
    await test.step("after a reload it shows again", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await scrollToGreeting(page);
      await expect(page.locator("aside.sea .sea-text")).toHaveText("Merry Christmas from Omhar");
    });
  });

  test("G4 The theme turns on and off by itself on the right days, Philippines time", async ({ page }) => {
    const days: [string, string | null][] = [
      ["2026-10-23T12:00:00+08:00", null],
      ["2026-10-24T12:00:00+08:00", "Happy Halloween from Omhar"],
      ["2026-11-07T12:00:00+08:00", "It's Omhar's birthday week"],
      ["2026-12-29T12:00:00+08:00", "Happy New Year 2027"],
      ["2027-01-09T12:00:00+08:00", null],
    ];
    for (const [day, text] of days) {
      await test.step(`${day.slice(0, 10)} shows ${text ?? "no greeting"}`, async () => {
        await page.clock.setFixedTime(new Date(day));
        await open(page, "/gear");
        if (text) {
          await scrollToGreeting(page);
          await expect(page.locator("aside.sea .sea-text")).toHaveText(text);
        } else {
          await expect(page.locator(".sea")).toHaveCount(0);
        }
      });
    }
  });
});
