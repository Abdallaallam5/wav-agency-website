import type { ContactRequest, Report } from '../shared/types';
import { api } from './api';
import { LEADS_EMAIL, sendLeadEmail } from './leadEmail';
import { getLang, t } from './i18n';

export function initContact(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const chip = form.querySelector<HTMLElement>('[data-plan-chip]')!;
  const chipText = chip.querySelector<HTMLElement>('[data-plan-text]')!;
  const planInput = form.elements.namedItem('planId') as HTMLInputElement;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;

  const setStatus = (msg: string, kind: 'ok' | 'err' | '' = '') => {
    status.textContent = msg;
    status.className = `form__status${kind ? ` is-${kind}` : ''}`;
  };

  // A finished pulse check can be attached to the enquiry.
  document.addEventListener('wav:plan', (e) => {
    const report = (e as CustomEvent<Report>).detail;
    planInput.value = report.planId;
    chipText.textContent = t('ui.planAttached', {
      id: report.planId,
      score: report.score,
      services: report.priorities.map((p) => p.name).join(', '),
    });
    chip.hidden = false;

    const message = form.elements.namedItem('message') as HTMLTextAreaElement;
    if (!message.value.trim() && report.findings.length) {
      message.value = t('ui.planMessage', { findings: report.findings.map((f) => f.headline).join(' · ') });
    }
    const select = form.elements.namedItem('service') as HTMLSelectElement;
    const first = report.priorities[0]?.name;
    const match = Array.from(select.options).find((o) => o.textContent?.trim() === first);
    if (match) select.value = match.value;

    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => (form.elements.namedItem('name') as HTMLInputElement).focus({ preventScroll: true }), 900);
  });

  chip.querySelector('[data-plan-remove]')!.addEventListener('click', () => {
    planInput.value = '';
    chip.hidden = true;
  });

  form.addEventListener('input', (e) => {
    (e.target as HTMLElement).closest('.field')?.classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const invalid = (['name', 'contact'] as const).filter((k) => {
      const v = (data[k] ?? '').trim();
      if (k === 'name') return v.length < 2;
      return !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[\d\s()-]{7,20}$/.test(v));
    });
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
    if (invalid.length) {
      invalid.forEach((k) => (form.elements.namedItem(k) as HTMLElement).closest('.field')?.classList.add('is-invalid'));
      setStatus(t('form.invalid'), 'err');
      (form.elements.namedItem(invalid[0]) as HTMLElement).focus();
      return;
    }

    const payload: ContactRequest = {
      name: data.name.trim(),
      contact: data.contact.trim(),
      company: data.company?.trim() || undefined,
      service: data.service || undefined,
      message: data.message?.trim() || undefined,
      planId: data.planId || undefined,
      website: data.website || undefined,
      lang: getLang(),
    };

    submit.disabled = true;
    setStatus(t('form.sending'));
    try {
      // Two independent channels, so a lead is never lost:
      //  1. our own API (validation, spam check, logged on the server)
      //  2. the email relay that delivers it to the WAV inbox
      const [server, mail] = await Promise.allSettled([api.contact(payload), payload.website ? Promise.resolve() : sendLeadEmail(payload)]);

      // The server rejected the fields themselves: show which one.
      if (server.status === 'rejected') {
        const field = (server.reason as { field?: string }).field;
        if (field) {
          (form.elements.namedItem(field) as HTMLElement | null)?.closest('.field')?.classList.add('is-invalid');
          setStatus(t('form.invalid'), 'err');
          return;
        }
      }
      if (server.status === 'rejected' && mail.status === 'rejected') throw new Error(`Could not reach ${LEADS_EMAIL}`);

      form.reset();
      chip.hidden = true;
      setStatus(t('form.ok'), 'ok');
    } catch {
      setStatus(t('form.err'), 'err');
    } finally {
      submit.disabled = false;
    }
  });
}
