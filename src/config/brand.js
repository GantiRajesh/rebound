/**
 * BRAND CONFIG. The single place to rename or re-theme the whole platform.
 * Two palettes (light + dark), simple solid colours. The user switches in
 * the footer and the choice persists. Applied as CSS variables at runtime.
 */
export const brand = {
  name: 'Rebound',
  tagline: 'Clear guidance from job loss to your next role.',
  supportEmail: 'hello@rebound.example',
  radius: '14px',
  maxWidth: '1060px',
  themes: {
    light: {
      bg: '#f6f6f4',
      surface: '#ffffff',
      surface2: '#f0f0ee',
      border: '#e3e3e0',
      text: '#1e2229',
      soft: '#5f6570',
      accent: '#4f46e5',
      accentDark: '#4038c7',
      teal: '#0f9d8f',
      amber: '#b45309',
      red: '#dc2626',
      green: '#15803d',
      onAccent: '#ffffff',
      shadow: '0 1px 3px rgba(30,34,41,.07)'
    },
    dark: {
      bg: '#111318',
      surface: '#1a1d24',
      surface2: '#22262f',
      border: '#2a2e38',
      text: '#eef0f4',
      soft: '#9aa1ad',
      accent: '#818cf8',
      accentDark: '#6d79f0',
      teal: '#2dd4bf',
      amber: '#fbbf24',
      red: '#f87171',
      green: '#4ade80',
      onAccent: '#111318',
      shadow: '0 1px 3px rgba(0,0,0,.4)'
    }
  }
};
