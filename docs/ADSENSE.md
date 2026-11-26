# Google AdSense setup

Publisher ID: `ca-pub-1140217384450648`

This is how AdSense is wired into LetusRestart, what is already done, and what you still
do in the AdSense console.

## What is in the code

| Piece | File | Notes |
|---|---|---|
| Account meta tag | `index.html` | `<meta name="google-adsense-account" ...>` in `<head>`. Used by Google to verify site ownership. |
| Loader script | `index.html` | `adsbygoogle.js?client=ca-pub-...`. Loads once for the whole site. |
| `ads.txt` | `public/ads.txt` | Served at `https://<your-domain>/ads.txt`. Authorises Google to sell your inventory. |
| Publisher ID | `src/config/monetisation.js` → `ads.clientId` | Used for every ad unit. |
| Master switch | `ads.enabled` | `false` removes every ad and placeholder logic. |
| Per-slot switch + unit ID | `ads.slots[name]` | `enabled` and `adUnitId`. |
| Rendering | `src/components/AdSlot.jsx` | Renders the `<ins>` element and calls `adsbygoogle.push({})` once it mounts. |
| Security header | `vercel.json` | The CSP allows Google's ad domains and `api.web3forms.com`. |

## Where ads appear

Allowed routes: `/` (home), `/glossary`, `/directory`, `/about`.

| Slot name | Page | Position |
|---|---|---|
| `home-mid` | Home | Between the chat teaser and the journey map |
| `home-footer` | Home | Bottom |
| `glossary-mid` | Glossary | After the first six terms |
| `glossary-footer` | Glossary | Below the list |
| `directory-grid` | Support directory | Card inside the grid |
| `directory-footer` | Support directory | Below the grid |
| `about-footer` | About | Bottom |

Never shown (enforced in `AdSlot.jsx` regardless of config): `/plan`, `/checklist`, `/reset`,
and the legacy `/triage` and `/calculator`. Ads are also not allowed on `/talk`, `/services`,
`/tools` or `/review`, because they are not on the allowed list.

## What you still do in AdSense

1. **Add and verify the site** (AdSense → Sites). The meta tag and `ads.txt` are already live
   once this is deployed.
2. **Turn Auto ads OFF** for the site (AdSense → Ads → By site → Edit). The loader script is
   on every page, so with Auto ads on, Google could place ads on the protected pages and
   bypass the rules above.
3. **Create seven display ad units** (AdSense → Ads → By ad unit → Display ads), one per slot
   in the table. Copy each unit's numeric slot ID.
4. **Paste the IDs** into `src/config/monetisation.js`:
   ```js
   'home-mid': { enabled: true, adUnitId: '1234567890' },
   ```
   Until a slot has an `adUnitId` it shows a labelled placeholder, not a blank gap.
5. Commit, push, let Vercel deploy.
6. **Wait for approval.** New sites are reviewed by Google, which can take days or weeks.
   Slots stay blank until the site is approved.
7. **UK and EEA visitors:** Google requires a consent message (a certified CMP) before it
   serves ads there. Set one up in AdSense → Privacy & messaging. It is configured in the
   console, and its script may need adding to the CSP in `vercel.json`.

## Checking it works after deploy

1. Open the live site, then `https://<your-domain>/ads.txt`. You should see the one-line
   Google entry.
2. Open the browser DevTools Console on `/`, `/glossary`, `/directory`, `/about`. There should be
   no "Refused to load" or "violates the Content Security Policy" errors mentioning Google.
   If there are, add the blocked domain to the matching directive in `vercel.json`. Google's
   ad domains change over time, so this is the first place to look if ads stop showing.
3. In Elements, each slot should contain an `<ins class="adsbygoogle">`. Once approved it gets
   a `data-ad-status="filled"` attribute. `unfilled` means Google had no ad to serve.
4. Open `/plan`, `/checklist`, `/reset`, `/talk`. No ads or placeholders should appear.
5. Ad blockers hide ads for the people who use them. Test in a clean browser profile.

## Turning ads off

- One placement: set that slot's `enabled: false`.
- Everything: set `ads.enabled: false`. Redeploy.
