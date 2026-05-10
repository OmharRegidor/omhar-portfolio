// Case studies inlined as TypeScript template literals.
// Why: Next.js 16's SSG worker on Vercel uses a different process.cwd()
// than `next build`, so fs.readFileSync(content/projects/<slug>.mdx) fails
// at SSG time and the routes pre-render as 404. Static imports (this file)
// are bundled by webpack at compile time and available everywhere.
//
// To edit a case study, edit the template literal below.
// Frontmatter (--- title / date ---) and Markdown body work identically
// to a .mdx file; the body is parsed by gray-matter + compileMDX in
// app/projects/[slug]/page.tsx.

export const caseStudies: Record<string, string> = {
  "noxa-loyalty": `---
title: Noxa Loyalty
date: 2026-05-10
---

# Noxa Loyalty

A customer loyalty rewards platform built across two surfaces — a web application and a native iOS mobile app — with shared backend services for membership, rewards, and tier management.

## What it does

- **Digital loyalty membership** — customers carry their membership card on phone, no physical card needed.
- **Tier-based rewards** — points accrual, redemptions, and unlock thresholds tied to spend or activity.
- **Multi-business onboarding** — each business configures its own rewards program; customers carry one identity across participating merchants.

## Surfaces

- **Web app** — the storefront-facing experience for businesses managing their loyalty programs and customer data.
- **iOS mobile app** — the end-customer experience for tracking points, redeeming rewards, and discovering merchants.

## Links

- **Website:** [noxaloyalty.com](https://www.noxaloyalty.com/)
- **iOS App on App Store:** [Noxa Loyalty](https://apps.apple.com/ph/app/noxaloyalty/id6760211721)
`,

  sweetblooms: `---
title: SweetBlooms
date: 2026-05-10
---

# SweetBlooms

A florist e-commerce platform with a connected multi-role internal operations system. The customer-facing storefront and the internal back-office tools share a single source of truth — orders flow seamlessly from website to fulfillment to manufacturing.

## What it does

- **Customer storefront** — browse arrangements, place orders, schedule delivery, track status.
- **Internal admin system** — full operational dashboard connected to the storefront, used by the SweetBlooms team to run day-to-day fulfillment.

## Role-based access

The internal system separates responsibilities by role:

- **Admin** — full system access: user management, configuration, reporting.
- **Staff** — order fulfillment, customer service, delivery coordination.
- **Manufacturing** — production-side workflow tied directly to incoming orders.

Each role sees only the views and actions relevant to their job, while orders move through the system on a single timeline.

## Link

- **Website:** [sweetblooms.ph](https://www.sweetblooms.ph/)
`,
};
