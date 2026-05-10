import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "@/components/sections/section";

beforeEach(() => {
  vi.resetModules();
});

describe("Section", () => {
  it("renders nothing when empty in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const mod = await import("@/components/sections/section");
    const { container } = render(
      <mod.Section title="X" isEmpty emptyHint={{ title: "t", hint: "h" }}>
        n/a
      </mod.Section>,
    );
    expect(container).toBeEmptyDOMElement();
    vi.unstubAllEnvs();
  });

  it("renders dev hint when empty in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const mod = await import("@/components/sections/section");
    render(
      <mod.Section title="X" isEmpty emptyHint={{ title: "Title", hint: "Hint" }}>
        n/a
      </mod.Section>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Hint")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("renders children + aria-labelledby when not empty", () => {
    render(
      <Section title="My Section" isEmpty={false}>
        <span>visible</span>
      </Section>,
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "My Section" });
    expect(region).toBeInTheDocument();
  });
});
