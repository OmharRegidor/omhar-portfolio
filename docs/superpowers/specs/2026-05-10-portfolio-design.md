# Personal Portfolio — Design Spec

**Date:** 2026-05-10
**Status:** Draft, post-/noxadevteam pre-impl review (P0+P1 fixes applied)
**Reference site (research only, do not reproduce content):** https://bryllim.com/

## 1. Overview

A single-person personal portfolio site built with Next.js 15 App Router on Vercel. The visual structure mirrors the design pattern of bryllim.com (used as research reference), but all content is the user's own. The reference site's specific bio prose, recommendation quotes, gallery captions, and personal copy are not reproduced — only the layout pattern is reused.

The site is statically rendered at build time. There is no database, no CMS, no auth. Content lives in typed files in the repo and is edited by the owner directly.

The owner has only the project list ready at build time. **Sections with empty content arrays are hidden in production** (not shown as placeholder text — that would be brand-damaging). Identity, photo, and bio are deploy-blockers (build fails if missing).

## 2. Goals

- Ship a credible portfolio at `<project>.vercel.app` on day one — no visible TODOs, no "your bio goes here" in production.
- Keep ongoing edits to single-file changes (no rebuilds of structure to add a project, cert, or recommendation).
- Wire the chat *route handler* with a v2-ready contract so the LLM-backed swap is one route's body change. Launcher UI is hidden in v1 (re-exposed in v2).

## 3. Non-goals (explicit, v1)

- LLM call from `/api/chat` (route returns a fixed JSON in v1).
- Visible chat launcher in v1 (route exists; UI button is hidden).
- Blog or blog subdomain.
- Email contact form (Calendly is the only contact integration; trade-off accepted — see §16).
- Vercel Web Analytics in v1 (trade-off accepted — see §16; one-line opt-in path documented).
- Internationalization, CMS, admin UI.

## 4. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Static-first; supports the v2 chat API route without rewrites. |
| Language | TypeScript, strict + `noUncheckedIndexedAccess: true` | Catches empty-array `[0]` carousel footgun at compile time. |
| Styling | Tailwind CSS v4 (CSS-first `@theme` config) | Matches reference; utility speed. |
| UI primitives | shadcn/ui v4-compatible snapshot — `Button`, `Dialog`, `Sheet`, `Carousel`, `Separator` only | Tree-shakeable; `Sheet` added for mobile chat panel. |
| Icons | lucide-react, **per-file imports only** (`lucide-react/dist/esm/icons/<name>`) | Keeps bundle/HMR small. |
| Theme | next-themes, `attribute="class"`, `defaultTheme="dark"` | Persisted, respects `prefers-color-scheme`. |
| Fonts | next/font self-hosted Open Runde — **weights 400, 600, 700** | Pinned to prevent implementer drift; `adjustFontFallback: true` to reduce CLS. |
| MDX | @next/mdx (`format: 'mdx'`, no raw HTML) + gray-matter + rehype-pretty-code | For optional project case studies. |
| API request validation | Zod — same `schemas.ts` used at build time and on the `/api/chat` route | Single source of truth, no v1/v2 drift. |
| Rate limiting | `@upstash/ratelimit` + Upstash Redis (free tier) — sliding window, 10 req/min/IP on `/api/chat` | Required even for stubbed route to prevent invocation flooding. |
| Hosting | Vercel | Owner has account ready; deploys gated behind CI (see §10). |
| Package manager | pnpm 9.x — pinned in `package.json` `packageManager` field; `.npmrc` `engine-strict=true` | Deterministic CI. |
| Analytics | None in v1 (deferred per owner choice — see §16) | Out of scope. |

Versions pinned at scaffold time and recorded in `package.json` + `pnpm-lock.yaml` (lockfile committed).

## 5. Routes

