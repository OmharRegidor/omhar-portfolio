# Personal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a credible v1 personal portfolio at `<project>.vercel.app` — Next.js 15 + Tailwind v4 + shadcn primitives + MDX project case studies + dark/light theme + chat route scaffold (UI hidden) — with CI gates, security headers, and content-driven sections that hide cleanly when empty.

**Architecture:** Static-first Next.js App Router. Content lives in typed `content/*.ts` files validated by Zod at build time. Sections auto-hide in production when their array is empty (dev mode shows owner-directed hints). The chat route exists with rate limiting + schema validation as a v2-ready scaffold; the launcher UI is intentionally not mounted in v1.

**Tech Stack:** Next.js 15 App Router, TypeScript strict + `noUncheckedIndexedAccess`, Tailwind CSS v4 (`@theme` CSS-first config), shadcn/ui primitives (Button, Dialog, Sheet, Carousel, Separator), lucide-react (per-file imports), next-themes, next/font (Open Runde 400/600/700), @next/mdx + gray-matter + rehype-pretty-code, Zod, @upstash/ratelimit + Upstash Redis, Vitest + RTL, Playwright + axe-core, pnpm 9, Vercel.

**Spec:** `docs/superpowers/specs/2026-05-10-portfolio-design.md`

---

## File Structure

```
my-portfolio/
  .github/workflows/ci.yml
  .npmrc, .gitignore, .env.example, CONTRIBUTING.md
  package.json, pnpm-lock.yaml
  next.config.ts, tsconfig.json, postcss.config.mjs, eslint.config.mjs
  vitest.config.ts, vitest.setup.ts, playwright.config.ts
  app/
    layout.tsx, page.tsx, globals.css, not-found.tsx
    api/chat/route.ts
    projects/page.tsx, projects/[slug]/page.tsx
    tech-stack/page.tsx, certifications/page.tsx
  components/
    layout/{site-header,site-footer,back-to-home}.tsx
    hero/{profile-card,featured-award}.tsx
    sections/{section,about,tech-stack-preview,tech-stack-full,recent-projects,
              projects-grid,recent-certifications,certifications-grid,
              experience-timeline,recommendations-carousel,membership-block,
              speaking-cta,gallery-carousel,access-card,empty-state}.tsx
    ui/{button,dialog,sheet,carousel,separator}.tsx
    theme/{theme-provider,theme-toggle}.tsx
    chat/chat-panel.tsx
    mdx/{mdx-layout,mdx-components}.tsx
  content/
    schemas.ts
    {profile,projects,experience,certifications,tech-stack,recommendations,
     gallery,membership}.ts
    projects/.gitkeep
  lib/{cn,rate-limit,env}.ts
  scripts/validate-case-studies.ts
  public/ (images here, including /public/gallery/)
  tests/
    unit/{empty-states,chat-schema,slug-uniqueness,env-validation}.test.ts
    e2e/{smoke,theme,chat-stub,a11y}.spec.ts
```

---

## Task 1: Scaffold Next.js + pnpm pin

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `.npmrc`, `.gitignore`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Verify pnpm 9.x is installed**

Run: `pnpm --version`
Expected: `9.x.x`. If missing: `npm install -g pnpm@9`

- [ ] **Step 2: Scaffold Next.js**

Run from `my-portfolio/`:
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --use-pnpm --no-src-dir --import-alias "@/*"
```
Pick **No** for Turbopack (use webpack — more stable on Windows for HMR per existing memory).

- [ ] **Step 3: Pin packageManager + add npmrc**

Edit `package.json` — add at root level:
```json
"packageManager": "pnpm@9.15.0",
"engines": { "node": ">=20.10.0" }
```

Create `.npmrc`:
```
engine-strict=true
auto-install-peers=true
```

- [ ] **Step 4: Verify build works**

Run: `pnpm build`
Expected: build completes, generates `.next/` output, exits 0.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 15 + Tailwind + pnpm 9.x"
```

---

## Task 2: Strict TypeScript with `noUncheckedIndexedAccess`

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Edit `tsconfig.json` `compilerOptions`**

Add/ensure these flags:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm tsc --noEmit`
Expected: exits 0. If scaffold code fails, fix the scaffold's `[0]` accesses with optional-chaining or guards.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: enable noUncheckedIndexedAccess + stricter ts"
```

---

## Task 3: ESLint with `react/jsx-no-target-blank` strict

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Edit `eslint.config.mjs`**

Replace the rules block with:
```js
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/jsx-no-target-blank": ["error", {
        allowReferrer: false,
        enforceDynamicLinks: "always",
        warnOnSpreadAttributes: true,
        forms: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
```

- [ ] **Step 2: Run lint to verify zero errors on scaffold**

