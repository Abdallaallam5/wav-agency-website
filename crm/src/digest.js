import { Records, User } from './models.js';
import { FINANCE_ROLES } from './config.js';
import { esc, mailEnabled, mailHTML, sendMail } from './mailer.js';

/**
 * Daily email summary: for every active teammate with email on (users.digest !== false), what needs them today.
 * Run once a day by Vercel Cron (see vercel.json) through GET /api/cron/digest.
 * Nothing is sent to someone with nothing waiting.
 */

const OPEN_STAGES = ['new', 'contacted', 'discovery', 'proposal', 'negotiation'];
const cairoDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(d);
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysLate = (iso, today) => Math.round((new Date(`${today}T12:00:00Z`) - new Date(`${iso}T12:00:00Z`)) / 864e5);
const invTotal = (i) => {
  const sub = (i.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const taxable = sub * (1 - (Number(i.discount) || 0) / 100);
  return Math.round(taxable * (1 + (Number(i.vat) || 0) / 100));
};

function section(title, rows) {
  if (!rows.length) return '';
  return `<h3 style="margin:18px 0 6px;font-size:15px">${title} <span style="color:#8b3dff">(${rows.length})</span></h3><ul style="margin:0;padding-inline-start:18px">${rows.slice(0, 12).map((r) => `<li>${r}</li>`).join('')}</ul>${rows.length > 12 ? `<p style="color:#8b8499;font-size:12px">+${rows.length - 12}</p>` : ''}`;
}
const late = (iso, today) => { const n = daysLate(iso, today); return n > 0 ? ` <span style="color:#e0334f">(متأخر ${n} يوم)</span>` : ' <span style="color:#d98a00">(النهارده)</span>'; };

export async function runDigest({ baseUrl = '' } = {}) {
  if (!mailEnabled()) return { ok: false, error: 'SMTP is not configured', sent: 0 };
  const today = cairoDay();
  const tomorrow = addDays(today, 1);
  const yesterdayIso = new Date(Date.now() - 864e5).toISOString();

  const [users, tasks, leads, content, invoices, clients, projects, answers] = await Promise.all([
    User.find({ active: { $ne: false } }).lean(),
    Records.tasks.find({ status: { $ne: 'done' }, due: { $lte: today, $ne: '' } }).lean(),
    Records.leads.find({ stage: { $in: OPEN_STAGES }, followUp: { $lte: today, $ne: '' } }).lean(),
    Records.content.find({ status: { $nin: ['published', 'scheduled'] }, date: { $lte: tomorrow, $ne: '' } }).lean(),
    Records.invoices.find({ status: 'sent', due: { $lt: today, $ne: '' } }).lean(),
    Records.clients.find().lean(),
    Records.projects.find({ status: { $nin: ['delivered', 'hold'] }, due: { $lt: today, $ne: '' } }).lean(),
    Records.activity.find({ by: 'client', at: { $gte: yesterdayIso } }).lean(),
  ]);
  const clientName = (id) => clients.find((c) => c._id === id)?.name || '';

  let sent = 0;
  for (const u of users) {
    if (!u.email || u.digest === false) continue;
    const mine = (list, field) => list.filter((x) => x[field] === u._id);
    const myClients = new Set(clients.filter((c) => c.manager === u._id).map((c) => c._id));
    const parts = [
      section('مهام متأخرة أو النهارده', mine(tasks, 'assignee').sort((a, b) => (a.due < b.due ? -1 : 1)).map((x) => `${esc(x.title)}${x.clientId ? ` — ${esc(clientName(x.clientId))}` : ''}${late(x.due, today)}`)),
      section('عملاء محتملين محتاجين متابعة', mine(leads, 'owner').map((x) => `${esc(x.name)}${x.company ? ` — ${esc(x.company)}` : ''}${late(x.followUp, today)}`)),
      section('بوستات معادها قرب ولسه مش جاهزة', mine(content, 'assignee').map((x) => `${esc(clientName(x.clientId))}: ${esc(x.title)} (${esc(x.date)})`)),
      section('مشاريع عدّى معاد تسليمها', mine(projects, 'owner').map((x) => `${esc(x.name)} — ${esc(clientName(x.clientId))}${late(x.due, today)}`)),
      section('ردود العملاء من امبارح', answers.filter((a) => myClients.has(a.clientId)).map((a) => `${esc(clientName(a.clientId))} ${a.type === 'clientOk' ? 'وافق على' : 'طلب تعديل على'} <b>${esc(a.item)}</b>${a.note ? `: ${esc(a.note)}` : ''}`)),
      FINANCE_ROLES.includes(u.role) ? section('فواتير متأخرة', invoices.map((i) => `${esc(i.number)} — ${esc(clientName(i.clientId))} · ${invTotal(i).toLocaleString('en-US')}${late(i.due, today)}`)) : '',
    ].filter(Boolean);
    if (!parts.length) continue;
    const ok = await sendMail({
      to: u.email,
      subject: `WAV CRM — شغلك النهارده (${today})`,
      html: mailHTML(`صباح الخير ${esc((u.name || '').split(' ')[0])} 👋`, `<p style="margin:0;color:#6d6683">ده اللي محتاجك النهارده:</p>${parts.join('')}`, baseUrl),
    });
    if (ok) sent++;
  }
  return { ok: true, sent };
}
