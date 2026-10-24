import mongoose from 'mongoose';
import { COLLECTIONS } from './config.js';

const { Schema, model } = mongoose;

/**
 * CRM records (leads, clients, projects, ...) are free-form documents: the frontend
 * adds fields over time, so the schema is open. `_id` is the record id the browser made.
 * Timestamps stay ISO strings because the sync protocol compares them as strings.
 */
function recordModel(name) {
  const schema = new Schema(
    { _id: String, createdAt: String, updatedAt: { type: String, index: true }, createdBy: String, updatedBy: String },
    { strict: false, versionKey: false, minimize: false },
  );
  return model(name, schema, name);
}

export const Records = Object.fromEntries(COLLECTIONS.map((c) => [c, recordModel(c)]));

const userSchema = new Schema(
  {
    _id: String,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
    dept: { type: String, default: '' },
    title: { type: String, default: '' },
    color: { type: String, default: '#8b3dff' },
    active: { type: Boolean, default: true },
    passwordHash: { type: String, select: false },
    salt: { type: String, select: false },
    tv: { type: Number, default: 0 }, // token version: bumping it signs the user out everywhere
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false },
);
export const User = model('User', userSchema, 'users');

// Tombstones, so other browsers learn a record was deleted.
const deletedSchema = new Schema(
  { id: { type: String, required: true }, coll: { type: String, required: true }, updatedAt: { type: String, index: true } },
  { versionKey: false },
);
deletedSchema.index({ coll: 1, id: 1 }, { unique: true });
export const Deleted = model('Deleted', deletedSchema, '_deleted');

// Counters for login lockout and lead rate limiting. They live in MongoDB (not in memory) because
// serverless instances do not share memory. A TTL index removes each counter once it expires.
export const Throttle = model(
  'Throttle',
  new Schema({ _id: String, n: { type: Number, default: 0 }, expireAt: { type: Date, expires: 0 } }, { versionKey: false }),
  'throttle',
);

// Key/value store: agency settings, signing secret, website key.
export const Meta = model('Meta', new Schema({ _id: String, value: Schema.Types.Mixed }, { versionKey: false }), 'meta');

export async function getMeta(key, fallback = null) {
  const d = await Meta.findById(key).lean();
  return d ? d.value : fallback;
}
export async function setMeta(key, value) {
  await Meta.replaceOne({ _id: key }, { _id: key, value }, { upsert: true });
}