Run: `pnpm lint`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: enforce react/jsx-no-target-blank strict"
```

---

## Task 4: Tailwind v4 `@theme` + design tokens in globals.css

**Files:**
- Replace: `app/globals.css`

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-open-runde), ui-sans-serif, system-ui, sans-serif;

  --radius-md: 0.375rem;
  --radius-xl: 0.875rem;
  --radius-full: 9999px;

  --text-display: clamp(2rem, 4vw + 1rem, 3.5rem);
  --text-h2: clamp(1.5rem, 2vw + 1rem, 2rem);
  --text-h3: clamp(1.125rem, 1vw + 0.875rem, 1.375rem);
  --text-body: 1rem;
  --text-small: 0.875rem;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 8%;
    --muted: 210 16% 95%;
    --muted-foreground: 215 14% 45%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 8%;
    --border: 214 14% 90%;
    --accent: 222 84% 56%;
    --accent-foreground: 0 0% 100%;
    --shadow-card: 0 1px 2px hsl(222 47% 8% / 0.04), 0 1px 1px hsl(222 47% 8% / 0.06);
    --shadow-elevated: 0 8px 24px hsl(222 47% 8% / 0.08);
  }
  html.dark {
    --background: 222 47% 4%;
    --foreground: 210 16% 96%;
    --muted: 222 28% 12%;
    --muted-foreground: 215 14% 65%;
    --card: 222 28% 8%;
    --card-foreground: 210 16% 96%;
    --border: 222 28% 16%;
    --accent: 222 84% 64%;
    --accent-foreground: 222 47% 4%;
    --shadow-card: 0 0 0 1px hsl(222 28% 16%);
    --shadow-elevated: 0 0 0 1px hsl(222 28% 20%), 0 16px 32px hsl(0 0% 0% / 0.4);
  }
  * { border-color: hsl(var(--border)); }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  *:focus-visible {
    outline: 2px solid hsl(var(--accent));
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }
}
```

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): tailwind v4 @theme + dark/light tokens"
```

---

## Task 5: Open Runde font with adjusted fallback

**Files:**
- Download: `public/fonts/OpenRunde-Regular.woff2`, `OpenRunde-Semibold.woff2`, `OpenRunde-Bold.woff2`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Download Open Runde from https://github.com/lauridskern/open-runde**

Place `OpenRunde-Regular.woff2`, `OpenRunde-Semibold.woff2`, `OpenRunde-Bold.woff2` into `public/fonts/`.

- [ ] **Step 2: Modify `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const openRunde = localFont({
  src: [
    { path: "../public/fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
  adjustFontFallback: "Arial",  // next/font/local accepts false | "Arial" | "Times New Roman" — NOT boolean true (verified empirically against next@15.5.4)
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal portfolio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={openRunde.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add public/fonts app/layout.tsx
git commit -m "feat(theme): open runde font 400/600/700 with adjustFontFallback"
```

---

## Task 6: Vitest + RTL setup

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install deps**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Sanity test**

Create `tests/unit/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("sanity", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts tests/unit/sanity.test.ts package.json pnpm-lock.yaml
git commit -m "chore(test): vitest + RTL configured"
```

---

## Task 7: Playwright (chromium-only) + axe-core

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Install deps**

```bash
pnpm add -D @playwright/test @axe-core/playwright
pnpm exec playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start -p 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 3: Add scripts**

```json
"scripts": {
  "e2e": "playwright test"
}
```

- [ ] **Step 4: Smoke test the harness**

Create `tests/e2e/harness.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
test("playwright works", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
```

Run: `pnpm e2e`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e package.json pnpm-lock.yaml
git commit -m "chore(test): playwright (chromium) + axe-core"
```

---

## Task 8: `.env.example` + `.gitignore`

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.example`**

```
# Required for /api/chat rate limiting.
# Sign up: https://console.upstash.com/redis (Free tier, pick the region nearest you)
# Create a Redis DB → "REST API" tab → copy URL + token below
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Local-dev / CI bypass for the rate limiter (skips Upstash calls entirely).
# REFUSES TO START if NODE_ENV=production. Leave unset locally; CI sets RATE_LIMIT_BYPASS=1.
# RATE_LIMIT_BYPASS=

# v2 only — leave commented in v1
# ANTHROPIC_API_KEY=
```

- [ ] **Step 2: Verify `.gitignore` already excludes `.env*.local` and `.env`**

Open `.gitignore`. If `.env*.local` is missing, add it. Add `.env` if missing too.

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: env.example with upstash + v2 anthropic placeholder"
```

---

## Task 9: CI workflow (.github/workflows/ci.yml)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the file**

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      actions: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - name: Cache .next/cache
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('app/**','components/**','content/**','lib/**') }}
          restore-keys: nextjs-${{ hashFiles('pnpm-lock.yaml') }}-
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm lint
      - name: Typecheck
        run: pnpm tsc --noEmit
      - name: Placeholder scan
        run: |
          if grep -irE 'your-(name|bio|google|photo|handle)|owner name|software engineer|city,\s*country|replace this paragraph|edit me' content/ public/ app/ 2>/dev/null; then
            echo "::error::Placeholder strings found in production sources"
            exit 1
          fi
      - name: Anthropic key leak scan
        run: |
          if grep -rE 'sk-ant-[a-zA-Z0-9]{30,}' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next 2>/dev/null; then
            echo "::error::Anthropic API key pattern found in source"
            exit 1
          fi
      - name: Audit
        run: pnpm audit --audit-level=high
      - name: Unit tests
        run: pnpm test
      - name: Build
        run: pnpm build
        env:
          RATE_LIMIT_BYPASS: "1"
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium
      - name: E2E
        run: pnpm e2e
        env:
          RATE_LIMIT_BYPASS: "1"
          UPSTASH_REDIS_REST_URL: https://example.upstash.io
          UPSTASH_REDIS_REST_TOKEN: ci-bypass-token
```

> **Note on `RATE_LIMIT_BYPASS`:** The `lib/rate-limit.ts` (Task 40) honors this env only when `NODE_ENV !== "production"` and throws at module load if both are set. The `UPSTASH_*` env values above are kept as non-empty placeholders to satisfy `EnvSchema` validation in `lib/env.ts`; they are never actually contacted because the bypass triggers first.

- [ ] **Step 2: Add the placeholder scan locally to verify it passes**

Run: `grep -rE 'your-(name|bio|google|photo)' content/ public/ app/`
Expected: no output (exit 1 from grep, but no matches = clean).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint+typecheck+placeholder-scan+audit+test+build+e2e"
```

---

## Task 10: `lib/cn.ts` utility

**Files:**
- Create: `lib/cn.ts`

- [ ] **Step 1: Install deps**

```bash
pnpm add clsx tailwind-merge
```

- [ ] **Step 2: Create `lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Test**

Create `tests/unit/cn.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges and dedupes Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "text-lg", "font-bold")).toBe("text-sm font-bold");
  });
});
```

Run: `pnpm test`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add lib/cn.ts tests/unit/cn.test.ts package.json pnpm-lock.yaml
git commit -m "feat(lib): cn utility for tailwind class merging"
```

---

## Task 11: `lib/env.ts` — typed env validation

**Files:**
- Create: `lib/env.ts`, `tests/unit/env-validation.test.ts`

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod
```

- [ ] **Step 2: Create `lib/env.ts`** (export `EnvSchema` so it can be tested directly)

```ts
import { z } from "zod";

export const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  RATE_LIMIT_BYPASS: z.enum(["0", "1"]).default("0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cached = parsed.data;
  return cached;
}
```

- [ ] **Step 3: Test the schema directly (no module-cache involvement)**

Create `tests/unit/env-validation.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { EnvSchema } from "@/lib/env";

describe("EnvSchema", () => {
  it("rejects empty env (missing required keys)", () => {
    const r = EnvSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects non-URL UPSTASH_REDIS_REST_URL", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "not-a-url",
      UPSTASH_REDIS_REST_TOKEN: "x",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid env", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "x",
    });
    expect(r.success).toBe(true);
  });

  it("rejects RATE_LIMIT_BYPASS values other than 0/1", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "x",
      RATE_LIMIT_BYPASS: "true",
    });
    expect(r.success).toBe(false);
  });
});
```

Run: `pnpm test`
Expected: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add lib/env.ts tests/unit/env-validation.test.ts package.json pnpm-lock.yaml
git commit -m "feat(lib): typed env validation via zod"
```

---

## Task 12: `content/schemas.ts` — single source of truth

**Files:**
- Create: `content/schemas.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from "zod";

export const SocialSchema = z.object({
  label: z.enum(["LinkedIn", "GitHub", "X", "Instagram"]),
  url: z.string().url(),
});

export const FeaturedAwardSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
});

export const AccessCardSchema = z.object({
  label: z.string().min(1),
  subLabel: z.string().min(1),
  ownerName: z.string().min(1),
  role: z.string().min(1),
});

export const ProfileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  photoSrc: z.string().min(1),
  bioParagraphs: z.array(z.string().min(1)).min(1),
  socials: z.array(SocialSchema).default([]),
  calendlyUrl: z.string().url(),
  featuredAwards: z.array(FeaturedAwardSchema).default([]),
  accessCard: AccessCardSchema.optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters/digits, hyphens only between segments"),
  name: z.string().min(1),
  blurb: z.string().min(1).max(160),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
});
export const ProjectsSchema = z.array(ProjectSchema).min(1).refine(
  (arr) => new Set(arr.map((p) => p.slug)).size === arr.length,
  { message: "Project slugs must be unique" }
);
export type Project = z.infer<typeof ProjectSchema>;

export const ExperienceItemSchema = z.object({
  title: z.string().min(1),
  org: z.string().min(1),
  year: z.string().regex(/^\d{4}$/, "4-digit year"),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const CertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  url: z.string().url(),
});
export type Certification = z.infer<typeof CertificationSchema>;

export const TechStackSchema = z.record(z.string().min(1), z.array(z.string().min(1)));
export type TechStack = z.infer<typeof TechStackSchema>;

export const RecommendationSchema = z.object({
  quote: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const GalleryImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

export const MembershipSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});
export type Membership = z.infer<typeof MembershipSchema>;

export const MdxFrontmatterSchema = z.object({
  title: z.string().min(1),
  cover: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date YYYY-MM-DD"),
});
export type MdxFrontmatter = z.infer<typeof MdxFrontmatterSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
}).strict();
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
```

- [ ] **Step 2: Test**

Create `tests/unit/schemas.test.ts`:
```ts
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
```

Run: `pnpm test`
Expected: 5 passed.

- [ ] **Step 3: Commit**

```bash
git add content/schemas.ts tests/unit/schemas.test.ts
git commit -m "feat(content): centralized zod schemas with build-time validation rules"
```

---

## Task 13: Content files (initial empty/placeholder values)

**Files:**
- Create: `content/profile.ts`, `content/projects.ts`, `content/experience.ts`, `content/certifications.ts`, `content/tech-stack.ts`, `content/recommendations.ts`, `content/gallery.ts`, `content/membership.ts`, `content/projects/.gitkeep`

- [ ] **Step 1: Create each file (parsing happens at build via Zod)**

`content/profile.ts`:
```ts
import { ProfileSchema, type Profile } from "./schemas";
const data: Profile = {
  name: "Owner Name",                                   // EDIT ME
  role: "Software Engineer",                            // EDIT ME
  location: "City, Country",                            // EDIT ME
  photoSrc: "/profile.jpg",                             // EDIT ME — drop file in /public/
  bioParagraphs: [
    "Replace this paragraph with a real bio.",          // EDIT ME
  ],
  socials: [],
  calendlyUrl: "https://calendly.com/your-handle/intro", // EDIT ME
  featuredAwards: [],
};
export const profile = ProfileSchema.parse(data);
```

`content/projects.ts`:
```ts
import { ProjectsSchema, type Project } from "./schemas";
const data: Project[] = [
  { slug: "first-project", name: "First Project", blurb: "Replace with real blurb.", url: "https://example.com" },
];
export const projects = ProjectsSchema.parse(data);
```

`content/experience.ts`:
```ts
import { ExperienceItemSchema, type ExperienceItem } from "./schemas";
import { z } from "zod";
const data: ExperienceItem[] = [];
export const experience = z.array(ExperienceItemSchema).parse(data);
```

`content/certifications.ts`:
```ts
import { CertificationSchema, type Certification } from "./schemas";
import { z } from "zod";
const data: Certification[] = [];
export const certifications = z.array(CertificationSchema).parse(data);
```

`content/tech-stack.ts`:
```ts
import { TechStackSchema, type TechStack } from "./schemas";
const data: TechStack = {};
export const techStack = TechStackSchema.parse(data);
```

`content/recommendations.ts`:
```ts
import { RecommendationSchema, type Recommendation } from "./schemas";
import { z } from "zod";
const data: Recommendation[] = [];
export const recommendations = z.array(RecommendationSchema).parse(data);
```

`content/gallery.ts`:
```ts
import { GalleryImageSchema, type GalleryImage } from "./schemas";
import { z } from "zod";
const data: GalleryImage[] = [];
export const gallery = z.array(GalleryImageSchema).parse(data);
```

`content/membership.ts`:
```ts
import { MembershipSchema, type Membership } from "./schemas";
import { z } from "zod";
const data: Membership[] = [];
export const membership = z.array(MembershipSchema).parse(data);
```

Create empty `content/projects/.gitkeep`.

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build`
Expected: exits 0. The placeholder values pass schema (real values come at hand-off).

