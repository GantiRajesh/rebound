# Rebound

Clear guidance from job loss to your next role. A calm, plain-English platform that tells anyone who has lost a job what happened, what they are legally owed where they live, and what to do next, in the right order.

## Quick start

```bash
npm install
npm run dev        # local site at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

Requires Node.js 18+. The whole site runs with no backend; the optional AI review backend lives in `api/` and activates only when deployed with environment variables (see `.env.example`).

## What's in the platform

| Feature | Route | Notes |
|---|---|---|
| Home | `/` | Hero, one-tap chat starter, six-step journey map |
| Plan wizard | `/plan` | Situation triage, genuineness check, entitlements, deadline warning, budget runway, next steps. Every outcome links to official government sources. |
| Calculators | `/tools` | Owed vs offered · Key dates timeline · Runway · Payout tax and in-hand |
| Checklist | `/checklist` | Phased (48h / week / month / forward), personalised by plan answers, deadline tags |
| Glossary | `/glossary` | Searchable plain-English terms per region |
| Support directory | `/directory` | Verified free services first; category filters; callback banner |
| Services | `/services` | Paid offerings (Stripe payment links), partner network, partner application |
| AI document review | `/review` | Paid, passcode-gated, session-only document analysis + email drafting |
| Request a callback | `/talk` | One-question-per-screen form, consent step, delivered via form endpoint |
| Wellbeing | `/reset` | Breathing exercise, grounded reassurance, crisis contacts |
| About & privacy | `/about` | Promises, data erase button, disclaimers |

Regions: **Australia** and **United Kingdom**, each a single sourced and dated data file. Country picker scales to any number of regions. Light and dark themes, fully responsive, professional solid-colour design.

Monetisation, all config-driven and all optional: 7 ad slots with per-slot switches, tracked partner referrals, paid services via Stripe payment links, the AI review, sponsored placements, and affiliate disclosure. The plan, checklist, calculators and rights information are always free and ad-free, enforced in code.

## Documentation

Start with **`docs/OWNERS-MANUAL.md`**: how to use the site, how to change any text or component, how to deploy, maintain and fix. The rest:

- `docs/GOING-LIVE.md` — domain, hosting, forms, payments, AdSense, AI review backend, referrals
- `docs/ARCHITECTURE.md` — how it's built and how it expands
- `docs/UPDATING.md` — safe-change workflow and pre-deploy tests
- `docs/MONETISATION.md` — the revenue playbook
- `docs/SECURITY.md` — security posture and future requirements
- `docs/ROADMAP.md` — the path to the full career-transition platform

## Before public launch (non-negotiable)

1. Have the AU and UK rulesets reviewed by qualified local professionals and set `governance.reviewer` in `src/regions/*.json`. They ship marked `UNREVIEWED`.
2. Spot-check the calculators against the official Fair Work and GOV.UK calculators on the live domain.
3. Run the checklist at the end of `docs/GOING-LIVE.md`.
