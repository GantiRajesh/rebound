import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { calculateNotice, calculateRedundancy } from '../lib/entitlements';
import { load, save } from '../lib/storage';

/**
 * CALCULATORS HUB. Four standalone tools:
 *  1. Owed vs offered: compare the legal minimum with the employer's offer.
 *  2. Key dates: a personal timeline from the day you were told.
 *  3. Runway: how long the money lasts.
 *  4. Tax and in-hand: what the payout is worth after tax.
 * All region rules and tax figures come from the region data files.
 */

const TABS = [
  { id: 'owed', label: 'Owed vs offered' },
  { id: 'dates', label: 'Key dates' },
  { id: 'runway', label: 'Runway' },
  { id: 'tax', label: 'Tax & in-hand' }
];

const money = (region, n) => region.currencySymbol + Math.round(n).toLocaleString();
const fmtDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const daysFrom = (d) => Math.ceil((d - new Date()) / 86400000);

/* ---------- 1. Owed vs offered ---------- */
function OwedVsOffered({ region }) {
  const planAnswers = load('plan', { answers: {} }).answers || {};
  const [f, setF] = useState({
    years: planAnswers.years ?? '',
    age: planAnswers.age ?? '',
    pay: planAnswers.pay ?? '',
    smallBiz: Boolean(planAnswers.smallBiz),
    offered: ''
  });
  const [out, setOut] = useState(null);

  const run = () => {
    const years = parseFloat(f.years) || 0;
    const age = parseInt(f.age, 10) || 0;
    const pay = parseFloat(f.pay) || 0;
    const offered = parseFloat(f.offered) || 0;
    const nw = calculateNotice(region.rules, years, age);
    const red = calculateRedundancy(region.rules, { yearsOfService: years, age, weeklyPay: pay, smallBusiness: f.smallBiz });
    const minimum = nw * pay + (red.qualifies ? red.redundancyPay : 0);
    setOut({ minimum, offered, diff: offered - minimum, nw, red, pay });
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 4 }}>What am I owed, and how does the offer compare?</h2>
      <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 14 }}>
        Enter your details and the total your employer has offered (notice plus redundancy pay,
        before tax, excluding unused leave).
      </p>
      <div className="tool-grid">
        <div><label>Years of service</label><input type="number" min="0" step="0.5" value={f.years} onChange={(e) => setF({ ...f, years: e.target.value })} placeholder="4.5" /></div>
        <div><label>Your age</label><input type="number" min="15" max="100" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} placeholder="42" /></div>
        <div><label>Weekly base pay ({region.currency})</label><input type="number" min="0" value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value })} placeholder="1500" /></div>
        <div><label>Offered total ({region.currency})</label><input type="number" min="0" value={f.offered} onChange={(e) => setF({ ...f, offered: e.target.value })} placeholder="18000" /></div>
      </div>
      {region.rules.smallBusinessExemption.applies && (
        <label className="tool-check">
          <input type="checkbox" checked={f.smallBiz} onChange={(e) => setF({ ...f, smallBiz: e.target.checked })} />
          The business has fewer than {region.rules.smallBusinessExemption.threshold} employees
        </label>
      )}
      <button className="btn" style={{ marginTop: 12 }} onClick={run}>Compare</button>

      {out && (
        <div style={{ marginTop: 16 }}>
          <div className="money-grid">
            <div className="money-cell"><div className="v">{money(region, out.minimum)}</div><div className="k">legal minimum (notice + redundancy)</div></div>
            <div className="money-cell"><div className="v">{money(region, out.offered)}</div><div className="k">offered</div></div>
            <div className="money-cell"><div className="v" style={{ color: out.diff >= 0 ? 'var(--green)' : 'var(--red)' }}>{out.diff >= 0 ? '+' : '−'}{money(region, Math.abs(out.diff))}</div><div className="k">{out.diff >= 0 ? 'above minimum' : 'below minimum'}</div></div>
          </div>
          <p style={{ fontSize: '.9rem' }}>
            {out.diff >= 0
              ? 'The offer meets or exceeds the legal minimum. Check that unused leave is paid on top, and that the written breakdown matches these numbers.'
              : 'The offer appears to be below the legal minimum. Ask your employer for a written breakdown, and if the gap remains, get free advice before signing anything.'}
          </p>
          {!out.red.qualifies && out.red.messages.map((m) => (
            <p key={m} style={{ color: 'var(--amber)', fontSize: '.85rem', marginTop: 6 }}>{m}</p>
          ))}
          <p className="fineprint">
            Minimum based on{' '}
            <a href={region.governance.sourceUrl} target="_blank" rel="noopener noreferrer">{region.governance.source}</a>,
            checked {region.governance.lastChecked}. Awards and contracts can only add to it.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- 2. Key dates ---------- */
function KeyDates({ region }) {
  const [told, setTold] = useState('');
  const [finalDay, setFinalDay] = useState('');
  const [rows, setRows] = useState(null);

  const run = () => {
    if (!told) return;
    const toldD = new Date(told + 'T12:00:00');
    const dismissD = finalDay ? new Date(finalDay + 'T12:00:00') : toldD;
    const deadline = new Date(dismissD);
    deadline.setDate(deadline.getDate() + region.deadline.days);

    const list = [
      { date: toldD, label: 'You were told', note: 'Ask for the decision and the reason in writing, and start saving documents.' },
      { date: toldD, label: `Register for ${region.terminology.unemploymentBenefit}`, note: 'Do this as early as possible. Claims take time to start paying and payouts can add waiting periods.', link: region.benefitUrl },
      ...(finalDay ? [{ date: dismissD, label: 'Final day of employment', note: 'Your final pay, including unused leave, is usually paid within days of this date. Check your contract or award.' }] : []),
      { date: deadline, label: `Deadline to lodge a claim with ${region.deadline.body}`, note: 'Only relevant if you believe the dismissal was unfair or not a genuine redundancy. Missing it usually ends the option.', link: region.deadline.url, urgent: true }
    ].sort((a, b) => a.date - b.date);
    setRows(list);
    save('key-dates', { told, finalDay });
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 4 }}>Key dates from the day you heard the news</h2>
      <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 14 }}>
        Enter when you were told, and your final working day if you know it. Dates stay on your device.
      </p>
      <div className="tool-grid">
        <div><label>Date you were told</label><input type="date" value={told} onChange={(e) => setTold(e.target.value)} /></div>
        <div><label>Final working day (optional)</label><input type="date" value={finalDay} onChange={(e) => setFinalDay(e.target.value)} /></div>
      </div>
      <button className="btn" style={{ marginTop: 12 }} onClick={run} disabled={!told}>Build my timeline</button>

      {rows && (
        <div style={{ marginTop: 16 }}>
          {rows.map((r) => {
            const d = daysFrom(r.date);
            return (
              <div className="date-row" key={r.label}>
                <div className="date-when">
                  <strong>{fmtDate(r.date)}</strong>
                  <span className={`chip ${r.urgent ? 'urgent' : 'free'}`}>
                    {d > 0 ? `in ${d} day${d === 1 ? '' : 's'}` : d === 0 ? 'today' : `${Math.abs(d)} day${d === -1 ? '' : 's'} ago`}
                  </span>
                </div>
                <div>
                  <strong>{r.label}</strong>
                  <p style={{ color: 'var(--soft)', fontSize: '.85rem' }}>
                    {r.note}{' '}
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noopener noreferrer">Official page</a>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          <p className="fineprint">
            The claim deadline assumes dismissal on {finalDay ? 'your final day' : 'the day you were told'}.
            {region.id === 'uk' && ' In the UK the tribunal limit is generally 3 months less one day from dismissal; Acas early conciliation affects the count.'} Confirm your exact deadline with{' '}
            <a href={region.deadline.url} target="_blank" rel="noopener noreferrer">{region.deadline.body}</a>.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- 3. Runway ---------- */
function Runway({ region }) {
  const [f, setF] = useState({ received: '', savings: '', monthly: '' });
  const received = parseFloat(f.received) || 0;
  const savings = parseFloat(f.savings) || 0;
  const monthly = parseFloat(f.monthly) || 0;
  const months = monthly > 0 ? (received + savings) / monthly : 0;
  const runOut = new Date();
  runOut.setDate(runOut.getDate() + Math.round(months * 30.44));

  return (
    <div className="card runway">
      <h2 style={{ marginBottom: 4 }}>How long will it last?</h2>
      <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 14 }}>
        What you have been paid, plus savings, divided by your monthly essentials.
      </p>
      <div className="rw-inputs">
        <div><label>Amount received ({region.currency})</label><input type="number" inputMode="decimal" placeholder="25000" value={f.received} onChange={(e) => setF({ ...f, received: e.target.value })} /></div>
        <div><label>Savings ({region.currency})</label><input type="number" inputMode="decimal" placeholder="10000" value={f.savings} onChange={(e) => setF({ ...f, savings: e.target.value })} /></div>
        <div><label>Monthly essentials ({region.currency})</label><input type="number" inputMode="decimal" placeholder="4000" value={f.monthly} onChange={(e) => setF({ ...f, monthly: e.target.value })} /></div>
      </div>
      <div className="rw-out">
        <div className="rw-months">{monthly > 0 ? `${Math.round(months * 10) / 10} months` : '···'}</div>
        <div className="rw-bar"><div style={{ width: `${Math.min((months / 12) * 100, 100)}%` }} /></div>
        <div className="rw-note">
          {monthly > 0 ? (
            <>
              At this rate the money lasts until about <strong>{fmtDate(runOut)}</strong>.{' '}
              {months >= 6
                ? 'A solid buffer. You have time to be selective.'
                : months >= 3
                ? 'A reasonable buffer for a considered search.'
                : (
                  <>
                    A short runway. Register for{' '}
                    <a href={region.benefitUrl} target="_blank" rel="noopener noreferrer">{region.terminology.unemploymentBenefit}</a>{' '}
                    now and see Money help in Support.
                  </>
                )}
            </>
          ) : 'Enter your figures to see the result.'}
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. Tax & in-hand ---------- */
function TaxInHand({ region }) {
  const t = region.rules.payoutTax;
  const [f, setF] = useState({ payout: '', years: '', over: false, band: 0 });
  const [out, setOut] = useState(null);

  const run = () => {
    const payout = parseFloat(f.payout) || 0;
    let taxFree = 0;
    let rate = 0;
    let rateLabel = '';
    if (t.model === 'au-etp') {
      const years = Math.floor(parseFloat(f.years) || 0);
      taxFree = Math.min(payout, t.taxFreeBase + t.taxFreePerYear * years);
      rate = f.over ? t.rateOverPreservation : t.rateUnderPreservation;
      rateLabel = `${Math.round(rate * 100)}% ETP rate (${f.over ? '60 or over' : 'under 60'})`;
    } else {
      taxFree = Math.min(payout, t.taxFreeCap);
      rate = t.bands[f.band].rate;
      rateLabel = `${Math.round(rate * 100)}% (${t.bands[f.band].label})`;
    }
    const taxable = Math.max(payout - taxFree, 0);
    const tax = taxable * rate;
    setOut({ payout, taxFree, taxable, tax, inHand: payout - tax, rateLabel });
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 4 }}>Payout tax and the in-hand amount</h2>
      <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 14 }}>
        An estimate of how much of your redundancy payment is tax free, how much tax applies to the
        rest, and what lands in your account.
      </p>
      <div className="tool-grid">
        <div><label>Redundancy payment ({region.currency})</label><input type="number" min="0" value={f.payout} onChange={(e) => setF({ ...f, payout: e.target.value })} placeholder="40000" /></div>
        {t.model === 'au-etp' ? (
          <div><label>Completed years of service</label><input type="number" min="0" step="1" value={f.years} onChange={(e) => setF({ ...f, years: e.target.value })} placeholder="6" /></div>
        ) : (
          <div>
            <label>Your income tax band</label>
            <select value={f.band} onChange={(e) => setF({ ...f, band: parseInt(e.target.value, 10) })}>
              {t.bands.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
            </select>
          </div>
        )}
      </div>
      {t.model === 'au-etp' && (
        <label className="tool-check">
          <input type="checkbox" checked={f.over} onChange={(e) => setF({ ...f, over: e.target.checked })} />
          I am {t.preservationAge} or older
        </label>
      )}
      <button className="btn" style={{ marginTop: 12 }} onClick={run}>Estimate</button>

      {out && (
        <div style={{ marginTop: 16 }}>
          <div className="money-grid">
            <div className="money-cell"><div className="v">{money(region, out.taxFree)}</div><div className="k">tax free</div></div>
            <div className="money-cell"><div className="v">{money(region, out.taxable)}</div><div className="k">taxable amount</div></div>
            <div className="money-cell"><div className="v" style={{ color: 'var(--red)' }}>{money(region, out.tax)}</div><div className="k">estimated tax</div></div>
            <div className="money-cell"><div className="v" style={{ color: 'var(--green)' }}>{money(region, out.inHand)}</div><div className="k">estimated in hand</div></div>
          </div>
          <p style={{ fontSize: '.88rem', color: 'var(--soft)' }}>Tax applied: {out.rateLabel}.</p>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Assumptions and what can change this</summary>
            <ul className="spaced" style={{ marginTop: 10, color: 'var(--soft)' }}>
              {t.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </details>
          <p className="fineprint">
            Estimate only, not tax advice. Based on{' '}
            <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}</a>, checked {t.lastChecked}.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Tools() {
  const { region } = useRegion();
  const [tab, setTab] = useState('owed');

  return (
    <>
      <h1 className="page-title">Calculators</h1>
      <p className="page-sub">
        Four quick tools for the numbers that matter. Everything runs on your device; nothing you
        enter is sent anywhere.
      </p>

      <div className="filter-row" role="tablist" aria-label="Choose a calculator">
        {TABS.map((t) => (
          <button key={t.id} className={`filter-chip${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'owed' && <OwedVsOffered region={region} />}
      {tab === 'dates' && <KeyDates region={region} />}
      {tab === 'runway' && <Runway region={region} />}
      {tab === 'tax' && <TaxInHand region={region} />}

      <p style={{ fontSize: '.85rem', color: 'var(--soft)' }}>
        Want these numbers in context? <Link to="/plan">Run your full plan</Link>.
      </p>
    </>
  );
}
