/* Underwriting Platform — live analysis engine. Data-trained model (underwriting_model.js) + external-evidence adjusters (platform_ext.js). */
(function () {
const M = window.UW_MODEL, D = window.PF_DATA, CASES = window.PF_CASES, X = window.PF_EXT || { factors: [], refs: [], guardrails: [], defaults: {}, variableSources: {} };
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const money = (x, d = 0) => (x < 0 ? '-' : '') + '$' + Math.abs(x).toLocaleString('en-CA', { maximumFractionDigits: d, minimumFractionDigits: d });
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CITY_LABEL = { Montreal: 'Montréal', Toronto: 'Toronto', Calgary: 'Calgary', Ottawa: 'Ottawa', 'Quebec City': 'Québec City' };
const refIdx = {}; (X.refs || []).forEach((r, i) => { refIdx[r.id] = i + 1; });
const linkRefs = (t) => String(t).replace(/\[R-([a-z-]+)\]/g, (m, id) => refIdx[id] ? `<a class="ref" href="#ref-${id}">[${refIdx[id]}]</a>` : '');
const rc = (ids) => (ids || []).map((id) => refIdx[id] ? `<a class="ref" href="#ref-${id}">[${refIdx[id]}]</a>` : '').join('');

// ---------- assumptions ----------
const A = Object.assign({ expense: 0.30, lae: 0.10, margin: 0.05, k: 8 }, X.defaults || {});
function readAssumptions() { A.expense = +$('#a-exp').value / 100; A.lae = +$('#a-lae').value / 100; A.margin = +$('#a-mar').value / 100; A.k = +$('#a-k').value; $('#v-exp').textContent = pct(A.expense, 0); $('#v-lae').textContent = pct(A.lae, 0); $('#v-mar').textContent = pct(A.margin, 0); $('#v-k').textContent = A.k; }
$('#a-exp').value = A.expense * 100; $('#a-lae').value = A.lae * 100; $('#a-mar').value = A.margin * 100; $('#a-k').value = A.k;
$('#assume-note').innerHTML = linkRefs(X.assumptionNote || 'Expense load, LAE and price sensitivity are not in the company data: they are assumptions you can stress-test.');

// ---------- model ----------
const ageBand = (a) => a < 25 ? '18-24' : a < 35 ? '25-34' : a < 45 ? '35-44' : a < 55 ? '45-54' : a < 65 ? '55-64' : '65+';
function xvec(m, pr) { const get = { city: pr.city, risk: pr.risk, age: pr.age, ded: pr.ded, channel: pr.channel, bundle: pr.bundle }; return m.cols.map((c) => { if (c === 'intercept') return 1; const [f, l] = c.split('='); return String(get[f]) === l ? 1 : 0; }); }
function predict(key, pr) { const m = M.models[key], x = xvec(m, pr), lg = x.reduce((a, v, j) => a + v * m.beta[j], 0); let v = 0; for (let i = 0; i < x.length; i++) if (x[i]) for (let j = 0; j < x.length; j++) if (x[j]) v += m.cov[i][j]; return { lam: Math.exp(lg), sd: Math.sqrt(v) }; }
function extMult(pr, lever) { let mult = 1; const used = []; for (const f of X.factors || []) { if (f.applies !== pr.type || f.lever !== lever) continue; if (pr.ext && pr.ext[f.id]) { mult *= f.mid; used.push(f); } } return { mult, used }; }
function components(pr) {
  const age = ageBand(+pr.ageNum || 40), p = { ...pr, age };
  if (pr.type === 'Auto') { const a = predict('auto', p), e = extMult(pr, 'all'); return [{ key: 'auto', name: 'Auto claims', lam: a.lam * e.mult, sd: a.sd, sev: M.severity.auto, ext: e.used }]; }
  const w = predict('homeWater', p), o = predict('homeOther', p), ew = extMult(pr, 'water'), eo = extMult(pr, 'other');
  return [{ key: 'homeWater', name: 'Water damage', lam: w.lam * ew.mult, sd: w.sd, sev: M.severity.homeWater, ext: ew.used }, { key: 'homeOther', name: 'Theft, fire, wind', lam: o.lam * eo.mult, sd: o.sd, sev: M.severity.homeOther, ext: eo.used }];
}
const EL = (cs, z = 0) => cs.reduce((a, c) => a + c.lam * Math.exp(z * c.sd) * c.sev.mean, 0);
const VAR = (cs) => cs.reduce((a, c) => { const s = c.sev.cv * c.sev.mean; return a + c.lam * (s * s + c.sev.mean ** 2); }, 0);
const LAMT = (cs) => cs.reduce((a, c) => a + c.lam, 0);
const marketProxy = (pr) => { const r = M.currentPremium[[pr.type, pr.city, pr.risk].join('|')]; return r && r.n >= 5 ? r.avg : M.currentPremiumByType[pr.type]; };
const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
function poisson(l) { if (l < 30) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; } return Math.max(0, Math.round(l + Math.sqrt(l) * randn())); }
const normCdf = (z) => { const t = 1 / (1 + .2316419 * Math.abs(z)), d = .3989423 * Math.exp(-z * z / 2), p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
function simYear(cs, N = 4000) { const out = []; for (let s = 0; s < N; s++) { let loss = 0; for (const c of cs) { const k = poisson(c.lam), sg = Math.sqrt(Math.log(1 + c.sev.cv ** 2)), mu = Math.log(c.sev.mean) - sg * sg / 2; for (let i = 0; i < k; i++) loss += Math.exp(mu + sg * randn()); } out.push(loss); } return out.sort((a, b) => a - b); }
const quant = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];

// ---------- profile / economics ----------
let CUR = null; // current profile
let compMult = 1;
function readForm() { return { type: $('#f-type').value, city: $('#f-city').value, ageNum: +$('#f-age').value || 40, risk: $('#f-risk').value, ded: $('#f-ded').value, channel: $('#f-channel').value, bundle: $('#f-bundle').value, broker: $('#f-broker').value, startMonth: +$('#f-month').value, ext: $$('#extbox input').reduce((o, i) => (o[i.dataset.id] = i.checked, o), {}) }; }
function economics(pr) {
  const cs = components(pr), el = EL(cs), elLae = el * (1 + A.lae), sd = Math.sqrt(VAR(cs)), lam = LAMT(cs), market = marketProxy(pr);
  return { cs, el, elLae, sd, lam, market, lo: EL(cs, -1.645) * (1 + A.lae), hi: EL(cs, 1.645) * (1 + A.lae), breakeven: elLae / (1 - A.expense), target: elLae / (1 - A.expense - A.margin) };
}
const profitAt = (E, p) => p * (1 - A.expense) - E.elLae;
function drivers(pr) {
  const base = economics(pr).el, out = [], ref = M.ref;
  const tryVar = (label, field, refVal, show) => { if (String(pr[field]) === String(refVal)) return; const alt = economics({ ...pr, [field]: refVal }).el; out.push({ label, value: show, mult: base / alt, kind: 'data', field }); };
  tryVar('City', 'city', ref.city, `${CITY_LABEL[pr.city]} vs ${CITY_LABEL[ref.city]}`);
  tryVar('Risk band', 'risk', ref.risk, `${pr.risk} vs ${ref.risk}`);
  if (pr.type === 'Auto') { const a = ageBand(pr.ageNum), alt = economics({ ...pr, ageNum: 50 }).el; if (a !== ref.age) out.push({ label: 'Age band', value: `${a} vs ${ref.age}`, mult: base / alt, kind: 'data', field: 'age' }); }
  tryVar('Deductible', 'ded', ref.ded, `$${pr.ded} vs $${ref.ded}`);
  tryVar('Sales channel', 'channel', ref.channel, `${pr.channel} vs ${ref.channel}`);
  tryVar('Bundle with other line', 'bundle', ref.bundle, pr.bundle === 'yes' ? 'bundled vs single' : 'single vs bundled');
  for (const f of X.factors || []) if (f.applies === pr.type && pr.ext && pr.ext[f.id]) { const alt = economics({ ...pr, ext: { ...pr.ext, [f.id]: false } }).el; out.push({ label: f.label, value: 'external evidence', mult: base / alt, kind: 'ext', refs: f.refs }); }
  return out;
}
function painIndex(E, price, yearSim) {
  const p1 = 1 - Math.exp(-E.lam), lr = (E.elLae / price), tail = yearSim.filter((v) => v > 3 * price).length / yearSim.length;
  const score = 50 * Math.min(1, p1 / 0.5) + 30 * Math.min(1, Math.max(0, lr) / 1.5) + 20 * Math.min(1, tail / 0.15);
  return { p1, lr, tail, score, label: score < 30 ? 'Easy customer' : score < 55 ? 'Needs watching' : 'High-maintenance / costly', cls: score < 30 ? 'good' : score < 55 ? 'warn' : 'bad' };
}
function decisionFor(pr, E, price) {
  const profit = profitAt(E, price), mg = profit / price;
  if (pr.broker === 'B07') return { kind: 'refer', title: 'REFER · BLOCKED SOURCE', why: 'Broker B07 business is held for investigation: 173 policies in 2026 gave 60 theft claims where about 3 were expected, median claim 37 days after start. The rule fires before pricing.', profit, mg };
  if (mg >= A.margin) return { kind: 'accept', title: 'ACCEPT', why: `Matching the competitor at ${money(price)} still earns ${pct(mg)} margin after expenses and claims handling.`, profit, mg };
  if (profit >= 0) return { kind: 'cond', title: 'ACCEPT WITH CONDITIONS', why: `At ${money(price)} the margin is only ${pct(mg)} (target ${pct(A.margin, 0)}). Take the customer only with a stronger deductible, a bundle, mitigation or a slightly higher price: see the fixes below.`, profit, mg };
  return { kind: 'decline', title: 'DECLINE AT THIS PRICE', why: `At ${money(price)} we expect to lose ${money(-profit)} per policy per year. The price that breaks even is ${money(E.breakeven)}. With more such customers the loss only gets more certain.`, profit, mg };
}
function fixes(pr, price) {
  const tries = [];
  const push = (label, p2) => { const E2 = economics(p2), pf = profitAt(E2, price); tries.push({ label, profit: pf, mg: pf / price }); };
  if (pr.ded !== '2500') push('Raise deductible to $2,500', { ...pr, ded: '2500' });
  if (pr.bundle !== 'yes') push('Sell as a bundle with our other line', { ...pr, bundle: 'yes' });
  for (const f of X.factors || []) if (f.applies === pr.type && !(pr.ext && pr.ext[f.id])) push(`Require: ${f.label} (external evidence)`, { ...pr, ext: { ...(pr.ext || {}), [f.id]: true } });
  return tries.sort((a, b) => b.profit - a.profit).slice(0, 4);
}

// ---------- svg helpers ----------
function svgProfit(E, pr, price, market) {
  const W = 640, H = 250, L = 52, R = 14, T = 12, B = 30, lo = market * .4, hi = market * 1.8, ks = A.k;
  const win = (p) => 1 / (1 + Math.exp(ks * Math.log(p / price))); // win-rate around the competitor/slider price
  const pts = []; for (let p = lo; p <= hi; p += (hi - lo) / 160) pts.push([p, profitAt(E, p), win(p) * profitAt(E, p)]);
  const ys = pts.flatMap((q) => [q[1], q[2]]), ymin = Math.min(...ys, 0), ymax = Math.max(...ys, 1);
  const x = (v) => L + (v - lo) / (hi - lo) * (W - L - R), y = (v) => H - B - (v - ymin) / (ymax - ymin) * (H - T - B);
  const zoneRed = Math.min(Math.max(E.breakeven, lo), hi), zoneAmb = Math.min(Math.max(E.target, lo), hi);
  const mk = (v, c, l, i) => `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - B}" stroke="${c}" stroke-dasharray="4 3"/><text x="${x(v) + 4}" y="${T + 12 + i * 13}" style="fill:${c}">${l} ${money(v)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><rect x="${x(lo)}" y="${T}" width="${x(zoneRed) - x(lo)}" height="${H - T - B}" fill="var(--bad)" opacity=".10"/><rect x="${x(zoneRed)}" y="${T}" width="${x(zoneAmb) - x(zoneRed)}" height="${H - T - B}" fill="var(--warn)" opacity=".12"/><rect x="${x(zoneAmb)}" y="${T}" width="${x(hi) - x(zoneAmb)}" height="${H - T - B}" fill="var(--good)" opacity=".10"/>
  <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".35"/>
  <polyline fill="none" stroke="var(--accent)" stroke-width="2.6" points="${pts.map((q) => x(q[0]) + ',' + y(q[1])).join(' ')}"/>
  <polyline fill="none" stroke="var(--cyan)" stroke-width="2" stroke-dasharray="5 3" points="${pts.map((q) => x(q[0]) + ',' + y(q[2])).join(' ')}"/>
  ${mk(E.breakeven, 'var(--bad)', 'Break-even', 0)}${mk(E.target, 'var(--good)', 'Target margin', 1)}${mk(market, 'var(--mute)', 'Our price today', 2)}
  <line x1="${x(price)}" x2="${x(price)}" y1="${T}" y2="${H - B}" stroke="var(--ink)" stroke-width="2"/><text x="${x(price) - 4}" y="${H - B + 14}" text-anchor="middle" style="fill:var(--ink)">competitor ${money(price)}</text>
  <text x="4" y="${y(0) - 4}">$0</text><text x="4" y="${y(ymax) + 10}">${money(ymax)}</text><text x="${L}" y="${H - 6}">${money(lo)}</text><text x="${W - 60}" y="${H - 6}">${money(hi)}</text></svg>`;
}
function svgConv(E, price) {
  const W = 640, H = 220, L = 52, R = 14, T = 12, B = 28, profit = profitAt(E, price), sd = E.sd * Math.sqrt(1 + 0); // sd of annual loss per policy
  const ns = []; for (let e = 0; e <= 5; e += .1) ns.push(10 ** e);
  const band = (n) => 1.96 * sd / Math.sqrt(n);
  const all = ns.flatMap((n) => [profit + band(n), profit - band(n)]), ymax = Math.min(Math.max(...all), profit + 4 * sd), ymin = Math.max(Math.min(...all, 0), profit - 4 * sd);
  const x = (n) => L + Math.log10(n) / 5 * (W - L - R), y = (v) => H - B - (Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin) * (H - T - B);
  const poly = (f) => ns.map((n) => x(n) + ',' + y(f(n))).join(' ');
  const area = ns.map((n) => x(n) + ',' + y(profit + band(n))).join(' ') + ' ' + [...ns].reverse().map((n) => x(n) + ',' + y(profit - band(n))).join(' ');
  const nstar = Math.abs(profit) > 1e-9 ? Math.ceil((1.96 * sd / Math.abs(profit)) ** 2) : Infinity;
  const mark = nstar <= 1e5 && nstar >= 1 ? `<line x1="${x(nstar)}" x2="${x(nstar)}" y1="${T}" y2="${H - B}" stroke="${profit > 0 ? 'var(--good)' : 'var(--bad)'}" stroke-dasharray="4 3"/><text x="${x(nstar) + 4}" y="${T + 12}" style="fill:${profit > 0 ? 'var(--good)' : 'var(--bad)'}">n ≈ ${nstar.toLocaleString()}: 95% sure the average ${profit > 0 ? 'is profitable' : 'loses money'}</text>` : '';
  return { svg: `<svg viewBox="0 0 ${W} ${H}" width="100%"><polygon points="${area}" fill="var(--accent)" opacity=".18"/><line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".4"/><polyline fill="none" stroke="${profit >= 0 ? 'var(--good)' : 'var(--bad)'}" stroke-width="2.6" points="${poly(() => profit)}"/>${mark}
  <text x="4" y="${y(0) - 4}">$0</text>${[1, 10, 100, 1000, 1e4, 1e5].map((n) => `<text x="${x(n) - 8}" y="${H - 8}">${n >= 1000 ? n / 1000 + 'k' : n}</text>`).join('')}<text x="${L}" y="${T + 24}" style="fill:var(--ink)">average profit per policy (line) ± 95% spread (band) as the number of policies grows</text></svg>`, nstar, sd };
}
function svgHist(E, price, n) {
  const profit = profitAt(E, price), W = 640, H = 190, L = 40, B = 26;
  let sims = [];
  if (n > 2000) { const se = E.sd / Math.sqrt(n); for (let i = 0; i < 1500; i++) sims.push(profit + se * randn()); }
  else { const sims0 = 1200; for (let s = 0; s < sims0; s++) { let loss = 0; for (const c of E.cs) { const k = poisson(n * c.lam), sg = Math.sqrt(Math.log(1 + c.sev.cv ** 2)), mu = Math.log(c.sev.mean) - sg * sg / 2; for (let i = 0; i < k; i++) loss += Math.exp(mu + sg * randn()); } sims.push((n * price * (1 - A.expense) - loss * (1 + A.lae) * 1) / n); } }
  sims.sort((a, b) => a - b); const pl = sims.filter((v) => v < 0).length / sims.length, bins = 36, mn = quant(sims, .005), mx = quant(sims, .995), bw = (mx - mn) / bins || 1, h = Array(bins).fill(0);
  sims.forEach((v) => { h[Math.min(bins - 1, Math.max(0, Math.floor((v - mn) / bw)))]++; }); const hm = Math.max(...h), x = (v) => L + (v - mn) / (mx - mn) * (W - L - 10);
  return { pl, svg: `<svg viewBox="0 0 ${W} ${H}" width="100%">${h.map((c, i) => `<rect x="${x(mn + i * bw)}" y="${H - B - c / hm * (H - B - 10)}" width="${(W - L - 10) / bins - 1}" height="${c / hm * (H - B - 10)}" fill="${mn + i * bw + bw / 2 < 0 ? 'var(--bad)' : 'var(--good)'}" opacity=".75"/>`).join('')}${mn < 0 && mx > 0 ? `<line x1="${x(0)}" x2="${x(0)}" y1="4" y2="${H - B}" stroke="currentColor" stroke-dasharray="3 3"/><text x="${x(0) + 3}" y="14">$0</text>` : ''}<text x="${L}" y="${H - 8}">${money(mn)}</text><text x="${W - 56}" y="${H - 8}">${money(mx)}</text><text x="${W / 2 - 70}" y="${H - 8}">profit per policy · ${n > 2000 ? '1,500 books (CLT)' : '1,200 simulated books'}</text></svg>` };
}
function barsLog(rows) {
  const mx = Math.max(2, ...rows.map((r) => Math.max(r.mult, 1 / r.mult))), W = 520, mid = W / 2;
  return `<svg viewBox="0 0 ${W + 150} ${rows.length * 30 + 10}" width="100%">${rows.map((r, i) => { const l = Math.log(r.mult) / Math.log(mx) * (mid - 10), up = r.mult >= 1, col = r.kind === 'ext' ? 'var(--warn)' : up ? 'var(--bad)' : 'var(--good)'; return `<text x="0" y="${i * 30 + 16}" style="fill:var(--ink);font-size:12px">${r.label}</text><rect x="${130 + (up ? mid : mid + l)}" y="${i * 30 + 4}" width="${Math.abs(l)}" height="16" rx="3" fill="${col}" opacity=".85"/><text x="${130 + (up ? mid + l + 5 : mid + l - 5)}" y="${i * 30 + 17}" text-anchor="${up ? 'start' : 'end'}" style="fill:var(--ink);font-size:12px">×${r.mult.toFixed(2)}</text>`; }).join('')}<line x1="${130 + mid}" x2="${130 + mid}" y1="0" y2="${rows.length * 30}" stroke="currentColor" opacity=".4"/></svg>`;
}

// ---------- rendering ----------
const STEP_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
function skeleton() {
  const titles = ['Intake: every slot we know', 'Category & what the book says about it', 'Hazard variables: what pushes the equation', 'The random variable', 'Expected loss & price floors', 'What kind of customer is this?', 'Competition: slide the rival price', 'Long run: does the house win? (law of large numbers)', 'Decision & how to make it work'];
  $('#steps').innerHTML = titles.map((t, i) => `<section class="card step" id="${STEP_IDS[i]}"><h2><span class="n">${i + 1}</span>${t}</h2><div class="body"></div></section>`).join('') + `<section class="card step" id="s10"><h2><span class="n">★</span>Patterns in the book that feed this equation</h2><div class="body"></div></section><section class="card step" id="s11"><h2><span class="n">★</span>References</h2><div class="body"></div></section>`;
}
function srcKind(field) { return ((X.variableSources || {})[field] || {}).kind || 'data'; }
const yrCache = new Map();
function render(pr, slider, dynOnly) {
  CUR = pr; const E = economics(pr), market = E.market, price = slider != null ? slider : market * compMult;
  const dec = decisionFor(pr, E, price), yr = (() => { const k = E.cs.map((c) => c.lam.toFixed(5) + c.sev.mean.toFixed(0)).join('|'); if (!yrCache.has(k)) yrCache.set(k, simYear(E.cs)); return yrCache.get(k); })(), pain = painIndex(E, price, yr), drv = drivers(pr), peers = D.peers[[pr.type, pr.city, pr.risk].join('|')], cityStats = D.cities[pr.city], prodStats = D.product[pr.type];
  // verdict bar
  const vb = $('#verdict'); vb.style.display = 'grid'; vb.className = 'verdict ' + dec.kind;
  vb.innerHTML = `<div><div class="tag">${dec.title}</div><div class="big">${dec.kind === 'refer' ? '—' : money(dec.profit) + ' <span style="font-size:14px;font-weight:400">/ policy / yr</span>'}</div></div><div class="why">${dec.why}</div><div style="text-align:right"><span class="pill ${pain.cls}">${pain.label}</span><div class="note" style="margin:4px 0 0">at competitor price ${money(price)}</div></div>`;
  const b = (id, html) => {
    if (dynOnly) { if (['s1', 's2', 's3', 's4', 's5', 's10', 's11'].includes(id)) return; if (id === 's7') { const d7 = $('#s7dyn'); if (d7) d7.innerHTML = html.split('<!--DYN-->')[1].replace(/<\/div>\s*$/, ''); return; } }
    const el = $('#' + id + ' .body'); if (el) el.innerHTML = html; };
  // 1 intake
  const ex = (X.factors || []).filter((f) => f.applies === pr.type && pr.ext && pr.ext[f.id]);
  b('s1', `<table class="t"><tr><th>Slot</th><th>Value</th><th>Where it counts</th></tr>
   <tr><td>Product</td><td>${pr.type}</td><td><span class="src-tag data">DATA</span> separate models for Auto and Home</td></tr>
   <tr><td>City</td><td>${CITY_LABEL[pr.city]}</td><td><span class="src-tag data">DATA</span> frequency by city (Home water 0.04 to 0.21 per policy-year)</td></tr>
   <tr><td>Age</td><td>${pr.ageNum} (${ageBand(pr.ageNum)})</td><td><span class="src-tag data">DATA</span> Auto only (18–24 ≈ 1.6× claims)</td></tr>
   <tr><td>Risk band</td><td>${pr.risk}</td><td><span class="src-tag data">DATA</span> Auto ×1.7/2.5 and Home ×1.6–2.8 (Medium/High)</td></tr>
   <tr><td>Deductible</td><td>$${pr.ded}</td><td><span class="src-tag data">DATA</span> small effect on frequency, large on payout</td></tr>
   <tr><td>Channel</td><td>${pr.channel}</td><td><span class="src-tag data">DATA</span> small effect</td></tr>
   <tr><td>Bundle</td><td>${pr.bundle === 'yes' ? 'Yes' : 'No'}</td><td><span class="src-tag data">DATA</span> bundled customers claim less (selection, not proof)</td></tr>
   <tr><td>Broker</td><td>${pr.broker === 'none' ? '—' : pr.broker}</td><td><span class="src-tag rule">RULE</span> B07 is blocked: unusual early theft claims</td></tr>
   <tr><td>Start month</td><td>${MONTHS[pr.startMonth - 1]}</td><td><span class="src-tag data">DATA</span> timing of Home water claims (spring peak)</td></tr>
   ${ex.map((f) => `<tr><td>${f.label}</td><td>yes</td><td><span class="src-tag ext">EXTERNAL</span> ×${f.mid} on ${f.lever} claims (range ${f.lo}–${f.hi}) ${rc(f.refs)}</td></tr>`).join('')}</table>`);
  // 2 category & peers
  const pr_peer = peers && peers.policies ? `<table class="t"><tr><th></th><th>Policies</th><th>Exposure-yrs</th><th>Claims</th><th>Claims/yr</th><th>Avg premium</th><th>Actual loss ratio</th></tr><tr class="me"><td>${pr.type} · ${CITY_LABEL[pr.city]} · ${pr.risk}</td><td>${peers.policies}</td><td>${peers.expYears}</td><td>${peers.claims}</td><td>${peers.freq}</td><td>${money(peers.avgPremium)}</td><td class="${peers.lossRatio > 1 ? 'bad-t' : peers.lossRatio > .75 ? 'warn-t' : 'good-t'}">${peers.lossRatio}</td></tr></table><div class="note">Real experience of this exact segment in the company book (Broker B07 excluded). Model expectation is below.</div>` : '<div class="note">No close peers in the book for this slot.</div>';
  const cityRows = M.levels.city.map((c) => { const q = { ...pr, city: c, ext: pr.ext }, e = economics(q); return `<tr class="${c === pr.city ? 'me' : ''}"><td>${CITY_LABEL[c]}</td><td>${money(e.el)}</td><td>${money(e.breakeven)}</td><td>${money(e.market)}</td><td class="${e.breakeven / e.market - 1 > .1 ? 'bad-t' : e.breakeven / e.market - 1 < -.1 ? 'good-t' : ''}">${e.breakeven / e.market > 1 ? '+' : ''}${((e.breakeven / e.market - 1) * 100).toFixed(0)}%</td></tr>`; }).join('');
  b('s2', `<div class="note" style="margin:0 0 6px">Category = <b>${pr.type} · ${CITY_LABEL[pr.city]} · ${pr.risk} risk · ${ageBand(pr.ageNum)} · $${pr.ded} deductible · ${pr.channel}${pr.bundle === 'yes' ? ' · bundled' : ''}</b></div>${pr_peer}
   <h3 class="h" style="margin:14px 0 6px;font:600 11px ui-monospace;color:var(--mute);letter-spacing:.1em">SAME APPLICANT IN OTHER CITIES (why Montréal is different)</h3>
   <table class="t"><tr><th>City</th><th>Expected loss</th><th>Break-even price</th><th>Our price today</th><th>Gap</th></tr>${cityRows}</table><div class="note">Positive gap = we charge less than the risk costs. Same equation, only the city changes.</div>`);
  // 3 drivers
  const seasonHome = pr.type === 'Home' ? (() => { const sh = (pr.city === 'Montreal' ? D.season.waterMontreal : D.season.waterOther).share, first = [0, 1, 2].map((k) => sh[(pr.startMonth - 1 + k) % 12]).reduce((a, v) => a + v, 0); const mx = Math.max(...sh); return `<div class="note" style="margin-top:12px"><b>Seasonality:</b> ${pct(first, 0)} of ${pr.city === 'Montreal' ? 'Montréal' : 'other-city'} Home water claims fall in the first 3 months of a ${MONTHS[pr.startMonth - 1]} start (n = ${(pr.city === 'Montreal' ? D.season.waterMontreal : D.season.waterOther).n} claims).</div><svg viewBox="0 0 360 54" width="100%">${sh.map((v, i) => `<rect x="${i * 30 + 2}" y="${46 - v / mx * 38}" width="24" height="${v / mx * 38}" rx="3" fill="${[0, 1, 2].some((k) => (pr.startMonth - 1 + k) % 12 === i) ? 'var(--warn)' : 'var(--accent)'}" opacity=".85"/><text x="${i * 30 + 14}" y="52" text-anchor="middle" style="font-size:9px">${MONTHS[i][0]}</text>`).join('')}</svg>`; })() : '';
  b('s3', `<div class="grid2"><div>${drv.length ? barsLog(drv) : ''}<div class="note">Each bar = how much that variable multiplies the expected loss versus its reference level (red costs us, green saves us, amber = external-evidence scenario).</div></div>
   <div><table class="t"><tr><th>Variable</th><th>Source</th></tr>${drv.map((d) => `<tr><td>${d.label} · ${d.value}</td><td><span class="src-tag ${d.kind === 'ext' ? 'ext' : 'data'}">${d.kind === 'ext' ? 'EXTERNAL' : 'DATA'}</span> ${d.kind === 'ext' ? rc(d.refs) : rc(((X.variableSources || {})[d.field] || {}).refs)}</td></tr>`).join('')}</table>${seasonHome}</div></div>`);
  // 4 random variable
  b('s4', `<div class="eq">N ~ Poisson(λ) claims per year:  ${E.cs.map((c) => `${c.name}: λ = ${c.lam.toFixed(3)}`).join('   +   ')}   (total ${E.lam.toFixed(3)})
X ~ cost per claim (LogNormal):  ${E.cs.map((c) => `${c.name}: mean ${money(c.sev.mean)}, CV ${c.sev.cv.toFixed(2)}`).join('   |   ')}
S = X₁ + … + X_N    annual loss of one policy</div>
   <div class="kpis"><div class="kpi"><small>Chance of at least one claim this year</small><b>${pct(pain.p1, 0)}</b></div><div class="kpi"><small>Typical bad year (90th percentile)</small><b>${money(quant(yr, .9))}</b></div><div class="kpi"><small>Very bad year (99th percentile)</small><b>${money(quant(yr, .99))}</b></div><div class="kpi"><small>Single big claim (95th pct of all ${pr.type} claims)</small><b>${money(prodStats.p95Claim)}</b></div></div>
   <div class="note">λ comes from a Poisson regression on ${M.trained_on.policies.toLocaleString()} policies with exposure offset, severity from ${M.trained_on.claims} claims. 90% interval on λ reflects model uncertainty.</div>`);
  // 5 expected loss
  b('s5', `<div class="eq">E[S] = Σ E[N]·E[X] = ${E.cs.map((c) => `${c.lam.toFixed(3)}×${money(c.sev.mean)}`).join(' + ')} = ${money(E.el)} per policy-year
+ claims handling ${pct(A.lae, 0)}  → ${money(E.elLae)}
Break-even price  = ${money(E.elLae)} ÷ (1 − ${pct(A.expense, 0)} expenses) = ${money(E.breakeven)}
Target price      = ${money(E.elLae)} ÷ (1 − ${pct(A.expense, 0)} − ${pct(A.margin, 0)} margin) = ${money(E.target)}</div>
   <div class="kpis"><div class="kpi"><small>Expected loss + handling</small><b>${money(E.elLae)}</b><span>90% range ${money(E.lo)} to ${money(E.hi)}</span></div><div class="kpi"><small>Break-even price</small><b>${money(E.breakeven)}</b></div><div class="kpi"><small>Price for target margin</small><b>${money(E.target)}</b></div><div class="kpi"><small>What we charge this segment today</small><b>${money(market)}</b><span>${market < E.breakeven ? 'below break-even' : 'above break-even'}</span></div></div>`);
  // 6 pain
  const bar = (label, v, txt, col) => `<div class="pain"><span>${label}</span><div class="tr"><i style="width:${Math.min(100, v * 100)}%;background:var(--${col})"></i></div><b>${txt}</b></div>`;
  const ret = (1 - pain.p1) * (1 - prodStats.nrNoClaim) + pain.p1 * (1 - prodStats.nrWithClaim);
  b('s6', `<div class="kpis"><div class="kpi"><small>Customer cost score</small><b class="${pain.cls}-t">${Math.round(pain.score)} / 100</b><span>${pain.label}</span></div><div class="kpi"><small>Expected claims-handling load</small><b>${(E.lam * (cityStats.medianCloseDays || 16)).toFixed(1)} adjuster-days</b><span>${E.lam.toFixed(2)} claims × ${cityStats.medianCloseDays} days (${CITY_LABEL[pr.city]} median)</span></div><div class="kpi"><small>Chance we still have them next year</small><b>${pct(ret, 0)}</b><span>claims lift non-renewal ${pct(prodStats.nrNoClaim, 0)} → ${pct(prodStats.nrWithClaim, 0)}</span></div></div>
   ${bar('Claim likelihood', Math.min(1, pain.p1 / .5), pct(pain.p1, 0), pain.p1 > .3 ? 'bad' : pain.p1 > .15 ? 'warn' : 'good')}${bar('Loss ratio at this price', Math.min(1, pain.lr / 1.5), pct(pain.lr, 0), pain.lr > 1 ? 'bad' : pain.lr > .75 ? 'warn' : 'good')}${bar('Tail: loss > 3× premium', Math.min(1, pain.tail / .15), pct(pain.tail, 1), pain.tail > .08 ? 'bad' : pain.tail > .04 ? 'warn' : 'good')}
   <div class="note">Score = 50% claim likelihood + 30% loss ratio at the competitor price + 20% tail risk: a transparent heuristic, not a fitted model. The lower the competitor price, the higher the loss ratio, so the more costly the customer becomes. Denials in this city: ${pct(cityStats.denialRate, 0)}; open claims backlog: ${cityStats.openClaims}.</div>`);
  // 7 competition
  const lo = market * .4, hi = market * 1.8;
  b('s7', `<div class="note" style="margin:0 0 4px">Move the rival's price. We match it, and watch the profit per policy move from green to red.</div>
   <div class="big-slider"><input type="range" id="comp-slider" min="${lo.toFixed(0)}" max="${hi.toFixed(0)}" step="5" value="${price.toFixed(0)}"></div><div class="zone"></div>
   <div class="lo"><span>${money(lo)}</span><b style="color:var(--ink)">Competitor price: <span id="comp-val">${money(price)}</span> (${pct(price / market - 1, 0).replace('-', '−')} vs ours today)</b><span>${money(hi)}</span></div>
   <div id="s7dyn"><!--DYN--><div id="profit-chart">${svgProfit(E, pr, price, market)}</div>
   <div class="kpis"><div class="kpi"><small>Profit per policy at this price</small><b class="${dec.profit >= 0 ? 'good-t' : 'bad-t'}">${money(dec.profit)}</b></div><div class="kpi"><small>Margin</small><b class="${dec.mg >= A.margin ? 'good-t' : dec.mg >= 0 ? 'warn-t' : 'bad-t'}">${pct(dec.mg)}</b></div><div class="kpi"><small>Lowest price that is not a loss</small><b>${money(E.breakeven)}</b></div><div class="kpi"><small>Profit per 1,000 such policies</small><b class="${dec.profit >= 0 ? 'good-t' : 'bad-t'}">${money(dec.profit * 1000)}</b></div></div>
   <div class="note">Solid line = profit per policy at each price. Dashed = expected profit per quote once win probability is included (customers drift away as we price above the rival, slope ${A.k}).</div></div>`);
  // 8 LLN
  const conv = svgConv(E, price), n = Math.round(10 ** (+(($('#n-slider') || {}).value || 3)));
  b('s8', `<div class="eq">Profit per policy:  π = p·(1 − expenses) − E[S]·(1 + LAE) = ${money(price)}×${(1 - A.expense).toFixed(2)} − ${money(E.elLae)} = ${money(dec.profit)}
Spread of one policy-year: σ = ${money(conv.sd)}.   Average of n policies has spread σ/√n  (law of large numbers).
Chebyshev: P(|avg − π| ≥ ε) ≤ σ² / (n ε²)  →  to be 95% sure within ε = |π| we need n ≥ σ²/(0.05·π²) = ${dec.profit ? Math.ceil(conv.sd ** 2 / (.05 * dec.profit ** 2)).toLocaleString() : '∞'} policies</div>
   <div>${conv.svg}</div>
   <label style="display:block;margin-top:10px;color:var(--mute)">Number of such policies: <b id="n-val" style="color:var(--ink)">${n.toLocaleString()}</b></label><input type="range" id="n-slider" min="0" max="4.3" step=".05" value="${Math.log10(n).toFixed(2)}">
   <div id="hist"></div><div class="kpis" id="llnk"></div><div class="note" id="llnote"></div>`);
  drawLLN(E, price, dec);
  // 9 decision
  const fx = fixes(pr, price);
  b('s9', `<div class="kpis"><div class="kpi"><small>Decision</small><b class="${dec.kind === 'accept' ? 'good-t' : dec.kind === 'decline' ? 'bad-t' : 'warn-t'}">${dec.title}</b></div><div class="kpi"><small>Expected annual profit</small><b>${dec.kind === 'refer' ? '—' : money(dec.profit)}</b></div><div class="kpi"><small>5-year expected profit per applicant</small><b>${dec.kind === 'refer' ? '—' : money(dec.profit * (1 - Math.pow(ret, 5)) / (1 - ret))}</b><span>retention ${pct(ret, 0)} per year, no discounting</span></div></div>
   <p>${dec.why}</p>
   ${dec.kind !== 'accept' && dec.kind !== 'refer' ? `<h3 class="h" style="font:600 11px ui-monospace;color:var(--mute);letter-spacing:.1em">WHAT WOULD MAKE THIS CUSTOMER WORK AT THE SAME PRICE</h3><table class="t"><tr><th>Change</th><th>Profit / policy</th><th>Margin</th></tr>${fx.map((f) => `<tr><td>${f.label}</td><td class="${f.profit >= 0 ? 'good-t' : 'bad-t'}">${money(f.profit)}</td><td>${pct(f.mg)}</td></tr>`).join('')}</table>` : ''}
   ${X.guardrails && X.guardrails.length ? `<div class="note"><b>Regulatory guardrails:</b> ${X.guardrails.map(linkRefs).join(' ')}</div>` : ''}`);
  // 10 patterns
  b('s10', `<div class="grid2"><div class="card" style="background:var(--panel2)"><b>Montréal Home water</b><div class="note">3.0× Toronto's water frequency (95% CI 1.95–4.63); peaks Mar–May and Oct; present in every risk band, deductible and channel. Québec City, same province and adjusters, is 5× lower.  <a href="presentation.html#8">slides 8–10</a></div></div>
   <div class="card" style="background:var(--panel2)"><b>Broker B07</b><div class="note">${D.b07.theft} theft claims vs ~3 expected, median ${D.b07.medianDaysToLoss} days after start, loss ratio ${D.b07.lossRatio}. Rule: refer, never price.  <a href="presentation.html#5">slides 5–6</a></div></div>
   <div class="card" style="background:var(--panel2)"><b>Home pricing ignores risk</b><div class="note">Home Medium band loss ratio ≈ 1.29 vs Auto bands 0.39–0.51: Auto prices follow risk, Home prices do not.  <a href="presentation.html#12">slide 12</a></div></div>
   <div class="card" style="background:var(--panel2)"><b>Claims drive churn</b><div class="note">Non-renewal ${pct(prodStats.nrNoClaim, 0)} without a claim vs ${pct(prodStats.nrWithClaim, 0)} with one: a claim costs the loss and often the customer.</div></div></div>`);
  // 11 refs
  b('s11', `<ol class="refs" style="padding-left:18px">${(X.refs || []).map((r) => `<li id="ref-${r.id}"><a href="${r.url}" target="_blank" rel="noopener">${r.title}</a> ${r.year ? '(' + r.year + ')' : ''} · ${r.geo || ''} <span class="mute">— ${r.supports || ''} ${r.limit ? '<i>Limit: ' + r.limit + '</i>' : ''}</span></li>`).join('') || '<li>References load from platform_ext.js</li>'}</ol><div class="note">Company data (policies.csv, claims.csv; ${M.trained_on.policies} policies, ${M.trained_on.claims} claims) is the source for every <span class="src-tag data">DATA</span> variable. <span class="src-tag ext">EXTERNAL</span> relativities are scenario ranges from the cited sources, not estimated from our book.</div>`);
  if (!dynOnly) wireDynamic(E, pr); else { const ns2 = $('#n-slider'); if (ns2) ns2.oninput = () => drawLLN(E, +$('#comp-slider').value, decisionFor(pr, E, +$('#comp-slider').value)); }
}
function drawLLN(E, price, dec) {
  const n = Math.round(10 ** (+$('#n-slider').value)), h = svgHist(E, price, n), se = E.sd / Math.sqrt(n);
  $('#n-val').textContent = n.toLocaleString(); $('#hist').innerHTML = h.svg;
  $('#llnk').innerHTML = `<div class="kpi"><small>Expected profit of the book</small><b class="${dec.profit >= 0 ? 'good-t' : 'bad-t'}">${money(dec.profit * n)}</b></div><div class="kpi"><small>Chance the book loses money</small><b>${pct(h.pl, 1)}</b></div><div class="kpi"><small>Spread of the average (±1σ)</small><b>${money(se)}</b></div>`;
  $('#llnote').textContent = dec.profit > 0 ? `Expected profit per policy stays at ${money(dec.profit)} while the spread shrinks like σ/√n, so the chance of a loss heads toward 0: with enough policies the house wins.` : `Expected profit per policy is ${money(dec.profit)}. More customers do not rescue it: the spread shrinks and the loss becomes certain. In the long run the house loses.`;
}
function wireDynamic(E, pr) {
  const sl = $('#comp-slider'); if (sl) sl.oninput = () => { compMult = +sl.value / E.market; softUpdate(E, pr, +sl.value); };
  const ns = $('#n-slider'); if (ns) ns.oninput = () => drawLLN(E, +$('#comp-slider').value, decisionFor(pr, E, +$('#comp-slider').value));
}
function softUpdate(E, pr, price) {
  const cv = $('#comp-val'); if (cv) cv.textContent = money(price) + ` (${pct(price / E.market - 1, 0).replace('-', '−')} vs ours today)`;
  render(pr, price, true);
}

// ---------- UI wiring ----------
function fillForm(pr, animate) {
  const set = [['f-type', pr.type], ['f-city', pr.city], ['f-age', pr.ageNum], ['f-risk', pr.risk], ['f-ded', pr.ded], ['f-channel', pr.channel], ['f-bundle', pr.bundle], ['f-broker', pr.broker], ['f-month', pr.startMonth]];
  buildExt(pr.type, pr.ext || {});
  set.forEach(([id, v], i) => { setTimeout(() => { $('#' + id).value = v; const el = $('#' + id); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 600); }, animate ? i * 180 : 0); });
  $$('#extbox input').forEach((i) => { i.checked = !!(pr.ext || {})[i.dataset.id]; });
  return animate ? set.length * 180 + 250 : 0;
}
function buildExt(type, on) {
  const fs = (X.factors || []).filter((f) => f.applies === type);
  $('#extbox').innerHTML = fs.length ? `<label>External-evidence scenarios (not from our book)</label>` + fs.map((f) => `<label class="chk"><input type="checkbox" data-id="${f.id}" ${on[f.id] ? 'checked' : ''}><span>${f.label} <span class="src-tag ext">×${f.mid}</span>${rc(f.refs)}<br><small class="mute">${f.note || ''}</small></span></label>`).join('') : '';
}
let timers = [];
function analyse(pr, animate) {
  timers.forEach(clearTimeout); timers = [];
  CUR = pr; compMult = 1; readAssumptions(); skeleton();
  const wait = fillForm(pr, animate);
  const run = () => { render(pr); const ids = [...STEP_IDS, 's10', 's11']; ids.forEach((id, i) => { timers.push(setTimeout(() => $('#' + id).classList.add('show'), animate ? i * 420 : 0)); }); if (!animate) $('#s1') && 0; const vv = $('#verdict'); if (vv.scrollIntoView) vv.scrollIntoView({ block: 'nearest' }); };
  timers.push(setTimeout(run, wait));
}
function buildCases() {
  const groups = {}; CASES.forEach((c) => (groups[c.group] ??= []).push(c));
  $('#cases').innerHTML = Object.entries(groups).map(([g, cs]) => `<div class="grp">${g.toUpperCase()}</div>` + cs.map((c) => { const pr = { ...c.inputs }; pr.ageNum = pr.age; delete pr.age; const E = economics(pr), price = E.market * (c.compMult || 1), d = decisionFor(pr, E, price); const cls = d.kind === 'accept' ? 'good' : d.kind === 'decline' ? 'bad' : 'warn'; return `<div class="case" data-id="${c.id}"><span class="ic">${c.icon}</span><div><b>${c.name}</b><small>${c.tag}</small></div><div class="v ${cls}">${d.kind === 'refer' ? 'REFER' : d.kind === 'accept' ? 'ACCEPT' : d.kind === 'cond' ? 'THIN' : 'DECLINE'}<br>${d.kind === 'refer' ? '' : money(d.profit)}</div></div>`; }).join('')).join('');
  $$('.case').forEach((el) => el.onclick = () => { $$('.case').forEach((x) => x.classList.remove('on')); el.classList.add('on'); const c = CASES.find((k) => k.id === el.dataset.id), pr = { ...c.inputs }; pr.ageNum = pr.age; delete pr.age; compMult = c.compMult || 1; analyse(pr, !SKIP); });
}
let SKIP = false;
function init() {
  $('#modelpill').textContent = `model: ${M.trained_on.policies} policies · ${M.trained_on.claims} claims`;
  M.levels.city.forEach((c) => $('#f-city').add(new Option(CITY_LABEL[c], c)));
  for (let i = 1; i <= 12; i++) $('#f-month').add(new Option(MONTHS[i - 1], i));
  ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'].forEach((b) => $('#f-broker').add(new Option(b + (b === 'B07' ? ' (blocked)' : ''), b)));
  buildCases();
  $('#f-type').onchange = () => buildExt($('#f-type').value, {});
  $('#analyse').onclick = () => analyse(readForm(), !SKIP);
  $('#skip').onclick = () => { SKIP = !SKIP; $('#skip').textContent = SKIP ? 'Animation: off (click to turn on)' : 'Skip animation'; };
  ['a-exp', 'a-lae', 'a-mar', 'a-k'].forEach((id) => $('#' + id).addEventListener('input', () => { readAssumptions(); buildCases(); if (CUR) { render(CUR); $$('.step').forEach((s) => s.classList.add('show')); } }));
  readAssumptions();
  const first = CASES[0]; $$('.case')[0].classList.add('on'); const pr = { ...first.inputs }; pr.ageNum = pr.age; delete pr.age; analyse(pr, true);
}
init();
})();
