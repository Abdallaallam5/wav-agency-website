/* ==========================================================================
   Import a sheet of prospects and deal them out to the team.
   Reads .xlsx / .csv / pasted cells, matches columns, skips duplicates,
   shuffles, then deals the rows round-robin so everyone gets the same share.
   Each lead keeps its position in its owner's list (`queue`) and the sheet it came from (`batch`).
   ========================================================================== */

const IMPORT_MAX_ROWS = 3000;

const IMPORT_FIELDS = [
  { k: 'name', label: 'f.name', alias: ['name', 'full name', 'fullname', 'client', 'customer', 'contact', 'lead', 'الاسم', 'اسم', 'العميل', 'اسم العميل', 'الاسم بالكامل'] },
  { k: 'phone', label: 'f.phone', alias: ['phone', 'mobile', 'tel', 'telephone', 'whatsapp', 'number', 'cell', 'الموبايل', 'موبايل', 'التليفون', 'تليفون', 'الهاتف', 'هاتف', 'رقم', 'رقم الموبايل', 'رقم التليفون', 'واتساب', 'واتس'] },
  { k: 'email', label: 'f.email', alias: ['email', 'e-mail', 'mail', 'الايميل', 'ايميل', 'الإيميل', 'إيميل', 'البريد', 'البريد الالكتروني'] },
  { k: 'company', label: 'f.company', alias: ['company', 'business', 'organization', 'organisation', 'brand', 'الشركة', 'شركة', 'الجهة', 'النشاط', 'البراند', 'اسم الشركة'] },
  { k: 'city', label: 'f.city', alias: ['city', 'location', 'area', 'المدينة', 'مدينة', 'المنطقة', 'العنوان'] },
  { k: 'notes', label: 'f.notes', alias: ['notes', 'note', 'comment', 'comments', 'ملاحظات', 'ملاحظة', 'تعليق'] },
];

/* ---------- reading files ---------- */

const normHeader = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** CSV / TSV with quotes. The delimiter is guessed from the first line. */
function parseDelimited(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => (first.match(new RegExp(ch === '\t' ? '\\t' : '\\' + ch, 'g')) || []).length;
  const delim = [',', ';', '\t'].sort((a, b) => count(b) - count(a))[0];
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Excel exports "CSV" in a legacy code page unless the user picks "CSV UTF-8": fall back so Arabic survives. */
function decodeText(buf) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1256').decode(buf); }
}

/** Minimal .xlsx reader: an .xlsx is a zip of XML files, and browsers can inflate zip entries natively. */
async function parseXlsx(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let n = 0; n < count; n++) {
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    files[new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen))] = { method: dv.getUint16(p + 10, true), size: dv.getUint32(p + 20, true), off: dv.getUint32(p + 42, true) };
    p += 46 + nlen + elen + clen;
  }
  const read = async (name) => {
    const f = files[name];
    if (!f) return null;
    const start = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true);
    const data = u8.subarray(start, start + f.size);
    if (f.method === 0) return new TextDecoder().decode(data);
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const sheetName = Object.keys(files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))[0];
  if (!sheetName) throw new Error('no sheet');
  const shared = [];
  const ss = await read('xl/sharedStrings.xml');
  if (ss) Array.from(xml(ss).getElementsByTagName('si')).forEach((si) => shared.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent).join('')));
  const rows = [];
  Array.from(xml(await read(sheetName)).getElementsByTagName('row')).forEach((r) => {
    const row = [];
    Array.from(r.getElementsByTagName('c')).forEach((c) => {
      const letters = (c.getAttribute('r') || '').replace(/\d+/g, '');
      let col = 0;
      for (const ch of letters) col = col * 26 + ch.charCodeAt(0) - 64;
      col = Math.max(col - 1, row.length);
      const type = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      row[col] = type === 's' ? shared[Number(v)] ?? '' : type === 'inlineStr' ? Array.from(c.getElementsByTagName('t')).map((t) => t.textContent).join('') : v;
    });
    rows.push(row);
  });
  return rows;
}

async function readSheetFile(file) {
  const buf = await file.arrayBuffer();
  if (/\.xlsx$/i.test(file.name) || new Uint8Array(buf.slice(0, 2)).join() === '80,75') return parseXlsx(buf);
  return parseDelimited(decodeText(buf));
}

/* ---------- cleaning ---------- */

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const asciiDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d));

function cleanPhone(v) {
  let s = asciiDigits(v).replace(/[^\d+]/g, '');
  if (s.startsWith('+20')) s = '0' + s.slice(3);
  else if (s.startsWith('0020')) s = '0' + s.slice(4);
  else if (/^20\d{10}$/.test(s)) s = '0' + s.slice(2);
  if (/^1\d{9}$/.test(s)) s = '0' + s; // Excel drops the leading zero of Egyptian mobiles
  return s.replace(/\+/g, (m, i) => (i === 0 ? m : ''));
}
const phoneKey = (p) => (p.replace(/\D/g, '').length >= 7 ? p.replace(/\D/g, '').slice(-10) : '');

