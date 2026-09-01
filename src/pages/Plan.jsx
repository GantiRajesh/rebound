import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { calculateNotice, calculateRedundancy } from '../lib/entitlements';
import { load, save } from '../lib/storage';

/**
 * PLAN WIZARD. One guided flow: situation, genuineness check, numbers.
 * Ends in a personal plan: verdict (with official references), minimum
 * entitlements, deadline notice, budget runway, next steps.
 */

function buildSteps(region) {
  const steps = [
    {
      id: 'what', type: 'options',
      q: 'What happened?',
      help: 'There are no wrong answers. This points you to the right information first.',
      options: [
        { label: 'My role was made redundant', set: { situation: 'redundancy' }, next: 'smell' },
        { label: 'I was laid off or let go', set: { situation: 'redundancy' }, next: 'smell' },
        { label: 'My contract ended and was not renewed', set: { situation: 'contract' }, next: 'years' },
        { label: 'I felt pressured to resign', set: { situation: 'forced' }, next: 'years' },
        { label: 'Nothing official yet, but I expect it soon', set: { situation: 'pre' }, next: 'years' }
      ]
    },
    {
      id: 'smell', type: 'options',
      q: 'Do any of these apply?',
      help: 'A genuine redundancy means the role itself no longer exists.',
      options: [
        { label: 'Someone new is doing my old job', set: { suspicious: true }, next: 'years' },
        { label: 'The role was re-advertised', set: { suspicious: true }, next: 'years' },
        { label: 'It followed a complaint or leave I took', set: { suspicious: true }, next: 'years' },
        { label: 'None of these apply', set: { suspicious: false }, next: 'years' },
        { label: "I'm not sure", set: { suspicious: 'unsure' }, next: 'years' }
      ]
    },
    { id: 'years', type: 'number', q: 'How many years were you employed there?', help: 'Continuous service with this employer. Half years are fine, for example 4.5.', field: 'years', unit: 'years', min: 0, step: 0.5, placeholder: '4.5' },
    { id: 'age', type: 'number', q: 'How old are you?', help: 'Age affects notice and redundancy pay in some countries.', field: 'age', unit: 'years old', min: 15, max: 100, step: 1, placeholder: '42' },
    { id: 'pay', type: 'number', q: 'What is your weekly base pay, before tax?', help: 'Ordinary hours only. Exclude overtime and most allowances.', field: 'pay', unit: `${region.currency} per week`, min: 0, step: 1, placeholder: '1500' }
  ];
  if (region.rules.smallBusinessExemption.applies) {
    steps.push({
      id: 'smallbiz', type: 'options',
      q: `Does the business have ${region.rules.smallBusinessExemption.threshold} or more employees?`,
      help: 'Business size affects redundancy pay for small employers here.',
      options: [
        { label: `Yes, ${region.rules.smallBusinessExemption.threshold} or more`, set: { smallBiz: false }, next: 'END' },
        { label: `No, fewer than ${region.rules.smallBusinessExemption.threshold}`, set: { smallBiz: true }, next: 'END' },
        { label: 'Not sure', set: { smallBiz: false }, next: 'END' }
      ]
    });
  }
  return steps;
}

