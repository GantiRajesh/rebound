/**
 * POST /api/review : the AI document analysis.
 * Auth: headers x-review-code + x-review-email (verified, expiring, per-user).
 * Privacy: documents are held in memory for this request only. They are not
 * written to disk, logged, or stored. The Anthropic API is called with
 * retention disabled by default for API traffic; do not add logging here.
 *
 * Env required: CODE_SECRET, ANTHROPIC_API_KEY
 * Notes: PDF and DOCX text extraction runs client-side or can be added here
 * with pdf-parse / mammoth. This scaffold accepts plain text parts and the
 * pasted field, which covers .txt and .eml directly.
 */
import { verifyCode } from './_code.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const auth = verifyCode(req.headers['x-review-code'], req.headers['x-review-email']);
  if (!auth.ok) return res.status(401).json(auth);

  const { pasted = '', texts = [], region = 'au' } = req.body || {};
  const material = [pasted, ...texts].filter(Boolean).join('\n\n---\n\n').slice(0, 150000);
  if (!material.trim()) return res.status(400).json({ ok: false, error: 'No readable document content received.' });

  const prompt = `You are reviewing redundancy/termination documents for an employee in ${
    region === 'uk' ? 'the United Kingdom' : 'Australia'
  }. Ground every claim in the official minimum entitlements for that country. Analyse the documents below and return STRICT JSON with keys:
  summary (string, 3-4 sentences),
  good (array of strings: what appears correct/standard),
  validate (array of strings: items to verify before signing, each concrete and actionable),
  extras (array of strings: possible additional entitlements not mentioned in the documents),
  questions (array of strings: questions to put to HR in writing),
  deadlineNote (string: one sentence on any relevant challenge deadline).
Be specific to what the documents actually say. Never invent figures. This is general information, not legal advice.

DOCUMENTS:
${material}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!r.ok) return res.status(502).json({ ok: false, error: 'Analysis service unavailable. Nothing was stored.' });
  const data = await r.json();
  try {
    const text = data.content[0].text;
    const analysis = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return res.status(200).json({ ok: true, analysis });
  } catch {
    return res.status(502).json({ ok: false, error: 'Could not parse the analysis. Nothing was stored. Try again.' });
  }
}
