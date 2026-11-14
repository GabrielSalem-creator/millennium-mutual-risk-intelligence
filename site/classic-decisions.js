(function () {
  const { esc, money, pct, num } = MM;
  const app = () => document.getElementById('app');
  const sevTag = (s) => (s === 'critical' ? 'bad' : s === 'high' ? 'warn' : s === 'medium' ? 'acc' : '');
  const VL = { confirmed: 'confirmed', 'ruled-out': 'ruled out', open: 'open', caution: 'caution' };
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const label = (k) => String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  const PCTK = /(share|rate|ratio|lossratio|freq|nr|surge|relativity|step|change)/i;

  function fmt(k, v) {
    if (v == null) return '—';
    if (typeof v === 'number') {
      if (/premium|cost|incurred|usd|amount|protected|atrisk/i.test(k) && !/ratio|change/i.test(k)) return money(v);
      if (/change/i.test(k)) return `<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%</span>`;
      if (/lossratio|share|rate|freq|^nr|^step|marketParityStep/i.test(k) && Math.abs(v) <= 10) return pct(v, 1);
      return num(v, 3);
    }
    if (typeof v === 'string') return esc(v);
    return esc(JSON.stringify(v));
  }
  function table(rows) {
    const cols = Object.keys(rows[0]);
    return `<div class="scroll"><table class="t"><tr>${cols.map((c) => `<th>${esc(label(c))}</th>`).join('')}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td>${fmt(c, r[c])}</td>`).join('')}</tr>`).join('')}</table></div>`;
  }
  function numbersHtml(n, id) {
    if (!n || !Object.keys(n).length) return '<p class="mute">No numeric summary for this issue.</p>';
    const kv = [], blocks = [];
    for (const [k, v] of Object.entries(n)) {
      if (Array.isArray(v) && v.length && isObj(v[0])) blocks.push(`<div class="sub">${esc(label(k))}</div>${table(v)}`);
      else if (Array.isArray(v) && v.length && Array.isArray(v[0])) blocks.push(`<div class="sub">${esc(label(k))}</div>${table(v.map((r) => ({ item: r[0], value: r[1] })))}`);
      else if (Array.isArray(v)) kv.push([k, v.map((x) => (typeof x === 'number' ? num(x, 2) : esc(x))).join(' · ')]);
      else if (isObj(v)) { const sub = Object.entries(v).filter(([, x]) => !isObj(x)); kv.push([k, sub.map(([a, b]) => `${esc(label(a))}: ${typeof b === 'number' ? fmt(a, b) : esc(b)}`).join('<br>')]); Object.values(v).filter(isObj).forEach((o) => blocks.push(table([o]))); }
      else kv.push([k, fmt(k, v)]);
    }
    return (kv.length ? `<div class="kpis kv">${kv.map(([k, v]) => `<div class="kpi"><small>${esc(label(k))}</small><b style="font-size:17px">${v}</b></div>`).join('')}</div>` : '') + blocks.join('');
  }
  function pricingTable(rows, key, curKey) {
    return `<div class="scroll"><table class="t"><tr><th>${esc(label(key))}</th><th>Current premium</th><th>Indicated premium</th><th>Indicated change</th></tr>${rows.map((r) => `<tr><td>${esc(r[key])}</td><td>${money(r[curKey])}</td><td>${money(r.indicatedPremium)}</td><td>${fmt('indicatedChange', r.indicatedChange)}</td></tr>`).join('')}</table></div>`;
  }
  function evCard(c, open) {
    return `<div class="ev"><b><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a></b>
      <div class="st">${esc(c.publisher)} · ${esc(c.year)} ${c.geo ? '· ' + esc(c.geo) : ''} <span class="tag ${c.stance === 'supports' ? 'good' : c.stance === 'challenges' ? 'bad' : ''}">${esc(c.stance)}</span></div>
      ${c.stat ? `<div class="stat" title="${esc(c.stat.what)}"><b>${esc(c.stat.value)}</b></div>` : ''}
      <div>${esc(c.claim)}</div>${c.limit ? `<div class="note">Limit: ${esc(c.limit)}</div>` : ''}</div>`;
  }

  function decisionCard(i, maxImp) {
    const d = i.decision || {}, ev = i.evidence || {}, cards = i.evidenceCards || [];
    const rows = [['WHAT', d.what], ['WHERE', d.where], ['WHEN', d.when], ['HOW', d.how], ['WHY', d.why]];
    let extra = '';
    if (i.id === 'mtl-water' && i.numbers?.byBand) extra += `<div class="sub">Montréal Home by risk band: indicated vs current premium</div>${pricingTable(i.numbers.byBand, 'band', 'avgPremium')}`;
    if (i.id === 'home-pricing') {
      if (i.numbers?.byBand) extra += `<div class="sub">Home by risk band: indicated vs current premium</div>${pricingTable(i.numbers.byBand, 'band', 'avgPremium')}`;
      if (i.numbers?.byCity) extra += `<div class="sub">Home by city: indicated vs current premium</div>${pricingTable(i.numbers.byCity, 'city', 'avgPremium')}`;
    }
    const skip = (i.id === 'mtl-water' || i.id === 'home-pricing') ? new Set(['byBand', 'byCity']) : new Set();
    const nums = Object.fromEntries(Object.entries(i.numbers || {}).filter(([k]) => !skip.has(k)));
    return `<article class="card dec" id="${esc(i.id)}">
      <div class="head"><span class="tag acc">PRIORITY ${esc(i.priority)}</span><span class="tag ${sevTag(i.severity)}">${esc(String(i.severity).toUpperCase())}</span><span class="tag">Owner: ${esc(i.owner)}</span></div>
      <h3>${esc(i.title)}</h3><div class="mute">${esc(i.oneLiner)}</div>
      <div class="plain"><b>In plain words:</b> ${esc(i.conclusion)}</div>
      ${i.impactUSD != null ? `<div class="sub">Observed excess cost: ${money(i.impactUSD)}</div><div class="imp"><i style="width:${Math.max(2, (i.impactUSD / maxImp) * 100)}%"></i></div>` : ''}
      <div class="sub">How we deduced it</div>
      ${(i.why || []).map((w) => `<div class="test"><span class="vc ${esc(w.verdict)}">${esc(VL[w.verdict] || w.verdict)}</span><div><b>${esc(w.test)}</b><div>${esc(w.result)}</div></div></div>`).join('')}
      <div class="sub">The decision</div>
      <table class="dt">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>
      <div class="grid2" style="margin-top:12px">
        <div><div class="sub">Expected outcome</div>${esc(d.expected)}<div class="sub">Confidence</div>${esc(d.confidence)}</div>
        <div><div class="sub">Risks</div><ul style="margin:0;padding-left:18px">${(d.risks || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul><div class="sub">If we are wrong</div>${esc(d.ifWrong)}</div>
      </div>
      <div class="sub">Data that supports it</div>${extra}${numbersHtml(nums, i.id)}
      <div class="note">Signals: ${(i.signalIds || []).map((s) => `<a href="/index.html#${esc(s)}">${esc(s)}</a>`).join(', ') || 'none'}</div>
      <div class="sub">Evidence</div>
      <div><span class="tag good">${ev.supports ?? 0} support</span><span class="tag bad">${ev.challenges ?? 0} challenge</span><span class="tag">${ev.context ?? 0} context</span><span class="tag">${ev.verified ?? 0}/${ev.cards ?? cards.length} verified</span> <a href="/research.html#${esc(i.id)}">All research</a></div>
      ${cards.length ? `<details ${''}><summary>Show ${cards.length} evidence cards</summary>${cards.slice(0, 3).map((c) => evCard(c)).join('')}${cards.length > 3 ? `<details><summary>${cards.length - 3} more</summary>${cards.slice(3).map((c) => evCard(c)).join('')}</details>` : ''}</details>` : '<div class="note">No evidence cards for this issue.</div>'}
      <div style="margin-top:10px">${(i.automationIds || []).map((a) => `<a class="tag acc" href="#auto-${esc(a)}">Automation ${esc(a)}</a>`).join('')}</div>
    </article>`;
  }

  function matchedTable(m) {
    const items = m.items || m.examples || [];
    const rows = items.slice(0, 6).filter(isObj);
    let h = rows.length ? table(rows) : '';
    if (m.items && m.examples) h += `<div class="note">Examples</div>${table(m.examples.slice(0, 5))}`;
    if (m.byTeam) h += `<div class="note">By team</div>${table(m.byTeam)}`;
    return h;
  }
  function autoCard(a) {
    const m = a.matched || {};
    return `<div class="card auto" id="auto-${esc(a.id)}"><h3><span class="tag acc">${esc(a.id)}</span>${esc(a.name)} <span class="tag ${a.status === 'FIRED' ? 'bad' : 'good'}">${esc(a.status)}</span></h3>
      <div class="sub">Trigger, in plain words</div>${esc(a.condition)}
      <div class="sub">Matched: ${esc(m.count ?? 0)}${m.premiumAtRisk ? ' · premium at risk ' + money(m.premiumAtRisk) : ''}</div>${matchedTable(m)}
      <div class="sub">What it does</div><ul style="margin:0;padding-left:18px">${(a.actions || []).map((x) => `<li>${esc(x.do)} <span class="mute">→ ${esc(x.to)}</span></li>`).join('')}</ul>
      <div class="sub">Who is notified</div>${(a.notify || []).map((n) => `<span class="tag">${esc(n)}</span>`).join('')}
      <div class="sub">If the automation is wrong</div>${esc(a.ifWrong)}</div>`;
  }

  let SIM = null;
  function sim(dec) {
    const b = dec.issues.find((x) => x.id === 'b07-fraud')?.numbers || {};
    const s = dec.issues.find((x) => x.id === 'senior-review')?.numbers || {};
    const m = dec.issues.find((x) => x.id === 'mtl-water')?.numbers || {};
    const full = (s.renewalPremiumProtectedIfHalfSlowFixed || 0) * 2;
    const exp = dec.meta?.assumptions?.expense ?? 0.3;
    SIM = { exc: b.excessCostObserved || 0, lr0: b.bookLossRatio, lr1: b.bookLossRatioWithoutB07, full, cost: m.montrealHomeCostPerYearWithLAE, prem: m.montrealHomePremiumPerYear, exp };
    return `<div class="card sim"><div class="grid3">
      <div><h3>B07 hold</h3><label>Share of the B07 pattern stopped: <b id="o-b">100</b>%</label><input type="range" id="s-b" min="0" max="100" value="100">
        <div class="kpis"><div class="kpi"><small>Excess cost avoided</small><b id="k-b1"></b></div><div class="kpi"><small>Book loss ratio</small><b id="k-b2"></b><span>now ${pct(b.bookLossRatio, 1)}, without B07 ${pct(b.bookLossRatioWithoutB07, 1)}</span></div></div></div>
      <div><h3>Senior-review fast-track</h3><label>Share of slow claims brought under the line: <b id="o-s">50</b>%</label><input type="range" id="s-s" min="0" max="100" value="50">
        <div class="kpis"><div class="kpi"><small>Renewal premium protected</small><b id="k-s1"></b><span>linear from ${money(s.renewalPremiumProtectedIfHalfSlowFixed)} at 50%</span></div></div></div>
      <div><h3>Montréal step increase</h3><label>Price increase: <b id="o-m">36</b>%</label><input type="range" id="s-m" min="0" max="150" value="36">
        <div class="kpis"><div class="kpi"><small>New premium</small><b id="k-m1"></b></div><div class="kpi"><small>Combined ratio</small><b id="k-m2"></b><span>= cost / premium + ${exp}</span></div></div></div>
    </div><div class="note">Uses only numbers in decisions.json; linear scaling, no demand response (customers may shop after a rise).</div></div>`
      ;
  }
  function wireSim() {
    const d = SIM, $ = (x) => document.getElementById(x);
    const upd = () => {
      const b = +$('s-b').value / 100, s = +$('s-s').value / 100, st = +$('s-m').value / 100;
      $('o-b').textContent = Math.round(b * 100); $('k-b1').textContent = money(d.exc * b);
      $('k-b2').textContent = d.lr0 != null && d.lr1 != null ? pct(d.lr0 - (d.lr0 - d.lr1) * b, 1) : '—';
      $('o-s').textContent = Math.round(s * 100); $('k-s1').textContent = money(d.full * s);
      $('o-m').textContent = Math.round(st * 100); const p = d.prem * (1 + st); $('k-m1').textContent = money(p); $('k-m2').textContent = num(d.cost / p + d.exp, 2);
    };
    ['s-b', 's-s', 's-m'].forEach((id) => $(id).addEventListener('input', upd)); upd();
  }

  function render(state) {
    const dec = state.decisions;
    if (!dec) { app().innerHTML = '<div class="card warn">No decisions yet. Run <code>node pipeline/run.mjs</code>.</div>'; return; }
    const issues = [...dec.issues].sort((a, b) => a.priority - b.priority);
    const maxImp = Math.max(1, ...issues.map((i) => i.impactUSD || 0));
    const fired = dec.automations.filter((a) => a.status === 'FIRED');
    const excess = ['b07-fraud', 'mtl-water'].reduce((t, id) => t + (dec.issues.find((i) => i.id === id)?.impactUSD || 0), 0);
    const byId = Object.fromEntries(dec.issues.map((i) => [i.id, i]));
    const log = fired.slice().sort((a, b) => String(a.firedAt).localeCompare(String(b.firedAt)));
    app().innerHTML = `
      <h1>③ Decisions: what to do about each problem</h1>
      <p class="lede" style="font-size:17px">For every problem the system found, this page shows why it is happening (each idea tested against our data and published articles), what the result is, and exactly what to do: what, where, when, how and why. Impact figures are what we observed in the data window, not annual forecasts.</p>
      <div class="kpis">
        <div class="kpi"><small>Decisions</small><b>${dec.issues.length}</b></div>
        <div class="kpi"><small>Critical</small><b class="bad-t">${dec.issues.filter((i) => i.severity === 'critical').length}</b></div>
        <div class="kpi"><small>Automations fired</small><b>${fired.length} / ${dec.automations.length}</b></div>
        <div class="kpi"><small>Observed excess cost (B07 + Montréal water)</small><b>${money(excess)}</b></div>
      </div>
      <div class="sec"><h2>Who is right?</h2><p class="mute">Four leaders, four beliefs, checked against the data.</p></div>
      <div class="grid2" id="stakeholders">${dec.stakeholders.map((s) => `<div class="card stk"><b>${esc(s.who)}</b> <span class="badge ${s.verdict === 'right' ? 'right' : 'partly'}">${esc(s.verdict)}</span><div class="q">${esc(s.said)}</div><div><b>The data says:</b> ${esc(s.answer)}</div><div style="margin-top:8px">${(s.issues || []).map((id) => `<a class="tag acc" href="#${esc(id)}">${esc(byId[id]?.title || id)}</a>`).join('')}</div></div>`).join('')}</div>
      <div class="sec"><h2>The decisions, in priority order</h2></div>
      <div id="decisions">${issues.map((i) => decisionCard(i, maxImp)).join('')}</div>
      <div class="sec"><h2>Automations: what the system does on its own</h2></div>
      <div class="grid2" id="automations">${dec.automations.map(autoCard).join('')}</div>
      <div class="card feed" style="margin-top:14px"><h3>Action log</h3>${log.length ? log.map((a) => `<div class="l">${esc(a.firedAt)} · ${esc(a.id)} ${esc(a.name)} · ${esc(a.matched?.count ?? 0)} matched</div>`).join('') : '<div class="mute">Nothing has fired.</div>'}</div>
      <div class="sec"><h2>What if?</h2><p class="mute">Move the sliders to see the effect.</p></div>
      ${sim(dec)}
      <div class="foot card"><a href="/platform.html">Underwriting platform</a><a href="/presentation.html">Presentation</a><span>Reproduce: <code>node pipeline/run.mjs</code> then <code>node pipeline/server.mjs</code></span></div>`;
    wireSim();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
  MM.boot('decisions', render);
  document.addEventListener('mm:updated', () => { if (MM.state) render(MM.state); });
})();
