import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatLauncher } from "@/components/chat/chat-launcher";

// Mirrors the key in chat-launcher.tsx.
const SEEN_KEY = "omhar-chat-launcher-seen";
const ring = (c: HTMLElement) => c.querySelector('[class*="animate-breathe"]');
const button = () => screen.getByRole("button", { name: "Ask Omhar AI" });

beforeEach(() => {
  sessionStorage.clear();
});

describe("ChatLauncher breathing ring", () => {
  it("breathes on a fresh session (ring appears after mount)", async () => {
    const { container } = render(<ChatLauncher />);
    await waitFor(() => expect(ring(container)).not.toBeNull());
  });

  it("stops breathing and remembers, once the chat is opened", async () => {
    const user = userEvent.setup();
    const { container } = render(<ChatLauncher />);
    await waitFor(() => expect(ring(container)).not.toBeNull());

    await user.click(button());

    expect(ring(container)).toBeNull();
    expect(sessionStorage.getItem(SEEN_KEY)).toBe("1");
  });

  it("does not breathe when the visitor already opened the chat this session", async () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    const { container } = render(<ChatLauncher />);
    await waitFor(() => expect(button()).toBeInTheDocument());
    expect(ring(container)).toBeNull();
  });
});
