import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { load, save } from '../lib/storage';

export default function Checklist() {
  const { region } = useRegion();
  const plan = load('plan');
  const tags = load('triage-tags', ['all']);
  const [checked, setChecked] = useState(() => load('checklist-progress', {}));

  const items = useMemo(
    () => region.checklist.filter((i) => i.tags.some((t) => tags.includes(t) || t === 'financial-stress')),
    [region, tags]
  );

  const phases = useMemo(() => [...new Set(items.map((i) => i.phase))], [items]);

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    save('checklist-progress', next);
  };

  const done = items.filter((i) => checked[i.id]).length;
  const pct = items.length ? done / items.length : 0;
  const C = 2 * Math.PI * 36;
  const flagged = tags.includes('suspicious');

  return (
    <>
      <h1 className="page-title">Checklist</h1>
      <p className="page-sub">
        Work through these in order of urgency, not all at once. Progress is saved on your device.
        {flagged && ' Based on your answers, items about challenging the dismissal are included. The deadline items matter most.'}
      </p>

      <div className="card">
        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 86 86" aria-hidden="true">
            <circle className="track" cx="43" cy="43" r="36" />
            <circle className="fill" cx="43" cy="43" r="36" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 43 43)" />
            <text x="43" y="50" textAnchor="middle">{Math.round(pct * 100)}%</text>
          </svg>
          <div>
            <strong style={{ fontSize: '1.05rem' }}>{done} of {items.length} complete</strong>
            <br />
            <span style={{ color: 'var(--soft)', fontSize: '.88rem' }}>
              {done === items.length && items.length
                ? 'All items complete.'
                : done > 0
                ? 'Good progress.'
                : plan?.done
                ? 'Start with the first 48 hours.'
                : 'Complete the plan first and this list adjusts to your situation.'}
            </span>
            {!plan?.done && (
              <>
                <br />
                <Link className="btn small" style={{ marginTop: 10 }} to="/plan">Start my plan</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {phases.map((phase) => (
        <section key={phase}>
          <div className="phase-title">{phase}</div>
          {items
            .filter((i) => i.phase === phase)
            .map((i) => (
              <label key={i.id} className={`check-item${checked[i.id] ? ' done' : ''}`}>
                <input type="checkbox" checked={Boolean(checked[i.id])} onChange={() => toggle(i.id)} />
                <span className="check-text">{i.text}</span>
                {i.urgent && <span className="chip urgent tag">deadline</span>}
              </label>
            ))}
        </section>
      ))}
    </>
  );
}
