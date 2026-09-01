# Architecture

## Principles

1. **Jurisdiction is data, not code.** Every legal rule, tax figure, deadline, glossary term, checklist item and support service lives in a per-country JSON file with a shared schema (`src/regions/`). The wizard, calculators, checklist, glossary and directory are generic components that render whatever the active region contains. Adding a country that fits an existing calculation model requires zero component changes.
2. **Every element is independent.** Pages never import each other. Each feature owns its route and its own storage keys, and reads shared state only through narrow interfaces: `RegionContext` (which country), `ThemeContext` (light/dark), `lib/storage` (on-device persistence). Any feature can be rewritten or removed without touching the others.
3. **Config over code for everything an owner changes.** Brand and both theme palettes → `src/config/brand.js`. Every revenue switch → `src/config/monetisation.js`. Partners → `src/data/partners.json`. See docs/OWNERS-MANUAL.md for the full change map.
4. **Non-negotiables are enforced in code.** AdSlot refuses to render on protected routes; free directory entries always sort before partners; only partner-flagged links carry referral tracking; the AI review backend re-verifies the access code on every request.
5. **Static-first, backend where it must be.** The core site is static files: nothing to breach, free to host, fast everywhere. The only backend is three small serverless functions for the paid AI review, and they are stateless (signed, self-expiring access codes; documents held in memory per-request only).

## Layout

```
rebound/
├── index.html · vite.config.js · vercel.json · public/_redirects · public/
├── .env.example · .gitignore
├── api/                        # serverless functions (AI review only)
│   ├── _code.js                #   HMAC access codes: issue + verify, stateless
│   ├── validate-code.js        #   POST {code,email} → ok/expiry
│   ├── issue-code.js           #   Stripe webhook → code → Resend email
│   └── review.js               #   auth'd document analysis via Claude API
├── docs/                       # OWNERS-MANUAL, GOING-LIVE, this file, etc.
└── src/
    ├── main.jsx · App.jsx      # entry, routes
    ├── config/
    │   ├── brand.js            # name, tagline, light+dark palettes
    │   └── monetisation.js     # ads, services, aiReview, forms, referral, partners flags
    ├── regions/
    │   ├── index.js            # registry, COMING_SOON, auto-detection
    │   └── au.json · uk.json   # rules, payoutTax, deadline, checklist, glossary, directory
    ├── data/partners.json      # partner network (types + entries)
    ├── lib/
    │   ├── entitlements.js     # calculation engine (service-bands / age-multiplier models)
    │   ├── storage.js          # namespaced localStorage wrapper (one-call erase)
    │   ├── submit.js           # form POST with honest local fallback
    │   └── referral.js         # tracked partner links (+ per-device click log)
    ├── context/                # RegionContext, ThemeContext
    ├── components/             # Layout, RegionPicker, StepForm, AdSlot
    ├── pages/                  # Home, Plan, Tools, Checklist, Glossary,
    │                           # Directory, Services, Review, Talk, Reset, About
    └── styles/global.css       # all styling, driven by CSS variables
```

## Data flow

Region JSON → `RegionContext` → every page. `lib/entitlements.js` is the one shared "smart" module: two calculation models (`service-bands` AU-style, `age-multiplier` UK-style) behind one interface; a structurally different regime (US at-will, EU civil law) becomes a third model branch, and the UI never changes. The plan wizard writes its answers to storage; the checklist, calculators and home journey read them to personalise themselves.

## The paid AI review, end to end

Buyer pays via Stripe Payment Link → Stripe webhook hits `api/issue-code.js` → a code is issued that *is* its own record (expiry + email-hash + HMAC signature; no database) → Resend emails code + unlock link → visitor unlocks `/review` (validated by `api/validate-code.js`) → uploads documents → `api/review.js` re-verifies the code, sends text to the Claude API, returns the structured analysis, retains nothing. Demo mode (config) lets the whole flow be tested with a fixed code and sample output before any of this is connected.

## Expansion seams (to-be state)

| Future feature | Where it attaches |
|---|---|
| Accounts & saved progress | Swap `lib/storage.js` internals for an API-backed store; add auth provider around `App` |
| Document vault | New route + storage service; requirements in docs/SECURITY.md |
| Grounded AI companion | The region JSON content model is already retrieval-ready |
| Reminders/timeline | Dates already captured by the key-dates calculator |
| Community, marketplace, B2B sibling, white-label | New route bundles; region data, brand config and monetisation flags are the shared substrate |
| Multi-language | Wrap page copy in an i18n layer; jurisdiction and language are already separated |

## Tech choices

React 18 + Vite, react-router-dom, no CSS framework (one variable-driven stylesheet), no state library, no runtime third-party services in the front end. Three runtime dependencies total; `api/` additionally uses `stripe` (webhook verification) when the review goes live.
