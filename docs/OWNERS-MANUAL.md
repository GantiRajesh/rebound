# Rebound Owner's Manual

Everything you need to run this website: how to use it, how to change any text or component, how to deploy, how to maintain, and how to fix problems. Written for an owner, not a developer; where a step needs code, it tells you exactly which file and line to touch.

---

## 1. How the site works, in one minute

The site is a React application that builds into plain static files. There is no database and no server for the core experience: all legal rules, text, services and partners live in small data and config files, and everything a visitor enters stays in their own browser. One optional backend (the `api/` folder) powers the paid AI document review; it activates only when you deploy with the environment variables in `.env.example`.

The golden rule of this codebase: **content is data, capability is code.** Almost every change you will ever want to make is an edit to a `.json` file or a config file, followed by a redeploy. You rarely touch components.

## 2. Running and using it

```bash
npm install     # once
npm run dev     # opens http://localhost:5173, live-reloads as you edit
npm run build   # produces dist/ for hosting
npm run preview # test the built version locally
```

Visitor flow: home → plan wizard (or calculators) → checklist → support/services. The country picker (header) switches every rule, figure and service on the site. The footer has the light/dark switch and a callback link.

## 3. The change map: "I want to change…"

Every owner-editable thing on the site, and exactly where it lives. After any change: `npm run build`, click through the affected page, then `git push` to deploy.

### Branding and appearance
| Change | File | What to edit |
|---|---|---|
| Site name, tagline | `src/config/brand.js` | `name`, `tagline` |
| Every colour, light or dark theme | `src/config/brand.js` | `themes.light` / `themes.dark` values |
| Corner radius, page width | `src/config/brand.js` | `radius`, `maxWidth` |
| Browser tab title, description | `index.html` | `<title>`, meta description |
| Any styling rule | `src/styles/global.css` | Sections are labelled per feature; all colours are variables |

### Text and content (per country)
| Change | File | What to edit |
|---|---|---|
| Legal figures: notice bands, redundancy bands, caps, small-business rule | `src/regions/au.json` / `uk.json` → `rules` | Also bump `governance.lastChecked` and add a `changeLog` entry |
| Payout tax figures (updated every July for AU) | region file → `rules.payoutTax` | `taxFreeBase`, `taxFreePerYear`, bands; bump `lastChecked` |
| Claim deadline days/body/link | region file → `deadline` | |
| Checklist items | region file → `checklist` | Add/edit/remove entries; `tags` control personalisation; `urgent: true` adds the deadline chip |
| Glossary terms | region file → `glossary` | |
| Free support services | region file → `directory` | `free: true` entries always list first |
| Add a whole new country | copy `au.json` → new file, edit everything, register in `src/regions/index.js`, remove from `COMING_SOON`, extend `detectRegion()` | Never launch a region with `reviewer: "UNREVIEWED"` |
| "Coming soon" country list | `src/regions/index.js` → `COMING_SOON` | |

### Page copy (shared, not per-country)
| Change | File |
|---|---|
| Home hero, chat starter, journey cards, stats | `src/pages/Home.jsx` (plain strings near the top) |
| Wizard questions, options, verdicts | `src/pages/Plan.jsx` → `buildSteps()` and `verdictFor()` |
| Calculator labels and explanations | `src/pages/Tools.jsx` |
| Callback form questions | `src/pages/Talk.jsx` → `steps` array |
| Partner application questions | `src/pages/Services.jsx` → `applySteps` |
| AI review page copy and sample analysis | `src/pages/Review.jsx` |
| Wellbeing page | `src/pages/Reset.jsx` |
| About & privacy page | `src/pages/About.jsx` |
| Navigation labels | `src/components/Layout.jsx` → `NAV` |
| Footer text | `src/components/Layout.jsx` (footer block) |

### Money (every switch in one file: `src/config/monetisation.js`)
| Change | What to edit |
|---|---|
| Turn all ads on/off | `ads.enabled` |
| Turn one ad placement off | `ads.slots['name'].enabled = false` (7 slots, all listed with their page position) |
| Connect AdSense | `ads.clientId` + per-slot `adUnitId`, plus the script tag in `index.html` and `public/ads.txt` (GOING-LIVE Part 4) |
| Paid services: names, prices, descriptions | `services[]` |
| Connect a payment | paste the Stripe Payment Link into `services[n].paymentLink` |
| Retire a paid service | `services[n].enabled = false` |
| AI review: price, session length, demo mode | `aiReview` (set `demoMode: false` at go-live) |
| Callback/partner form delivery | `forms.endpoint` (Formspree URL, GOING-LIVE Part 4b) |
| Referral tracking tag or off-switch | `referral` |
| Affiliate disclosure on/off and wording | `affiliates` |
| Sponsored placement badge | `sponsoredDirectory` |