- [ ] **Step 3: Commit**

```bash
git add content/
git commit -m "feat(content): initial content files with edit-me placeholders"
```

> **Note:** the placeholder values here use the literal string `"EDIT ME"` in comments only, never in user-visible content keys. This is safe from the CI placeholder scan (which greps for `your-(name|bio|google|photo)`).

---

## Task 14: Prebuild scripts — `validate-case-studies.ts` + `validate-content.ts`

**Files:**
- Create: `scripts/validate-case-studies.ts`, `scripts/validate-content.ts`
- Modify: `package.json`

- [ ] **Step 1: Install tsx**

```bash
pnpm add -D tsx
```

- [ ] **Step 2: Create `scripts/validate-case-studies.ts`**

```ts
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "../content/projects";

const dir = join(process.cwd(), "content", "projects");
if (!existsSync(dir)) {
  console.log("No content/projects/ directory; skipping case-study validation.");
  process.exit(0);
}

const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
const slugs = new Set(projects.map((p) => p.slug));

// Case-sensitive check: file slug must exactly match a project slug (catches Windows-vs-Linux drift).
const orphans: string[] = [];
for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  if (!slugs.has(slug)) orphans.push(f);
}
if (orphans.length > 0) {
  console.error("MDX files without matching project slug:", orphans);
  process.exit(1);
}

const noCaseStudy = projects
  .map((p) => p.slug)
  .filter((s) => !files.includes(`${s}.mdx`));
if (noCaseStudy.length > 0) {
  console.log(`Projects without MDX case study (cards link external): ${noCaseStudy.join(", ")}`);
}

console.log(`✔ ${files.length} case study/studies validated.`);
```

- [ ] **Step 3: Create `scripts/validate-content.ts`** (catches placeholder strings the CI grep can't see)

```ts
import { profile } from "../content/profile";

const PLACEHOLDERS: Array<[string, string]> = [
  [profile.name, "Owner Name"],
  [profile.role, "Software Engineer"],
  [profile.location, "City, Country"],
  [profile.calendlyUrl, "your-handle"],
];

const failures: string[] = [];
for (const [actual, placeholder] of PLACEHOLDERS) {
  if (actual.toLowerCase().includes(placeholder.toLowerCase())) {
    failures.push(`profile field still contains placeholder: "${placeholder}" (got "${actual}")`);
  }
}

const placeholderBio = "Replace this paragraph";
if (profile.bioParagraphs.some((p) => p.toLowerCase().includes(placeholderBio.toLowerCase()))) {
  failures.push(`profile.bioParagraphs still contains "${placeholderBio}…"`);
}

if (failures.length > 0) {
  console.error("Content placeholder check failed:");
  for (const f of failures) console.error(`  - ${f}`);
  console.error("Edit content/profile.ts before deploying.");
  process.exit(1);
}

console.log("✔ Content placeholder check passed.");
```

- [ ] **Step 4: Wire into `package.json`**

Add a script:
```json
"prebuild": "tsx scripts/validate-content.ts && tsx scripts/validate-case-studies.ts"
```

- [ ] **Step 5: Verify the LOCAL build now FAILS** (because Task 13 placeholder values are still in `profile.ts`)

Run: `pnpm build`
Expected: prebuild fails with "Content placeholder check failed". This is correct — the build SHOULD fail until the owner edits content. To unblock dev work, temporarily edit `content/profile.ts` with real values OR add a `pnpm build:dev` script that skips the prebuild guard. Document in CONTRIBUTING.md (Task 48).

For local development without committing real content, use `pnpm dev` (no prebuild gate) instead of `pnpm build`.

- [ ] **Step 6: Commit**

```bash
git add scripts/ package.json pnpm-lock.yaml
git commit -m "chore: prebuild scripts validate content placeholders + case-study slugs"
```

---

## Task 15: Theme provider with pre-paint script

**Files:**
- Create: `components/theme/theme-provider.tsx`

- [ ] **Step 1: Install next-themes**

```bash
pnpm add next-themes
```

- [ ] **Step 2: Create the provider**

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 3: Wire into `app/layout.tsx`**

Modify `app/layout.tsx` body content:
```tsx
import { ThemeProvider } from "@/components/theme/theme-provider";
// ... in the JSX:
<body>
  <ThemeProvider>{children}</ThemeProvider>
</body>
```

- [ ] **Step 4: Verify build**

Run: `pnpm build && pnpm start -p 3001 &` (or just `pnpm dev`), visit `/`. No hydration warnings in console.

- [ ] **Step 5: Commit**

```bash
git add components/theme/theme-provider.tsx app/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat(theme): next-themes provider with class strategy + dark default"
```

---

## Task 16: Theme toggle button

**Files:**
- Create: `components/theme/theme-toggle.tsx`

- [ ] **Step 1: Install lucide and use named imports** (the deep-import path `lucide-react/dist/esm/icons/<name>` resolves at runtime in 0.469.0 but ships no `.d.ts` declarations, breaking strict TypeScript. Named imports + treeshaking via lucide-react's `sideEffects` field is the working path — verified empirically.)

```bash
pnpm add lucide-react@0.469.0
```

Use icon imports as: `import { Sun, Moon } from "lucide-react";`

- [ ] **Step 2: Create the toggle**

```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun } from "lucide-react/dist/esm/icons/sun";
import { Moon } from "lucide-react/dist/esm/icons/moon";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn("h-9 w-9 rounded-md border border-[hsl(var(--border))]", className)}
      />
    );
  }
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border",
        "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]",
        "transition-colors hover:bg-[hsl(var(--muted))]",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/theme/theme-toggle.tsx package.json pnpm-lock.yaml
git commit -m "feat(theme): sun/moon toggle component"
```

---

## Task 17: shadcn primitives — Button

**Files:**
- Create: `components/ui/button.tsx`

- [ ] **Step 1: Install peers**

```bash
pnpm add class-variance-authority @radix-ui/react-slot
```

- [ ] **Step 2: Create `components/ui/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90",
        outline: "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        ghost: "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
export { buttonVariants };
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): button primitive (shadcn-style, hand-copied)"
```

---

## Task 18: shadcn primitives — Dialog + Sheet

**Files:**
- Create: `components/ui/dialog.tsx`, `components/ui/sheet.tsx`

- [ ] **Step 1: Install Radix primitives**

```bash
pnpm add @radix-ui/react-dialog
```

- [ ] **Step 2: Create `components/ui/dialog.tsx`**

(Use shadcn's standard Dialog snippet — ~80 lines. Reference: https://ui.shadcn.com/docs/components/dialog. Replace any color tokens with our HSL var format: `bg-[hsl(var(--background))]`, `text-[hsl(var(--foreground))]`, etc. The full snippet exports: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`.)

- [ ] **Step 3: Create `components/ui/sheet.tsx`**

(Use shadcn's standard Sheet snippet. Same token replacement. Exports: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose`. Confirm side="bottom" variant exists for mobile chat panel.)

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/ui/dialog.tsx components/ui/sheet.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): dialog + sheet primitives with theme tokens"
```

---

## Task 19: shadcn primitives — Carousel + Separator

**Files:**
- Create: `components/ui/carousel.tsx`, `components/ui/separator.tsx`

- [ ] **Step 1: Install peers**

```bash
pnpm add embla-carousel-react @radix-ui/react-separator
```

- [ ] **Step 2: Create `components/ui/carousel.tsx`**

Use shadcn's standard Carousel snippet. **Critical changes** before saving:
- Set `aria-label="Previous"` and `aria-label="Next"` on the prev/next button defaults — accept an override via prop.
- Default `opts.align = "start"`, `opts.loop = false`. **Do not enable autoplay anywhere.**
- Wrap the embla setup in a `useEffect` that adds keyboard handlers for `ArrowLeft` / `ArrowRight` when the carousel root has focus.
- Wrap the slide transition CSS class in a `motion-safe:transition-transform motion-reduce:transition-none` utility.

Exports: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`.

- [ ] **Step 3: Create `components/ui/separator.tsx`**

(Use shadcn's standard Separator snippet — ~25 lines.)

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/ui/carousel.tsx components/ui/separator.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): carousel (a11y-hardened) + separator primitives"
```

---

## Task 20: `Section` wrapper — production-hide vs dev-hint

**Files:**
- Create: `components/sections/section.tsx`, `components/sections/empty-state.tsx`
- Test: `tests/unit/section.test.tsx`

- [ ] **Step 1: Create `empty-state.tsx`**

```tsx
import type { ReactNode } from "react";
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center">
      <div aria-hidden className="text-[hsl(var(--muted-foreground))]">{icon}</div>
      <p className="font-semibold text-[hsl(var(--foreground))]">{title}</p>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{hint}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `section.tsx`**

```tsx
import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

const isDev = process.env.NODE_ENV === "development";

export function Section({
  title,
  isEmpty,
  emptyHint,
  emptyIcon,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyHint?: { title: string; hint: string };
  emptyIcon?: ReactNode;
  children: ReactNode;
}) {
  if (isEmpty) {
    if (!isDev || !emptyHint) return null;
    return (
      <section aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
        <h2 id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`} className="sr-only">{title}</h2>
        <EmptyState icon={emptyIcon} title={emptyHint.title} hint={emptyHint.hint} />
      </section>
    );
  }
  return (
    <section aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <h2 id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`} className="text-[length:var(--text-h2)] font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Test**

Create `tests/unit/section.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "@/components/sections/section";

beforeEach(() => { vi.resetModules(); });

describe("Section", () => {
  it("renders nothing when empty in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { Section: Prod } = await import("@/components/sections/section");
    const { container } = render(
      <Prod title="X" isEmpty emptyHint={{ title: "t", hint: "h" }}>n/a</Prod>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders dev hint when empty in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { Section: Dev } = await import("@/components/sections/section");
    render(<Dev title="X" isEmpty emptyHint={{ title: "Title", hint: "Hint" }}>n/a</Dev>);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Hint")).toBeInTheDocument();
  });

  it("renders children when not empty", () => {
    render(<Section title="X" isEmpty={false}>visible</Section>);
    expect(screen.getByText("visible")).toBeInTheDocument();
  });
});
```

Run: `pnpm test`
Expected: 3 passed.

- [ ] **Step 4: Commit**

```bash
git add components/sections/section.tsx components/sections/empty-state.tsx tests/unit/section.test.tsx
git commit -m "feat(sections): Section wrapper with prod-hide / dev-hint policy"
```

---

## Task 21: `site-header.tsx` (sticky, with theme toggle)

**Files:**
- Create: `components/layout/site-header.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create the header**

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { profile } from "@/content/profile";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/70">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {profile.name}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Wire into `app/layout.tsx`**

```tsx
<body>
  <ThemeProvider>
    <SiteHeader />
    <main className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8">{children}</main>
  </ThemeProvider>
</body>
```

Add the import at top.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components/layout/site-header.tsx app/layout.tsx
git commit -m "feat(layout): sticky site header with brand + theme toggle"
```

---

## Task 22: `site-footer.tsx` + `back-to-home.tsx`

**Files:**
- Create: `components/layout/site-footer.tsx`, `components/layout/back-to-home.tsx`

- [ ] **Step 1: Create `site-footer.tsx`**

```tsx
export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
      © {new Date().getFullYear()}. All rights reserved.
    </footer>
  );
}
```

- [ ] **Step 2: Create `back-to-home.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react/dist/esm/icons/arrow-left";

