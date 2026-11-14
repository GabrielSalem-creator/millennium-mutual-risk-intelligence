#!/usr/bin/env node
import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, extname, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SITE = join(ROOT, 'site');
const OUT = join(HERE, 'out'), EVID = join(HERE, 'evidence'), LIVE = join(HERE, 'live');
const UPLOADS = join(HERE, 'uploads', 'current');
const RUNS = join(HERE, 'runs');
const PORT = Number(process.env.PORT) || 4180;
const HOST = '127.0.0.1';
const DEFAULT_DIR = process.env.INSURANCE_DATA_DIR || join(homedir(), 'Downloads/MillenniumMutual_Insurance_Data');
const MAX_UPLOAD = 30 * 1024 * 1024;
const ROOT_ALLOW = new Set(['platform.html', 'platform.js', 'platform_cases.js', 'platform_ext.js', 'platform_data.js', 'underwriting_model.js', 'presentation.html', 'quote_desk.html']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.map': 'application/json' };

mkdirSync(join(HERE, 'uploads'), { recursive: true });
mkdirSync(RUNS, { recursive: true });

// ---- state
let log = [];            // lines of most recent run
let running = false;
let lastRun = null;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const uploadActive = () => existsSync(join(UPLOADS, 'policies.csv')) && existsSync(join(UPLOADS, 'claims.csv'));
const uploadStatus = () => {
  const policies = existsSync(join(UPLOADS, 'policies.csv')), claims = existsSync(join(UPLOADS, 'claims.csv'));
  return { policies, claims, ready: policies && claims, active: policies && claims };
};
const dataDir = () => (uploadActive() ? UPLOADS : DEFAULT_DIR);

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function listJson(dir) {
  try { return readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch { return []; }
}

function buildState() {
  const signals = readJson(join(OUT, 'signals.json'));
  const decisions = readJson(join(OUT, 'decisions.json'));
  const evidence = {};
  const curatedFiles = [], live = [];
  const add = (issue, cards, source) => {
    (evidence[issue] ||= []).push(...(cards || []).map((c) => ({ ...c, source })));
  };
  for (const f of listJson(EVID)) {
    const j = readJson(join(EVID, f)); if (!j) continue;
    const base = f.replace(/\.json$/, '');
    const issue = (base === 'mtl-water' || base === 'peer-water') ? 'mtl-water' : base;
    const cards = Array.isArray(j) ? j : (j.cards || []);
    add(issue, cards, 'curated');
    curatedFiles.push({ issue: base, cards: cards.length, queries: j.queries || [] });
  }
  for (const f of listJson(LIVE)) {
    const j = readJson(join(LIVE, f)); if (!j) continue;
    const issue = f.replace(/\.json$/, '');
    const cards = Array.isArray(j) ? j : (j.cards || []);
    add(issue, cards, 'live-scrape');
    live.push({ issue, cards: cards.length, stats: j.stats || null });
  }
  const gen = decisions?.meta?.generated || signals?.meta?.generated || null;
  return {
    meta: {
      source: uploadActive() ? 'uploaded' : 'millennium',
      dataDir: dataDir(),
      generated: gen,
      asOf: decisions?.meta?.asOf || signals?.meta?.asOf || null,
    },
    signals, decisions, evidence,
    research: { curatedFiles, live, lastRun },
    log: log.slice(-300),
  };
}

// ---- run
function startRun(scrape, res) {
  const stream = !!res;
  const write = (o) => {
    if (!o.t) o = { t: new Date().toISOString(), ...o };
    log.push(o); if (log.length > 2000) log.shift();
    if (stream && !res.writableEnded) res.write(`data: ${JSON.stringify(o)}\n\n`);
  };
  if (stream) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders?.();
    res.socket?.setNoDelay?.(true);
  }
  if (running) {
    const busy = { t: new Date().toISOString(), step: 'run', level: 'error', done: true, ok: false, msg: 'a run is already in progress' };
    if (stream) { res.write(`data: ${JSON.stringify(busy)}\n\n`); res.end(); }
    return Promise.resolve();
  }
  running = true; log = [];
  const started = new Date().toISOString();
  const args = [join(HERE, 'run.mjs')];
  if (scrape) args.push('--scrape');
  if (uploadActive()) args.push('--data-dir', UPLOADS);
  return new Promise((done) => {
    let ok = false, finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      running = false;
      lastRun = { started, ended: new Date().toISOString(), scrape: !!scrape, ok, source: uploadActive() ? 'uploaded' : 'millennium' };
      try { writeFileSync(join(RUNS, `run-${started.replace(/[:.]/g, '-')}.jsonl`), log.map((l) => JSON.stringify(l)).join('\n') + '\n'); } catch {}
      if (stream && !res.writableEnded) res.end();
      done();
    };
    const child = spawn(process.execPath, args, { cwd: ROOT, env: process.env });
    if (stream) res.on('close', () => {}); // keep running even if client leaves
    let buf = '';
    const handle = (line) => {
      if (!line.trim()) return;
      let o; try { o = JSON.parse(line); } catch { o = { step: 'run', msg: line }; }
      if (!o || typeof o !== 'object') o = { step: 'run', msg: String(line) };
      if (o.step === 'run' && o.done) ok = !!o.ok;
      write(o);
    };
    child.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); } });
    child.stdout.on('end', () => { if (buf) handle(buf); buf = ''; });
    child.stderr.on('data', (d) => String(d).split('\n').forEach((l) => l.trim() && write({ step: 'run', level: 'warn', msg: l })));
    child.on('error', (e) => { write({ step: 'run', level: 'error', done: true, ok: false, msg: `spawn failed: ${e.message}` }); finish(); });
    child.on('close', (code) => {
      if (!log.some((l) => l.step === 'run' && l.done)) write({ step: 'run', done: true, ok: false, level: 'error', msg: `run exited with code ${code}` });
      finish();
    });
  });
}

