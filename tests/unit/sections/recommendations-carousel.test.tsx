import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

vi.mock("@/content/recommendations", () => ({ recommendations: [] }));

describe("RecommendationsCarousel", () => {
  it("returns null even in development when recommendations is empty (hard hide)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { RecommendationsCarousel } = await import(
      "@/components/sections/recommendations-carousel"
    );
    const { container } = render(<RecommendationsCarousel />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/recommendations/i)).not.toBeInTheDocument();
  });

  it("returns null in production when empty", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { RecommendationsCarousel } = await import(
      "@/components/sections/recommendations-carousel"
    );
    const { container } = render(<RecommendationsCarousel />);
    expect(container).toBeEmptyDOMElement();
  });
});
