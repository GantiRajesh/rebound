/**
 * POST /api/issue-code : Stripe webhook target.
 * On checkout.session.completed, issues an access code bound to the buyer's
 * email and sends it with a magic link via Resend.
 *
 * Setup:
 *  1. Stripe dashboard → Developers → Webhooks → add endpoint
 *     https://yourdomain.com/api/issue-code for event checkout.session.completed.
 *  2. Env: CODE_SECRET, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, SITE_URL,
 *     REVIEW_DURATION_MINUTES (default 60), and `npm install stripe` for
 *     signature verification.
 *  3. Point the AI review's Stripe Payment Link at a product; buyer email is
 *     collected by Stripe Checkout automatically.
 */
import Stripe from 'stripe';
import { issueCode } from './_code.js';

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await rawBody(req),
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_details?.email;
    if (email) {
      const minutes = parseInt(process.env.REVIEW_DURATION_MINUTES || '60', 10);
      const code = issueCode(email, minutes);
      const link = `${process.env.SITE_URL}/review?code=${encodeURIComponent(code)}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Rebound <access@yourdomain.com>',
          to: email,
          subject: 'Your AI document review access code',
          text:
            `Thank you for your purchase.\n\n` +
            `Your access code: ${code}\n` +
            `Start here: ${link}\n\n` +
            `The code works only with this email address (${email}) and is valid for ${minutes} minutes from now. ` +
            `Your documents are processed for the session only and never stored.\n\n` +
            `If the code expires before you use it, reply to this email and we will reissue it.`
        })
      });
    }
  }

  return res.status(200).json({ received: true });
}
