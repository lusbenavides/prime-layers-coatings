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
