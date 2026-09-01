import { monetisation } from '../config/monetisation';
import { load, save } from './storage';

/**
 * Tracked referral links.
 * Appends ?ref=<yourTag>&src=<placement> to a partner's URL so their
 * analytics attribute every visitor to you. This is the audit trail that
 * backs up pay-per-lead or sponsored-placement invoicing.
 *
 * Also keeps a per-device click count (localStorage) as a secondary,
 * privacy-safe signal. Real attribution lives in the URL parameters and
 * the partner's analytics; reconcile monthly against your invoice.
 */
export function referralUrl(url, src) {
  if (!url) return url;
  if (!monetisation.referral?.enabled) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('ref', monetisation.referral.refTag);
    u.searchParams.set('src', src);
    if (monetisation.referral.utm) {
      u.searchParams.set('utm_source', monetisation.referral.refTag);
      u.searchParams.set('utm_medium', 'referral');
      u.searchParams.set('utm_campaign', src);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Per-device click log. Not global analytics; a local secondary record. */
export function trackReferralClick(partnerId, src) {
  const clicks = load('referral-clicks', {});
  const key = `${partnerId}:${src}`;
  clicks[key] = (clicks[key] || 0) + 1;
  save('referral-clicks', clicks);
}
