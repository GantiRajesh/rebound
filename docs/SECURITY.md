# Security & Privacy

## Current posture (MVP)

The strongest security property of this MVP is architectural: **there is no backend and no data leaves the device, apart from the forms a visitor chooses to submit.** No accounts, no database, no analytics. The only third-party script is Google AdSense, which runs on the general pages only (home, glossary, directory, about) and never receives anything a visitor types into the plan, checklist or forms. AdSense may set its own cookies, which the About page discloses. What can't be collected can't be breached.

In place:
- All user state (triage answers, calculator inputs, checklist progress, region choice) in namespaced localStorage; one-click erase on `/about`.
- Security headers shipped via `vercel.json` (CSP with `default-src 'self'` plus an allowlist for Google AdSense and Web3Forms, X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy). Replicate at whatever host you choose — see DEPLOYMENT.md.
- No external fonts/CDNs at runtime. The CSP in `vercel.json` has two deliberate exceptions: `connect-src` allows `https://api.web3forms.com` so the callback and partner forms can submit (if you switch form providers, update it), and the script/frame/img/connect directives allow Google's ad domains for AdSense (see ADSENSE.md). Google changes these domains over time, so check the browser console after deploy.
- The AdSense loader is on every page, but `AdSlot.jsx` only renders ad units on allowed routes. Keep Auto ads off in the AdSense console so Google cannot add ads to the protected pages.
- Directory/source links use `rel="noopener noreferrer"`.
- Dependencies: 3 runtime packages (react, react-dom, react-router-dom). Run `npm audit` before each deploy; update quarterly.

Residual risks and answers:
- **XSS via content files** — region JSON is rendered as text by React (auto-escaped); never render region content with `dangerouslySetInnerHTML`.
- **Wrong legal figures** — treated as a security-class risk here: governance fields (`source`, `lastChecked`, `reviewer`, `changeLog`) are mandatory and surfaced to users; quarterly recheck cadence in UPDATING.md.
- **Shared devices** — user data persists in the browser. The erase button exists; when accounts arrive, add an explicit "this is a shared computer" flow.

## Requirements for future phases (do not build these without them)

**Accounts:** established auth provider (Auth0/Clerk/Supabase/Cognito) — never hand-rolled password storage. MFA available. Region-appropriate privacy compliance reviewed per region (Australian Privacy Principles, UK/EU GDPR) — each on its own, not assumed inherited.

**Document vault** (termination letters, payslips = highly sensitive):
- Encryption at rest (per-user keys) and in transit; access-controlled object storage, never public buckets
- Auto-deletion on a defined, user-visible schedule; user-initiated hard delete
- Virus scanning on upload; strict file-type allowlist; size limits
- Audit log of every access
- Data residency per region

**AI companion:** grounded only in the platform's verified content (retrieval over region JSON), refuses freewheeling legal opinions; prompts and outputs never used to train third-party models; clear disclosure it's not a lawyer.

**Payments:** Stripe or equivalent — card data never touches your servers (SAQ-A scope).

**Community layer:** moderation tooling before launch, not after; separate storage from professional-advice features; report/block from day one.

## Operational hygiene

- Enable 2FA on the hosting account, domain registrar, and GitHub — these are the actual attack surface of a static site.
- Protect the `main` branch (require PR review) once more than one person can deploy.
- Set up Dependabot/`npm audit` alerts on the repo.
- Check https://securityheaders.com after every hosting change.
