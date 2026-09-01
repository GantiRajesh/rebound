import { useRef, useState } from 'react';

/**
 * StepForm: a reusable one-question-per-screen form, centred and calm.
 * Used by the callback request and the partner application.
 *
 * steps: [{ id, label, help?, type: 'text'|'tel'|'email'|'textarea'|'choice',
 *           options?: [string], placeholder?, required? }]
 * onDone(answers): called after the last step.
 */
export default function StepForm({ steps, onDone, doneLabel = 'Submit' }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [err, setErr] = useState(false);
  const inputRef = useRef(null);

  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  const advance = (value) => {
    if (step.required !== false && (!value || String(value).trim() === '')) {
      setErr(true);
      return;
    }
    if (step.type === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErr(true);
      return;
    }
    setErr(false);
    const next = { ...answers, [step.id]: String(value).trim() };
    setAnswers(next);
    if (isLast) onDone(next);
    else setIdx(idx + 1);
  };

  const submitInput = () => advance(inputRef.current?.value ?? '');

  return (
    <div className="wiz">
      <div className="wiz-top">
        <button
          className="wiz-back"
          onClick={() => idx > 0 && setIdx(idx - 1)}
          style={{ visibility: idx > 0 ? 'visible' : 'hidden' }}
          aria-label="Back"
        >
          ←
        </button>
        <div className="wiz-progress"><div style={{ width: `${Math.round((idx / steps.length) * 100)}%` }} /></div>
        <span className="wiz-count">{idx + 1} / {steps.length}</span>
      </div>

      <div className="wiz-q">{step.label}</div>
      {step.help && <div className="wiz-help">{step.help}</div>}

      {step.type === 'choice' ? (
        step.options.map((o) => (
          <button className="opt" key={o} onClick={() => advance(o)}>
            {o}
          </button>
        ))
      ) : step.type === 'textarea' ? (
        <div className="num-wrap">
          <textarea
            ref={inputRef}
            key={step.id}
            rows={4}
            placeholder={step.placeholder || ''}
            defaultValue={answers[step.id] ?? ''}
            className="stepform-textarea"
            style={err ? { borderColor: 'var(--red)' } : undefined}
            autoFocus
          />
          <button className="btn wiz-next" onClick={submitInput}>{isLast ? doneLabel : 'Next'}</button>
        </div>
      ) : (
        <div className="num-wrap">
          <input
            ref={inputRef}
            key={step.id}
            type={step.type}
            placeholder={step.placeholder || ''}
            defaultValue={answers[step.id] ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && submitInput()}
            className="stepform-input"
            style={err ? { borderColor: 'var(--red)' } : undefined}
            autoFocus
          />
          {err && <div className="unit" style={{ color: 'var(--red)' }}>Please enter a valid answer to continue.</div>}
          <button className="btn wiz-next" onClick={submitInput}>{isLast ? doneLabel : 'Next'}</button>
        </div>
      )}
    </div>
  );
}
