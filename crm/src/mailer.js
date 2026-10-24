import nodemailer from 'nodemailer';

/**
 * Email from the CRM (client answers on the portal, the daily summary).
 * Same variables as the website, so one Gmail App Password serves both:
 *   SMTP_USER, SMTP_PASS                 required
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE    optional, default Gmail (smtp.gmail.com:465)
 * Without SMTP_USER and SMTP_PASS nothing is sent.
 */
let cached;
function transport() {
  if (cached !== undefined) return cached;
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return (cached = null);
  const port = Number(process.env.SMTP_PORT) || 465;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return cached;
}

export const mailEnabled = () => transport() !== null;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const oneLine = (s) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 180);

/** A simple branded, right-to-left email shell. `body` is already-escaped HTML. */
export function mailHTML(title, body, link) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f4f1fa;font-family:Tahoma,Arial,sans-serif;color:#151021">
<div style="max-width:560px;margin:0 auto;padding:24px 14px">
<div style="background:#07060b;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px"><div style="letter-spacing:.4em;font-size:12px;color:#a69fbd" dir="ltr">W&Lambda;V CRM</div><h1 style="margin:8px 0 0;font-size:20px">${title}</h1></div>
<div style="height:5px;background:linear-gradient(100deg,#5b2bff,#8b3dff 45%,#e07bff)"></div>
<div style="background:#fff;border-radius:0 0 16px 16px;padding:20px 24px;line-height:1.8;font-size:14px">${body}
${link ? `<p style="margin:22px 0 0"><a href="${esc(link)}" style="display:inline-block;background:#8b3dff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:bold">افتح الـ CRM</a></p>` : ''}</div></div></body></html>`;
}

/** Resolves true when sent. Never throws: email must never break the request that triggered it. */
export async function sendMail({ to, subject, html }) {
  const tx = transport();
  if (!tx || !to) return false;
  try {
    await tx.sendMail({ from: `"WAV CRM" <${process.env.SMTP_USER}>`, to, subject: oneLine(subject), html });
    return true;
  } catch (err) {
    console.error('[crm] email failed:', err.message);
    return false;
  }
}
