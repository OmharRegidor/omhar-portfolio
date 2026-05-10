# Contributing

## Local setup

```bash
pnpm install
cp .env.example .env.local
# Fill in UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from console.upstash.com
# (Free tier — pick the region nearest you)
pnpm dev
```

Visit http://localhost:3000.

For local development without Upstash credentials, set `RATE_LIMIT_BYPASS=1` in `.env.local`. The chat route will return success without contacting Upstash. **The bypass refuses to start if `NODE_ENV=production`** — it cannot leak into a real deploy.

## Editing content

All content lives in `content/`. Edit a file, save, and the dev server hot-reloads.

| File | What it controls |
|---|---|
| `content/profile.ts` | Your name, role, location, bio, photo path, Calendly URL, social links, optional access card and featured awards |
| `content/projects.ts` | List of projects (slug, name, blurb, URL, tags) |
| `content/experience.ts` | Work history (title, org, year) |
| `content/certifications.ts` | Certifications (name, issuer, public proof URL) |
| `content/tech-stack.ts` | Categorized tech list |
| `content/recommendations.ts` | Quote + name + title per recommendation |
| `content/gallery.ts` | List of images (drop files in `public/gallery/` then add entries) |
| `content/membership.ts` | Org affiliations (name + URL) |

**Empty arrays** → the corresponding section is hidden in production. In development, you'll see a labeled hint pointing back to the right file. Recommendations and gallery hide unconditionally when empty (they're brand-damaging when blank).

## Adding a project case study

1. Drop `<slug>.mdx` in `content/projects/` where `<slug>` matches the slug in `projects.ts`.
2. Frontmatter must include `title` and `date` (ISO `YYYY-MM-DD`):
   ```mdx
   ---
   title: My Cool Project
   date: 2026-06-01
   ---
   ```
3. The project's card on `/projects` will automatically link to `/projects/<slug>` instead of the external URL, with a "Case study" badge.
4. The route uses `next-mdx-remote/rsc` with `rehype-pretty-code` for syntax highlighting.

## Running tests

- `pnpm test` — unit tests (Vitest + RTL, ~30 tests)
- `pnpm e2e` — Playwright smoke + theme + chat-stub + axe (requires real content per below)
- `pnpm lint` — ESLint (target-blank rule strict + no-unused-vars)
- `pnpm tsc --noEmit` — TypeScript strict + `noUncheckedIndexedAccess`

## Build gates (will block deploy until satisfied)

- **Placeholder content scan** in CI greps for known placeholder strings ("Owner Name", "Software Engineer", "Replace this paragraph", `your-handle`, etc.) in `content/`, `public/`, `app/`. Edit them out before pushing to main.
- **Prebuild script** `scripts/validate-content.ts` checks `profile.name`, `profile.role`, `profile.location`, `profile.calendlyUrl`, and `profile.bioParagraphs[0]` against placeholder values. Fails the build until edited.
- **Zod schemas** in `content/schemas.ts` enforce shape (e.g., `bioParagraphs` requires ≥1 paragraph, `projects` requires ≥1 entry).
- **Slug uniqueness** in `projects.ts` (Zod refine).
- **Anthropic key leak scan** in CI greps for `sk-ant-*` patterns to catch accidental commits.

## Pre-PR manual check

After editing a section component, watch the dev server output for the Fast Refresh time when the file recompiles. Target: under 800ms on a fresh dev server. If it creeps higher, audit imports — barrel imports from `lucide-react` or shadcn are the usual cause.

## Deploying

Vercel auto-deploys on push to `main` (via GitHub integration). All CI gates run first; broken commits don't reach prod thanks to branch protection.

To roll back: Vercel dashboard → project → Deployments → find the last good one → click "Promote to Production". Done in 30 seconds.

## v2 chat (LLM-backed) upgrade path

The route at `app/api/chat/route.ts` is a stub returning a fixed string. To upgrade to a real LLM:

1. Set `ANTHROPIC_API_KEY` in Vercel env (Production + Preview scopes).
2. Replace the route body to call Anthropic's streaming SDK. System prompt = `profile.bioParagraphs` + `projects` + `experience` (already structured for prompt caching — static portion first).
3. Switch response content-type from `application/json` to `text/event-stream`.
4. Mount `chat-launcher.tsx` (to be created in v2) in the root layout, which opens `chat-panel.tsx` (already built, not mounted in v1).
5. Update `chat-panel.tsx` to consume SSE instead of JSON.

Tighten rate limit to 5/min/IP at this point.
