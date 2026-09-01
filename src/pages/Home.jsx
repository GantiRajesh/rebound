import { Link, useNavigate } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { regions } from '../regions';
import { load, save } from '../lib/storage';
import AdSlot from '../components/AdSlot';

export default function Home() {
  const { region } = useRegion();
  const navigate = useNavigate();

  const plan = load('plan');
  const planDone = Boolean(plan?.done);
  const checklistStarted = Object.values(load('checklist-progress', {})).some(Boolean);

  const startWizard = () => {
    save('plan', { answers: {}, done: false });
    navigate('/plan');
  };

  /** Chat teaser: answers the wizard's first question with one tap. */
  const teaserPick = (set) => {
    save('plan', { answers: set, done: false });
    navigate('/plan');
  };

  const teaserOpts = [
    { label: 'My role was made redundant', set: { situation: 'redundancy' } },
    { label: 'My contract just ended', set: { situation: 'contract' } },
    { label: 'I felt pressured to resign', set: { situation: 'forced' } }
  ];

  const J = [
    { n: 1, t: 'Take a moment', p: 'A difficult day. Pause before the paperwork.', to: '/reset', done: false },
    { n: 2, t: 'Get your plan', p: 'Six short questions about your situation and your numbers.', to: '/plan', done: planDone },
    { n: 3, t: 'Know your entitlements', p: "Notice and redundancy pay, calculated from your country's rules.", to: '/plan', done: planDone },
    { n: 4, t: 'Get organised', p: 'A checklist for the first 48 hours, the first week, and the first month.', to: '/checklist', done: checklistStarted },
    { n: 5, t: 'Find support', p: 'Free legal, financial and wellbeing services, verified for your country.', to: '/directory', done: false },
    { n: 6, t: 'Move forward', p: 'Resume, references, and planning the search for your next role.', to: '/checklist', done: false }
  ];

  return (
    <>
      <section className="hero">
        <div className="kicker">Free · No sign-up · {region.flag} {region.fullName}</div>
        <h1>
          Lost your job?
          <br />
          <span>Here's what to do next.</span>
        </h1>
        <p className="sub">
          Answer six questions. In about two minutes you'll know your minimum legal entitlements,
          whether the redundancy was handled properly, and your next steps.
        </p>
        <div className="hero-ctas">
          <button className="btn" onClick={startWizard}>
            {planDone ? 'Redo my plan' : 'Start my plan'}
          </button>
          {planDone ? (
            <Link className="btn ghost" to="/plan">View my plan</Link>
          ) : (
            <Link className="btn ghost" to="/reset">I need a moment first</Link>
          )}
        </div>
        <div className="stats-row">
          <div className="stat"><div className="v">2 min</div><div className="k">to a full plan</div></div>
          <div className="stat"><div className="v">$0</div><div className="k">for the essentials</div></div>
          <div className="stat"><div className="v">{Object.keys(regions).length}</div><div className="k">countries, more coming</div></div>
        </div>
      </section>

      <section className="teaser-wrap">
        <div className="teaser-copy">
          <h2>Start with one question.</h2>
          <p>
            The plan works like a short conversation. Answer the first question here and continue
            from there. Nothing you enter leaves your device.
          </p>
          <Link className="btn ghost small" to="/glossary">Or browse the glossary</Link>
        </div>
        <div className="phone">
          <div className="phead">rebound · your plan</div>
          <div className="bubble bot">Let's work out where you stand.</div>
          <div className="bubble bot">What happened?</div>
          {teaserOpts.map((o) => (
            <button key={o.label} className="bubble opt" onClick={() => teaserPick(o.set)}>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <AdSlot slot="home-mid" />

      <section className="journey" aria-label="How it works">
        <h2>How it works</h2>
        <p className="lead">Six steps. Go in order, or jump to what you need.</p>
        <div className="j-grid">
          {J.map((s) => (
            <Link className="j-card" to={s.to} key={s.n}>
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.p}</p>
              <div className={`state ${s.done ? 'done' : 'todo'}`}>{s.done ? '✓ In progress' : 'Open'}</div>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="home-footer" />
    </>
  );
}
