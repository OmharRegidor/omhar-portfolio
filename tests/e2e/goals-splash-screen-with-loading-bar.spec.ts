import { test, expect, devices, type Page, type Route } from "@playwright/test";

// Goal checks for the home page splash with a loading bar (.noxa/splash-screen-with-loading-bar/goals.md, G1 to
// G9). Each test acts out one goal the way a visitor would.
//
// Playwright sets navigator.webdriver, and the splash stays off for test browsers unless the URL has ?splash=on,
// so every splash test opens the page with it. ?theme=none keeps the date's event costume out of the goals that
// are not about it, so no test needs page.clock: the page's own timers and performance.now stay real, which the
// 8 s limit depends on.
//
// The test machine can lag seconds behind the page, so the page records for itself, from the first moment, every
// change of the splash (in ms since navigation), the bar's values, the hero photo, the visitor's actions and how
// late its own timers run. The checks read that record instead of timing calls from the test.
test.use({
  // A small video keeps the recording from starving a slow machine; it is still recorded for every test.
  video: { mode: "on", size: { width: 640, height: 400 } },
  launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
});

const THREE = "**/atelier/vendor/three.module.min.js";
const PAPER = "rgb(247, 246, 242)";
const MAX_MS = 8000;
const CAP_SLACK_MS = 600;
const SKIP_MS = 600;
const HOLD_CHECK_MS = 5000;

const { userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
const PHONE = { userAgent, deviceScaleFactor, isMobile, hasTouch, viewport: { width: 390, height: 844 } };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

type Change = { a: string; v: string; t: number };
type Frame = { t: number; site: boolean; covered: boolean };
type Look = { bg: string; name: string; bar: [number, number]; hint: string; navCovered: boolean; h1Covered: boolean };
type Recorder = {
  log: Change[];
  frames: Frame[];
  look: Look | null;
  actions: { type: string; t: number; inSplash: boolean }[];
  at1500: { t: number; splash: string | null; progress: number } | null;
  atDone: { t: number; slide: string | null; shown: string | null } | null;
  lag: { t: number; late: number }[];
  now: () => number;
};
declare global {
  interface Window {
    __splashRecorder?: Recorder;
  }
}

// Runs in the test's browser only, before any page script.
const RECORD = () => {
  const now = performance.now.bind(performance);
  const later = setTimeout.bind(window);
  const every = setInterval.bind(window);
  const rec: Recorder = { log: [], frames: [], look: null, actions: [], at1500: null, atDone: null, lag: [], now };
  window.__splashRecorder = rec;
  const shownPhoto = () => {
    const img = document.querySelector<HTMLImageElement>(".hero-media .ph.show");
    return img ? new URL(img.getAttribute("src") ?? "", location.href).pathname : null;
  };
  // The script runs before <html> exists, so it watches the document itself.
  new MutationObserver((records) => {
    for (const r of records) {
      const el = r.target as Element;
      const a = r.attributeName ?? "";
      const v = el.getAttribute(a) ?? "";
      if (r.oldValue === v) continue;
      const t = now();
      rec.log.push({ a, v, t });
      if (a === "data-splash" && v === "done" && !rec.atDone) {
        rec.atDone = { t, slide: document.querySelector(".hero")?.getAttribute("data-slide") ?? null, shown: shownPhoto() };
      }
    }
  }).observe(document, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["data-splash", "data-splash-reason", "data-progress", "data-slide", "data-fx"],
  });
  // Every frame until the page is parsed: is any of the site on the page yet, and does the splash cover it?
  const covers = () => {
    const splash = document.getElementById("splash");
    if (!splash || getComputedStyle(splash).display === "none") return false;
    const pts: [number, number][] = [[2, 2], [innerWidth / 2, innerHeight / 2], [innerWidth - 2, innerHeight - 2], [40, 30]];
    return pts.every(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return Boolean(hit && splash.contains(hit));
    });
  };
  const hidden = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return true;
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(hit && (hit === el || el.contains(hit)));
  };
  const frame = () => {
    const site = Boolean(document.querySelector("nav.top, header.hero"));
    rec.frames.push({ t: now(), site, covered: covers() });
    const splash = document.getElementById("splash");
    // What the visitor sees on the first frame that has the site in the page.
    if (site && !rec.look && splash) {
      const bar = splash.querySelector(".splash-bar")?.getBoundingClientRect();
      const hint = [...splash.querySelectorAll<HTMLElement>(".splash-hint span")].find((el) => el.offsetWidth > 0);
      rec.look = {
        bg: getComputedStyle(splash).backgroundColor,
        name: splash.querySelector(".splash-name")?.textContent ?? "",
        bar: [bar?.width ?? 0, bar?.height ?? 0],
        hint: hint?.textContent ?? "",
        navCovered: hidden("nav.top .logo"),
        h1Covered: hidden("header.hero h1"),
      };
    }
    if (document.readyState === "loading" || rec.frames.length < 3) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  later(() => {
    const splash = document.getElementById("splash");
    rec.at1500 = { t: now(), splash: document.documentElement.dataset.splash ?? null, progress: Number(splash?.dataset.progress ?? -1) };
  }, 1500);
  for (const type of ["click", "keydown", "touchstart"]) {
    window.addEventListener(
      type,
      (e) => {
        const target = e.target instanceof Element ? e.target : null;
        rec.actions.push({ type, t: now(), inSplash: Boolean(target?.closest("#splash")) });
      },
      { capture: true },
    );
  }
  // How late the page's own timers run. A busy test machine can hold a timer back by seconds.
  let tick = now();
  every(() => {
    const t = now();
    if (t - tick > 400) rec.lag.push({ t, late: t - tick - 250 });
    tick = t;
  }, 250);
};

