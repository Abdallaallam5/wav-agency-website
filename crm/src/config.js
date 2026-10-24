import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Read backend/.env no matter which folder the server is started from.
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  // Always a dedicated database, whatever name the URI carries, so we never touch another app's collections.
  mongoDb: process.env.MONGO_DB || 'wav-crm',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminName: process.env.ADMIN_NAME || 'Admin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  secret: process.env.JWT_SECRET || '',
  websiteKey: process.env.WEBSITE_KEY || '',
  clientOrigins: list(process.env.CLIENT_ORIGIN),
  tokenDays: 14,
};

// Collections the frontend syncs, and which roles may touch money.
export const COLLECTIONS = ['leads', 'clients', 'projects', 'tasks', 'content', 'invoices', 'activity', 'results', 'adfunds', 'proposals'];
// Money collections: only admins and managers can read or change them.
export const FINANCE_ONLY = ['invoices', 'adfunds'];
export const FINANCE_ROLES = ['admin', 'manager'];
export const ROLES = ['admin', 'manager', 'member'];

export const DEFAULT_SETTINGS = {
  agency: 'WAV Marketing Agency',
  currency: 'EGP',
  vat: 14,
  address: 'Egypt',
  invPrefix: 'WAV',
  website: 'www.wavagency.com',
};
export const SETTINGS_KEYS = ['agency', 'currency', 'vat', 'address', 'phone', 'email', 'taxId', 'invPrefix', 'website', 'hourCost'];
