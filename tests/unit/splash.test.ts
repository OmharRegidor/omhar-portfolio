import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * public/atelier/splash.js and the <script id="splash-boot"> in public/atelier/index.html: the home page splash.
 * Both are plain browser JS, so they are read as text and run in jsdom, like seasonal.test.ts.
 * Rules under test: .noxa/splash-screen-with-loading-bar/plan.md, "Exact rules for splash.js".
 */
type Parts = { fonts: boolean; photosDone: number; photosTotal: number; portrait: boolean };
interface SplashApi {
  WEIGHTS: Readonly<{ fonts: number; photos: number; portrait: number }>;
  MAX_MS: number;
  FADE_MS: number;
  FULL_HOLD_MS: number;
  progress(p: Parts): number;
  remaining(nowMs: number): number;
}
declare global {
  interface Window {
    atelierSplash?: SplashApi;
  }
}

const src = readFileSync(path.join(process.cwd(), "public", "atelier", "splash.js"), "utf8");
const html = readFileSync(path.join(process.cwd(), "public", "atelier", "index.html"), "utf8");
const bootMatch = /<script id="splash-boot">([\s\S]*?)<\/script>/.exec(html);
const boot: string = (() => {
  const code = bootMatch?.[1];
  if (!code) throw new Error('index.html has no <script id="splash-boot">');
  return code;
})();

const SPLASH_HTML = `<div id="splash" class="splash" data-progress="0" aria-hidden="true">
  <div class="splash-mid"><p class="splash-name"><b>Omhar</b><span>Regidor</span></p><div class="splash-bar"><i></i></div></div>
  <p class="splash-hint"><span class="hint-touch">Tap anywhere to skip</span><span class="hint-mouse">Click or press any key to skip</span></p>
</div>`;

const root = () => document.documentElement;
const splash = () => document.getElementById("splash");
const shown = () => Number(splash()?.dataset.progress ?? NaN);
const fill = () => splash()?.querySelector<HTMLElement>(".splash-bar i")?.style.transform ?? "";

type Media = { reduce?: boolean; touch?: boolean };
function media({ reduce = false, touch = false }: Media = {}): void {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches:
          (reduce && query.includes("prefers-reduced-motion: reduce")) || (touch && query.includes("pointer: coarse")),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

// A hero with photos. Each entry is the photo's src ("" for none) and whether it has already loaded.
function page({ on = true, photos = [] as [string, boolean][], fx = false, withSplash = true } = {}): HTMLImageElement[] {
  if (on) root().classList.add("splash-on");
  root().dataset.splash = on ? "open" : "";
  const imgs = photos.map(([s, done]) => {
    const img = document.createElement("img");
    if (s) img.setAttribute("src", s);
    Object.defineProperty(img, "complete", { configurable: true, value: done });
    return img;
  });
  const hero = document.createElement("header");
  hero.className = "hero";
  if (fx) hero.setAttribute("data-fx", "particles");
  imgs.forEach((img) => hero.append(img));
  document.body.innerHTML = withSplash ? SPLASH_HTML : "";
  document.body.append(hero);
  return imgs;
}

function run(now = 0): SplashApi {
  vi.spyOn(performance, "now").mockReturnValue(now);
  window.eval(src);
  const api = window.atelierSplash;
  if (!api) throw new Error("splash.js did not set window.atelierSplash");
  return api;
}

// Microtasks: the MutationObserver and the fonts promise.
const nth = (imgs: HTMLImageElement[], i: number): HTMLImageElement => {
  const img = imgs[i];
  if (!img) throw new Error(`no photo ${i}`);
  return img;
};
const flush = () => vi.advanceTimersByTimeAsync(0);
const portraitUp = async () => {
  document.querySelector("header.hero")?.setAttribute("data-fx", "particles");
  await flush();
};

function fonts(): { resolve: () => void; reject: () => void } {
  let resolve = () => {};
  let reject = () => {};
  const ready = new Promise<void>((res, rej) => {
    resolve = () => res();
    reject = () => rej(new Error("font failed"));
  });
  ready.catch(() => {});
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });
  return { resolve, reject };
}

function transitionEnd(target: Element, propertyName: string): void {
  const e = new Event("transitionend", { bubbles: true });
  Object.defineProperty(e, "propertyName", { value: propertyName });
  target.dispatchEvent(e);
}

beforeEach(() => {
  vi.useFakeTimers();
  root().className = "";
  for (const k of ["splash", "splashReason", "pointer"]) delete root().dataset[k];
  document.body.innerHTML = "";
  delete (document as { fonts?: unknown }).fonts;
  delete window.atelierSplash;
  history.replaceState(null, "", "/");
});