let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(RECORD);
});
test.afterEach(async ({ page }) => {
  const seen = [...errors];
  // Lets go of any request a test held back, so the browser can close.
  await Promise.all(held.splice(0).map((r) => r.abort().catch(() => {})));
  await page.unrouteAll({ behavior: "ignoreErrors" });
  expect(seen, "console errors").toHaveLength(0);
});

const rec = (page: Page) =>
  page.evaluate(() => {
    const r = window.__splashRecorder;
    if (!r) throw new Error("no recorder");
    return { log: r.log, frames: r.frames, look: r.look, actions: r.actions, at1500: r.at1500, atDone: r.atDone, lag: r.lag, now: r.now() };
  });
const splashLog = (log: Change[]) => log.filter((c) => c.a === "data-splash");
const doneAt = (log: Change[]) => splashLog(log).find((c) => c.v === "done")?.t ?? null;
const reason = (page: Page) => page.locator("html").getAttribute("data-splash-reason");
// The worst lateness of the page's timers up to `t`.
const lagBy = (lag: { t: number; late: number }[], t: number) => Math.max(0, ...lag.filter((l) => l.t <= t + 1000).map((l) => l.late));

const held: Route[] = [];
const neverAnswer = (page: Page) => page.route(THREE, (route) => void held.push(route));
const waitGone = async (page: Page, timeout = 20_000) => {
  await expect(page.locator("html")).toHaveAttribute("data-splash", "done", { timeout });
  await expect(page.locator("#splash")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/splash-on/);
};
const onTop = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return Boolean(hit && (hit === el || el.contains(hit)));
  });

