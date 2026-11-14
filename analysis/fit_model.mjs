// Poisson-frequency x severity pricing model (ridge-stabilised GLM, log-exposure offset).
import { writeFileSync } from 'node:fs';
import { P, C, sum, mean } from './data.mjs';
const LEVELS = { city: ['Toronto', 'Montreal', 'Calgary', 'Ottawa', 'Quebec City'], risk: ['Low', 'Medium', 'High'], age: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'], ded: ['500', '1000', '2500'], channel: ['Agent', 'Broker', 'Online'], bundle: ['no', 'yes'] };
const REF = { city: 'Toronto', risk: 'Low', age: '45-54', ded: '1000', channel: 'Agent', bundle: 'no' };
function design(feats) { const cols = ['intercept']; for (const f of feats) for (const l of LEVELS[f]) if (l !== REF[f]) cols.push(f + '=' + l); return cols; }
const val = (p, f) => f === 'city' ? p.city2 : f === 'risk' ? p.risk_band : f === 'age' ? (p.ageBand === 'unknown' ? REF.age : p.ageBand) : f === 'ded' ? String(p.ded) : f === 'channel' ? p.channel : p.bundle;
const row = (p, cols) => cols.map((c) => c === 'intercept' ? 1 : (() => { const [f, l] = c.split('='); return val(p, f) === l ? 1 : 0; })());
function solve(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[m][i])) m = r; [M[i], M[m]] = [M[m], M[i]]; for (let r = 0; r < n; r++) if (r !== i) { const k = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= k * M[i][c]; } } return M.map((r, i) => r[n] / r[i]); }
function inv(A) { const n = A.length; return Array.from({ length: n }, (_, j) => solve(A, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0)))).map((_, i, a) => a.map((r) => r[i])); }
function poisson(pols, y, feats, lam = 2) {
  const cols = design(feats), X = pols.map((p) => row(p, cols)), off = pols.map((p) => Math.log(Math.max(p.exp, 1e-6))), k = cols.length;
  let beta = Array(k).fill(0); beta[0] = Math.log(sum(y) / sum(pols.map((p) => p.exp)));
  let XtWX;
  for (let it = 0; it < 50; it++) {
    const mu = X.map((r, i) => Math.exp(off[i] + r.reduce((a, v, j) => a + v * beta[j], 0)));
    XtWX = Array.from({ length: k }, () => Array(k).fill(0)); const g = Array(k).fill(0);
    X.forEach((r, i) => { for (let a = 0; a < k; a++) { if (!r[a]) continue; g[a] += r[a] * (y[i] - mu[i]); for (let b = 0; b < k; b++) if (r[b]) XtWX[a][b] += mu[i]; } });
    for (let j = 1; j < k; j++) { XtWX[j][j] += lam; g[j] -= lam * beta[j]; }
    const step = solve(XtWX, g); beta = beta.map((b, j) => b + step[j]); if (Math.max(...step.map(Math.abs)) < 1e-9) break;
  }
  return { cols, beta, cov: inv(XtWX), predict: (p) => Math.exp(row(p, cols).reduce((a, v, j) => a + v * beta[j], 0)) };
}
const train = P.filter((p) => p.broker_code !== 'B07');
const sevStats = (claims) => { const x = claims.map((c) => c.inc); const m = mean(x), v = mean(x.map((a) => (a - m) ** 2)); return { mean: m, cv: Math.sqrt(v) / m, n: x.length }; };
const isWater = (c) => c.claim_type === 'Water Damage';
const models = {}, sev = {};
const auto = train.filter((p) => p.policy_type === 'Auto'), home = train.filter((p) => p.policy_type === 'Home');
const ycount = (ps, f) => ps.map((p) => p.cl.filter(f).length);
const spec = {
  auto: { pols: auto, y: ycount(auto, () => true), feats: ['city', 'risk', 'age', 'ded', 'channel', 'bundle'] },
  homeWater: { pols: home, y: ycount(home, isWater), feats: ['city', 'risk', 'ded', 'channel', 'bundle'] },
  homeOther: { pols: home, y: ycount(home, (c) => !isWater(c)), feats: ['city', 'risk', 'ded', 'channel', 'bundle'] },
};
sev.auto = sevStats(auto.flatMap((p) => p.cl)); sev.homeWater = sevStats(home.flatMap((p) => p.cl).filter(isWater)); sev.homeOther = sevStats(home.flatMap((p) => p.cl).filter((c) => !isWater(c)));
const out = { trained_on: { policies: train.length, claims: sum(train.map((p) => p.cl.length)), excluded: 'broker B07 (anomalous early-theft cluster)' }, levels: LEVELS, ref: REF, models: {}, severity: sev, validation: {} };
for (const [k, s] of Object.entries(spec)) { const m = poisson(s.pols, s.y, s.feats); models[k] = m; out.models[k] = { feats: s.feats, cols: m.cols, beta: m.beta, cov: m.cov }; }
// calibration on training segments
const cal = (name, pols, fn, pred) => { const act = sum(pols.map(fn)), exp = sum(pols.map(pred)); return { name, actual: act, predicted: +exp.toFixed(1) }; };
out.validation.calibration = [
  cal('Auto claims', auto, (p) => p.cl.length, (p) => models.auto.predict(p) * p.exp),
  cal('Home water claims', home, (p) => p.cl.filter(isWater).length, (p) => models.homeWater.predict(p) * p.exp),
  cal('Home other claims', home, (p) => p.cl.filter((c) => !isWater(c)).length, (p) => models.homeOther.predict(p) * p.exp),
  ...LEVELS.city.map((c) => cal('Home water · ' + c, home.filter((p) => p.city2 === c), (p) => p.cl.filter(isWater).length, (p) => models.homeWater.predict(p) * p.exp)),
];
// out-of-time: fit on policies starting before 2026-01-01 using claims observed, test on 2026 starts
const cut = new Date('2026-01-01T00:00:00Z'); const pre = (ps) => ps.filter((p) => p.start < cut), post = (ps) => ps.filter((p) => p.start >= cut);
const oot = [];
for (const [k, s] of Object.entries(spec)) { const tr = pre(s.pols), te = post(s.pols); const idx = new Map(s.pols.map((p, i) => [p, i])); const m = poisson(tr, tr.map((p) => s.y[idx.get(p)]), s.feats); oot.push({ model: k, trainPolicies: tr.length, testPolicies: te.length, actual: sum(te.map((p) => s.y[idx.get(p)])), predicted: +sum(te.map((p) => m.predict(p) * p.exp)).toFixed(1) }); }
out.validation.outOfTime = oot;
// current average premium per segment = "market price" proxy (the price clients actually accepted)
out.currentPremium = {};
for (const t of ['Auto', 'Home']) for (const c of LEVELS.city) for (const r of LEVELS.risk) { const ps = train.filter((p) => p.policy_type === t && p.city2 === c && p.risk_band === r && p.prem > 0); out.currentPremium[[t, c, r].join('|')] = { avg: +mean(ps.map((p) => p.prem)).toFixed(0), n: ps.length }; }
out.currentPremiumByType = { Auto: +mean(train.filter((p) => p.policy_type === 'Auto' && p.prem > 0).map((p) => p.prem)).toFixed(0), Home: +mean(train.filter((p) => p.policy_type === 'Home' && p.prem > 0).map((p) => p.prem)).toFixed(0) };
writeFileSync(new URL('../underwriting_model.json', import.meta.url), JSON.stringify(out, null, 1));
writeFileSync(new URL('../underwriting_model.js', import.meta.url), 'window.UW_MODEL=' + JSON.stringify(out) + ';');
console.log(JSON.stringify({ sev, calibration: out.validation.calibration, oot }, null, 1));
const show = (k) => out.models[k].cols.map((c, i) => c + ':' + Math.exp(out.models[k].beta[i]).toFixed(2)).join('  ');
for (const k of Object.keys(spec)) console.log(k, show(k));
