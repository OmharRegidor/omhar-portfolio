# Handoff, Omhar's Portfolio (updated 2026-10-10)

## ▶ LIVE (2026-10-10): the Atelier pages are the site now

The owner said "make it live now" without waiting for the spec or the Next.js rebuild, so the approved previews
ship as **static pages** inside the existing Next.js app. The React rebuild is still the long-term plan.

| What | Where |
|---|---|
| Live pages (edit these now, not `.noxa/`) | `public/atelier/index.html`, `automations.html`, `gear.html`, `ask-omhar.js`, `site-menu.js` |
| Photos, fonts, Embla | `public/atelier/hero/`, `projects/`, `gear/`, `fonts/` (self-hosted, latin + latin-ext), `vendor/` |
| Clean URLs | `next.config.ts` `rewrites().beforeFiles`: `/`, `/gear`, `/automations` → the files above |
| Redirects (307, temporary) | `/projects` → `/#work`, `/tech-stack` → `/#stack`, `/automations/{cs-live-inbox,daily-sales-pulse,sop-assistant}` → hash routes |
| SEO | `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`; every canonical/JSON-LD uses `https://omharregidor.vercel.app` |
| Rollback | tag `original-layout-v1` / branch `archive/original-layout` (both pushed). Removing the `rewrites`/`redirects` blocks alone brings the old homepage back |