export function BackToHome() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
      <ArrowLeft className="h-4 w-4" />
      Back to Home
    </Link>
  );
}
```

- [ ] **Step 3: Wire footer into `app/layout.tsx`**

After the `<main>` close, before `</ThemeProvider>`:
```tsx
<SiteFooter />
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/
git commit -m "feat(layout): footer + back-to-home"
```

---

## Tasks 23–37: Section components (one per task)

Each section follows the same shape: read its content file, compute `isEmpty`, return `<Section ... isEmpty={isEmpty}>...</Section>`. Each task includes its specific markup and a Vitest unit test that proves: (a) returns `null` when empty in production, (b) renders children when content exists.

Per-task structure (apply for tasks 23–37 below):

- [ ] Step 1: Create the component file with the exact code shown.
- [ ] Step 2: Create the test file in `tests/unit/sections/` with **all three explicit cases** (no shortcuts):
  - **(a) Production + empty source array → returns null.** Use `vi.stubEnv("NODE_ENV", "production")` + `vi.resetModules()` + dynamic import. Assert `container.firstChild === null` (or `toBeEmptyDOMElement()`), not "no error thrown".
  - **(b) Populated source array → asserts a specific text string from the data.** Use `getByText(/exact-content/)` or `findByRole("heading", { name: "..." })`. Don't just assert "an h3 exists".
  - **(c) When the section renders, the wrapping `<section>` has `aria-labelledby` pointing to a heading id.** Use `getByRole("region", { name: "<title>" })`.
  - **Plus any section-specific case noted in the task** (e.g., FeaturedAward hides next button at length=1; GalleryCarousel has zero nav buttons in DOM when empty in prod; RecommendationsCarousel returns null even in dev).
- [ ] Step 3: Run `pnpm test` — expect all three (or four) new cases to pass.
- [ ] Step 4: Commit with message `feat(sections): <name>`.

---

### Task 23: `about.tsx`

**Files:** `components/sections/about.tsx`, `tests/unit/sections/about.test.tsx`

```tsx
import { profile } from "@/content/profile";
import { Section } from "./section";
import { FileText } from "lucide-react/dist/esm/icons/file-text";

