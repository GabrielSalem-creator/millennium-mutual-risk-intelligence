#!/usr/bin/env node
// Orchestrator: detect -> (research) -> decide
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const args = process.argv.slice(2);
const scrape = args.includes('--scrape');
const di = args.indexOf('--data-dir');
const dataDir = di >= 0 && args[di + 1] ? resolve(args[di + 1]) : (process.env.INSURANCE_DATA_DIR || join(homedir(), 'Downloads/MillenniumMutual_Insurance_Data'));
const out = (o) => process.stdout.write(JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n');
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1);

function finish(ok, msg) {
  out({ step: 'run', done: true, ok, msg: msg || (ok ? `DONE in ${secs()}s` : `FAILED after ${secs()}s`), ...(ok ? {} : { level: 'error' }) });
  process.exit(ok ? 0 : 1);
}

function runStep(step, file, extra = []) {
  return new Promise((res) => {
    const script = join(HERE, file);
    const cmd = `node pipeline/${file}` + (extra.length ? ' ' + extra.join(' ') : '');
    if (!existsSync(script)) {
      out({ step, cmd, level: 'warn', msg: `skipped: ${file} not found` });
      return res({ ok: true, skipped: true });
    }
    out({ step, cmd, msg: 'start' });
    const env = { ...process.env, INSURANCE_DATA_DIR: dataDir };
    const child = spawn(process.execPath, [script, ...extra], { cwd: ROOT, env });
    const pump = (stream, isErr) => {
      let buf = '';
      stream.on('data', (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).replace(/\r$/, ''); buf = buf.slice(i + 1);
          emit(line, isErr);
        }
      });
      stream.on('end', () => { if (buf.trim()) emit(buf, isErr); });
    };
    const emit = (line, isErr) => {
      if (!line.trim()) return;
      try { const j = JSON.parse(line); if (j && typeof j === 'object') { process.stdout.write(line + '\n'); return; } } catch {}
      out({ step, msg: line, ...(isErr ? { stream: 'stderr' } : {}) });
    };
    pump(child.stdout, false); pump(child.stderr, true);
    child.on('error', (e) => { out({ step, level: 'error', msg: `spawn failed: ${e.message}` }); res({ ok: false }); });
    child.on('close', (code) => {
      if (code === 0) { out({ stepDone: step }); res({ ok: true }); }
      else { out({ step, level: 'error', msg: `${file} exited with code ${code}` }); res({ ok: false }); }
    });
  });
}

const missing = ['policies.csv', 'claims.csv'].filter((f) => !existsSync(join(dataDir, f)));
if (missing.length) {
  out({ step: 'data', level: 'error', msg: `missing ${missing.join(', ')} in ${dataDir}` });
  finish(false);
}
out({ step: 'data', msg: `data source: ${dataDir} (policies.csv + claims.csv)` });

let ok = (await runStep('detect', 'detect.mjs')).ok;
if (ok && scrape) ok = (await runStep('research', 'research.mjs')).ok;
if (ok) ok = (await runStep('decide', 'decide.mjs')).ok;
finish(ok);
