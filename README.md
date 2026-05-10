# omhar-portfolio

Personal portfolio site — Next.js 15 (App Router) + Tailwind v4 + MDX project case studies + dark/light theme.

**Live:** _to be added after Vercel hookup_

## What's in here

- All content lives in `content/*.ts` (typed by Zod schemas in `content/schemas.ts`)
- Per-project case studies in `content/projects/<slug>.mdx`
- Section components hide cleanly in production when their data is empty
- Chat route stub at `/api/chat` (rate-limited via Upstash); the chat UI is built but not mounted in v1
- CI on GitHub Actions: lint, typecheck, placeholder-string scan, audit, vitest, build, Playwright e2e, axe-core a11y

## Setup + how to edit

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Design + implementation docs

- Spec: [`docs/superpowers/specs/2026-05-10-portfolio-design.md`](./docs/superpowers/specs/2026-05-10-portfolio-design.md)
- Plan: [`docs/superpowers/plans/2026-05-10-personal-portfolio.md`](./docs/superpowers/plans/2026-05-10-personal-portfolio.md)
