import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { monetisation, AD_PROTECTED_ROUTES, AD_ALLOWED_ROUTES } from '../config/monetisation';

/**
 * AdSlot. The only way ads enter the app.
 * Hard rules, enforced in code:
 *  1. NEVER renders on protected routes (plan/checklist/reset), even if a
 *     developer places one there by mistake.
 *  2. Master switch AND per-slot switch must both allow it. Turning any
 *     placement off in src/config/monetisation.js removes it cleanly;
 *     the layout closes the gap automatically.
 *  3. Until a real AdSense client ID and ad unit ID are both set for the
 *     slot, shows an honest labelled placeholder (when showPlaceholders is
 *     true) instead of an empty or broken ad.
 *
 * The AdSense loader script lives in index.html. In a single-page app each
 * <ins> must also be activated with adsbygoogle.push({}) once it is mounted,
 * which is done in the effect below.
 *
 * variant="panel" (default): full-width dashed panel.
 * variant="card": native-sized card for use inside grids (directory).
 */
export default function AdSlot({ slot, variant = 'panel' }) {
  const { pathname } = useLocation();
  const insRef = useRef(null);

  const cfg = monetisation.ads.slots[slot];
  const { enabled, clientId, showPlaceholders } = monetisation.ads;

  // Per-slot kill switch: the future "I don't want this one any more" option.
  const slotOn = Boolean(cfg && cfg.enabled);
  const onProtected = AD_PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const onAllowed = AD_ALLOWED_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)));
  const routeOk = slotOn && !onProtected && onAllowed;

  const live = routeOk && enabled && Boolean(clientId) && Boolean(cfg.adUnitId);

  useEffect(() => {
    if (!live || !insRef.current) return;
    // Guard against double-pushing the same <ins> (React StrictMode, re-renders).
    if (insRef.current.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Blocked by an ad blocker or the script has not loaded; fail quietly.
    }
  }, [live, pathname]);

  if (!routeOk) return null;

  const cls = variant === 'card' ? 'ad-panel ad-card' : 'ad-panel';

  if (!live) {
    if (!showPlaceholders) return null;
    return (
      <div className={cls} role="complementary" aria-label="Advertisement">
        <div className="ad-tag">
          <span>Advertisement</span>
          <span>Google AdSense</span>
        </div>
        <div className="ad-space">Ad slot "{slot}"</div>
      </div>
    );
  }

  return (
    <div className={cls} role="complementary" aria-label="Advertisement" data-ad-slot-name={slot}>
      <div className="ad-tag">
        <span>Advertisement</span>
        <span>Google AdSense</span>
      </div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: variant === 'card' ? 180 : 110 }}
        data-ad-client={clientId}
        data-ad-slot={cfg.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
