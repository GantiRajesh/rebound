import { monetisation } from '../config/monetisation';
import { load, save } from './storage';

/**
 * Form submission with a graceful fallback.
 * Works with Web3Forms (endpoint + accessKey), Formspree (endpoint only),
 * or any API that accepts a JSON POST.
 * If nothing is configured, the submission is stored on the device and the
 * caller is told, so the UI can be honest that no one has received it yet.
 *
 * Returns { ok, delivered, error }:
 *   delivered=true            the form service accepted it
 *   delivered=false, error    a service is configured but the send failed
 *                             (network, blocked request, rejected key)
 *   delivered=false, no error nothing is configured; kept on this device only
 */
export async function submitForm(kind, answers) {
  const { endpoint, accessKey } = monetisation.forms;
  const isWeb3Forms = (endpoint || '').includes('web3forms.com');
  const configured = Boolean(endpoint) && (!isWeb3Forms || Boolean(accessKey));

  const payload = {
    kind,
    subject: `LetusRestart website: new ${kind === 'callback' ? 'callback request' : kind.replace('-', ' ')}`,
    ...answers,
    submittedAt: new Date().toISOString()
  };
  if (isWeb3Forms && accessKey) {
    payload.access_key = accessKey;
    payload.from_name = 'LetusRestart';
  }

  if (configured) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });

      // Web3Forms replies with JSON { success, message }. Formspree and others
      // may not, so fall back to the HTTP status when there is no JSON body.
      let body = null;
      try { body = await res.json(); } catch { /* not JSON */ }
      const ok = res.ok && (body && typeof body.success === 'boolean' ? body.success : true);

      if (!ok && typeof console !== 'undefined') {
        console.error('Form submission rejected:', res.status, body && body.message);
      }
      return { ok, delivered: ok, error: !ok };
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Form submission failed:', e);
      return { ok: false, delivered: false, error: true };
    }
  }

  const all = load('submissions', []);
  all.push(payload);
  save('submissions', all);
  return { ok: true, delivered: false, error: false };
}
