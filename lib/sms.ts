function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('SMS not configured — skipping send');
    return { ok: false, reason: 'not_configured' as const };
  }

  const normalized = normalizePhone(to);
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: normalized, From: from, Body: body }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Twilio error:', err);
    throw new Error('Failed to send SMS');
  }

  return { ok: true as const };
}

export async function sendSmsSafe(to: string | null | undefined, body: string) {
  if (!to) return { ok: false, reason: 'no_phone' as const };
  try {
    return await sendSms(to, body);
  } catch (err) {
    console.error('sendSmsSafe:', err);
    return { ok: false, reason: 'failed' as const };
  }
}
