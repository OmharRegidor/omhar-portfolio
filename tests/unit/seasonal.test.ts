import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * public/atelier/seasonal.js: the event greeting strip shared by the static Atelier pages.
 * The script is plain browser JS, so it is read as text and run in jsdom after the clock and the URL are set.
 * Rules under test live in .noxa/add-seasonal-holiday-themes/plan.md, "Exact rules for seasonal.js".
 */
type ThemeId = "halloween" | "christmas" | "newyear" | "birthday";
type Occurrence = { id: ThemeId; year: number };
type Resolved = Occurrence & { preview: boolean };
interface SeasonalApi {
  manilaDay(date: Date): { y: number; m: number; d: number };
  pick(date: Date): Occurrence | null;
  resolve(date: Date, search: string): Resolved | null;
  greeting(id: ThemeId, year: number): string;
  STORAGE_KEY: "atelier-seasonal-closed";
}
declare global {
  interface Window {
    atelierSeasonal?: SeasonalApi;
  }
}

const src = readFileSync(path.join(process.cwd(), "public", "atelier", "seasonal.js"), "utf8");
const STORAGE_KEY = "atelier-seasonal-closed";
const HALLOWEEN_DAY = "2026-10-29T12:00:00+08:00";
const NORMAL_DAY = "2026-09-15T12:00:00+08:00";

function run(now: string, url = "/"): SeasonalApi {
  vi.setSystemTime(new Date(now));
  history.replaceState(null, "", url);
  window.eval(src);
  const api = window.atelierSeasonal;
  if (!api) throw new Error("seasonal.js did not set window.atelierSeasonal");
  return api;
}

function strip(): HTMLElement {
  const el = document.querySelector<HTMLElement>("aside.sea");
  if (!el) throw new Error("no .sea strip on the page");
  return el;
}

function pressClose(): void {
  const btn = strip().querySelector<HTMLButtonElement>("button.sea-x");
  if (!btn) throw new Error("no close button");
  btn.click();
  vi.advanceTimersByTime(250);
}

