// Vercel function: serves the Express app built by `npm run build:server` (dist/).
// vercel.json rewrites every /api/* request here; Express still sees the original path.
export { default } from '../dist/index.js';
