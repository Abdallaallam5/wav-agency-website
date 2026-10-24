import { randomUUID } from 'node:crypto';
import { COLLECTIONS, DEFAULT_SETTINGS, FINANCE_ROLES, ROLES, SETTINGS_KEYS, config } from './config.js';
import { Deleted, Records, User, getMeta, setMeta } from './models.js';
import { authenticate, checkPassword, hashPassword, makeToken, publicUser, safeEqual, throttle } from './auth.js';
import { fail } from './errors.js';

const nowIso = () => new Date().toISOString();

/* ---------- reading ---------- */

// Mongo's _id is the record id the browser uses.
const toRecord = ({ _id, ...rest }) => ({ id: _id, ...rest });

async function settings() {
  return { ...(await getMeta('settings', DEFAULT_SETTINGS)) };
}

async function publicUsers() {
  return (await User.find().sort({ createdAt: 1 })).map(publicUser);
}

async function snapshot() {
  const data = {};
  await Promise.all(COLLECTIONS.map(async (c) => { data[c] = (await Records[c].find().lean()).map(toRecord); }));
  return { users: await publicUsers(), settings: await settings(), data, now: nowIso() };
}

async function changes({ since }) {
  if (!since) return { ok: true, ...(await snapshot()) };
  // 10s overlap so a write that lands while we read is never missed (merging is idempotent).
  const from = new Date(new Date(since).getTime() - 10000).toISOString();
  const data = {};
  await Promise.all(COLLECTIONS.map(async (c) => { data[c] = (await Records[c].find({ updatedAt: { $gt: from } }).lean()).map(toRecord); }));
  const deleted = (await Deleted.find({ updatedAt: { $gt: from } }).lean()).map(({ id, coll, updatedAt }) => ({ id, collection: coll, updatedAt }));
  return { ok: true, data, deleted, users: await publicUsers(), settings: await settings(), now: nowIso() };
}

/* ---------- auth ---------- */

async function login({ email, password }) {
  const key = String(email || '').trim().toLowerCase();
  if (await throttle.login.blocked(key)) fail('Too many attempts', 'LOCKED');
  const user = await User.findOne({ email: key }).select('+passwordHash +salt');
  if (!user || !user.active || !checkPassword(String(password || ''), user.salt, user.passwordHash)) {
    await throttle.login.hit(key);
    fail('Wrong email or password', 'BADPASS');
  }
  await throttle.login.clear(key);
  return { ok: true, token: makeToken(user), user: publicUser(user), ...(await snapshot()) };
}

async function changePassword({ current, next }, user) {
  if (!checkPassword(String(current || ''), user.salt, user.passwordHash)) fail('Wrong password', 'BADPASS');
  if (String(next || '').length < 8) fail('Password must be at least 8 characters', 'BAD');
  Object.assign(user, hashPassword(String(next)));
  user.tv = (user.tv || 0) + 1; // signs out the other devices
  user.updatedAt = nowIso();
  await user.save();
  return { ok: true, token: makeToken(user) };
}

/* ---------- writes ---------- */

// Mongo treats keys starting with "$" or containing "." specially; refuse them rather than store them.
function assertSafeKeys(v, depth = 0) {
  if (depth > 8) fail('Record too deep', 'BAD');
  if (Array.isArray(v)) return v.forEach((x) => assertSafeKeys(x, depth + 1));
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (k.startsWith('$') || k.includes('.')) fail('Bad field name', 'BAD');
      assertSafeKeys(x, depth + 1);
    }
  }
}

