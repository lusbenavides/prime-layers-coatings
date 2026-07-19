import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function escapeHtml(str?: string) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

export async function sendLeadEmail({
  source,
  name,
  email,
  phone,
  projectType,
  description,
}: {
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  description?: string;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD');
    return;
  }

  const to = process.env.COMPANY_EMAIL || process.env.GMAIL_USER;
  const sourceLabel = source === 'chatbot' ? 'Chat con Ava' : 'Formulario de cotización';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1a2332;">
      <h2 style="color:#0c1e32; margin-bottom:4px;">Nueva cotización — ${escapeHtml(sourceLabel)}</h2>
      <p style="color:#888; font-size:12px; margin-top:0;">Prime Layer Coatings LLC · Sitio web</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px 0; font-weight:bold; width:150px; border-bottom:1px solid #eee;">Nombre</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${escapeHtml(name) || '—'}</td></tr>
        <tr><td style="padding:8px 0; font-weight:bold; border-bottom:1px solid #eee;">Teléfono</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${escapeHtml(phone) || '—'}</td></tr>
        <tr><td style="padding:8px 0; font-weight:bold; border-bottom:1px solid #eee;">Email</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${escapeHtml(email) || '—'}</td></tr>
        <tr><td style="padding:8px 0; font-weight:bold; border-bottom:1px solid #eee;">Tipo de proyecto</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${escapeHtml(projectType) || '—'}</td></tr>
        <tr><td style="padding:8px 0; font-weight:bold; vertical-align:top;">Descripción</td><td style="padding:8px 0; white-space:pre-wrap;">${escapeHtml(description) || '—'}</td></tr>
      </table>
      <p style="margin-top:24px; color:#999; font-size:11px;">Recibido el ${new Date().toLocaleString('es-US', { timeZone: 'America/Los_Angeles' })}</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Prime Layer Coatings — Web" <${process.env.GMAIL_USER}>`,
    to,
    replyTo: email || undefined,
    subject: `🎨 Nueva cotización — ${name || 'Cliente'} (${sourceLabel})`,
    html,
  });
}

export async function sendEstimateEmail({
  clientName,
  clientEmail,
  title,
  total,
  validUntil,
  items,
  printUrl,
}: {
  clientName: string;
  clientEmail: string;
  title: string;
  total: string;
  validUntil?: string | null;
  items: { description: string; quantity: number; unit_price: number }[];
  printUrl: string;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Email not configured');
  }

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(i.description)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${Number(i.unit_price).toFixed(2)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${(i.quantity * i.unit_price).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a2332;">
      <h2 style="color:#0c1e32;">Your Estimate from Prime Layer Coatings</h2>
      <p>Hi ${escapeHtml(clientName)},</p>
      <p>Thank you for your interest! Here is your estimate for <strong>${escapeHtml(title)}</strong>.</p>
      ${validUntil ? `<p style="color:#666;font-size:14px;">Valid until: ${escapeHtml(validUntil)}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <thead>
          <tr style="border-bottom:2px solid #0c1e32;color:#666;font-size:12px;text-transform:uppercase;">
            <th style="padding:8px 0;text-align:left;">Description</th>
            <th style="padding:8px 0;text-align:right;">Qty</th>
            <th style="padding:8px 0;text-align:right;">Price</th>
            <th style="padding:8px 0;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:20px;font-weight:bold;color:#0c1e32;">Total: <span style="color:#c8922a;">${escapeHtml(total)}</span></p>
      <p style="margin:24px 0;">
        <a href="${printUrl}" style="background:#c8922a;color:#0c1e32;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
          View Full Estimate
        </a>
      </p>
      <p style="color:#666;font-size:14px;">Questions? Call us at 725-318-1411 or reply to this email.</p>
      <p style="color:#999;font-size:11px;margin-top:24px;">Prime Layer Coatings LLC · Licensed & Insured · Las Vegas, NV</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Prime Layer Coatings" <${process.env.GMAIL_USER}>`,
    to: clientEmail,
    replyTo: process.env.COMPANY_EMAIL || process.env.GMAIL_USER,
    subject: `Your Painting Estimate — ${title}`,
    html,
  });
}
