import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { DiagnosticPayload, Lang } from '../../shared/types.js';
import { getQuestions } from '../../shared/diagnostic.js';
import type { LeadStore } from '../lib/leadStore.js';
import { sendToCrm } from '../lib/crm.js';
import { mailLead } from '../lib/mailer.js';
import { ReportError, buildReport } from '../../shared/report.js';

const langSchema = z.enum(['en', 'ar']).catch('en');

const reportSchema = z.object({
  lang: langSchema,
  answers: z
    .array(z.object({ questionId: z.string().max(40), answerId: z.string().max(40) }))
    .min(1)
    .max(20),
});

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .refine((v) => !/[\r\n]/.test(v), 'One line only'),
  company: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !/[\r\n]/.test(v), 'One line only')
    .optional(),
  contact: z
    .string()
    .trim()
    .min(5)
    .max(120)
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[\d\s()-]{7,20}$/.test(v),
      'Enter a valid email or phone number',
    ),
  service: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  planId: z.string().trim().max(20).optional(),
  pulse: z
    .object({
      score: z.number().int().min(0).max(100),
      level: z.string().trim().max(40),
      findings: z.array(z.string().trim().max(200)).max(10),
      services: z.array(z.string().trim().max(80)).max(5),
    })
    .optional(),
  lang: langSchema.optional(),
  website: z.string().max(0).optional(), // honeypot
});

export function apiRouter(leads: LeadStore): Router {
  const router = Router();

  const writeLimiter = rateLimit({
    windowMs: 60_000,
    limit: 8,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests — try again in a minute.' },
  });

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.get('/diagnostic', (req, res) => {
    const lang: Lang = langSchema.parse(req.query.lang);
    const payload: DiagnosticPayload = { lang, questions: getQuestions(lang) };
    res.set('Cache-Control', 'public, max-age=300').json(payload);
  });

  router.post('/diagnostic/report', writeLimiter, (req, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'Invalid answers' });
      return;
    }
    try {
      res.json({ ok: true, report: buildReport(parsed.data) });
    } catch (err) {
      if (err instanceof ReportError) {
        res.status(400).json({ ok: false, error: err.message });
        return;
      }
      throw err;
    }
  });

  router.post('/contact', writeLimiter, async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      res.status(400).json({ ok: false, error: 'Please check the form.', field });
      return;
    }
    const { website: _honeypot, ...data } = parsed.data;
    const lead = { id: randomUUID(), receivedAt: new Date().toISOString(), ip: req.ip, ...data };

    // Three copies, so a lead is never lost: our own store/log, an email to the WAV inbox, and the CRM.
    // Both are awaited: on Vercel the function may be frozen as soon as the response is sent.
    const [stored, emailed, inCrm] = await Promise.all([
      leads.add(lead).then(
        () => true,
        (err) => {
          console.error('[lead] could not store:', (err as Error).message);
          return false;
        },
      ),
      mailLead(lead),
      sendToCrm(lead),
    ]);
    if (!stored && !emailed && !inCrm) {
      res.status(500).json({ ok: false, error: 'Could not save your request.' });
      return;
    }
    // emailed=false tells the browser to fall back to the email relay.
    res.status(201).json({ ok: true, emailed });
  });

  return router;
}
