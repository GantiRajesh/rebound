/**
 * Thin wrapper over localStorage.
 * - Single namespace so a future "clear my data" button is one call.
 * - All data stays on the user's device; nothing is ever sent anywhere.
 * - Swappable for an API-backed store when accounts arrive (see ROADMAP).
 */
const NS = 'rebound:';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* private browsing / quota. degrade silently */
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
