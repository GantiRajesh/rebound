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
 *  3. Before AdSense is connected, shows an honest labelled placeholder
 *     (when showPlaceholders is true).
 *
 * variant="panel" (default): full-width dashed panel.
 * variant="card": native-sized card for use inside grids (directory).
 */
export default function AdSlot({ slot, variant = 'panel' }) {
  const { pathname } = useLocation();

  // Per-slot kill switch: the future "I don't want this one any more" option.
  const cfg = monetisation.ads.slots[slot];
  if (!cfg || !cfg.enabled) return null;

  if (AD_PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) return null;
  const allowed = AD_ALLOWED_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)));
  if (!allowed) return null;

  const cls = variant === 'card' ? 'ad-panel ad-card' : 'ad-panel';

  if (!monetisation.ads.enabled) {
    if (!monetisation.ads.showPlaceholders) return null;
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

  // Live AdSense rendering: the <ins> element is picked up by the AdSense
  // script added to index.html when ads.enabled is switched on.
  return (
    <div className={cls} role="complementary" aria-label="Advertisement">
      <div className="ad-tag">
        <span>Advertisement</span>
        <span>Google AdSense</span>
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: variant === 'card' ? 180 : 110 }}
        data-ad-client={monetisation.ads.clientId}
        data-ad-slot={cfg.adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