/** Every verdict carries official references so nothing rests on trust alone. */
function verdictFor(region, a) {
  const d = region.deadline;
  const g = region.governance;
  const refGov = { label: g.source, url: g.sourceUrl };
  const refDeadline = { label: d.body, url: d.url };
  const refBenefit = { label: region.terminology.unemploymentBenefit, url: region.benefitUrl };

  if (a.situation === 'contract')
    return {
      tone: 'calm', title: 'The end of a fixed-term contract works differently.',
      body: `When a fixed-term contract simply ends, redundancy pay usually does not apply. You are still owed your final pay and all unused leave, and ${region.terminology.unemploymentBenefit} may be available sooner than you expect. If the work continued and only your contract ended, it may be worth getting advice.`,
      refs: [refGov, refBenefit]
    };
  if (a.situation === 'forced')
    return {
      tone: 'alert', deadline: true, title: 'Pressure to resign can amount to constructive dismissal.',
      body: 'Being told to resign or be dismissed, or being placed under unreasonable pressure, can be treated as a dismissal in law. Keep copies of all messages and documents, and get free advice this week. Time limits are short.',
      refs: [refDeadline, refGov]
    };
  if (a.situation === 'pre')
    return {
      tone: 'calm', title: 'Preparing early puts you in a stronger position.',
      body: 'Most employers must consult before making roles redundant. Use this time to gather your documents, understand what a fair package includes, and know your numbers before any meeting. They are set out below.',
      refs: [refGov]
    };
  if (a.suspicious === true)
    return {
      tone: 'alert', deadline: true, title: 'This may not be a genuine redundancy.',
      body: 'What you selected can indicate that the redundancy was not genuine. That may give you the right to challenge it. You do not need everything figured out. Speak to a free advice service this week.',
      refs: [refDeadline, refGov]
    };
  if (a.suspicious === 'unsure')
    return {
      tone: 'calm', title: 'Being unsure is normal.',
      body: `Most people have never been through this before. Your figures are below either way. If anything feels wrong later, one call to a free advice line will tell you whether it is worth pursuing. The time limit to challenge is ${d.days} days.`,
      refs: [refGov, refDeadline]
    };
  return {
    tone: 'calm', title: 'This appears to be a standard redundancy.',
    body: 'A genuine redundancy comes with clear minimum entitlements and a well-established process. Your figures are below, with links to the official sources.',
    refs: [refGov]
  };
}

/** Given partial answers (e.g. from the home-page teaser), find where to resume. */
function resumeStep(steps, answers) {
  if (answers.situation === undefined) return 0;
  if (answers.situation === 'redundancy' && answers.suspicious === undefined)
    return steps.findIndex((s) => s.id === 'smell');
  if (answers.years === undefined) return steps.findIndex((s) => s.id === 'years');
  if (answers.age === undefined) return steps.findIndex((s) => s.id === 'age');
  if (answers.pay === undefined) return steps.findIndex((s) => s.id === 'pay');
  return steps.length - 1;
}

/** Animated number that counts up on mount. */
function CountUp({ value, format }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dur = 600;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format]);
  return <div className="v" ref={ref} />;
}