afterEach(() => {
  // Close any splash still open, so its window listeners never reach the next test.
  window.dispatchEvent(new KeyboardEvent("keydown"));
  vi.runAllTimers();
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (document as { fonts?: unknown }).fonts;
  delete (navigator as { webdriver?: unknown }).webdriver;
});

describe("atelierSplash.progress", () => {
  let api: SplashApi;
  beforeEach(() => {
    api = run();
  });

  it("weighs fonts 20, photos 40 and the portrait 40", () => {
    expect(api.WEIGHTS).toEqual({ fonts: 20, photos: 40, portrait: 40 });
    expect(api.progress({ fonts: true, photosDone: 0, photosTotal: 3, portrait: false })).toBe(20);
    expect(api.progress({ fonts: false, photosDone: 3, photosTotal: 3, portrait: false })).toBe(40);
    expect(api.progress({ fonts: false, photosDone: 0, photosTotal: 3, portrait: true })).toBe(40);
  });

  it("is 0 when nothing is done and 100 when everything is", () => {
    expect(api.progress({ fonts: false, photosDone: 0, photosTotal: 2, portrait: false })).toBe(0);
    expect(api.progress({ fonts: true, photosDone: 2, photosTotal: 2, portrait: true })).toBe(100);
  });

  it("counts no photos with a source as the full photo weight", () => {
    expect(api.progress({ fonts: false, photosDone: 0, photosTotal: 0, portrait: false })).toBe(40);
    expect(api.progress({ fonts: true, photosDone: 0, photosTotal: 0, portrait: true })).toBe(100);
  });

  it("gives part of the photo weight for each photo done, rounded", () => {
    expect(api.progress({ fonts: false, photosDone: 1, photosTotal: 3, portrait: false })).toBe(13);
    expect(api.progress({ fonts: true, photosDone: 1, photosTotal: 2, portrait: true })).toBe(80);
    expect(api.progress({ fonts: true, photosDone: 2, photosTotal: 3, portrait: false })).toBe(47);
  });

  it("stays between 0 and 100 for counts out of range", () => {
    expect(api.progress({ fonts: true, photosDone: 5, photosTotal: 2, portrait: true })).toBe(100);
    expect(api.progress({ fonts: false, photosDone: -3, photosTotal: 1, portrait: false })).toBe(0);
  });

  it("is frozen, so page code cannot change the rules", () => {
    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.isFrozen(api.WEIGHTS)).toBe(true);
    expect([api.MAX_MS, api.FADE_MS, api.FULL_HOLD_MS]).toEqual([8000, 400, 150]);
  });
});

describe("atelierSplash.remaining", () => {
  it("counts down from 8000 ms since the page started and never goes below 0", () => {
    const api = run();
    expect(api.remaining(0)).toBe(8000);
    expect(api.remaining(3000)).toBe(5000);
    expect(api.remaining(8000)).toBe(0);
    expect(api.remaining(12_000)).toBe(0);
  });
});

