import "@testing-library/jest-dom/vitest";

// jsdom lacks matchMedia; the chat panel (and embla) read it. Provide a stub
// that reports the desktop breakpoint (matches: false) so components render.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
