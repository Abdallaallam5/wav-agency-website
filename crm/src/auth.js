import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { Throttle, User } from './models.js';
import { fail } from './errors.js';

/* ---------- passwords: scrypt with a per-user salt ---------- */

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return { salt, passwordHash: scryptSync(password, salt, 64).toString('hex') };
}

export function checkPassword(password, salt, passwordHash) {
  if (!salt || !passwordHash) return false;
  const a = scryptSync(String(password), salt, 64);
  const b = Buffer.from(passwordHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------- session tokens: base64url(payload).hmac ---------- */

let secret = config.secret;
export const setSecret = (s) => { secret = s; };

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload) => createHmac('sha256', secret).update(payload).digest('base64url');

export function makeToken(user) {
  const payload = [user._id, Date.now() + config.tokenDays * 864e5, user.tv || 0].join('|');
  return `${b64(payload)}.${sign(payload)}`;
}

export async function authenticate(token) {
  if (!token) fail('Sign in required', 'AUTH');
  const [body, sig] = String(token).split('.');
  const payload = Buffer.from(body || '', 'base64url').toString();
  if (!sig || !safeEqual(sign(payload), sig)) fail('Invalid session', 'AUTH');
  const [id, exp, tv] = payload.split('|');
  if (Date.now() > Number(exp)) fail('Session expired', 'AUTH');
  const user = await User.findById(id).select('+passwordHash +salt');
  if (!user || !user.active || (user.tv || 0) !== Number(tv)) fail('Session ended', 'AUTH');
  return user;
}

export function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role || 'member', dept: u.dept || '', title: u.title || '', color: u.color || '#8b3dff', active: u.active !== false };
}

/* ---------- throttling (counters stored in MongoDB, see models.js) ---------- */

/** Adds one hit to `key` and returns the new count. The window starts at the first hit. */
async function hit(key, windowMs) {
  const doc = await Throttle.findOneAndUpdate(
    { _id: key },
    { $inc: { n: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + windowMs) } },
    { upsert: true, new: true },
  );
  return doc.n;
}

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const throttle = {
  login: {
    async blocked(email) { return ((await Throttle.findById(`login:${email}`).lean())?.n || 0) >= 8; },
    hit: (email) => hit(`login:${email}`, LOGIN_WINDOW_MS),
    clear: (email) => Throttle.deleteOne({ _id: `login:${email}` }),
  },
  /** Counts website leads in one-minute buckets. */
  leads: () => hit(`leads:${Math.floor(Date.now() / 60000)}`, 2 * 60 * 1000),
};
