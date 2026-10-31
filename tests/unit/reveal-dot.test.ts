import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * public/atelier/reveal.js: the scroll entrance shared by the 3 static Atelier pages. Every page now uses the dot
 * style. The script is plain browser JS, so it is read as text and run in jsdom with a fake IntersectionObserver,
 * a fake Element.animate and a fake CSS object. Rules under test: .noxa/threejs-scroll-effects-and-hero-costumes/
 * plan.md, "revealDot".
 */
type Entry = Pick<IntersectionObserverEntry, "target" | "isIntersecting" | "intersectionRatio" | "boundingClientRect">;
type Report = (entries: Entry[]) => void;
type Frames = Record<string, string | number>[];
type Call = { el: Element; frames: Frames; options: number | KeyframeAnimationOptions; anim: FakeAnimation };
type FakeAnimation = { pause: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };

const src = readFileSync(path.join(process.cwd(), "public", "atelier", "reveal.js"), "utf8");

let observers: FakeIO[] = [];
class FakeIO {
  observed = new Set<Element>();
  constructor(public report: Report) {
    observers.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  takeRecords() {
    return [];
  }
}

let calls: Call[] = [];
function fakeAnimate(this: Element, frames: Frames, options: number | KeyframeAnimationOptions) {
  const anim: FakeAnimation = { pause: vi.fn(), cancel: vi.fn() };
  calls.push({ el: this, frames, options, anim });
  return anim;
}
const realAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

function mediaQuery(reduce: boolean) {
  return (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion: reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

function setup({ reduce = false, masks = true } = {}) {
  vi.stubGlobal("matchMedia", mediaQuery(reduce));
  vi.stubGlobal(
    "CSS",
    masks ? { registerProperty: vi.fn(), supports: vi.fn(() => true) } : { supports: vi.fn(() => true) },
  );
  window.eval(src);
}

const io = (): FakeIO => {
  const first = observers[0];
  if (!first) throw new Error("reveal.js made no IntersectionObserver");
  return first;
};
const report = (el: Element, isIntersecting: boolean, intersectionRatio = isIntersecting ? 1 : 0) =>
  io().report([{ target: el, isIntersecting, intersectionRatio, boundingClientRect: el.getBoundingClientRect() }]);
const block = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`no #${id}`);
  return el;
};
const sizeOf = (el: Element, height: number, width = 300) =>
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 800, width, height));

// A block below the fold: its first report says it is off screen (so it is held), then it scrolls in.
function scrollIn(el: Element): Call {
  report(el, false);
  report(el, true, 0.5);
  const entrance = calls.filter((c) => c.el === el).at(-1);
  if (!entrance) throw new Error("no animation for the block");
  return entrance;
}
const isDot = (frames: Frames) => frames.length === 2 && "--fx-dot" in (frames[0] ?? {});

beforeEach(() => {
  observers = [];
  calls = [];
  vi.stubGlobal("IntersectionObserver", FakeIO);
  Object.defineProperty(Element.prototype, "animate", { value: fakeAnimate, configurable: true, writable: true });
  document.body.dataset.reveal = "dot";
  document.body.innerHTML = `
    <section><div class="sec-lead" id="small">Small block</div></section>
    <section><div class="t-viewport" id="tall">Testimonials</div></section>
    <div id="deck"><div class="sec-lead" id="in-deck">Deck card</div></div>
    <header class="hero"><div class="sec-lead" id="in-hero">Hero text</div></header>`;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (realAnimate) Object.defineProperty(Element.prototype, "animate", realAnimate);
  else Reflect.deleteProperty(Element.prototype, "animate");
  delete document.body.dataset.reveal;
});

describe("reveal.js dot style", () => {
  it("never watches anything inside the project deck or the hero", () => {
    setup();
    const watched = [...io().observed].map((el) => el.id);
    expect(watched).toContain("small");
    expect(watched).toContain("tall");
    expect(watched).not.toContain("in-deck");
    expect(watched).not.toContain("in-hero");
  });

  it("holds a block that starts below the fold with opacity only", () => {
    setup();
    report(block("small"), false);
    const hold = calls.find((c) => c.el.id === "small");
    expect(hold?.frames).toEqual([{ opacity: 0 }, { opacity: 0 }]);
    expect(hold?.anim.pause).toHaveBeenCalled();
  });

  it("brings a small block in through the dot screen that grows to solid", () => {
    setup();
    const el = block("small");
    const entrance = scrollIn(el);
    expect(isDot(entrance.frames)).toBe(true);
    const [from, to] = entrance.frames;
    expect(from?.["--fx-dot"]).toBe("0px");
    expect(to?.["--fx-dot"]).toBe("7px");
    expect(String(from?.maskImage)).toContain("radial-gradient");
    expect(String(from?.maskImage)).toContain("var(--fx-dot)");
    expect(from?.maskSize).toBe("100% 100%, 9px 9px");
    expect(entrance.options).toMatchObject({ duration: 1100, fill: "backwards" });
    // The paused hold is let go before the entrance starts.
    expect(calls.find((c) => c.el === el)?.anim.cancel).toHaveBeenCalled();
  });

  it("gives a block taller than 90% of the window the plain fade and rise", () => {
    setup();
    const el = block("tall");
    sizeOf(el, innerHeight * 0.95);
    const entrance = scrollIn(el);
    expect(isDot(entrance.frames)).toBe(false);
    expect(entrance.frames).toEqual([
      { opacity: 0, translate: "0 14px" },
      { opacity: 1, translate: "0 0" },
    ]);
    expect(entrance.options).toMatchObject({ duration: 900, fill: "backwards" });
  });

  it("gives a block bigger than 60% of the window area the plain fade and rise", () => {
    setup();
    const el = block("tall");
    sizeOf(el, innerHeight * 0.7, innerWidth);
    expect(isDot(scrollIn(el).frames)).toBe(false);
  });

  it("gives every block the plain fade and rise when CSS.registerProperty is missing", () => {
    setup({ masks: false });
    const entrance = scrollIn(block("small"));
    expect(isDot(entrance.frames)).toBe(false);
    expect(entrance.frames[0]).toEqual({ opacity: 0, translate: "0 14px" });
  });

  it("leaves no style or class behind on a block once it is in", () => {
    setup();
    const el = block("small");
    const before = el.getAttribute("class");
    const entrance = scrollIn(el);
    expect(el.hasAttribute("style")).toBe(false);
    expect(el.getAttribute("class")).toBe(before);
    // fill: backwards drops the effect when the entrance ends, and the hold is cancelled, so nothing stays applied.
    expect(entrance.options).toMatchObject({ fill: "backwards" });
    expect(io().observed.has(el)).toBe(false);
  });

  it("leaves a block that is already on screen at load alone", () => {
    setup();
    const el = block("small");
    report(el, true);
    expect(calls.filter((c) => c.el === el)).toHaveLength(0);
    expect(io().observed.has(el)).toBe(false);
  });

  it("watches nothing and animates nothing under reduced motion", () => {
    setup({ reduce: true });
    expect(observers.every((o) => o.observed.size === 0)).toBe(true);
    expect(calls).toHaveLength(0);
  });
});
