import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { dispatch } from './handlers.js';
import { safeEqual } from './auth.js';
import { runDigest } from './digest.js';
import { metaEnabled, metaLeads, metaSigned, metaVerify } from './meta.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // The CRM is one HTML file with inline script/style plus Google Fonts.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", ...config.clientOrigins],
        },
      },
    }),
  );
  app.use(compression());
  if (config.clientOrigins.length) app.use('/api', cors({ origin: config.clientOrigins }));

  app.get('/api', (_req, res) => res.json({ ok: true, app: 'WAV CRM API', version: 3 }));

  // Daily email summary. Vercel Cron calls it with "Authorization: Bearer <CRON_SECRET>" (see vercel.json).
  app.get('/api/cron/digest', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || !safeEqual(req.get('authorization') || '', `Bearer ${secret}`)) return res.status(401).json({ ok: false });
    try {
      res.set('Cache-Control', 'no-store').json(await runDigest({ baseUrl: process.env.CRM_PUBLIC_URL || `https://${req.get('host')}` }));
    } catch (err) {
      console.error('[crm] digest failed:', err);
      res.status(500).json({ ok: false });
    }
  });

  // Meta Lead Ads webhook: GET is Meta's one-time check, POST delivers new leads (signed with the app secret).
  app.get('/api/meta', (req, res) => {
    const challenge = metaVerify(req.query);
    if (challenge === null) return res.status(403).send('Forbidden');
    res.type('text/plain').send(challenge);
  });
  app.post('/api/meta', express.raw({ type: () => true, limit: '1mb' }), async (req, res) => {
    if (!metaEnabled()) return res.status(404).json({ ok: false });
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!metaSigned(raw, req.get('x-hub-signature-256'))) return res.status(401).json({ ok: false });
    let body;
    try { body = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ ok: false }); }
    try {
      res.json({ ok: true, leads: await metaLeads(body) });
    } catch (err) {
      console.error('[crm] meta lead failed:', err.message);
      res.status(500).json({ ok: false }); // Meta retries later; leads are never created twice
    }
  });

  // The frontend posts JSON as text/plain (no CORS preflight), so read every body as text and parse it ourselves.
  app.post(
    '/api',
    rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false, message: { ok: false, error: 'Slow down', code: 'LOCKED' } }),
    express.text({ type: () => true, limit: '300kb' }),
    async (req, res) => {
      let body;
      try { body = JSON.parse(typeof req.body === 'string' && req.body ? req.body : '{}'); }
      catch { return res.json({ ok: false, error: 'Bad request', code: 'BAD' }); }
      try {
        res.json(await dispatch(body));
      } catch (err) {
        if (!err.code) console.error(err); // unexpected, not an ApiError
        // Always HTTP 200: the frontend treats any non-2xx as a network failure.
        res.json({ ok: false, error: err.code ? err.message : 'Server error', code: err.code || 'ERR' });
      }
    },
  );

  app.use(express.static(frontendDir, { index: 'index.html', extensions: ['html'] }));
  return app;
}
