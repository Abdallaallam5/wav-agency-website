// Vercel entrypoint: Vercel serves the default-exported Express app.
// Its detection looks for a file that imports express, hence the import below.
// Locally, run 'npm run dev' (src/server/index.ts) instead.
import type { Express } from 'express';
import app from './server/app.js';

export default app satisfies Express;
