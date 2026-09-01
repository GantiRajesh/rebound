import { monetisation } from '../config/monetisation';
import { load, save } from './storage';

/**
 * Form submission with a graceful fallback.
 * Works with Web3Forms (endpoint + accessKey), Formspree (endpoint only),
 * or any API that accepts a JSON POST.
 * If nothing is configured, the submission is stored on the device and the
 * caller is told, so the UI can be honest that no one has received it yet.
 * Returns { ok, delivered } where delivered=false means local-only mode.
 */
export async function submitForm(kind, answers) {
  const { endpoint, accessKey } = monetisation.forms;
  const isWeb3Forms = (endpoint || '').includes('web3forms.com');
  const configured = Boolean(endpoint) && (!isWeb3Forms || Boolean(accessKey));

  const payload = {
    kind,
    subject: `Rebound website: new ${kind === 'callback' ? 'callback request' : kind.replace('-', ' ')}`,
    ...answers,
    submittedAt: new Date().toISOString()
  };
  if (isWeb3Forms && accessKey) {
    payload.access_key = accessKey;
    payload.from_name = 'Rebound website';
  }

  if (configured) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const ok = res.ok;
      return { ok, delivered: ok };
    } catch {
      return { ok: false, delivered: false };
    }
  }

  const all = load('submissions', []);
  all.push(payload);
  save('submissions', all);
  return { ok: true, delivered: false };
}
