import { describe, it, expect } from "vitest";
import { EVAL_CASES } from "./cases";
import { runChatWithFallback } from "@/lib/chat/run-chat";

const RUN = process.env.RUN_CHAT_EVAL === "1";

async function ask(question: string): Promise<string> {
  const res = await runChatWithFallback({ messages: [{ role: "user", content: question }] });
  return (await res.text()).toLowerCase();
}

describe("chat eval set (gated by RUN_CHAT_EVAL=1 + a provider key)", () => {
  for (const c of EVAL_CASES) {
    it.skipIf(!RUN)(
      c.id,
      async () => {
        const reply = await ask(c.question);

        if (c.expectIncludesAny) {
          expect(
            c.expectIncludesAny.some((s) => reply.includes(s.toLowerCase())),
            `expected one of ${JSON.stringify(c.expectIncludesAny)} in: ${reply}`,
          ).toBe(true);
        }
        if (c.expectOffersCalendly) {
          // Require the actual booking URL, not a loose " call" substring that
          // "recall"/"tough call" would satisfy.
          expect(
            reply.includes("calendly.com/omharregidor"),
            `expected the Calendly booking URL in: ${reply}`,
          ).toBe(true);
        }
        for (const f of c.forbidIncludes ?? []) {
          expect(reply.includes(f.toLowerCase()), `must not leak "${f}" in: ${reply}`).toBe(false);
        }
      },
      30_000,
    );
  }
});
