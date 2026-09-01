# Update Guide: making changes safely

The complete "which file do I edit" map lives in **docs/OWNERS-MANUAL.md § 3**. This file covers the workflow around any change.

## Golden rules

1. Content changes are data edits (`src/regions/*.json`, `src/data/partners.json`, `src/config/*.js`). Only new capabilities are code edits.
2. Any change to a legal figure must also bump that region's `governance.lastChecked` and add a `changeLog` entry. The date is shown to users as a trust signal.
3. Never edit `dist/` (generated) and never commit `.env` or `node_modules` (the `.gitignore` blocks them).

## The workflow

```bash
git checkout -b my-change     # work on a branch
# ... edit ...
npm run build && npm run preview   # must build clean; click through affected pages
git add . && git commit -m "what changed and why"
git push                      # open a PR; Vercel gives it a preview URL
# merge → production deploys automatically; rollback is one click in Vercel
```

Tag releases that change legal figures (`git tag rules-uk-2027-04 && git push --tags`) so you can always answer "what did the site say on date X".

## Pre-deploy test pass

- All routes load in both countries and both themes: `/`, `/plan`, `/tools`, `/checklist`, `/glossary`, `/directory`, `/services`, `/review`, `/talk`, `/reset`, `/about`.
- Plan spot-checks: AU 4y/40/$1,500 → 3 wk notice, 8 wk redundancy, $12,000. AU small business → no redundancy pay. UK 10y/45/£800 → cap message, 12.5 wk × £751. UK 1.5y → does not qualify.
- Tax spot-checks: AU $100k/10y/under 60 → $81,608 tax-free, tax $5,885. UK £45k/higher rate → £6,000 tax.
- A "suspicious" wizard path shows the deadline warning and adds deadline items to the checklist.
- Callback form completes; ad placeholders appear only on home/glossary/directory/about.

## Recurring maintenance

Quarterly: recheck each region's `governance.sourceUrl`, bump `lastChecked`. Every 1 July: AU `payoutTax` figures (indexed annually). Every April: UK weekly pay cap. Monthly: reconcile referrals/leads, clear handled form submissions, glance at `npm audit`.

## Adding a new region, in brief

Copy the closest region file, replace every value, register it in `src/regions/index.js`, remove it from `COMING_SOON`, extend `detectRegion()`. If neither calculation model fits, add a model branch in `src/lib/entitlements.js` behind the same output shape. Get local professional review before setting it live; never ship `reviewer: "UNREVIEWED"`.
