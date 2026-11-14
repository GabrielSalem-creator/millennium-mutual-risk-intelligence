(function () {
  const { esc, money, pct, num } = MM;
  const LENS = [['FIN', 'Finance (CFO)'], ['PRI', 'Pricing / actuarial'], ['DIS', 'Distribution'], ['OPS', 'Claims operations'], ['RET', 'Retention'], ['FRD', 'Fraud / integrity'], ['SEV', 'Severity / exposure'], ['DQ', 'Data quality']];
  const STK = ['CFO', 'VP Claims', 'Head of Retention', 'Head of Distribution'];
  const lensName = (c) => (LENS.find((l) => l[0] === c) || [0, c])[1];
  const F = { lens: null, stk: null };
  let S = null;

  const isRatio = (m) => m && /÷|share|ratio|rate/i.test(m.name || '');
  const fmt = (m, v) => v == null ? '—' : isRatio(m) && Math.abs(v) <= 10 ? pct(v, v < 0.1 ? 1 : 0) : num(v, Math.abs(v) < 10 ? 2 : 0);
  const kvv = (v) => v == null ? '—' : Array.isArray(v) ? v.map(kvv).join(', ') : typeof v === 'object' ? JSON.stringify(v) : typeof v === 'number' ? num(v, 3) : esc(v);
  const kv = (o) => `<div class="kv">${Object.entries(o).map(([k, v]) => `<span>${esc(k)}</span><span>${typeof v === 'string' ? esc(v) : kvv(v)}</span>`).join('')}</div>`;

  function plain(s) {
    const m = s.metric; if (!m) return '';
    const name = esc(m.name), v = fmt(m, m.value);
    if (m.baseline == null) return `In plain words: the measure "${name}" comes out at ${v}. There is no comparison group here, so read it as a size of concentration rather than a gap.`;
    const dir = m.value > m.baseline ? 'higher' : 'lower';
    return `In plain words: for "${name}" this group scores ${v}, while the comparison group scores ${fmt(m, m.baseline)}${m.ratio ? ` (about ${num(m.ratio, 2)}× as much)` : ''}. That is ${dir} than the baseline, which is why it was flagged.`;
  }
  function tableHTML(rows) {
    if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object') return '';
    const cols = Object.keys(rows[0]);
    const cell = (k, v) => typeof v === 'number' ? (/lr|ratio|share|rate|paid|freq/i.test(k) && Math.abs(v) < 20 ? pct(v, 1) : /usd|amount|avg/i.test(k) ? money(v) : num(v, 2)) : esc(v);
    return `<div class="scroll"><table class="t"><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td>${cell(c, r[c])}</td>`).join('')}</tr>`).join('')}</table></div>`;
  }
  function barPair(s) {
    const m = s.metric; if (!m || m.baseline == null) return '';
    const mx = Math.max(m.value, m.baseline, 1e-9);
    return `<div class="bars"><div class="r hot"><span>This group</span><span class="t"><i style="width:${(m.value / mx * 100).toFixed(1)}%"></i></span><span class="v">${fmt(m, m.value)}</span></div><div class="r cool"><span>Baseline</span><span class="t"><i style="width:${(m.baseline / mx * 100).toFixed(1)}%"></i></span><span class="v">${fmt(m, m.baseline)}</span></div></div>`;
  }
  const lensTag = (s) => `<span class="tag acc">${esc(s.lensName || lensName(s.lens))}</span>`;
  const issueLink = (s) => `<a href="/research.html#${esc(s.issue)}">research this on page 2 →</a>`;

  function classic(s, i) {
    const tbl = s.table ? `<details><summary>Show the table</summary>${tableHTML(s.table)}</details>` : '';
    const ev = s.exposureView ? `<p class="note">${esc(s.exposureView.name)}: ${Object.entries(s.exposureView).filter(([k]) => k !== 'name').map(([k, v]) => `${esc(k)} ${num(v, 2)}`).join(' vs ')}</p>` : '';
    return `<div class="card sig" id="${esc(s.id)}"><div class="no">${i + 1}</div><div><h3>${esc(s.headline)}</h3>${lensTag(s)}${s.impactUSD ? `<span class="tag">${money(s.impactUSD)} at stake</span>` : ''}${barPair(s)}${ev}<div class="plain">${plain(s)}</div>${tbl}${(s.caveats || []).map((c) => `<p class="note">Caveat: ${esc(c)}</p>`).join('')}<p class="note">${issueLink(s)}</p></div></div>`;
  }
  function row(s, i) {
    const st = s.stats ? kv(Object.fromEntries(Object.entries({ test: s.stats.test, 'ci95': s.stats.ci95 && s.stats.ci95.join(' to '), p: s.stats.p, z: s.stats.z }).filter(([, v]) => v != null))) : '';
    const m = s.metric;
    return `<details class="row" id="${esc(s.id)}"><summary><span class="rk">#${s.rank || i + 1}</span>${lensTag(s)}<span>${esc(s.headline)}</span><span class="imp ${s.impactUSD < 0 ? 'good-t' : ''}">${s.impactUSD ? money(s.impactUSD) : ''}</span></summary><div class="det">
      ${m ? `<h4>Metric vs baseline</h4>${kv({ [m.name]: fmt(m, m.value), baseline: fmt(m, m.baseline), ratio: m.ratio == null ? '—' : '×' + num(m.ratio, 2) })}` : ''}
      ${st ? `<h4>Statistics</h4>${st}` : ''}
      ${s.evidence ? `<h4>Evidence</h4>${kv(s.evidence)}` : ''}
      ${s.table ? `<h4>Table</h4>${tableHTML(s.table)}` : ''}
      ${(s.caveats || []).length ? `<h4>Caveats</h4><ul>${s.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${(s.queries || []).length ? `<h4>Search queries this will trigger on page 2</h4><ul>${s.queries.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p>${s.kind === 'detector' ? `<span class="tag">detector: ${esc(s.detector || '')}</span>` : '<span class="tag">automatic scan</span>'}${(s.stakeholders || []).map((x) => `<span class="tag">${esc(x)}</span>`).join('')} ${issueLink(s)}</p></div></details>`;
  }

  /* ---------- visualisations ---------- */
  function hbars(items, { fmtv, hot, w = 420 }) {
    const mx = Math.max(...items.map((x) => x.v), 1e-9), bh = 24, lw = 96, rw = 56, H = items.length * bh + 8;
    return `<svg viewBox="0 0 ${w} ${H}" role="img">${items.map((x, i) => {
      const bw = (w - lw - rw) * x.v / mx, y = i * bh + 4;
      return `<text x="0" y="${y + 14}">${esc(x.l)}</text><rect x="${lw}" y="${y + 3}" width="${Math.max(bw, 1)}" height="14" rx="4" fill="${x.hot ? 'var(--bad)' : x.cool ? 'var(--good)' : 'var(--accent)'}"/><text x="${lw + bw + 5}" y="${y + 14}" class="m">${fmtv(x.v)}</text>`;
    }).join('')}</svg>`;
  }
  const vcard = (t, sub, body) => `<div class="card"><b>${t}</b><p class="note" style="margin:2px 0 8px">${sub}</p>${body}</div>`;
  function viz(T) {
    const out = [];
    if (T.bookByProduct) out.push(vcard('Home vs Auto: earned loss ratio', 'Incurred proxy divided by earned premium. Above 100% means claims exceed premium earned.', hbars(T.bookByProduct.map((p) => ({ l: p.product, v: p.earnedLR, hot: p.earnedLR > 1, cool: p.earnedLR <= 1 })), { fmtv: (v) => pct(v) }) + `<p class="note">Paid ÷ written: ${T.bookByProduct.map((p) => p.product + ' ' + pct(p.paidOverWritten, 1)).join(' · ')}</p>`));
    const city = ((S.signals.signals || []).find((s) => s.kind === 'league-table' && Array.isArray(s.table) && s.table[0] && 'paidOverWritten' in s.table[0] && 'city' in s.table[0]) || {}).table;
    if (city) out.push(vcard('Cities: paid claims ÷ written premium', 'Higher bar means claims take a bigger share of premium collected.', hbars(city.map((c) => ({ l: c.city, v: c.paidOverWritten })).sort((a, b) => b.v - a.v).map((x, i, a) => ({ ...x, hot: i < 2, cool: i === a.length - 1 })), { fmtv: (v) => pct(v) })));
    if (T.brokers) {
      const mx = { lossRatio: 1, earlyShare: 0.7, nearThresholdShare: 0.9 };
      const cell = (b, k) => { const t = Math.min(b[k] / mx[k], 1); return `<td class="h" style="background:color-mix(in srgb,var(--bad) ${(t * 85).toFixed(0)}%,transparent)">${k === 'lossRatio' ? num(b[k], 2) : pct(b[k])}</td>`; };
      out.push(vcard('Broker heatmap', 'Darker red means further from normal. B07 is highlighted.', `<div class="scroll"><table class="t hm"><tr><th>Broker</th><th>Policies</th><th>Loss ratio</th><th>Claims in first 45 days</th><th>Claims just under $10k</th></tr>${T.brokers.map((b) => `<tr class="${b.broker === 'B07' ? 'hot' : ''}"><td>${esc(b.broker)}${b.broker === 'B07' ? ' ◀' : ''}</td><td>${num(b.policies, 0)}</td>${cell(b, 'lossRatio')}${cell(b, 'earlyShare')}${cell(b, 'nearThresholdShare')}</tr>`).join('')}</table></div>`));
    }
    if (T.bins) {
      const mx = Math.max(...T.bins.map((b) => b.all)), W = 420, H = 190, bw = (W - 30) / T.bins.length, sc = (H - 50) / mx;
      const li = T.bins.findIndex((b) => /^10/.test(b.range));
      out.push(vcard('Claim amounts around the $10,000 review line', 'Bars: all claims. Inner bars: same claims without the flagged broker. A pile-up just below the line is unusual.', `<svg viewBox="0 0 ${W} ${H}" role="img">${T.bins.map((b, i) => { const x = 15 + i * bw; return `<rect x="${x + 4}" y="${H - 28 - b.all * sc}" width="${bw - 8}" height="${b.all * sc}" rx="3" fill="var(--bad)" opacity=".85"/><rect x="${x + 4}" y="${H - 28 - b.withoutFlagged * sc}" width="${bw - 8}" height="${b.withoutFlagged * sc}" rx="3" fill="var(--accent)"/><text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" class="m">${esc(b.range)}</text><text x="${x + bw / 2}" y="${H - 31 - b.all * sc}" text-anchor="middle">${b.all}</text>`; }).join('')}${li > 0 ? `<line x1="${15 + li * bw}" x2="${15 + li * bw}" y1="6" y2="${H - 26}" stroke="var(--warn)" stroke-dasharray="4 3" stroke-width="2"/><text x="${19 + li * bw}" y="14" fill="var(--warn)" style="fill:var(--warn)">$10,000 review line</text>` : ''}</svg><p class="note"><span class="lg" style="background:var(--bad)"></span>all claims<span class="lg" style="background:var(--accent)"></span>without flagged broker</p>`));
    }
    if (T.months) {
      const mx = Math.max(...T.months.flatMap((m) => [m.montreal, m.toronto])), W = 420, H = 170, step = (W - 30) / T.months.length, sc = (H - 40) / mx, y = (v) => H - 22 - v * sc, x = (i) => 20 + i * step + step / 2;
      const line = (k, c) => `<polyline fill="none" stroke="${c}" stroke-width="2.5" points="${T.months.map((m, i) => x(i) + ',' + y(m[k])).join(' ')}"/>` + T.months.map((m, i) => `<circle cx="${x(i)}" cy="${y(m[k])}" r="2.6" fill="${c}"/>`).join('');
      out.push(vcard('Water claims by month: Montréal vs Toronto', 'Count of water claims by calendar month. Montréal peaks in spring thaw; Toronto stays flat.', `<svg viewBox="0 0 ${W} ${H}" role="img">${T.months.map((m, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="m">${m.month}</text>`).join('')}<line x1="20" x2="${W - 10}" y1="${H - 22}" y2="${H - 22}" stroke="var(--line)"/>${line('toronto', 'var(--cyan)')}${line('montreal', 'var(--bad)')}</svg><p class="note"><span class="lg" style="background:var(--bad)"></span>Montréal<span class="lg" style="background:var(--cyan)"></span>Toronto (peak ${mx} claims)</p>`));
    }
    if (T.teams) out.push(vcard('Senior-review claims: days to close, by team', 'Median days to close for claims over $10,000 (dark) vs under (light).', `<svg viewBox="0 0 420 ${T.teams.length * 44 + 8}" role="img">${(() => { const mx = Math.max(...T.teams.map((t) => t.medianCloseOver10k), 1); return T.teams.map((t, i) => { const y = i * 44 + 4, a = 270 * t.medianCloseOver10k / mx, b = 270 * t.medianCloseUnder10k / mx; return `<text x="0" y="${y + 14}">${esc(t.team)}</text><text x="0" y="${y + 28}" class="m">${esc(t.cities)}</text><rect x="120" y="${y}" width="${a}" height="14" rx="4" fill="var(--bad)"/><text x="${125 + a}" y="${y + 12}" class="m">${t.medianCloseOver10k} d</text><rect x="120" y="${y + 18}" width="${b}" height="12" rx="4" fill="var(--accent)" opacity=".6"/><text x="${125 + b}" y="${y + 28}" class="m">${t.medianCloseUnder10k} d</text>`; }).join(''); })()}</svg><p class="note">${T.teams.map((t) => `${esc(t.team)}: ${t.open} open, intake ×${num(t.surge, 2)} vs before`).join(' · ')}</p>`));
    return out.join('');
  }

  /* ---------- page ---------- */
  function listHTML() {
    const rest = S.signals.signals.filter((s) => s.kind !== 'league-table');
    const shown = rest.filter((s) => (!F.lens || s.lens === F.lens) && (!F.stk || (s.stakeholders || []).includes(F.stk)));
    return `<p class="note">${shown.length} of ${rest.length} signals shown. Click a row to open it.</p>` + (shown.map(row).join('') || '<p class="mute">Nothing matches these filters.</p>');
  }
  function chips(items, key) {
    return `<div class="chipbar" data-k="${key}"><button class="chip ${F[key] ? '' : 'on'}" data-v="">All</button>${items.map(([v, n]) => `<button class="chip ${F[key] === v ? 'on' : ''}" data-v="${esc(v)}">${esc(n)}</button>`).join('')}</div>`;
  }
  function render(state) {
    S = state; const sg = state.signals, app = document.getElementById('app');
    if (!sg) { app.innerHTML = '<h1>Signals</h1><div class="card warn">No signals yet. Press “Run pipeline” above.</div>'; return; }
    const m = sg.meta, all = sg.signals, dq = all.find((s) => s.issue === 'data-quality');
    const dqText = dq ? dq.headline : '';
    const decs = Object.fromEntries(((state.decisions && state.decisions.issues) || []).map((i) => [i.id, i]));
    const byId = Object.fromEntries(all.map((s) => [s.id, s]));
    const lensKeyByName = Object.fromEntries(all.map((s) => [s.lensName, s.lens]));
    const classics = all.filter((s) => s.kind === 'league-table');
    const k = (l, v, sub) => `<div class="kpi"><small>${l}</small><b>${v}</b><span>${sub || ''}</span></div>`;
    app.innerHTML = `
    <h1>Signals: what the numbers say</h1>
    <p class="lede">This page reads every policy and claim, then lists in plain sentences every pattern that looks unusual, numbered and ranked. The same underlying problem often shows up from several angles (finance, pricing, distribution, claims, retention, fraud, severity, data quality), so each signal is tagged with the point of view it comes from. Nothing here is a verdict: each signal is a lead that page 2 goes and researches.</p>
    <div class="kpis">${k('Policies', num(m.policies, 0), 'as of ' + esc(m.asOf))}${k('Customers', num(m.customers, 0))}${k('Unique claims', num(m.claimsUnique, 0), 'after de-duplication')}${k('Earned premium', money(m.earnedPremium))}${k('Book loss ratio', pct(m.bookLossRatio, 1), 'incurred ÷ earned')}${k('Incurred proxy', money(m.incurredProxy), 'paid + estimated open')}</div>
    ${dq ? `<p class="note"><b>Data fixes applied first.</b> ${esc(dqText)}</p>` : ''}
    <p class="note">Method: ${esc(m.method)}</p>

    <section><h2>The six classic signals <small>the league-table views every insurer looks at first</small></h2><div class="cards">${classics.map(classic).join('')}</div></section>

    <section><h2>Everything else the machine found <small>detectors and the automatic scan</small></h2>
      <div class="card"><b class="mute" style="font-size:12px">Point of view</b>${chips(LENS, 'lens')}<b class="mute" style="font-size:12px">Who cares</b>${chips(STK.map((s) => [s, s]), 'stk')}<div id="list">${listHTML()}</div></div></section>

    <section><h2>One problem, many points of view <small>the same issue seen through different lenses</small></h2><div class="cards pov">${sg.issues.filter((i) => i.id !== 'other').map((i) => {
      const d = decs[i.id] || {}, sigs = i.signalIds.map((id) => byId[id]).filter(Boolean), groups = {};
      sigs.forEach((s) => (groups[s.lensName || lensName(s.lens)] = groups[s.lensName || lensName(s.lens)] || []).push(s));
      return `<div class="card" id="issue-${esc(i.id)}"><b>${esc(d.title || i.id)}</b> ${d.severity ? `<span class="tag ${d.severity === 'critical' ? 'bad' : d.severity === 'high' ? 'warn' : ''}">${esc(d.severity)}</span>` : ''}<div>${(i.lenses || []).map((l) => `<span class="tag acc">${esc(l)}</span>`).join('')}<span class="tag">${sigs.length} signals</span>${i.impactUSD ? `<span class="tag">${money(i.impactUSD)}</span>` : ''}</div>${d.oneLiner ? `<p class="note" style="margin-top:0">${esc(d.oneLiner)}</p>` : ''}${Object.entries(groups).map(([l, a]) => `<div class="g"><b>${esc(l)}</b><ul>${a.map((s) => `<li><a href="#${esc(s.id)}" data-open="${esc(s.id)}">${esc(s.headline)}</a></li>`).join('')}</ul></div>`).join('')}<p class="note"><a href="/decisions.html#${esc(i.id)}">See the decision for this issue →</a></p></div>`;
    }).join('')}</div></section>

    <section><h2>Visualizations <small>drawn directly from the numbers</small></h2><div class="viz">${viz(sg.tables || {})}</div></section>

    <section><h2>How detection works</h2><div class="card"><details open><summary>Three layers, in plain English</summary>
      <ol><li><b>Fixed lenses.</b> The classic comparisons every insurer makes: product, city, sales channel, risk class, claim type, large claims. They always run, so the familiar questions always get an answer.</li>
      <li><b>Automatic scan.</b> The machine cuts the book by every dimension (product, city, broker, age band, risk class, and so on) and measures each against every metric (loss ratio, claim frequency, average claim, close time, non-renewal). It compares each group with the rest using rate-ratio and proportion tests, then ranks the results by how statistically solid they are multiplied by how many dollars they involve. Small noisy gaps sink; large, reliable ones rise.</li>
      <li><b>Custom detectors.</b> Purpose-built checks for patterns a simple scan misses: <i>early claims</i> (claims soon after a policy starts), <i>threshold bunching</i> (amounts clustering just under the senior-review line), a <i>wait-time cut-off search</i> (the claim wait beyond which customers stop renewing) and <i>workload surge</i> (a team receiving much more intake than before).</li></ol>
      <p class="note">Every signal carries the sample size, a comparison baseline and caveats. Treat each as a hypothesis to test.</p></details></div></section>`;
    app.querySelectorAll('.chipbar').forEach((bar) => bar.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return; F[bar.dataset.k] = b.dataset.v || null;
      bar.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b)); document.getElementById('list').innerHTML = listHTML();
    }));
    app.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', () => { const t = document.getElementById(a.dataset.open); if (t && t.tagName === 'DETAILS') t.open = true; }));
  }
  MM.boot('signals', render);
})();
