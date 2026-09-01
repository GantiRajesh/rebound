import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { monetisation } from '../config/monetisation';
import { referralUrl, trackReferralClick } from '../lib/referral';
import AdSlot from '../components/AdSlot';

export default function Directory() {
  const { region } = useRegion();
  const [cat, setCat] = useState('All');

  const categories = useMemo(
    () => ['All', ...new Set(region.directory.map((d) => d.category))],
    [region]
  );

  const entries = useMemo(() => {
    const list = region.directory.filter((d) => cat === 'All' || d.category === cat);
    // Non-negotiable: free entries always render before partner placements.
    return [...list].sort((a, b) => Number(a.partner) - Number(b.partner));
  }, [region, cat]);

  return (
    <>
      <h1 className="page-title">Support services</h1>
      <p className="page-sub">
        Verified services for legal advice, financial help, wellbeing and finding work in{' '}
        {region.fullName}. Free unless marked otherwise.
      </p>

      <div className="filter-row" role="tablist" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-chip${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}
            role="tab"
            aria-selected={cat === c}
          >
            {c}
          </button>
        ))}
      </div>

      {monetisation.sponsoredDirectory.enabled && (
        <p className="disclosure">
          Entries tagged "{monetisation.sponsoredDirectory.badgeText}" have paid for placement. Free
          services always come first and never get removed to make room for partners.
        </p>
      )}

      <div className="dir-grid">
        {entries.map((d, i) => (
          <span key={d.name} style={{ display: 'contents' }}>
            <div className="dir-card">
              <div className="cat">{d.category}</div>
              <h3>
                {d.name} {d.free && <span className="chip free">Free</span>}{' '}
                {d.partner && monetisation.sponsoredDirectory.enabled && (
                  <span className="chip partner">{monetisation.sponsoredDirectory.badgeText}</span>
                )}
              </h3>
              <p>{d.description}</p>
              <div className="dir-links">
                {/* Partner links carry referral tracking; free services never do. */}
                <a
                  href={d.partner ? referralUrl(d.url, 'directory') : d.url}
                  target="_blank"
                  rel={d.partner ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
                  onClick={d.partner ? () => trackReferralClick(d.name, 'directory') : undefined}
                >
                  Visit website
                </a>
                {d.phone && <span style={{ color: 'var(--soft)' }}>Phone {d.phone}</span>}
              </div>
            </div>
            {/* Native ad card, one per grid, after the fourth service. */}
            {i === 3 && <AdSlot slot="directory-grid" variant="card" />}
          </span>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 6 }}>Prefer to be contacted?</h2>
        <p style={{ color: 'var(--soft)', marginBottom: 12 }}>
          If you would like the right support with additional details, fill in a short form and we
          will call you.
        </p>
        <Link className="btn" to="/talk">Request a callback</Link>
      </div>

      <AdSlot slot="directory-footer" />
    </>
  );
}
