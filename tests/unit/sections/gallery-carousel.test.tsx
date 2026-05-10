import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

vi.mock("@/content/gallery", () => ({ gallery: [] }));

describe("GalleryCarousel", () => {
  it("renders nothing when gallery is empty in production (no nav buttons leaked)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GalleryCarousel } = await import("@/components/sections/gallery-carousel");
    const { container } = render(<GalleryCarousel />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("renders dev hint when gallery empty in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { GalleryCarousel } = await import("@/components/sections/gallery-carousel");
    render(<GalleryCarousel />);
    expect(screen.getByText("Gallery empty")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
  });
});
