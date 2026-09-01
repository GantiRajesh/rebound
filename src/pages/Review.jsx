import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { monetisation } from '../config/monetisation';
import { load, save } from '../lib/storage';

/**
 * AI DOCUMENT REVIEW. Paid, passcode-gated, session-only.
 * - Nothing uploaded is ever stored. Documents are processed in memory for
 *   this session only and discarded. That promise is stated on screen.
 * - Access requires a one-person code (emailed after payment) plus the
 *   buyer's email; codes expire after a set duration.
 * - In demoMode (no backend connected) the code DEMO-2026 unlocks a
 *   clearly-labelled sample analysis so the flow can be tested end to end.
 */

const cfg = monetisation.aiReview;

function sampleAnalysis(region) {
  return {
    sample: true,
    summary:
      `Based on the documents provided: a redundancy letter dated within the consultation period, a payment summary, and one email thread. Overall the process appears largely standard, with three items worth validating before you sign anything.`,
    good: [
      'The letter states a clear reason (role restructure) and a defined final working day.',
      'Notice is being paid out rather than worked, at what appears to be full base pay.',
      'The redundancy payment uses the correct weeks-for-service band for your tenure.'
    ],
    validate: [
      'The payment summary does not itemise unused annual leave. Ask for a line-item breakdown before your final day.',
      `The letter references a deed of release but the deed was not included. Do not sign it unsigned-seen; request it now and consider advice before signing.`,
      'The consultation meeting was scheduled after the decision letter was dated. If consultation is required under your award or policy, the order of events matters.'
    ],
    extras: [
      'You may be entitled to reasonable paid time off for job searching during the notice period. It is not mentioned anywhere in the documents.',
      'Check whether outplacement support was offered to others in the same round. If so, ask for parity in writing.'
    ],
    questions: [
      'Can you provide a full written breakdown of my final payment, including unused leave and how tax was calculated?',
      'Was my role selected using documented criteria, and can I see them?',
      'Is the deed of release negotiable, and what happens if I do not sign it?'
    ],
    deadlineNote: `If anything above suggests the redundancy was not genuine, note the ${region.deadline.days}-day limit to lodge with ${region.deadline.body}.`
  };
}

function draftEmail(analysis, region) {
  return `Subject: Request for clarification regarding my redundancy

Dear [HR contact],

Thank you for the documents provided regarding my redundancy. Before I respond or sign anything, I would appreciate written clarification on the following points:

${analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

I would also appreciate confirmation of:
${analysis.validate.map((v) => `- ${v.split('.')[0]}.`).join('\n')}

I understand these processes take time, and I would be grateful for a response by [date]. My final working day is [date], so timing matters for both of us.

Kind regards,
[Your name]`;
}

