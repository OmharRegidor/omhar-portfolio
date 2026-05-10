import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedAward } from "@/components/hero/featured-award";

describe("FeaturedAward", () => {
  it("returns null when awards array is empty", () => {
    const { container } = render(<FeaturedAward awards={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides next button when only 1 award", () => {
    render(<FeaturedAward awards={[{ title: "Only Award" }]} />);
    expect(screen.getByText("Only Award")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next award" })).not.toBeInTheDocument();
  });

  it("shows next button when 2+ awards", () => {
    render(
      <FeaturedAward
        awards={[{ title: "First" }, { title: "Second" }]}
      />,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next award" })).toBeInTheDocument();
  });
});
