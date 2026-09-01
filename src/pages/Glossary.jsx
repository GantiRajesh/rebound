import { useMemo, useState } from 'react';
import { useRegion } from '../context/RegionContext';
import AdSlot from '../components/AdSlot';

export default function Glossary() {
  const { region } = useRegion();
  const [q, setQ] = useState('');

  const terms = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = [...region.glossary].sort((a, b) => a.term.localeCompare(b.term));
    if (!needle) return list;
    return list.filter(
      (t) => t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle)
    );
  }, [region, q]);

  return (
    <>
      <h1 className="page-title">Glossary</h1>
      <p className="page-sub">
        Common redundancy terms for {region.fullName}, explained in plain English. Select a term to expand it.
      </p>

      <input
        className="search-input"
        type="search"
        placeholder="Search terms, for example: notice, settlement, PILON"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search glossary"
      />

      {terms.map((t, i) => (
        <span key={t.term}>
          <details className="acc">
            <summary>{t.term}</summary>
            <div>{t.definition}</div>
          </details>
          {/* Natural break after the first 6 terms; hidden while searching. */}
          {i === 5 && !q && <AdSlot slot="glossary-mid" />}
        </span>
      ))}
      {terms.length === 0 && <p>No matches. Try a shorter word.</p>}

      <AdSlot slot="glossary-footer" />
    </>
  );
}