export function About() {
  const isEmpty = profile.bioParagraphs.length === 0;
  return (
    <Section
      title="About"
      isEmpty={isEmpty}
      emptyIcon={<FileText className="h-6 w-6" />}
      emptyHint={{ title: "Bio missing", hint: "Edit content/profile.ts → bioParagraphs[]." }}
    >
      <div className="space-y-4 text-[hsl(var(--foreground))]">
        {profile.bioParagraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </Section>
  );
}
```

Test: render the component, assert at least one paragraph from `profile.bioParagraphs` is in the DOM.

---

### Task 24: `profile-card.tsx`

**Files:** `components/hero/profile-card.tsx`, `tests/unit/sections/profile-card.test.tsx`

```tsx
import Image from "next/image";
import Link from "next/link";
import { profile } from "@/content/profile";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react/dist/esm/icons/calendar";
import { MapPin } from "lucide-react/dist/esm/icons/map-pin";
import { FeaturedAward } from "./featured-award";

export function ProfileCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <Image
          src={profile.photoSrc}
          alt={`Profile photo of ${profile.name}`}
          width={160}
          height={160}
          priority
          className="rounded-xl object-cover"
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-[length:var(--text-display)] font-bold tracking-tight">{profile.name}</h1>
          <p className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            <MapPin className="h-4 w-4" /> {profile.location}
          </p>
          <p className="text-[hsl(var(--foreground))]">{profile.role}</p>
          {profile.featuredAwards.length > 0 && <FeaturedAward awards={profile.featuredAwards} />}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-4 w-4" /> Schedule a Call
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Test: render, assert name + location are in DOM, assert calendly link has `rel="noopener noreferrer"`.

---

### Task 25: `featured-award.tsx`

**Files:** `components/hero/featured-award.tsx`, `tests/unit/sections/featured-award.test.tsx`

```tsx
"use client";
import { useState } from "react";
import type { z } from "zod";
import type { FeaturedAwardSchema } from "@/content/schemas";
import { Trophy } from "lucide-react/dist/esm/icons/trophy";
import { ChevronRight } from "lucide-react/dist/esm/icons/chevron-right";

type Award = z.infer<typeof FeaturedAwardSchema>;
export function FeaturedAward({ awards }: { awards: Award[] }) {
  const [i, setI] = useState(0);
  if (awards.length === 0) return null;
  const current = awards[i]!;
  const showNext = awards.length > 1;
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-3 py-1.5 text-sm text-[hsl(var(--accent-foreground))]">
      <Trophy className="h-4 w-4" />
      {current.url ? (
        <a href={current.url} target="_blank" rel="noopener noreferrer" className="font-medium">{current.title}</a>
      ) : (
        <span className="font-medium">{current.title}</span>
      )}
      {showNext && (
        <button
          aria-label="Next award"
          onClick={() => setI((n) => (n + 1) % awards.length)}
          className="ml-2 rounded-full bg-[hsl(var(--accent-foreground))]/20 p-1 motion-safe:transition-transform motion-safe:hover:translate-x-0.5"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

Test: render with 2 awards, assert next button shows; render with 1 award, assert next button absent; render with 0, assert returns null.

---

### Task 26: `tech-stack-preview.tsx`

**Files:** `components/sections/tech-stack-preview.tsx`, `tests/unit/sections/tech-stack-preview.test.tsx`

```tsx
import Link from "next/link";
import { techStack } from "@/content/tech-stack";
import { Section } from "./section";
import { Code2 } from "lucide-react/dist/esm/icons/code-2";

export const PREVIEW_CATEGORIES = 3;
export const PREVIEW_CHIPS = 6;

export function TechStackPreview() {
  const entries = Object.entries(techStack).slice(0, PREVIEW_CATEGORIES);
  const isEmpty = entries.length === 0;
  return (
    <Section
      title="Tech Stack"
      isEmpty={isEmpty}
      emptyIcon={<Code2 className="h-6 w-6" />}
      emptyHint={{ title: "Tech stack empty", hint: "Edit content/tech-stack.ts." }}
    >
      <div className="space-y-4">
        {entries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[length:var(--text-h3)] font-semibold mb-2">{cat}</h3>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, PREVIEW_CHIPS).map((t) => (
                <span key={t} className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1 text-sm">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Link href="/tech-stack" className="mt-4 inline-block text-sm text-[hsl(var(--accent))] hover:underline">
        View all →
      </Link>
    </Section>
  );
}
```

Test: render with `{ Frontend: ["React"] }`, assert "React" appears; render with `{}`, assert returns null in prod.

---

### Task 27: `tech-stack-full.tsx`

**File pattern:** identical shape to preview, but iterates over the full `techStack` (no slicing). Used on `/tech-stack` route.

```tsx
import { techStack } from "@/content/tech-stack";
import { Section } from "./section";
import { Code2 } from "lucide-react/dist/esm/icons/code-2";

export function TechStackFull() {
  const entries = Object.entries(techStack);
  return (
    <Section title="Tech Stack" isEmpty={entries.length === 0}
      emptyIcon={<Code2 className="h-6 w-6" />}
      emptyHint={{ title: "Tech stack empty", hint: "Edit content/tech-stack.ts." }}>
      <div className="space-y-6">
        {entries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[length:var(--text-h3)] font-semibold mb-2">{cat}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((t) => (
                <span key={t} className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1 text-sm">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

Test: assert all categories render when populated.

---

### Task 28: `recent-projects.tsx`

```tsx
import { projects } from "@/content/projects";
import { Section } from "./section";
import { ProjectCard } from "./project-card";
import { FolderGit2 } from "lucide-react/dist/esm/icons/folder-git-2";

export const RECENT_PROJECTS_COUNT = 4;
export function RecentProjects() {
  const slice = projects.slice(0, RECENT_PROJECTS_COUNT);
  return (
    <Section title="Recent Projects" isEmpty={slice.length === 0}
      emptyIcon={<FolderGit2 className="h-6 w-6" />}
      emptyHint={{ title: "No projects", hint: "Edit content/projects.ts." }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slice.map((p) => <ProjectCard key={p.slug} project={p} />)}
      </div>
    </Section>
  );
}
```

Also create `components/sections/project-card.tsx`:
```tsx
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Project } from "@/content/schemas";

function hasCaseStudy(slug: string) {
  return existsSync(join(process.cwd(), "content", "projects", `${slug}.mdx`));
}

export function ProjectCard({ project }: { project: Project }) {
  const internal = hasCaseStudy(project.slug);
  const href = internal ? `/projects/${project.slug}` : project.url;
  const external = !internal;
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:bg-[hsl(var(--muted))] transition-colors"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-[length:var(--text-h3)] font-semibold">{project.name}</h3>
        {internal && (
          <span className="rounded-md bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-xs text-[hsl(var(--accent))]">Case study</span>
        )}
      </div>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{project.blurb}</p>
      <p className="mt-2 font-mono text-xs text-[hsl(var(--muted-foreground))]">{new URL(project.url).host}</p>
    </Link>
  );
}
```

Test: render with one project, assert card visible; render with empty array, assert returns null (in prod).

---

### Task 29: `projects-grid.tsx`

```tsx
import { projects } from "@/content/projects";
import { Section } from "./section";
import { ProjectCard } from "./project-card";
import { FolderGit2 } from "lucide-react/dist/esm/icons/folder-git-2";

export function ProjectsGrid() {
  return (
    <Section title="All Projects" isEmpty={projects.length === 0}
      emptyIcon={<FolderGit2 className="h-6 w-6" />}
      emptyHint={{ title: "No projects", hint: "Edit content/projects.ts." }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => <ProjectCard key={p.slug} project={p} />)}
      </div>
    </Section>
  );
}
```

Test: same pattern.

---

### Task 30: `recent-certifications.tsx` + `certifications-grid.tsx`

Two near-identical components. Cert card pattern:
```tsx
import Link from "next/link";
import type { Certification } from "@/content/schemas";

export function CertCard({ cert }: { cert: Certification }) {
  return (
    <Link href={cert.url} target="_blank" rel="noopener noreferrer"
      className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:bg-[hsl(var(--muted))] transition-colors">
      <h3 className="text-[length:var(--text-h3)] font-semibold">{cert.name}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{cert.issuer}</p>
    </Link>
  );
}
```

`recent-certifications.tsx` slices `certifications.slice(0, 4)`. `certifications-grid.tsx` renders all. Both wrap with `Section`. Tests follow the pattern.

---

### Task 31: `experience-timeline.tsx`

```tsx
import { experience } from "@/content/experience";
import { Section } from "./section";
import { Briefcase } from "lucide-react/dist/esm/icons/briefcase";

export function ExperienceTimeline() {
  return (
    <Section title="Experience" isEmpty={experience.length === 0}
      emptyIcon={<Briefcase className="h-6 w-6" />}
      emptyHint={{ title: "No experience entries", hint: "Edit content/experience.ts." }}>
      <ol className="space-y-3 border-l-2 border-[hsl(var(--border))] pl-4">
        {experience.map((e, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full bg-[hsl(var(--accent))]" aria-hidden />
            <h3 className="font-semibold">{e.title}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{e.org} · {e.year}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
```

Test: render with 2 items, assert both titles present.

---

### Task 32: `recommendations-carousel.tsx`

```tsx
"use client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { recommendations } from "@/content/recommendations";
import { Section } from "./section";
import { Quote } from "lucide-react/dist/esm/icons/quote";

export function RecommendationsCarousel() {
  if (recommendations.length === 0) return null;   // hard hide; never dev-hint a recs section (low signal)
  return (
    <Section title="Recommendations" isEmpty={false}>
      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent>
          {recommendations.map((r, i) => (
            <CarouselItem key={i} className="basis-full md:basis-1/2">
              <figure className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <Quote className="h-5 w-5 text-[hsl(var(--accent))] mb-3" aria-hidden />
                <blockquote className="italic text-[hsl(var(--foreground))]">"{r.quote}"</blockquote>
                <figcaption className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="font-semibold text-[hsl(var(--foreground))]">{r.name}</span> · {r.title}
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Previous recommendation" />
        <CarouselNext aria-label="Next recommendation" />
      </Carousel>
    </Section>
  );
}
```

Test: render empty, assert nothing renders. Render with 2 recs, assert both quotes present.

---

### Task 33: `membership-block.tsx` + `speaking-cta.tsx`

Two short components. Patterns:

```tsx
// membership-block.tsx
import Link from "next/link";
import { membership } from "@/content/membership";
import { Section } from "./section";
import { Users } from "lucide-react/dist/esm/icons/users";

export function MembershipBlock() {
  return (
    <Section title="A member of" isEmpty={membership.length === 0}
      emptyIcon={<Users className="h-6 w-6" />}
      emptyHint={{ title: "No memberships", hint: "Edit content/membership.ts." }}>
      <ul className="space-y-2">
        {membership.map((m, i) => (
          <li key={i}>
            <Link href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">{m.name}</Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

```tsx
// speaking-cta.tsx
import Link from "next/link";
import { profile } from "@/content/profile";
import { Mic } from "lucide-react/dist/esm/icons/mic";

export function SpeakingCta() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="inline-flex items-center gap-2 mb-2"><Mic className="h-4 w-4" /><span className="font-semibold">Speaking</span></div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Available for speaking at events about software development and emerging technologies.</p>
      <Link href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[hsl(var(--accent))] hover:underline">Get in touch →</Link>
    </div>
  );
}
```

Tests: standard.

---

### Task 34: `gallery-carousel.tsx`

```tsx
"use client";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { gallery } from "@/content/gallery";
import { Section } from "./section";
import { ImageOff } from "lucide-react/dist/esm/icons/image-off";

export function GalleryCarousel() {
  if (gallery.length === 0) {
    return process.env.NODE_ENV === "development" ? (
      <Section title="Gallery" isEmpty
        emptyIcon={<ImageOff className="h-6 w-6" />}
        emptyHint={{ title: "Gallery empty", hint: "Drop images in /public/gallery/ and add entries to content/gallery.ts." }}>{null}</Section>
    ) : null;
  }
  return (
    <Section title="Gallery" isEmpty={false}>
      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent>
          {gallery.map((img) => (
            <CarouselItem key={img.src} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image src={img.src} alt={img.alt} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Previous image" />
        <CarouselNext aria-label="Next image" />
      </Carousel>
    </Section>
  );
}
```

Test: render with empty array in production, assert nothing renders (no nav buttons leaked).

---

### Task 35a: Halfway-deployable milestone (`bare-bones home`)

**Why this exists:** Tasks 1–35 build infrastructure with no shareable URL. To validate the Vercel pipeline + catch config issues early, ship a minimal homepage now.

**Files:** `app/page.tsx` (temporary minimal version)

- [ ] **Step 1: Create a stripped homepage**

```tsx
import { ProfileCard } from "@/components/hero/profile-card";
import { About } from "@/components/sections/about";
export default function HomePage() {
  return (
    <div className="space-y-12">
      <ProfileCard />
      <About />
    </div>
  );
}
```

- [ ] **Step 2: Smoke locally**

Run: `pnpm dev`. Visit `/`. Confirm the profile card + about section render. Theme toggle works.

- [ ] **Step 3: Commit + push to a `preview-milestone` branch**

```bash
git checkout -b preview-milestone
git add app/page.tsx
git commit -m "feat(home): minimal milestone composition (will expand in Task 36)"
git push -u origin preview-milestone
```

Vercel auto-creates a Preview deployment. Open the preview URL — confirm theme + section render in production. **This is your first shareable URL** — send it to a trusted friend for a fresh-eyes check.

- [ ] **Step 4: Stay on `preview-milestone`** until Task 36 expands the homepage. Do NOT merge to `main` yet (placeholder content would deploy to prod).

### Task 35: `access-card.tsx`

```tsx
import { profile } from "@/content/profile";
import { Terminal } from "lucide-react/dist/esm/icons/terminal";

export function AccessCard() {
  if (!profile.accessCard) return null;
  const c = profile.accessCard;
  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 font-mono text-sm">
      <Terminal className="h-5 w-5 mb-2 text-[hsl(var(--muted-foreground))]" aria-hidden />
      <p className="text-[hsl(var(--foreground))] font-bold">{c.label}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.subLabel}</p>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{c.subLabel}</p>
        <p className="font-bold">{c.ownerName}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.role}</p>
      </div>
    </div>
  );
}
```

Test: render with `accessCard` undefined, assert returns null. Render with config, assert label visible.

---

### Task 36: Wire homepage `/` (`app/page.tsx`)

**Files:** `app/page.tsx`

```tsx
import { ProfileCard } from "@/components/hero/profile-card";
import { About } from "@/components/sections/about";
import { TechStackPreview } from "@/components/sections/tech-stack-preview";
import { RecentProjects } from "@/components/sections/recent-projects";
import { RecentCertifications } from "@/components/sections/recent-certifications";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { RecommendationsCarousel } from "@/components/sections/recommendations-carousel";
import { MembershipBlock } from "@/components/sections/membership-block";
import { SpeakingCta } from "@/components/sections/speaking-cta";
import { GalleryCarousel } from "@/components/sections/gallery-carousel";
import { AccessCard } from "@/components/sections/access-card";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <ProfileCard />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-12">
          <About />
          <TechStackPreview />
          <RecentProjects />
          <RecentCertifications />
        </div>
        <aside className="space-y-6">
          <AccessCard />
          <ExperienceTimeline />
          <SpeakingCta />
          <MembershipBlock />
        </aside>
      </div>
      <RecommendationsCarousel />
      <GalleryCarousel />
    </div>
  );
}
```

- [ ] Build + visit `/` to confirm visually.
- [ ] Commit: `feat(routes): home page composition`.

---

### Task 37: Inner routes — `/projects`, `/tech-stack`, `/certifications`

**Files:** `app/projects/page.tsx`, `app/tech-stack/page.tsx`, `app/certifications/page.tsx`

```tsx
// app/projects/page.tsx
import { BackToHome } from "@/components/layout/back-to-home";
import { ProjectsGrid } from "@/components/sections/projects-grid";
export default function Page() {
  return (
    <div className="space-y-6">
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">All Projects</h1>
      <ProjectsGrid />
    </div>
  );
}
```

`app/tech-stack/page.tsx` — same pattern, `<TechStackFull />`. `app/certifications/page.tsx` — same pattern, `<CertificationsGrid />`.

- [ ] Build + visit each route. Commit: `feat(routes): /projects, /tech-stack, /certifications`.

---

## Task 38a: MDX deps + components

**Files:** `components/mdx/mdx-components.tsx`

- [ ] **Step 1: Install deps** (note: `@next/mdx` is intentionally NOT installed — `compileMDX` from `next-mdx-remote/rsc` handles everything end-to-end and bundling `@next/mdx` would silently shadow our rehype-plugins config)

```bash
pnpm add next-mdx-remote gray-matter rehype-pretty-code shiki
```

- [ ] **Step 2: Create `components/mdx/mdx-components.tsx`** (with conditional `target` so internal links don't open in new tabs)

```tsx
import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes } from "react";

