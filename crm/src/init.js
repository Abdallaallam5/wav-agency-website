import mongoose from 'mongoose';
import { setSecret } from './auth.js';
import { config } from './config.js';
import { bootstrapData } from './handlers.js';

mongoose.set('strictQuery', true);

let ready;

/**
 * Connects to MongoDB and runs first-run setup, once per process. A serverless instance calls this on
 * every request and reuses the same connection while it stays warm; a failed attempt is retried next time.
 */
export function init() {
  ready ??= (async () => {
    await mongoose.connect(config.mongoUri, { dbName: config.mongoDb, maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    await bootstrapData();
    setSecret(config.secret);
    console.log(`[crm] MongoDB connected: ${mongoose.connection.name}`);
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}
