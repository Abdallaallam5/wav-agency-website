// End-to-end check of the running API.
//   CRM_URL=http://localhost:4000/api CRM_EMAIL=... CRM_PASSWORD=... CRM_WEBSITE_KEY=... node test/smoke.mjs
import assert from 'node:assert/strict';

const URL_ = process.env.CRM_URL || 'http://localhost:4000/api';
const { CRM_EMAIL, CRM_PASSWORD, CRM_WEBSITE_KEY } = process.env;

// Same wire format as the frontend: JSON body sent as text/plain.
const call = async (action, data = {}) => {
  const res = await fetch(URL_, { method: 'POST', body: JSON.stringify({ action, ...data }) });
  assert.equal(res.status, 200, `${action}: HTTP ${res.status}`);
  return res.json();
};
const expectFail = async (p, code) => {
  const r = await p;
  assert.equal(r.ok, false, 'expected failure');
  assert.equal(r.code, code, `expected ${code}, got ${r.code} (${r.error})`);
};

let n = 0;
const step = async (name, fn) => { await fn(); console.log(`ok ${++n} - ${name}`); };
const stamp = Date.now().toString(36).toUpperCase();

let token;
let admin;

await step('ping', async () => assert.equal((await call('ping')).ok, true));

await step('wrong password rejected', () => expectFail(call('login', { email: CRM_EMAIL, password: 'nope-nope' }), 'BADPASS'));

await step('login returns token, user and data', async () => {
  const r = await call('login', { email: CRM_EMAIL, password: CRM_PASSWORD });
  assert.equal(r.ok, true);
  assert.equal(r.user.role, 'admin');
  assert.equal(r.user.passwordHash, undefined);
  assert.ok(r.data.leads && r.data.invoices && r.users.length >= 1 && r.settings.currency);
  token = r.token;
  admin = r.user;
});

await step('requests without a valid token are refused', async () => {
  await expectFail(call('bootstrap'), 'AUTH');
  await expectFail(call('bootstrap', { token: token.slice(0, -3) + 'abc' }), 'AUTH');
});

const leadId = `L-T${stamp}`;
let firstUpdatedAt;
await step('upsert a lead and read it back', async () => {
  const r = await call('batch', { token, ops: [{ op: 'upsert', collection: 'leads', record: { id: leadId, name: 'Smoke Test', stage: 'new', services: ['a', 'b'], value: 1500 } }] });
  assert.equal(r.results[0].record.id, leadId);
  firstUpdatedAt = r.results[0].record.updatedAt;
  const b = await call('bootstrap', { token });
  const lead = b.data.leads.find((l) => l.id === leadId);
  assert.equal(lead.name, 'Smoke Test');
  assert.deepEqual(lead.services, ['a', 'b']);
  assert.equal(lead._id, undefined);
  assert.equal(lead.createdBy, admin.id);
});

await step('update replaces fields and `changes` returns only newer records', async () => {
  const since = new Date(Date.now() + 30000).toISOString();
  await new Promise((r) => setTimeout(r, 15));
  await call('batch', { token, ops: [{ op: 'upsert', collection: 'leads', record: { id: leadId, name: 'Smoke Test 2', stage: 'won' } }] });
  const c = await call('changes', { token, since: new Date(Date.now() - 20000).toISOString() });
  const lead = c.data.leads.find((l) => l.id === leadId);
  assert.equal(lead.name, 'Smoke Test 2');
  assert.equal(lead.services, undefined);
  assert.ok(lead.updatedAt >= firstUpdatedAt);
  assert.equal((await call('changes', { token, since })).data.leads.length, 0);
});

await step('bad ops fail individually, not the whole batch', async () => {
  const r = await call('batch', { token, ops: [
    { op: 'upsert', collection: 'nope', record: { id: 'x' } },
    { op: 'upsert', collection: 'leads', record: { name: 'no id' } },
    { op: 'upsert', collection: 'leads', record: { id: `L-B${stamp}`, 'a.b': 1 } },
    { op: 'upsert', collection: 'leads', record: { id: `L-C${stamp}`, $set: 1 } },
    { op: 'upsert', collection: 'activity', record: { id: `A-T${stamp}`, type: 'create' } },
  ] });
  assert.deepEqual(r.results.map((x) => x.code || 'ok'), ['BAD', 'BAD', 'BAD', 'BAD', 'ok']);
});

await step('remove leaves a tombstone, and re-creating clears it', async () => {
  const r = await call('batch', { token, ops: [{ op: 'remove', collection: 'leads', id: leadId }] });
  assert.equal(r.results[0].removed, leadId);
  const c = await call('changes', { token, since: new Date(Date.now() - 20000).toISOString() });
  assert.ok(c.deleted.some((d) => d.id === leadId && d.collection === 'leads'));
  assert.ok(!(await call('bootstrap', { token })).data.leads.some((l) => l.id === leadId));
  await call('batch', { token, ops: [{ op: 'upsert', collection: 'leads', record: { id: leadId, name: 'Back' } }, { op: 'remove', collection: 'leads', id: leadId }] });
});

