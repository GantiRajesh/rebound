import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';

export default function Reset() {
  const { region } = useRegion();
  const wellbeing = region.directory.filter((d) => d.category === 'Wellbeing');

  return (
    <>
      <h1 className="page-title">Take a moment</h1>
      <p className="page-sub">
        Losing a job is one of life's more stressful events. Whatever you are feeling is a normal
        response. Nothing on this page needs doing.
      </p>

      <div className="card breath-stage">
        <p style={{ fontWeight: 700 }}>Breathe with the circle</p>
        <div className="breath-circle" aria-hidden="true">in and out</div>
        <p style={{ color: 'var(--soft)', maxWidth: '48ch', margin: '0 auto' }}>
          Breathe in as it grows, out as it shrinks. Even one minute can lower the stress response
          and make the next decision easier.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Worth keeping in mind</h2>
        <ul className="spaced">
          <li>The role was removed. That is not a judgement of you or your ability.</li>
          <li>You do not need a plan today. The only time-sensitive items are legal deadlines, and your checklist flags those clearly.</li>
          <li>Most people find work again, and many find something better. It rarely feels that way in the first week.</li>
          <li>Having one sentence prepared makes telling people easier: "My role was made redundant in a restructure. I'm taking a short break, then planning what's next."</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 9 }}>If you just want to talk to someone</h2>
        <p style={{ color: 'var(--soft)', marginBottom: 10 }}>
          Sometimes what helps most is simply being heard, without an agenda and without a clock.{' '}
          <a href="http://listeningtreecounseling.com/" target="_blank" rel="noopener noreferrer sponsored">
            Listening Tree Counselling
          </a>{' '}
          offers a quiet, confidential space for exactly that: unhurried conversations, at your
          pace, with an accredited counsellor. You can reach out by phone, WhatsApp or message.
        </p>
        <a className="btn ghost small" href="http://listeningtreecounseling.com/" target="_blank" rel="noopener noreferrer sponsored">
          Visit Listening Tree Counselling
        </a>
      </div>

      {wellbeing.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 9 }}>If it feels like more than stress</h2>
          <p style={{ marginBottom: 10 }}>Free and confidential support is available right now:</p>
          <ul className="spaced">
            {wellbeing.map((w) => (
              <li key={w.name}>
                <strong>{w.name}</strong>
                {w.phone && <> · {w.phone}</>} ·{' '}
                <a href={w.url} target="_blank" rel="noopener noreferrer">
                  {w.url.replace('https://', '')}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="btn" to="/plan">Start my plan</Link>
        <Link className="btn ghost" to="/">Back to home</Link>
      </div>
    </>
  );
}
