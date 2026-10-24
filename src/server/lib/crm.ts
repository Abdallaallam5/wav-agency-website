import type { Lead } from './leadStore.js';

/**
 * Forwards each new lead to the WAV CRM (crm/backend) as a `websiteLead` call.
 *
 * Environment variables:
 *   CRM_URL           base URL of the CRM backend, e.g. https://crm.wavagency.com (no trailing /api)
 *   CRM_WEBSITE_KEY   the CRM's website key (printed in its log on first start, or WEBSITE_KEY in its .env)
 * Without both, this module does nothing. The call is made from our server so the key never reaches a browser.
 */

export const crmEnabled = () => Boolean(process.env.CRM_URL && process.env.CRM_WEBSITE_KEY);

/** The CRM keeps one free-text "notes" field, so the context a salesperson needs goes there. */
function notesFor(lead: Lead): string {
  const parts: string[] = [];
  if (lead.message) parts.push(lead.message);
  if (lead.service) parts.push(`Service: ${lead.service}`);
  if (lead.pulse) {
    parts.push(`Pulse check: ${lead.pulse.score}/100 (${lead.pulse.level})`);
    if (lead.pulse.findings.length) parts.push(`Problems: ${lead.pulse.findings.join('; ')}`);
    if (lead.pulse.services.length) parts.push(`Start with: ${lead.pulse.services.join(', ')}`);
  }
  return parts.join('\n').slice(0, 2000);
}

/** Resolves true when the CRM accepted the lead. Never throws: a CRM outage must not fail the visitor's form. */
export async function sendToCrm(lead: Lead): Promise<boolean> {
  if (!crmEnabled()) return false;
  const url = `${process.env.CRM_URL!.replace(/\/+$/, '')}/api`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      // text/plain, like the CRM's own frontend.
      body: JSON.stringify({
        action: 'websiteLead',
        key: process.env.CRM_WEBSITE_KEY,
        name: lead.name,
        contact: lead.contact,
        company: lead.company,
        service: lead.service,
        message: notesFor(lead),
        planId: lead.planId,
        pulseScore: lead.pulse?.score,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const body = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !body.ok) {
      console.error('[crm] lead rejected:', body.error ?? res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[crm] could not send lead:', (err as Error).message);
    return false;
  }
}
