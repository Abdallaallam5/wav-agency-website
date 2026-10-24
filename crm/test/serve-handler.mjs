// Runs api/index.js (the Vercel entrypoint) behind a plain Node server, to test the serverless path locally.
//   node test/serve-handler.mjs   ->  http://localhost:4010/api
import { createServer } from 'node:http';
import handler from '../api/index.js';

createServer((req, res) => handler(req, res)).listen(4010, () => console.log('handler on http://localhost:4010/api'));
