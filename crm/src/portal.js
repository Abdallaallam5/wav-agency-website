import { randomUUID } from 'node:crypto';
import { Records, Throttle, User, getMeta } from './models.js';
import { DEFAULT_SETTINGS } from './config.js';
import { fail } from './errors.js';
import { esc, mailHTML, sendMail } from './mailer.js';

/**
 * Client portal: a private link per client (clients.portalKey, 48 hex characters, created in the CRM).
 * With it, and nothing else, the client can see what is waiting for their approval and answer.
 * Only fields meant for the client are returned; nothing about other clients, money or the team.
 */

const KEY_RE = /^[a-f0-9]{48}$/;
const DAY = 864e5;
const nowIso = () => new Date().toISOString();
const cairoDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const safeUrl = (u) => { const s = String(u || '').trim(); return /^https?:\/\//i.test(s) ? s : s ? `https://${s.replace(/^\/+/, '')}` : ''; };

async function clientByKey(key) {
  if (!KEY_RE.test(String(key || ''))) fail('This link is not valid', 'FORBIDDEN');
  const c = await Records.clients.findOne({ portalKey: String(key) }).lean();
  if (!c || c.status === 'ended') fail('This link is not valid', 'FORBIDDEN');
  return c;
}

/** At most `max` portal calls per link per hour (stops a leaked link from being hammered). */
async function limit(key, max) {
  const id = `portal:${String(key).slice(0, 16)}:${Math.floor(Date.now() / 36e5)}`;
  const doc = await Throttle.findOneAndUpdate({ _id: id }, { $inc: { n: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + 2 * 36e5) } }, { upsert: true, new: true });
  if (doc.n > max) fail('Too many requests, try again later', 'LOCKED');
}

export async function portalView({ key }) {
  const c = await clientByKey(key);
  await limit(key, 600);
  const since = new Date(Date.now() - 45 * DAY).toISOString();
  const content = (await Records.content.find({ clientId: c._id, $or: [{ status: 'approval' }, { clientAt: { $gte: since } }] }).sort({ date: 1 }).lean())
    .map((x) => ({ id: x._id, title: x.title || '', platform: x.platform || '', format: x.format || '', date: x.date || '', time: x.time || '', caption: x.caption || '', link: safeUrl(x.link), status: x.status, clientApproval: x.clientApproval || '', clientNote: x.clientNote || '', clientAt: x.clientAt || '' }));

  const recentDay = new Date(Date.now() - 45 * DAY).toISOString().slice(0, 10);
  const projects = await Records.projects.find({ clientId: c._id, status: { $ne: 'hold' } }).lean();
  const deliverables = projects.flatMap((p) => (Array.isArray(p.deliverables) ? p.deliverables : [])
    .filter((d) => d.status === 'sent' || ((d.status === 'approved' || d.status === 'changes') && (d.at || '') >= recentDay))
    .map((d) => ({ projectId: p._id, project: p.name || '', id: d.id, title: d.title || '', link: safeUrl(d.link), status: d.status, note: d.note || '', at: d.at || '' })));

  // Latest month that has ad numbers, as a small report card.
  let report = null;
  const latest = await Records.results.findOne({ clientId: c._id, platform: { $ne: '_notes' } }).sort({ month: -1 }).lean();
  if (latest) {
    const rows = await Records.results.find({ clientId: c._id, month: latest.month }).lean();
    const nums = rows.filter((r) => r.platform !== '_notes');
    const notes = rows.find((r) => r.platform === '_notes') || {};
    const tot = (f) => nums.reduce((s, r) => s + (Number(r[f]) || 0), 0);
    report = { month: latest.month, spend: tot('spend'), leads: tot('leadCount'), clicks: tot('clicks'), revenue: tot('revenue'), highlights: notes.highlights || '', nextSteps: notes.nextSteps || '' };
  }
  const settings = { ...DEFAULT_SETTINGS, ...((await getMeta('settings')) || {}) };
  return { ok: true, client: { name: c.name || '', contact: c.contact || '' }, agency: settings.agency, currency: settings.currency, content, deliverables, report, now: nowIso() };
}

export async function portalAct({ key, kind, id, projectId, decision, note }) {
  const c = await clientByKey(key);
  await limit(`act:${key}`, 120);
  if (!['approved', 'changes'].includes(decision)) fail('Bad request', 'BAD');
  const text = String(note || '').trim().slice(0, 1000);
  if (decision === 'changes' && !text) fail('Tell us what to change', 'BAD');
  const at = nowIso();
  let item = '', name = '', entity = '', entityId = '';

  if (kind === 'content') {
    const doc = await Records.content.findOne({ _id: String(id), clientId: c._id }).lean();
    if (!doc) fail('Not found', 'BAD');
    const set = { clientApproval: decision, clientNote: text, clientAt: at, updatedAt: at, updatedBy: 'client' };
    if (decision === 'changes' && doc.status === 'approval') set.status = 'design';
    await Records.content.updateOne({ _id: doc._id }, { $set: set });
    item = doc.title || ''; name = c.name || ''; entity = 'content'; entityId = doc._id;
  } else if (kind === 'deliverable') {
    const p = await Records.projects.findOne({ _id: String(projectId), clientId: c._id }).lean();
    const list = Array.isArray(p?.deliverables) ? p.deliverables : [];
    const d = list.find((x) => x.id === String(id));
    if (!p || !d) fail('Not found', 'BAD');
    Object.assign(d, { status: decision, note: text, at: cairoDay(), by: 'client' });
    await Records.projects.updateOne({ _id: p._id }, { $set: { deliverables: list, updatedAt: at, updatedBy: 'client' } });
    item = d.title || ''; name = p.name || ''; entity = 'projects'; entityId = p._id;
  } else fail('Bad request', 'BAD');

  await Records.activity.create({
    _id: `A-P${randomUUID().slice(0, 8).toUpperCase()}`, type: decision === 'approved' ? 'clientOk' : 'clientChanges', entity, entityId,
    text: decision, name, item, note: text, clientId: c._id, by: 'client', at, createdAt: at, updatedAt: at,
  });

  // Tell the client's account manager right away (if they have email turned on).
  const manager = c.manager ? await User.findById(c.manager).lean() : null;
  if (manager?.email && manager.active !== false && manager.digest !== false) {
    const ok = decision === 'approved';
    await sendMail({
      to: manager.email,
      subject: `${c.name}: ${ok ? 'وافق على' : 'طلب تعديل على'} ${item}`,
      html: mailHTML(`${esc(c.name)} ${ok ? 'وافق ✓' : 'طلب تعديل'}`, `<p><b>${esc(item)}</b>${name && name !== c.name ? ` — ${esc(name)}` : ''}</p>${text ? `<p style="background:#f6f3fb;border-radius:10px;padding:12px;white-space:pre-wrap">${esc(text)}</p>` : ''}`, process.env.CRM_PUBLIC_URL || ''),
    });
  }
  return { ok: true };
}
