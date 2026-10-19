const DEFAULT_TO = 'adhilshahid@gmail.com';
const DEFAULT_FROM = 'Portfolio Contact <onboarding@resend.dev>';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: real visitors never see this field, so anything in it is a bot.
  if (field(body.company, 200)) {
    return Response.json({ ok: true });
  }

  const name = field(body.name, 100).replace(/[\r\n]+/g, ' ');
  const email = field(body.email, 200);
  const message = field(body.message, 5000);

  if (!name) {
    return Response.json({ error: 'Add your name.' }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (message.length < 10) {
    return Response.json(
      { error: 'Write at least a sentence so I know how to help.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [process.env.CONTACT_TO_EMAIL || DEFAULT_TO],
        reply_to: email,
        subject: `${name} via portfolio`,
        text: `${message}\n\n—\n${name} <${email}>`,
      }),
    });

    if (!res.ok) {
      console.error('Contact form: Resend responded', res.status, await res.text());
      return Response.json({ error: 'send_failed' }, { status: 502 });
    }
  } catch (err) {
    console.error('Contact form: could not reach Resend', err);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }

  return Response.json({ ok: true });
}
