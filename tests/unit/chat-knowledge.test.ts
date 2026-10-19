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
      "Agad",
      "Documentary Generator",
      "HERA Bathroom",
      "HERA ATHENA",
    ]) {
      expect(kb).toContain(name);
    }
  });

  it("includes the WhatsApp link so the bot can route to a chat with Omhar", () => {
    expect(kb).toContain("wa.me/639506009518");
  });

  it("includes tech-stack and experience facts", () => {
    expect(kb).toContain("Next.js");
    expect(kb).toContain("Noxa");
  });

  it("explains what n8n is", () => {
    expect(kb).toContain("<automations>");
    expect(kb).toContain("n8n is a workflow automation tool");
    expect(kb).toContain("chain of steps called nodes");
  });

  it("includes all three automations with their tools, human step and page", () => {
    for (const [name, page] of [
      ["CS Live Inbox", "/automations#auto-live-inbox"],
      ["Daily Sales Pulse", "/automations#auto-sales-pulse"],
      ["SOP Assistant", "/automations#auto-sop"],
    ]) {
      expect(kb).toContain(name);
      expect(kb).toContain(page);
    }
    expect(kb).toContain("Gmail");
    expect(kb).toContain("Shopify");
    expect(kb).toContain("It never sends by itself.");
    expect(kb).toContain("so figures stay exact");
    expect(kb).toContain("the chat version remembers recent messages");
  });

  it("includes the gear and its page", () => {
    expect(kb).toContain("<gear>");
    expect(kb).toContain("/gear");
    expect(kb).toContain("MacBook Pro with the M4 Pro chip, in Space Black");
    expect(kb).toContain("Lenovo ThinkPad T460");
    expect(kb).toContain("AULA F75");
    expect(kb).toContain("A4Tech 2X Click");
  });

  it("adds no prices, dates or availability for the automations and gear", () => {
    const added = kb.slice(kb.indexOf("<automations>"), kb.indexOf("</automations>"));
    const gear = kb.slice(kb.indexOf("<gear>"), kb.indexOf("</gear>"));
    for (const section of [added, gear]) {
      expect(section).not.toMatch(/[$₱€£]|\b(19|20)\d{2}\b|available|availability/i);
    }
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
