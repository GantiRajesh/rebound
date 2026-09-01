/**
 * Stateless access codes for the AI document review. No database needed.
 * A code encodes its own expiry and is bound to the buyer's email:
 *
 *   code = RBD-<expiryBase36>-<emailHash>-<signature>
 *
 * The signature is an HMAC over expiry+email using CODE_SECRET, so codes
 * cannot be forged, transferred to another email, or extended.
 * Set CODE_SECRET in your hosting env (any long random string).
 */
import crypto from 'node:crypto';

const norm = (email) => String(email || '').trim().toLowerCase();

export function issueCode(email, durationMinutes) {
  const expiry = Date.now() + durationMinutes * 60000;
  const exp36 = expiry.toString(36).toUpperCase();
  const emailHash = crypto.createHash('sha256').update(norm(email)).digest('hex').slice(0, 6).toUpperCase();
  const sig = crypto
    .createHmac('sha256', process.env.CODE_SECRET)
    .update(`${exp36}.${norm(email)}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `RBD-${exp36}-${emailHash}-${sig}`;
}

export function verifyCode(code, email) {
  try {
    const [prefix, exp36, emailHash, sig] = String(code).trim().toUpperCase().split('-');
    if (prefix !== 'RBD') return { ok: false, error: 'Invalid code format.' };
    const expiry = parseInt(exp36, 36);
    if (!expiry || expiry < Date.now()) return { ok: false, error: 'This code has expired.' };
    const expectHash = crypto.createHash('sha256').update(norm(email)).digest('hex').slice(0, 6).toUpperCase();
    if (emailHash !== expectHash) return { ok: false, error: 'This code belongs to a different email address.' };
    const expectSig = crypto
      .createHmac('sha256', process.env.CODE_SECRET)
      .update(`${exp36}.${norm(email)}`)
      .digest('hex')
      .slice(0, 10)
      .toUpperCase();
    if (sig !== expectSig) return { ok: false, error: 'Invalid code.' };
    return { ok: true, expiresAt: expiry };
  } catch {
    return { ok: false, error: 'Invalid code.' };
  }
}
