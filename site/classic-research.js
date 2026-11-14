(function () {
  const { esc, num } = MM;
  const fstate = {}; // per-issue filter
  const SEV = { critical: 'bad', high: 'warn', medium: 'acc', watch: '' };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  function ptype(c) {
    const h = host(c.url), p = (c.publisher || '').toLowerCase();
    const t = h + ' ' + p;
    if (/(\.gc\.ca|\.gouv\.qc|\.qc\.ca|statcan|statistique|gov\b|\.gov|government|ville de|city of|regulator|autorit|amf\b|osfi|cmhc|schl|canada\.ca|ontario\.ca|toronto\.ca|montreal\.ca|ministry|minist)/.test(t)) return 'Government / regulator';
    if (/(ibc\.ca|bureau d|association|institute|council|catiq|cia\b|actuar|cai\b|chamber|federation|intact centre|ccaa|industry)/.test(t)) return 'Industry body';
    if (/(\.edu|univers|concordia|mcgill|academ|journal|sciencedirect|springer|wiley|research ?gate|\.ac\.|doi\.org|journal)/.test(t)) return 'Academic';
    if (/(news|times|post|globe|gazette|cbc|radio-canada|ctv|global|press|magazine|journal|report|trade|insurance-?business|insurancebusiness|canadianunderwriter|advisor|cp24|la presse|le devoir|tva|reuters|bloomberg)/.test(t)) return 'News / trade press';
    if (/(insur|assurance|intact|desjardins|aviva|sun life|manulife|belair|economical|co-operators|allstate|state farm|swiss re|munich re|lloyd)/.test(t)) return 'Insurer / reinsurer';
    return 'Other';
  }
  const TYPES = ['Government / regulator', 'Industry body', 'Insurer / reinsurer', 'News / trade press', 'Academic', 'Other'];
  const isLive = (c) => c.source === 'live-scrape';
  const cnt = (cs) => ({ n: cs.length, s: cs.filter((c) => c.stance === 'supports').length, c: cs.filter((c) => c.stance === 'challenges').length, x: cs.filter((c) => c.stance === 'context').length, v: cs.filter((c) => c.verified).length, live: cs.filter(isLive).length, pubs: new Set(cs.map((c) => (c.publisher || host(c.url)).toLowerCase())).size, geos: new Set(cs.map((c) => c.geo).filter(Boolean)).size });
  const bal = (k) => { const t = k.n || 1; return `<div class="bal" title="supports / challenges / context"><i class="s" style="width:${k.s / t * 100}%"></i><i class="c" style="width:${k.c / t * 100}%"></i><i class="x" style="width:${k.x / t * 100}%"></i></div>`; };

  function card(c) {
    const live = isLive(c);
    return `<div class="ev ${esc(c.stance)}"><h4><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a></h4>
<div><span class="tag ${c.stance === 'supports' ? 'good' : c.stance === 'challenges' ? 'bad' : ''}">${esc(c.stance || 'context')}</span>${c.verified ? '<span class="tag good">✓ verified</span>' : '<span class="tag warn">unverified</span>'}${live ? '<span class="tag acc">live scrape</span>' : ''}${c.angle ? `<span class="tag">${esc(c.angle)}</span>` : ''}</div>
<div class="mute" style="font-size:14px">${esc(c.publisher || host(c.url))}${c.year ? ' · ' + esc(c.year) : ''}${c.geo ? ' · ' + esc(c.geo) : ''}</div>
${c.stat && c.stat.value ? `<div class="stat"><b>${esc(c.stat.value)}</b> ${esc(c.stat.what || '')}</div>` : ''}
${c.claim ? `<p>${esc(c.claim)}</p>` : ''}
${c.relevance ? `<p><span class="lbl">Why it matters</span><br>${esc(c.relevance)}</p>` : ''}
${c.limit ? `<p><span class="lbl">Limit</span><br>${esc(c.limit)}</p>` : ''}
${live && c.snippet ? `<p class="snip"><span class="lbl">Auto-extracted</span><br>“${esc(String(c.snippet).slice(0, 260))}${String(c.snippet).length > 260 ? '…' : ''}”</p>` : ''}</div>`;
  }

  function filt(cs, f) {
    if (f === 'all') return cs;
    if (f === 'verified') return cs.filter((c) => c.verified);
    if (f === 'live') return cs.filter(isLive);
    if (f.startsWith('angle:')) return cs.filter((c) => c.angle === f.slice(6));
    return cs.filter((c) => c.stance === f);
  }

  function render(st) {
    const app = document.getElementById('app');
    const issues = [...(st.decisions?.issues || [])].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    const sigs = st.signals?.signals || [];
    const ev = st.evidence || {};
    const cur = st.research?.curatedFiles || [], liveRuns = st.research?.live || [];
    const all = []; Object.entries(ev).forEach(([id, cs]) => (cs || []).forEach((c) => all.push({ ...c, _issue: id })));
    const K = cnt(all);
    const qByIssue = {}; const gapsByIssue = {};
    cur.forEach((f) => { const id = f.issue === 'peer-water' ? 'mtl-water' : f.issue; (qByIssue[id] = qByIssue[id] || []).push(...(f.queries || [])); if (f.gaps) (gapsByIssue[id] = gapsByIssue[id] || []).push(...[].concat(f.gaps)); });
    sigs.forEach((s) => (s.queries || []).forEach((q) => { (qByIssue[s.issue] = qByIssue[s.issue] || []).push(q); }));
    Object.keys(qByIssue).forEach((k) => (qByIssue[k] = [...new Set(qByIssue[k])]));
    const nQ = Object.values(qByIssue).reduce((a, q) => a + q.length, 0);
    const nCur = all.length - K.live;
    const lastRun = st.research?.lastRun;
    const sigCount = sigs.length;

    const steps = [
      ['Read the signal', 'Each detected pattern (a number that looks odd) becomes a research question.', `<b>${sigCount}</b> signals read, across <b>${issues.length}</b> issues`],
      ['Build queries', 'Turn the signal into search phrases, plus templates per issue (e.g. “loss ratio vs auto”).', `<b>${nQ}</b> distinct queries`],
      ['Search the web', 'Send each query to search engines and collect candidate pages.', `<b>${nCur + K.live}</b> pages kept from search (${nCur} curated, ${K.live} live)`],
      ['Fetch pages', 'Open each page and read the text. Curated pages were read by 8 research agents.', `<b>${nCur}</b> pages read by agents, <b>${K.live}</b> auto-fetched`],
      ['Extract and score', 'Pull out the statistic and judge: does it support, challenge, or just add context?', `<b>${K.s}</b> support · <b>${K.c}</b> challenge · <b>${K.x}</b> context`],
      ['Verify and attach', 'Check the page says what we claim, then attach to the issue.', `<b>${K.v}</b> verified · <b>${K.pubs}</b> publishers · <b>${K.geos}</b> places`],
    ];

    // source map
    const byType = {}; TYPES.forEach((t) => (byType[t] = {}));
    all.forEach((c) => { const t = ptype(c), p = c.publisher || host(c.url); byType[t][p] = (byType[t][p] || 0) + 1; });

    const logLines = (st.log || []).slice(-60);

    app.innerHTML = `
<h1>② Research: what does the outside world say?</h1>
<p class="lede">For every signal the system goes out and collects articles and statistics from as many sources as it can, then sorts them by point of view: sources that <b class="good-t">support</b> the finding, sources that <b class="bad-t">challenge</b> it, and neutral <b>context</b>. Nothing is hidden: every step is shown below with what we got out of it.</p>

<h2>Research agent workflow</h2>
<div class="steps">${steps.map((s, i) => `<div class="step"><span class="n">${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><div class="got"><span class="mute">What we got:</span><br>${s[2]}</div></div>`).join('')}</div>
<div class="card"><button class="btn primary rbtn" id="r-live">Run live scrape now</button>
<p class="note" style="font-size:14px">Curated evidence was gathered by 8 research agents that fetched and read each page. The live scrape adds auto-extracted snippets, which are less reliable and flagged “live scrape”. ${lastRun ? 'Last run: ' + esc(lastRun) + '.' : 'No live scrape has run yet.'}</p></div>

<h2>Evidence at a glance</h2>
<div class="kpis">
<div class="kpi"><small>Evidence cards</small><b>${K.n}</b></div>
<div class="kpi"><small>Verified</small><b>${K.v}</b><span>${K.n ? Math.round(K.v / K.n * 100) : 0}% of cards</span></div>
<div class="kpi"><small>Distinct publishers</small><b>${K.pubs}</b></div>
<div class="kpi"><small>Supports</small><b class="good-t">${K.s}</b></div>
<div class="kpi"><small>Challenges</small><b class="bad-t">${K.c}</b></div>
<div class="kpi"><small>Context</small><b>${K.x}</b></div>
<div class="kpi"><small>Live-scraped</small><b>${K.live}</b></div></div>
${bal(K)}

<h2>Issue navigator</h2>
<div class="nav2">${issues.map((i) => `<a class="tag ${SEV[i.severity] || ''}" href="#${esc(i.id)}">${esc(i.title.length > 46 ? i.title.slice(0, 44) + '…' : i.title)}</a>`).join('')}</div>
${issues.map((i) => {
      const cs = ev[i.id] || [], k = cnt(cs), f = fstate[i.id] || 'all';
      const is = sigs.filter((s) => s.issue === i.id);
      const qs = qByIssue[i.id] || [];
      const angles = [...new Set(cs.map((c) => c.angle).filter(Boolean))];
      const chips = [['all', 'All'], ['supports', 'Supports'], ['challenges', 'Challenges'], ['context', 'Context'], ['verified', 'Verified only'], ['live', 'Live only'], ...angles.map((a) => ['angle:' + a, a])];
      const shown = filt(cs, f);
      const gaps = gapsByIssue[i.id];
      return `<section class="card issue" id="${esc(i.id)}" data-issue="${esc(i.id)}">
<div><span class="tag ${SEV[i.severity] || ''}">${esc(i.severity)}</span><h3 style="display:inline;font-size:20px">${esc(i.title)}</h3></div>
<div class="kpis" style="margin-top:10px"><div class="kpi"><small>Sources</small><b>${k.n}</b></div><div class="kpi"><small>Verified</small><b>${k.v}</b></div><div class="kpi"><small>Publishers</small><b>${k.pubs}</b></div></div>
${bal(k)}<div class="note">${k.s} support · ${k.c} challenge · ${k.x} context</div>
<h4>Signals that triggered this research</h4>
<ul class="qs">${is.slice(0, 3).map((s) => `<li>${esc(s.headline)}</li>`).join('') || '<li>No signal headlines linked.</li>'}${is.length > 3 ? `<li>…and ${is.length - 3} more</li>` : ''}</ul>
<details><summary>${qs.length} queries used</summary><ul class="qs">${qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></details>
${cs.length ? `<div class="chipbar">${chips.map(([v, l]) => `<button class="chip ${v === f ? 'on' : ''}" data-f="${esc(v)}">${esc(l)}</button>`).join('')}</div>
<div class="note" data-count>Showing ${shown.length} of ${cs.length}</div>
<div class="cards">${shown.map(card).join('') || '<div class="note">No cards match this filter.</div>'}</div>` : '<div class="note">No evidence collected for this issue yet. Run the live scrape.</div>'}
${gaps && gaps.length ? `<div class="card warn" style="margin-top:10px"><b>Gaps (what we could not find)</b><ul class="qs">${gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>` : ''}
</section>`;
    }).join('')}

<h2>Source map</h2>
<p class="lede">Who the evidence comes from, grouped by type of publisher.</p>
<div class="sm">${TYPES.map((t) => { const e = Object.entries(byType[t]).sort((a, b) => b[1] - a[1]); const tot = e.reduce((a, x) => a + x[1], 0); return `<div class="card"><h3>${esc(t)} <span class="tag">${tot} cards · ${e.length} publishers</span></h3><table class="t">${e.map(([p, n]) => `<tr><td>${esc(p)}</td><td>${n}</td></tr>`).join('') || '<tr><td class="mute">none</td></tr>'}</table></div>`; }).join('')}</div>

<h2>Live scrape log</h2>
<pre id="log">${logLines.length ? logLines.map((l) => esc(typeof l === 'string' ? l : (l.msg || JSON.stringify(l)))).join('\n') : 'No log lines yet. Press “Run live scrape now”.'}</pre>
${liveRuns.length ? `<p class="note">Live cards per issue: ${liveRuns.map((r) => esc(r.issue) + ' ' + (r.cards?.length ?? 0)).join(' · ')}</p>` : ''}

<h2>What the research told us</h2>
<ul class="sum card">${issues.map((i) => { const k = cnt(ev[i.id] || []); const lead = k.s > k.c ? 'leans towards confirming the finding' : k.c > k.s ? 'pushes back on the finding, so read it carefully' : 'is evenly split';
      return `<li><b>${esc(i.title)}</b><br>${k.n} sources: ${k.s} support, ${k.c} challenge, ${k.x} context (${k.v} verified, ${k.pubs} publishers).<br>Overall the evidence ${k.n ? lead : 'is not collected yet'}. <a href="/decisions.html#${esc(i.id)}">See the decision →</a></li>`; }).join('')}</ul>`;

    const live = document.getElementById('r-live'); if (live) live.onclick = () => MM.run({ scrape: true });
    app.querySelectorAll('.issue').forEach((sec) => sec.querySelectorAll('.chip').forEach((b) => (b.onclick = () => {
      const id = sec.dataset.issue, f = b.dataset.f; fstate[id] = f; const cs = ev[id] || [], shown = filt(cs, f);
      sec.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
      sec.querySelector('.cards').innerHTML = shown.map(card).join('') || '<div class="note">No cards match this filter.</div>';
      sec.querySelector('[data-count]').textContent = `Showing ${shown.length} of ${cs.length}`;
    })));
    const lg = document.getElementById('log'); if (lg) lg.scrollTop = lg.scrollHeight;
    if (location.hash && !render._h) { render._h = 1; const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  }
  MM.boot('research', render);
})();
