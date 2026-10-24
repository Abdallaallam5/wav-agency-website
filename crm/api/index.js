// Vercel entrypoint: every /api request lands here. The static frontend is served by Vercel's CDN (see vercel.json).
import { createApp } from '../src/app.js';
import { init } from '../src/init.js';

const app = createApp();

export default async function handler(req, res) {
  try {
    await init();
  } catch (err) {
    console.error('[crm] startup failed:', err.message);
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Server is starting, try again', code: 'NET' }));
    return;
  }
  return app(req, res);
}
