import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { dispatch } from './handlers.js';

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

  app.get('/api', (_req, res) => res.json({ ok: true, app: 'WAV CRM API', version: 2 }));

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