describe("splash.js on the page", () => {
  it("does nothing but set the rules when <html> lacks splash-on", () => {
    page({ on: false });
    const api = run();
    expect(api.MAX_MS).toBe(8000);
    splash()?.click();
    vi.advanceTimersByTime(10_000);
    expect(splash()).not.toBeNull();
    expect(shown()).toBe(0);
    expect(root().dataset.splashReason).toBeUndefined();
  });

  it("does nothing when the #splash markup is missing", () => {
    page({ withSplash: false });
    run();
    vi.advanceTimersByTime(10_000);
    expect(root().classList.contains("splash-on")).toBe(true);
    expect(root().dataset.splashReason).toBeUndefined();
  });

  it("fills the bar as photos load or fail, and closes with reason ready once the portrait is up", async () => {
    const imgs = page({ photos: [["/a.jpg", false], ["/b.jpg", false]] });
    const [a, b] = [nth(imgs, 0), nth(imgs, 1)];
    media();
    run();
    const seen: number[] = [shown()];
    expect(shown()).toBe(20); // no document.fonts counts as done
    expect(fill()).toBe("scaleX(0.2)");
    a.dispatchEvent(new Event("load"));
    seen.push(shown());
    expect(shown()).toBe(40);
    b.dispatchEvent(new Event("error"));
    seen.push(shown());
    expect(shown()).toBe(60);
    expect(root().dataset.splash).toBe("open");
    await portraitUp();
    seen.push(shown());
    expect(shown()).toBe(100);
    expect(fill()).toBe("scaleX(1)");
    expect(seen).toEqual([...seen].sort((x, y) => x - y));

    vi.advanceTimersByTime(149);
    expect(root().dataset.splash).toBe("open");
    vi.advanceTimersByTime(1);
    expect(root().dataset.splash).toBe("closing");
    expect(root().dataset.splashReason).toBe("ready");
    vi.advanceTimersByTime(500);
    expect(splash()).toBeNull();
    expect(root().classList.contains("splash-on")).toBe(false);
    expect(root().dataset.splash).toBe("done");
  });

  it("counts a photo only once even when it fires both error and load", () => {
    const a = nth(page({ photos: [["/a.jpg", false], ["/b.jpg", false]] }), 0);
    run();
    a.dispatchEvent(new Event("error"));
    a.dispatchEvent(new Event("load"));
    expect(shown()).toBe(40);
  });

  it("counts only hero photos that have a source, and loaded ones at once", () => {
    page({ photos: [["/a.jpg", true], ["", false], ["/c.jpg", false]] });
    run();
    expect(shown()).toBe(40); // fonts 20 + one of two photos 20
  });

  it("waits for document.fonts.ready, and counts a failed font as done", async () => {
    const f = fonts();
    page({ fx: true });
    run();
    expect(shown()).toBe(80);
    f.resolve();
    await flush();
    expect(shown()).toBe(100);

    const g = fonts();
    page({ fx: true });
    run();
    g.reject();
    await flush();
    expect(shown()).toBe(100);
  });

  it("counts the portrait as done when there is no hero, or it is already up", () => {
    document.body.innerHTML = SPLASH_HTML;
    root().classList.add("splash-on");
    root().dataset.splash = "open";
    run();
    vi.advanceTimersByTime(150);
    expect(root().dataset.splashReason).toBe("ready");
  });

  it("never moves the bar back once it has filled", async () => {
    const a = nth(page({ photos: [["/a.jpg", false]] }), 0);
    run();
    const values: number[] = [];
    new MutationObserver(() => values.push(shown())).observe(splash() as HTMLElement, {
      attributes: true,
      attributeFilter: ["data-progress"],
    });
    a.dispatchEvent(new Event("load"));
    await flush();
    await portraitUp();
    expect(values.length).toBeGreaterThan(0);
    expect(values).toEqual([...values].sort((x, y) => x - y));
    expect(values.at(-1)).toBe(100);
  });

  it("closes with reason timeout at 8000 ms after the page started", () => {
    page();
    run(3000);
    vi.advanceTimersByTime(4999);
    expect(root().dataset.splash).toBe("open");
    vi.advanceTimersByTime(1);
    expect(root().dataset.splash).toBe("closing");
    expect(root().dataset.splashReason).toBe("timeout");
    vi.advanceTimersByTime(500);
    expect(splash()).toBeNull();
  });

  it("closes at once when the script runs after 8000 ms", () => {
    page();
    run(9500);
    vi.advanceTimersByTime(0);
    expect(root().dataset.splashReason).toBe("timeout");
  });

  for (const [name, fire] of [
    ["a click on the splash", () => splash()?.click()],
    ["a key press", () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))],
    ["a wheel turn", () => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 40 }))],
    ["a swipe", () => window.dispatchEvent(new Event("touchmove"))],
  ] as const) {
    it(`skips on ${name}`, () => {
      page();
      run();
      fire();
      expect(root().dataset.splash).toBe("closing");
      expect(root().dataset.splashReason).toBe("skip");
      vi.advanceTimersByTime(500);
      expect(splash()).toBeNull();
      expect(root().dataset.splash).toBe("done");
    });
  }

  it("does not close on a scroll, so a reload that restores the scroll spot keeps the splash", () => {
    page();
    run();
    window.dispatchEvent(new Event("scroll"));
    document.dispatchEvent(new Event("scroll"));
    expect(root().dataset.splash).toBe("open");
  });

  it("closes only once and keeps the first reason", async () => {
    page();
    run();
    splash()?.click();
    window.dispatchEvent(new KeyboardEvent("keydown"));
    await portraitUp();
    vi.advanceTimersByTime(10_000);
    expect(root().dataset.splashReason).toBe("skip");
    expect(root().dataset.splash).toBe("done");
  });

  it("finishes on the splash's own opacity transitionend, before the fallback timer", () => {
    page();
    run();
    splash()?.click();
    const el = splash() as HTMLElement;
    transitionEnd(el.querySelector(".splash-bar i") as Element, "opacity");
    transitionEnd(el, "transform");
    expect(splash()).not.toBeNull();
    transitionEnd(el, "opacity");
    expect(splash()).toBeNull();
    expect(root().dataset.splash).toBe("done");
  });

  it("goes straight to done with no fading step under reduced motion", () => {
    page();
    media({ reduce: true });
    run();
    const states: string[] = [];
    new MutationObserver(() => states.push(root().dataset.splash ?? "")).observe(root(), {
      attributes: true,
      attributeFilter: ["data-splash"],
    });
    splash()?.click();
    expect(root().dataset.splash).toBe("done");
    expect(splash()).toBeNull();
    expect(root().dataset.splashReason).toBe("skip");
    expect(states).not.toContain("closing");
  });

  it("keeps the failsafe's reason when the head script already cleared the splash", () => {
    page();
    run();
    root().dataset.splash = "done";
    root().dataset.splashReason = "failsafe";
    root().classList.remove("splash-on");
    splash()?.click();
    expect(splash()).toBeNull();
    expect(root().dataset.splashReason).toBe("failsafe");
  });

  it("removes every timer and listener when done, and never locks the page scroll", () => {
    page({ photos: [["/a.jpg", false]] });
    run();
    expect(root().style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
    splash()?.click();
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(0);
    root().dataset.splashReason = "checked";
    window.dispatchEvent(new KeyboardEvent("keydown"));
    window.dispatchEvent(new WheelEvent("wheel"));
    expect(root().dataset.splashReason).toBe("checked");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("splash-boot in index.html", () => {
  function bootWith({ webdriver, url = "/", touch = false }: { webdriver: boolean; url?: string; touch?: boolean }): void {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => webdriver });
    history.replaceState(null, "", url);
    media({ touch });
    window.eval(boot);
  }

  it("turns the splash on for a normal visitor, with the mouse hint", () => {
    bootWith({ webdriver: false });
    expect(root().classList.contains("splash-on")).toBe(true);
    expect(root().dataset.splash).toBe("open");
    expect(root().dataset.pointer).toBe("mouse");
  });

  it("picks the touch hint on a touch screen", () => {
    bootWith({ webdriver: false, touch: true });
    expect(root().dataset.pointer).toBe("touch");
  });

  it("keeps the splash off for a test browser", () => {
    bootWith({ webdriver: true });
    expect(root().classList.contains("splash-on")).toBe(false);
    expect(root().dataset.splash).toBeUndefined();
    expect(root().dataset.pointer).toBeUndefined();
    vi.advanceTimersByTime(10_000);
    expect(root().dataset.splashReason).toBeUndefined();
  });

  it("turns the splash on for a test browser with ?splash=on", () => {
    bootWith({ webdriver: true, url: "/?splash=on" });
    expect(root().classList.contains("splash-on")).toBe(true);
    expect(root().dataset.splash).toBe("open");
  });

  it("ignores other ?splash= values in a test browser", () => {
    bootWith({ webdriver: true, url: "/?splash=1" });
    expect(root().classList.contains("splash-on")).toBe(false);
  });

  it("clears the splash after 9000 ms when splash.js never ran", () => {
    bootWith({ webdriver: false });
    vi.advanceTimersByTime(8999);
    expect(root().classList.contains("splash-on")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(root().classList.contains("splash-on")).toBe(false);
    expect(root().dataset.splash).toBe("done");
    expect(root().dataset.splashReason).toBe("failsafe");
  });

  it("leaves a splash that already closed alone at 9000 ms", () => {
    bootWith({ webdriver: false });
    root().dataset.splash = "done";
    root().dataset.splashReason = "ready";
    vi.advanceTimersByTime(9000);
    expect(root().dataset.splashReason).toBe("ready");
  });

  it("lets a fade already under way finish at 9000 ms", () => {
    bootWith({ webdriver: false });
    root().dataset.splash = "closing";
    root().dataset.splashReason = "ready";
    vi.advanceTimersByTime(9000);
    expect(root().dataset.splash).toBe("closing");
    expect(root().dataset.splashReason).toBe("ready");
  });

  it("skips on a key press before splash.js has loaded", () => {
    delete window.atelierSplash;
    document.body.innerHTML = SPLASH_HTML;
    bootWith({ webdriver: false });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(root().dataset.splash).toBe("closing");
    expect(root().dataset.splashReason).toBe("skip");
    vi.advanceTimersByTime(400);
    expect(root().classList.contains("splash-on")).toBe(false);
    expect(root().dataset.splash).toBe("done");
    expect(root().dataset.splashReason).toBe("skip");
    expect(splash()).toBeNull();
  });

  it("leaves skips to splash.js once it has loaded", () => {
    bootWith({ webdriver: false });
    window.atelierSplash = {} as SplashApi;
    window.dispatchEvent(new MouseEvent("click"));
    expect(root().dataset.splash).toBe("open");
    delete window.atelierSplash;
  });
});