function reducedMotion(on: boolean): void {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: on && query.includes("prefers-reduced-motion: reduce"),
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

beforeEach(() => {
  vi.useFakeTimers();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  localStorage.clear();
  history.replaceState(null, "", "/");
  delete window.atelierSeasonal;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("seasonal.js date rules", () => {
  const table: [string, Occurrence | null][] = [
    ["2026-10-23", null],
    ["2026-10-24", { id: "halloween", year: 2026 }],
    ["2026-10-29", { id: "halloween", year: 2026 }],
    ["2026-11-04", { id: "halloween", year: 2026 }],
    ["2026-11-05", { id: "halloween", year: 2026 }],
    ["2026-11-06", { id: "birthday", year: 2026 }],
    ["2026-11-07", { id: "birthday", year: 2026 }],
    ["2026-11-08", { id: "birthday", year: 2026 }],
    ["2026-11-18", { id: "birthday", year: 2026 }],
    ["2026-11-19", null],
    ["2026-12-17", null],
    ["2026-12-18", { id: "christmas", year: 2026 }],
    ["2026-12-25", { id: "christmas", year: 2026 }],
    ["2026-12-28", { id: "christmas", year: 2026 }],
    ["2026-12-29", { id: "newyear", year: 2027 }],
    ["2027-01-01", { id: "newyear", year: 2027 }],
    ["2027-01-08", { id: "newyear", year: 2027 }],
    ["2027-01-09", null],
  ];

  for (const [day, expected] of table) {
    it(`picks ${expected ? `${expected.id} ${expected.year}` : "nothing"} on ${day} Manila time`, () => {
      const api = run(NORMAL_DAY);
      expect(api.pick(new Date(`${day}T12:00:00+08:00`))).toEqual(expected);
    });
  }

  it("uses the Manila date, not UTC, just after Manila midnight on Oct 24", () => {
    const api = run(NORMAL_DAY);
    expect(api.pick(new Date("2026-10-23T16:30:00Z"))).toEqual({ id: "halloween", year: 2026 });
  });

  it("ends the birthday window at Manila midnight on Nov 19", () => {
    const api = run(NORMAL_DAY);
    expect(api.pick(new Date("2026-11-18T16:00:00Z"))).toBeNull();
  });

  it("reads the calendar date in Manila as numbers", () => {
    const api = run(NORMAL_DAY);
    expect(api.manilaDay(new Date("2026-12-31T16:30:00Z"))).toEqual({ y: 2027, m: 1, d: 1 });
  });

  it("uses the celebrated year for New Year from the last days of December", () => {
    const api = run(NORMAL_DAY);
    expect(api.pick(new Date("2026-12-30T12:00:00+08:00"))).toEqual({ id: "newyear", year: 2027 });
  });
});

describe("seasonal.js ?theme= previews and allowlist", () => {
  const today = new Date(HALLOWEEN_DAY);

  it("turns everything off with ?theme=none, even inside an event window", () => {
    const api = run(NORMAL_DAY);
    expect(api.resolve(today, "?theme=none")).toBeNull();
  });

  it("previews any listed theme on any day, marked as a preview", () => {
    const api = run(NORMAL_DAY);
    expect(api.resolve(new Date(NORMAL_DAY), "?theme=christmas")).toEqual({ id: "christmas", year: 2026, preview: true });
  });

  it("previews New Year with the nearest occurrence year", () => {
    const api = run(NORMAL_DAY);
    expect(api.resolve(today, "?theme=newyear")).toEqual({ id: "newyear", year: 2027, preview: true });
  });

  for (const value of ["__proto__", "constructor", "Halloween", "<img src=x onerror=alert(1)>", "", "hasOwnProperty"]) {
    it(`ignores ?theme=${JSON.stringify(value)} and falls back to the date rule`, () => {
      const api = run(NORMAL_DAY);
      const search = `?theme=${encodeURIComponent(value)}`;
      expect(api.resolve(today, search)).toEqual({ id: "halloween", year: 2026, preview: false });
      expect(api.resolve(new Date(NORMAL_DAY), search)).toBeNull();
    });
  }

  it("does not put markup from the URL on the page", () => {
    run(HALLOWEEN_DAY, `/?theme=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
    expect(document.querySelector("img")).toBeNull();
    expect(strip().dataset.sea).toBe("halloween");
  });
});

describe("seasonal.js greetings", () => {
  const cases: [ThemeId, number, string][] = [
    ["halloween", 2026, "Happy Halloween from Omhar"],
    ["christmas", 2026, "Merry Christmas from Omhar"],
    ["newyear", 2027, "Happy New Year 2027"],
    ["birthday", 2026, "It's Omhar's birthday week"],
  ];
  for (const [id, year, text] of cases) {
    it(`greets ${id} with the exact words and no dash, colon or semicolon`, () => {
      const api = run(NORMAL_DAY);
      const got = api.greeting(id, year);
      expect(got).toBe(text);
      expect(got).not.toMatch(/[—:;]/);
    });
  }
});

describe("seasonal.js strip", () => {
  it("adds nothing and never reads storage on a normal day", () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    run(NORMAL_DAY);
    expect(document.querySelector(".sea")).toBeNull();
    expect(document.getElementById("sea-css")).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });

  it("adds nothing with ?theme=none inside an event window", () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    run(HALLOWEEN_DAY, "/?theme=none");
    expect(document.querySelector(".sea")).toBeNull();
    expect(document.getElementById("sea-css")).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });

  it("builds the strip in the planned shape", () => {
    run(HALLOWEEN_DAY);
    const sea = strip();
    expect(sea.tagName).toBe("ASIDE");
    expect(sea.dataset.sea).toBe("halloween");
    expect(sea.getAttribute("aria-label")).toBe("Seasonal greeting");
    expect(sea.querySelector(".sea-text")?.textContent).toBe("Happy Halloween from Omhar");
    const deco = sea.querySelector(".sea-deco");
    expect(deco?.getAttribute("aria-hidden")).toBe("true");
    expect(deco?.querySelectorAll("svg").length).toBeGreaterThanOrEqual(3);
    expect(deco?.querySelectorAll("svg").length).toBeLessThanOrEqual(5);
    const btn = sea.querySelector("button.sea-x");
    expect(btn?.getAttribute("type")).toBe("button");
    expect(btn?.getAttribute("aria-label")).toBe("Close the greeting");
    expect(btn?.querySelector("use")?.getAttribute("href")).toBe("/atelier/icons.svg#i-x");
    expect(document.getElementById("sea-css")?.tagName).toBe("STYLE");
  });

  it("adds a hidden themed drawing to the header name", () => {
    document.body.innerHTML = '<header class="top"><a class="logo" href="/">Omhar Regidor</a></header>';
    run(HALLOWEEN_DAY);
    const mark = document.querySelector("a.logo svg.sea-mark");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.getAttribute("focusable")).toBe("false");
  });

  it("adds the strip only once when the script runs twice", () => {
    run(HALLOWEEN_DAY);
    window.eval(src);
    expect(document.querySelectorAll(".sea")).toHaveLength(1);
  });
});

describe("seasonal.js close button", () => {
  it("saves the occurrence key and removes everything in date mode", () => {
    document.body.innerHTML = '<a class="logo" href="/">Omhar Regidor</a>';
    run(HALLOWEEN_DAY);
    pressClose();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("halloween-2026");
    expect(document.querySelector(".sea")).toBeNull();
    expect(document.querySelector(".sea-mark")).toBeNull();
    expect(document.getElementById("sea-css")).toBeNull();
  });

  it("keeps the strip away on the next visit once closed", () => {
    localStorage.setItem(STORAGE_KEY, "halloween-2026");
    run(HALLOWEEN_DAY);
    expect(document.querySelector(".sea")).toBeNull();
  });

  it("shows this year's event even when last year's was closed", () => {
    localStorage.setItem(STORAGE_KEY, "halloween-2025");
    run(HALLOWEEN_DAY);
    expect(strip().dataset.sea).toBe("halloween");
  });

  it("removes the strip in preview mode without saving anything", () => {
    const write = vi.spyOn(Storage.prototype, "setItem");
    run(NORMAL_DAY, "/?theme=christmas");
    pressClose();
    expect(document.querySelector(".sea")).toBeNull();
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("ignores a saved key in preview mode", () => {
    localStorage.setItem(STORAGE_KEY, "halloween-2026");
    const read = vi.spyOn(Storage.prototype, "getItem");
    run(HALLOWEEN_DAY, "/?theme=halloween");
    expect(strip().dataset.sea).toBe("halloween");
    expect(read).not.toHaveBeenCalled();
  });
});

describe("seasonal.js when storage throws", () => {
  it("still shows the strip and the X still hides it", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => run(HALLOWEEN_DAY)).not.toThrow();
    expect(strip().dataset.sea).toBe("halloween");
    expect(() => pressClose()).not.toThrow();
    expect(document.querySelector(".sea")).toBeNull();
  });
});

describe("seasonal.js motion", () => {
  it("starts no entrance or drift animation under reduced motion", () => {
    document.body.innerHTML = '<a class="logo" href="/">Omhar Regidor</a>';
    reducedMotion(true);
    run(HALLOWEEN_DAY);
    expect(strip().classList.contains("sea-in")).toBe(false);
    expect(strip().classList.contains("sea-still")).toBe(true);
    expect(document.querySelector(".sea-mark")?.classList.contains("sea-still")).toBe(true);
  });

  it("removes the strip at once on close under reduced motion", () => {
    reducedMotion(true);
    run(HALLOWEEN_DAY);
    strip().querySelector<HTMLButtonElement>("button.sea-x")?.click();
    vi.advanceTimersByTime(0);
    expect(document.querySelector(".sea")).toBeNull();
  });

  it("plays the entrance when motion is allowed", () => {
    reducedMotion(false);
    run(HALLOWEEN_DAY);
    expect(strip().classList.contains("sea-in")).toBe(true);
  });
});

describe("seasonal.js keep-clear", () => {
  it("hides the strip while the automations preview pill shows", async () => {
    document.body.innerHTML = '<p class="preview-pill" id="pill" hidden></p>';
    run(HALLOWEEN_DAY);
    expect(strip().classList.contains("sea-away")).toBe(false);
    const pill = document.getElementById("pill");
    if (!pill) throw new Error("no pill");
    pill.hidden = false;
    await Promise.resolve();
    expect(strip().classList.contains("sea-away")).toBe(true);
    pill.hidden = true;
    await Promise.resolve();
    expect(strip().classList.contains("sea-away")).toBe(false);
  });
});
