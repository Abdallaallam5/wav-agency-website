import { createHmac, randomUUID } from 'node:crypto';
import { Records, User } from './models.js';
import { safeEqual } from './auth.js';

/**
 * Meta Lead Ads → CRM. Facebook calls this webhook when someone submits a lead form on WAV's page;
 * we fetch the answers from the Graph API and create a lead (source "meta").
 *
 * Environment variables (all required to turn it on):
 *   META_VERIFY_TOKEN   any long random text; typed again in the Meta app when adding the webhook
 *   META_APP_SECRET     the Meta app's secret, used to check every call really comes from Meta
 *   META_PAGE_TOKEN     a long-lived Page access token with leads_retrieval permission
 * Optional:
 *   META_LEAD_OWNER     email of the teammate who owns new Meta leads
 */
const GRAPH = 'https://graph.facebook.com/v21.0';
export const metaEnabled = () => Boolean(process.env.META_VERIFY_TOKEN && process.env.META_APP_SECRET && process.env.META_PAGE_TOKEN);

/** GET: Meta checks the webhook URL once, when you add it in the app dashboard. */
export function metaVerify(query) {
  if (!process.env.META_VERIFY_TOKEN) return null;
  if (query['hub.mode'] === 'subscribe' && safeEqual(String(query['hub.verify_token'] || ''), process.env.META_VERIFY_TOKEN)) return String(query['hub.challenge'] || '');
  return null;
}

/** True when the raw body is signed with our app secret (X-Hub-Signature-256: sha256=<hex>). */
export function metaSigned(raw, header) {
  if (!process.env.META_APP_SECRET || !raw || !header) return false;
  const expected = `sha256=${createHmac('sha256', process.env.META_APP_SECRET).update(raw).digest('hex')}`;
  return safeEqual(String(header), expected);
}

async function fetchLead(leadgenId) {
  const tok = encodeURIComponent(process.env.META_PAGE_TOKEN);
  const get = async (fields) => {
    const res = await fetch(`${GRAPH}/${encodeURIComponent(leadgenId)}?fields=${fields}&access_token=${tok}`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    if (!res.ok || j.error) throw new Error(j.error?.message || `HTTP ${res.status}`);
    return j;
  };
  // ad_name / campaign_name need extra permissions; fall back to the answers alone.
  try { return await get('created_time,field_data,ad_name,campaign_name,form_id'); } catch { return get('created_time,field_data,form_id'); }
}

const FIELD = {
  name: ['full_name', 'name', 'الاسم', 'الاسم_بالكامل'], first: ['first_name'], last: ['last_name'],
  email: ['email', 'البريد_الإلكتروني'], phone: ['phone_number', 'phone', 'رقم_الهاتف'], company: ['company_name', 'company', 'اسم_الشركة'], city: ['city', 'المدينة'],
};

async function saveLead(leadgenId) {
  const id = `L-M${String(leadgenId).replace(/\D/g, '').slice(-20)}`;
  if (await Records.leads.exists({ _id: id })) return; // Meta retries; never create a lead twice
  const lead = await fetchLead(leadgenId);
  const answers = Object.fromEntries((lead.field_data || []).map((f) => [String(f.name || '').toLowerCase(), (f.values || []).join(', ')]));
  const pick = (keys) => keys.map((k) => answers[k]).find(Boolean) || '';
  const used = new Set(Object.values(FIELD).flat());
  const extra = Object.entries(answers).filter(([k]) => !used.has(k)).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
  const name = pick(FIELD.name) || [pick(FIELD.first), pick(FIELD.last)].filter(Boolean).join(' ') || 'Meta lead';
  const notes = [lead.campaign_name && `Campaign: ${lead.campaign_name}`, lead.ad_name && `Ad: ${lead.ad_name}`, ...extra].filter(Boolean).join('\n').slice(0, 2000);
  const owner = process.env.META_LEAD_OWNER ? (await User.findOne({ email: process.env.META_LEAD_OWNER.trim().toLowerCase() }).lean())?._id || '' : '';
  const at = new Date().toISOString();
  try {
    await Records.leads.create({
      _id: id, name: String(name).slice(0, 80), company: pick(FIELD.company).slice(0, 120), phone: pick(FIELD.phone).slice(0, 40), email: pick(FIELD.email).slice(0, 120),
      city: pick(FIELD.city).slice(0, 60), source: 'meta', service: '', stage: 'new', value: 0, owner, notes, metaLeadId: String(leadgenId),
      followUp: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()),
      createdAt: at, updatedAt: at, createdBy: 'meta', updatedBy: 'meta',
    });
  } catch (err) {
    if (err.code === 11000) return; // the same lead arrived twice at the same moment
    throw err;
  }
  await Records.activity.create({ _id: `A-M${randomUUID().slice(0, 8).toUpperCase()}`, type: 'create', entity: 'leads', entityId: id, text: 'created', name, by: 'meta', at, createdAt: at, updatedAt: at });
}

/** POST body from Meta: { object: 'page', entry: [{ changes: [{ field: 'leadgen', value: { leadgen_id } }] }] } */
export async function metaLeads(body) {
  const ids = (body?.entry || []).flatMap((e) => (e.changes || []).filter((c) => c.field === 'leadgen').map((c) => c.value?.leadgen_id)).filter(Boolean);
  for (const id of ids) await saveLead(id);
  return ids.length;
}
