/**
 * POST /api/validate-code   { code, email } → { ok, expiresAt } | { ok:false, error }
 * Vercel serverless function (deploys automatically from the api/ folder).
 * Env required: CODE_SECRET
 */
import { verifyCode } from './_code.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  const { code, email } = req.body || {};
  const result = verifyCode(code, email);
  return res.status(result.ok ? 200 : 401).json(result);
}