// ---- upload
function readBody(req, limit) {
  return new Promise((resolveP, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(Object.assign(new Error('file too large (limit 30 MB)'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolveP(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleUpload(req, res, url) {
  const file = url.searchParams.get('file');
  if (file !== 'policies' && file !== 'claims') return sendJson(res, 400, { error: 'query ?file= must be policies or claims' });
  if (running) return sendJson(res, 409, { error: 'a run is in progress; try again when it finishes' });
  const body = await readBody(req, MAX_UPLOAD);
  let text = body.toString('utf8').replace(/^﻿/, '');
  const header = (text.split(/\r?\n/, 1)[0] || '').split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const need = file === 'policies' ? 'policy_id' : 'claim_id';
  if (!header.includes(need)) return sendJson(res, 400, { error: `invalid ${file}.csv: header row must contain "${need}"` });
  mkdirSync(UPLOADS, { recursive: true });
  writeFileSync(join(UPLOADS, `${file}.csv`), text);
  sendJson(res, 200, { ok: true, file, bytes: Buffer.byteLength(text), rows: Math.max(0, text.split(/\r?\n/).filter((l) => l.trim()).length - 1), ...uploadStatus() });
}

// ---- static
function serveFile(res, p, head) {
  try {
    const st = statSync(p);
    if (!st.isFile()) throw new Error('nf');
    const data = readFileSync(p);
    res.writeHead(200, { 'Content-Type': TYPES[extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': data.length });
    res.end(head ? undefined : data);
    return true;
  } catch { return false; }
}

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return sendJson(res, 400, { error: 'bad path' }); }
  if (rel.includes('\0')) return sendJson(res, 400, { error: 'bad path' });
  if (rel === '/' || rel === '') rel = '/index.html';
  const name = rel.replace(/^\/+/, '');
  const head = req.method === 'HEAD';
  const inSite = resolve(SITE, name);
  if ((inSite === SITE || inSite.startsWith(SITE + sep)) && serveFile(res, inSite, head)) return;
  if (ROOT_ALLOW.has(name) && serveFile(res, join(ROOT, name), head)) return;
  sendJson(res, 404, { error: 'not found' });
}

// ---- server
import { chat, engine as chatEngine } from './chat.mjs';
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || HOST}`);
    const p = url.pathname, m = req.method;
    if (p.startsWith('/api/')) {
      if (p === '/api/chat/engine' && m === 'GET') return sendJson(res, 200, { engine: chatEngine() });
      if (p === '/api/chat' && m === 'POST') { try { const b = JSON.parse((await readBody(req, 20000)).toString('utf8') || '{}'); return sendJson(res, 200, await chat(b)); } catch (e) { return sendJson(res, 400, { error: String(e.message || e) }); } }
      if (p === '/api/state' && m === 'GET') return sendJson(res, 200, buildState());
      if (p === '/api/log' && m === 'GET') return sendJson(res, 200, { running, log: log.slice(-300) });
      if (p === '/api/run' && m === 'POST') return void (await startRun(url.searchParams.get('scrape') === '1', res));
      if (p === '/api/upload' && m === 'POST') return await handleUpload(req, res, url);
      if (p === '/api/upload/status' && m === 'GET') return sendJson(res, 200, uploadStatus());
      if (p === '/api/reset' && m === 'POST') {
        if (running) return sendJson(res, 409, { error: 'a run is in progress' });
        rmSync(UPLOADS, { recursive: true, force: true });
        return sendJson(res, 200, { ok: true, source: 'millennium', dataDir: DEFAULT_DIR, ...uploadStatus() });
      }
      return sendJson(res, 404, { error: `no such endpoint: ${m} ${p}` });
    }
    if (m !== 'GET' && m !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
    serveStatic(req, res, p);
  } catch (e) {
    if (!res.headersSent) sendJson(res, e.status || 500, { error: e.message || 'server error' });
    else res.end();
  }
});

// bootstrap
if (!existsSync(join(OUT, 'decisions.json'))) {
  console.log('No decisions.json found; running pipeline once (no scrape)...');
  await startRun(false, null);
  console.log(lastRun?.ok ? 'Initial run complete.' : 'Initial run failed; see /api/log.');
}
server.listen(PORT, HOST, () => console.log(`BizOptimizer server: http://${HOST}:${PORT}/`));