/** Which column feeds which field, found by header name. Returns { map, hasHeader }. */
function guessMapping(rows) {
  const head = (rows[0] || []).map(normHeader);
  const map = {};
  IMPORT_FIELDS.forEach((f) => {
    const aliases = f.alias.map(normHeader);
    let i = head.findIndex((h, ix) => h && aliases.includes(h) && !Object.values(map).includes(ix));
    if (i < 0) i = head.findIndex((h, ix) => h && aliases.some((a) => a.length > 2 && h.includes(a)) && !Object.values(map).includes(ix));
    if (i >= 0) map[f.k] = i;
  });
  const hasHeader = Object.keys(map).length > 0;
  if (!hasHeader) ['name', 'phone', 'email', 'company'].forEach((k, i) => { if (i < (rows[0] || []).length) map[k] = i; });
  return { map, hasHeader };
}

function buildLeadRows(imp) {
  const existing = new Set();
  [...DB.leads, ...DB.clients].forEach((r) => { const k = phoneKey(cleanPhone(r.phone || '')); if (k) existing.add('p' + k); if (r.email) existing.add('e' + String(r.email).toLowerCase().trim()); });
  const seen = new Set();
  const out = { rows: [], dup: 0, skipped: 0 };
  imp.rows.slice(imp.hasHeader ? 1 : 0).forEach((r) => {
    if (!r.some((c) => String(c ?? '').trim())) return;
    const get = (k) => (imp.map[k] === undefined ? '' : String(r[imp.map[k]] ?? '').trim());
    const phone = cleanPhone(get('phone'));
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get('email')) ? get('email').toLowerCase() : '';
    if (!phoneKey(phone) && !email) { out.skipped++; return; }
    const keys = [phoneKey(phone) && 'p' + phoneKey(phone), email && 'e' + email].filter(Boolean);
    if (keys.some((k) => existing.has(k) || seen.has(k))) { out.dup++; return; }
    keys.forEach((k) => seen.add(k));
    out.rows.push({ name: get('name') || get('company') || phone || email, company: get('company'), phone: phoneKey(phone) ? phone : '', email, city: get('city'), notes: get('notes') });
  });
  return out;
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal the rows one by one to the chosen people. Returns [{ row, owner, queue }]. */
function dealRows(rows, userIds, shuffle) {
  const order = shuffle ? shuffled(rows) : rows;
  const people = shuffled(userIds); // so the leftover rows don't always go to the same people
  const next = {};
  return order.map((row, i) => {
    const owner = people[i % people.length];
    next[owner] = (next[owner] || 0) + 1;
    return { row, owner, queue: next[owner] };
  });
}

/* ---------- the dialog ---------- */

