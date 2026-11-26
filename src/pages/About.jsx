import { brand } from '../config/brand';
import { useRegion } from '../context/RegionContext';
import { clearAll } from '../lib/storage';
import AdSlot from '../components/AdSlot';

export default function About() {
  const { region } = useRegion();
  const g = region.governance;

  return (
    <>
      <h1 className="page-title">About {brand.name}</h1>
      <p className="page-sub">{brand.tagline}</p>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>What this is</h2>
        <p>
          {brand.name} guides anyone who has lost a job through what happened, what they are
          legally owed where they live, and what to do next, in the right order. It covers
          redundancy, layoffs, contract endings and forced resignations.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Our promises</h2>
        <ul className="spaced">
          <li><strong>Rights info and the calculator are free, forever.</strong> Revenue never touches that layer.</li>
          <li><strong>Every legal figure is sourced and dated.</strong> Current {region.fullName} ruleset: {g.source} (checked {g.lastChecked}).</li>
          <li><strong>Your data stays yours.</strong> Answers and progress live only in your browser. No accounts, and no analytics on your answers. The only third party on the site is the advertising described below, and it never sees what you enter.</li>
          <li><strong>Plain English, calm tone.</strong> This is a companion for a difficult time, and it is written accordingly.</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Your data</h2>
        <p style={{ marginBottom: 12 }}>
          Everything you enter lives in your browser on your device. Wipe it whenever you like:
        </p>
        <button
          className="btn ghost"
          onClick={() => {
            clearAll();
            window.location.href = '/';
          }}
        >
          Clear everything stored on this device
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Advertising and cookies</h2>
        <p style={{ marginBottom: 10 }}>
          {brand.name} is free to use. To help cover running costs we show ads from Google AdSense
          on a few general pages only: the home page, the glossary, the support directory and this
          page. There are <strong>no ads</strong> on your plan, your checklist, the reset page, the
          callback request or the services page.
        </p>
        <p style={{ marginBottom: 10 }}>
          Google may use cookies or similar technology to show and measure ads. Nothing you type
          into the plan, checklist or any form is shared with Google or advertisers. Ads never
          influence the guidance we give.
        </p>
        <p>
          You can manage ad personalisation in your{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google ad settings</a>
          {' '}and read how Google uses data from sites that use its services in{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google's partner sites policy</a>.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Important</h2>
        <p>
          {brand.name} gives general information, not legal or financial advice. Rules change,
          contracts vary, circumstances matter. Confirm anything important with the official source
          for your region or a qualified professional.
        </p>
      </div>

      <AdSlot slot="about-footer" />
    </>
  );
}