export default function Plan() {
  const { region } = useRegion();
  const steps = buildSteps(region);
  const [wiz, setWiz] = useState(() => load('plan', { answers: {}, done: false }));
  const [stepIdx, setStepIdx] = useState(() => resumeStep(steps, load('plan', { answers: {} }).answers || {}));
  const [trail, setTrail] = useState([]);
  const [numErr, setNumErr] = useState(false);
  const [runway, setRunway] = useState(() => load('runway', { savings: '', monthly: '' }));
  const numRef = useRef(null);

  const update = (next) => {
    setWiz(next);
    save('plan', next);
    if (next.done) {
      const tags = ['all'];
      const a = next.answers;
      if (a.suspicious === true || a.suspicious === 'unsure' || a.situation === 'forced') tags.push('suspicious');
      save('triage-tags', tags);
    }
  };

  const pick = (opt) => {
    const answers = { ...wiz.answers, ...opt.set };
    setTrail([...trail, stepIdx]);
    if (opt.next === 'END') {
      update({ answers, done: true });
      window.scrollTo(0, 0);
      return;
    }
    const ni = steps.findIndex((s) => s.id === opt.next);
    const nextIdx = ni >= 0 ? ni : stepIdx + 1;
    if (nextIdx >= steps.length) update({ answers, done: true });
    else {
      update({ answers, done: false });
      setStepIdx(nextIdx);
    }
    window.scrollTo(0, 0);
  };

  const submitNumber = () => {
    const step = steps[stepIdx];
    const val = parseFloat(numRef.current?.value);
    if (isNaN(val) || val < step.min || (step.max && val > step.max)) {
      setNumErr(true);
      return;
    }
    setNumErr(false);
    const answers = { ...wiz.answers, [step.field]: val };
    setTrail([...trail, stepIdx]);
    if (stepIdx + 1 >= steps.length) update({ answers, done: true });
    else {
      update({ answers, done: false });
      setStepIdx(stepIdx + 1);
    }
    window.scrollTo(0, 0);
  };

  const back = () => {
    if (wiz.done) {
      update({ ...wiz, done: false });
      return;
    }
    if (trail.length) {
      setStepIdx(trail[trail.length - 1]);
      setTrail(trail.slice(0, -1));
    }
  };

  const restart = () => {
    update({ answers: {}, done: false });
    setStepIdx(0);
    setTrail([]);
  };

  const setRunwayField = (k, v) => {
    const next = { ...runway, [k]: v };
    setRunway(next);
    save('runway', next);
  };

  /* ---------- result ---------- */
  if (wiz.done) {
    const a = wiz.answers;
    const years = a.years || 0;
    const age = a.age || 0;
    const pay = a.pay || 0;
    const nw = calculateNotice(region.rules, years, age);
    const red = calculateRedundancy(region.rules, { yearsOfService: years, age, weeklyPay: pay, smallBusiness: a.smallBiz });
    const v = verdictFor(region, a);
    const total = nw * pay + (red.qualifies ? red.redundancyPay : 0);
    const money = (n) => region.currencySymbol + Math.round(n).toLocaleString();
    const g = region.governance;

    const sv = parseFloat(runway.savings) || 0;
    const mo = parseFloat(runway.monthly) || 0;
    const months = mo > 0 ? (total + sv) / mo : 0;
    const barPct = Math.min((months / 12) * 100, 100);

    const moves = [];
    if (v.deadline)
      moves.push({ t: 'Get free advice this week', p: `Claims close about ${region.deadline.days} days after dismissal via ${region.deadline.body}.`, to: '/directory' });
    moves.push({ t: 'Start the checklist', p: 'The most important steps for the first 48 hours.', to: '/checklist' });
    moves.push({ t: 'Find support services', p: `Free legal, financial and wellbeing services for ${region.fullName}.`, to: '/directory' });
    moves.push({ t: 'Request a callback', p: 'Fill in a short form and we will call you with the details you need.', to: '/talk' });
    if (!v.deadline) moves.push({ t: 'Review key terms', p: 'Deed of release, PILON and other terms, explained plainly.', to: '/glossary' });

    return (
      <div className="wiz">
        <div className={`verdict${v.tone === 'alert' ? ' alert' : ''}`}>
          <h2>{v.title}</h2>
          <p>{v.body}</p>
          <p style={{ fontSize: '.8rem', marginTop: 12 }}>
            <strong>Official references:</strong>{' '}
            {v.refs.map((ref, i) => (
              <span key={ref.url}>
                {i > 0 && ' · '}
                <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label}</a>
              </span>
            ))}
          </p>
        </div>

        {v.deadline && (
          <div className="deadline">
            <b>Deadline.</b> You have roughly <b>{region.deadline.days} days</b> from dismissal to
            lodge a claim with{' '}
            <a href={region.deadline.url} target="_blank" rel="noopener noreferrer">
              {region.deadline.body}
            </a>
            . Get free advice before making decisions.
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Your minimum entitlements</h3>
          <p style={{ color: 'var(--soft)', fontSize: '.85rem', marginBottom: 6 }}>
            {years} years of service · age {age} · {money(pay)} per week{a.smallBiz ? ' · small employer' : ''}
          </p>
          <div className="money-grid">
            <div className="money-cell"><CountUp value={nw} format={(n) => `${Math.round(n * 10) / 10}`} /><div className="k">weeks notice</div></div>
            <div className="money-cell"><CountUp value={nw * pay} format={money} /><div className="k">notice pay if paid out</div></div>
            <div className="money-cell"><CountUp value={red.qualifies ? red.redundancyWeeks : 0} format={(n) => `${Math.round(n * 10) / 10}`} /><div className="k">weeks redundancy pay</div></div>
            <div className="money-cell"><CountUp value={red.qualifies ? red.redundancyPay : 0} format={money} /><div className="k">redundancy pay</div></div>
          </div>
          <p style={{ fontWeight: 700 }}>
            Estimated total: <span className="accent-text">{money(total)}</span>{' '}
            <span style={{ color: 'var(--soft)', fontWeight: 400, fontSize: '.85rem' }}>
              plus any unused leave.
            </span>
          </p>
          {red.messages.map((m) => (
            <p key={m} style={{ color: 'var(--amber)', marginTop: 8, fontSize: '.88rem' }}>{m}</p>
          ))}
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>What can change these figures</summary>
            <ul className="spaced" style={{ marginTop: 10, color: 'var(--soft)' }}>
              {region.rules.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </details>
          <div className="fineprint">
            General information, not legal advice. Based on{' '}
            <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer">{g.source}</a>, checked {g.lastChecked}.
            Confirm with{' '}
            <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer">{g.officialCalc}</a> before relying on these figures.
          </div>
        </div>

        <div className="card runway">
          <h3 style={{ marginBottom: 2 }}>Your budget runway</h3>
          <p style={{ color: 'var(--soft)', fontSize: '.85rem' }}>
            How long the money lasts. The payout is pre-filled from your figures above.
          </p>
          <div className="rw-inputs">
            <div>
              <label>Payout ({region.currency})</label>
              <input type="number" value={Math.round(total)} disabled />
            </div>
            <div>
              <label>Savings ({region.currency})</label>
              <input type="number" inputMode="decimal" placeholder="10000" value={runway.savings} onChange={(e) => setRunwayField('savings', e.target.value)} />
            </div>
            <div>
              <label>Monthly essentials ({region.currency})</label>
              <input type="number" inputMode="decimal" placeholder="4000" value={runway.monthly} onChange={(e) => setRunwayField('monthly', e.target.value)} />
            </div>
          </div>
          <div className="rw-out">
            <div className="rw-months">{mo > 0 ? `${Math.round(months * 10) / 10} months` : '···'}</div>
            <div className="rw-bar"><div style={{ width: `${barPct}%` }} /></div>
            <div className="rw-note">
              {mo > 0 ? (
                months >= 6 ? 'A solid buffer. You have time to be selective about the next role.'
                : months >= 3 ? 'A reasonable buffer. Enough time for a considered search.'
                : (
                  <>
                    A short runway. Register for{' '}
                    <a href={region.benefitUrl} target="_blank" rel="noopener noreferrer">
                      {region.terminology.unemploymentBenefit}
                    </a>{' '}
                    today and see the Money help section in Support.
                  </>
                )
              ) : 'Enter savings and monthly essentials to see your runway in months.'}
            </div>
          </div>
        </div>

        <h3 style={{ margin: '20px 0 12px' }}>Your next steps</h3>
        <div className="moves">
          {moves.map((m) => (
            <Link className="move" to={m.to} key={m.t}>
              <h4>{m.t}</h4>
              <p>{m.p}</p>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <button className="btn ghost" onClick={restart}>Redo the questions</button>
        </div>
      </div>
    );
  }

  /* ---------- question ---------- */
  const step = steps[stepIdx];
  const pct = Math.round((stepIdx / steps.length) * 100);

  return (
    <div className="wiz">
      <div className="wiz-top">
        <button className="wiz-back" onClick={back} style={{ visibility: trail.length ? 'visible' : 'hidden' }} aria-label="Back">
          ←
        </button>
        <div className="wiz-progress"><div style={{ width: `${pct}%` }} /></div>
        <span className="wiz-count">{stepIdx + 1} / {steps.length}</span>
      </div>
      <div className="wiz-q">{step.q}</div>
      <div className="wiz-help">{step.help}</div>

      {step.type === 'options' ? (
        step.options.map((o) => (
          <button className="opt" key={o.label} onClick={() => pick(o)}>
            {o.label}
          </button>
        ))
      ) : (
        <div className="num-wrap">
          <input
            ref={numRef}
            key={step.id}
            type="number"
            inputMode="decimal"
            min={step.min}
            max={step.max}
            step={step.step}
            placeholder={step.placeholder}
            defaultValue={wiz.answers[step.field] ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && submitNumber()}
            style={numErr ? { borderColor: 'var(--red)' } : undefined}
            autoFocus
          />
          <div className="unit">{step.unit}</div>
          <button className="btn wiz-next" onClick={submitNumber}>Next</button>
        </div>
      )}
    </div>
  );
}
