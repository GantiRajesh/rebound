# Deployment Guide

The site builds to static files (`dist/`), so it can be hosted anywhere — free on all the platforms below. Pick one; Vercel or Netlify are the easiest.

## 0. Prerequisites (once)

1. Install Node.js 18+ from https://nodejs.org
2. Verify the project builds locally:
   ```bash
   cd rebound
   npm install
   npm run build     # should end with "✓ built" and create dist/
   npm run preview   # open the printed URL and click through every page
   ```
3. Put the project in a Git repository (recommended — enables auto-deploys):
   ```bash
   git init
   git add .
   git commit -m "Rebound MVP"
   ```
   Push to GitHub: create an empty repo at github.com, then
   ```bash
   git remote add origin https://github.com/<you>/rebound.git
   git push -u origin main
   ```

## Option A — Vercel (recommended)

Why: zero config (the included `vercel.json` handles SPA routing **and** security headers), free tier, automatic HTTPS, deploys on every git push.

1. Go to https://vercel.com → sign up with your GitHub account.
2. **Add New → Project** → import the `rebound` repo.
3. Vercel auto-detects Vite. Confirm: Build command `npm run build`, Output directory `dist`.
4. Click **Deploy**. ~1 minute later you have `https://rebound-<something>.vercel.app`.
5. Custom domain: Project → Settings → Domains → add `yourdomain.com`, then set the DNS records Vercel shows you at your registrar. HTTPS is automatic.

Every future `git push` to `main` redeploys automatically. Pull requests get preview URLs.

## Option B — Netlify

1. https://netlify.com → sign up with GitHub → **Add new site → Import an existing project**.
2. Pick the repo. Build command `npm run build`, publish directory `dist`.
3. Deploy. The included `public/_redirects` file handles SPA routing.
4. Add security headers: Site settings → create a `netlify.toml` in the repo root:
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
   ```
5. Custom domain: Domain settings → add domain → follow DNS instructions.

## Option C — Cloudflare Pages

1. https://pages.cloudflare.com → connect GitHub → select repo.
2. Framework preset: **Vite**. Build `npm run build`, output `dist`.
3. Deploy. For SPA routing Cloudflare respects the `_redirects` file already included.
4. Bonus: Cloudflare's CDN + free DDoS protection in front of your site.

## Option D — GitHub Pages

1. In `vite.config.js` add your repo name as base: `base: '/rebound/'` (skip if using a custom domain).
2. `npm run build`, then publish `dist/` with the `gh-pages` package or a GitHub Action.
3. Note: GitHub Pages lacks server rewrites; either use hash routing or the common 404.html copy trick. Prefer Options A–C — they're simpler for SPAs.

## Option E — Any traditional host (cPanel, S3, nginx…)

1. `npm run build`
2. Upload the **contents of `dist/`** to the web root.
3. Configure the server to serve `index.html` for unknown paths, e.g. nginx:
   ```nginx
   location / { try_files $uri $uri/ /index.html; }
   ```
4. Ensure HTTPS (Let's Encrypt is free) and add the security headers from `vercel.json` to server config.

## Post-deploy checklist

- [ ] Visit every route directly by URL (e.g. `/calculator`) — confirms SPA rewrites work
- [ ] Test the region switcher and confirm it persists on refresh
- [ ] Run both calculators against the official ones (Fair Work / GOV.UK) with 2–3 test cases
- [ ] Check https://securityheaders.com against your domain — aim for A
- [ ] Test on a phone
- [ ] Lighthouse audit in Chrome DevTools — the site should score 90+ across the board

## Rollbacks

Vercel/Netlify/Cloudflare all keep every previous deploy — one click restores any of them. This is the main reason to deploy via git rather than manual upload.