async function applyOp(op, user) {
  const col = op?.collection;
  if (!COLLECTIONS.includes(col)) fail('Unknown collection', 'BAD');
  if (col === 'invoices' && !FINANCE_ROLES.includes(user.role)) fail('No access', 'FORBIDDEN');

  if (op.op === 'upsert') {
    const { id, ...rest } = op.record || {};
    if (!id || String(id).length > 40) fail('Bad id', 'BAD');
    if (JSON.stringify(rest).length > 45000) fail('Record too large', 'BAD');
    assertSafeKeys(rest);
    const updatedAt = nowIso();
    const doc = { ...rest, _id: String(id), updatedAt, updatedBy: user._id, createdAt: rest.createdAt || updatedAt, createdBy: rest.createdBy || user._id };
    await Records[col].replaceOne({ _id: doc._id }, doc, { upsert: true, strict: false });
    await Deleted.deleteOne({ coll: col, id: doc._id }); // re-created after a delete
    return { collection: col, record: { id: doc._id, updatedAt } };
  }

  if (op.op === 'remove') {
    if (!FINANCE_ROLES.includes(user.role) && col !== 'activity') fail('No access', 'FORBIDDEN');
    const { deletedCount } = await Records[col].deleteOne({ _id: String(op.id) });
    if (deletedCount) await Deleted.replaceOne({ coll: col, id: String(op.id) }, { id: String(op.id), coll: col, updatedAt: nowIso() }, { upsert: true });
    return { collection: col, removed: op.id };
  }

  fail('Unknown op', 'BAD');
}

async function batch({ ops }, user) {
  if (!Array.isArray(ops) || ops.length > 50) fail('Bad batch', 'BAD');
  const results = [];
  // Each op succeeds or fails on its own, so one rejected op can never block the client's queue.
  for (const op of ops) {
    try {
      results.push(await applyOp(op, user));
    } catch (err) {
      results.push({ collection: op?.collection, error: String(err.message || err), code: err.code || 'ERR' });
    }
  }
  return { ok: true, results };
}

/* ---------- team & settings (admin only) ---------- */

async function saveUser({ user: input = {}, password = '' }, actor) {
  if (actor.role !== 'admin') fail('Only admins can manage the team', 'FORBIDDEN');
  const email = String(input.email || '').trim().toLowerCase();
  if (!input.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Name and a valid email are required', 'BAD');

  const clash = await User.findOne({ email, _id: { $ne: String(input.id || '').toUpperCase() } });
  if (clash) fail('This email is already used', 'BAD');

  const id = String(input.id || '').toUpperCase();
  const existing = id ? await User.findById(id).select('+passwordHash +salt') : null;
  const rec = existing || new User({ _id: id || `U-${randomUUID().slice(0, 8).toUpperCase()}`, createdAt: nowIso(), tv: 0 });

  for (const k of ['name', 'title', 'dept', 'color']) if (input[k] !== undefined) rec[k] = String(input[k]);
  rec.email = email;
  rec.role = ROLES.includes(input.role) ? input.role : 'member';
  rec.active = input.active !== false;
  if (rec._id === actor._id) { rec.role = 'admin'; rec.active = true; } // can't lock yourself out

  const pw = String(password || '');
  if (!existing && pw.length < 8) fail('Password must be at least 8 characters', 'BAD');
  if (pw) {
    if (pw.length < 8) fail('Password must be at least 8 characters', 'BAD');
    Object.assign(rec, hashPassword(pw));
    rec.tv = (rec.tv || 0) + 1;
  }
  rec.updatedAt = nowIso();
  await rec.save();
  return { ok: true, users: await publicUsers() };
}

async function saveSettings({ settings: s }, actor) {
  if (actor.role !== 'admin') fail('Only admins can change settings', 'FORBIDDEN');
  const cur = await settings();
  for (const k of SETTINGS_KEYS) if (s && s[k] !== undefined) cur[k] = s[k];
  await setMeta('settings', cur);
  return { ok: true, settings: cur };
}

/* ---------- website -> CRM ---------- */

const SERVICE_KEYS = {
  'strategy & brand': 'strategy', 'content & creative': 'content', 'media & performance': 'media', 'technology & development': 'tech',
  'digital experience': 'digital', 'growth & analytics': 'growth', 'print & production': 'print', 'business experience consulting': 'consulting',
};
const SERVICE_VALUES = new Set(Object.values(SERVICE_KEYS));

async function websiteLead(req) {
  const key = await getMeta('websiteKey');
  if (!key || !safeEqual(req.key || '', key)) fail('Forbidden', 'FORBIDDEN');
  if (req.website) return { ok: true }; // honeypot

  if ((await throttle.leads()) > 30) fail('Slow down', 'LOCKED');

  const name = String(req.name || '').trim().slice(0, 80);
  const contact = String(req.contact || '').trim().slice(0, 120);
  if (name.length < 2 || contact.length < 5) fail('Name and contact are required', 'BAD');
  const isEmail = contact.indexOf('@') > 0;
  const raw = String(req.service || '').trim();
  const service = SERVICE_KEYS[raw.toLowerCase()] || (SERVICE_VALUES.has(raw) ? raw : '');
  const at = nowIso();
  const id = `L-W${randomUUID().slice(0, 8).toUpperCase()}`;

  await Records.leads.create({
    _id: id,
    name,
    company: String(req.company || '').slice(0, 120),
    phone: isEmail ? '' : contact,
    email: isEmail ? contact : '',
    source: req.planId ? 'pulse' : 'website',
    service,
    stage: 'new',
    value: 0,
    notes: String(req.message || '').slice(0, 2000),
    planId: String(req.planId || '').slice(0, 20),
    pulseScore: Number(req.pulseScore) || '',
    followUp: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()), // yyyy-mm-dd
    createdAt: at, updatedAt: at, createdBy: 'website', updatedBy: 'website',
  });
  await Records.activity.create({ _id: `A-W${randomUUID().slice(0, 8).toUpperCase()}`, type: 'create', entity: 'leads', entityId: id, text: 'created', name, by: 'website', at, createdAt: at, updatedAt: at });
  return { ok: true };
}

