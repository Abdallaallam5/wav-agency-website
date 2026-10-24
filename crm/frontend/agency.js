/* ==========================================================================
   Agency — ad results & client reports, ad budget wallet, profitability,
   proposals, client portal links. Loaded after views.js.
   ========================================================================== */

/* ---------- Printing (shared by the client report and proposals) ---------- */
const PRINT_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:${'FONT'},sans-serif;color:#151021;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .top{background:#07060b;color:#fff;padding:38px 48px 30px;position:relative;overflow:hidden}.top:after{content:'';position:absolute;inset:auto -10% -60px -10%;height:120px;background:radial-gradient(60% 100% at 50% 100%,rgba(139,61,255,.55),transparent)}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;position:relative;z-index:1}.word{letter-spacing:.42em;font-weight:600;font-size:12px;color:#a69fbd;direction:ltr}.word i{font-style:normal;color:#b06bff}
  h1{font-family:Anton,FONT,sans-serif;font-weight:400;font-size:40px;margin:14px 0 0;letter-spacing:.02em;line-height:1.1}h1 span{background:linear-gradient(100deg,#5b2bff,#8b3dff 45%,#e07bff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .meta{text-align:end;font-size:12px;color:#a69fbd;line-height:1.8}.meta b{color:#fff;font-weight:600}.body{padding:30px 48px}.cols{display:flex;gap:40px;margin-bottom:24px}.cols>div{flex:1}.lab{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#8b8499;margin-bottom:6px;font-weight:600}
  h2{font-size:15px;margin:26px 0 10px}table{width:100%;border-collapse:collapse}th{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8b8499;text-align:start;padding:9px 8px;border-bottom:2px solid #151021}td{padding:10px 8px;border-bottom:1px solid #eee9f5}.n{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}
  .tot{margin-top:18px;margin-inline-start:auto;width:300px}.tot div{display:flex;justify-content:space-between;padding:6px 0}.tot .g{border-top:2px solid #151021;margin-top:6px;padding-top:12px;font-size:18px;font-weight:700}.tot .g b{color:#5b2bff}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{border:1px solid #eee9f5;border-radius:12px;padding:14px}.kpi small{display:block;color:#8b8499;font-size:11px}.kpi b{display:block;font-size:22px;margin-top:6px;direction:ltr;text-align:start}.kpi em{display:block;font-style:normal;font-size:11px;margin-top:4px;color:#8b8499}.up{color:#11a36a!important}.down{color:#e0334f!important}
  .foot{margin-top:36px;padding-top:16px;border-top:1px solid #eee9f5;display:flex;justify-content:space-between;color:#8b8499;font-size:11px}.wave{height:6px;background:linear-gradient(100deg,#5b2bff,#8b3dff 45%,#e07bff)}.notes{margin-top:10px;padding:14px;border-radius:10px;background:#f6f3fb;white-space:pre-wrap;line-height:1.7}`;
function printDoc(title, h1, metaHTML, bodyHTML) {
  const font = LANG === 'ar' ? 'Alexandria' : 'Inter';
  const html = `<!doctype html><html lang="${LANG}" dir="${LANG === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Alexandria:wght@400;600;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${PRINT_CSS.replace(/FONT/g, font)}</style></head><body>
  <div class="top"><div class="row"><div><svg width="56" viewBox="0 0 124 124"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#5b2bff"/><stop offset=".5" stop-color="#9b4dff"/><stop offset="1" stop-color="#e07bff"/></linearGradient></defs><path d="M10 36 C 20 36 25 88 39 88 C 51 88 53 56 62 56 C 71 56 73 88 85 88 C 100 88 106 46 116 32" fill="none" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/></svg><div class="word">W<i>Λ</i>V</div>
  <h1>${h1}</h1></div><div class="meta">${metaHTML}</div></div></div><div class="wave"></div>
  <div class="body">${bodyHTML}<div class="foot"><span>${esc(DB.settings.agency || '')}${DB.settings.website ? ' · ' + esc(DB.settings.website) : ''}</span><span>${esc(t('app.slogan'))}</span></div></div></body></html>`;
  const fr = document.createElement('iframe');
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(fr);
  const doc = fr.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  const go2 = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (x) {} setTimeout(() => fr.remove(), 60000); };
  (doc.fonts ? doc.fonts.ready.then(() => setTimeout(go2, 250)) : setTimeout(go2, 700));
}
const longDate = (iso) => fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
const num = (v) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const ltr = (s) => `<span dir="ltr">${s}</span>`;

/* ==========================================================================
   1) AD RESULTS — one record per client × month × platform, plus a notes record
   ========================================================================== */
const RESULT_FIELDS = ['spend', 'impressions', 'clicks', 'leadCount', 'salesCount', 'revenue'];
const NOTES = '_notes';
const resultId = (clientId, month, platform) => `R-${clientId}-${month}-${platform}`.slice(0, 40);
const resultsOf = (clientId, month) => DB.results.filter((r) => r.clientId === clientId && r.month === month && r.platform !== NOTES);
const resultNotes = (clientId, month) => DB.results.find((r) => r.clientId === clientId && r.month === month && r.platform === NOTES);

function resultTotals(list) {
  const o = {};
  RESULT_FIELDS.forEach((f) => (o[f] = sum(list, (r) => r[f])));
  o.cpl = o.leadCount ? o.spend / o.leadCount : 0;
  o.cpc = o.clicks ? o.spend / o.clicks : 0;
  o.ctr = o.impressions ? o.clicks / o.impressions : 0;
  o.roas = o.spend && o.revenue ? o.revenue / o.spend : 0;
  o.has = list.length > 0;
  return o;
}
const clientMonthTotals = (clientId, month) => resultTotals(resultsOf(clientId, month));

/** Clients that run ads: an ad budget, a media/growth service, or numbers already entered. */
function adClients() {
  const withResults = new Set(DB.results.map((r) => r.clientId));
  return DB.clients.filter((c) => (c.status === 'active' || c.status === 'onboarding' || withResults.has(c.id)) && (Number(c.adBudget) > 0 || (c.services || []).some((s) => s === 'media' || s === 'growth') || withResults.has(c.id)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** "+12%" style change, coloured; `lowerIsBetter` flips the colour (cost per lead). */
function change(cur, prev, lowerIsBetter = false) {
  if (!prev || !cur) return '';
  const d = (cur - prev) / prev;
  if (Math.abs(d) < 0.005) return `<small class="chg">=</small>`;
  const good = lowerIsBetter ? d < 0 : d > 0;
  return `<small class="chg ${good ? 'up' : 'down'}" dir="ltr">${d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}%</small>`;
}

/* ---------- Ad budget wallet (adfunds = money the client sent for ads) ---------- */
function adWallet(clientId) {
  const c = clientById(clientId) || {};
  const tops = DB.adfunds.filter((f) => f.clientId === clientId);
  const topped = sum(tops, (f) => f.amount);
  const spent = sum(DB.results.filter((r) => r.clientId === clientId && r.platform !== NOTES), (r) => r.spend);
  const balance = topped - spent;
  const budget = Number(c.adBudget) || 0;
  const low = balance < 0 || (budget > 0 && balance < budget * 0.25);
  return { topped, spent, balance, low, tops: tops.sort((a, b) => (a.date < b.date ? 1 : -1)), used: tops.length > 0 };
}
const walletTag = (w) => (w.used ? `<span class="tag ${w.low ? 'is-late' : ''}" title="${t('ads.wallet')}">${icon('money')}${money(w.balance, true)}</span>` : '<span class="dim">—</span>');

/* ---------- Results page ---------- */
VIEWS.results = {
  title: () => t('nav.results'),
  render() {
    const st = uiState('results', { month: shiftMonth(thisMonth(), -1), q: '' });
    const m = st.month, pm = shiftMonth(m, -1);
    const clients = adClients().filter((c) => match(st.q, c.name));
    const rows = clients.map((c) => ({ c, cur: clientMonthTotals(c.id, m), prev: clientMonthTotals(c.id, pm), w: can.finance() ? adWallet(c.id) : null }));
    const all = resultTotals(DB.results.filter((r) => r.month === m && r.platform !== NOTES));
    const allPrev = resultTotals(DB.results.filter((r) => r.month === pm && r.platform !== NOTES));
    const missing = rows.filter((r) => !r.cur.has).length;
    const toolbar = `<div class="toolbar">${searchBox('results.q', t('ads.search'))}<span class="grow"></span>
      <div class="seg month-nav"><button data-act="set" data-set="results.month" data-val="${pm}" aria-label="prev">${icon(LANG === 'ar' ? 'right' : 'left')}</button><button class="is-on" style="cursor:default">${fmtMonth(m, true)}</button><button data-act="set" data-set="results.month" data-val="${shiftMonth(m, 1)}" aria-label="next" ${m >= thisMonth() ? 'disabled' : ''}>${icon(LANG === 'ar' ? 'left' : 'right')}</button></div></div>`;
    const kpis = [
      ['money', t('ads.spend'), money(all.spend, true), change(all.spend, allPrev.spend)],
      ['leads', t('ads.leads'), num(all.leadCount), change(all.leadCount, allPrev.leadCount)],
      ['target', t('ads.cpl'), all.cpl ? money(all.cpl) : '—', change(all.cpl, allPrev.cpl, true)],
      ['alert', t('ads.missing'), `${missing}<small>/ ${rows.length}</small>`, missing ? t('ads.missingMeta') : t('ads.allIn')],
    ];
    const head = `<div class="grid g-4 keep">${kpis.map(([i, l, v, meta]) => `<article class="card kpi"><span class="kpi__label">${icon(i)}${l}</span><b class="kpi__value num">${v}</b><div class="kpi__meta">${meta}</div></article>`).join('')}</div>`;
    if (!rows.length) return toolbar + head + `<div class="card mt">${emptyHTML(t('ads.noClients'))}</div>`;
    return toolbar + head + `<div class="table-wrap table-cards mt"><table class="table"><thead><tr><th>${t('f.client')}</th><th>${t('ads.spend')}</th><th>${t('ads.leads')}</th><th>${t('ads.cpl')}</th><th>${t('ads.roas')}</th>${can.finance() ? `<th>${t('ads.wallet')}</th>` : ''}<th></th></tr></thead><tbody>
      ${rows.map(({ c, cur, prev, w }) => {
        const tl = Number(c.targetLeads) || 0, tc = Number(c.targetCpl) || 0, ab = Number(c.adBudget) || 0;
        const cplBad = tc && cur.cpl > tc;
        return `<tr data-act="editResults" data-client="${c.id}" data-month="${m}">
          <td><div class="who">${clientLogo(c, 'avatar--sm')}<div><b>${esc(c.name)}</b>${cur.has ? '' : `<small class="amber">${t('ads.noNumbers')}</small>`}</div></div></td>
          <td data-label="${t('ads.spend')}" class="num">${cur.has ? money(cur.spend, true) : '—'}${ab ? `<small class="dim"> / ${money(ab, true)}</small>` : ''}</td>
          <td data-label="${t('ads.leads')}" class="num">${cur.has ? num(cur.leadCount) : '—'}${tl ? `<small class="dim"> / ${num(tl)}</small>` : ''} ${change(cur.leadCount, prev.leadCount)}</td>
          <td data-label="${t('ads.cpl')}" class="num ${cplBad ? 'red' : ''}">${cur.cpl ? money(cur.cpl) : '—'} ${change(cur.cpl, prev.cpl, true)}</td>
          <td data-label="${t('ads.roas')}" class="num">${cur.roas ? `${cur.roas.toFixed(1)}x` : '—'}</td>
          ${w ? `<td data-label="${t('ads.wallet')}">${walletTag(w)}</td>` : ''}
          <td style="text-align:end;white-space:nowrap"><button class="btn btn--ghost btn--sm" data-act="clientReport" data-client="${c.id}" data-month="${m}" ${cur.has ? '' : 'disabled'}>${icon('print')}${t('ads.report')}</button></td></tr>`;
      }).join('')}</tbody></table></div><p class="dim" style="font-size:.8rem;margin-top:10px">${t('ads.hint')}</p>`;
  },
};

/* ---------- Enter a month's numbers ---------- */
ACT.editResults = (el, e) => { if (e?.target.closest('[data-act="clientReport"]')) return; editResults(el.dataset.client, el.dataset.month); };
function editResults(clientId, month) {
  const c = clientById(clientId);
  if (!c) return;
  const notes = resultNotes(clientId, month) || {};
  const byP = Object.fromEntries(resultsOf(clientId, month).map((r) => [r.platform, r]));
  const used = ENUM.adPlatform.filter((p) => byP[p]);
  const shown = used.length ? used : ['meta'];
  const row = (p) => `<div class="res__row" data-platform="${p}"><span class="res__plat" style="--c:${COLORS.adPlatform[p]}">${esc(label('adPlatform', p))}</span>${RESULT_FIELDS.map((f) => `<input class="input" type="number" min="0" step="any" inputmode="decimal" data-f="${f}" value="${byP[p] && byP[p][f] ? byP[p][f] : ''}" placeholder="0" aria-label="${t('ads.f.' + f)}" />`).join('')}</div>`;
  openModal({
    title: `${esc(c.name)} · ${fmtMonth(month, true)}`, width: 920,
    body: `<form id="resForm" novalidate>
      <div class="res"><div class="res__row res__head"><span>${t('ads.platform')}</span>${RESULT_FIELDS.map((f) => `<span>${t('ads.f.' + f)}</span>`).join('')}</div><div id="resRows">${shown.map(row).join('')}</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><select class="input" id="resAdd" style="width:auto">${`<option value="">${t('ads.addPlatform')}</option>` + ENUM.adPlatform.filter((p) => !shown.includes(p)).map((p) => `<option value="${p}">${esc(label('adPlatform', p))}</option>`).join('')}</select><span class="grow"></span><b id="resSum" class="num dim" style="font-size:.85rem"></b></div>
      <div class="form-grid" style="margin-top:16px">
        <label class="field field--full"><span>${t('ads.highlights')}</span><textarea name="highlights" rows="3" placeholder="${t('ads.highlightsPh')}">${esc(notes.highlights || '')}</textarea></label>
        <label class="field field--full"><span>${t('ads.nextSteps')}</span><textarea name="nextSteps" rows="3" placeholder="${t('ads.nextStepsPh')}">${esc(notes.nextSteps || '')}</textarea></label>
      </div></form>`,
    foot: `<button class="btn btn--ghost" data-act="closeModal">${t('act.cancel')}</button><button class="btn" data-act="saveResults" data-client="${clientId}" data-month="${month}">${icon('check')}${t('act.save')}</button>`,
    onMount(m) {
      const recalc = () => {
        const tot = resultTotals(readResultRows());
        $('#resSum', m).innerHTML = `${t('ads.spend')}: ${money(tot.spend)} · ${t('ads.leads')}: ${num(tot.leadCount)} · ${t('ads.cpl')}: ${tot.cpl ? money(tot.cpl) : '—'}`;
      };
      $('#resAdd', m).addEventListener('change', (ev) => {
        const p = ev.target.value;
        if (!p) return;
        $('#resRows', m).insertAdjacentHTML('beforeend', row(p));
        ev.target.querySelector(`option[value="${p}"]`).remove();
        ev.target.value = '';
        $(`[data-platform="${p}"] input`, m).focus();
      });
      $('#resForm', m).addEventListener('input', recalc);
      $('#resForm', m).addEventListener('submit', (ev) => ev.preventDefault());
      recalc();
    },
  });
}
function readResultRows() {
  return $$('#resRows .res__row').map((r) => {
    const o = { platform: r.dataset.platform };
    RESULT_FIELDS.forEach((f) => (o[f] = Math.max(0, Number($(`[data-f="${f}"]`, r).value) || 0)));
    return o;
  });
}
ACT.saveResults = (el) => {
  const { client, month } = el.dataset;
  const rows = readResultRows();
  const hl = $('#resForm [name="highlights"]').value.trim(), ns = $('#resForm [name="nextSteps"]').value.trim();
  closeModal();
  rows.forEach((r) => {
    const id = resultId(client, month, r.platform);
    const existing = Store.get('results', id);
    const empty = RESULT_FIELDS.every((f) => !r[f]);
    if (empty) { if (existing) Store.remove('results', id); return; }
    Store.save('results', { ...(existing || {}), id, clientId: client, month, ...r });
  });
  const nid = resultId(client, month, NOTES);
  const n = Store.get('results', nid);
  if (hl || ns) Store.save('results', { ...(n || {}), id: nid, clientId: client, month, platform: NOTES, highlights: hl, nextSteps: ns });
  else if (n) Store.remove('results', nid);
  toast(t('msg.saved'));
};

/* ---------- Monthly client report (print / PDF) ---------- */
ACT.clientReport = (el, e) => { e?.stopPropagation(); printClientReport(el.dataset.client, el.dataset.month); };
function printClientReport(clientId, month) {
  const c = clientById(clientId);
  if (!c) return;
  const pm = shiftMonth(month, -1);
  const cur = clientMonthTotals(clientId, month), prev = clientMonthTotals(clientId, pm);
  const list = resultsOf(clientId, month).sort((a, b) => b.spend - a.spend);
  const notes = resultNotes(clientId, month) || {};
  const [from, to] = monthRange(month);
  const posts = DB.content.filter((x) => x.clientId === clientId && x.status === 'published' && x.date >= from && x.date <= to);
  const byPlat = ENUM.platform.map((p) => [p, posts.filter((x) => x.platform === p).length]).filter(([, n]) => n);
  const approved = DB.projects.filter((p) => p.clientId === clientId).flatMap((p) => deliverablesOf(p).filter((d) => d.status === 'approved' && d.at >= from && d.at <= to).map((d) => ({ ...d, project: p.name })));
  const delta = (a, b, low = false) => { if (!a || !b) return ''; const d = (a - b) / b; const good = low ? d < 0 : d > 0; return `<em class="${good ? 'up' : 'down'}" dir="ltr">${d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}% ${t('ads.vsLast')}</em>`; };
  const tl = Number(c.targetLeads) || 0, tc = Number(c.targetCpl) || 0;
  const kpis = [
    [t('ads.spend'), money(cur.spend), delta(cur.spend, prev.spend)],
    [t('ads.leads'), num(cur.leadCount), tl ? `<em>${t('ads.target')}: ${num(tl)}</em>` : delta(cur.leadCount, prev.leadCount)],
    [t('ads.cpl'), cur.cpl ? money(cur.cpl) : '—', tc ? `<em class="${cur.cpl && cur.cpl <= tc ? 'up' : 'down'}">${t('ads.target')}: ${money(tc)}</em>` : delta(cur.cpl, prev.cpl, true)],
    cur.revenue ? [t('ads.roas'), `${cur.roas.toFixed(1)}x`, `<em>${t('ads.f.revenue')}: ${money(cur.revenue, true)}</em>`] : [t('ads.f.clicks'), num(cur.clicks), cur.ctr ? `<em>CTR ${(cur.ctr * 100).toFixed(2)}%</em>` : ''],
  ];
  const body = `<div class="cols"><div><div class="lab">${t('ads.preparedFor')}</div><b>${esc(c.name)}</b>${c.contact ? '<br>' + esc(c.contact) : ''}</div><div><div class="lab">${t('ads.preparedBy')}</div><b>${esc(DB.settings.agency || '')}</b>${userById(c.manager) ? '<br>' + esc(userById(c.manager).name) : ''}</div></div>
    <div class="kpis">${kpis.map(([l, v, m]) => `<div class="kpi"><small>${l}</small><b>${v}</b>${m}</div>`).join('')}</div>
    ${list.length ? `<h2>${t('ads.byPlatform')}</h2><table><thead><tr><th>${t('ads.platform')}</th><th class="n">${t('ads.spend')}</th><th class="n">${t('ads.f.impressions')}</th><th class="n">${t('ads.f.clicks')}</th><th class="n">${t('ads.leads')}</th><th class="n">${t('ads.cpl')}</th></tr></thead><tbody>
      ${list.map((r) => `<tr><td>${esc(label('adPlatform', r.platform))}</td><td class="n">${money(r.spend)}</td><td class="n">${num(r.impressions)}</td><td class="n">${num(r.clicks)}</td><td class="n">${num(r.leadCount)}</td><td class="n">${r.leadCount ? money(r.spend / r.leadCount) : '—'}</td></tr>`).join('')}</tbody></table>` : ''}
    ${posts.length ? `<h2>${t('ads.contentDone', { n: posts.length })}</h2><p>${byPlat.map(([p, n]) => `${esc(label('platform', p))}: <b>${n}</b>`).join(' · ')}</p>` : ''}
    ${approved.length ? `<h2>${t('ads.delivered')}</h2><p>${approved.map((d) => esc(d.title)).join(' · ')}</p>` : ''}
    ${notes.highlights ? `<h2>${t('ads.highlights')}</h2><div class="notes">${esc(notes.highlights)}</div>` : ''}
    ${notes.nextSteps ? `<h2>${t('ads.nextSteps')}</h2><div class="notes">${esc(notes.nextSteps)}</div>` : ''}`;
  printDoc(`${c.name} — ${fmtMonth(month, true)}`, `${t('ads.reportTitle')} <span>${esc(fmtMonth(month, true))}</span>`, `${t('f.client')}: <b>${esc(c.name)}</b><br>${t('ads.issued')}: <b>${longDate(today())}</b>`, body);
}

/* ---------- Client drawer: Results tab (numbers, wallet) ---------- */
function clientResultsHTML(c) {
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(thisMonth(), -i));
  const last = shiftMonth(thisMonth(), -1);
  const rows = months.map((m) => ({ m, x: clientMonthTotals(c.id, m) }));
  const any = rows.some((r) => r.x.has);
  let html = `<div class="quick" style="margin:12px 0"><button data-act="editResults" data-client="${c.id}" data-month="${last}">${icon('edit')}${t('ads.enter', { month: fmtMonth(last) })}</button><button data-act="editResults" data-client="${c.id}" data-month="${thisMonth()}">${icon('plus')}${fmtMonth(thisMonth())}</button>${clientMonthTotals(c.id, last).has ? `<button data-act="clientReport" data-client="${c.id}" data-month="${last}">${icon('print')}${t('ads.report')} ${fmtMonth(last)}</button>` : ''}</div>`;
  const targets = [Number(c.adBudget) ? `${t('f.adBudget')}: <b>${money(c.adBudget, true)}</b>` : '', Number(c.targetLeads) ? `${t('f.targetLeads')}: <b>${num(c.targetLeads)}</b>` : '', Number(c.targetCpl) ? `${t('f.targetCpl')}: <b>${money(c.targetCpl)}</b>` : ''].filter(Boolean);
  html += targets.length ? `<p class="dim" style="font-size:.8rem;margin:0 0 10px">${targets.join(' · ')}</p>` : `<p class="dim" style="font-size:.8rem;margin:0 0 10px">${t('ads.setTargets')}</p>`;
  html += any ? `<div class="table-wrap"><table class="table"><thead><tr><th>${t('ads.month')}</th><th>${t('ads.spend')}</th><th>${t('ads.leads')}</th><th>${t('ads.cpl')}</th><th>${t('ads.roas')}</th></tr></thead><tbody>${rows.map(({ m, x }) => `<tr data-act="editResults" data-client="${c.id}" data-month="${m}"><td>${fmtMonth(m)}</td><td class="num">${x.has ? money(x.spend, true) : '—'}</td><td class="num">${x.has ? num(x.leadCount) : '—'}</td><td class="num">${x.cpl ? money(x.cpl) : '—'}</td><td class="num">${x.roas ? x.roas.toFixed(1) + 'x' : '—'}</td></tr>`).join('')}</tbody></table></div>` : emptyHTML(t('ads.noneYet'));
  if (can.finance()) {
    const w = adWallet(c.id);
    html += `<div class="sect"><h4>${icon('money')}${t('ads.wallet')}</h4>
      <div class="mini-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><b class="num">${money(w.topped, true)}</b><small>${t('ads.topped')}</small></div><div><b class="num">${money(w.spent, true)}</b><small>${t('ads.spent')}</small></div><div class="${w.low ? 'is-late' : ''}"><b class="num">${money(w.balance, true)}</b><small>${t('ads.balance')}</small></div></div>
      ${w.low && w.used ? `<p style="margin:8px 0 0;font-size:.82rem;color:var(--red)">${icon('alert')} ${t(w.balance < 0 ? 'ads.negative' : 'ads.lowBalance')}</p>` : ''}
      ${w.tops.length ? `<ul class="list" style="margin-top:8px">${w.tops.slice(0, 6).map((f) => `<li class="is-click" data-act="editRecord" data-col="adfunds" data-id="${f.id}"><span class="list__icon" style="--c:#c8ff3d">${icon('plus')}</span><div class="list__main"><b class="num">${money(f.amount)}</b><small>${fmtDate(f.date)}${f.note ? ' · ' + esc(f.note) : ''}</small></div></li>`).join('')}</ul>` : `<p class="dim" style="font-size:.82rem;margin:6px 0 0">${t('ads.walletHint')}</p>`}
      <div style="margin-top:10px"><button class="btn btn--ghost btn--sm" data-act="newRecord" data-col="adfunds" data-defaults="${esc(JSON.stringify({ clientId: c.id, date: today() }))}">${icon('plus')}${t('new.adfund')}</button></div></div>`;
  }
  return html;
}

/* ==========================================================================
   3) PROFITABILITY — revenue (net of VAT) vs hours logged on tasks
   ========================================================================== */
const invNet = (i) => { const x = invTotals(i); return x.subtotal - x.discount; };
const taskDate = (tk) => tk.doneAt || tk.due || dayOf(tk.createdAt);
function profitability(range) {
  const cost = Number(DB.settings.hourCost) || 0;
  return DB.clients.map((c) => {
    const revenue = sum(DB.invoices.filter((i) => i.clientId === c.id && i.status === 'paid' && inRange(i.paidAt, range)), invNet);
    const hours = sum(DB.tasks.filter((tk) => tk.clientId === c.id && Number(tk.hours) > 0 && inRange(taskDate(tk), range)), (tk) => tk.hours);
    const spend = hours * cost;
    return { c, revenue, hours, cost: spend, profit: revenue - spend, margin: revenue ? (revenue - spend) / revenue : 0, perHour: hours ? revenue / hours : 0 };
  }).filter((r) => r.revenue || r.hours).sort((a, b) => b.revenue - a.revenue);
}
function reportsExtraHTML(range) {
  const rows = profitability(range);
  const cost = Number(DB.settings.hourCost) || 0;
  const hrs = sum(rows, (r) => r.hours);
  const body = !rows.length ? emptyHTML() : `<div class="table-wrap table-cards" style="border:0;border-radius:0"><table class="table"><thead><tr><th>${t('f.client')}</th><th>${t('prof.revenue')}</th><th>${t('prof.hours')}</th><th>${t('prof.perHour')}</th>${cost ? `<th>${t('prof.cost')}</th><th>${t('prof.margin')}</th>` : ''}</tr></thead><tbody>
    ${rows.map((r) => `<tr data-act="open" data-kind="client" data-id="${r.c.id}"><td><div class="who">${clientLogo(r.c, 'avatar--sm')}<div><b>${esc(r.c.name)}</b></div></div></td><td data-label="${t('prof.revenue')}" class="num">${money(r.revenue, true)}</td><td data-label="${t('prof.hours')}" class="num">${r.hours ? num(r.hours) : '—'}</td><td data-label="${t('prof.perHour')}" class="num">${r.perHour ? money(r.perHour) : '—'}</td>${cost ? `<td data-label="${t('prof.cost')}" class="num">${money(r.cost, true)}</td><td data-label="${t('prof.margin')}" class="num ${r.revenue && r.margin < 0.3 ? 'red' : 'lime'}">${r.revenue ? pct(r.margin) : '—'}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  return `<section class="card mt" style="padding:0;overflow:hidden"><div class="card__head" style="padding:20px 20px 0"><h3>${icon('money')}${t('prof.title')}</h3><small class="dim">${hrs ? t('prof.totalHours', { n: num(hrs) }) : ''}</small></div>
    <p class="dim" style="margin:6px 20px 12px;font-size:.8rem">${cost ? t('prof.hint', { cost: money(cost) }) : t('prof.noCost')}</p>${body}</section>`;
}

/* ==========================================================================
   4) PROPOSALS
   ========================================================================== */
const propTotals = (p) => invTotals(p);
const propNet = (p) => { const x = invTotals(p); return x.subtotal - x.discount; };
const propFor = (p) => (p.clientId ? clientById(p.clientId)?.name : null) || (p.leadId ? (() => { const l = Store.get('leads', p.leadId); return l ? l.company || l.name : ''; })() : '') || '—';
const propExpired = (p) => p.status === 'sent' && p.validUntil && p.validUntil < today();
function nextProposalNumber(issue) {
  const y = (issue || today()).slice(0, 4);
  const prefix = `${DB.settings.invPrefix || 'WAV'}-P${y}-`;
  const max = Math.max(0, ...DB.proposals.filter((p) => String(p.number || '').startsWith(prefix)).map((p) => parseInt(String(p.number).slice(prefix.length), 10) || 0));
  return prefix + String(max + 1).padStart(3, '0');
}

VIEWS.proposals = {
  title: () => t('nav.proposals'),
  render() {
    const st = uiState('proposals', { status: '', q: '' });
    const list = DB.proposals.filter((p) => (!st.status || p.status === st.status) && match(st.q, p.title, p.number, propFor(p))).sort((a, b) => (a.issue < b.issue ? 1 : -1));
    const open = DB.proposals.filter((p) => p.status === 'draft' || p.status === 'sent');
    const [from] = periodRange('quarter');
    const decided = DB.proposals.filter((p) => (p.status === 'accepted' || p.status === 'rejected') && (p.decidedAt || '') >= from);
    const won = decided.filter((p) => p.status === 'accepted');
    const kpis = [
      ['invoice', t('prop.open'), money(sum(open, propNet), true), t('prop.openMeta', { n: open.length })],
      ['clock', t('prop.waiting'), DB.proposals.filter((p) => p.status === 'sent').length, t('prop.expiredMeta', { n: DB.proposals.filter(propExpired).length })],
      ['check', t('prop.won'), money(sum(won, propNet), true), t('prop.wonMeta', { n: won.length })],
      ['target', t('prop.rate'), decided.length ? pct(won.length / decided.length) : '—', t('prop.rateMeta')],
    ];
    const toolbar = `<div class="toolbar">${searchBox('proposals.q', t('prop.search'))}<span class="grow"></span>${seg('proposals.status', st.status, [['', t('prop.all')], ...ENUM.proposalStatus.map((s) => [s, label('proposalStatus', s)])])}<button class="btn btn--sm" data-act="newProposal">${icon('plus')}${t('prop.new')}</button></div>`;
    const head = `<div class="grid g-4 keep">${kpis.map(([i, l, v, m]) => `<article class="card kpi"><span class="kpi__label">${icon(i)}${l}</span><b class="kpi__value num">${v}</b><div class="kpi__meta">${m}</div></article>`).join('')}</div>`;
    if (!list.length) return toolbar + head + `<div class="card mt">${emptyHTML(t('prop.empty'))}</div>`;
    return toolbar + head + `<div class="table-wrap table-cards mt"><table class="table"><thead><tr><th>${t('f.number')}</th><th>${t('prop.title')}</th><th>${t('prop.for')}</th><th>${t('f.total')}</th><th>${t('f.status')}</th><th>${t('prop.validUntil')}</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-act="open" data-kind="proposal" data-id="${p.id}"><td class="num">${esc(p.number)}</td><td><b>${esc(p.title)}</b></td><td data-label="${t('prop.for')}">${esc(propFor(p))}</td><td data-label="${t('f.total')}" class="num">${money(propTotals(p).total, true)}</td><td data-label="${t('f.status')}">${pill('proposalStatus', p.status)}${propExpired(p) ? ` <span class="tag is-late">${t('prop.expired')}</span>` : ''}</td><td data-label="${t('prop.validUntil')}">${p.validUntil ? fmtDate(p.validUntil) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  },
  openId: (id) => openProposal(id),
};

ACT.newProposal = (el) => {
  closeMenu();
  const l = el?.dataset.lead ? Store.get('leads', el.dataset.lead) : null;
  editProposal(null, l ? { leadId: l.id, clientId: l.clientId || '', title: l.service ? label('service', l.service) : '', items: [{ desc: l.service ? label('service', l.service) : '', qty: 1, price: Number(l.value) || 0 }] } : {});
};
function editProposal(id, defaults = {}) {
  const existing = id ? Store.get('proposals', id) : null;
  const issue = today();
  const p = existing ? JSON.parse(JSON.stringify(existing)) : { number: nextProposalNumber(issue), issue, validUntil: addDays(issue, 14), status: 'draft', items: [{ desc: '', qty: 1, price: 0 }], discount: 0, vat: Number(DB.settings.vat) || 0, intro: t('prop.introDefault'), terms: t('prop.termsDefault'), template: '', ...defaults };
  const forVal = p.clientId ? `c:${p.clientId}` : p.leadId ? `l:${p.leadId}` : '';
  const leadsOpen = DB.leads.filter((l) => !l.clientId && l.stage !== 'lost' || l.id === p.leadId);
  const forOpts = `<option value="">—</option><optgroup label="${t('nav.clients')}">${[...DB.clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => `<option value="c:${c.id}" ${forVal === 'c:' + c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup><optgroup label="${t('nav.leads')}">${leadsOpen.map((l) => `<option value="l:${l.id}" ${forVal === 'l:' + l.id ? 'selected' : ''}>${esc(l.company || l.name)}${l.company ? ' — ' + esc(l.name) : ''}</option>`).join('')}</optgroup>`;
  const row = (it = { desc: '', qty: 1, price: 0 }) => `<div class="items__row"><input class="input" data-it="desc" value="${esc(it.desc)}" placeholder="${t('f.desc')}" /><input class="input" data-it="qty" type="number" min="0" step="any" value="${it.qty}" /><input class="input" data-it="price" type="number" min="0" step="any" value="${it.price}" /><span class="total num"></span><button class="icon-btn icon-btn--sm" data-act="rmItem" aria-label="remove">${icon('close')}</button></div>`;
  openModal({
    title: t(existing ? 'prop.edit' : 'prop.new'), width: 860,
    body: `<form id="propForm" novalidate><div class="form-grid">
        <label class="field field--full" data-k="title"><span>${t('prop.title')} <b>*</b></span><input name="title" value="${esc(p.title || '')}" placeholder="${t('prop.titlePh')}" /></label>
        <label class="field" data-k="for"><span>${t('prop.for')} <b>*</b></span><select name="for">${forOpts}</select></label>
        <label class="field" data-k="number"><span>${t('f.number')}</span><input name="number" value="${esc(p.number)}" dir="ltr" /></label>
        <label class="field"><span>${t('f.issue')}</span><input type="date" name="issue" value="${esc(p.issue)}" /></label>
        <label class="field"><span>${t('prop.validUntil')}</span><input type="date" name="validUntil" value="${esc(p.validUntil || '')}" /></label>
        <label class="field"><span>${t('prop.template')}</span><select name="template"><option value="">${t('tpl.none')}</option>${ENUM.projectTemplate.map((k) => `<option value="${k}" ${p.template === k ? 'selected' : ''}>${esc(label('projectTemplate', k))}</option>`).join('')}</select></label>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px"><label class="field"><span>${t('f.discount')}</span><input type="number" min="0" max="100" step="any" name="discount" value="${p.discount || 0}" /></label><label class="field"><span>${t('f.vat')}</span><input type="number" min="0" max="100" step="any" name="vat" value="${p.vat || 0}" /></label></div>
        <label class="field field--full"><span>${t('prop.intro')}</span><textarea name="intro" rows="3">${esc(p.intro || '')}</textarea></label>
      </div>
      <div class="sect" style="margin-top:18px"><h4>${t('prop.items')}</h4>
        <div class="items"><div class="items__row items__head"><span>${t('f.desc')}</span><span>${t('f.qty')}</span><span>${t('f.price')}</span><span style="text-align:end">${t('f.total')}</span><span></span></div><div id="itemRows">${(p.items.length ? p.items : [{ desc: '', qty: 1, price: 0 }]).map(row).join('')}</div></div>
        <button type="button" class="btn btn--ghost btn--sm" data-act="addItem" style="margin-top:10px">${icon('plus')}${t('inv.addItem')}</button>
        <div class="totals" id="invTotals"></div></div>
      <label class="field field--full" style="margin-top:14px"><span>${t('prop.terms')}</span><textarea name="terms" rows="4">${esc(p.terms || '')}</textarea></label></form>`,
    foot: `<button class="btn btn--ghost" data-act="closeModal">${t('act.cancel')}</button><button class="btn" data-act="saveProposal" data-id="${esc(id || '')}">${icon('check')}${t('act.save')}</button>`,
    onMount(m) {
      ACT.addItem = () => { $('#itemRows').insertAdjacentHTML('beforeend', row()); recalc(); $('#itemRows .items__row:last-child input').focus(); };
      ACT.rmItem = (b) => { if ($$('#itemRows .items__row').length > 1) b.closest('.items__row').remove(); recalc(); };
      const recalc = () => {
        const items = readItems();
        const tot = invTotals({ items, discount: $('[name=discount]', m).value, vat: $('[name=vat]', m).value });
        $$('#itemRows .items__row').forEach((r, i) => { $('.total', r).textContent = money((items[i]?.qty || 0) * (items[i]?.price || 0)); });
        $('#invTotals').innerHTML = `<div><span>${t('f.subtotal')}</span><span class="num">${money(tot.subtotal)}</span></div>${tot.discount ? `<div><span>${t('f.discount')}</span><span class="num">−${money(tot.discount)}</span></div>` : ''}${tot.vat ? `<div><span>${t('f.vat')}</span><span class="num">${money(tot.vat)}</span></div>` : ''}<div class="grand"><span>${t('f.total')}</span><b class="num">${money(tot.total)}</b></div>`;
      };
      $('#propForm', m).addEventListener('input', recalc);
      $('#propForm', m).addEventListener('submit', (e) => e.preventDefault());
      recalc();
    },
  });
}
ACT.saveProposal = (el) => {
  const f = $('#propForm');
  const val = (n) => $(`[name="${n}"]`, f).value.trim();
  $$('.field', f).forEach((x) => x.classList.remove('is-invalid'));
  const missing = ['title', 'for'].filter((k) => !val(k));
  if (missing.length) { missing.forEach((k) => $(`.field[data-k=${k}]`, f).classList.add('is-invalid')); return toast(t('msg.required'), { err: true }); }
  const id = el.dataset.id;
  const existing = id ? Store.get('proposals', id) : null;
  const [kind, ref] = val('for').split(':');
  const rec = { ...(existing || {}), title: val('title'), number: val('number') || nextProposalNumber(val('issue')), clientId: kind === 'c' ? ref : '', leadId: kind === 'l' ? ref : '', issue: val('issue'), validUntil: val('validUntil'), template: val('template'), discount: Number(val('discount')) || 0, vat: Number(val('vat')) || 0, intro: val('intro'), terms: val('terms'), items: readItems(), status: existing?.status || 'draft' };
  if (kind === 'l') { const l = Store.get('leads', ref); if (l?.clientId) { rec.clientId = l.clientId; } }
  closeModal();
  const saved = Store.save('proposals', rec, existing ? {} : { log: { type: 'create', text: 'created', extra: { name: rec.title } } });
  toast(t('msg.saved'));
  openProposal(saved.id);
};

function openProposal(id) {
  openDrawer(() => {
    const p = Store.get('proposals', id);
    if (!p) return null;
    const tot = propTotals(p);
    const lead = p.leadId ? Store.get('leads', p.leadId) : null;
    const c = p.clientId ? clientById(p.clientId) : null;
    const proj = p.projectId ? projectById(p.projectId) : null;
    const canEdit = p.status === 'draft' || p.status === 'sent';
    return `${drawerHead(`${t('prop.one')} · <span class="num">${esc(p.number)}</span>`, esc(p.title), `<div style="display:flex;gap:10px;margin-top:12px;align-items:center;flex-wrap:wrap">${pill('proposalStatus', p.status)}${propExpired(p) ? `<span class="tag is-late">${t('prop.expired')}</span>` : ''}<b class="num lime" style="font-size:1.2rem">${money(tot.total)}</b></div>`)}
      <div class="drawer__body">
        <div class="quick"><button data-act="printProposal" data-id="${p.id}">${icon('print')}${t('act.print')}</button>
          ${p.status === 'draft' ? `<button data-act="proposalSent" data-id="${p.id}">${icon('mail')}${t('prop.markSent')}</button>` : ''}
          ${canEdit ? `<button data-act="acceptProposal" data-id="${p.id}">${icon('check')}${t('prop.accept')}</button><button data-act="rejectProposal" data-id="${p.id}">${icon('close')}${t('prop.reject')}</button>` : ''}
          <button data-act="dupProposal" data-id="${p.id}">${icon('repeat')}${t('act.duplicate')}</button></div>
        ${kv([[t('prop.for'), c ? `<a data-act="open" data-kind="client" data-id="${c.id}" style="cursor:pointer;color:var(--violet-2)">${esc(c.name)}</a>` : lead ? `<a data-act="open" data-kind="lead" data-id="${lead.id}" style="cursor:pointer;color:var(--violet-2)">${esc(lead.company || lead.name)}</a>` : '—'], [t('f.issue'), fmtDate(p.issue)], [t('prop.validUntil'), p.validUntil ? `${fmtDate(p.validUntil)}${p.status === 'sent' ? ' · ' + relDay(p.validUntil) : ''}` : ''], proj ? [t('f.project'), `<a data-act="open" data-kind="project" data-id="${proj.id}" style="cursor:pointer;color:var(--violet-2)">${esc(proj.name)}</a>`] : p.template ? [t('prop.template'), esc(label('projectTemplate', p.template))] : null])}
        ${p.intro ? `<div class="sect"><h4>${t('prop.intro')}</h4><div class="card" style="padding:14px;white-space:pre-wrap">${esc(p.intro)}</div></div>` : ''}
        <div class="sect"><h4>${t('prop.items')}</h4><div class="table-wrap"><table class="table"><thead><tr><th>${t('f.desc')}</th><th>${t('f.qty')}</th><th>${t('f.price')}</th><th style="text-align:end">${t('f.total')}</th></tr></thead><tbody>
          ${(p.items || []).map((it) => `<tr style="cursor:default"><td style="white-space:normal">${esc(it.desc)}</td><td class="num">${it.qty}</td><td class="num">${money(it.price)}</td><td class="num" style="text-align:end">${money(it.qty * it.price)}</td></tr>`).join('')}</tbody></table></div>
          <div class="totals"><div><span>${t('f.subtotal')}</span><span class="num">${money(tot.subtotal)}</span></div>${tot.discount ? `<div><span>${t('f.discount')} (${p.discount}%)</span><span class="num">−${money(tot.discount)}</span></div>` : ''}${tot.vat ? `<div><span>${t('f.vat')} (${p.vat}%)</span><span class="num">${money(tot.vat)}</span></div>` : ''}<div class="grand"><span>${t('f.total')}</span><b class="num">${money(tot.total)}</b></div></div></div>
        ${p.terms ? `<div class="sect"><h4>${t('prop.terms')}</h4><div class="card" style="padding:14px;white-space:pre-wrap">${esc(p.terms)}</div></div>` : ''}
      </div>
      <div class="drawer__foot">${can.remove() ? `<button class="btn btn--danger btn--sm" data-act="deleteRecord" data-col="proposals" data-id="${p.id}">${icon('trash')}</button><span class="spacer"></span>` : ''}
        ${canEdit ? `<button class="btn btn--ghost btn--sm" data-act="editProposalBtn" data-id="${p.id}">${icon('edit')}${t('act.edit')}</button>` : ''}</div>`;
  });
}
ACT.editProposalBtn = (el) => editProposal(el.dataset.id);
ACT.dupProposal = (el) => {
  const p = Store.get('proposals', el.dataset.id);
  if (!p) return;
  editProposal(null, { title: p.title, clientId: p.clientId, leadId: p.leadId, items: JSON.parse(JSON.stringify(p.items || [])), discount: p.discount, vat: p.vat, intro: p.intro, terms: p.terms, template: p.template });
};
ACT.proposalSent = (el) => {
  const p = Store.get('proposals', el.dataset.id);
  if (!p) return;
  Store.save('proposals', { ...p, status: 'sent', sentAt: today() });
  const l = p.leadId ? Store.get('leads', p.leadId) : null;
  if (l && ['new', 'contacted', 'discovery'].includes(l.stage)) setLeadStage(l, 'proposal');
  toast(t('prop.sentDone'));
};
ACT.rejectProposal = async (el) => {
  const p = Store.get('proposals', el.dataset.id);
  if (!p || !(await confirmBox(t('prop.rejectQ'), { ok: t('prop.reject') }))) return;
  Store.save('proposals', { ...p, status: 'rejected', decidedAt: today() });
};
ACT.printProposal = (el, e) => {
  e?.stopPropagation();
  const p = Store.get('proposals', el.dataset.id);
  if (!p) return;
  const tot = propTotals(p);
  const S = DB.settings;
  const c = p.clientId ? clientById(p.clientId) : null;
  const l = p.leadId ? Store.get('leads', p.leadId) : null;
  const to = c ? { name: c.name, contact: c.contact, phone: c.phone, email: c.email } : l ? { name: l.company || l.name, contact: l.company ? l.name : '', phone: l.phone, email: l.email } : {};
  const body = `<div class="cols"><div><div class="lab">${t('inv.from')}</div><b>${esc(S.agency)}</b><br>${esc(S.address || '')}${S.phone ? '<br>' + esc(S.phone) : ''}${S.email ? '<br>' + esc(S.email) : ''}</div>
    <div><div class="lab">${t('prop.preparedFor')}</div><b>${esc(to.name || '')}</b>${to.contact ? '<br>' + esc(to.contact) : ''}${to.phone ? '<br><span dir="ltr">' + esc(to.phone) + '</span>' : ''}${to.email ? '<br>' + esc(to.email) : ''}</div></div>
    ${p.intro ? `<div class="notes" style="background:none;padding:0;margin:0 0 20px">${esc(p.intro)}</div>` : ''}
    <table><thead><tr><th>${t('f.desc')}</th><th class="n">${t('f.qty')}</th><th class="n">${t('f.price')}</th><th class="n">${t('f.total')}</th></tr></thead><tbody>${(p.items || []).map((it) => `<tr><td>${esc(it.desc)}</td><td class="n">${it.qty}</td><td class="n">${money(it.price)}</td><td class="n">${money(it.qty * it.price)}</td></tr>`).join('')}</tbody></table>
    <div class="tot"><div><span>${t('f.subtotal')}</span><span class="n">${money(tot.subtotal)}</span></div>${tot.discount ? `<div><span>${t('f.discount')} (${p.discount}%)</span><span class="n">−${money(tot.discount)}</span></div>` : ''}${tot.vat ? `<div><span>${t('f.vat')} (${p.vat}%)</span><span class="n">${money(tot.vat)}</span></div>` : ''}<div class="g"><span>${t('f.total')}</span><b class="n">${money(tot.total)}</b></div></div>
    ${p.terms ? `<h2>${t('prop.terms')}</h2><div class="notes">${esc(p.terms)}</div>` : ''}`;
  printDoc(p.number, `${t('prop.one')} <span>${esc(p.number)}</span>`, `${t('f.issue')}: <b>${longDate(p.issue)}</b>${p.validUntil ? `<br>${t('prop.validUntil')}: <b>${longDate(p.validUntil)}</b>` : ''}`, `<h2 style="margin-top:0;font-size:20px">${esc(p.title)}</h2>` + body);
};

/* Accept: client (from the lead if needed) → lead won → project (+ template) → deposit invoice. */
ACT.acceptProposal = (el) => {
  const p = Store.get('proposals', el.dataset.id);
  if (!p) return;
  openModal({
    title: t('prop.acceptTitle'), width: 520,
    body: `<p class="muted" style="margin-top:0">${t('prop.acceptLead', { total: money(propTotals(p).total) })}</p>
      <label class="check" style="--c:var(--violet-2);margin-bottom:10px"><input type="checkbox" id="accProject" checked /><span>${t('prop.makeProject')}${p.template ? ` (${esc(label('projectTemplate', p.template))})` : ''}</span></label>
      ${can.finance() ? `<label class="check" style="--c:var(--violet-2)"><input type="checkbox" id="accInvoice" checked /><span>${t('prop.makeInvoice')}</span></label>
      <label class="field" style="margin-top:10px;max-width:200px"><span>${t('prop.deposit')}</span><input type="number" class="input" id="accDeposit" min="0" max="100" value="50" /></label>` : ''}`,
    foot: `<button class="btn btn--ghost" data-act="closeModal">${t('act.cancel')}</button><button class="btn" data-act="confirmAccept" data-id="${p.id}">${icon('check')}${t('prop.accept')}</button>`,
  });
};
function clientFromLead(l) {
  return Store.save('clients', {
    name: l.company || l.name, contact: l.name, phone: l.phone, email: l.email, industry: l.industry || 'other',
    services: l.service ? [l.service] : [], status: 'onboarding', manager: l.owner || me().id, since: today(),
    color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)], retainer: 0, notes: l.notes || '', leadId: l.id,
  }, { log: { type: 'create', text: 'created', extra: { name: l.company || l.name } } });
}
ACT.confirmAccept = (el) => {
  const p = Store.get('proposals', el.dataset.id);
  if (!p) return;
  const makeProject = $('#accProject')?.checked;
  const makeInvoice = $('#accInvoice')?.checked;
  const deposit = clamp(Number($('#accDeposit')?.value) || 0, 0, 100);
  closeModal();
  const net = propNet(p);
  const lead = p.leadId ? Store.get('leads', p.leadId) : null;
  let clientId = p.clientId || lead?.clientId || '';
  if (!clientId && lead) clientId = clientFromLead(lead).id;
  if (lead) Store.save('leads', { ...lead, clientId, stage: 'won', value: net, wonAt: lead.wonAt || today(), lostAt: '' }, lead.stage === 'won' ? {} : { log: { type: 'stage', text: 'won' } });
  let projectId = p.projectId || '';
  if (makeProject && !projectId && clientId) {
    const tpl = PROJECT_TEMPLATES[p.template];
    const start = today();
    const proj = Store.save('projects', { name: p.title, clientId, service: tpl?.service || lead?.service || '', status: 'brief', owner: clientById(clientId)?.manager || me().id, start, due: addDays(start, tpl?.days || 30), budget: net, progress: 0, template: p.template || '', deliverables: p.template ? tplDeliverables(p.template) : [], notes: '' }, { log: { type: 'create', text: 'created', extra: { name: p.title } } });
    projectId = proj.id;
    if (p.template) applyTemplateTasks(proj, p.template);
  }
  if (makeInvoice && deposit > 0 && clientId && can.finance()) {
    const issue = today();
    Store.save('invoices', { number: nextInvoiceNumber(issue), clientId, projectId, issue, due: addDays(issue, 7), status: 'draft', items: [{ desc: t('prop.depositLine', { title: p.title, n: deposit }), qty: 1, price: Math.round(net * deposit) / 100 }], discount: 0, vat: p.vat || 0, notes: p.number });
  }
  Store.save('proposals', { ...p, status: 'accepted', decidedAt: today(), clientId, projectId }, { log: { type: 'accepted', text: 'accepted', extra: { name: p.title } } });
  burst();
  toast(t('prop.acceptedDone'));
  if (projectId) openProject(projectId); else openProposal(p.id);
};

/* ==========================================================================
   5) CLIENT PORTAL — a private link per client to approve posts & deliverables
   ========================================================================== */
const portalUrl = (c) => (c.portalKey ? `${location.origin}${location.pathname.replace(/[^/]*$/, '')}portal.html#k=${c.portalKey}` : '');
function newPortalKey() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join(''); }
const approvalMark = (c) => (c.clientApproval === 'approved' ? `<b class="appr is-ok" title="${t('portal.okShort')}">✓</b>` : c.clientApproval === 'changes' ? `<b class="appr is-chg" title="${esc(t('portal.changesShort') + (c.clientNote ? ': ' + c.clientNote : ''))}">!</b>` : '');
const contentClientNoteHTML = (c) => (c.clientApproval ? `<div class="client-note ${c.clientApproval === 'approved' ? 'is-ok' : 'is-chg'}">${icon(c.clientApproval === 'approved' ? 'check' : 'alert')}<div><b>${t(c.clientApproval === 'approved' ? 'portal.okShort' : 'portal.changesShort')}</b>${c.clientAt ? ` · <small>${fmtDate(dayOf(c.clientAt))}</small>` : ''}${c.clientNote ? `<p>${esc(c.clientNote)}</p>` : ''}</div></div>` : '');

function clientPortalHTML(c) {
  const url = portalUrl(c);
  const pendingPosts = DB.content.filter((x) => x.clientId === c.id && x.status === 'approval' && !x.clientApproval).length;
  const pendingDlv = DB.projects.filter((p) => p.clientId === c.id).flatMap(deliverablesOf).filter((d) => d.status === 'sent').length;
  const decisions = DB.activity.filter((a) => a.by === 'client' && (a.clientId === c.id)).slice(0, 8);
  const wa = c.phone && url ? `https://wa.me/${waLink(c.phone).split('/').pop()}?text=${encodeURIComponent(t('portal.waText', { name: c.contact || c.name, url }))}` : '';
  return `<div style="margin-top:12px">
    <p class="muted" style="margin:0 0 12px;font-size:.85rem;line-height:1.7">${t('portal.explain')}</p>
    ${!isCloud() ? `<p class="amber" style="font-size:.82rem">${icon('alert')} ${t('portal.demo')}</p>` : ''}
    <div class="mini-stats" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:12px"><div><b class="num">${pendingPosts}</b><small>${t('portal.pendingPosts')}</small></div><div><b class="num">${pendingDlv}</b><small>${t('portal.pendingDlv')}</small></div></div>
    ${url ? `<div class="portal-link"><input class="input" readonly dir="ltr" value="${esc(url)}" id="portalUrl" /><button class="btn btn--sm" data-act="copyPortal">${icon('link')}${t('portal.copy')}</button></div>
      <div class="quick" style="margin-top:10px">${wa ? `<a class="wa" href="${esc(wa)}" target="_blank" rel="noopener">${icon('wa')}${t('portal.sendWa')}</a>` : ''}<a href="${esc(url)}" target="_blank" rel="noopener">${icon('globe')}${t('portal.open')}</a>${can.portal() ? `<button data-act="resetPortal" data-id="${c.id}">${icon('repeat')}${t('portal.reset')}</button>` : ''}</div>`
    : can.portal() ? `<button class="btn btn--sm" data-act="makePortal" data-id="${c.id}">${icon('link')}${t('portal.make')}</button>` : `<p class="dim">${t('portal.askAdmin')}</p>`}
    <div class="sect"><h4>${icon('check')}${t('portal.decisions')}</h4>${decisions.length ? feedHTML(decisions, { notes: false }) : `<p class="dim" style="font-size:.82rem;margin:0">${t('portal.noDecisions')}</p>`}</div></div>`;
}
ACT.makePortal = (el) => { const c = clientById(el.dataset.id); if (c) { Store.save('clients', { ...c, portalKey: newPortalKey() }); toast(t('portal.made')); } };
ACT.resetPortal = async (el) => {
  const c = clientById(el.dataset.id);
  if (!c || !(await confirmBox(t('portal.resetQ'), { ok: t('portal.reset') }))) return;
  Store.save('clients', { ...c, portalKey: newPortalKey() });
  toast(t('portal.made'));
};
ACT.copyPortal = () => { const i = $('#portalUrl'); if (!i) return; i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => toast(t('portal.copied')), () => { document.execCommand('copy'); toast(t('portal.copied')); }); };

/* ---------- Client drawer tabs added by this file ---------- */
const CLIENT_EXTRA_TABS = [
  { k: 'results', label: () => t('clients.tab.results'), count: (c) => new Set(DB.results.filter((r) => r.clientId === c.id && r.platform !== NOTES).map((r) => r.month)).size, render: clientResultsHTML },
  { k: 'portal', label: () => t('clients.tab.portal'), count: (c) => DB.content.filter((x) => x.clientId === c.id && x.status === 'approval' && !x.clientApproval).length, render: clientPortalHTML },
];

/* ---------- Demo data for the new collections ---------- */
function seedAgencyExtras(T, clients) {
  const results = [], adfunds = [], proposals = [];
  DB.tasks.forEach((tk, i) => { if (tk.clientId) tk.hours = [2, 4, 1.5, 6, 3, 8, 2.5][i % 7]; });
  const m0 = thisMonth();
  const plan = { 'C-01': [42000, 160, 1.0], 'C-03': [90000, 120, 0], 'C-04': [30000, 95, 2.1], 'C-08': [25000, 70, 0] };
  Object.entries(plan).forEach(([cid, [base, leads, roas]], k) => {
    const c = clients.find((x) => x.id === cid);
    if (c) Object.assign(c, { adBudget: base, targetLeads: leads, targetCpl: Math.round(base / leads) });
    for (let i = 1; i <= 5; i++) {
      const month = shiftMonth(m0, -i);
      const f = 0.8 + ((i * 7 + k * 3) % 5) / 10;
      const spend = Math.round(base * f);
      const lc = Math.round(leads * (0.75 + ((i + k) % 4) / 8));
      results.push({ id: resultId(cid, month, 'meta'), clientId: cid, month, platform: 'meta', spend: Math.round(spend * 0.7), impressions: spend * 38, clicks: Math.round(spend * 0.42), leadCount: Math.round(lc * 0.75), salesCount: 0, revenue: roas ? Math.round(spend * 0.7 * roas) : 0 });
      results.push({ id: resultId(cid, month, k % 2 ? 'google' : 'tiktok'), clientId: cid, month, platform: k % 2 ? 'google' : 'tiktok', spend: Math.round(spend * 0.3), impressions: spend * 15, clicks: Math.round(spend * 0.2), leadCount: Math.round(lc * 0.25), salesCount: 0, revenue: roas ? Math.round(spend * 0.3 * roas) : 0 });
    }
    adfunds.push({ id: `AF-${cid}-1`, clientId: cid, date: addDays(T, -70), amount: base * 3, note: '' }, { id: `AF-${cid}-2`, clientId: cid, date: addDays(T, -10), amount: k === 2 ? base * 2 : base * 3, note: '' });
  });
  results.push({ id: resultId('C-01', shiftMonth(m0, -1), NOTES), clientId: 'C-01', month: shiftMonth(m0, -1), platform: NOTES, highlights: 'Lead cost dropped after we moved budget to the reels campaign.', nextSteps: 'Launch the Ramadan teaser on the 1st and test WhatsApp click-to-chat ads.' });
  proposals.push(
    { id: 'PR-01', number: `WAV-P${T.slice(0, 4)}-001`, title: 'Social media + ads — 3 months', leadId: 'L-12', clientId: '', issue: addDays(T, -6), validUntil: addDays(T, 8), status: 'sent', sentAt: addDays(T, -5), template: 'social', items: [{ desc: 'Monthly social media management', qty: 3, price: 28000 }, { desc: 'Ads management fee', qty: 3, price: 12000 }], discount: 5, vat: 14, intro: t('prop.introDefault'), terms: t('prop.termsDefault'), createdAt: addDays(T, -6), updatedAt: addDays(T, -5) },
    { id: 'PR-02', number: `WAV-P${T.slice(0, 4)}-002`, title: 'Brand identity', leadId: 'L-09', clientId: '', issue: addDays(T, -2), validUntil: addDays(T, 12), status: 'draft', template: 'branding', items: [{ desc: 'Brand identity & guidelines', qty: 1, price: 65000 }], discount: 0, vat: 14, intro: t('prop.introDefault'), terms: t('prop.termsDefault'), createdAt: addDays(T, -2), updatedAt: addDays(T, -2) },
    { id: 'PR-03', number: `WAV-P${T.slice(0, 4)}-003`, title: 'Ordering website', leadId: '', clientId: 'C-07', issue: addDays(T, -20), validUntil: addDays(T, -6), status: 'accepted', decidedAt: addDays(T, -8), template: 'website', items: [{ desc: 'Website design & development', qty: 1, price: 95000 }], discount: 0, vat: 14, intro: '', terms: '', projectId: 'P-05', createdAt: addDays(T, -20), updatedAt: addDays(T, -8) },
  );
  return { results, adfunds, proposals };
}