| Route | Type | Content |
|---|---|---|
| `/` | Static | Hero card, About, Tech Stack preview (first 3 cats × 6 chips, **rendered only if those slices yield content**), Recent Projects (first 4 *or all*, whichever smaller), Recent Certifications (same), Recommendations carousel (**rendered only if non-empty**), footer block (membership, social, speaking, contact CTAs), Gallery carousel (**rendered only if non-empty**). |
| `/projects` | Static | Full grid of all projects from `content/projects.ts`. Cards link to `/projects/[slug]` if a matching MDX file exists, else to the external `url`. Cards visually distinguish the two via a small "Case study" badge. |
| `/projects/[slug]` | Static (`generateStaticParams`) | MDX case study render. **Source of truth for which slugs exist: filesystem (`fs.readdirSync('content/projects')`).** No `hasCaseStudy` flag on the Project type — eliminates drift. |
| `/tech-stack` | Static | All categories from `content/tech-stack.ts`. |
| `/certifications` | Static | Full grid from `content/certifications.ts`. |

404 falls back to a small "back to home" page.

**Breakpoint strategy** (Tailwind v4 defaults, applied consistently):
- `< 640px` (default): 1-column, full-width cards, no horizontal scroll.
- `md` (≥ 768px): 2-column card grids.
- `lg` (≥ 1024px): 2-column for projects/certs; 3-column for tech-stack categories.
- `2xl` (≥ 1536px): same content, capped at `max-w-[90rem]` container with growing side margins.
- All typography uses `clamp()` for fluid scaling (specific values pinned in §8).

## 6. Content model

One source of truth, all under `content/`:

```
content/
  schemas.ts          // ALL Zod schemas live here; each .ts file imports its schema and exports z.infer'd types
  profile.ts          // ProfileConfig: name, role, location, photoSrc, bioParagraphs[], socials, calendlyUrl, featuredAwards[], accessCard?
  projects.ts         // Project[]: { slug, name, blurb, url, tags? }   ← no hasCaseStudy flag
  projects/<slug>.mdx // optional per-project case study (frontmatter: title, cover?, date) — frontmatter validated by Zod at build time
  experience.ts       // ExperienceItem[]: { title, org, year }
  certifications.ts   // Certification[]: { name, issuer, url }
  tech-stack.ts       // Record<CategoryName, TechName[]>
  recommendations.ts  // Recommendation[]: { quote, name, title }
  gallery.ts          // GalleryImage[]: { src, alt }  — starts as []
  membership.ts       // Membership[]: { name, url }
```

**Empty-section policy (production):** when a section's source array is empty, **the section is hidden entirely** — no placeholder text in production. The layout reflows around the missing section.

**Empty-section policy (development):** when `process.env.NODE_ENV === 'development'`, empty sections render an owner-directed hint instead (icon + heading + dev-only instruction line). Visitors never see this; only the owner during local edits.