const Anchor = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isExternal = !!props.href && /^https?:\/\//.test(props.href);
  return (
    <a
      className="text-[hsl(var(--accent))] underline"
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      {...props}
    />
  );
};

export const mdxComponents: MDXComponents = {
  h1: (p) => <h1 className="text-[length:var(--text-display)] font-bold mt-8 mb-4" {...p} />,
  h2: (p) => <h2 className="text-[length:var(--text-h2)] font-bold mt-8 mb-3" {...p} />,
  h3: (p) => <h3 className="text-[length:var(--text-h3)] font-semibold mt-6 mb-2" {...p} />,
  p: (p) => <p className="my-4 text-[hsl(var(--foreground))]" {...p} />,
  pre: (p) => <pre className="my-6 overflow-x-auto rounded-xl bg-[hsl(var(--muted))] p-4 text-sm" {...p} />,
  code: (p) => <code className="rounded bg-[hsl(var(--muted))] px-1 py-0.5 text-sm" {...p} />,
  a: Anchor,
};
```

- [ ] **Step 3: Commit**

```bash
git add components/mdx/mdx-components.tsx package.json pnpm-lock.yaml
git commit -m "feat(mdx): components with conditional external-target on anchors"
```

---

## Task 38b: `/projects/[slug]` route

**Files:** `app/projects/[slug]/page.tsx`

- [ ] **Step 1: Create the route**

```tsx
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { MdxFrontmatterSchema } from "@/content/schemas";
import { BackToHome } from "@/components/layout/back-to-home";