ACT.importLeads = () => {
  closeMenu();
  const people = DB.users.filter((u) => u.active !== false);
  const imp = {
    rows: [], map: {}, hasHeader: true, fileName: '',
    users: new Set(people.filter((u) => u.role !== 'admin').map((u) => u.id)),
    shuffle: true, deal: [], result: null,
  };
  if (!imp.users.size) people.forEach((u) => imp.users.add(u.id));

  openModal({
    title: t('imp.title'), width: 760,
    body: '<div id="impRoot"></div>',
    foot: `<button class="btn btn--ghost" data-act="closeModal">${t('act.cancel')}</button><button class="btn" id="impGo" disabled>${icon('check')}${t('imp.go', { n: 0 })}</button>`,
    onMount(m) {
      const root = $('#impRoot', m), go = $('#impGo', m);

      const recompute = (reshuffle = true) => {
        imp.result = imp.rows.length ? buildLeadRows(imp) : null;
        if (imp.result && (reshuffle || !imp.deal.length)) imp.deal = imp.users.size ? dealRows(imp.result.rows, [...imp.users], imp.shuffle) : [];
      };

      const draw = () => {
        const res = imp.result;
        const cols = imp.rows[0] || [];
        const colName = (i) => (imp.hasHeader && String(cols[i] ?? '').trim()) || `#${i + 1}`;
        const colOptions = (sel) => `<option value="">${t('imp.none')}</option>` + cols.map((_, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(colName(i))}</option>`).join('');
        const counts = {};
        imp.deal.forEach((d) => { counts[d.owner] = (counts[d.owner] || 0) + 1; });

        root.innerHTML = `
          <div class="field field--full"><span>${t('imp.step1')}</span>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <label class="btn btn--ghost btn--sm" style="cursor:pointer">${icon('upload')}${t('imp.choose')}<input type="file" id="impFile" accept=".xlsx,.csv,.tsv,.txt,text/csv" hidden /></label>
              <span class="muted" id="impName">${esc(imp.fileName)}</span>
            </div>
            <textarea id="impPaste" rows="3" placeholder="${esc(t('imp.paste'))}" style="margin-top:8px"></textarea>
            <small class="muted">${t('imp.hint')}</small>
          </div>
          ${res ? `
          <div class="sect" style="margin-top:16px"><h4 style="margin:0 0 8px">${t('imp.cols')}</h4>
            <div class="form-grid">${IMPORT_FIELDS.map((f) => `<label class="field"><span>${t(f.label)}</span><select data-imp-col="${f.k}">${colOptions(imp.map[f.k])}</select></label>`).join('')}</div>
          </div>
          <div class="sect" style="margin-top:16px"><h4 style="margin:0 0 8px">${t('imp.team')}</h4>
            <div style="display:flex;flex-wrap:wrap;gap:8px">${DB.users.filter((u) => u.active !== false).map((u) => `
              <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;cursor:pointer">
                <input type="checkbox" data-imp-user="${esc(u.id)}" ${imp.users.has(u.id) ? 'checked' : ''} />${avatar(u, 'avatar--sm')}<span>${esc(u.name)}</span>
                <b class="num">${counts[u.id] || 0}</b></label>`).join('')}</div>
            <label style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer"><input type="checkbox" id="impShuffle" ${imp.shuffle ? 'checked' : ''} />${t('imp.shuffle')}</label>
          </div>
          <p style="margin:16px 0 8px"><b>${t('imp.summary', { n: res.rows.length, d: res.dup, s: res.skipped })}</b>
            ${res.rows.length && imp.users.size ? `<button class="btn btn--ghost btn--sm" id="impReshuffle" style="margin-inline-start:10px">${icon('repeat')}${t('imp.reshuffle')}</button>` : ''}</p>
          ${imp.deal.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${t('f.name')}</th><th>${t('f.phone')}</th><th>${t('f.owner')}</th></tr></thead><tbody>
            ${imp.deal.slice(0, 6).map((d) => `<tr><td class="num">${d.queue}</td><td>${esc(d.row.name)}</td><td dir="ltr">${esc(d.row.phone || d.row.email)}</td><td>${esc(userById(d.owner)?.name || '')}</td></tr>`).join('')}
          </tbody></table></div>` : ''}` : ''}`;

        go.disabled = !(imp.deal.length && imp.users.size);
        go.innerHTML = `${icon('check')}${t('imp.go', { n: imp.deal.length })}`;
      };

      const load = (rows, name) => {
        rows = rows.filter((r) => r.length);
        if (!rows.length) return toast(t('imp.badFile'), { err: true });
        if (rows.length > IMPORT_MAX_ROWS + 1) { rows = rows.slice(0, IMPORT_MAX_ROWS + 1); toast(t('imp.tooMany', { n: IMPORT_MAX_ROWS }), { err: true }); }
        Object.assign(imp, { rows, fileName: name }, guessMapping(rows));
        recompute();
        draw();
      };

      root.addEventListener('change', async (e) => {
        const el = e.target;
        if (el.id === 'impFile' && el.files[0]) {
          try { load(await readSheetFile(el.files[0]), el.files[0].name); } catch (err) { toast(t('imp.badFile'), { err: true }); }
        } else if (el.dataset.impCol) {
          if (el.value === '') delete imp.map[el.dataset.impCol]; else imp.map[el.dataset.impCol] = Number(el.value);
          recompute(); draw();
        } else if (el.dataset.impUser) {
          if (el.checked) imp.users.add(el.dataset.impUser); else imp.users.delete(el.dataset.impUser);
          recompute(); draw();
        } else if (el.id === 'impShuffle') {
          imp.shuffle = el.checked; recompute(); draw();
        }
      });
      root.addEventListener('input', (e) => {
        if (e.target.id !== 'impPaste') return;
        clearTimeout(imp._pt);
        imp._pt = setTimeout(() => { const v = e.target.value; if (v.trim()) load(parseDelimited(v), t('imp.pasted')); }, 400);
      });
      root.addEventListener('click', (e) => { if (e.target.closest('#impReshuffle')) { recompute(true); draw(); } });

      go.addEventListener('click', () => {
        if (!imp.users.size) return toast(t('imp.needPeople'), { err: true });
        if (!imp.deal.length) return;
        const batch = `${today()} · ${imp.fileName}`;
        const at = today();
        const recs = imp.deal.map(({ row, owner, queue }) => ({
          name: row.name, company: row.company, phone: row.phone, email: row.email, city: row.city, notes: row.notes,
          source: 'cold', service: '', industry: '', stage: 'new', value: 0, owner, followUp: at, queue, batch,
        }));
        const n = recs.length, people = new Set(recs.map((r) => r.owner)).size;
        Store.saveMany('leads', recs);
        closeModal();
        const st = uiState('leads', {});
        Object.assign(st, { mode: 'table', owner: '', source: '', service: '', q: '', sort: 'queue', dir: 'asc' });
        saveUI();
        if (ROUTE.view === 'leads') renderView(); else location.hash = '#/leads';
        toast(t('imp.done', { n, m: people }));
      });

      draw();
    },
  });
};