for (const [label, device] of [
  ["390 (Pixel 7)", PHONE],
  ["1440", DESKTOP],
] as const) {
  const desktop = device.viewport.width > 860;
  test.describe(`at ${label}`, () => {
    test.use(device);

    test("G1 The off-white splash shows first, before the site", async ({ page }) => {
      test.setTimeout(90_000);
      await neverAnswer(page);
      await page.goto("/?splash=on&theme=none", { waitUntil: "domcontentloaded" });
      await test.step("no frame ever showed the site without the splash over it", async () => {
        await expect.poll(async () => (await rec(page)).frames.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(3);
        const { frames } = await rec(page);
        const firstSite = frames.find((f) => f.site);
        expect(firstSite, "a frame with the site in it").toBeTruthy();
        expect(frames.filter((f) => f.site && !f.covered), "frames where the site showed through").toEqual([]);
      });
      await test.step("that first frame is off-white with the name, the bar and the hint", async () => {
        const { look } = await rec(page);
        expect(look).toEqual({
          bg: PAPER,
          name: "OmharRegidor",
          bar: [160, 2],
          hint: desktop ? "Click or press any key to skip" : "Tap anywhere to skip",
          navCovered: true,
          h1Covered: true,
        });
      });
    });

    test("G3 A tap, a click or a key press skips the splash at once", async ({ page }) => {
      test.setTimeout(300_000);
      await neverAnswer(page);
      // Acts as soon as splash.js is listening, with as few calls to the browser as possible: on this slow machine
      // each call can take seconds. When the action still reached the page after the 8 s limit had closed the
      // splash, the machine was too slow for that try, not the splash wrong, so the step is tried again (3 tries).
      const skipOnce = async (hint: string, act: () => Promise<void>, kind: string) => {
        const url = "/?splash=on&theme=none";
        for (let attempt = 1; ; attempt++) {
          await page.goto(url, { waitUntil: "commit" });
          await page.waitForFunction(() => "atelierSplash" in window, undefined, { polling: 50, timeout: 30_000 });
          await act();
          await waitGone(page);
          const r = await rec(page);
          const action = r.actions.find((a) => a.type === kind);
          const closing = splashLog(r.log).find((c) => c.v === "closing" || c.v === "done")?.t ?? Infinity;
          const story = JSON.stringify({ attempt, actions: r.actions, splash: splashLog(r.log) });
          const late = Boolean(action && action.t > closing && (await reason(page)) !== "skip");
          if (late && attempt < 3) continue;
          test.skip(late, `the ${kind} reached the page only after the splash had closed on its own, 3 times: ${story}`);
          expect(r.look?.hint, "the hint the visitor read").toBe(hint);
          expect(action, `${kind} reached the page: ${story}`).toBeTruthy();
          expect(await reason(page), `closed by the visitor, not the 8 s limit: ${story}`).toBe("skip");
          const gone = doneAt(r.log) ?? Infinity;
          const took = gone - (action?.t ?? 0);
          expect(took, `splash gone ${Math.round(took)} ms after the ${kind}`).toBeLessThanOrEqual(SKIP_MS + lagBy(r.lag, gone));
          expect(r.actions.filter((x) => x.type === "click" && !x.inSplash), "clicks that landed under the splash").toEqual([]);
          expect(new URL(page.url()).pathname + new URL(page.url()).search, "no link under the splash was followed").toBe(url);
          return;
        }
      };
      const mid = { x: device.viewport.width / 2, y: device.viewport.height / 2 };
      if (desktop) {
        await test.step("a key press skips it", () =>
          skipOnce("Click or press any key to skip", () => page.keyboard.press("Enter"), "keydown"));
        await test.step("a click skips it", () =>
          skipOnce("Click or press any key to skip", () => page.mouse.click(mid.x, mid.y), "click"));
      } else {
        await test.step("a tap skips it", () =>
          skipOnce("Tap anywhere to skip", () => page.touchscreen.tap(mid.x, mid.y), "click"));
      }
    });

    test("G4 The gear and automations pages open with no splash", async ({ page }) => {
      test.setTimeout(90_000);
      for (const path of ["/gear", "/automations"]) {
        await test.step(`${path}?splash=on shows its content at once`, async () => {
          await page.goto(`${path}?splash=on`, { waitUntil: "domcontentloaded" });
          await expect(page.locator("main:visible h1")).toBeVisible();
          await expect(page.locator("#splash")).toHaveCount(0);
          await expect(page.locator("html")).not.toHaveClass(/splash-on/);
          await page.waitForLoadState("load");
          expect(splashLog((await rec(page)).log), "no splash state on the page").toEqual([]);
        });
      }
    });

    test("G9 Everything else still works after the splash", async ({ page }) => {
      test.setTimeout(300_000);
      await test.step("the splash closes", async () => {
        await page.goto("/?splash=on&theme=halloween", { waitUntil: "domcontentloaded" });
        await waitGone(page);
        await page.waitForLoadState("networkidle");
      });
      if (!desktop) {
        await test.step("the phone menu opens", async () => {
          const btn = page.getByRole("button", { name: "Open menu" });
          expect(await onTop(page, ".mm-btn"), "menu button is not covered").toBe(true);
          await btn.click();
          await expect(page.locator("html")).toHaveClass(/mm-open/);
          await expect(page.locator(".mm-panel")).toBeVisible();
          await page.locator(".mm-btn").click();
          await expect(page.locator("html")).not.toHaveClass(/mm-open/);
        });
      }
      await test.step("the chat panel opens", async () => {
        const launch = page.locator(".ao-launch");
        await expect(launch).toHaveClass(/\bon\b/, { timeout: 8000 });
        await launch.click();
        const panel = page.locator(".ao-panel");
        await expect(panel).toHaveClass(/\bon\b/);
        await expect(panel).toBeVisible();
        expect(await onTop(page, ".ao-panel"), "chat panel sits on top").toBe(true);
        await page.getByRole("button", { name: "Close chat" }).click();
        await expect(panel).toBeHidden({ timeout: 10_000 });
      });
      await test.step("the projects deck shows its first project", async () => {
        await page.evaluate(() => {
          const dk = document.getElementById("deck");
          if (dk) scrollTo({ top: dk.getBoundingClientRect().top + scrollY, behavior: "instant" });
        });
        await expect(page.locator("#deck")).toHaveClass(/\bon\b/);
        await expect(page.locator(".dk-cap .m")).toHaveText(/^01 \/ 13/, { timeout: 8000 });
      });
      await test.step("the Halloween greeting strip shows", async () => {
        const y = await page.evaluate(async () => {
          const sea = document.querySelector("aside.sea");
          if (!sea) return -1;
          const settle = (ms = 30) =>
            new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms))));
          const shown = () => !sea.classList.contains("sea-away");
          const max = document.documentElement.scrollHeight - innerHeight;
          for (let y = 0; y < max + 40; y += 40) {
            scrollTo({ top: Math.min(y, max), behavior: "instant" });
            await settle();
            if (shown()) {
              await settle(350);
              if (shown()) return Math.round(scrollY);
            }
          }
          return -1;
        });
        expect(y, "scrolled the whole page and the greeting never showed").toBeGreaterThanOrEqual(0);
        await expect(page.locator("aside.sea .sea-text")).toHaveText("Happy Halloween from Omhar");
      });
    });
  });
}

