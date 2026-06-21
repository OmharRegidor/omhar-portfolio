import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));

import { SiteControls } from "@/components/layout/site-controls";

describe("SiteControls", () => {
  it("renders the trigger pill and the theme switch", () => {
    render(<SiteControls />);
    expect(screen.getByRole("button", { name: "Go to page" })).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("opens the palette when the pill is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteControls />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page" }));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("toggles the palette with Cmd+K and Ctrl+K", () => {
    render(<SiteControls />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
