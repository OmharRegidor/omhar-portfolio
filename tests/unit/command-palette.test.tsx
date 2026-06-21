import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/projects",
}));

import { CommandPalette } from "@/components/command-palette/command-palette";
import { navItems } from "@/components/command-palette/nav-items";

beforeEach(() => push.mockClear());

const renderOpen = () => render(<CommandPalette open onOpenChange={() => {}} />);

describe("CommandPalette", () => {
  it("lists every page when opened with an empty query", () => {
    renderOpen();
    expect(screen.getAllByRole("option")).toHaveLength(navItems.length);
  });

  it("exposes combobox + listbox semantics with an active descendant", () => {
    renderOpen();
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-controls");
    expect(combobox).toHaveAttribute("aria-activedescendant");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("filters the list as the visitor types", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.type(screen.getByRole("combobox"), "cv");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Resume");
  });

  it("navigates to the highlighted page on Enter", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Enter}"); // highlight 0 = Home
    expect(push).toHaveBeenCalledWith("/");
  });

  it("moves the highlight with arrow keys before navigating", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}"); // 0 -> 1 = Projects
    expect(push).toHaveBeenCalledWith("/projects");
  });

  it("navigates on click", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByText("Tech Stack"));
    expect(push).toHaveBeenCalledWith("/tech-stack");
  });

  it("shows an empty state and does not navigate on Enter when nothing matches", async () => {
    const user = userEvent.setup();
    renderOpen();
    const combobox = screen.getByRole("combobox");
    await user.type(combobox, "zzz");
    expect(screen.getByText(/no pages match/i)).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(push).not.toHaveBeenCalled();
  });

  it("marks the current route (usePathname = /projects)", () => {
    renderOpen();
    const projects = screen.getByText("Projects").closest('[role="option"]');
    expect(projects).toHaveTextContent(/current/i);
  });
});
