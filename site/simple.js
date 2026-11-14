/* Simple layer: plain charts + the "proof" drawer (data graphs and articles) used by all three pages. */
(function () {
  const S = (window.S = {});
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  S.esc = esc;
  const COL = { bad: 'var(--bad)', good: 'var(--good)', acc: 'var(--accent)', cyan: 'var(--cyan)', warn: 'var(--warn)', mute: 'var(--mute)' };
  // colour hints per chart: series colours + the bar to highlight in red
  const STYLE = {
    'home-vs-auto': { highlight: 'Home' }, 'home-bands': { colors: ['bad', 'cyan'] }, 'city-water': { highlight: 'Montréal' }, 'water-months': { colors: ['bad', 'cyan'] },
    'home-price-vs-cost': { colors: ['acc', 'bad'] }, 'b07-days': { colors: ['bad', 'mute'] }, 'b07-amounts': { colors: ['bad', 'mute'] }, brokers: { highlight: 'B07' },
    channels: { colors: ['bad', 'good'] }, 'close-size': { colors: ['cyan', 'bad'] }, 'wait-renewal': { highlight: '>30 days' }, 'big-claims': { highlight: 'Water Damage' },
    'claim-types': { highlight: 'Water Damage' }, cohorts: { colors: ['bad', 'good'] }, bundle: { highlight: 'One line' }, 'team-intake': { colors: ['cyan', 'mute', 'bad'] },
  };
  const fmt = (v, unit) => (unit === 'ratio' || unit === 'loss ratio' ? (+v).toFixed(2) : /share|who did NOT/.test(unit || '') ? Math.round(v * 100) + '%' : /\$/.test(unit || '') ? '$' + Math.round(v).toLocaleString('en-CA') : /per policy-year|per month/.test(unit || '') ? (+v < 5 ? (+v).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : Math.round(v)) : Math.round(v * 100) / 100);
  const wrap = (t, n) => { const w = String(t).split(' '), out = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); } if (cur) out.push(cur); return out.slice(0, 3); };

  S.chart = function (c, opts = {}) {
    const st = STYLE[c.id] || {}, compact = !!opts.compact, W = 560, unit = c.unit;
    const colors = (st.colors || ['acc', 'cyan', 'warn']).map((k) => COL[k]);
    if (c.type === 'bars') {
      const pts = c.series[0].points, max = Math.max(...pts.map((p) => p.y), 0.0001), rowH = compact ? 22 : 30, H = pts.length * rowH + 6, L = compact ? 110 : 150;
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(c.title)}">${pts.map((p, i) => { const w = Math.max(2, (p.y / max) * (W - L - 70)), hot = p.x === st.highlight; return `<text x="0" y="${i * rowH + rowH * 0.68}" style="fill:var(--ink);font-size:${compact ? 11.5 : 13}px">${esc(String(p.x).length > 22 ? String(p.x).slice(0, 21) + '…' : p.x)}</text><rect class="bh" x="${L}" y="${i * rowH + 4}" width="${w}" height="${rowH - 9}" rx="4" fill="${hot ? COL.bad : COL.acc}" opacity="${hot ? 1 : 0.55}"/><text x="${L + w + 6}" y="${i * rowH + rowH * 0.68}" style="fill:var(--ink);font-size:${compact ? 11.5 : 13}px;font-weight:${hot ? 700 : 500}">${esc(fmt(p.y, unit))}</text>`; }).join('')}</svg>`;
    }
    if (c.type === 'groupbars') {
      const cats = c.series[0].points.map((p) => p.x), ns = c.series.length, max = Math.max(...c.series.flatMap((s) => s.points.map((p) => p.y)), 0.0001), H = compact ? 150 : 210, B = 46, T = 22, L = 8;
      const gw = (W - L - 8) / cats.length, bw = Math.min(30, (gw - 10) / ns);
      return `<svg viewBox="0 0 ${W} ${H + B}" width="100%" role="img" aria-label="${esc(c.title)}">${cats.map((cat, i) => c.series.map((s, k) => { const v = s.points[i].y, h = (v / max) * (H - T), x = L + i * gw + (gw - bw * ns) / 2 + k * bw, y = H - h; return `<rect class="bv" x="${x}" y="${y}" width="${bw - 2}" height="${Math.max(1, h)}" rx="3" fill="${colors[k % colors.length]}" opacity=".9"/><text x="${x + (bw - 2) / 2}" y="${y - 4}" text-anchor="middle" style="fill:var(--ink);font-size:${compact ? 9.5 : 11}px">${esc(fmt(v, unit))}</text>`; }).join('') + wrap(cat, cats.length > 8 ? 6 : 14).map((ln, j) => `<text x="${L + i * gw + gw / 2}" y="${H + 14 + j * 12}" text-anchor="middle" style="font-size:${compact ? 9.5 : 11}px;${c.line === cat ? 'fill:var(--bad);font-weight:700' : ''}">${esc(ln)}</text>`).join('') + (c.line === cat ? `<rect x="${L + i * gw + 2}" y="${T - 6}" width="${gw - 4}" height="${H - T + 6}" fill="none" stroke="var(--bad)" stroke-dasharray="4 3" rx="4"/>` : '')).join('')}${ns > 1 ? `<g>${c.series.map((s, k) => `<rect x="${12 + k * 150}" y="2" width="10" height="10" rx="2" fill="${colors[k % colors.length]}"/><text x="${26 + k * 150}" y="11" style="fill:var(--ink);font-size:11px">${esc(s.name)}</text>`).join('')}</g>` : ''}</svg>`;
    }
    if (c.type === 'lines') {
      const xs = c.series[0].points.map((p) => p.x), max = Math.max(...c.series.flatMap((s) => s.points.map((p) => p.y)), 1), H = compact ? 130 : 190, L = 28, B = 22, T = 18;
      const X = (i) => L + (i / (xs.length - 1)) * (W - L - 10), Y = (v) => H - (v / max) * (H - T);
      return `<svg viewBox="0 0 ${W} ${H + B}" width="100%" role="img" aria-label="${esc(c.title)}"><line x1="${L}" x2="${W - 8}" y1="${H}" y2="${H}" stroke="currentColor" opacity=".25"/>${c.series.map((s, k) => `<polyline fill="none" stroke="${colors[k % colors.length]}" stroke-width="${colors[k] === COL.bad ? 3 : 2}" points="${s.points.map((p, i) => X(i) + ',' + Y(p.y)).join(' ')}"/>`).join('')}${xs.map((x, i) => (i % 2 === 0 ? `<text x="${X(i)}" y="${H + 14}" text-anchor="middle" style="font-size:10px">${esc(x)}</text>` : '')).join('')}<text x="2" y="${Y(max) + 4}" style="font-size:10px">${Math.round(max)}</text>${c.series.map((s, k) => `<rect x="${L + 6 + k * 90}" y="2" width="10" height="10" rx="2" fill="${colors[k % colors.length]}"/><text x="${L + 20 + k * 90}" y="11" style="fill:var(--ink);font-size:11px">${esc(s.name)}</text>`).join('')}</svg>`;
    }
    return '';
  };
  S.table = (c) => { const cats = c.series[0].points.map((p) => p.x); return `<table class="t"><tr><th></th>${c.series.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr>${cats.map((x, i) => `<tr><td>${esc(x)}</td>${c.series.map((s) => `<td>${esc(fmt(s.points[i].y, c.unit))}</td>`).join('')}</tr>`).join('')}</table>`; };
  S.chartBlock = (c, opts = {}) => `<div class="chartblock"><h4>${esc(c.title)}</h4><p class="plain">${esc(c.plain)}</p>${S.chart(c, opts)}<details><summary>See the numbers</summary>${S.table(c)}</details><details><summary>How we calculated this</summary><p class="note">${esc(c.how)}</p><p class="note">Source: ${esc(c.source)}</p></details></div>`;

  // generic table for signal tables (array of flat objects)
  S.objTable = (rows) => { if (!rows?.length) return ''; const keys = Object.keys(rows[0]).slice(0, 7); return `<table class="t"><tr>${keys.map((k) => `<th>${esc(k.replace(/([A-Z])/g, ' $1').toLowerCase())}</th>`).join('')}</tr>${rows.slice(0, 14).map((r) => `<tr>${keys.map((k) => `<td>${esc(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])}</td>`).join('')}</tr>`).join('')}</table>`; };

  S.article = (a) => `<div class="art ${esc(a.stance)}"><div class="arthead"><span class="stance ${esc(a.stance)}">${a.stance === 'supports' ? 'backs it up' : a.stance === 'challenges' ? 'argues against' : 'background'}</span>${a.verified ? '<span class="chk">✓ read</span>' : '<span class="chk un">not opened</span>'}</div><a href="${esc(a.url)}" target="_blank" rel="noopener" class="arttitle">${esc(a.title)}</a><div class="note">${esc(a.publisher || '')}${a.year ? ' · ' + esc(a.year) : ''}${a.geo ? ' · ' + esc(a.geo) : ''}</div>${a.stat ? `<div class="artstat"><b>${esc(a.stat.value)}</b> ${esc(a.stat.what)}</div>` : ''}<p class="artclaim">${esc(a.claim || a.snippet || '')}</p>${a.limit ? `<div class="note">Careful: ${esc(a.limit)}</div>` : ''}</div>`;
  S.keyArticles = (cards, n = 3) => { const ok = cards.filter((c) => c.verified && c.stat); const pick = []; for (const st of ['supports', 'challenges', 'supports', 'context']) { const c = ok.find((x) => x.stance === st && !pick.includes(x)); if (c && pick.length < n) pick.push(c); } for (const c of cards) if (pick.length < n && !pick.includes(c)) pick.push(c); return pick; };

  // proof drawer
  const drawer = document.createElement('aside'); drawer.className = 'proof'; drawer.id = 'proof';
  drawer.innerHTML = '<header><b id="proof-title"></b><button class="btn" id="proof-x">Close</button></header><div class="tabs" id="proof-tabs"></div><div class="body" id="proof-body"></div>';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(drawer)); if (document.body) document.body.appendChild(drawer);
  S.openProof = function ({ title, charts = [], extra = '', articles = [], tab = 'data' }) {
    const $ = (s) => document.querySelector(s); $('#proof-title').textContent = title;
    const showTab = (t) => {
      $('#proof-tabs').innerHTML = `<button class="tab ${t === 'data' ? 'on' : ''}" data-t="data">📊 The data (${charts.length || 'numbers'})</button><button class="tab ${t === 'art' ? 'on' : ''}" data-t="art">📰 Articles (${articles.length})</button>`;
      $('#proof-tabs').querySelectorAll('.tab').forEach((b) => (b.onclick = () => showTab(b.dataset.t)));
      if (t === 'data') $('#proof-body').innerHTML = (charts.length ? charts.map((c) => S.chartBlock(c)).join('') : '') + (extra || (charts.length ? '' : '<p class="note">No graph for this one; see the sentence above.</p>'));
      else { const fl = (k) => articles.filter((a) => k === 'all' || a.stance === k); $('#proof-body').innerHTML = `<div class="chipbar" id="af">${[['all', 'All'], ['supports', 'Back it up'], ['challenges', 'Argue against'], ['context', 'Background']].map(([k, l], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-k="${k}">${l} (${fl(k).length})</button>`).join('')}</div><div id="alist">${fl('all').map(S.article).join('') || '<p class="note">No articles yet. Press “Refresh with live web search”.</p>'}</div><p class="note">“✓ read” = we opened the page and read the number. Articles that argue against are shown on purpose.</p>`; $('#af').querySelectorAll('.chip').forEach((b) => (b.onclick = () => { $('#af').querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b)); $('#alist').innerHTML = fl(b.dataset.k).map(S.article).join(''); })); }
      $('#proof-body').scrollTop = 0;
    };
    showTab(tab); drawer.classList.add('open');
  };

  // ---- Ask-the-AI chat (one conversation per signal) ----
  const chatEl = document.createElement('aside'); chatEl.className = 'proof chatbox'; chatEl.id = 'chat';
  chatEl.innerHTML = '<header><b id="chat-title">Ask the AI</b><span class="engine" id="chat-eng"></span><button class="btn" id="chat-x">Close</button></header><div class="body" id="chat-body"></div><div class="chat-sug" id="chat-sug"></div><form class="chat-in" id="chat-form"><textarea id="chat-q" rows="2" placeholder="Ask anything about this signal, e.g. “what does this mean?”"></textarea><button class="btn primary" type="submit" id="chat-send">Ask</button></form>';
  const mountChat = () => document.body.appendChild(chatEl); if (document.body) mountChat(); else document.addEventListener('DOMContentLoaded', mountChat);
  const CHATS = {}; let CUR = null;
  const fmtA = (t) => esc(t).split(/\n{2,}/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
  const SUG = ['What does this mean in plain words?', 'Why does it matter for our money?', 'How sure are we about this?', 'What should we do about it?', 'Give me a simple example'];
  S.openChat = function ({ signalId, storyId, title }) {
    const $ = (q) => chatEl.querySelector(q), key = signalId || 'story:' + storyId; CUR = { key, signalId, storyId };
    $('#chat-title').textContent = 'Ask the AI: ' + (title || 'this signal').slice(0, 70);
    const hist = (CHATS[key] = CHATS[key] || []);
    const draw = () => { $('#chat-body').innerHTML = (hist.length ? '' : '<div class="msg ai"><p>Hi! I can explain this signal in plain words. Pick a question below or type your own.</p></div>') + hist.map((m) => `<div class="msg ${m.role === 'user' ? 'me' : 'ai'}">${m.role === 'user' ? '<p>' + esc(m.content) + '</p>' : fmtA(m.content)}</div>`).join(''); $('#chat-body').scrollTop = 1e9; };
    $('#chat-sug').innerHTML = SUG.map((q) => `<button type="button" class="chip">${esc(q)}</button>`).join('');
    const ask = async (q) => {
      q = (q || '').trim(); if (!q || CUR.key !== key) return; hist.push({ role: 'user', content: q }); draw();
      $('#chat-q').value = ''; const send = $('#chat-send'); send.disabled = true; $('#chat-body').insertAdjacentHTML('beforeend', '<div class="msg ai think"><p>Thinking<span class="dots"></span></p></div>'); $('#chat-body').scrollTop = 1e9;
      try { const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signalId, storyId, question: q, history: hist.slice(0, -1) }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Something went wrong'); hist.push({ role: 'ai', content: j.answer }); $('#chat-eng').textContent = 'via ' + (j.engine === 'codex' ? 'Codex CLI' : 'Claude Code'); }
      catch (e) { hist.push({ role: 'ai', content: '⚠ ' + e.message }); }
      send.disabled = false; draw();
    };
    $('#chat-sug').querySelectorAll('.chip').forEach((b) => (b.onclick = () => ask(b.textContent)));
    $('#chat-form').onsubmit = (e) => { e.preventDefault(); ask($('#chat-q').value); };
    $('#chat-q').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask($('#chat-q').value); } };
    fetch('/api/chat/engine').then((r) => r.json()).then((j) => { $('#chat-eng').textContent = j.engine ? 'via ' + (j.engine === 'codex' ? 'Codex CLI' : 'Claude Code') : 'no AI tool installed'; }).catch(() => {});
    draw(); chatEl.classList.add('open'); $('#chat-q').focus();
  };
  document.addEventListener('click', (e) => {
    if (e.target.id === 'chat-x') chatEl.classList.remove('open');
    const b = e.target.closest('[data-chat-signal],[data-chat-story]'); if (b) S.openChat({ signalId: b.dataset.chatSignal, storyId: b.dataset.chatStory, title: b.dataset.chatTitle });
  });
  document.addEventListener('click', (e) => { if (e.target.id === 'proof-x') drawer.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') drawer.classList.remove('open'); });
})();
