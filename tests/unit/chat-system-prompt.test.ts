import { describe, it, expect } from "vitest";
import { buildSystemPrompt, USER_INPUT_OPEN, USER_INPUT_CLOSE } from "@/lib/chat/system-prompt";
import { estimateTokens } from "@/lib/chat/knowledge";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("establishes the third-person assistant persona (is NOT Omhar)", () => {
    expect(prompt).toContain("Omhar's AI assistant");
    expect(prompt.toLowerCase()).toContain("not omhar");
  });

  it("embeds the knowledge base (so answers are grounded)", () => {
    expect(prompt).toContain("Omhar Regidor");
    expect(prompt).toContain("BiNuKBoK View Point Resort");
  });

  it("instructs the model to redirect off-topic questions to Calendly", () => {
    expect(prompt.toLowerCase()).toContain("calendly");
    expect(prompt).toContain("calendly.com/omharregidor/30min");
  });

  it("forbids inventing facts not present in the knowledge base", () => {
    expect(prompt.toLowerCase()).toMatch(/never (invent|make up|fabricate)/);
  });

  it("declares the user-input delimiter as untrusted data, not instructions", () => {
    expect(prompt).toContain(USER_INPUT_OPEN);
    expect(prompt).toContain(USER_INPUT_CLOSE);
    expect(prompt.toLowerCase()).toContain("untrusted");
  });

  it("forbids committing to prices, dates, or hiring terms on Omhar's behalf", () => {
    expect(prompt.toLowerCase()).toMatch(/price|rate|cost/);
  });

  it("stays within a safe token budget so it fits every free-tier context window", () => {
    // Guards against content authors growing /content past the stuffing budget.
    expect(estimateTokens(prompt)).toBeLessThan(4000);
  });
});
