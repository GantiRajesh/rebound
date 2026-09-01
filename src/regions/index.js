/**
 * REGION REGISTRY
 * Adding a country = add its JSON file (copy the schema of au.json/uk.json),
 * import it, add one line to `regions`, and remove it from COMING_SOON.
 * Nothing else changes. See docs/UPDATING.md → "Adding a new region".
 */
import au from './au.json';
import uk from './uk.json';

export const regions = { au, uk };

/** Shown greyed-out in the country picker so users know what's planned. */
export const COMING_SOON = [
  { id: 'ca', fullName: 'Canada', flag: '🇨🇦' },
  { id: 'nz', fullName: 'New Zealand', flag: '🇳🇿' },
  { id: 'ie', fullName: 'Ireland', flag: '🇮🇪' },
  { id: 'us', fullName: 'United States', flag: '🇺🇸' },
  { id: 'in', fullName: 'India', flag: '🇮🇳' },
  { id: 'sg', fullName: 'Singapore', flag: '🇸🇬' }
];

export const DEFAULT_REGION = 'au';

/**
 * Best-effort auto-detection from the browser (locale + timezone).
 * Never trusted blindly. The user can always override via the country
 * picker, and the choice is confirmed visibly in the header.
 */
export function detectRegion() {
  try {
    const locale = (navigator.language || '').toLowerCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (locale.endsWith('-au') || tz.startsWith('Australia/')) return 'au';
    if (locale.endsWith('-gb') || tz === 'Europe/London') return 'uk';
  } catch {
    /* fall through */
  }
  return DEFAULT_REGION;
}