/* ---------- dispatcher (one endpoint, same protocol the frontend already speaks) ---------- */

export async function dispatch(req) {
  const action = String(req.action || '');
  if (action === 'ping') return { ok: true, now: nowIso() };
  if (action === 'login') return login(req);
  if (action === 'websiteLead') return websiteLead(req);

  const user = await authenticate(req.token);
  switch (action) {
    case 'bootstrap': return { ok: true, user: publicUser(user), ...(await snapshot()) };
    case 'changes': return changes(req);
    case 'batch': return batch(req, user);
    case 'saveUser': return saveUser(req, user);
    case 'saveSettings': return saveSettings(req, user);
    case 'changePassword': return changePassword(req, user);
  }
  fail('Unknown action', 'BAD');
}

/* ---------- first run ---------- */

export async function bootstrapData(log = console.log) {
  if (!(await getMeta('settings'))) await setMeta('settings', DEFAULT_SETTINGS);

  if (!config.secret) {
    let s = await getMeta('secret');
    if (!s) { s = randomUUID() + randomUUID(); await setMeta('secret', s); }
    config.secret = s;
  }

  let wk = config.websiteKey || (await getMeta('websiteKey'));
  if (!wk) { wk = randomUUID().replace(/-/g, ''); log(`[crm] Website key (send it with action websiteLead): ${wk}`); }
  await setMeta('websiteKey', wk);

  if (!(await User.estimatedDocumentCount())) {
    if (!config.adminEmail) { log('[crm] No users yet. Set ADMIN_EMAIL (and optionally ADMIN_PASSWORD) in .env and restart.'); return; }
    const password = config.adminPassword || randomUUID().replace(/-/g, '').slice(0, 14);
    await User.create({ _id: 'U-ADMIN', name: config.adminName, email: config.adminEmail, role: 'admin', dept: 'management', title: 'Admin', color: '#8b3dff', active: true, ...hashPassword(password), tv: 0, createdAt: nowIso(), updatedAt: nowIso() });
    log(`[crm] Admin created -> ${config.adminEmail}${config.adminPassword ? '' : `   temporary password: ${password}`}`);
  }
}
