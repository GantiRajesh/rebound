import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { monetisation } from '../config/monetisation';
import partnersData from '../data/partners.json';
import StepForm from '../components/StepForm';
import { submitForm } from '../lib/submit';
import { referralUrl, trackReferralClick } from '../lib/referral';

/**
 * Additional services (paid) + the partner network.
 * - Paid services are config-driven; each buys via its own payment link
 *   (Stripe Payment Link) once connected. Until then the button is honest.
 * - Partners (solicitors, recruiters, counsellors, financial advisers) are
 *   managed as data in src/data/partners.json. Professionals apply through
 *   the stepped form below; entries go live when you add them to the file.
 */
export default function Services() {
  const { region } = useRegion();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(null);

  const livePartners = partnersData.partners.filter(
    (p) => p.status === 'live' && p.regions.includes(region.id)
  );

  const applySteps = [
    { id: 'org', label: 'What is your organisation called?', type: 'text', placeholder: 'Organisation name' },
    { id: 'type', label: 'What kind of organisation are you?', type: 'choice', options: partnersData.types.map((t) => t.label) },
    { id: 'region', label: 'Where do you operate?', type: 'choice', options: ['Australia', 'United Kingdom', 'Both', 'Other'] },
    { id: 'contact', label: 'What is the best email to reach you on?', type: 'email', placeholder: 'name@organisation.com' },
    { id: 'offer', label: 'Briefly, what would you like to offer our users?', type: 'textarea', placeholder: 'Services, pricing approach, and anything else we should know.' }
  ];

  const onApply = async (answers) => {
    const res = await submitForm('partner-application', answers);
    setApplied(res);
    setApplying(false);
    window.scrollTo(0, 0);
  };

  if (applying) {
    return (
      <>
        <h1 className="page-title">Partner with Rebound</h1>
        <p className="page-sub">Five short questions. We review every application and reply by email.</p>
        <StepForm steps={applySteps} onDone={onApply} doneLabel="Submit application" />
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Additional services</h1>
      <p className="page-sub">
        Everything essential on this site is free and stays free. If you want hands-on help from a
        qualified professional, these optional paid services are available. Each is delivered by a
        vetted partner.
      </p>

      <div className="dir-grid">
        {monetisation.services.filter((s) => s.enabled).map((s) => (
          <div className="dir-card" key={s.id}>
            <div className="cat">Paid service</div>
            <h3>{s.name} <span className="chip price">{s.price}</span></h3>
            <p>{s.description}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {s.paymentLink ? (
                <a className="btn small" href={s.paymentLink} target="_blank" rel="noopener noreferrer">
                  Pay and book
                </a>
              ) : (
                <button className="btn small ghost" disabled title="Available once payments are connected">
                  Available soon
                </button>
              )}
              {s.internalLink && (
                <Link className="btn small ghost" to={s.internalLink}>
                  Learn more
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 6 }}>Not sure what you need?</h2>
        <p style={{ color: 'var(--soft)', marginBottom: 12 }}>
          Request a callback and we will help you work out whether a free service covers it before
          you pay for anything.
        </p>
        <Link className="btn" to="/talk">Request a callback</Link>
      </div>

      {livePartners.length > 0 && (
        <>
          <h2 style={{ margin: '26px 0 6px' }}>Our partner network in {region.fullName}</h2>
          <p className="disclosure">
            Partners are vetted professionals. If you engage one, Rebound may receive a referral
            fee or placement fee at no cost to you. This never changes the free guidance on this
            site.
          </p>
          <div className="dir-grid">
            {livePartners.map((p) => (
              <div className="dir-card" key={p.id}>
                <div className="cat">{partnersData.types.find((t) => t.id === p.type)?.label}</div>
                <h3>{p.name} <span className="chip partner">Partner</span></h3>
                <p>{p.services.join(' · ')}</p>
                {p.referralUrl && (
                  <div className="dir-links">
                    <a
                      href={referralUrl(p.referralUrl, 'services')}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={() => trackReferralClick(p.id, 'services')}
                    >
                      Visit website
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 6 }}>For professionals: partner with us</h2>
        <p style={{ color: 'var(--soft)', marginBottom: 12 }}>
          We work with employment solicitors, recruitment agencies, counsellors, career coaches,
          financial advisers and outplacement teams who want to support people through job loss.
          Partners are vetted, clearly labelled, and never allowed to crowd out free services.
        </p>
        {applied ? (
          <p style={{ fontWeight: 600 }}>
            {applied.delivered
              ? 'Thank you. Your application has been received and we will reply by email.'
              : 'Thank you. Your application has been saved on this device and will be delivered once the contact service is connected.'}
          </p>
        ) : (
          <button className="btn ghost" onClick={() => setApplying(true)}>Apply to partner</button>
        )}
      </div>
    </>
  );
}