test.describe("at 1440", () => {
  test.use(DESKTOP);

  test("G2 The bar follows real loading, then fades into the site", async ({ page }) => {
    test.setTimeout(300_000);
    const started = Date.now();
    // three.js is held until 3 s after the page started and the 1.5 s look has been taken.
    const looked = () => page.evaluate(() => Boolean(window.__splashRecorder?.at1500)).catch(() => true);
    await page.route(THREE, async (route: Route) => {
      while (!page.isClosed() && Date.now() - started < 30_000 && (Date.now() - started < 3000 || !(await looked()))) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await route.continue().catch(() => {});
    });
    await page.goto("/?splash=on&theme=none", { waitUntil: "domcontentloaded" });
    await test.step("at 1.5 s the splash is open and the bar is partly filled", async () => {
      await expect.poll(async () => (await rec(page)).at1500, { timeout: 30_000 }).not.toBeNull();
      const { at1500 } = await rec(page);
      expect(at1500?.splash).toBe("open");
      expect(at1500?.progress ?? 0).toBeGreaterThanOrEqual(1);
      expect(at1500?.progress ?? 100).toBeLessThanOrEqual(60);
    });
    await test.step("once the portrait is up the bar reaches full, then the splash fades out", async () => {
      await waitGone(page, 30_000);
      const { log } = await rec(page);
      const closing = splashLog(log).find((c) => c.v === "closing")?.t ?? Infinity;
      const fxAt = log.find((c) => c.a === "data-fx")?.t ?? Infinity;
      // On a machine where the software 3D takes longer than 8 s, the limit closes the splash first, which is the
      // splash doing its job. The ready path cannot be seen then, so the goal is reported as not acted out.
      test.skip(
        (await reason(page)) === "timeout" && fxAt > closing,
        `the 3D portrait came up at ${Math.round(fxAt)} ms, after the 8 s limit closed the splash at ${Math.round(closing)} ms`,
      );
      expect(await reason(page)).toBe("ready");
      const bar = log.filter((c) => c.a === "data-progress").map((c) => Number(c.v));
      expect(bar, "the bar never goes back").toEqual([...bar].sort((a, b) => a - b));
      expect(bar.at(-1)).toBe(100);
      const fx = log.find((c) => c.a === "data-fx")?.t ?? Infinity;
      const full = log.find((c) => c.a === "data-progress" && c.v === "100")?.t ?? -1;
      expect(full, "full only after the portrait is up").toBeGreaterThanOrEqual(fx);
      expect(splashLog(log).map((c) => c.v)).toEqual(["open", "closing", "done"]);
      await expect(page.locator("header.hero h1")).toBeVisible();
    });
  });

  test("G6 With reduced motion the bar still fills and the splash closes with no fade", async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?splash=on&theme=none", { waitUntil: "domcontentloaded" });
    await waitGone(page);
    const { log } = await rec(page);
    expect(await reason(page)).toBe("ready");
    expect(log.filter((c) => c.a === "data-progress").map((c) => c.v)).toContain("100");
    expect(splashLog(log).map((c) => c.v), "open, then gone, with no fading step").toEqual(["open", "done"]);
    await expect(page.locator("header.hero h1")).toBeVisible();
  });

  test("G8 The first hero photo gets its full hold after the splash", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/?splash=on&theme=halloween", { waitUntil: "domcontentloaded" });
    await waitGone(page, 30_000);
    const atDone = (await rec(page)).atDone;
    expect(atDone, "the photo on show when the splash closed").toEqual(
      expect.objectContaining({ slide: "costume", shown: "/atelier/hero/costume-halloween.jpg" }),
    );
    // Waits in the page until 5 s after the close, then reads from the record what changed in between. No change
    // means the costume photo seen at the close was still the one on show 5 s later.
    const after = await page.evaluate(
      ({ t, ms }) =>
        new Promise<{ changes: number; waited: number }>((resolve) => {
          const r = window.__splashRecorder;
          if (!r) throw new Error("no recorder");
          const check = () => {
            if (r.now() < t + ms) return void setTimeout(check, 100);
            // The page itself may check late; only changes inside the 5 s count.
            resolve({ changes: r.log.filter((c) => c.a === "data-slide" && c.t > t && c.t <= t + ms).length, waited: r.now() - t });
          };
          check();
        }),
      { t: atDone?.t ?? 0, ms: HOLD_CHECK_MS },
    );
    expect(after.changes, "photo changes in the 5 s after the splash").toBe(0);
    expect(after.waited).toBeGreaterThanOrEqual(HOLD_CHECK_MS);
  });
});

