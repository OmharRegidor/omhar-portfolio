import { BackToHome } from "@/components/layout/back-to-home";

export default function NotFound() {
  return (
    <div className="text-center py-24 space-y-4">
      <h1 className="text-[length:var(--text-display)] font-bold">404</h1>
      <p className="text-[hsl(var(--muted-foreground))]">Page not found.</p>
      <BackToHome />
    </div>
  );
}
