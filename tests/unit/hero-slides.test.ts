import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * public/atelier/hero-slides.js: the homepage hero photo rules (slide order, the costume map, the hold and burst
 * times, the crop math). Plain browser JS, so it is read as text and run in jsdom, like seasonal.test.ts.
 * Rules under test: .noxa/threejs-scroll-effects-and-hero-costumes/plan.md, "atelierHeroSlides".
 */
type CostumeId = "halloween" | "christmas" | "newyear" | "birthday";
type SlideKey = "costume" | "campus" | "lobby" | "studio" | "grad" | "nightcode";
interface HeroSlidesApi {
  COSTUMES: Readonly<Record<CostumeId, string>>;
  BASE: readonly SlideKey[];
  HOLD_MS: number;
  BURST_MS: number;
  costumeFor(theme: { id: string } | null): string | null;
  order(src: string | null): readonly SlideKey[];
  parsePosition(s: string): [number, number];
  coverOf(w: number, h: number, a: number, x: number, y: number): [number, number, number, number];
}
declare global {
  interface Window {
    atelierHeroSlides?: HeroSlidesApi;
  }
}

const src = readFileSync(path.join(process.cwd(), "public", "atelier", "hero-slides.js"), "utf8");
const BASE: readonly SlideKey[] = ["campus", "lobby", "studio", "grad", "nightcode"];
const IDS: readonly CostumeId[] = ["halloween", "christmas", "newyear", "birthday"];

let api: HeroSlidesApi;
beforeEach(() => {
  delete window.atelierHeroSlides;
  window.eval(src);
  const loaded = window.atelierHeroSlides;
  if (!loaded) throw new Error("hero-slides.js did not set window.atelierHeroSlides");
  api = loaded;
});

describe("slide order", () => {
  it("is the 5 usual photos, campus first, when there is no costume", () => {
    expect(api.order(null)).toEqual(BASE);
    expect(api.BASE).toEqual(BASE);
  });

  it("puts the costume first, then the same 5 photos, when a costume path is given", () => {
    expect(api.order("/atelier/hero/costume-halloween.jpg")).toEqual(["costume", ...BASE]);
  });
});

describe("costume map", () => {
  it.each(IDS)("maps %s to its own photo path", (id) => {
    expect(api.costumeFor({ id })).toBe(`/atelier/hero/costume-${id}.jpg`);
    expect(api.COSTUMES[id]).toBe(`/atelier/hero/costume-${id}.jpg`);
  });

  it("has exactly the 4 event ids", () => {
    expect(Object.keys(api.COSTUMES).sort()).toEqual([...IDS].sort());
  });

  it.each([["none"], ["__proto__"], ["../x"], ["constructor"], ["toString"], ["Halloween"], [""]])(
    "gives no costume for the id %j",
    (id) => {
      expect(api.costumeFor({ id })).toBeNull();
    },
  );

  it("gives no costume when there is no theme", () => {
    expect(api.costumeFor(null)).toBeNull();
  });

  it("freezes the map and the hook, so nothing can add a path later", () => {
    expect(Object.isFrozen(api.COSTUMES)).toBe(true);
    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.isFrozen(api.BASE)).toBe(true);
    expect(Object.isFrozen(api.order(null))).toBe(true);
    expect(Object.isFrozen(api.order("x"))).toBe(true);
  });
});

describe("timing", () => {
  it("holds each photo 6 seconds and bursts for 2.2 seconds", () => {
    expect(api.HOLD_MS).toBe(6000);
    expect(api.BURST_MS).toBe(2200);
  });
});

describe("parsePosition", () => {
  it("reads percentages as fractions from the left and from the top", () => {
    expect(api.parsePosition("78% 40%")).toEqual([0.78, 0.4]);
    expect(api.parsePosition("50% 22%")).toEqual([0.5, 0.22]);
  });

  it("reads keywords, including the vertical side named first", () => {
    expect(api.parsePosition("center")).toEqual([0.5, 0.5]);
    expect(api.parsePosition("top")).toEqual([0.5, 0]);
    expect(api.parsePosition("right")).toEqual([1, 0.5]);
    expect(api.parsePosition("left bottom")).toEqual([0, 1]);
    expect(api.parsePosition("top left")).toEqual([0, 0]);
  });

  it.each([[""], ["10px 20px"], ["1% 2% 3%"], ["banana"]])("counts %j as centred", (s) => {
    expect(api.parsePosition(s)).toEqual([0.5, 0.5]);
  });
});

describe("coverOf", () => {
  // The mockup's formula (mockup/assets/shared.js:19-25) with the left offset following posX.
  const mockup = (w: number, h: number, a: number, x: number, y: number) => {
    const ia = w / h;
    const sx = Math.min(1, a / ia);
    const sy = Math.min(1, ia / a);
    return [sx, sy, (1 - sx) * x, (1 - sy) * (1 - y)];
  };

  it("matches the mockup for the campus photo in a square box", () => {
    const got = api.coverOf(1364, 1153, 1, 0.5, 0.22);
    const want = mockup(1364, 1153, 1, 0.5, 0.22);
    got.forEach((v, i) => expect(v).toBeCloseTo(want[i] ?? NaN, 10));
    expect(got[1]).toBe(1);
    expect(got[3]).toBe(0);
  });

  it("crops top and bottom for a wide box, keeping the face 22% from the top", () => {
    const [sx, sy, ox, oy] = api.coverOf(1000, 1000, 2, 0.5, 0.22);
    expect(sx).toBe(1);
    expect(sy).toBeCloseTo(0.5, 10);
    expect(ox).toBe(0);
    expect(oy).toBeCloseTo(0.5 * 0.78, 10);
  });

  it("follows posX for a narrow box", () => {
    const [sx, , ox] = api.coverOf(2000, 1000, 1, 0.78, 0.4);
    expect(sx).toBeCloseTo(0.5, 10);
    expect(ox).toBeCloseTo(0.5 * 0.78, 10);
  });
});
