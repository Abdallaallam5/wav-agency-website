import type { ContactRequest, PulseSummary, Report } from '../shared/types';
import { api } from './api';
import { getLang, t } from './i18n';
import { LEADS_EMAIL, sendLeadEmail } from './leadEmail';

export function initContact(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const card = form.querySelector<HTMLElement>('[data-pulse-result]')!;
  const planInput = form.elements.namedItem('planId') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const select = form.elements.namedItem('service') as HTMLSelectElement;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const q = <T extends HTMLElement>(sel: string) => card.querySelector<T>(sel)!;

  let report: Report | null = null;
  // The meeting sentence we wrote ourselves, so we never overwrite something the visitor typed.
  let autoMessage = '';

  const setStatus = (msg: string, kind: 'ok' | 'err' | '' = '') => {
    status.textContent = msg;
    status.className = `form__status${kind ? ` is-${kind}` : ''}`;
  };

  const chips = (host: HTMLElement, items: string[]) => {
    host.replaceChildren(
      ...items.map((text) => {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
      }),
    );
  };

  function summary(r: Report): PulseSummary {
    return {
      score: r.score,
      level: r.levelLabel,
      findings: r.findings.map((f) => `${f.area}: ${f.headline}`),
      services: r.priorities.map((p) => p.name),
    };
  }

  /** Shows the pulse check result inside the form and prefills the meeting request. */
  function attach(r: Report) {
    report = r;
    planInput.value = r.planId;

    q('[data-pr-score]').textContent = String(r.score);
    q('[data-pr-momentum]').textContent = t('ui.momentum');
    q('[data-pr-kicker]').textContent = t('ui.pulseKicker');
    q('[data-pr-level]').textContent = `${t('ui.level')}: ${r.levelLabel}`;
    q('[data-pr-headline]').textContent = r.headline;
    q('[data-pr-findings-label]').textContent = t('ui.pulseFindings');
    q('[data-pr-services-label]').textContent = t('ui.pulseServices');
    q('[data-pr-note]').textContent = t('ui.pulseNote');
    q('[data-pr-remove]').setAttribute('aria-label', t('ui.pulseRemove'));
    chips(q('[data-pr-findings]'), r.findings.length ? r.findings.map((f) => f.headline) : [t('ui.pulseNone')]);
    chips(q('[data-pr-services]'), r.priorities.map((p) => p.name));
    card.hidden = false;

    // Meeting request text: only when the box is empty or still holds our previous sentence.
    const next = t('ui.meetingMessage');
    if (!message.value.trim() || message.value === autoMessage) message.value = next;
    autoMessage = next;

    // Preselect the service we'd start with, unless the visitor already chose one.
    const first = r.priorities[0]?.name;
    const match = Array.from(select.options).find((o) => o.textContent?.trim() === first);
    if (match && !select.value) select.value = match.value;
  }

  function detach() {
    report = null;
    planInput.value = '';
    card.hidden = true;
    if (message.value === autoMessage) message.value = '';
    autoMessage = '';
  }

  // The pulse check finished (or its language changed, or it restarted).
  document.addEventListener('wav:report', (e) => {
    const r = (e as CustomEvent<Report | null>).detail;
    if (r) attach(r);
    else detach();
  });

  // "Book a meeting about this" button on the result screen.
  document.addEventListener('wav:plan', (e) => {
    attach((e as CustomEvent<Report>).detail);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => (form.elements.namedItem('name') as HTMLInputElement).focus({ preventScroll: true }), 900);
  });

  q('[data-pr-remove]').addEventListener('click', detach);

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
      pulse: report ? summary(report) : undefined,
      website: data.website || undefined,
      lang: getLang(),
    };

    submit.disabled = true;
    setStatus(t('form.sending'));
    try {
      // Our own server saves the lead and emails it to the WAV inbox. If it could not send that email,
      // the browser uses the FormSubmit relay as a backup, so a lead is never lost.
      let mail: Promise<void> | null = null;
      const relay = () => (mail ??= payload.website ? Promise.resolve() : sendLeadEmail(payload));
      try {
        const res = await api.contact(payload);
        // The server already emailed it? Great. If not (no mail settings, or the mail server failed), use the relay.
        if (!res.emailed) relay().catch(() => undefined);
      } catch (err) {
        // The server rejected the fields themselves: show which one.
        const field = (err as { field?: string }).field;
        if (field) {
          (form.elements.namedItem(field) as HTMLElement | null)?.closest('.field')?.classList.add('is-invalid');
          setStatus(t('form.invalid'), 'err');
          return;
        }
        // Server unreachable: the email is our only copy, so wait for it.
        try {
          await relay();
        } catch {
          throw new Error(`Could not reach ${LEADS_EMAIL}`);
        }
      }

      form.reset();
      detach();
      setStatus(t('form.ok'), 'ok');
    } catch {
      setStatus(t('form.err'), 'err');
    } finally {
      submit.disabled = false;
    }
  });
}
