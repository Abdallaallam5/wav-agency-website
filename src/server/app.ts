import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { LeadStore } from './lib/leadStore.js';
import { apiRouter } from './routes/api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const publicDir = path.join(root, 'public');
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        // Dev only: helmet would otherwise force https on localhost.
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  }),
);
app.use(compression());
app.use(express.json({ limit: '20kb' }));

// Vercel's filesystem is read-only except /tmp (ephemeral) — leads are also logged there.
const leadsFile = process.env.VERCEL ? '/tmp/leads.json' : path.join(root, 'data', 'leads.json');
app.use('/api', apiRouter(new LeadStore(leadsFile)));
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.use(
  express.static(publicDir, {
    maxAge: isProd ? '7d' : 0,
    setHeaders(res, file) {
      if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }),
);

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'), (err) => {
    if (err && !res.headersSent) res.json({ ok: false, error: 'Not found' });
  });
});

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Something went wrong' });
};
app.use(onError);

export default app;