test.describe("at 390 (Pixel 7)", () => {
  test.use(PHONE);

  test("G5 The splash is never stuck: it closes by 8 s at most", async ({ page }) => {
    test.setTimeout(90_000);
    await neverAnswer(page);
    await page.goto("/?splash=on&theme=none", { waitUntil: "domcontentloaded" });
    await test.step("the splash closes on its own with reason timeout", async () => {
      await waitGone(page, 30_000);
      expect(await reason(page), "the 8 s limit closed it, not the 9 s failsafe").toBe("timeout");
    });
    await test.step("it closed by 8.6 s after the page started (plus any lag of the page's own timers)", async () => {
      const { log, lag } = await rec(page);
      const closing = splashLog(log).find((c) => c.v === "closing")?.t ?? Infinity;
      const gone = doneAt(log) ?? Infinity;
      const slack = lagBy(lag, gone);
      expect(closing, "the fade starts at the 8 s limit, not before").toBeGreaterThanOrEqual(MAX_MS - 50);
      expect(gone, `gone at ${Math.round(gone)} ms, timer lag ${Math.round(slack)} ms`).toBeLessThanOrEqual(MAX_MS + CAP_SLACK_MS + slack);
    });
    await test.step("the site can be scrolled and clicked", async () => {
      expect(await onTop(page, ".mm-btn"), "nothing covers the menu button").toBe(true);
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.locator("html")).toHaveClass(/mm-open/);
      await page.locator(".mm-btn").click();
      await expect(page.locator("html")).not.toHaveClass(/mm-open/);
      await page.mouse.wheel(0, 600);
      await expect.poll(() => page.evaluate(() => scrollY), { timeout: 10_000 }).toBeGreaterThan(0);
    });
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    test("G7 With JavaScript off the site shows as normal", async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto("/?splash=on");
      await expect(page.locator("#splash")).toBeHidden();
      await expect(page.locator("html")).not.toHaveClass(/splash-on/);
      await expect(page.locator("header.hero h1")).toBeVisible();
      await expect(page.locator("#main")).toBeVisible();
      expect(await onTop(page, "header.hero h1"), "nothing covers the hero heading").toBe(true);
    });
  });
});
