import type { NavItem } from "./nav-items";

export type { NavItem };

export function filterNavItems(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const starts: NavItem[] = [];
  const contains: NavItem[] = [];

  for (const item of items) {
    const label = item.label.toLowerCase();
    if (label.startsWith(q)) {
      starts.push(item);
    } else if (label.includes(q) || (item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false)) {
      contains.push(item);
    }
  }

  return [...starts, ...contains];
}
