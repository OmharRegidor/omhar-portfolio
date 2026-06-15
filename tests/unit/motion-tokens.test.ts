import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Static contract test for the Phase 2 motion design system foundation.
 * Reads app/globals.css as text (Tailwind v4 source) and asserts the tokens,
 * ergonomic @utility shims, and the prefers-reduced-motion guard are present.
 * See docs/superpowers/specs/2026-06-15-phase2-motion-design-system-design.md.
 */
const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

describe("motion design system — globals.css", () => {
  it("defines the duration scale tokens (120/200/320/520ms)", () => {
    expect(css).toMatch(/--motion-fast:\s*120ms/);
    expect(css).toMatch(/--motion-base:\s*200ms/);
    expect(css).toMatch(/--motion-slow:\s*320ms/);
    expect(css).toMatch(/--motion-deliberate:\s*520ms/);
  });

  it("defines the brand easing curve as a Tailwind --ease-* token", () => {
    expect(css).toMatch(/--ease-brand:\s*cubic-bezier\([^)]*\)/);
  });

  it("exposes ergonomic duration-* @utility shims bound to the tokens", () => {
    for (const [name, token] of [
      ["fast", "--motion-fast"],
      ["base", "--motion-base"],
      ["slow", "--motion-slow"],
      ["deliberate", "--motion-deliberate"],
    ] as const) {
      const re = new RegExp(
        `@utility\\s+duration-${name}\\s*\\{[^}]*transition-duration:\\s*var\\(${token}\\)`,
      );
      expect(css, `missing @utility duration-${name}`).toMatch(re);
    }
  });

  describe("prefers-reduced-motion guard", () => {
    // isolate the guard block (inner rule close `}` + outer media close `}`) so
    // assertions can't match elsewhere and so it survives reformatting/indentation.
    const block = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\s*\}\s*\}/,
    )?.[0];

    it("has a reduced-motion media block targeting all elements", () => {
      expect(block, "no prefers-reduced-motion: reduce block found").toBeTruthy();
      expect(block!).toMatch(/\*\s*,\s*\*::before\s*,\s*\*::after/);
    });

    it("clamps transitions and animations to ~instant (0.01ms)", () => {
      expect(block!).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
      expect(block!).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
      expect(block!).toMatch(/animation-iteration-count:\s*1\s*!important/);
    });

    it("disables smooth scrolling", () => {
      expect(block!).toMatch(/scroll-behavior:\s*auto\s*!important/);
    });
  });
});
