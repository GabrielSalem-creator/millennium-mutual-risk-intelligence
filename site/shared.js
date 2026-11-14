/* Shared shell for the three pages. Contract: every page calls MM.boot('signals'|'research'|'decisions', render)
   and re-renders on the 'mm:updated' event (fired after a pipeline run or an upload). */
(function () {
  const MM = (window.MM = {});
  MM.esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  MM.money = (x) => (x == null || !Number.isFinite(+x) ? '—' : (x < 0 ? '-' : '') + '$' + Math.abs(Math.round(+x)).toLocaleString('en-CA'));
  MM.pct = (x, d = 0) => (x == null || !Number.isFinite(+x) ? '—' : (+x * 100).toFixed(d) + '%');
  MM.num = (x, d = 2) => (x == null || !Number.isFinite(+x) ? '—' : (+x).toLocaleString('en-CA', { maximumFractionDigits: d }));
  MM.state = null;
  MM.load = async () => { const r = await fetch('/api/state', { cache: 'no-store' }); if (!r.ok) throw new Error('state ' + r.status); MM.state = await r.json(); return MM.state; };
  const PAGES = [['signals', '/index.html', '1 · What we found'], ['research', '/research.html', '2 · Why it happens'], ['decisions', '/decisions.html', '3 · What to do'], ['how', '/how.html', 'How it works']];
  const STEPS = ['DATA', 'DETECT', 'RESEARCH', 'DECIDE', 'ACT'];
  MM.boot = async function (page, render) {
    document.body.insertAdjacentHTML('afterbegin', `<div class="topbar"><div class="row"><div class="brand">Millennium Mutual<small>DATA → DETECT → DECIDE → ACT</small></div><nav class="nav">${PAGES.map(([id, href, label]) => `<a href="${href}" class="${id === page ? 'on' : ''}">${label}</a>`).join('')}<a href="/platform.html" target="_blank">Price a customer ↗</a></nav><span class="spacer"></span><span id="mm-source" class="tag"></span><label class="btn" style="cursor:pointer">Upload data<input id="mm-up" type="file" accept=".csv" multiple hidden></label><button class="btn" id="mm-reset">Reset data</button><button class="btn" id="mm-scrape">Refresh with live web search</button><button class="btn primary" id="mm-run">▶ Re-run analysis</button></div><div class="flow" id="mm-flow">${STEPS.map((s, i) => `<span class="st" data-s="${s}">${s}</span>${i < STEPS.length - 1 ? '<span class="arrow">→</span>' : ''}`).join('')}</div></div><aside class="drawer" id="mm-drawer"><header><b>What the computer is doing right now (live commands)</b><button class="btn" id="mm-close">Close</button></header><pre id="mm-log"></pre></aside>`);
    const $ = (s) => document.querySelector(s), setFlow = (s, cls) => { const el = document.querySelector(`#mm-flow .st[data-s="${s}"]`); if (el) el.className = 'st ' + (cls || ''); };
    const refresh = async () => { try { await MM.load(); const st = MM.state; $('#mm-source').textContent = st.meta?.source === 'uploaded' ? 'DATA: uploaded files' : 'DATA: Millennium Mutual extract'; $('#mm-source').className = 'tag ' + (st.meta?.source === 'uploaded' ? 'warn' : 'good'); STEPS.forEach((s) => setFlow(s, st.signals ? 'done' : '')); render(st); } catch (e) { document.querySelector('.wrap')?.insertAdjacentHTML('afterbegin', `<div class="card bad">Could not load pipeline state: ${MM.esc(e.message)}. Start the server with <code>node pipeline/server.mjs</code>.</div>`); } };
    MM.refresh = refresh;
    const log = $('#mm-log'), line = (cls, txt) => { log.insertAdjacentHTML('beforeend', `<span class="${cls}">${MM.esc(txt)}</span>\n`); log.scrollTop = log.scrollHeight; };
    MM.run = async function (opts = {}) {
      $('#mm-drawer').classList.add('open'); log.textContent = ''; ['#mm-run', '#mm-scrape'].forEach((s) => ($(s).disabled = true)); STEPS.forEach((s) => setFlow(s, ''));
      const q = new URLSearchParams({ scrape: opts.scrape ? '1' : '0' });
      try {
        const res = await fetch('/api/run?' + q, { method: 'POST' }); const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
        while (true) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i; while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i).trim(); buf = buf.slice(i + 2); if (!chunk.startsWith('data:')) continue; let ev; try { ev = JSON.parse(chunk.slice(5)); } catch { continue; }
          if (ev.cmd) line('cmd', '$ ' + ev.cmd); if (ev.msg) line(ev.level === 'error' ? 'err' : ev.done ? 'ok' : 'dim', (ev.step ? '[' + ev.step + '] ' : '') + ev.msg);
          const map = { detect: 'DETECT', research: 'RESEARCH', decide: 'DECIDE', data: 'DATA' }; if (ev.step && map[ev.step]) { setFlow(map[ev.step], 'run'); } if (ev.stepDone && map[ev.stepDone]) setFlow(map[ev.stepDone], 'done'); if (ev.done) { STEPS.forEach((s) => setFlow(s, 'done')); } } }
      } catch (e) { line('err', 'run failed: ' + e.message); }
      ['#mm-run', '#mm-scrape'].forEach((s) => ($(s).disabled = false)); await refresh(); document.dispatchEvent(new CustomEvent('mm:updated'));
    };
    $('#mm-run').onclick = () => MM.run({ scrape: false }); $('#mm-scrape').onclick = () => MM.run({ scrape: true }); $('#mm-close').onclick = () => $('#mm-drawer').classList.remove('open');
    $('#mm-reset').onclick = async () => { await fetch('/api/reset', { method: 'POST' }); MM.run({ scrape: false }); };
    $('#mm-up').onchange = async (e) => { const files = [...e.target.files]; for (const f of files) { const name = /claim/i.test(f.name) ? 'claims' : /polic/i.test(f.name) ? 'policies' : null; if (!name) { alert('Name the files policies.csv and claims.csv'); return; } await fetch('/api/upload?file=' + name, { method: 'POST', body: await f.text() }); } const s = await (await fetch('/api/upload/status')).json(); if (s.ready) MM.run({ scrape: false }); else { $('#mm-drawer').classList.add('open'); $('#mm-log').textContent = 'Uploaded ' + files.map((f) => f.name).join(', ') + '. Now upload the other file (policies.csv and claims.csv are both needed).'; } };
    document.addEventListener('mm:updated', () => {}); await refresh();
  };
})();