How the copy was made: a one-off script turned the previews into live files. Inlined images became real files
(homepage 1.8 MB to 130 KB), Google Fonts became self-hosted (the site's CSP only allows `'self'`), links became
clean URLs, and preview-only bits were removed: the chat's "Preview" note, the automation page's preview pill,
the "Omhar to supply/confirm" Problem, Result and Result-row placeholders. `/automations` with no hash opens
CS Live Inbox (the old in-page home view stays hidden, its inlined shots removed). The dark-mode night photos
were dropped (light only). The hidden "Preview options" panel is still in the homepage markup (never shown).
Still on the React app: `/resume`, `/certifications`, `/api/chat`, the 404 page. The Atelier chat is the
scripted one (no `/api/chat` call yet). Lint ignores `public/**` and `.noxa/**`.
Tests: smoke and a11y cover `/`, `/automations`, `/gear` (plus fonts are local, redirects work); the old
homepage's scroll-reveal and theme-toggle tests were removed, the reduced-motion and hydration tests run on `/resume`.

Security (2026-10-11): `pnpm audit` started failing CI on new advisories (3 critical Next.js RCEs). Next.js and
eslint-config-next went 16.2.6 → 16.3.8 (the patched line; 16.4.0 was 5 days old). Patched transitive versions are
forced through `pnpm.overrides` (brace-expansion, js-yaml, nanoid, postcss, browserslist, source-map-js, undici).
`braces` GHSA-vfj7-8cjw-p6xm has no fix yet and only sits in the lint plugin, so it's in `pnpm.auditConfig.ignoreGhsas`.
Remove that entry once a patched `braces` exists.

Scroll entrances (2026-10-12, owner request): `public/atelier/reveal.js`, loaded on all three pages. Blocks below the
fold are held invisible by a paused opacity-only Web Animation, then play their page's entrance once a quarter of
them shows. Each page picks a style with `data-reveal` on `<body>`: home `pop` (rise and grow with an overshoot),
gear `lift` (3D tip-up from flat), automations `wipe` (clip-path wipe from the left). The hold must never move or
clip a block, because the observer measures what is painted and a block clipped to nothing never counts as showing.
The four homepage facts (`dd[data-count]`) count up from 0 as they come in, with the real value kept in a visually
hidden span for screen readers. Blocks on screen at load are never touched, and nothing is held under reduced
motion or when printing. The block list is the `TARGETS` selector array at the top of the file; never list a block
with one of its own children. `openAuto()` in automations.html calls `atelierReveal.refresh()` after it redraws.
Covered by `tests/e2e/scroll-reveals.spec.ts` (back again, now for the Atelier pages).

Glass, cursor and icons (2026-10-13, owner request), on all three pages:
- `glass.css` + `glass.js`: the header becomes a floating glass capsule once the homepage scrolls (gear and
  automations start as one via `class="top solid"`), and the chat bubble becomes a small lens. Chromium gets the
  bending rim from an SVG displacement filter used as `backdrop-filter:url(#lg-*)`; glass.js only adds `html.lg`
  there, so Safari and Firefox keep a frosted blur. The panes and their rim widths are the `PANES` list. Math adapted
  from liquid-glass.js (MIT); the library itself was 600 KB, so it is not vendored.
- `cursor.js`: Cuberto mouse-follower 1.2.1 (MIT) on GSAP 3.15.0 (GreenSock no-charge licence), both in `vendor/`,
  only downloaded with a fine pointer and motion allowed. Hover labels are the `LABELS` map. It hides over text
  fields, where the native cursor comes back.
- `icons.svg`: Phosphor Regular (MIT) sprite, used as `<svg class="icon"><use href="/atelier/icons.svg#i-..."/></svg>`.
  Every eyebrow has a section icon in place of the old "+", and every text arrow and play/pause/close glyph is an
  icon. The class is `.icon` because automations.html already uses `.ic` for workflow nodes. Project rows carry a
  hidden "(opens in a new tab)".
- Open: in dark mode the homepage slideshow asks for a night photo that does not exist (pre-existing; visitors can't
  reach dark mode today). Add the photo or drop that slide.

Chat backend and inbox demo (2026-10-13): the chat and demo run on free tiers only, by owner request. The default
`AI_PROVIDERS` is `groq,google`, static stays last. Groq uses the `GROQ_API_KEY` already in Vercel; its old model
`llama-3.1-8b-instant` was shut down on 2026-08-16 (that is why the live chat only gave the static reply), so
`GROQ_MODEL` now defaults to `openai/gpt-oss-20b`, sent with `reasoning_effort: low`, `include_reasoning: false` and
400 extra output tokens because its reasoning cannot be switched off (`lib/ai/providers/groq.ts`). Gemini is an
optional free backup: set `GOOGLE_AI_API_KEY` from AI Studio and keep that Google project with NO billing account
linked, which is what keeps it free (`GEMINI_MODEL` defaults to `gemini-2.5-flash`, thinking off; its free tier may use
prompts to improve Google's models). A spent free quota returns 429 and visitors get prepared answers or marked
samples instead. The chat panel asks visitors not to share private details. Claude is wired but paid, so it only runs when `AI_PROVIDERS` names `anthropic` and `ANTHROPIC_API_KEY` is set
(`ANTHROPIC_MODEL` defaults to `claude-haiku-5-5`; `lib/ai/providers/anthropic.ts`, plain fetch; it sends no
`temperature` because current Claude models reject non-default values, and Haiku runs with thinking off). Every
Upstash check now gets one attempt and a 1500 ms deadline, then Upstash is skipped for 30 s (`lib/upstash.ts`). When
Upstash is missing, slow or failing, an in-memory fallback takes over instead of failing open: 10 requests per minute
per IP and a per-instance daily counter capped at `CHAT_DAILY_CAP` (0 = no cap), logged once per instance as
`[limits] Upstash unavailable`. These are per instance, so point the Upstash env vars at a live database to get shared
limits back. The chat also knows the three n8n workflows and the gear (`content/automations.ts`, `content/gear.ts`).
`POST /api/demo/inbox` (logic in `lib/demo/inbox.ts`) takes `{ "email": string }` (trimmed, 1 to 1500 chars, body at
most 4096 bytes, no other fields), uses the chat's per-IP limit and one daily-cap unit, and runs triage then, only on
REPLY, a draft through the live providers (never static). It answers 200 `{ needsReply, reason, draft | null, provider }`,
400 `BAD_REQUEST` or `PAYLOAD_TOO_LARGE`, 429 with `Retry-After: 60`, or 503 `{ error: { code: "DEMO_OFFLINE", message } }`
when no key is set, every provider fails, `CHAT_ENABLED=0` or the daily cap is spent; other methods get 405. All `no-store`.

Client wow features, page side (2026-10-13), covered by `tests/e2e/live-features.spec.ts`:
- `ask-omhar.js`: starter chips stay prepared answers; typed questions stream from `/api/chat` with the last 7 turns.
  A `static` provider header, an error or an empty stream falls back to the nearest prepared answer. The Calendly
  link, the email and `/gear` / `/automations...` paths in an answer become links.
- `try-inbox.js` + `#try` in automations.html (shown only on `#auto-live-inbox`): three made-up sample emails. When
  the demo answers 503 or fails, a sample shows its result written in advance, tagged as such.
- `calc.js` + `#calc` under the homepage automations: hours a month = hours a week x people x share x 4.33, worth =
  rounded hours x the visitor's hourly cost in US dollars, and the working line always shows the sum.
- Each page has `@view-transition{ navigation:auto }` with `.top{ view-transition-name:top }`, off under reduced motion.
- Project hover previews load `projects/<slug>-full.jpg` (full-length captures of the live sites, 640px wide, max
  3200px tall) on the first mouse visit to the list and pan through them with `object-position`. Recapture them when
  a client site changes.
- `cursor.js` also makes every `.book` button lean up to 8px toward the pointer, mouse users only.

Still unconfirmed and now live as-is: Comfit is named as a client on the CS Live Inbox page; the Noxa testimonial
has no employer label; MacBook size, memory and storage are not shown; the mouse is assumed to be the OP-620D.

## Atelier redesign history (design approved in principle)

Session of 2026-10-08/09. Brainstorming path = **architectural**. The owner iterated on the look in
HTML previews; **no app code was changed**. Next step after the owner answers the 5 questions below:
write the spec (`docs/superpowers/specs/2026-10-xx-atelier-redesign-design.md`), owner reviews it, then
`superpowers:writing-plans`. Do not build before the spec is approved.

### Where everything is

| What | Where |
|---|---|
| Homepage preview (final look) | `.noxa/atelier-redesign/atelier-hero.html` (open in a browser) |
| Automation pages preview | `.noxa/atelier-redesign/automation-preview.html` (`#auto-live-inbox`, `#auto-sales-pulse`, `#auto-sop`) |
| The 3 original direction options | `.noxa/atelier-redesign/portfolio-directions.html` |
| Homepage source + rebuild | edit `atelier-hero.src.html`, then `node build-hero.cjs` (inlines `hero/`, `projects/`, `vendor/`) |
| SEO drafts for the real build | `.noxa/atelier-redesign/seo/` (`robots.txt`, `llms.txt`, homepage + automations JSON-LD) |
| Team review screenshots | `.noxa/atelier-redesign/review/` |
| Restore point of the ORIGINAL layout | branch `archive/original-layout` and tag `original-layout-v1` (= main @ `7ef7894`). Go back with `git checkout original-layout-v1` or `git switch -c restore archive/original-layout` |
| Older experiments | `feat/v2-static` (v2 CRT/3D, then v3 B/W bento committed as `7a25f0e`, local only) |

`.noxa/` is gitignored, so the previews are local only (not on GitHub).

### Owner decisions (locked)

- Direction **"The Atelier"**: quiet luxury, minimalist, **light mode only** (theme toggle removed).
- Palette **black & white** (`mono`): paper `#F7F6F2`, ink `#121413`, hero dark `#0D0D0D`, band `#111111`.
- Fonts: **Geist 300** headings (small, minimal), **Instrument Serif italic** for accent words, **Jost** body.
- Hero: drfol.io style. Full-bleed photo on the right, dark fade from the left, white headline
  **"Helping businesses reduce their *manual processes*."** (2026-10-10, owner's wording, LOCKED; earlier tries
  "Software that helps small businesses *run lighter* and grow.", "Stop doing by hand what software can *do for
  you*.", "Still running your business without *a system*?" and "Why is your business process still *done
  manually*?"), sub "I build the automations, web systems and AI tools that take repetitive work off your team,
  so you can focus on growing." (`.sub` has `text-wrap:pretty` so no word hangs alone), eyebrow, Book a 30-min
  call (Ask Omhar AI is now the chat bubble).
  The sub no longer names Batangas; location still shows in the quick answer block and footer.
- Hero photo: **slideshow, 3 s per photo**, 5 photos (campus day, lobby, studio, graduation, night coding).
  Capstone photo excluded. Campus is the day photo (the campus night photo was only for the removed dark mode).
  Pauses on hover, still under reduced motion. Hover on campus shows the second pose (`profile-day-hover`).
  **2026-10-10: owner removed the progress dashes and the visible pause button.** The pause button is kept
  only for keyboard users (it appears when tabbed to) so WCAG 2.2.2 still passes.
  The designer recommended 6 s and a bigger H1. **Owner kept 3 s and the small font.**
- **Header is fixed (2026-10-10, owner request).** Clear over the hero at the top of the page, then a near-black
  bar (`.top.solid`, set by a scroll listener) once the page scrolls. The nav sits outside the hero now, the hero
  keeps a 102px (mobile 77px) first grid row so nothing moved, and `scroll-padding-top` keeps nav targets visible.
  The automation pages use the same header (same links, incl. Stack), always in its solid bar state, with
  "Automations" underlined as the current page. Build it once as a shared layout component in the real site.
- **No accent color (2026-10-10, locked).** A 10% accent was explored (Vermilion, Brass, Iris) and the owner
  chose to stay pure black and white. The variants and comparison page were removed. Do not re-propose a color.
- Homepage order: hero → "What does Omhar Regidor do?" quick answer → **01 Websites & apps** (6 rows, real homepage
  screenshots follow the cursor; on touch the screenshots show inline) → **02 Automations** (3 rows, mini animated
  diagram on hover, links to automation pages) → **What clients say** (Embla carousel, 5 testimonials, autoplay 8 s,
  pause button) → **03 Tools I build with** (33 logos, 2 Embla auto-scroll rows, pause button, brand colour on hover)
  → **Questions, answered** (9 FAQs) → closing CTA → footer.
- Testimonials and logo rows use **Embla** (already a dependency: `embla-carousel-react` 8.6 + autoplay,
  auto-scroll, class-names plugins). No new library.
- Automations: the two SOP workflows are **one page** with an "In Slack / Chat window" switch → 3 pages total
  (CS Live Inbox, Daily Sales Pulse, SOP Assistant). Each page has a dark tilted "3D" node graph (CSS 3D + SVG,
  **no WebGL**, since WebGL failed on the owner's machine in v2), animated data packets with sample-data chips,
  hover/focus/tap cards (type, name, role, description, "How it behaves", step N of M), Pause/Step/2×,
  scenario switch, "Every node explained" list, Book-a-call CTA, prev/next.
  Nodes do NOT lift on hover (owner request); arrows end exactly at the port circles.
  **2026-10-10: owner asked for a flat, straight flow.** The 3D tilt and mouse parallax are gone, every main
  step sits on one horizontal line (IF "true" leaves from the right tip, "false" drops to Skip below), and the
  extra text is removed (run counter, logos/draft disclaimer, "Tools" + "+" stubs, "Kept"/"POST" edge labels,
  agent slot labels). Homepage mini diagrams were regenerated to match. "Simulated run · sample data" stays.
- Labelled **"Simulated run · sample data"**, never "live". No internal URLs from the n8n screenshots anywhere.

### Team review (Noxa: Gemini, Manny, Jazelei, Franco), fixes already applied in the previews

- SEO/AEO/GEO: titles, meta descriptions, canonical, OG/Twitter, one JSON-LD `@graph`
  (Person, ProfessionalService, WebSite, ProfilePage, BreadcrumbList, 2× ItemList, FAQPage; automation pages:
  BreadcrumbList + CreativeWork with HowToStep parts). Quick-answer block with real numbers (6 projects, 3 automations,
  coding since 2021, BS IT 2025), answer-ready section intros, 9 factual FAQs (schema text = visible text).
- Copy: "Built for the browser" → "Websites and apps I've *built*"; "Workflows that run while you sleep" →
  "Workflows that take over the *busywork*" (a person still reviews drafts).
- Fixes: touch users can open projects; white focus ring on dark areas; pause controls (WCAG 2.2.2);
  inactive testimonial slides `inert`; mini-diagram packets respect reduced motion; slideshow stops off-screen;
  dead `#` nav links; empty tooltip; landmarks/heading order; 320 px overflow. **axe: 0 violations** on both pages.

### Engagement audit (2026-10-10, Noxa: Manny, Gemini, Jazelei). Owner has not picked yet.

Broken today: hero "Ask Omhar AI" only shows a toast (`atelier-hero.src.html`, `.ask` handler); live chat open state
is private to `chat-launcher.tsx` so nothing else can open it; automation pages still show "Omhar to supply";
project rows leave the site and phones get no preview; no analytics (`@vercel/analytics` not installed);
the hero headline and first photo wait for JS (LCP risk, make first paint CSS only); the sim loop does not pause
on a hidden tab; em-dash in `ERROR_REPLY` (`chat-panel.tsx`).
Ranked hooks: (1) Ask Omhar AI as a live demo with 3 starter chips, a `openChat({source, topic})` window event,
starters in `content/chat-starters.ts`, top chips answered from canned text (no API call), Book card after 6
messages or a 429. (2) "Try it yourself" on automation pages, pick or type a customer email and watch it run to an
Approve step (keyword matching, labelled simulated). (3) Project stories in `dialog.tsx`/`sheet.tsx` as an
intercepting route `/projects/[slug]`. (4) "Your call agenda" checklist before the closing CTA, carried into
Calendly. (5) Real results on every automation + one line per homepage row. (6) Dated availability line from
`content/profile.ts`, build fails if older than 45 days. Later: hours-saved calculator, tools-to-projects
highlight. Rejected as gimmicky: headline weight thinning on scroll.
Tracking events: `cta_book_click`, `chat_open`, `chat_starter_click`, `chat_message_sent`, `chat_limit_hit`,
`automation_view`, `sim_interact`, `project_open`, `contact_click` (custom events may need a paid Vercel plan).
**Built in the preview (owner picked hook 1):** `.noxa/atelier-redesign/ask-omhar.js`, one shared chat panel loaded by
both previews. Opens from any `[data-ask-open]` element (the hero "Ask Omhar AI" link was removed by the owner, so
the hero has only "Book a 30-min call"; a round chat bubble fixed bottom-right on
every page with a breathing grey ring and an "Ask Omhar AI" hover label, "Ask about this workflow" on each
automation CTA) or `[data-ask="<id>"]`. The hero "Try asking" chips were removed at the owner's request
(starter questions now live only inside the chat).
Answers are prepared text from the FAQs, project rows and workflow data (`KB` in the file), typed questions are
keyword-matched, price/availability always point to a call, a Book card shows after the 3rd question. Starters
change per automation page. Full screen + `inert` page on phones, Esc closes, focus returns, axe 0 violations.
Preview-only: the "Preview. On the live site, typed questions go to the real AI." note (must not ship). In the real
build, port `KB` to `content/chat-starters.ts`, answer starters locally and send unmatched text to `/api/chat`.
Needed from the owner: automation numbers; permission + real names/photos for 2 testimonials; 4 screens or a
10 s recording + one result line per project; 3 real (scrubbed) customer emails and the AI drafts; reply time and
availability; Calendly booking-question support; Vercel plan.

### Phone menu + hero seam (2026-10-10, owner request)

`.noxa/atelier-redesign/site-menu.js`, loaded by all three pages. Under 860px the header "Book a call" is hidden
and a two-line menu button (morphs into a cross) opens a full-screen black sheet that wipes down (clip-path,
620 ms) with the header links rising in one by one (numbered 01 to 06, current page in italic serif), then
"Book a 30-min call", "Ask Omhar AI" (opens the chat) and the email. Built from the page's own header links.
Esc, the button or any link closes it; same-page links scroll after the sheet closes; focus moves in and back;
the rest of the page is `inert` and scroll-locked while open; reduced motion swaps instantly. axe 0 violations.
Hero seam on phones fixed: `.hero-media` now `overflow:hidden` (the photo zoom pushed its edge 7px past the fade)
and the bottom fade is a long eased gradient.

### Phone polish (2026-10-10)

- Project rows (01): on phones/touch the inline screenshot is now a link to the live site, same as the title
  (built in the homepage script from each row's href). The ↗ next to each name always shows on phones. A
  "Visit site" link was tried and removed by the owner, since the title and screenshot already open the site.
- Automation rows (02) on phones: each row now shows its mini workflow diagram underneath (cloned from
  `#auto-float`, ids made unique, viewBox trimmed to `0 25 330 150`), and the diagram opens the automation page
  like the title. Same `.inline` reveal as the project screenshots; hidden on desktop.
- Automation control bar on phones (under 600px): compact two-row bar (Pause, Step, 2x on top, scenarios below,
  split by a hairline) instead of one row that ran off screen. Scenarios have short phone names via `short` on
  each run ("Order question", "Delivery notice").

### Gear page (2026-10-10, owner request)

`.noxa/atelier-redesign/gear.html` + tiles in `gear/` (1200x900, product trimmed and centered on white, made with
sharp from manufacturer photos: Apple store image, Lenovo via Icecat, AULA F75 Black Contour via an Aula-vendor
Shopify listing, A4Tech official site). Cards show photos in grayscale, colour on hover (fine pointers only).
"Gear" added to the nav on all pages, plus a link at the end of the homepage Tools intro (the only way in on
phones, since the nav hides under 860px). Ask Omhar AI got a `gear` answer and gear starters on that page.
Facts: ThinkPad read from this machine (T460, model 20FMS1VA16, i5-6300U, 2x8 GB DDR3-1600, SanDisk 512 GB SSD,
14" 1920x1080, HD 520). Unconfirmed: MacBook size, memory and storage; mouse assumed OP-620D (could be OP-730D).
Real build: `app/gear/page.tsx` from a zod `content/gear.ts`; prefer the owner's own photos over vendor images.
Photo viewer (owner asked for tappable photos on phones): each photo is a button (built in the page script, label
"View a larger photo of the …") that opens a native `<dialog class="gv">` with the photo large and in colour, plus
its role and name. The photo grows out of the small one and shrinks back into it (Web Animations, skipped with
reduced motion). Closes on the X, Esc, or a tap anywhere; focus goes back to the photo. Page scroll is locked with
the scrollbar space kept (`scrollbar-gutter:stable`, that strip turns dark too). A small expand icon sits in each
photo's corner on touch screens and appears on hover on desktop. The dark layer is on the dialog itself, not
`::backdrop`, so axe reads the caption on a real dark surface. Real build: same pattern as a client component.

### Open questions for the owner (answer at the start of next session)

1. May **Comfit** be named on the site? (Otherwise "a US online store".)
2. **Real results** per automation (time saved, reply speed, volume), or "no metric yet".
3. The **Noxa Loyalty testimonial** comes from the owner's employer. Label it as such?
4. Three FAQ facts: works with **clients outside the Philippines**? **pricing approach**? usual **reply time**?
5. Buy a **custom domain** (e.g. omharregidor.com)? Needed before canonicals, sitemap and JSON-LD URLs are final
   (previews use `https://omhar-portfolio.vercel.app`).

### Must-do in the real build (from the review)

- **P0** Automation pages must be server-rendered: `app/automations/[slug]/page.tsx` with `generateStaticParams`
  from a zod `content/automations.ts`; only the animated stage is a client island. (The preview renders them with
  JS, so crawlers see nothing.)
- **P0** Placeholder text ("Omhar to supply/confirm", preview pill, tweaks panel) must never ship.
  Make `scripts/validate-content.ts` fail on it.
- Fonts via `next/font` (the CSP blocks Google Fonts). Hero: only slide 1 server-rendered with `next/image`
  preload, the other slides mount after load; enable AVIF.
- `app/sitemap.ts`, `app/robots.ts` (allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended;
  disallow `/api/`), `app/opengraph-image`, `components/seo/json-ld.tsx`, `public/llms.txt`. Turn off Vercel's
  AI-bot firewall rule. Submit the sitemap in Search Console.
- Stage performance: single transform instead of `preserve-3d` layers, rAF-throttled pointermove, solid card surface.
- Mobile automation stage: consider a vertical flow below 640 px (designer suggestion).

### Previous handoff (before the Atelier redesign, kept for history)

# Handoff, Omhar's Portfolio (updated 2026-06-17)

Next.js 16 / React 19 / TS / Tailwind v4, deployed on Vercel. Repo:
`OmharRegidor/omhar-portfolio`. Package manager: **pnpm**.

---

# Goal — what we're building

1. **AI chatbot** ("Ask Omhar AI") — answers visitor questions about Omhar and routes
   to a Calendly booking. Free to run. **DONE (Phase 1, merged earlier).**
2. **More interactive portfolio** (motion, microinteractions, analytics).
   **Phase 2 — in progress.**

---

# Current State — where things stand

- **`main` is green, pushed, and CI-passing.** The ⌘K command palette was built and shipped
  (`93f436b`), then **reverted on the owner's request** (`e09fa76`): they didn't want the
  visible "Go to…" trigger, and without it the palette had no discoverable entry (mouse/
  mobile). The `undici` CI audit fix (`7336f20`) **stays** (it's independent of the palette).
  `origin/main` is in sync and Vercel has deployed.
- **Net effect of the palette episode:** the only lasting change is that the **theme switch is
  now global** — rendered in `app/layout.tsx` (fixed top-right) on every page, so sub-pages
  have a theme toggle too (it used to be homepage-only, inside `ProfileCard`).
- **Phase 2 progress:** motion foundation ✅ · launcher breathing ring ✅ · two chat
  bug-fixes ✅ · homepage scroll-reveals ✅ · ~~⌘K command palette~~ (built, then **reverted**).
  **One roadmap item remains: conversion analytics** (see **Next move**).

## What shipped (newest first, all on `main`)

| PR | Commit | What |
|----|--------|------|
| pushed | `e09fa76` | **Reverted the ⌘K command palette.** Owner rejected the visible "Go to…" trigger on sight; without it the palette had no discoverable entry, so the whole feature was removed (components, `SiteControls`, unit + e2e tests). **Kept:** the theme switch, now rendered globally in `app/layout.tsx` (fixed top-right) so every page has a toggle. Design spec/plan retained as history. |
| pushed | `7336f20` | **CI fix:** pinned `undici` to `^7.28.0` via `pnpm.overrides` to clear new HIGH audit advisories (dev-only, transitive via `jsdom`). See Gotcha #1. **Kept** (independent of the palette). |
| pushed | `93f436b` | **⌘K command palette** (shipped, later reverted by `e09fa76`) — keyboard-first quick-nav + a visible "Go to…" pill over the 5 pages. Built on the existing Radix dialog; moved the theme switch into a global cluster. |
| #7 | `5c09318` | **Homepage scroll-reveals** — sections fade up on first scroll into view. Also bumped `vite`→8.0.16 (CI audit fix, see Gotchas). |
| #6 | `d8ed94a` | **Launcher breathes continuously** (superseded #4's stop-after-first-open, which the owner couldn't see in practice). |
| #5 | `520d707` | **Chat fixes:** rate limiter now **fails open** instead of returning 503 (was showing the generic "something went wrong" reply locally / on an Upstash blip); header `pr-8` so "Book a call" no longer overlaps the dialog ✕. |
| #4 | `0c8b3e1` | **Launcher breathing ring** (initial version). |
| #3 | `bf296ba` | **Motion design system foundation** — duration tokens, `ease-brand`, reduced-motion guard. |

---

# Architecture & conventions established (READ before adding features)

**Motion design system** lives in `app/globals.css`:
- Duration tokens: `--motion-fast/base/slow/deliberate` = 120/200/320/520ms (in `@theme`).
- Easing: `--ease-brand: cubic-bezier(0.2,0,0,1)` → generates the `ease-brand` utility.
- Ergonomic `@utility duration-fast/base/slow/deliberate` shims.
- `--animate-breathe` keyframe (launcher ring).
- **Reduced-motion guard** (Andy-Bell reset): `@media (prefers-reduced-motion: reduce)`
  clamps all transitions + animations to `0.01ms` and disables smooth scroll.
- **Convention:** author all motion with the `motion-safe:` prefix. New transforms must be
  `motion-safe:`-gated. Decorative transforms gate both transition + transform; functional
  ones (e.g. the theme-switch knob) gate only the transition so state still shows.

**`<Reveal>` component** (`components/motion/reveal.tsx`) — reusable scroll-reveal wrapper.
- 3-phase model: `initial` (visible) → IntersectionObserver hides off-screen blocks →
  reveals on enter. **Decides via the IO callback (post-layout), NOT a synchronous
  `getBoundingClientRect` at mount** (that mis-fires before images/fonts settle — this was
  a real bug, see Gotchas). Skips `display:none` blocks. Once-only; `opacity`+`transform`
  only (no CLS). Used on `app/page.tsx` to wrap the ~10 section blocks (hero excluded, LCP).

**Theme switch is global.** `app/layout.tsx` renders `<ThemeSwitch />` fixed top-right
(`fixed right-4 top-4 z-40 sm:right-6 sm:top-6`) on **every** page, so sub-pages have a theme
toggle too. (It used to live inside `ProfileCard`, homepage-only; the palette work moved it
global, and the revert kept that improvement by rendering it directly in the layout.)

**⌘K command palette — REMOVED (`e09fa76`).** It was designed, built (spec + plan still in
`docs/superpowers/`), shipped (`93f436b`), then reverted when the owner rejected the visible
trigger. **Lesson if revisited:** a ⌘K palette is a power-user pattern; for a recruiter/client
audience a plain **visible nav bar/header** reads better than a keyboard-first overlay (the
owner's reaction confirmed this). The `ui/dialog.tsx` reuse pattern from that work is still
documented in Gotcha #8.

**Specs** are in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`:
- `2026-06-15-phase2-motion-design-system-design.md`
- `2026-06-15-launcher-breathing-ring-design.md`
- `2026-06-16-scroll-reveals-design.md`
- `2026-06-17-command-palette-design.md` (+ `plans/2026-06-17-command-palette.md`) —
  **feature reverted; kept as history.**

---

# Key files

**⌘K command palette — REMOVED (`e09fa76`):**
- Deleted: `components/command-palette/*` (`nav-items.ts`, `filter.ts`, `command-palette.tsx`),
  `components/layout/site-controls.tsx`, and the palette tests
  (`tests/unit/{filter,command-palette,site-controls}.test.ts(x)`, `tests/e2e/command-palette.spec.ts`).
- `app/layout.tsx` — now renders a global `<ThemeSwitch />` (fixed top-right) instead of the
  removed `<SiteControls />`.
- `components/hero/profile-card.tsx` — no longer renders the theme switch (it's global now).
- Design docs retained: `docs/superpowers/specs/2026-06-17-command-palette-design.md`,
  `docs/superpowers/plans/2026-06-17-command-palette.md`.

**Deps (kept):**
- `package.json` / `pnpm-lock.yaml` — `vite` pinned to `8.0.16`; `pnpm.overrides` has
  `esbuild >=0.28.1` and **`undici ^7.28.0`** (CI audit fixes, see Gotcha #1).

**Prior session (motion / reveals / chat):**
- `app/globals.css` — motion tokens, `ease-brand`, `--animate-breathe`, reduced-motion guard.
- `components/motion/reveal.tsx` — scroll-reveal component.
- `app/page.tsx` — section blocks wrapped in `<Reveal>`.
- `components/chat/chat-launcher.tsx` — always-on breathing ring.
- `components/chat/chat-panel.tsx` — header `pr-8`; reduced-motion-aware auto-scroll
  (`scrollIntoView` honors `matchMedia` since CSS can't govern an explicit `behavior`).
- `app/api/chat/route.ts` — rate limiter **fails open** on outage (mirrors `usage.ts`).
- `components/{theme/theme-switch,sections/*,ui/{button,carousel},layout/back-to-home}.tsx`
  + `app/error.tsx` — retrofitted bare transitions to `motion-safe:`.
- `.gitignore` — `.superpowers/` (visual-brainstorm mockups + SDD scratch).

---

# Gotchas / lessons learned (these cost time — avoid re-learning)

1. **CI audit gate.** `.github/workflows/ci.yml` runs `pnpm audit --audit-level=high` and
   fails the build on any HIGH advisory. A new `vite` HIGH (GHSA-fx2h-pf6j-xcff, dev-only)
   blocked PR #7. **A pnpm `overrides` entry did NOT upgrade `vite`** (it's an auto-installed
   peer of vitest/@vitejs/plugin-react). Fix that worked: declare it as a **direct
   devDependency** (`"vite": "8.0.16"`). Watch for new advisories on future PRs.
   **2026-06-17 recurrence:** new HIGH `undici` advisories (dev-only, transitive via
   `jsdom`) blocked a push. Fixed with a `pnpm.overrides` entry (`7336f20`) — but **bound the
   range**: an unbounded `">=7.28.0"` pulls `undici` 8.x, which removes
   `lib/handler/wrap-handler.js` and breaks jsdom (every unit file errored). `"^7.28.0"`
   (stay in the 7.x line) clears the advisory and keeps jsdom working. (A stale
   `undici@8.5.0` may linger in the pnpm store — harmless; `pnpm audit` confirms no high.)
2. **Scroll-reveal timing.** Deciding in-view via a synchronous `getBoundingClientRect` at
   mount is WRONG — layout isn't settled (images/fonts), so below-fold blocks read as
   in-view and reveal early. Use the IO callback (post-layout). Already fixed in `<Reveal>`.
3. **axe + opacity-0.** A reveal's transient `opacity-0` makes axe report false-positive
   color-contrast failures (it blends text toward the page bg). The a11y e2e now emulates
   `reducedMotion: "reduce"` so axe assesses the truly-rendered (revealed) contrast.
4. **`react-hooks/set-state-in-effect` lint rule.** Mount-time, browser-only `setState`
   (reading matchMedia/sessionStorage/navigator) trips it; add `// eslint-disable-next-line
   react-hooks/set-state-in-effect` (pattern from `theme-switch.tsx`). Note: the rule
   sometimes doesn't fire (e.g. when the value isn't a literal or a DOM read precedes it) —
   then remove the now-unused directive (it warns).
5. **PR ordering trap.** PR #4 was merged with the early launcher version BEFORE the
   "always-breathe" update reached it; fixed via a follow-up (#6). Before merging, confirm
   the branch has all intended commits.
6. **Local chat.** For real AI answers locally, `.env.local` needs `GROQ_API_KEY` +
   `RATE_LIMIT_BYPASS=1`. With the #5 fail-open fix, a missing limiter now degrades to the
   static "book a call" reply instead of erroring.
7. **Run lint as a per-task gate, not just tests.** During the palette build, a task that
   ran only `pnpm test` committed code that failed `pnpm lint` (the `set-state-in-effect`
   rule above) — caught a task later. Run `pnpm lint` alongside `pnpm test` for every change.
8. **Reuse `ui/dialog.tsx` for overlays.** `DialogContent` gives Portal + Overlay + ✕ +
   focus-trap + Escape + scroll-lock + `motion-safe:` animations for free. Override
   position/padding via `className` — tailwind-merge resolves `top-*`/`translate-y-*`/`p-*`
   and treats `grid`→`flex` as the same group. (Pattern from the now-removed palette.)
9. **Validate UX direction with the owner BEFORE building, not after.** The ⌘K palette passed
   every gate and review, then was rejected on sight for its visible trigger — a full
   build→ship→revert round-trip. For owner-facing UI, get a quick look/approval of the actual
   on-screen treatment (the visual companion or a deployed preview) before the full TDD build.

---

# Open action items (owner's, carried over)

- ✅ **`main` pushed & CI-green** — palette `93f436b`, undici CI fix `7336f20`, palette revert
  `e09fa76`; `origin/main` in sync, Vercel deployed.
- **Rotate the Groq key** — precautionary (briefly sat in a committed template earlier,
  never pushed). After rotating, update Vercel + `.env.local`.
- `.env.example` is still locally modified (empty placeholder + "keep empty" warning) —
  safe to commit whenever. `Handoff.md` (this file) is untracked — keep local or commit as
  you like. `.superpowers/` (brainstorm mockups + SDD ledger/briefs/reports) is gitignored
  scratch — delete anytime.

---

# How we work (the loop that's been effective)

For each feature: **brainstorm (superpowers:brainstorming, with the visual companion for
visual decisions) → write + commit a spec in `docs/superpowers/specs/` → write + commit a
plan in `docs/superpowers/plans/` → TDD (red→green) → gates (lint · tsc · unit · build ·
e2e) → live verification → review → integrate.** The ⌘K palette used
**superpowers:subagent-driven-development** (fresh implementer subagent per task, spec+quality
review each, a whole-branch review, then the gate sweep) — it produced clean, green code that
was nonetheless reverted on owner taste. **Takeaway:** the loop guarantees correctness, not
desirability — confirm the UX direction early (see Gotcha #9).

Commit style: clean conventional messages, **no `Co-Authored-By` trailer** (owner pref).
Branch off `main`; squash to one commit per feature on `main`; delete the branch.

---

# Next move — the single next thing

The ⌘K command palette was built then **reverted** (`e09fa76`) — see above. One Phase-2
roadmap item remains:

1. **Conversion analytics** — privacy-light tracking of key actions (chat opened, message
   sent, "Book a call"/Calendly clicks) to measure the funnel. Decide a free, privacy-
   friendly approach (e.g. Vercel Analytics custom events) during brainstorm. This is
   non-visual, so it sidesteps the taste risk that sank the palette.

If site navigation is revisited later: the owner rejected the keyboard-first ⌘K palette —
consider a **plain visible nav bar/header** instead (clearer for a recruiter/client audience),
and validate the look early.

Start by invoking the brainstorming skill for conversion analytics, then follow the loop above.