export default function Review() {
  const { region } = useRegion();
  const [params] = useSearchParams();
  const [access, setAccess] = useState(() => {
    const a = load('review-access');
    return a && a.expiresAt > Date.now() ? a : null;
  });
  const [code, setCode] = useState(params.get('code') || '');
  const [email, setEmail] = useState('');
  const [gateErr, setGateErr] = useState('');
  const [files, setFiles] = useState([]);
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);
  const [remaining, setRemaining] = useState('');

  /* countdown */
  useEffect(() => {
    if (!access) return undefined;
    const tick = () => {
      const ms = access.expiresAt - Date.now();
      if (ms <= 0) {
        setAccess(null);
        save('review-access', null);
        return;
      }
      setRemaining(`${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [access]);

  const unlock = async () => {
    setGateErr('');
    if (!code.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setGateErr('Enter the access code from your email, and the email address you paid with.');
      return;
    }
    if (cfg.demoMode) {
      if (code.trim().toUpperCase() === cfg.demoCode) {
        const a = { code: code.trim(), email, expiresAt: Date.now() + cfg.durationMinutes * 60000 };
        setAccess(a);
        save('review-access', a);
      } else {
        setGateErr('That code was not recognised. Codes are emailed after payment and expire; in this preview, use DEMO-2026.');
      }
      return;
    }
    try {
      const res = await fetch(cfg.validateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email })
      });
      const data = await res.json();
      if (data.ok) {
        const a = { code: code.trim(), email, expiresAt: data.expiresAt };
        setAccess(a);
        save('review-access', a);
      } else setGateErr(data.error || 'That code was not recognised or has expired.');
    } catch {
      setGateErr('Could not reach the validation service. Try again in a moment.');
    }
  };

  const analyse = async () => {
    setBusy(true);
    setAnalysis(null);
    setEmailDraft(null);
    if (cfg.demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      setAnalysis(sampleAnalysis(region));
      setBusy(false);
      return;
    }
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('pasted', pasted);
      fd.append('region', region.id);
      const res = await fetch(cfg.reviewEndpoint, {
        method: 'POST',
        headers: { 'x-review-code': access.code, 'x-review-email': access.email },
        body: fd
      });
      const data = await res.json();
      setAnalysis(data.ok ? data.analysis : null);
      if (!data.ok) setGateErr(data.error || 'Analysis failed. Nothing was stored; try again.');
    } catch {
      setGateErr('Could not reach the analysis service. Nothing was stored.');
    }
    setBusy(false);
  };

  /* ---------- locked ---------- */
  if (!access) {
    return (
      <>
        <h1 className="page-title">AI document review</h1>
        <p className="page-sub">
          Upload everything HR or your organisation sent you: letters, PDFs, emails. The AI reads
          it all and returns a decision-ready summary of what looks right, what to question, and
          entitlements you may be missing, plus a draft email you can send.
        </p>

        <div className="card" style={{ borderLeft: '4px solid var(--teal)' }}>
          <strong>Your documents are never stored.</strong>
          <p style={{ color: 'var(--soft)', fontSize: '.9rem', marginTop: 4 }}>
            Files are processed only for this session, in memory, and discarded when the analysis
            is returned or the page is closed. They are not saved, logged, used for training, or
            shared. Access expires automatically after {cfg.durationMinutes} minutes.
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>I have an access code</h2>
          <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 12 }}>
            Your code was emailed after payment. It works only with the email address you paid
            with, for one session.
          </p>
          <div className="tool-grid">
            <div><label>Access code</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. RBD-XXXX-XXXX" /></div>
            <div><label>Email used at payment</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div>
          </div>
          {gateErr && <p style={{ color: 'var(--red)', fontSize: '.86rem', marginTop: 8 }}>{gateErr}</p>}
          <button className="btn" style={{ marginTop: 12 }} onClick={unlock}>Unlock my session</button>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>Get access · {monetisation.services.find((s) => s.id === 'ai-review')?.price}</h2>
          <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 12 }}>
            Pay once and your access code arrives by email within a minute, with a link back to
            this page. One session, {cfg.durationMinutes} minutes, as many documents as you need.
          </p>
          {cfg.paymentLink ? (
            <a className="btn" href={cfg.paymentLink} target="_blank" rel="noopener noreferrer">Pay and get my code</a>
          ) : (
            <button className="btn ghost" disabled title="Available once payments are connected">Available soon</button>
          )}
          {cfg.demoMode && (
            <p style={{ fontSize: '.8rem', color: 'var(--soft)', marginTop: 10 }}>
              Preview mode: use code <strong>{cfg.demoCode}</strong> with any email to see a sample
              analysis.
            </p>
          )}
        </div>

        <p style={{ fontSize: '.85rem', color: 'var(--soft)' }}>
          Not sure you need it? The <Link to="/plan">free plan</Link> and{' '}
          <Link to="/tools">calculators</Link> cover the essentials, always free.
        </p>
      </>
    );
  }

  /* ---------- unlocked ---------- */
  return (
    <>
      <h1 className="page-title">AI document review</h1>
      <p className="page-sub">
        Session active. Add your documents and start the analysis.{' '}
        <span className="chip free">expires in {remaining}</span>
      </p>

      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Your documents</h2>
        <p style={{ color: 'var(--soft)', fontSize: '.88rem', marginBottom: 10 }}>
          Word, PDF, text and email files, or paste content directly. Processed for this session
          only, never stored.
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.eml,.msg,.rtf"
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
          className="file-input"
        />
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                {f.name} <span style={{ color: 'var(--soft)' }}>({Math.round(f.size / 1024)} KB)</span>
                <button className="file-remove" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <textarea
          className="stepform-textarea"
          rows={4}
          placeholder="Or paste email or letter text here."
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          style={{ marginTop: 10 }}
        />
        <button className="btn" style={{ marginTop: 12 }} onClick={analyse} disabled={busy || (files.length === 0 && !pasted.trim())}>
          {busy ? 'Reading your documents…' : 'Analyse my documents'}
        </button>
      </div>

      {analysis && (
        <>
          {analysis.sample && (
            <p className="disclosure">
              Sample analysis for preview purposes. On the live service this is generated from your
              actual documents.
            </p>
          )}
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2 style={{ marginBottom: 6 }}>Summary</h2>
            <p style={{ color: 'var(--soft)' }}>{analysis.summary}</p>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>What looks right</h2>
            <ul className="spaced">{analysis.good.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
            <h2 style={{ marginBottom: 8 }}>Validate before signing</h2>
            <ul className="spaced">{analysis.validate.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>Possible additional entitlements</h2>
            <ul className="spaced">{analysis.extras.map((g) => <li key={g}>{g}</li>)}</ul>
            <p style={{ color: 'var(--soft)', fontSize: '.85rem', marginTop: 10 }}>{analysis.deadlineNote}</p>
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>Next step</h2>
            <p style={{ color: 'var(--soft)', fontSize: '.9rem', marginBottom: 12 }}>
              Turn the open questions into an email to HR, ready to edit and send.
            </p>
            {emailDraft === null ? (
              <button className="btn" onClick={() => setEmailDraft(draftEmail(analysis, region))}>Draft the email</button>
            ) : (
              <>
                <textarea className="stepform-textarea" rows={14} value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                <button
                  className="btn small"
                  style={{ marginTop: 10 }}
                  onClick={() => navigator.clipboard?.writeText(emailDraft)}
                >
                  Copy to clipboard
                </button>
              </>
            )}
          </div>
          <p className="fineprint">
            AI analysis is general information, not legal advice. It is grounded in the official
            rules for {region.fullName} (
            <a href={region.governance.sourceUrl} target="_blank" rel="noopener noreferrer">{region.governance.source}</a>
            ), but a qualified professional should confirm anything you intend to rely on.
          </p>
        </>
      )}
    </>
  );
}
