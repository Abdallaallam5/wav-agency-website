/* ==========================================================================
   Metrics — every number on the dashboard & reports comes from here
   ========================================================================== */

function invTotals(inv) {
  const subtotal = sum(inv.items || [], (it) => (Number(it.qty) || 0) * (Number(it.price) || 0));
  const discount = subtotal * ((Number(inv.discount) || 0) / 100);
  const taxable = subtotal - discount;
  const vat = taxable * ((Number(inv.vat) || 0) / 100);
  return { subtotal, discount, vat, total: Math.round((taxable + vat) * 100) / 100 };
}
const invTotal = (inv) => invTotals(inv).total;
function invStatus(inv) {
  if (inv.status === 'sent' && inv.due && inv.due < today()) return 'overdue';
  return inv.status || 'draft';
}

const openLeads = () => DB.leads.filter((l) => OPEN_STAGES.includes(l.stage));
const wonIn = (from, to) => DB.leads.filter((l) => l.stage === 'won' && l.wonAt && l.wonAt >= from && l.wonAt <= to);
const activeClients = () => DB.clients.filter((c) => c.status === 'active' || c.status === 'onboarding');
const mrr = () => sum(DB.clients.filter((c) => c.status === 'active'), (c) => c.retainer);
const isLateFollowUp = (l) => OPEN_STAGES.includes(l.stage) && l.followUp && l.followUp < today();
const isLateTask = (tk) => tk.status !== 'done' && tk.due && tk.due < today();
const isLateContent = (c) => c.status !== 'published' && c.status !== 'scheduled' && c.date && c.date <= addDays(today(), 1);
const monthRange = (key) => { const [y, m] = key.split('-').map(Number); return [`${key}-01`, toISODate(new Date(y, m, 0))]; };

function projectProgress(p) {
  const tasks = DB.tasks.filter((tk) => tk.projectId === p.id);
  if (p.status === 'delivered') return 1;
  if (tasks.length) return tasks.filter((tk) => tk.status === 'done').length / tasks.length;
  return clamp((Number(p.progress) || 0) / 100, 0, 1);
}

const isOpenProject = (p) => p.status !== 'delivered' && p.status !== 'hold';
const projectTasks = (p) => DB.tasks.filter((tk) => tk.projectId === p.id);
const deliverablesOf = (p) => (Array.isArray(p.deliverables) ? p.deliverables : []);

/**
 * Is the project on track? Compares how much of the time has passed with how much of the work is done,
 * and looks at overdue tasks and client feedback. Returns { key: good|risk|late, c, reasons[] }.
 * Delivered / on-hold projects have no health (null).
 */
function projectHealth(p) {
  if (!isOpenProject(p)) return null;
  const T = today();
  const prog = projectProgress(p);
  const lateTasks = projectTasks(p).filter(isLateTask).length;
  const changes = deliverablesOf(p).filter((d) => d.status === 'changes').length;
  const reasons = [];
  let level = 0; // 0 good, 1 risk, 2 late
  const bump = (n, reason) => { level = Math.max(level, n); reasons.push(reason); };

  if (p.due && p.due < T) bump(2, t('health.r.overdue', { n: daysBetween(p.due, T) }));
  if (lateTasks) bump(lateTasks >= 3 ? 2 : 1, t('health.r.lateTasks', { n: lateTasks }));
  if (p.start && p.due && p.due > p.start && p.due >= T) {
    const elapsed = clamp(daysBetween(p.start, T) / daysBetween(p.start, p.due), 0, 1);
    // Behind schedule is a warning, not "late": it only counts once a fifth of the time has passed.
    const ltr = (s) => `⁦${s}⁩`; // keeps "60%" readable inside Arabic text
    if (elapsed >= 0.2 && elapsed - prog > 0.25) bump(1, t('health.r.behind', { time: ltr(pct(elapsed)), done: ltr(pct(prog)) }));
    const left = daysBetween(T, p.due);
    if (left <= 3 && prog < 0.8) bump(1, t('health.r.dueSoon', { n: left }));
  }
  if (changes) bump(1, t('health.r.changes', { n: changes }));
  const key = ENUM.projectHealth[level];
  return { key, c: COLORS.projectHealth[key], reasons };
}

