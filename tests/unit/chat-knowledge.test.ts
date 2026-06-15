import { describe, it, expect } from "vitest";
import { buildKnowledgeBlock, estimateTokens } from "@/lib/chat/knowledge";

describe("buildKnowledgeBlock", () => {
  const kb = buildKnowledgeBlock();

  it("includes the owner's name and role", () => {
    expect(kb).toContain("Omhar Regidor");
    expect(kb.toLowerCase()).toContain("developer");
  });

  it("includes every project name", () => {
    for (const name of [
      "BiNuKBoK View Point Resort",
      "Noxa Loyalty",
      "SweetBlooms",
      "JAZA Media",
      "Crisia VA",
      "SalesPipe",
    ]) {
      expect(kb).toContain(name);
    }
  });

  it("includes the Calendly URL so the bot can route to a booking", () => {
    expect(kb).toContain("calendly.com/omharregidor/30min");
  });

  it("includes tech-stack and experience facts", () => {
    expect(kb).toContain("Next.js");
    expect(kb).toContain("Noxa");
  });

  it("stays within a safe token budget for context-stuffing", () => {
    expect(estimateTokens(kb)).toBeLessThan(3500);
  });
});

describe("estimateTokens", () => {
  it("approximates ~4 chars per token", () => {
    expect(estimateTokens("12345678")).toBe(2);
  });
});