### Partners
| Change | File |
|---|---|
| Add/pause a partner (solicitor, recruiter, counsellor…) | `src/data/partners.json`: add entry with `referralUrl`, `model`, regions; `status: "live"` shows it, anything else hides it |
| Partner categories | same file → `types` |

## 4. How to deploy

Full walkthrough in `docs/GOING-LIVE.md`. The short version: push the code to a private GitHub repo, import it into Vercel (free), and point your domain's DNS at Vercel. From then on every `git push` deploys automatically in about a minute, and every previous version stays one click away for rollback. The `api/` folder deploys as serverless functions automatically; they stay dormant until you add the environment variables from `.env.example` in Vercel's settings.

Order of activation (each step is independent and optional): domain → hosting → form endpoint (callbacks work) → AdSense (ads pay) → Stripe links (services sell) → AI review env vars + webhook (review sells) → partners go live.

## 5. How to maintain

**Quarterly (calendar reminder):** visit each region's `governance.sourceUrl`, confirm the figures, bump `lastChecked` even if nothing changed. Every 1 July, update the AU `payoutTax` figures (they index annually). Every April, check the UK weekly cap.

**Monthly:** reconcile referral and lead invoices against your callback records; check Stripe and AdSense dashboards; delete handled callback submissions from your form service (they contain personal data).

**When dependencies age:** `npm audit` shows known vulnerabilities; `npm update` applies safe updates. The site has three runtime dependencies (react, react-dom, react-router-dom), so this is rarely eventful. Enable Dependabot on the GitHub repo and it will open update PRs for you.

**Backups:** the git repository is the backup. Tag releases that change legal figures (`git tag rules-au-2027-07`) so you can always prove what the site said on a given date.

**Testing before any deploy:**
```bash
npm run build && npm run preview
```
Click through all routes in both countries and both themes. Spot-check: AU plan 4y/40/$1,500 → 3 weeks notice, 8 weeks redundancy; UK 10y/45/£800 → cap message, 12.5 weeks; AU tax 100k/10y under 60 → $81,608 tax-free.

## 6. How to fix (troubleshooting)

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails after an edit | Broken JSON (missing comma/quote) | Run `npm run build`; the error names the file and line. JSON must not have trailing commas. |
| Blank page after deploy | JS error in an edited component | Open browser dev tools (F12) → Console; the first red error names the file. Roll back in Vercel while you fix. |
| A page 404s when opened by URL | SPA rewrites missing on a new host | `vercel.json` handles Vercel; other hosts need the `_redirects`/nginx rule (GOING-LIVE Option E) |
| Wrong entitlement numbers | Region data edited incorrectly | Compare `rules` against the official source; check bands don't overlap; `maxYears: null` must be last |
| Ads not appearing | Master or slot switch off, AdSense not connected, or route protected | Check `ads.enabled`, the slot's `enabled`, `clientId`; ads never show on plan/checklist/reset by design |
| Callback submissions not arriving | `forms.endpoint` empty or wrong | Set the Formspree URL; until set, submissions stay on the visitor's device by design and the UI says so |
| "Pay and book" says Available soon | `paymentLink` empty | Paste the Stripe Payment Link |
| Access code rejected | Wrong email (codes are email-bound), expired, or `CODE_SECRET` changed | Reissue the code; changing `CODE_SECRET` voids all old codes |
| AI analysis fails | Missing `ANTHROPIC_API_KEY` or endpoint error | Vercel → Functions → Logs shows the error; nothing the user uploaded is retained on failure |
| Emails with codes not sending | Webhook or Resend misconfigured | Stripe → Webhooks shows delivery attempts and errors; check `RESEND_API_KEY` and the `from` domain is verified in Resend |
| Site looks unstyled | CSS variable renamed without updating both `brand.js` and `global.css` | Variable names must match between the two |

## 7. Security: what's in place and what to keep

In place: no tracking or analytics on answers; all visitor state on-device with a one-click erase; strict security headers via `vercel.json` (CSP, HSTS, nosniff, frame-deny); three runtime dependencies; access codes are HMAC-signed, email-bound and expiring; the AI review holds documents in memory only; secrets live only in hosting environment variables; `.gitignore` blocks `.env` from ever being committed.

Keep it that way: never put an API key in front-end code (anything under `src/` ships to the browser); never log document content in `api/review.js`; keep 2FA on GitHub, Vercel, Stripe, Google and your registrar; re-run https://securityheaders.com after hosting changes; when you eventually add accounts or a document vault, read `docs/SECURITY.md` first, it lists the requirements.

And the one that isn't technical: the legal rulesets ship marked `UNREVIEWED`. Have a qualified local professional review each region and record their name in `governance.reviewer` before you put this in front of the public.
