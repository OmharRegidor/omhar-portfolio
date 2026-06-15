import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

vi.mock("@/content/gallery", () => ({ gallery: [] }));

describe("Gallery", () => {
  it("renders nothing when gallery is empty in production (no nav buttons leaked)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { Gallery } = await import("@/components/sections/gallery");
    const { container } = render(<Gallery />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("renders dev hint when gallery empty in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { Gallery } = await import("@/components/sections/gallery");
    render(<Gallery />);
    expect(screen.getByText("Gallery empty")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
  });
});
