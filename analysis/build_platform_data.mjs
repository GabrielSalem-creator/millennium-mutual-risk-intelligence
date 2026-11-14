// Data-derived "customer pain" metrics, seasonality and observed peer results for the company platform.
import { writeFileSync } from 'node:fs';
import { P, C, sum, mean } from './data.mjs';
const non = P.filter((p) => p.broker_code !== 'B07');
const med = (xs) => { xs = xs.slice().sort((a, b) => a - b); return xs.length ? xs[Math.floor(xs.length / 2)] : null; };
const cities = ['Montreal', 'Toronto', 'Calgary', 'Ottawa', 'Quebec City'];
const out = { generated: new Date().toISOString().slice(0, 10), cities: {}, product: {}, season: {}, peers: {}, b07: {} };
for (const c of cities) {
  const cl = C.filter((k) => k.p.city2 === c && k.p.broker_code !== 'B07');
  out.cities[c] = { claims: cl.length, medianCloseDays: med(cl.filter((k) => k.closed).map((k) => (k.closed - k.rep) / 864e5)), denialRate: +(cl.filter((k) => k.status === 'Denied').length / cl.length).toFixed(3), openClaims: cl.filter((k) => ['Open', 'Under Review'].includes(k.status)).length };
}
for (const t of ['Auto', 'Home']) {
  const ps = non.filter((p) => p.policy_type === t), done = ps.filter((p) => ['Renewed', 'Not Renewed'].includes(p.renewal_status));
  const wc = done.filter((p) => p.cl.length), nc = done.filter((p) => !p.cl.length), cl = ps.flatMap((p) => p.cl);
  out.product[t] = {
    nrWithClaim: +(wc.filter((p) => p.renewal_status === 'Not Renewed').length / wc.length).toFixed(3), nrNoClaim: +(nc.filter((p) => p.renewal_status === 'Not Renewed').length / nc.length).toFixed(3),
    cancelRate: +(ps.filter((p) => p.renewal_status === 'Cancelled').length / ps.length).toFixed(3),
    earlyShare45: +(cl.filter((k) => k.dayIn <= 45).length / cl.length).toFixed(3), medianCloseDays: med(cl.filter((k) => k.closed).map((k) => (k.closed - k.rep) / 864e5)),
    denialRate: +(cl.filter((k) => k.status === 'Denied').length / cl.length).toFixed(3), claimsPerClaimant: +(cl.length / new Set(cl.map((k) => k.policy_id)).size).toFixed(3),
    p95Claim: +cl.filter((k) => k.amt).map((k) => k.amt).sort((a, b) => a - b)[Math.floor(cl.filter((k) => k.amt).length * 0.95)].toFixed(0),
  };
}
// seasonality of Home water claims by calendar month of loss (share of claims) — Montreal vs all other cities (ex-B07)
const water = C.filter((k) => k.claim_type === 'Water Damage' && k.p.broker_code !== 'B07');
const shares = (cl) => { const m = Array(12).fill(0); cl.forEach((k) => m[k.loss.getUTCMonth()]++); const n = cl.length; return { n, share: m.map((v) => +(v / n).toFixed(3)) }; };
out.season.waterMontreal = shares(water.filter((k) => k.p.city2 === 'Montreal'));
out.season.waterOther = shares(water.filter((k) => k.p.city2 !== 'Montreal'));
// observed peers: loss ratio by product x city x risk (ex B07) so every profile can be compared with real experience
for (const t of ['Auto', 'Home']) for (const c of cities) for (const r of ['Low', 'Medium', 'High']) {
  const ps = non.filter((p) => p.policy_type === t && p.city2 === c && p.risk_band === r); const ex = sum(ps.map((p) => p.exp)), ep = sum(ps.map((p) => p.earned)), cl = ps.flatMap((p) => p.cl);
  out.peers[[t, c, r].join('|')] = { policies: ps.length, expYears: +ex.toFixed(0), claims: cl.length, freq: +(cl.length / ex).toFixed(3), lossRatio: ep ? +(sum(cl.map((k) => k.inc)) / ep).toFixed(2) : null, avgPremium: ps.length ? +mean(ps.filter((p) => p.prem > 0).map((p) => p.prem)).toFixed(0) : null };
}
const B = P.filter((p) => p.broker_code === 'B07'), bc = B.flatMap((p) => p.cl);
out.b07 = { policies: B.length, claims: bc.length, theft: bc.filter((k) => k.claim_type === 'Theft').length, medianDaysToLoss: med(bc.map((k) => k.dayIn)), lossRatio: +(sum(bc.map((k) => k.inc)) / sum(B.map((p) => p.earned))).toFixed(2) };
writeFileSync(new URL('../platform_data.js', import.meta.url), 'window.PF_DATA=' + JSON.stringify(out) + ';');
console.log(JSON.stringify({ cities: out.cities, product: out.product, season: out.season.waterMontreal, b07: out.b07, peerSample: out.peers['Home|Montreal|Medium'] }, null, 1));
