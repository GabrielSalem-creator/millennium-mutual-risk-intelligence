#!/usr/bin/env node
// Live research scraper: DuckDuckGo/Bing search -> fetch pages -> extract evidence sentences -> cards.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.join(HERE, 'live');
const CACHE = path.join(LIVE, 'cache');
fs.mkdirSync(CACHE, { recursive: true });

// ---- args
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); if (i < 0) return d; const v = argv[i + 1]; return (v === undefined || v.startsWith('--')) ? true : v; };
const OFFLINE = argv.includes('--offline');
const MAX_Q = +flag('max-queries', 3);
const MAX_PAGES = +flag('max-pages', 4);
const BUDGET = +flag('budget-sec', 90) * 1000;
const ONLY = typeof flag('issues') === 'string' ? flag('issues').split(',').map(s => s.trim()).filter(Boolean) : null;
const T0 = Date.now();
const overBudget = () => Date.now() - T0 > BUDGET;

const log = (msg, extra = {}) => console.log(JSON.stringify({ t: new Date().toISOString(), step: 'research', msg, ...extra }));
const err = (msg, extra = {}) => log(msg, { level: 'error', ...extra });
const sha1 = s => crypto.createHash('sha1').update(s).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BLOCK_DOMAINS = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'wsj.com', 'ft.com', 'bloomberg.com', 'nytimes.com', 'thestar.com', 'theglobeandmail.com', 'duckduckgo.com', 'bing.com', 'microsoft.com', 'google.com', 'wikipedia.org'];

// ---- issue config
const FALLBACK = {
  'mtl-water': ['Montreal home insurance water damage sewer backup claims increase', 'Canada insured water damage claims basement flooding statistics', 'Montreal aging water mains pipes breaks per year'],
  'b07-fraud': ['insurance broker fraud claims Canada statistics', 'Canada insurance fraud cost percent of claims', 'broker concentration claims fraud indicators insurance'],
  'senior-review': ['senior drivers insurance claims severity statistics Canada', 'older policyholders claim cost higher percent insurance', 'large loss review referral threshold claims handling'],
  'claim-wait-retention': ['claims settlement time customer retention insurance study', 'insurance claim wait days policyholder renewal churn percent', 'claims satisfaction cycle time switching insurer'],
  'home-pricing': ['Canada home insurance loss ratio combined ratio water damage', 'home insurance premiums rising Canada percent claims', 'property insurance rate increase water claims loss ratio'],
  'broker-channel': ['insurance broker channel performance loss ratio Canada', 'broker versus direct insurance claims quality retention', 'insurance distribution broker underwriting results statistics'],
  'severe-claims': ['severe insurance claims large loss share of total cost', 'large claims percentage of claim costs property insurance', 'catastrophe water damage severity average claim Canada'],
};
const ALIAS = { 'peer-water': 'mtl-water' };
const FB = id => FALLBACK[ALIAS[id] || id] || [];
const STOP = new Set('the and for with that this from are was were has have had not but you your into than then over under more most per vs versus how what when which who why can its their they them out any all one two new 2024 2025 2026'.split(' '));
const kws = qs => [...new Set(qs.join(' ').toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿœ\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w)))];

// ---- http
async function http(url, timeoutMs = 12000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'en-CA,en;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  return res;
}
let lastReq = 0;
async function polite() { const w = 1200 - (Date.now() - lastReq); if (w > 0) await sleep(w); lastReq = Date.now(); }

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/g, ' ');
const stripTags = s => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function okUrl(u) {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol)) return false;
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|jpe?g|png)(\?|$)/i.test(x.pathname)) return false;
    const h = x.hostname.replace(/^www\./, '');
    return !BLOCK_DOMAINS.some(d => h === d || h.endsWith('.' + d));
  } catch { return false; }
}