/** Budget vs what has been invoiced and paid for this project (cancelled invoices don't count). */
function projectMoney(p) {
  const inv = DB.invoices.filter((i) => i.projectId === p.id && i.status !== 'cancelled');
  const invoiced = sum(inv, invTotal);
  const paid = sum(inv.filter((i) => i.status === 'paid'), invTotal);
  const budget = Number(p.budget) || 0;
  return { budget, invoiced, paid, unpaid: invoiced - paid, left: Math.max(0, budget - invoiced), count: inv.length };
}

/** Open work per active teammate, busiest first. */
function teamWorkload() {
  const T = today(), week = addDays(T, 7);
  return DB.users.filter((u) => u.active !== false).map((u) => {
    const open = DB.tasks.filter((tk) => tk.assignee === u.id && tk.status !== 'done');
    const projects = DB.projects.filter((p) => p.owner === u.id && isOpenProject(p));
    const posts = DB.content.filter((c) => c.assignee === u.id && c.status !== 'published' && c.date >= T && c.date <= week);
    return {
      u, open: open.length, late: open.filter(isLateTask).length,
      week: open.filter((tk) => tk.due && tk.due >= T && tk.due <= week).length,
      urgent: open.filter((tk) => tk.priority === 'urgent' || tk.priority === 'high').length,
      posts: posts.length, projects,
      load: open.length + posts.length + projects.length * 2,
    };
  }).sort((a, b) => b.load - a.load);
}

function clientHealth(c) {
  const overdueInv = DB.invoices.filter((i) => i.clientId === c.id && invStatus(i) === 'overdue').length;
  const lateTasks = DB.tasks.filter((tk) => tk.clientId === c.id && isLateTask(tk)).length;
  const lateContent = DB.content.filter((x) => x.clientId === c.id && isLateContent(x)).length;
  const score = overdueInv * 3 + lateTasks + lateContent;
  if (c.status === 'paused' || c.status === 'ended') return { key: 'warn', c: '#ffb547' };
  return score >= 4 ? { key: 'bad', c: '#ff5c7a' } : score >= 1 ? { key: 'warn', c: '#ffb547' } : { key: 'good', c: '#c8ff3d' };
}

/* The agency pulse — same idea as the website's "brand signal": noise → clean wave. */
function agencyPulse() {
  const lateFollow = DB.leads.filter(isLateFollowUp).length;
  const lateTasks = DB.tasks.filter(isLateTask).length;
  const lateInv = DB.invoices.filter((i) => invStatus(i) === 'overdue').length;
  const lateContent = DB.content.filter(isLateContent).length;
  const closed = DB.leads.filter((l) => (l.stage === 'won' && l.wonAt >= addDays(today(), -90)) || (l.stage === 'lost' && l.lostAt >= addDays(today(), -90)));
  const winRate = closed.length ? closed.filter((l) => l.stage === 'won').length / closed.length : 0.5;
  let score = 100 - lateFollow * 3 - lateTasks * 3 - lateInv * 6 - lateContent * 2.5 + (winRate - 0.5) * 24;
  score = Math.round(clamp(score, 12, 99));
  const level = score >= 85 ? 'wave' : score >= 68 ? 'rising' : score >= 50 ? 'ripple' : 'flatline';
  return { score, level, lateFollow, lateTasks, lateInv, lateContent, winRate };
}

