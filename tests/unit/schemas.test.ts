import { describe, it, expect } from "vitest";
import { ProjectsSchema, ChatRequestSchema, ProfileSchema } from "@/content/schemas";

describe("schemas", () => {
  it("rejects duplicate project slugs", () => {
    const result = ProjectsSchema.safeParse([
      { slug: "a", name: "A", blurb: "x", url: "https://a.com" },
      { slug: "a", name: "B", blurb: "y", url: "https://b.com" },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects empty project array", () => {
    expect(ProjectsSchema.safeParse([]).success).toBe(false);
  });

  it("rejects empty bioParagraphs", () => {
    const r = ProfileSchema.safeParse({
      name: "x", role: "x", location: "x", photoSrc: "x.jpg",
      bioParagraphs: [], calendlyUrl: "https://calendly.com/x/y",
    });
    expect(r.success).toBe(false);
  });

  it("rejects chat message > 1000 chars", () => {
    expect(ChatRequestSchema.safeParse({ message: "a".repeat(1001) }).success).toBe(false);
  });

  it("rejects chat with extra fields (strict)", () => {
    expect(ChatRequestSchema.safeParse({ message: "hi", evil: "x" }).success).toBe(false);
  });
});