**Build-time gates** (Zod `.min(1)` on these — empty values fail the build, so they can't reach production):
- `profile.name` — non-empty string
- `profile.bioParagraphs` — at least 1 paragraph
- `profile.photoSrc` — required path that resolves to a file in `public/`
- `profile.calendlyUrl` — required URL
- `projects` — at least 1 project

`projects[].slug` is validated unique across the array via `.refine()`. Filesystem cross-check: a `prebuild` script confirms every MDX file in `content/projects/` matches a slug in `projects.ts`, and warns (not fails) on slugs without an MDX (those just get external-link cards).

Placeholder string scan: CI runs `grep -rE 'your-(name|bio|google|photo)' content/ public/ app/` and fails on any hit — prevents the "shipped `your-google-verification-code` to prod" trap.

## 7. Component inventory

```
components/
  layout/
    site-header.tsx           // sticky top bar with brand name + theme toggle (visible on every route)
    site-footer.tsx
    back-to-home.tsx
  hero/
    profile-card.tsx          // photo, name, verified-badge, location, role, featured-award, CTA buttons
    featured-award.tsx        // hidden when ≤1 award; rotates only when ≥2
  sections/
    about.tsx
    tech-stack-preview.tsx
    tech-stack-full.tsx
    recent-projects.tsx
    projects-grid.tsx
    recent-certifications.tsx
    certifications-grid.tsx
    experience-timeline.tsx
    recommendations-carousel.tsx     // not rendered when array is empty
    membership-block.tsx
    speaking-cta.tsx
    gallery-carousel.tsx             // not rendered when array is empty
    access-card.tsx                  // optional decorative element; hides if profile.accessCard absent
    empty-state.tsx                  // dev-only hint UI (icon + heading + instruction)
  ui/                                // shadcn primitives (per-file)
  theme/
    theme-provider.tsx               // wraps next-themes; injects pre-paint script
    theme-toggle.tsx                 // sun/moon button used by site-header
  chat/
    chat-panel.tsx                   // Sheet on <md, Dialog on ≥md (responsive primitive swap)
    // chat-launcher.tsx INTENTIONALLY OMITTED in v1 — re-introduced in v2 when LLM is wired
  mdx/
    mdx-layout.tsx                   // dynamic-imported on /projects/[slug] to keep / chunk lean
    mdx-components.tsx               // headings, code, image, callout
```

Every section is independently renderable and reads from one content file. No section depends on another.

**External link discipline:** every `<a target="_blank">` MUST have `rel="noopener noreferrer"`. Enforced via a small ESLint rule (`react/jsx-no-target-blank` configured strict).

**Carousel a11y requirements:**
- prev/next buttons have explicit `aria-label="Previous <item-type>"` / `"Next <item-type>"`.
- Keyboard arrow keys (`ArrowLeft`/`ArrowRight`) navigate when carousel is focused.
- `autoPlay={false}` always (WCAG 2.2.2 — no auto-advance).
- Respects `prefers-reduced-motion` (transitions drop to 0ms).

## 8. Theming & design system

**Theme mechanics:**
- `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem` true.
- Tailwind v4 `@theme` defines a `dark:` variant on `class`.
- `<html lang="en" suppressHydrationWarning>` on the root element.
- `ThemeProvider` injects a tiny inline script in `<head>` that reads `localStorage.theme` and applies `class="dark"` BEFORE first paint — eliminates the light-mode flash on dark-OS users.

**Color tokens** in `app/globals.css` as CSS variables, two palettes (dark default + light):
`--background`, `--foreground`, `--muted`, `--muted-foreground`, `--card`, `--card-foreground`, `--border`, `--accent`, `--accent-foreground`. Components reference tokens via Tailwind utilities. No hardcoded hex outside `globals.css`.

**Spacing scale:** Tailwind 4px base. Use only `0, 1, 2, 3, 4, 6, 8, 12, 16, 24` step values — narrows the design.

**Type scale (fluid via clamp):**
- `--text-display`: `clamp(2rem, 4vw + 1rem, 3.5rem)` — h1 only
- `--text-h2`: `clamp(1.5rem, 2vw + 1rem, 2rem)`
- `--text-h3`: `clamp(1.125rem, 1vw + 0.875rem, 1.375rem)`
- `--text-body`: `1rem`
- `--text-small`: `0.875rem`

**Radius scale:** `rounded-md` (chips, small buttons), `rounded-xl` (cards), `rounded-full` (avatar, icon buttons). Nothing else.

**Shadow scale (dark-mode-aware — luminance, not opacity):**
- `--shadow-card`: subtle outline-only border on dark; soft drop on light.
- `--shadow-elevated`: panel/dialog elevation.

**Focus indicators:** unified `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background` utility applied to every interactive element via shadcn primitives + a global CSS rule for native elements.

**Theme toggle position:** lives in `site-header.tsx` (sticky top bar, present on every route). Reachable in the mobile thumb zone via header. Removed from the hero profile card.

## 9. Chat route (`/api/chat`) — v1 stub, v2-ready

**v1 behavior:**
- Method: `POST` only. Other methods return 405.
- Body schema (Zod, in `content/schemas.ts`):
  ```ts
  const ChatRequestSchema = z.object({
    message: z.string().min(1).max(1000).trim(),
  }).strict();   // .strict() rejects unknown fields
  ```
- Server-side enforces the 1000-char limit independent of the (hidden in v1) UI textarea limit. Returns 400 on schema fail, 413 if `Content-Length > 4096`.
- Rate limited via `@upstash/ratelimit` sliding window: 10 req/min per IP. Returns 429 + `Retry-After` on exceed. Counter store: Upstash Redis (free tier; env vars `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` required from day one).
- Response shape (v1, `application/json`): `{ reply: string }` returning the fixed string `"Chat is coming soon — reach me via Calendly for now."`
- Error shape (any error, any version): `{ error: { code: string, message: string } }`. Codes: `BAD_REQUEST`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `METHOD_NOT_ALLOWED`, `INTERNAL`.

**v1 UI:** the `chat-launcher.tsx` component is intentionally NOT shipped in v1 (Manny: avoiding the "looks broken" trap). The `chat-panel.tsx` component exists but is not mounted by any page. The route is reachable directly for testing only.

**v2 swap (planned, not in v1 scope):**
- Response content-type changes from `application/json` to `text/event-stream` (SSE). Each chunk: `data: {"token": "..."}\n\n`. Terminator: `data: [DONE]\n\n`. **The UI WILL change** to consume SSE — we admit this upfront rather than over-promising "no UI change."
- LLM call: Anthropic SDK with **prompt caching** — system prompt (composed of `profile.bioParagraphs` + `projects` + `experience`) is the leading static portion and gets cached; user `message` is uncached.
- Env: `ANTHROPIC_API_KEY` (server-only, never `NEXT_PUBLIC_*`, never imported in `"use client"` files), validated at boot via Zod (`z.string().min(1)`) — fails loudly on misconfigured Vercel env.
- Rate limit tightens to 5 req/min per IP (still sliding window).
- The `chat-launcher.tsx` UI is added back, mounted in the root layout.

## 10. Deployment & CI

**CI gate** (`.github/workflows/ci.yml`):
1. Setup: checkout, install pnpm 9.x, restore `node_modules` cache keyed on `pnpm-lock.yaml`.
2. Lint + typecheck (parallel via `concurrently`): `pnpm lint`, `pnpm tsc --noEmit`.
3. Build: `pnpm build` (covers Zod content validation + `generateStaticParams`).
4. Placeholder scan: `grep -rE 'your-(name|bio|google|photo)'` — fail on hit.
5. `pnpm audit --audit-level=high` — fail on high+ vulnerabilities.
6. Test: `pnpm vitest run` (unit, including empty-array section guards + chat schema + 10001-char rejection).
7. Smoke: `pnpm playwright test --project=chromium` (visits each route, checks chat stub contract, checks theme hydration produces no console warnings).
8. axe-core run on dark-mode `/` (catches token-level contrast Lighthouse misses).

**Branch protection on `main`:** all CI checks required to pass before merge. Vercel deploys only after merge — broken commits never reach prod.

**Vercel project settings:**
- Auto-deploy on push to `main`.
- Preview deploys on PRs (Upstash env vars set in Preview scope from day one).
- Vercel built-in Error Analytics enabled (one checkbox, free, no SDK).
- Custom domain attached later via dashboard. DNS pre-pin: CNAME `cname.vercel-dns.com` for subdomain or A/AAAA to Vercel anycast for apex. HTTPS auto-renews via Let's Encrypt.

**Security headers** (`next.config.ts` `headers()`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` (add `preload` only AFTER custom domain attached + verified on hstspreload.org; never on shared `*.vercel.app`)
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'` — `'unsafe-inline'` on `script-src` is required for the `next-themes` pre-paint script (prevents light-mode flash). Replace with a nonce strategy in v1.1 if tightening is needed.

**Env management:**
- `.env.example` committed from day one with all keys (v1 + v2) listed:
  ```
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  # ANTHROPIC_API_KEY=        # v2 only
  ```
- `.env.local` in `.gitignore`. No secrets in code or `vercel.json`.

**Image strategy (v1):** all images are local in `/public/` (profile photo, gallery, social icons via lucide). `next/image` works without `remotePatterns` config. A comment in `next.config.ts` marks the insertion point if v2 ever needs external image hosts.

**Source maps:** `productionBrowserSourceMaps: false` explicit in `next.config.ts` (Next.js default is already false; explicit beats implicit).

**Rollback:** Vercel dashboard "Promote previous deployment" is sufficient for a one-person portfolio. No additional tooling needed; documented in `CONTRIBUTING.md`.

**robots.txt + sitemap.xml:** deferred to v1.1 (`app/robots.ts` and `app/sitemap.ts` zero-config drop-ins).

## 11. Compile-time discipline (Windows + Next.js HMR)

Per existing project preference (auto-memory: keep Fast Refresh under ~800ms):

- No barrel imports. lucide via `lucide-react/dist/esm/icons/<name>`. shadcn via per-file paths.
- shadcn components copied into `components/ui/` (no whole-library installs).
- `next/font` Open Runde — exactly weights 400, 600, 700 (pinned).
- Avoid client-component creep — only `chat-panel`, `theme-toggle`, `theme-provider`, carousels, and the featured-award rotator are `"use client"`. Everything else server.
- `tsconfig.json`: `strict: true` + `noUncheckedIndexedAccess: true`.
- Lazy-load MDX layout via `dynamic()` so `/` chunk doesn't pull `rehype-pretty-code`.
- Hero `<Image>` gets `priority` prop (above-the-fold LCP element).

Fast Refresh < 800ms is a *manual* check before opening a PR (documented in `CONTRIBUTING.md`); not a CI assertion (impractical to measure in CI).

## 12. Acceptance criteria (v1)

The site is shippable when:

1. CI workflow passes on `main` (lint, typecheck, build, placeholder scan, audit, vitest, playwright, axe-core).
2. All five routes (`/`, `/projects`, `/projects/[slug]` for any seeded MDX, `/tech-stack`, `/certifications`) render without errors in the production build.
3. Theme toggle persists across reloads, respects `prefers-color-scheme` on first visit, and produces no SSR hydration warnings in console.
4. `POST /api/chat` with valid body returns `{ reply: "..." }` (200); with invalid body returns `{ error: ... }` (400); when rate-limited returns 429 + `Retry-After`.
5. Editing one file in `content/` and re-running dev shows the change without restart.
6. Empty section arrays in production result in the section being absent from the rendered HTML (verified by Playwright assertion).
7. Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95 on `/`.
8. axe-core reports zero serious/critical violations on dark-mode `/`.
9. All animated elements (carousels, chat-panel, theme transition) respect `prefers-reduced-motion: reduce`.
10. Deployed to a Vercel preview URL successfully; production deploy gated on PR merge.

## 13. Hand-off requirements (what the owner provides)

Required to deploy at all (build fails if missing — no placeholder fallback in production):
1. **Identity:** display name, role line, city/country.
2. **Profile photo:** square or close, 800px+ minimum, dropped into `/public/`.
3. **Bio:** at least 1 paragraph (2–4 recommended).
4. **At least 1 project:** name, 1-line blurb, URL.
5. **Calendly URL:** for the "Schedule a Call" CTA.
6. **Upstash Redis credentials:** free-tier signup; URL + token go into Vercel env.

Optional (sections appear when content arrives, hidden until then):
7. Experience timeline (title, org, year per item).
8. Tech stack (categorized).
9. Certifications (name, issuer, public proof URL).
10. Recommendations (quote + name + title).
11. Memberships (org name + URL).
12. Social URLs (any subset of LinkedIn, GitHub, X, Instagram).
13. Gallery images (`/public/gallery/` + entries in `gallery.ts`).
14. Per-project MDX case studies.
15. Custom domain (post-launch via Vercel).

## 14. References

- Reference site (research target only): https://bryllim.com/
- Owner's existing preference (auto-memory): minimize Next.js Fast Refresh time on Windows.
- Owner's existing preference (auto-memory): /noxadevteam review gate before declaring non-trivial features done.
- /noxadevteam pre-impl review (this spec, post-fixes): see commit log.

## 15. v1.1 backlog (P2 from team review)

Not blocking v1 ship, but tracked here so they don't get lost:

- One signature accent color/gradient unique to the owner — distinguishes the site from a content-swapped clone of the reference.
- `app/robots.ts` + `app/sitemap.ts` (Next.js 15 file conventions, zero-config drop-ins).
- Project card visual differentiation (case study badge already in v1; iterate on the visual).
- v2 chat: `chat-launcher.tsx` re-introduction + Anthropic SDK swap + SSE consumption in panel.
- Optional: switch from Vercel Error Analytics to Sentry if error volume warrants it.

## 16. Deferred per owner choice (P3)

These were proposed by /noxadevteam but the owner had previously opted out. Documented as deliberate trade-offs with one-line opt-in paths:

- **Vercel Web Analytics:** opt out in v1. Trade-off: zero traffic visibility (no bounce rate, no drop-off, no session counts). Opt-in: install `@vercel/analytics` + add `<Analytics />` in root layout (5 minutes).
- **Email CTA in footer:** opt out in v1 (Calendly-only contact). Trade-off: a recruiter doing a 30-second portfolio scan has no email-copy path; must book a Calendly slot. Opt-in: add a `mailto:` link to footer block (10 minutes).
