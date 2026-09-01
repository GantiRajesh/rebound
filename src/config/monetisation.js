/**
 * MONETISATION FRAMEWORK CONFIG
 * ------------------------------------------------------------------
 * Non-negotiable: core rights info and the plan wizard stay free and
 * ad-free. That rule is ENFORCED in code. AdSlot refuses to render on
 * protected routes regardless of flags.
 *
 * AD CONTROL, TWO LEVELS:
 *  - ads.enabled            master switch (false = no ads anywhere)
 *  - ads.slots[name].enabled  per-placement switch. Don't want an ad
 *    in the glossary any more? Set 'glossary-mid'.enabled = false and
 *    redeploy. No component code changes, the layout closes the gap
 *    automatically.
 */

// Routes where ads must NEVER appear. The vulnerable-moment surfaces.
// (/triage and /calculator are legacy redirects into /plan; kept for safety.)
export const AD_PROTECTED_ROUTES = ['/plan', '/triage', '/calculator', '/checklist', '/reset'];

// Routes where ads MAY appear once enabled.
export const AD_ALLOWED_ROUTES = ['/', '/glossary', '/directory', '/about'];

export const monetisation = {
  ads: {
    enabled: false,             // MASTER SWITCH for Stream 1 (Google AdSense)
    showPlaceholders: true,     // Show labelled empty panels before AdSense is connected,
                                // so the layout is honest about where ads will live.
    provider: 'adsense',
    clientId: '',               // e.g. 'ca-pub-XXXXXXXXXXXXXXXX'

    // Every placement on the site. enabled: false removes that one placement.
    // adUnitId: the slot ID from AdSense → Ads → By ad unit.
    slots: {
      'home-mid':         { enabled: true, adUnitId: '' },  // between chat teaser and journey map
      'home-footer':      { enabled: true, adUnitId: '' },  // bottom of home page
      'glossary-mid':     { enabled: true, adUnitId: '' },  // after the first 6 glossary terms
      'glossary-footer':  { enabled: true, adUnitId: '' },  // below the glossary list
      'directory-grid':   { enabled: true, adUnitId: '' },  // native card inside the services grid
      'directory-footer': { enabled: true, adUnitId: '' },  // below the services grid
      'about-footer':     { enabled: true, adUnitId: '' }   // bottom of the about page
    }
  },
  affiliates: {
    enabled: false,             // Stream 2: disclosed referral links
    disclosureText:
      'Some links on this page are partner links. If you use them, Rebound may earn a referral fee at no cost to you. Partners never influence the guidance we give.'
  },

  /**
   * REFERRAL TRACKING (backs up pay-per-lead / sponsored invoicing).
   * When enabled, links to partner websites carry ?ref=<refTag>&src=<placement>
   * (plus UTM parameters if `utm` is true), so the partner's analytics
   * attribute every visitor to you. Reconcile monthly when invoicing.
   */
  referral: {
    enabled: true,
    refTag: 'rebound',
    utm: true
  },
  sponsoredDirectory: {
    enabled: false,             // Stream 4: paid "Partner" placements
    badgeText: 'Partner'        // Free entries always render first. Enforced in Directory.jsx.
  },
  premium: {
    enabled: false,             // Stream 3: freemium tier (future)
    features: ['document-vault', 'ai-companion', 'letter-generator', 'career-tools']
  },

  /**
   * FORMS (callback requests + partner applications) → your email inbox.
   *
   * Option A, Web3Forms (recommended: free, no account):
   *   1. Go to https://web3forms.com and enter the email address where you
   *      want to receive responses. Your access key arrives by email.
   *   2. Paste it into `accessKey` below. Leave `endpoint` as is.
   *   3. Redeploy. Every submission now arrives as an email to that address.
   *
   * Option B, Formspree (dashboard + email): create a form at formspree.io,
   *   set `endpoint` to your form URL (https://formspree.io/f/xxxx) and
   *   leave `accessKey` empty.
   *
   * Until one is configured, submissions are stored on the visitor's device
   * and the UI says so honestly.
   */
  forms: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: '',
    callbackNotice: 'We will call you within one business day.'
  },

  /**
   * PAID SERVICES (Stream 5: professional services via partners).
   * Each service gets a Stripe Payment Link (stripe.com → Payment Links,
   * no code needed; money goes to your Stripe account, then your bank).
   * Paste the link into `paymentLink` and set `enabled: true`.
   * The plan, checklist and rights information remain free regardless.
   */
  /**
   * AI DOCUMENT REVIEW (paid, passcode-gated).
   * The visitor uploads their HR documents; the AI produces a decision-ready
   * summary (what looks right, what to validate, possible extra entitlements)
   * and can draft an email. Session-only: documents are processed in memory
   * and never stored.
   *
   * Access: after payment (Stripe Payment Link below), your webhook emails
   * the buyer a one-person access code and a link to /review. The code is
   * bound to their email and expires after `durationMinutes`.
   * Backend: see the api/ folder and docs/GOING-LIVE.md Part 4e.
   * While `demoMode` is true (no backend yet), the code DEMO-2026 unlocks a
   * clearly-labelled sample analysis.
   */
  aiReview: {
    enabled: true,
    demoMode: true,
    demoCode: 'DEMO-2026',
    durationMinutes: 60,
    validateEndpoint: '/api/validate-code',
    reviewEndpoint: '/api/review',
    paymentLink: ''
  },

  services: [
    {
      id: 'ai-review',
      name: 'AI document review',
      price: '$49',
      description: 'Upload everything HR sent you. AI reads it and returns a decision-ready summary: what looks right, what to question, and possible extra entitlements. Access code emailed after payment; valid for one hour; nothing is stored.',
      paymentLink: '',
      enabled: true,
      internalLink: '/review'
    },
    {
      id: 'doc-review',
      name: 'Document review',
      price: '$79',
      description: 'A qualified professional reviews your termination letter, deed or settlement agreement and sends written feedback within 2 business days.',
      paymentLink: '',
      enabled: true
    },
    {
      id: 'consult-30',
      name: '30-minute consultation',
      price: '$120',
      description: 'A private call with an employment law professional in your country to talk through your situation and options.',
      paymentLink: '',
      enabled: true
    },
    {
      id: 'cv-rewrite',
      name: 'Resume rewrite',
      price: '$149',
      description: 'A professional writer rebuilds your resume and LinkedIn profile for the roles you want next.',
      paymentLink: '',
      enabled: true
    },
    {
      id: 'coaching',
      name: 'Career coaching session',
      price: '$99',
      description: 'A one-hour session with a career coach: your story, your search plan, and interview preparation.',
      paymentLink: '',
      enabled: true
    }
  ]
};
