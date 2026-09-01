# Security & Privacy

## Current posture (MVP)

The strongest security property of this MVP is architectural: **there is no backend and no data leaves the device.** No accounts, no database, no cookies, no third-party scripts, no analytics. What can't be collected can't be breached.

In place:
- All user state (triage answers, calculator inputs, checklist progress, region choice) in namespaced localStorage; one-click erase on `/about`.
- Security headers shipped via `vercel.json` (CSP with `default-src 'self'`, X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy). Replicate at whatever host you choose — see DEPLOYMENT.md.
- No external fonts/CDNs at runtime — the CSP can stay strict.
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
