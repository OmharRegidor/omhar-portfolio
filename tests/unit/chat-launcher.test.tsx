import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatLauncher } from "@/components/chat/chat-launcher";

const ring = (c: HTMLElement) => c.querySelector('[class*="animate-breathe"]');
const button = () => screen.getByRole("button", { name: "Ask Omhar AI" });

describe("ChatLauncher breathing ring", () => {
  it("always renders the breathing ring (aria-hidden, non-interactive)", () => {
    const { container } = render(<ChatLauncher />);
    const el = ring(container);
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute("aria-hidden");
    expect(el?.className).toContain("pointer-events-none");
  });

  it("keeps breathing after the chat is opened (does not stop)", async () => {
    const user = userEvent.setup();
    const { container } = render(<ChatLauncher />);
    await user.click(button());
    expect(ring(container)).not.toBeNull();
  });
});
