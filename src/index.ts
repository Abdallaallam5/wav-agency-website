// Vercel entrypoint: Vercel detects src/index.ts and serves the default-exported Express app.
// Locally, run 'npm run dev' (src/server/index.ts) instead.
import app from './server/app.js';

export default app;
