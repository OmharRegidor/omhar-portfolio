import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * public/atelier/vendor/three.module.min.js is three.js r170, copied byte for byte from npm three@0.170.0
 * (build/three.module.min.js). The CSP only allows same-site scripts, so the file lives in the repo. This pins it:
 * any change to the file, even one byte, fails here.
 */
const SHA256 = "08fd7545d13d2c7fb65ab691530a802dafefd638596501854f267d0fb13c39e7";
const file = path.join(process.cwd(), "public", "atelier", "vendor", "three.module.min.js");
const bytes = readFileSync(file);
const text = bytes.toString("utf8");

describe("vendored three.js", () => {
  it("is the exact r170 file from npm", () => {
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(SHA256);
  });

  it("keeps its MIT license header at the top", () => {
    const header = text.slice(0, text.indexOf("*/") + 2);
    expect(text.startsWith("/**")).toBe(true);
    expect(header).toContain("@license");
    expect(header).toContain("SPDX-License-Identifier: MIT");
    expect(header).toContain("Three.js Authors");
  });

  it("is revision 170", () => {
    const rev = /const (\w+)="(\d+)"/.exec(text);
    expect(rev?.[2]).toBe("170");
    expect(text).toContain(`${rev?.[1]} as REVISION`);
  });

  it("imports nothing, so it loads as one same-site file", () => {
    // Static imports (default, named, namespace or bare), a dynamic import(), and re-exports from another file.
    // The file's own warning text "being imported." is prose, not a statement, so it does not match.
    expect(text).not.toMatch(/(^|[;}\s])import\s*(\{|\*|["'`]|[\w$]+\s*(,|from))/);
    expect(text).not.toMatch(/\bimport\s*\(/);
    expect(text).not.toMatch(/\bfrom\s*["'`]/);
  });
});
