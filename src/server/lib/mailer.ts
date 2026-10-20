import nodemailer, { type Transporter } from 'nodemailer';
import type { Lead } from './leadStore.js';

/**
 * Sends each new lead to the WAV inbox from our own server, over SMTP.
 *
 * Configured only through environment variables, so no secret ever lives in the code:
 *   SMTP_USER   the sending mailbox, e.g. wavagency.eg@gmail.com
 *   SMTP_PASS   a Google "App Password" for that mailbox (not the normal password)
 *   LEADS_TO    where to deliver leads (defaults to SMTP_USER)
 *   SMTP_HOST / SMTP_PORT / SMTP_SECURE   optional, default to Gmail (smtp.gmail.com:465, TLS)
 * Without SMTP_USER and SMTP_PASS this module does nothing and the site falls back to the email relay.
 */

let cached: Transporter | null | undefined;

function transport(): Transporter | null {
  if (cached !== undefined) return cached;
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return (cached = null);
  const port = Number(process.env.SMTP_PORT) || 465;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
  return cached;
}

export const mailEnabled = () => transport() !== null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** Single line, no control characters: safe for headers. */
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, ' ').trim();

export function buildLeadMail(lead: Lead) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact);
  const rows: [string, string][] = [
    ['Name', lead.name],
    ['Brand / company', lead.company ?? '-'],
    [isEmail ? 'Email' : 'Phone / WhatsApp', lead.contact],
    ['Interested in', lead.service ?? '-'],
    ['Message', lead.message ?? '-'],
    ['Language', lead.lang === 'ar' ? 'Arabic' : 'English'],
    ['Received', lead.receivedAt],
  ];
  if (lead.pulse) {
    rows.push(
      ['Pulse check', `${lead.pulse.score}/100 (${lead.pulse.level}) · plan ${lead.planId ?? '-'}`],
      ['Problems found', lead.pulse.findings.join('\n') || 'none'],
      ['We would start with', lead.pulse.services.join(', ')],
    );
  } else {
    rows.push(['Pulse check', 'did not take the check']);
  }

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 12px">New meeting request from the WAV website</h2>
<table style="border-collapse:collapse;width:100%;max-width:640px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f6f4fb;width:170px;vertical-align:top"><b>${esc(k)}</b></td><td style="padding:8px 12px;border:1px solid #ddd;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join('')}</table></div>`;

  return {
    subject: `WAV website: meeting request from ${oneLine(lead.name).slice(0, 80)}`,
    text,
    html,
    replyTo: isEmail ? lead.contact : undefined,
  };
}

/** Returns true only if the mail server accepted the message. Never throws. */
export async function mailLead(lead: Lead): Promise<boolean> {
  const tx = transport();
  if (!tx) return false;
  const user = process.env.SMTP_USER!;
  try {
    const mail = buildLeadMail(lead);
    await tx.sendMail({
      from: process.env.MAIL_FROM || `"WAV Website" <${user}>`,
      to: process.env.LEADS_TO || user,
      ...mail,
    });
    return true;
  } catch (err) {
    console.error('[mail] could not send lead:', (err as Error).message);
    return false;
  }
}
