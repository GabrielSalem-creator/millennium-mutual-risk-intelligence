// Cleaned, exposure-aware dataset shared by every analysis script.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parseCSV } from '../insurance_engine.js';
const DIR = process.env.INSURANCE_DATA_DIR || join(homedir(), 'Downloads/MillenniumMutual_Insurance_Data');
export const ASOF = new Date('2026-10-31T00:00:00Z');
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const mean = (a) => (a.length ? sum(a) / a.length : NaN);
const pd = (s) => { let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null; };
const money = (s) => { const v = +String(s).replace(/[$,]/g, ''); return Number.isFinite(v) ? v : null; };
const canon = (v) => { const n = String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (n === 'toronto') return 'Toronto'; if (['montreal', 'mtl'].includes(n)) return 'Montreal'; if (['quebec city', 'quebec', 'qc city'].includes(n)) return 'Quebec City'; if (n === 'ottawa') return 'Ottawa'; if (n === 'calgary') return 'Calgary'; return n; };
const P = parseCSV(readFileSync(join(DIR, 'policies.csv'), 'utf8'));
const raw = parseCSV(readFileSync(join(DIR, 'claims.csv'), 'utf8'));
const seen = new Map(); for (const c of raw) if (!seen.has(c.claim_id)) seen.set(c.claim_id, c);
const C = [...seen.values()];
export const quality = {
  claimRowsRaw: raw.length, duplicatesRemoved: raw.length - C.length,
  premiumAsText: P.filter((p) => !Number.isFinite(+p.annual_premium)).length,
  policyDatesDMY: P.filter((p) => /^\d{2}\/\d{2}\/\d{4}$/.test(p.start_date)).length,
  claimDatesDMY: C.filter((c) => /^\d{2}\/\d{2}\/\d{4}$/.test(c.loss_date)).length,
  cityLabels: new Set(P.map((p) => p.city)).size, cityCanonical: new Set(P.map((p) => canon(p.city))).size,
  ageMissing: P.filter((p) => p.customer_age === '').length, ageBelow18: P.filter((p) => p.customer_age !== '' && +p.customer_age < 18).length,
};
for (const p of P) {
  p.city2 = canon(p.city); p.age = p.customer_age === '' ? null : +p.customer_age; p.prem = money(p.annual_premium); p.ded = +p.deductible;
  p.start = pd(p.start_date); p.exp = Math.max(0, Math.min(1, (ASOF - p.start) / 864e5 / 365)); p.earned = (p.prem || 0) * p.exp;
  p.ageBand = p.age === null || p.age < 18 ? 'unknown' : p.age < 25 ? '18-24' : p.age < 35 ? '25-34' : p.age < 45 ? '35-44' : p.age < 55 ? '45-54' : p.age < 65 ? '55-64' : '65+';
  p.broker = p.channel === 'Broker' ? p.broker_code : null; p.cl = [];
}
const PM = new Map(P.map((p) => [p.policy_id, p]));
// incurred proxy: Paid -> paid; Denied -> 0; Open/Under Review -> amount x (paid/amount ratio of same peril)
const ratio = {}, meanAmt = {};
for (const t of new Set(C.map((c) => c.claim_type))) {
  const paid = C.filter((c) => c.claim_type === t && c.status === 'Paid' && c.claim_amount !== '');
  ratio[t] = sum(paid.map((c) => +c.paid_amount)) / sum(paid.map((c) => +c.claim_amount));
  meanAmt[t] = mean(C.filter((c) => c.claim_type === t && c.claim_amount !== '').map((c) => +c.claim_amount));
}
for (const c of C) {
  c.p = PM.get(c.policy_id); c.amt = c.claim_amount === '' ? null : +c.claim_amount; c.loss = pd(c.loss_date); c.rep = pd(c.reported_date); c.closed = c.closed_date ? pd(c.closed_date) : null;
  const a = c.amt ?? meanAmt[c.claim_type];
  c.inc = c.status === 'Denied' ? 0 : c.status === 'Paid' ? (+c.paid_amount || 0) : a * ratio[c.claim_type];
  c.dayIn = (c.loss - c.p.start) / 864e5; c.p.cl.push(c);
}
const lines = new Map(); for (const p of P) { if (!lines.has(p.customer_id)) lines.set(p.customer_id, new Set()); lines.get(p.customer_id).add(p.policy_type); }
for (const p of P) p.bundle = lines.get(p.customer_id).size > 1 ? 'yes' : 'no';
export { P, C };
