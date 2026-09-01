import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { useRegion } from '../context/RegionContext';
import { useTheme } from '../context/ThemeContext';
import RegionPicker from './RegionPicker';

const NAV = [
  { to: '/plan', label: 'My plan' },
  { to: '/tools', label: 'Calculators' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/directory', label: 'Support' },
  { to: '/services', label: 'Services' },
  { to: '/reset', label: 'Wellbeing' }
];

export default function Layout({ children }) {
  const { region } = useRegion();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const links = () =>
    NAV.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => (isActive ? 'active' : '')}
        onClick={() => setMenuOpen(false)}
      >
        {item.label}
      </NavLink>
    ));

  return (
    <>
      <a href="#main" style={{ position: 'absolute', left: '-9999px' }}>
        Skip to content
      </a>

      <header className="site-header">
        <div className="container">
          <div className="bar">
            <Link to="/" className="logo">rebound</Link>
            <nav className="desktop" aria-label="Main navigation">{links()}</nav>
            <div className="hdr-right">
              <button className="region-btn" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
                {region.flag} <span className="rname">{region.fullName}</span> <span className="chev">▼</span>
              </button>
              <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen}>
                ☰
              </button>
            </div>
          </div>
          <nav className={`mobile${menuOpen ? ' open' : ''}`} aria-label="Mobile navigation">
            {links()}
          </nav>
        </div>
      </header>

      <main id="main" className="container" key={location.pathname}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="inner">
            <div>
              <strong>{brand.name.toLowerCase()}</strong> · {brand.tagline}
              <br />
              General information, not legal advice. The essentials are free. Ads never appear in
              the plan, checklist or wellbeing pages.
            </div>
            <div>
              <strong>{region.fullName} {region.flag}</strong> · rules checked {region.governance.lastChecked}
              <br />
              <a href={region.governance.sourceUrl} target="_blank" rel="noopener noreferrer">
                Official source
              </a>
              {' · '}
              <Link to="/talk">Request a callback</Link>
              {' · '}
              <Link to="/about">About & privacy</Link>
            </div>
            <button
              className="mode-switch"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="knob">{theme === 'light' ? 'L' : 'D'}</span>
            </button>
          </div>
        </div>
      </footer>

      {pickerOpen && <RegionPicker onClose={() => setPickerOpen(false)} />}
    </>
  );
}
