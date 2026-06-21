import { describe, it, expect } from "vitest";
import { Home } from "lucide-react";
import { filterNavItems, type NavItem } from "@/components/command-palette/filter";
import { navItems } from "@/components/command-palette/nav-items";

describe("filterNavItems", () => {
  it("returns all items for an empty or whitespace query", () => {
    expect(filterNavItems(navItems, "")).toHaveLength(navItems.length);
    expect(filterNavItems(navItems, "   ")).toHaveLength(navItems.length);
  });

  it("matches by label substring, case-insensitively", () => {
    expect(filterNavItems(navItems, "TECH").map((i) => i.href)).toEqual(["/tech-stack"]);
  });

  it("matches by keyword alias", () => {
    expect(filterNavItems(navItems, "cv").map((i) => i.href)).toEqual(["/resume"]);
    expect(filterNavItems(navItems, "work").map((i) => i.href)).toEqual(["/projects"]);
  });

  it("ranks label startsWith above contains/keyword matches", () => {
    const items: NavItem[] = [
      { label: "Beta Alpha", href: "/b", icon: Home }, // contains "alpha"
      { label: "Alpha", href: "/a", icon: Home }, // starts with "alpha"
    ];
    expect(filterNavItems(items, "alpha").map((i) => i.href)).toEqual(["/a", "/b"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterNavItems(navItems, "zzz")).toEqual([]);
  });
});
