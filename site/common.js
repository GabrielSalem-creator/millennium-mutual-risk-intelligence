/* helpers shared by the three simple pages */
window.PG = {
  btns: (id, s) => `<div class="btns"><button class="pbtn" data-act="data" data-id="${id}">📊 See the data</button><button class="pbtn" data-act="art" data-id="${id}">📰 See the articles (${s.articles.length})</button><button class="pbtn chat" data-chat-story="${id}" data-chat-title="${S.esc(s.headline)}">💬 Ask the AI</button></div>`,
  wire(root, stories, state) {
    root.onclick = (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act, id = b.dataset.id;
      if (act === 'sig') { const sg = state.signals.signals.find((x) => x.id === id), st = stories.find((s) => s.issueIds.includes(sg.issue)); return PG.openSignal(sg, st); }
      const s = stories.find((x) => x.id === id); if (!s) return;
      S.openProof({ title: s.headline, charts: s.charts, articles: s.articles, tab: act === 'art' ? 'art' : 'data' });
    };
  },
  openSignal(sg, st) {
    const num = (v) => (v == null || v === '' || !Number.isFinite(+v) ? null : +v);
    const a = num(sg.metric?.value), b = num(sg.metric?.baseline);
    let extra = `<div class="chartblock"><h4>The numbers behind this sentence</h4><p class="plain">${S.esc(sg.headline)}</p>`;
    if (a !== null && b !== null) extra += S.chart({ id: 'sig', type: 'bars', unit: '', series: [{ name: sg.metric.name, points: [{ x: 'This group', y: a }, { x: 'Compared with', y: b }] }] });
    extra += `<p class="note">Measured: ${S.esc(sg.metric?.name || '')}</p>`;
    if (sg.table) extra += S.objTable(sg.table);
    if (sg.stats) extra += `<details><summary>How sure are we?</summary><p class="note">Test: ${S.esc(sg.stats.test || '')}${sg.stats.ci95 ? ' · 95% range ×' + sg.stats.ci95.join(' to ×') : ''}${sg.stats.p !== undefined ? ' · chance it is luck: ' + S.esc(sg.stats.p) : ''}</p></details>`;
    if (sg.caveats?.length) extra += `<details><summary>Careful</summary>${sg.caveats.map((c) => `<p class="note">${S.esc(c)}</p>`).join('')}</details>`;
    extra += `<button class="pbtn chat" data-chat-signal="${S.esc(sg.id)}" data-chat-title="${S.esc(sg.headline)}">💬 Ask the AI what this means</button></div>`;
    S.openProof({ title: 'Proof for: ' + sg.headline.slice(0, 80), charts: st ? st.charts.slice(0, 2) : [], extra, articles: st ? st.articles : [], tab: 'data' });
  },
  hero: (h1, p) => `<div class="hero"><h1>${h1}</h1><p>${p}</p></div>`,
  steps: (state) => `<div class="steps5">${STORY.workflow(state).map((s) => `<div class="s"><span class="n">${s.n}</span><b>${s.t}</b><p>${s.d}</p><div class="got">${S.esc(s.got)}</div></div>`).join('')}</div>`,
};
