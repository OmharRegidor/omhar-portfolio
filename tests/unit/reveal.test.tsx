import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Reveal } from "@/components/motion/reveal";

type IOEntry = Partial<IntersectionObserverEntry>;
type IOCallback = (entries: IOEntry[], observer: IntersectionObserver) => void;

interface MockInstance {
  cb: IOCallback;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}
let ioInstances: MockInstance[] = [];

class MockIO {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public cb: IOCallback) {
    ioInstances.push(this);
  }
  takeRecords() {
    return [];
  }
}

const realIO = globalThis.IntersectionObserver;
const realMatchMedia = window.matchMedia;

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes("prefers-reduced-motion"),
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const wrapperOf = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const fire = (i: MockInstance, isIntersecting: boolean, el: Element) =>
  act(() => i.cb([{ isIntersecting, target: el }], i as unknown as IntersectionObserver));

beforeEach(() => {
  ioInstances = [];
  globalThis.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;
  setReducedMotion(false);
});

afterEach(() => {
  globalThis.IntersectionObserver = realIO;
  window.matchMedia = realMatchMedia;
});

describe("Reveal", () => {
  it("renders its children and forwards className to the wrapper", () => {
    const { container } = render(
      <Reveal className="order-3 md:order-none">
        <p>hello reveal</p>
      </Reveal>,
    );
    expect(screen.getByText("hello reveal")).toBeInTheDocument();
    expect(wrapperOf(container).className).toContain("order-3");
  });

  it("stays visible and creates no observer under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Reveal><p>x</p></Reveal>);
    expect(wrapperOf(container).className).toContain("opacity-100");
    expect(wrapperOf(container).className).not.toContain("opacity-0");
    expect(ioInstances).toHaveLength(0);
  });

  it("starts visible with no transition before any observer callback", () => {
    const { container } = render(<Reveal><p>x</p></Reveal>);
    const el = wrapperOf(container);
    expect(ioInstances).toHaveLength(1);
    expect(ioInstances[0]!.observe).toHaveBeenCalledOnce();
    // phase "initial": visible, no transition yet (so SSR/first paint never hides it)
    expect(el.className).toContain("opacity-100");
    expect(el.className).not.toContain("transition");
  });

  it("hides an off-screen block on first report, then fades it up on enter (once)", () => {
    const { container } = render(<Reveal><p>x</p></Reveal>);
    const el = wrapperOf(container);

    fire(ioInstances[0]!, false, el); // first post-layout report: off-screen
    expect(el.className).toContain("opacity-0");
    expect(el.className).toContain("transition");
    expect(ioInstances[0]!.disconnect).not.toHaveBeenCalled();

    fire(ioInstances[0]!, true, el); // enters view
    expect(el.className).toContain("opacity-100");
    expect(el.className).not.toContain("opacity-0");
    expect(ioInstances[0]!.disconnect).toHaveBeenCalledOnce();
  });

  it("reveals immediately (never hides) when already in view on the first report", () => {
    const { container } = render(<Reveal><p>x</p></Reveal>);
    const el = wrapperOf(container);

    fire(ioInstances[0]!, true, el);
    expect(el.className).toContain("opacity-100");
    expect(el.className).not.toContain("opacity-0");
    expect(ioInstances[0]!.disconnect).toHaveBeenCalledOnce();
  });

  it("reveals a display:none block without observing it (empty section)", () => {
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ display: "none" } as CSSStyleDeclaration);
    const { container } = render(<Reveal><p>x</p></Reveal>);
    expect(wrapperOf(container).className).toContain("opacity-100");
    expect(ioInstances).toHaveLength(0);
    spy.mockRestore();
  });
});
