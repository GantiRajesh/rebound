# Monetisation Framework

Design constraint enforced in code: **core rights information and the calculator are always free and ad-free.** `AdSlot` returns null on `/triage`, `/calculator`, `/checklist`, `/reset` regardless of configuration. Revenue never touches that layer.

Everything below is pre-wired in `src/config/monetisation.js` — flip flags as each stream becomes viable.

## Stream 1 — Display advertising (earliest viable)

Where allowed: `/` (home), `/glossary`, `/directory`, `/about`. Seven placements exist, each at a
natural break point so the content flow is never interrupted: home-mid, home-footer, glossary-mid
(after the first 6 terms, hidden while searching), glossary-footer, directory-grid (a native card
inside the services grid), directory-footer, and about-footer.

Control is two-level in `src/config/monetisation.js`: `ads.enabled` is the master switch, and every
slot has its own `enabled` flag, so any single placement can be removed later without touching
component code. The plan wizard, checklist and reset pages remain ad-free by code enforcement.

Enable:
1. Get an AdSense account and approval for your domain (needs the site live with real traffic; expect days–weeks).
2. In `monetisation.js`: `ads.enabled = true`, set `clientId` and per-page `slots` IDs.
3. Add the AdSense loader to `index.html` per Google's snippet, and extend the CSP header in `vercel.json` to allow Google's ad domains (`pagead2.googlesyndication.com` etc. — Google documents the exact list).
4. Redeploy. Verify no ads appear on protected routes.

Realistic expectation: meaningful only at scale (roughly $2–10 RPM for this niche). Treat as pocket money that validates traffic, not the business.

## Stream 2 — Affiliate / referral commissions

Enable `affiliates.enabled = true` — this activates the disclosure banner component text. Then add partner entries to region `directory` arrays with your referral URL. Rules already enforced: free entries sort first; the disclosure text is honest and prominent.

Vetting line (from the brief): resume services, job boards, coaches, financial counsellors — yes. Predatory lenders or anything exploiting financial distress — never.

## Stream 4 — Sponsored directory placements

`sponsoredDirectory.enabled = true`, then mark paid entries `"partner": true` in the region JSON. They get a visible "Partner" badge and always render **after** free entries — both behaviours are code-enforced in `Directory.jsx`.

## Stream 3 — Freemium subscription (needs backend)

The flag and feature list exist (`premium.features`: document vault, AI companion, letter generator, career tools). When you build these, gate them on `premium.enabled` + an entitlement check from your auth provider. Suggested stack when ready: Stripe Billing + a small API. Keep the free tier exactly as-is — it's the trust engine that feeds everything else.

## Streams 5–9 (marketplace, B2B SaaS, white-label, insights, grants)

These are business motions more than code, but the architecture anticipates them:
- **Marketplace (5):** grows out of the directory — add booking/referral links per professional, take a fee. The `partner` flag and category system are the seed.
- **B2B compliance SaaS (6):** sibling product sharing the region rulesets (`src/regions/*.json` is the reusable asset — consultation rules, notice obligations, audit trails all derive from the same data). Highest-margin stream; build once consumer credibility exists.
- **White-label (7):** `brand.js` + region data separation means a white-label build is: swap brand.js, hide/show features, deploy under their domain.
- **Insights (8):** only ever aggregate + disclosed. Requires accounts/analytics first; revisit at that phase — current MVP deliberately collects nothing.
- **Grants (9):** the public-good framing (free rights info, sourced and reviewed) is genuine — document reach (visits per region, calculator uses via privacy-respecting aggregate analytics like Plausible) to support applications.

## Suggested sequencing

1. **Now → traction:** Streams 1 + 2 (near-zero build cost).
2. **Real user base:** Stream 4, then Stream 3 once there's something worth paying for (vault, letters).
3. **Credibility established:** Streams 5–7 as the serious revenue engine; 9 in parallel throughout.

## The line that never moves

Before enabling anything, re-read the non-negotiables in README. If a revenue idea requires paywalling rights information, showing ads at a vulnerable moment, or burying free services — the answer is no, and the code is written to make yes difficult.