function periodRange(p) {
  const T = today();
  const m = thisMonth();
  if (p === 'month') return [`${m}-01`, T];
  if (p === 'lastMonth') return monthRange(shiftMonth(m, -1));
  if (p === 'quarter') { const [y, mm] = m.split('-').map(Number); const q = Math.floor((mm - 1) / 3) * 3 + 1; return [`${y}-${pad(q)}-01`, T]; }
  if (p === 'year') return [`${T.slice(0, 4)}-01-01`, T];
  return ['2000-01-01', T];
}
function prevRange([from, to]) {
  const len = daysBetween(from, to) + 1;
  return [addDays(from, -len), addDays(from, -1)];
}
const inRange = (iso, [from, to]) => !!iso && iso.slice(0, 10) >= from && iso.slice(0, 10) <= to;

function salesStats(range) {
  const created = DB.leads.filter((l) => inRange(l.createdAt, range));
  const won = DB.leads.filter((l) => l.stage === 'won' && inRange(l.wonAt, range));
  const lost = DB.leads.filter((l) => l.stage === 'lost' && inRange(l.lostAt, range));
  const revenue = sum(DB.invoices.filter((i) => i.status === 'paid' && inRange(i.paidAt, range)), invTotal);
  const cycles = won.map((l) => daysBetween(dayOf(l.createdAt), l.wonAt)).filter((n) => n >= 0);
  return {
    newLeads: created.length,
    won: won.length,
    wonValue: sum(won, (l) => l.value),
    winRate: won.length + lost.length ? won.length / (won.length + lost.length) : 0,
    revenue,
    avgDeal: won.length ? sum(won, (l) => l.value) / won.length : 0,
    cycle: cycles.length ? Math.round(sum(cycles) / cycles.length) : 0,
  };
}

function focusItems() {
  const T = today();
  const items = [];
  DB.leads.filter((l) => OPEN_STAGES.includes(l.stage) && l.followUp && l.followUp <= T)
    .forEach((l) => items.push({ kind: 'lead', id: l.id, date: l.followUp, icon: 'phone', c: COLORS.stage[l.stage], text: t('focus.followUp', { name: l.name }), sub: l.company, mine: l.owner === me().id }));
  DB.tasks.filter((tk) => tk.status !== 'done' && tk.due && tk.due <= T)
    .forEach((tk) => items.push({ kind: 'task', id: tk.id, date: tk.due, icon: 'tasks', c: COLORS.priority[tk.priority] || '#8b3dff', text: tk.title, sub: clientById(tk.clientId)?.name || '', mine: tk.assignee === me().id }));
  if (can.finance()) DB.invoices.filter((i) => invStatus(i) === 'overdue')
    .forEach((i) => items.push({ kind: 'invoice', id: i.id, date: i.due, icon: 'invoice', c: '#ff5c7a', text: t('focus.invoice', { name: i.number }), sub: clientById(i.clientId)?.name || '', mine: true }));
  DB.content.filter(isLateContent)
    .forEach((c) => items.push({ kind: 'content', id: c.id, date: c.date, icon: 'cal', c: COLORS.platform[c.platform], text: t('focus.content', { name: clientById(c.clientId)?.name || '' }), sub: c.title, mine: c.assignee === me().id }));
  return items.sort((a, b) => (a.mine === b.mine ? (a.date < b.date ? -1 : 1) : a.mine ? -1 : 1));
}

function nextInvoiceNumber(issue) {
  const y = (issue || today()).slice(0, 4);
  const prefix = `${DB.settings.invPrefix || 'WAV'}-${y}-`;
  const max = Math.max(0, ...DB.invoices.filter((i) => String(i.number || '').startsWith(prefix)).map((i) => parseInt(String(i.number).slice(prefix.length), 10) || 0));
  return prefix + String(max + 1).padStart(3, '0');
}

function toCSV(rows, cols) {
  const cell = (v) => { const s = Array.isArray(v) ? v.join(' | ') : String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [cols.map((c) => cell(c.h)).join(','), ...rows.map((r) => cols.map((c) => cell(c.v(r))).join(','))].join('\n');
}
function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
