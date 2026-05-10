export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
      © {new Date().getFullYear()}. All rights reserved.
    </footer>
  );
}
