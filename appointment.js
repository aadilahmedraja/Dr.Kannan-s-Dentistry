/**
 * POST /api/appointment
 *
 * Receives the booking form and relays it to the clinic's WhatsApp. The
 * visitor never sees WhatsApp — they get a confirmation on the page.
 *
 * Written for a Next.js App Router route handler. Rename to
 * app/api/appointment/route.js if that is where it is going; the
 * exported POST works unchanged. It is plain fetch, so it also runs on
 * Vercel/Netlify functions or any Node 18+ server with light edits.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT YOU NEED BEFORE THIS WORKS
 *
 * 1. A Meta Business account with the WhatsApp Business Platform
 *    enabled: developers.facebook.com → create an app → add WhatsApp.
 *
 * 2. A SENDER number registered to that app. It cannot be the number
 *    you are sending to — WhatsApp will not deliver a message from a
 *    number to itself. So:
 *       sender    = a new number registered on the Business Platform
 *       recipient = +91 90420 66006, the clinic's existing WhatsApp
 *
 * 3. An approved MESSAGE TEMPLATE. Any message a business sends
 *    outside a 24-hour reply window must use one Meta has approved.
 *    Create it under WhatsApp Manager → Message templates, category
 *    UTILITY, with eight {{1}}…{{8}} variables in the order used below.
 *
 * 4. These environment variables, never committed to the repo:
 *       WA_PHONE_NUMBER_ID   from the WhatsApp app dashboard
 *       WA_ACCESS_TOKEN      a permanent System User token
 *       WA_TEMPLATE_NAME     e.g. appointment_request
 *       WA_TO                919042066006
 *       RESEND_API_KEY       optional, for the email fallback
 *       CLINIC_EMAIL         optional, where the fallback lands
 *
 * If WhatsApp is not configured yet, set the email variables and the
 * route will deliver by email instead, so no enquiry is ever dropped.
 * ─────────────────────────────────────────────────────────────────────
 */

const REQUIRED = ['name', 'phone', 'email', 'treatment', 'type', 'date', 'slot', 'message'];

function clean(value, max = 600) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')          // WhatsApp template params reject newlines and tabs
    .trim()
    .slice(0, max);
}

function validate(body) {
  const out = {};
  const missing = [];

  for (const key of REQUIRED) {
    const v = clean(body[key]);
    if (!v) missing.push(key);
    out[key] = v;
  }
  if (missing.length) return { error: `Missing: ${missing.join(', ')}` };

  if (!/^[+()\d\s-]{8,20}$/.test(out.phone)) return { error: 'Phone number looks wrong' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(out.email)) return { error: 'Email looks wrong' };

  return { data: out };
}

async function sendWhatsApp(d) {
  const { WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN, WA_TEMPLATE_NAME, WA_TO } = process.env;
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN || !WA_TEMPLATE_NAME || !WA_TO) return false;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: WA_TO,
        type: 'template',
        template: {
          name: WA_TEMPLATE_NAME,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                d.name, d.phone, d.email, d.treatment,
                d.type, d.date, d.slot, d.message,
              ].map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
    },
  );

  if (!res.ok) {
    // Meta returns a useful error body; log it rather than swallowing it
    console.error('[appointment] WhatsApp send failed', res.status, await res.text());
    return false;
  }
  return true;
}

async function sendEmail(d) {
  const { RESEND_API_KEY, CLINIC_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CLINIC_EMAIL) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Website <bookings@your-domain.com>',   // must be a verified sender
      to: CLINIC_EMAIL,
      reply_to: d.email,
      subject: `Appointment — ${d.name}, ${d.date} ${d.slot}`,
      text: [
        `Name:       ${d.name}`,
        `Phone:      ${d.phone}`,
        `Email:      ${d.email}`,
        `Treatment:  ${d.treatment}`,
        `Type:       ${d.type}`,
        `Requested:  ${d.date} at ${d.slot}`,
        '',
        d.message,
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    console.error('[appointment] email send failed', res.status, await res.text());
    return false;
  }
  return true;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Send a JSON body.' }, { status: 400 });
  }

  // Validate again here. The checks in the browser are a convenience for
  // the visitor, not a control — anything can post to this URL.
  const { data, error } = validate(body);
  if (error) return Response.json({ error }, { status: 422 });

  // Try WhatsApp, fall back to email, so a misconfigured template does
  // not quietly lose an enquiry.
  const viaWhatsApp = await sendWhatsApp(data);
  const viaEmail = viaWhatsApp ? false : await sendEmail(data);

  if (!viaWhatsApp && !viaEmail) {
    console.error('[appointment] no delivery channel configured', {
      at: new Date().toISOString(),
      treatment: data.treatment,
    });
    return Response.json(
      { error: 'Could not deliver the request.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, via: viaWhatsApp ? 'whatsapp' : 'email' });
}
