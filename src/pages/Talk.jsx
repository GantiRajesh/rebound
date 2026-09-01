import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { monetisation } from '../config/monetisation';
import StepForm from '../components/StepForm';
import { submitForm } from '../lib/submit';

/**
 * Request a callback. One question per screen, nothing else on the page.
 * If you would rather we reached out with the details you need, this is it.
 */
export default function Talk() {
  const { region } = useRegion();
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);

  const steps = [
    { id: 'name', label: 'What is your name?', type: 'text', placeholder: 'Your name' },
    { id: 'phone', label: 'What is the best number to call you on?', help: 'Include your area code.', type: 'tel', placeholder: 'Phone number' },
    { id: 'email', label: 'And your email address?', help: 'In case we cannot reach you by phone.', type: 'email', placeholder: 'name@example.com' },
    { id: 'time', label: 'When is a good time to call?', type: 'choice', options: ['Morning', 'Afternoon', 'Evening'] },
    {
      id: 'topic', label: 'What would you like to talk about?', type: 'choice',
      options: ['My entitlements and pay', 'A possible legal issue', 'Money and budgeting', 'Finding my next role', 'Not sure yet']
    },
    {
      id: 'consent', label: 'One last thing.', type: 'choice',
      help: 'We will only use these details to contact you about this enquiry. They are never shared or sold, and you can ask us to delete them at any time.',
      options: ['I agree, please contact me']
    }
  ];

  const onDone = async (answers) => {
    const res = await submitForm('callback', { ...answers, region: region.id });
    setResult({ ...res, answers });
    window.scrollTo(0, 0);
  };

  if (result) {
    return (
      <div className="wiz">
        <div className="card">
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>Thank you, {result.answers.name}.</h1>
          {result.delivered ? (
            <p>
              Your request has been received. {monetisation.forms.callbackNotice} We will call{' '}
              {result.answers.phone} in the {result.answers.time.toLowerCase()} and follow up by
              email if we cannot reach you.
            </p>
          ) : (
            <p>
              Your request has been saved on this device. Callback requests will be delivered once
              the contact service is connected (see docs/GOING-LIVE.md). Nothing has been sent
              anywhere yet.
            </p>
          )}
          <p style={{ marginTop: 12, color: 'var(--soft)', fontSize: '.9rem' }}>
            If your matter is urgent, the free services in{' '}
            <Link to="/directory">Support</Link> are available now, including phone lines.
          </p>
        </div>
        <Link className="btn ghost" to="/">Back to home</Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="wiz">
        <h1 className="page-title">Request a callback</h1>
        <p className="page-sub">
          If you would like the right support with additional details, fill in this short form and
          we will call you. Six quick questions, one at a time. Your details are used only for this
          enquiry.
        </p>
        <div className="card">
          <button className="btn" onClick={() => setStarted(true)}>Start</button>
          <Link className="btn ghost" style={{ marginLeft: 10 }} to="/directory">
            See free support instead
          </Link>
        </div>
      </div>
    );
  }

  return <StepForm steps={steps} onDone={onDone} doneLabel="Request my callback" />;
}