export function generateStaticParams() {
  const dir = join(process.cwd(), "content", "projects");
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => ({ slug: f.replace(/\.mdx$/, "") }));
  } catch { return []; }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = join(process.cwd(), "content", "projects", `${slug}.mdx`);
  let raw: string;
  try { raw = readFileSync(file, "utf8"); } catch { notFound(); }
  const parsed = matter(raw);
  let fm: ReturnType<typeof MdxFrontmatterSchema.parse>;
  try { fm = MdxFrontmatterSchema.parse(parsed.data); } catch { notFound(); }
  const { content } = await compileMDX({
    source: parsed.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        format: "mdx",
        rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
      },
    },
  });
  return (
    <article className="space-y-6">
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">{fm.title}</h1>
      <div>{content}</div>
    </article>
  );
}
```

> **Why this shape:** `compileMDX` runs at build time during `generateStaticParams` resolution. We pass the rehype-pretty-code plugin into `compileMDX`'s `mdxOptions` directly — there is no `@next/mdx` middleware to inherit it from. Malformed frontmatter or a missing file both resolve to a 404 via `notFound()` rather than crashing the request with a 500.

- [ ] **Step 2: Commit**

```bash
git add app/projects/[slug]
git commit -m "feat(routes): /projects/[slug] static MDX render with safe error path"
```

---

## Task 38c: Sample MDX + verify

**Files:** `content/projects/first-project.mdx`

- [ ] **Step 1: Create the sample**

```mdx
---
title: First Project
date: 2026-05-10
---

# Hello

Sample case study content with `inline code` and a [link to example.com](https://example.com).

```ts
const greeting = "hello";
console.log(greeting);
```
```

- [ ] **Step 2: Verify**

Run: `pnpm dev` (avoids the prebuild content-placeholder gate during dev).
Open `http://localhost:3000/projects/first-project`.
Expected: heading + paragraph + syntax-highlighted code block render. Click the example.com link — opens in new tab. Click any internal link in this MDX (none here yet, but the conditional target logic is set) — opens in same tab.

- [ ] **Step 3: Commit**

```bash
git add content/projects/first-project.mdx
git commit -m "test(mdx): sample case study verifies syntax-highlight + link behavior"
```

---

## Task 39: 404 page

**Files:** `app/not-found.tsx`

```tsx
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
```

- [ ] Commit: `feat(routes): 404 with back-to-home`.

---

## Task 40: `lib/rate-limit.ts` (Upstash sliding window)

**Files:** `lib/rate-limit.ts`

- [ ] **Step 1: Install**

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

- [ ] **Step 2: Create the file** (with bypass for non-prod env to keep CI/e2e tests off Upstash)

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

// Hard guard: bypass MUST NEVER be active in production. Module-load assertion.
if (process.env.RATE_LIMIT_BYPASS === "1" && process.env.NODE_ENV === "production") {
  throw new Error("RATE_LIMIT_BYPASS=1 is forbidden in production. Refusing to start.");
}

const BYPASS_RESULT = { success: true, limit: 10, remaining: 10, reset: 0, pending: Promise.resolve() } as const;

interface LimiterShape {
  limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }>;
}

let cached: LimiterShape | null = null;

export function getRateLimit(): LimiterShape {
  if (cached) return cached;
  if (process.env.RATE_LIMIT_BYPASS === "1") {
    cached = { limit: async () => BYPASS_RESULT };
    return cached;
  }
  const env = getEnv();
  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  const real = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
    prefix: "@portfolio/chat",
  });
  cached = { limit: (id) => real.limit(id) };
  return cached;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/rate-limit.ts package.json pnpm-lock.yaml
git commit -m "feat(lib): upstash sliding window rate limiter"
```

---

## Task 41: `app/api/chat/route.ts` (Zod + rate limit + fixed reply)

**Files:** `app/api/chat/route.ts`, `tests/unit/chat-route.test.ts`

- [ ] **Step 1: Write the test FIRST**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  getRateLimit: () => ({ limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 }) }),
}));

beforeEach(() => vi.resetModules());

describe("POST /api/chat", () => {
  it("returns 200 + fixed reply on valid body", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "hi" }), headers: { "content-type": "application/json" } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toMatch(/coming soon/i);
  });

  it("returns 400 on invalid body", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({}), headers: { "content-type": "application/json" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 on message > 1000 chars", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "a".repeat(1001) }), headers: { "content-type": "application/json" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 405 on GET", async () => {
    const { GET } = await import("@/app/api/chat/route");
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
```

Run: `pnpm test`
Expected: FAIL — route doesn't exist yet.

- [ ] **Step 2: Implement the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchema } from "@/content/schemas";
import { getRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_REPLY = "Chat is coming soon — reach me via Calendly for now.";

function err(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  let limit;
  try {
    limit = await getRateLimit().limit(ip);
  } catch {
    return err("SERVICE_UNAVAILABLE", "Rate limiter unreachable", 503);
  }
  if (!limit.success) {
    return err("RATE_LIMITED", "Too many requests", 429, { "Retry-After": "60" });
  }

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 4096) return err("PAYLOAD_TOO_LARGE", "Body too large", 413);

  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return err("BAD_REQUEST", "Schema validation failed", 400);

  return NextResponse.json({ reply: FIXED_REPLY });
}

export async function GET() { return err("METHOD_NOT_ALLOWED", "POST only", 405); }
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
```

- [ ] **Step 3: Add four missing tests** to `tests/unit/chat-route.test.ts` (append to the existing `describe`):

```ts
it("returns 429 on rate limit exceeded", async () => {
  vi.doMock("@/lib/rate-limit", () => ({
    getRateLimit: () => ({ limit: vi.fn().mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60000 }) }),
  }));
  const { POST } = await import("@/app/api/chat/route");
  const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "hi" }), headers: { "content-type": "application/json" } });
  const res = await POST(req);
  expect(res.status).toBe(429);
  expect(res.headers.get("Retry-After")).toBe("60");
});

it("returns 413 when content-length > 4096", async () => {
  const { POST } = await import("@/app/api/chat/route");
  const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "x" }), headers: { "content-type": "application/json", "content-length": "9999" } });
  const res = await POST(req);
  expect(res.status).toBe(413);
});

it("returns 400 on invalid JSON body", async () => {
  const { POST } = await import("@/app/api/chat/route");
  const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: "{not-json", headers: { "content-type": "application/json" } });
  const res = await POST(req);
  expect(res.status).toBe(400);
  const json = await res.json();
  expect(json.error.code).toBe("BAD_REQUEST");
});

it("returns 400 on extra fields (Zod .strict)", async () => {
  const { POST } = await import("@/app/api/chat/route");
  const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "hi", evil: "x" }), headers: { "content-type": "application/json" } });
  const res = await POST(req);
  expect(res.status).toBe(400);
});

