import { useState } from 'react';
import { useRegion } from '../context/RegionContext';
import { COMING_SOON } from '../regions';

/**
 * Scalable country picker: a glass modal with search, live regions, and a
 * greyed-out "on the roadmap" list. Adding a 20th country changes nothing here.
 */
export default function RegionPicker({ onClose }) {
  const { region, regionId, allRegions, setRegion } = useRegion();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();

  const active = allRegions.filter((r) => !needle || r.fullName.toLowerCase().includes(needle));
  const coming = COMING_SOON.filter((r) => !needle || r.fullName.toLowerCase().includes(needle));

  const choose = (id) => {
    setRegion(id);
    onClose();
  };

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your country"
    >
      <div className="modal">
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <h3>Where are you?</h3>
        <p className="note">
          Rules, money and services change per country, so this matters. We guessed from your
          browser. Change it any time.
        </p>
        <input
          className="search-input"
          type="search"
          placeholder="Search countries…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {active.map((r) => (
          <button
            key={r.id}
            className={`region-row${regionId === r.id ? ' active' : ''}`}
            onClick={() => choose(r.id)}
          >
            <span className="rflag">{r.flag}</span>
            <span>
              {r.fullName}
              <span className="rsub">Rules checked {r.governance.lastChecked}</span>
            </span>
            {regionId === r.id && <span className="tick">✓</span>}
          </button>
        ))}
        {coming.length > 0 && <p className="note" style={{ margin: '12px 0 6px' }}>On the roadmap</p>}
        {coming.map((r) => (
          <button key={r.id} className="region-row" disabled>
            <span className="rflag">{r.flag}</span>
            <span>{r.fullName}</span>
            <span className="soon">Soon</span>
          </button>
        ))}
      </div>
    </div>
  );
}
