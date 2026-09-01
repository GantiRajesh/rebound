# Going Live: domain, hosting, deployment, and getting paid

Everything below flows money and control directly to you. Your registrar account, your hosting account, your Google AdSense account, your bank. No middlemen.

Total cost to launch: about $15/year for the domain. Hosting is free.

---

## Part 1. Buy a domain (15 minutes, ~$10–15/year)

1. Pick a registrar. Recommended: **Cloudflare Registrar** (at-cost pricing, no upsells) at https://www.cloudflare.com/products/registrar/. Namecheap or GoDaddy also work.
2. Create an account with your own email. Turn on two-factor authentication immediately.
3. Search for your name. Try `rebound.com` variants: `getrebound.com`, `reboundhq.com`, `rebound.app`, or a country domain like `rebound.com.au`. Short and typeable beats clever.
4. Buy it. Decline every upsell (email hosting, "protection" packages). Free WHOIS privacy is standard; make sure it's on.
5. Done. You now own the address. Leave the DNS settings alone until Part 3.

## Part 2. Hosting (20 minutes, free)

You don't need to rent a server. The site builds to static files, and Vercel hosts those free with HTTPS, a global CDN, and automatic deploys.

1. Create a GitHub account at https://github.com (this stores your code and drives deployments). Enable 2FA.
2. Create a new empty repository called `rebound` (private is fine).
3. On your computer, in the unzipped `rebound` folder:
   ```bash
   git init
   git add .
   git commit -m "Rebound v1"
   git remote add origin https://github.com/YOUR-USERNAME/rebound.git
   git push -u origin main
   ```
   (Install git from https://git-scm.com if needed.)
4. Go to https://vercel.com and sign up **with your GitHub account**.
5. Click **Add New → Project**, import the `rebound` repository.
6. Vercel detects Vite automatically. Confirm: build command `npm run build`, output directory `dist`. Click **Deploy**.
7. Two minutes later your site is live at `https://rebound-something.vercel.app`. Click through every page to check it.

## Part 3. Connect your domain (10 minutes)

1. In Vercel: your project → **Settings → Domains** → type your domain → **Add**.
2. Vercel shows you one or two DNS records (usually an `A` record `76.76.21.21` and a `CNAME` for `www`).
3. In your registrar's DNS page, add exactly those records. Delete any conflicting defaults.
4. Wait 5–30 minutes. Vercel shows a green check and issues the HTTPS certificate automatically.
5. Visit `https://yourdomain.com`. You're live.

**Updating the site from now on:** edit files → `git add . && git commit -m "what changed" && git push`. Vercel redeploys automatically in about a minute. Every previous version stays one click away in Vercel if you ever need to roll back.

## Part 4. Turn on Google AdSense (money goes to YOUR bank)

AdSense pays you directly: you connect your own bank account inside Google's dashboard, and Google transfers your balance monthly once it passes the payment threshold (e.g. $100 AUD/USD). Nobody else touches the money.

1. **Apply.** Go to https://adsense.google.com, sign in with your own Google account, add your domain, and submit for review. Approval usually takes a few days to two weeks and requires the site to be live with real content (it already is: glossary, guides, directory).
2. **Verify ownership.** AdSense gives you a code snippet like:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
   Paste it into `index.html` inside `<head>`, commit, push. Vercel redeploys and Google can verify.
3. **Create the ads.txt file** (required by Google). Create `public/ads.txt` containing one line:
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
   (Your pub ID, from AdSense → Account → Account information.)
4. **Create ad units.** In AdSense → Ads → By ad unit → Display ad. Create one per placement (home, glossary, directory) and copy each unit's slot ID.
5. **Wire them into the site.** Open `src/config/monetisation.js`:
   ```js
   ads: {
     enabled: true,                          // MASTER switch: flip this
     showPlaceholders: true,
     provider: 'adsense',
     clientId: 'ca-pub-XXXXXXXXXXXXXXXX',    // your ID
     slots: {
       'home-mid':         { enabled: true, adUnitId: '1234567890' },
       'home-footer':      { enabled: true, adUnitId: '2345678901' },
       'glossary-mid':     { enabled: true, adUnitId: '3456789012' },
       'glossary-footer':  { enabled: true, adUnitId: '4567890123' },
       'directory-grid':   { enabled: true, adUnitId: '5678901234' },
       'directory-footer': { enabled: true, adUnitId: '6789012345' },
       'about-footer':     { enabled: true, adUnitId: '7890123456' }
     }
   }
   ```
   **Turning ads off later:** set `enabled: false` on any single slot to remove just that
   placement (the layout closes the gap), or set the master `ads.enabled = false` to remove
   them all. Redeploy with `git push`. No other code changes needed.
6. **Loosen the security header for Google's domains.** In `vercel.json`, extend the `Content-Security-Policy` value to allow AdSense (Google documents the exact list; at minimum add `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com` to `script-src`, `frame-src` and `img-src`).
7. Commit, push, wait for the deploy, and check: ads appear only on home, glossary, directory and about. The plan, checklist and breathe pages stay clean; that's enforced in code.
8. **Get paid.** AdSense → Payments → add your name, address, tax info, and bank account. Google deposits directly every month you're over the threshold.

Realistic expectation: ads earn little until traffic grows. Treat it as validation, not income, at first.

## Part 4b. Connect the callback and partner forms (5 minutes, free)

The "Request a callback" form and the partner application need somewhere to send
submissions. Both arrive as emails to you. Two no-backend options:

**Option A: Web3Forms (recommended; free, no account, unlimited-friendly).**
1. Go to https://web3forms.com, enter the email address where you want responses, and click
   Create Access Key. The key arrives in that inbox.
2. Paste it into `src/config/monetisation.js` → `forms.accessKey`. Leave `forms.endpoint`
   as `https://api.web3forms.com/submit`.
3. Redeploy, submit a test callback on the live site, and check your inbox. Each email
   contains every answer plus a `kind` field (callback request or partner application).
4. Optional: in the Web3Forms dashboard you can add spam filtering, redirect rules, or
   extra recipients. Keep the access key out of screenshots; anyone with it can send
   email to your address (but cannot read anything).

**Option B: Formspree (dashboard + email).**
Create a form at https://formspree.io, paste its URL (`https://formspree.io/f/xxxx`) into
`forms.endpoint`, and leave `accessKey` empty. Submissions arrive by email and are also
listed in the Formspree dashboard. Free tier: 50 submissions/month.

Until one is configured, the site stores submissions on the visitor's device and says so
honestly, so you never silently lose an enquiry.

Handling the data responsibly: callback requests contain names and phone numbers. Delete them
once handled, and honour any deletion request. This is the first personal data the platform
collects, so review docs/SECURITY.md before launch.

## Part 4c. Take payments for additional services (Stripe, money to your bank)

Each paid service on the Services page uses a Stripe Payment Link. No code, no card data on
your site, payouts straight to your bank.

1. Create an account at https://stripe.com and complete verification (your identity, your bank).
2. In the Stripe dashboard: **Payment Links → New**. Create one product per service
   (Document review, 30-minute consultation, Resume rewrite, Career coaching session) with your
   price and currency.
3. Copy each link into `src/config/monetisation.js` → `services[n].paymentLink`.
4. Redeploy. The "Available soon" buttons become "Pay and book" automatically.
5. Fulfilment: Stripe emails you on every purchase. Connect the buyer with the right partner,
   or use Stripe's built-in receipt + your callback flow for scheduling.
6. To retire a service later, set its `enabled: false`. To change prices, edit the Payment Link
   in Stripe and the display price in the config.

## Part 4d. Managing partners (solicitors, recruiters, counsellors)

Partners live in `src/data/partners.json`. The Services page shows entries with
`"status": "live"` for the visitor's region, and professionals apply through the stepped form
on the same page (delivered via the same form endpoint as Part 4b).

To onboard a partner: vet them, agree terms, add an entry with their name, type, regions,
services and `referralUrl`, set `"status": "live"`, and redeploy. To pause one, change the
status to anything else. No code changes at any point.

**Monetising referrals (e.g. a legal firm), four models:**

1. **Pay-per-lead (recommended first).** The client fills your callback form, you introduce the
   consented lead to the firm, and the firm pays a fixed fee per qualified lead. Because the lead
   flows through you, your records are the source of truth. Invoice monthly.
2. **Sponsored placement.** A flat monthly fee for a featured "Partner" listing. You are selling
   advertising, not referrals, which avoids most legal-referral-fee rules. Set the partner's
   entry live and invoice them.
3. **Resale with margin.** The client pays you on the Services page (your Stripe link), the firm
   delivers at an agreed wholesale rate, you keep the difference. You are the merchant; have
   terms of service in place.
4. **Percentage fee-sharing.** A cut of the firm's fees. Avoid: fee-sharing with non-lawyers is
   restricted or prohibited in many jurisdictions and is hard to audit.

**Referral tracking is built in.** Links to partner websites automatically carry
`?ref=rebound&src=<placement>` plus UTM parameters (configure in
`src/config/monetisation.js` → `referral`), so the partner's own analytics attribute every
visitor to you. Use it as the backup audit trail behind models 1 and 2; your callback records
remain the primary count. A per-device click log is also kept locally.

**Compliance:** referral arrangements involving law firms are regulated (disclosure required in
Australia; allowed in most areas but banned for personal injury in England & Wales). The
disclosure banner ships with the partner section and must stay visible. Have each partner
agreement checked against their regulator's rules before signing.

## Part 4e. AI document review (paid, passcode-gated)

The service: a user pays, receives a one-person access code by email with a link, unlocks a
session, uploads their HR documents, and gets a decision-ready analysis plus a draft email.
Documents are processed in memory only and never stored. The full backend ships in the `api/`
folder and deploys automatically on Vercel.

1. **Secrets.** In Vercel → Project → Settings → Environment Variables set:
   `CODE_SECRET` (any long random string), `ANTHROPIC_API_KEY` (from console.anthropic.com),
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` (resend.com, free tier),
   `SITE_URL` (https://yourdomain.com), `REVIEW_DURATION_MINUTES` (e.g. 60).
2. **Payment.** Create a Stripe Payment Link for the AI review price and paste it into
   `monetisation.js` → `aiReview.paymentLink` (and the `ai-review` service entry).
3. **Webhook.** Stripe → Developers → Webhooks → endpoint `https://yourdomain.com/api/issue-code`
   for `checkout.session.completed`. Run `npm install stripe` once. On each purchase the webhook
   issues a signed code bound to the buyer's email and Resend emails it with the unlock link.
4. **Go live.** Set `aiReview.demoMode = false` in `monetisation.js` and redeploy.

How the codes work (no database needed): each code embeds its own expiry and an HMAC signature
over the buyer's email, so it cannot be forged, transferred to another email, or extended. The
site validates via `/api/validate-code`; the analysis endpoint `/api/review` re-verifies on
every request. While `demoMode` is true, the code `DEMO-2026` shows a labelled sample analysis
so you can test the whole flow before connecting anything.

Privacy promise, kept in code: `/api/review` holds documents in memory for the single request,
sends text to the Claude API, returns the analysis, and keeps nothing. Do not add logging of
document content, and say exactly this in your privacy page.

## Part 5. The other money switches (all direct to you)

- **Affiliate links (now).** Join programs yourself (e.g. resume services, job boards; each has its own signup, and each pays your bank or PayPal directly). Add your referral URL as a directory entry in `src/regions/au.json` / `uk.json`, and set `affiliates.enabled = true` in `monetisation.js` to activate the disclosure text. Never predatory lenders.
- **Sponsored directory placements (when traffic exists).** You invoice the partner directly (your invoice, your bank). Then set `sponsoredDirectory.enabled = true` and mark their entry `"partner": true`. The code forces free services to stay listed first.
- **Premium tier (later).** When the document vault or letter generator gets built, use **Stripe** (https://stripe.com): you open the account, payouts go straight to your bank, and card data never touches your site. The `premium` flag in `monetisation.js` is the gate.
- **B2B / white-label (later).** Direct contracts you invoice yourself. Nothing to configure until then.

The one rule that never changes: the plan wizard, checklist, and rights information stay free and ad-free. The code enforces it, keep it that way.

## Part 6. Final pre-launch checklist

- [ ] Both rulesets reviewed by a local employment professional and `governance.reviewer` updated in `au.json` / `uk.json` (do not skip this)
- [ ] Every route loads by direct URL on the live domain
- [ ] Calculator spot-checked against the Fair Work and GOV.UK official calculators
- [ ] Country picker, theme switch, and mobile menu tested on a phone
- [ ] https://securityheaders.com grade A on your domain
- [ ] ads.txt reachable at `yourdomain.com/ads.txt` (after Part 4)
- [ ] 2FA on: registrar, GitHub, Vercel, Google, AdSense
- [ ] A privacy line you can stand behind is on the About page (it is, keep it true)