await step('settings: save and read back', async () => {
  const r = await call('saveSettings', { token, settings: { agency: 'WAV Smoke', vat: 14, evil: 'x' } });
  assert.equal(r.settings.agency, 'WAV Smoke');
  assert.equal(r.settings.evil, undefined);
  await call('saveSettings', { token, settings: { agency: 'WAV Marketing Agency' } });
});

const memberEmail = `smoke-${stamp.toLowerCase()}@example.com`;
let memberId;
await step('admin adds a member; validation works', async () => {
  await expectFail(call('saveUser', { token, user: { name: 'X', email: 'bad' }, password: 'longenough1' }), 'BAD');
  await expectFail(call('saveUser', { token, user: { name: 'X', email: memberEmail }, password: 'short' }), 'BAD');
  const r = await call('saveUser', { token, user: { name: 'Smoke Member', email: memberEmail, role: 'member' }, password: 'member-pass-1' });
  memberId = r.users.find((u) => u.email === memberEmail).id;
  assert.ok(memberId);
  await expectFail(call('saveUser', { token, user: { name: 'Dup', email: memberEmail }, password: 'member-pass-1' }), 'BAD');
});

let memberToken;
await step('member: can write leads, cannot touch invoices, delete, team or settings', async () => {
  const m = await call('login', { email: memberEmail, password: 'member-pass-1' });
  memberToken = m.token;
  const r = await call('batch', { token: memberToken, ops: [
    { op: 'upsert', collection: 'leads', record: { id: `L-M${stamp}`, name: 'By member' } },
    { op: 'upsert', collection: 'invoices', record: { id: `I-M${stamp}`, total: 1 } },
    { op: 'remove', collection: 'leads', id: `L-M${stamp}` },
    { op: 'remove', collection: 'activity', id: `A-T${stamp}` },
  ] });
  assert.deepEqual(r.results.map((x) => x.code || 'ok'), ['ok', 'FORBIDDEN', 'FORBIDDEN', 'ok']);
  await expectFail(call('saveUser', { token: memberToken, user: { name: 'Y', email: 'y@example.com' }, password: 'longenough1' }), 'FORBIDDEN');
  await expectFail(call('saveSettings', { token: memberToken, settings: { agency: 'Hack' } }), 'FORBIDDEN');
});

await step('password change signs out old tokens', async () => {
  const r = await call('changePassword', { token: memberToken, current: 'member-pass-1', next: 'member-pass-2' });
  assert.ok(r.token);
  await expectFail(call('bootstrap', { token: memberToken }), 'AUTH');
  assert.equal((await call('bootstrap', { token: r.token })).ok, true);
  await expectFail(call('changePassword', { token: r.token, current: 'wrong', next: 'whatever-123' }), 'BADPASS');
  memberToken = r.token;
});

await step('deactivated user is locked out', async () => {
  await call('saveUser', { token, user: { id: memberId, name: 'Smoke Member', email: memberEmail, role: 'member', active: false } });
  await expectFail(call('bootstrap', { token: memberToken }), 'AUTH');
  await expectFail(call('login', { email: memberEmail, password: 'member-pass-2' }), 'BADPASS');
});

await step('admin cannot demote or disable themself', async () => {
  const r = await call('saveUser', { token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'member', active: false } });
  const me = r.users.find((u) => u.id === admin.id);
  assert.equal(me.role, 'admin');
  assert.equal(me.active, true);
});

if (CRM_WEBSITE_KEY) {
  await step('websiteLead: bad key refused, good key creates a lead', async () => {
    await expectFail(call('websiteLead', { key: 'wrong', name: 'Nope', contact: 'nope@example.com' }), 'FORBIDDEN');
    await expectFail(call('websiteLead', { key: CRM_WEBSITE_KEY, name: 'N', contact: '1' }), 'BAD');
    assert.equal((await call('websiteLead', { key: CRM_WEBSITE_KEY, website: 'bot', name: 'Bot Bot', contact: 'bot@example.com' })).ok, true); // honeypot: ignored
    const r = await call('websiteLead', { key: CRM_WEBSITE_KEY, name: 'Smoke Web', contact: 'web@example.com', company: 'ACME', service: 'Media & Performance', message: 'hello', planId: 'p1', pulseScore: 72 });
    assert.equal(r.ok, true);
    const b = await call('bootstrap', { token });
    const lead = b.data.leads.find((l) => l.name === 'Smoke Web');
    assert.equal(lead.source, 'pulse');
    assert.equal(lead.service, 'media');
    assert.equal(lead.email, 'web@example.com');
    assert.equal(lead.pulseScore, 72);
    assert.ok(!b.data.leads.some((l) => l.name === 'Bot Bot'));
    assert.ok(b.data.activity.some((a) => a.entityId === lead.id));
    await call('batch', { token, ops: [{ op: 'remove', collection: 'leads', id: lead.id }] });
  });
}

await step('login lockout after repeated failures', async () => {
  const email = `nobody-${stamp}@example.com`;
  for (let i = 0; i < 8; i++) await call('login', { email, password: 'x' });
  await expectFail(call('login', { email, password: 'x' }), 'LOCKED');
});

console.log(`\nall ${n} checks passed`);