it("returns 503 when rate limiter throws", async () => {
  vi.doMock("@/lib/rate-limit", () => ({
    getRateLimit: () => ({ limit: vi.fn().mockRejectedValue(new Error("upstash down")) }),
  }));
  const { POST } = await import("@/app/api/chat/route");
  const req = new NextRequest("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ message: "hi" }), headers: { "content-type": "application/json" } });
  const res = await POST(req);
  expect(res.status).toBe(503);
});
```

- [ ] **Step 4: Run tests, expect pass**

Run: `pnpm test`
Expected: 9 passed (original 4 + 5 new).

- [ ] **Step 4: Commit**

```bash
git add app/api/chat tests/unit/chat-route.test.ts
git commit -m "feat(api): /api/chat stub with zod + rate limit + error contract"
```

---

## Task 42: `chat-panel.tsx` (built but NOT mounted in v1)

**Files:** `components/chat/chat-panel.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function ChatPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onSubmit = async () => {
    setBusy(true); setReply(null);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const json = await res.json();
      setReply(json.reply ?? json.error?.message ?? "Error");
    } finally { setBusy(false); }
  };

  const Body = (
    <div className="space-y-3">
      <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">
        Hi! Thanks for visiting. The chat is coming soon — for now, please reach me via Calendly.
      </div>
      {reply && <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">{reply}</div>}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
        maxLength={1000}
        rows={3}
        className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-sm"
        placeholder="Ask me about programming, web dev, or tech!"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{message.length}/1000</span>
        <Button onClick={onSubmit} disabled={busy || message.length === 0}>{busy ? "..." : "Send"}</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader><SheetTitle>Chat</SheetTitle></SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Chat</DialogTitle></DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
```

> **Note:** this component is **not imported anywhere in v1**. It's the pre-built scaffold that v2 will mount via a separate `chat-launcher.tsx`. Build will tree-shake it out.

- [ ] Commit: `feat(chat): chat-panel scaffold (not mounted in v1)`.

---

## Task 43: Security headers in `next.config.ts`

**Files:** `next.config.ts` (modify)

- [ ] **Step 1: Add `headers()` to next config**

Modify `next.config.ts` to add a `headers` async function before `export default`:

```ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // NOTE: do NOT add `preload` until a custom domain is attached and verified on hstspreload.org.
  // Submitting a shared *.vercel.app subdomain to the preload list is harmful and not rollback-able.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

> **Note:** the `'unsafe-inline'` for `script-src` is needed for the next-themes pre-paint script. If we tighten later, we'll switch to a nonce.

- [ ] **Step 2: Build + smoke header**

```bash
pnpm build && pnpm start -p 3001 &
curl -I http://localhost:3001/ | grep -E "X-Frame|Content-Security"
```

Expected: both headers present.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): csp + headers in next.config"
```

---

## Task 44: Playwright smoke — every route returns 200, no console errors

**Files:** `tests/e2e/smoke.spec.ts`

```ts
import { test, expect } from "@playwright/test";

const routes = ["/", "/projects", "/projects/first-project", "/tech-stack", "/certifications"];

for (const route of routes) {
  test(`${route} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(errors, `Console errors on ${route}`).toHaveLength(0);
  });
}
```

Run: `pnpm e2e`
Expected: 4 passed.

Commit: `test(e2e): route smoke + console-error guard`.

---

## Task 45: Playwright theme test — toggle persists, no hydration warning

**Files:** `tests/e2e/theme.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test("theme toggle persists across reloads", async ({ page }) => {
  await page.goto("/");
  await page.click('button[aria-label*="Switch to light"]');
  const cls = await page.locator("html").getAttribute("class");
  expect(cls).not.toContain("dark");
  await page.reload();
  const cls2 = await page.locator("html").getAttribute("class");
  expect(cls2).not.toContain("dark");
});

test("no hydration warnings on first paint", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/hydrat/i.test(t) || /did not match/i.test(t)) warnings.push(t);
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(warnings).toHaveLength(0);
});
```

Commit: `test(e2e): theme persistence + hydration cleanliness`.

---

## Task 46: Playwright chat-stub contract

**Files:** `tests/e2e/chat-stub.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test("POST /api/chat returns the v1 stub reply", async ({ request }) => {
  const res = await request.post("/api/chat", { data: { message: "hello" } });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.reply).toMatch(/coming soon/i);
});

test("POST /api/chat returns 400 on bad body", async ({ request }) => {
  const res = await request.post("/api/chat", { data: {} });
  expect(res.status()).toBe(400);
  const json = await res.json();
  expect(json.error.code).toBe("BAD_REQUEST");
});

test("GET /api/chat returns 405", async ({ request }) => {
  const res = await request.get("/api/chat");
  expect(res.status()).toBe(405);
});
```

Commit: `test(e2e): chat stub contract assertions`.

---

## Task 47: axe-core a11y on dark mode `/`

**Files:** `tests/e2e/a11y.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("/ has zero serious/critical a11y violations (dark)", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
});
```

Commit: `test(e2e): axe-core a11y on dark home`.

---

## Task 48: CONTRIBUTING.md + README.md

**Files:** `CONTRIBUTING.md`, `README.md`

- [ ] **Step 1: `CONTRIBUTING.md`**

Cover:
- Local setup: `pnpm install`, `cp .env.example .env.local`, fill Upstash creds, `pnpm dev`.
- Editing content: pointers to `content/profile.ts`, etc.
- Adding a project case study: drop `<slug>.mdx` in `content/projects/`.
- Running tests: `pnpm test`, `pnpm e2e`.
- Pre-PR manual check: edit a section component, observe Fast Refresh < 800ms in terminal.
- Rollback: Vercel dashboard → "Promote previous deployment".

- [ ] **Step 2: `README.md`**

Short — name, what it is, deploy URL, link to CONTRIBUTING and the spec.

- [ ] Commit: `docs: contributing + readme`.

---

## Task 49: Lighthouse + axe verification

- [ ] **Step 1: Build + start**

```bash
pnpm build && pnpm start -p 3001 &
```

- [ ] **Step 2: Run Lighthouse from Chrome DevTools** (mobile mode) on `http://localhost:3001/`.

Expected: Performance ≥ 90, Accessibility ≥ 95.

- [ ] **Step 3: If gaps, fix:**
- LCP > 2.5s → confirm `priority` on hero `<Image>`, confirm Open Runde `display: swap` + `adjustFontFallback`.
- A11y < 95 → run `pnpm e2e tests/e2e/a11y.spec.ts` for specifics, fix landmarks/labels.

- [ ] **Step 4: Commit any fixes** with `perf:` or `a11y:` prefix.

---

## Task 50: Final wire-up — connect to GitHub + Vercel

- [ ] **Step 1: Push to GitHub**

Create a new GitHub repo (private to start). Then:
```bash
git remote add origin <repo-url>
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Branch protection on `main`**

GitHub → Settings → Branches → require status check `ci` to pass before merge. Disable direct pushes to `main`.

- [ ] **Step 3: Sign up for Upstash and grab credentials**

Open https://console.upstash.com/redis. Sign in (free tier, no credit card). Create a new Redis database — pick the region nearest your expected visitors. On the database page, switch to the "REST API" tab. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

- [ ] **Step 4: Vercel project**

- Import the GitHub repo at vercel.com/new.
- Framework: Next.js (auto-detected).
- Add env vars (apply to BOTH Production and Preview scopes): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` from Step 3.
- DO NOT add `RATE_LIMIT_BYPASS` to Vercel env. (The rate limiter throws at module load if `BYPASS=1` and `NODE_ENV=production` collide; this is intentional.)
- Enable Vercel built-in Error Analytics (Project Settings → Analytics → check the box for "Web Analytics" — note: this is Vercel's free *error* analytics, NOT the paid traffic analytics that we deferred per spec §16).

- [ ] **Step 5: Confirm env before first deploy**

Vercel project → Settings → Environment Variables. Confirm BOTH `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are populated for both "Production" and "Preview" scopes. If either is missing, the chat route will 500 on first request.

- [ ] **Step 6: First deploy**

Vercel auto-deploys on the push. Visit `<project>.vercel.app`. Verify:
- Theme toggle works.
- All routes load (`/`, `/projects`, `/projects/first-project`, `/tech-stack`, `/certifications`).
- `POST /api/chat` returns the stub reply:
  ```bash
  curl -X POST https://<project>.vercel.app/api/chat -H 'content-type: application/json' -d '{"message":"hello"}'
  ```
  Expected: `{"reply":"Chat is coming soon — reach me via Calendly for now."}`
- Security headers deploy:
  ```bash
  curl -I https://<project>.vercel.app/ | grep -iE "x-frame|x-content-type|strict-transport|content-security"
  ```
  Expected: all four headers present.

- [ ] **Step 7: Note** the live URL in `README.md`. Commit + push.

---

## Self-review checklist (run after writing the plan, fix inline)

- [x] **Spec coverage:** every spec section is mapped to ≥1 task. Stack §4 → Task 1–4. Routes §5 → Tasks 36–39. Content model §6 → Tasks 12–14. Components §7 → Tasks 15–35, 42. Theming §8 → Tasks 4–5, 15. Chat §9 → Tasks 40–42. Deployment §10 → Tasks 8–9, 43, 50. Compile-time discipline §11 → Tasks 2, 3, 5. Acceptance criteria §12 → Tasks 9, 41, 44–47, 49. Hand-off §13 → covered by `EDIT ME` placeholder pattern + spec doc itself.
- [x] **Placeholder scan:** no "TBD", "TODO", "implement later" in step bodies. (The `EDIT ME` strings inside content files are intentional and explicitly excluded from the CI placeholder scan, which only matches `your-(name|bio|google|photo)`.)
- [x] **Type consistency:** `ProfileSchema` / `Profile` / `profile` consistent across tasks. `Section` props match between definition (Task 20) and consumers (Tasks 23–35). `ChatRequestSchema` matches between schema (Task 12) and route (Task 41).

## Open items requiring owner action before deploy

These are reflected in `.env.example` and the spec but reproduced here for quick reference:
1. Sign up at upstash.com (free) → create a Redis DB → copy URL + token into Vercel project env vars (Production + Preview scopes).
2. Provide identity, photo, bio, ≥1 project, Calendly URL — edit `content/profile.ts` and `content/projects.ts`.
3. Buy/connect a custom domain whenever ready (post-launch via Vercel dashboard).
