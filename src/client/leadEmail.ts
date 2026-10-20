import type { ContactRequest } from '../shared/types';

/** Where every meeting request is delivered. */
export const LEADS_EMAIL = 'wavagency.eg@gmail.com';

/**
 * Delivers a lead to the WAV inbox through FormSubmit (https://formsubmit.co).
 * It has to run in the browser: the service rejects calls that don't come from a web page.
 * The first request ever sent triggers an activation email to LEADS_EMAIL; after the owner
 * clicks "Activate" there, every later request lands in the inbox.
 */
export async function sendLeadEmail(lead: ContactRequest): Promise<void> {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact);
  const res = await fetch(`https://formsubmit.co/ajax/${LEADS_EMAIL}`, {
    method: 'POST',
    // The relay can be slow; never keep the visitor waiting on it.
    signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `WAV website: meeting request from ${lead.name}`,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      name: lead.name,
      company: lead.company ?? '-',
      [isEmail ? 'email' : 'phone']: lead.contact,
      interested_in: lead.service ?? '-',
      message: lead.message ?? '-',
      pulse_plan: lead.planId ?? '-',
      pulse_result: lead.pulse
        ? `${lead.pulse.score}/100 (${lead.pulse.level}) — Problems: ${lead.pulse.findings.join(' | ') || 'none'} — We'd start with: ${lead.pulse.services.join(', ')}`
        : 'did not take the pulse check',
      language: lead.lang ?? 'en',
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: string | boolean };
  if (!res.ok || body.success === 'false' || body.success === false) throw new Error('Email relay rejected the lead');
}
