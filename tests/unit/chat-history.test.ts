import { describe, it, expect } from "vitest";
import { boundMessages } from "@/lib/chat/history";
import type { ChatMessage } from "@/content/schemas";

const msg = (content: string, role: ChatMessage["role"] = "user"): ChatMessage => ({
  role,
  content,
});

describe("boundMessages", () => {
  it("returns every message untouched when under budget", () => {
    const input = [msg("a"), msg("b", "assistant"), msg("c")];
    expect(boundMessages(input, 1000)).toEqual(input);
  });

  it("drops the oldest messages first when over budget, keeping recent ones", () => {
    const input = [msg("oldest"), msg("middle"), msg("newest")];
    // budget only fits the two newest ("middle" + "newest")
    const out = boundMessages(input, 12);
    expect(out).toEqual([msg("middle"), msg("newest")]);
  });

  it("preserves chronological order of the kept messages", () => {
    const input = [msg("1"), msg("2"), msg("3"), msg("4")];
    // budget 2 fits the two newest single-char messages; "1" and "2" are dropped
    const out = boundMessages(input, 2);
    expect(out.map((m) => m.content)).toEqual(["3", "4"]);
  });

  it("always keeps at least the final message even if it alone exceeds budget", () => {
    const input = [msg("old"), msg("a".repeat(500))];
    const out = boundMessages(input, 10);
    expect(out).toEqual([msg("a".repeat(500))]);
  });
});