// ---- search
function parseDDG(html) {
  const out = [];
  const re = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    let href = decode(m[1]);
    if (href.startsWith('//')) href = 'https:' + href;
    const u = href.match(/[?&]uddg=([^&]+)/);
    if (u) href = decodeURIComponent(u[1]);
    if (/^https?:\/\//.test(href) && !/duckduckgo\.com\/y\.js/.test(href)) out.push({ url: href, title: stripTags(m[2]) });
  }
  return out;
}
function parseBing(html) {
  const out = [];
  const re = /<li class="b_algo"[\s\S]*?<\/li>/g;
  let m;
  while ((m = re.exec(html))) {
    const a = m[0].match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    let href = decode(a[1]);
    const b = href.match(/[?&]u=a1([^&]+)/);
    if (b) { try { href = Buffer.from(b[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch {} }
    if (/^https?:\/\//.test(href)) out.push({ url: href, title: stripTags(a[2]) });
  }
  return out;
}
const stats = {};
async function search(q, S) {
  const cf = path.join(CACHE, 'q-' + sha1(q) + '.json');
  if (fs.existsSync(cf)) {
    try { const c = JSON.parse(fs.readFileSync(cf, 'utf8')); log(`search (cache): ${q} -> ${c.results.length} results`, { cache: true, engine: c.engine }); return c.results; } catch {}
  }
  if (OFFLINE) { log(`search skipped (offline, no cache): ${q}`); return []; }
  if (overBudget()) return [];
  S.searches++;
  for (const [engine, url, parse] of [
    ['duckduckgo', 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), parseDDG],
    ['bing', 'https://www.bing.com/search?q=' + encodeURIComponent(q), parseBing]]) {
    try {
      await polite();
      const r = await http(url);
      const html = await r.text();
      const results = parse(html);
      if (r.status !== 200 || !results.length) { err(`search ${engine} HTTP ${r.status}, ${results.length} results; trying fallback`, { engine }); continue; }
      fs.writeFileSync(cf, JSON.stringify({ query: q, engine, at: new Date().toISOString(), results }));
      log(`search: ${q} -> ${results.length} results (${engine})`, { engine });
      return results;
    } catch (e) { err(`search ${engine} failed: ${e.message}`, { engine }); }
  }
  return [];
}

// ---- page extraction
function extractPage(html) {
  const title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const meta = (html.match(/<meta[^>]+(?:article:published_time|datePublished|pubdate|date)[^>]*content="([^"]+)"/i) || html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || '';
  let year = (meta.match(/(20[0-3]\d|19\d\d)/) || [])[1] || null;
  const body = html.replace(/<(script|style|noscript|nav|header|footer|aside|form|svg|iframe)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h\d|tr|br|section|article)>/gi, '. ');
  const text = stripTags(body).replace(/(\.\s*){2,}/g, '. ');
  if (!year) year = (text.slice(0, 3000).match(/\b(20[12]\d)\b/) || [])[1] || null;
  return { title, year: year ? +year : null, text };
}
async function getPage(url, S) {
  const cf = path.join(CACHE, sha1(url) + '.txt');
  if (fs.existsSync(cf)) {
    const raw = fs.readFileSync(cf, 'utf8');
    const i = raw.indexOf('\n\n');
    try { const h = JSON.parse(raw.slice(0, i)); log(`cache hit ${new URL(url).hostname}`, { cache: true }); return { ...h, text: raw.slice(i + 2), cached: true }; } catch {}
  }
  if (OFFLINE || overBudget()) return null;
  await polite();
  try {
    const r = await http(url);
    const ct = r.headers.get('content-type') || '';
    if (r.status !== 200) { err(`fetch ${r.status} ${new URL(url).hostname}`, { url, status: r.status }); S.blocked.add(`${new URL(url).hostname} (HTTP ${r.status})`); return null; }
    if (!/html|text/.test(ct)) { log(`skip non-html ${ct} ${new URL(url).hostname}`); return null; }
    const html = (await r.text()).slice(0, 2_000_000);
    const p = extractPage(html);
    const head = { url, status: 200, title: p.title, year: p.year, fetchedOn: new Date().toISOString().slice(0, 10) };
    fs.writeFileSync(cf, JSON.stringify(head) + '\n\n' + p.text);
    S.pagesFetched++;
    return { ...head, text: p.text };
  } catch (e) { err(`fetch failed ${new URL(url).hostname}: ${e.message}`, { url }); S.blocked.add(`${new URL(url).hostname} (${e.name})`); return null; }
}

const NUM = /(\$\s?\d[\d,.]*\s?(?:billion|million|thousand|[BMK])?|\d[\d,.]*\s?(?:%|per\s?cent|percent|billion|million)|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?(?:times|days|weeks|years|claims|policies|breaks)\b)/i;
const UP = /\b(increase[sd]?|higher|surge[sd]?|rise[sn]?|rose|record|growing|grew|soar\w*|jump\w*)\b/i;
const DOWN = /\b(declin\w+|lower|fewer|reduc\w+|no evidence|not|decrease[sd]?|drop\w*|fell)\b/i;

function evidence(text, keys) {
  const sents = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"“$])/).map(s => s.trim()).filter(s => s.length > 40 && s.length < 600);
  const out = [];
  for (const s of sents) {
    const m = s.match(NUM);
    if (!m) continue;
    const low = s.toLowerCase();
    if (keys.filter(k => low.includes(k)).length < 2) continue;
    const words = s.split(/\s+/);
    const idx = words.findIndex(w => w.includes(m[1].split(/\s/)[0]));
    const a = Math.max(0, (idx < 0 ? 0 : idx) - 4), b = Math.min(words.length, a + 9);
    const what = words.slice(a, b).join(' ');
    const stance = DOWN.test(s) ? 'challenges' : UP.test(s) ? 'supports' : 'context';
    out.push({ snippet: s.slice(0, 220), value: m[1].trim(), what, stance });
    if (out.length >= 3) break;
  }
  return out;
}

// ---- already-curated URLs
const known = new Set();
const evDir = path.join(HERE, 'evidence');
if (fs.existsSync(evDir)) for (const f of fs.readdirSync(evDir)) {
  try { const j = JSON.parse(fs.readFileSync(path.join(evDir, f), 'utf8')); const walk = o => { if (o && typeof o === 'object') { if (typeof o.url === 'string') known.add(o.url.replace(/\/$/, '')); Object.values(o).forEach(walk); } }; walk(j); } catch {}
}

// ---- main
async function main() {
  let sig = { signals: [], issues: [] };
  try { sig = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'signals.json'), 'utf8')); }
  catch (e) { err('cannot read out/signals.json, using fallback queries only: ' + e.message); }
  let ids = ONLY || (sig.issues || []).map(i => i.id).filter(i => !['data-quality', 'bundle-opportunity', 'other'].includes(i));
  if (!ONLY && !ids.length) ids = Object.keys(FALLBACK);
  log(`start: issues=${ids.join(',')} maxQueries=${MAX_Q} maxPages=${MAX_PAGES} offline=${OFFLINE} budget=${BUDGET / 1000}s`);
  const seen = new Set();
  const summary = {};
  for (const issue of ids) {
    if (overBudget()) { log(`budget exhausted, skipping ${issue}`); continue; }
    const key = ALIAS[issue] || issue;
    const S = { searches: 0, pagesFetched: 0, blocked: new Set() };
    const fromSig = (sig.signals || []).filter(s => s.issue === issue || s.issue === key).flatMap(s => s.queries || []);
    const queries = [...new Set([...fromSig, ...FB(issue)])].slice(0, MAX_Q);
    const keys = kws([...queries, issue.replace(/-/g, ' ')]);
    log(`issue ${issue}: ${queries.length} queries, ${keys.length} keywords`, { issue });
    const cards = [];
    let pagesTried = 0, attempts = 0, n = 0;
    const i3 = issue.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();
    outer: for (const q of queries) {
      const results = await search(q, S);
      const qkeys = kws([q, issue.replace(/-/g, ' ')]);
      for (const r of results) {
        if (pagesTried >= MAX_PAGES || attempts >= MAX_PAGES * 2 || overBudget()) break outer;
        const u = r.url.replace(/\/$/, '');
        if (!okUrl(u) || seen.has(u) || known.has(u)) continue;
        seen.add(u);
        attempts++;
        const pg = await getPage(r.url, S);
        if (!pg) continue;
        pagesTried++;
        const host = new URL(r.url).hostname.replace(/^www\./, '');
        const ev = evidence(pg.text, [...new Set([...qkeys, ...keys.slice(0, 12)])]);
        log(`fetch ${pg.status} ${host} ${pg.text.split(/\s+/).length.toLocaleString('en-US')} words -> ${ev.length} evidence sentences`, { url: r.url, issue });
        for (const e of ev) {
          cards.push({
            id: `LV-${i3}-${++n}`, angle: 'live-scrape', title: (pg.title || r.title || host).slice(0, 160), url: r.url, publisher: host, year: pg.year, geo: '',
            claim: 'Page reports: ' + e.what, stat: { value: e.value, what: e.what }, stance: e.stance,
            relevance: 'Matched query: ' + q, limit: 'Auto-extracted sentence: verify in the source', snippet: e.snippet,
            verified: true, fetchedOn: pg.fetchedOn || new Date().toISOString().slice(0, 10), source: 'live-scrape',
          });
        }
      }
    }
    const out = { issue, generated: new Date().toISOString(), queries, cards, stats: { searches: S.searches, pagesFetched: S.pagesFetched, cards: cards.length } };
    fs.writeFileSync(path.join(LIVE, issue + '.json'), JSON.stringify(out, null, 2));
    summary[issue] = { ...out.stats, pagesTried, blocked: [...S.blocked] };
    log(`issue ${issue} done: ${cards.length} cards from ${pagesTried} pages`, { issue, ...summary[issue] });
  }
  log(`summary: ${Object.values(summary).reduce((a, s) => a + s.cards, 0)} cards in ${((Date.now() - T0) / 1000).toFixed(1)}s`, { done: true, summary });
}
main().catch(e => { err('fatal: ' + e.message); process.exit(0); });
