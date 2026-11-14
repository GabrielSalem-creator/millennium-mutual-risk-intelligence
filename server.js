import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { analyzeInsuranceDataset } from './insurance_engine.js';

const PORT = Number(process.env.PORT || 4173);
const HOST = '127.0.0.1';
const PROJECT_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVER_KEY = process.env.SUPABASE_SECRET_KEY || '';
const INSURANCE_DATA_DIR = process.env.INSURANCE_DATA_DIR || '';
const PUBLIC_FILES = new Set(['index.html', 'styles.css', 'app.js', 'snapshot.js', 'insurance.html', 'insurance.js', 'insurance.css', 'underwriting.html', 'underwriting.js', 'underwriting.css', 'presentation.html', 'signals.html', 'signals.js', 'signals.css', 'signal.html', 'signal.js', 'signal.css']);

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${HOST}:${PORT}`);
  if (request.method !== 'GET') return send(response, 405, 'Method not allowed');

  if (url.pathname === '/api/analysis') {
    if (!PROJECT_URL || !SERVER_KEY) return sendJSON(response, 503, { error: 'Live analysis is not configured on the server.' });
    try {
      const report = await fetchAnalysis();
      return sendJSON(response, 200, report);
    } catch {
      return sendJSON(response, 502, { error: 'Could not read aggregate metrics from Supabase.' });
    }
  }

  if (url.pathname === '/api/insurance/analysis') {
    if (!INSURANCE_DATA_DIR) return sendJSON(response, 503, { error: 'Insurance dataset is not configured on this server.' });
    try {
      const report = await analyzeInsuranceDataset(INSURANCE_DATA_DIR);
      return sendJSON(response, 200, report);
    } catch (error) {
      console.error(`Insurance analysis failed: ${error.message}`);
      return sendJSON(response, 502, { error: 'Could not analyze the selected policies and claims files.' });
    }
  }

  if (url.pathname === '/api/insurance/experience') {
    if (!INSURANCE_DATA_DIR) return sendJSON(response, 503, { error: 'Insurance dataset is not configured on this server.' });
    try {
      const report = await analyzeExperience();
      return sendJSON(response, 200, report);
    } catch (error) {
      console.error(`Insurance experience analysis failed: ${error.message}`);
      return sendJSON(response, 502, { error: 'Could not estimate experience from the selected policies and claims files.' });
    }
  }

  const requested = url.pathname === '/' ? 'signals.html' : url.pathname === '/signals' ? 'signals.html' : url.pathname === '/signal' ? 'signal.html' : url.pathname === '/insurance' ? 'insurance.html' : url.pathname === '/underwriting' ? 'underwriting.html' : url.pathname === '/presentation' ? 'presentation.html' : decodeURIComponent(url.pathname.slice(1));
  if (!PUBLIC_FILES.has(requested)) return send(response, 404, 'Not found');
  try {
    const content = await readFile(resolve(process.cwd(), requested));
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    response.writeHead(200, { 'Content-Type': types[extname(requested)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    send(response, 404, 'Not found');
  }
});

async function analyzeExperience() {
  const { P, C } = await import('./analysis/data.mjs');
  const cities = ['Montreal', 'Toronto', 'Calgary', 'Ottawa', 'Quebec City'];
  const products = ['Home', 'Auto'];
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
  const segments = [];
  for (const city of cities) for (const product of products) {
    const policies = P.filter((policy) => policy.city2 === city && policy.policy_type === product && policy.broker_code !== 'B07');
    if (!policies.length) continue;
    const ids = new Set(policies.map((policy) => policy.policy_id));
    const claims = C.filter((claim) => ids.has(claim.policy_id));
    const exposure = sum(policies.map((policy) => policy.exp));
    const earned = sum(policies.map((policy) => policy.earned));
    const incurred = sum(claims.map((claim) => claim.inc));
    const frequency = exposure ? claims.length / exposure : 0;
    const severity = claims.length ? incurred / claims.length : 0;
    const sevVariance = claims.length ? sum(claims.map((claim) => (claim.inc - severity) ** 2)) / claims.length : 0;
    const lossCost = exposure ? incurred / exposure : 0;
    const premium = exposure ? earned / exposure : 0;
    const perils = [...new Set(claims.map((claim) => claim.claim_type))].map((peril) => {
      const group = claims.filter((claim) => claim.claim_type === peril);
      const amount = sum(group.map((claim) => claim.inc));
      return { peril, claims: group.length, frequencyPerExposureYear: round(exposure ? group.length / exposure : 0), incurredProxy: round(amount, 2), expectedClaimCostPerExposureYear: round(exposure ? amount / exposure : 0, 2) };
    }).sort((a, b) => b.expectedClaimCostPerExposureYear - a.expectedClaimCostPerExposureYear);
    segments.push({ city, product, policyRows: policies.length, exposureYears: round(exposure, 2), claims: claims.length, earnedPremiumProxy: round(earned, 2), incurredProxy: round(incurred, 2), claimFrequencyPerExposureYear: round(frequency), meanIncurredSeverityProxy: round(severity, 2), expectedClaimCostPerExposureYear: round(lossCost, 2), earnedPremiumPerExposureYear: round(premium, 2), lossRatioProxy: round(earned ? incurred / earned : 0), contributionBeforeExpensesPerExposureYear: round(premium - lossCost, 2), compoundPoissonVariancePerExposureYear: round(frequency * (sevVariance + severity ** 2), 2), perils });
  }
  return {
    asOf: '2026-10-31',
    scope: 'City × product experience; B07 excluded to keep city comparisons from being driven by the separate broker anomaly.',
    method: 'Policy exposure is estimated from policy start to 2026-10-31 with a 12-month maximum; cancelled policies are treated as fully exposed. Earned premium = annual premium × estimated exposure. Incurred is a proxy: paid claims use paid amount, denied claims use zero, open claims use the same-peril paid-to-reported ratio.',
    limits: ['No policy end dates or verified exposure.', 'No case reserve development, IBNR, LAE, operating costs, reinsurance or investment income.', 'Currency is unspecified.', 'Compound Poisson variance assumes comparable independent exposure; storms and clustered losses can violate this.', 'This is an in-sample historical screening estimate, not a forecast, approved rate, or actual profit.'],
    segments,
  };
}

async function supabaseRows(table, query) {
  const url = new URL(`${PROJECT_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const result = await fetch(url, {
    headers: {
      apikey: SERVER_KEY,
      Authorization: `Bearer ${SERVER_KEY}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error(`Supabase request failed (${result.status})`);
  return result.json();
}

async function fetchAnalysis() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const through = new Date(today.getTime() - 86400000);
  const from = new Date(through.getTime() - 6 * 86400000);
  const nextDay = new Date(through.getTime() + 86400000);
  const fromDate = from.toISOString().slice(0, 10);
  const throughDate = through.toISOString().slice(0, 10);

  // Restrict fields: never fetch prompts, user IDs, URLs, payment information or error text.
  const [metrics, videos, events] = await Promise.all([
    supabaseRows('daily_metrics', {
      select: 'metric_date,metric_name,metric_value',
      metric_date: `gte.${fromDate}`,
      order: 'metric_date.asc',
      limit: '2000',
    }),
    supabaseRows('videos', {
      select: 'created_at,provider,model_id,status',
      created_at: `gte.${fromDate}T00:00:00Z`,
      order: 'created_at.asc',
      limit: '5000',
    }),
    supabaseRows('events', {
      select: 'event_name,session_id,created_at',
      created_at: `gte.${fromDate}T00:00:00Z`,
      order: 'created_at.asc',
      limit: '10000',
    }),
  ]);
  const scopedMetrics = metrics.filter((row) => row.metric_date <= throughDate);
  const scopedVideos = videos.filter((row) => row.created_at < nextDay.toISOString());
  const metricTotals = sumMetrics(scopedMetrics);
  const videoTotals = countStatuses(scopedVideos);
  const candidate = detectSpike(scopedVideos, fromDate, throughDate);
  const scopedEvents = events.filter((row) => row.created_at < nextDay.toISOString());
  const behavior = analyzeEventSequences(scopedEvents);

  const finding = candidate ? {
    title: `${candidate.model} failures spiked on ${candidate.dayLabel}.`,
    sentence: `${candidate.provider} / ${candidate.model} failed ${candidate.failed} of ${candidate.total} recorded runs (${percent(candidate.rate)}). Across ${candidate.baselineDays} later days on the same route, it failed ${candidate.baselineFailed} of ${candidate.baselineTotal} (${percent(candidate.baselineRate)}): ${candidate.ratio.toFixed(1)}× the later rate, a ${percentPoint(candidate.rate - candidate.baselineRate)} difference.`,
    caveat: candidate.previousProvider ? `The spike coincided with the provider label changing from ${candidate.previousProvider} the prior day. This is descriptive; it does not establish the cause. The rate returned lower in subsequent days.` : 'This is descriptive; it does not establish the cause. Check incident and routing logs before changing the product.',
    references: [
      `videos · ${candidate.day} · provider=${candidate.provider} · model=${candidate.model} · ${candidate.failed} failed / ${candidate.total} rows`,
      `videos · after ${candidate.day} through ${throughDate} · same route · ${candidate.baselineFailed} failed / ${candidate.baselineTotal} rows`,
      ...(candidate.previousProvider ? [`videos · prior day · same model · provider=${candidate.previousProvider}`] : []),
    ],
  } : {
    title: 'No standout provider/model failure spike in this window.',
    sentence: `No provider/model day with at least 20 runs exceeded its same-route comparison rate by 20 percentage points during ${fromDate}–${throughDate}.`,
    caveat: 'This only checks grouped completion status. It does not explain user behavior or identify performance issues hidden by incomplete instrumentation.',
    references: [`videos · created_at, provider, model_id, status · ${fromDate}–${throughDate} · ${scopedVideos.length} rows grouped`],
  };

  return {
    source: 'Supabase · public.videos + public.daily_metrics',
    retrieved_at: new Date().toISOString().slice(0, 10),
    window: { from: fromDate, through: throughDate },
    finding,
    decision: candidate ? {
      title: `Review the ${candidate.dayLabel} route change; keep today’s route unless the spike returns.`,
      sentence: `Compare provider health, routing/config changes, and error classes for ${candidate.day} against the later period. If the failure rate rises again, run a controlled fallback test and compare completion rate and credits refunded before switching traffic.`,
      measure: 'Failure rate · completion rate · refunded credits',
    } : {
      title: 'Keep the current route; continue watching completion and refund rates.',
      sentence: 'No grouped failure spike cleared the minimum-volume and difference thresholds. Re-check when the next complete week of data is available.',
      measure: 'Failure rate · completion rate · refunded credits',
    },
    metric_reconciliation: {
      daily_metrics: metricTotals,
      videos_rows: videoTotals,
      note: `For ${fromDate}–${throughDate}, daily_metrics and videos table totals differ by ${Math.abs(metricTotals.started - videoTotals.total)} starts, ${Math.abs(metricTotals.completed - videoTotals.completed)} completions, and ${Math.abs(metricTotals.failed - videoTotals.failed)} failures. Confirm retry/tracking definitions before treating these as one funnel.`,
    },
    behavior,
  };
}

function analyzeEventSequences(rows) {
  const bySession = new Map();
  for (const row of rows) {
    if (!row.session_id || !row.event_name) continue;
    const list = bySession.get(row.session_id) || [];
    list.push(row);
    bySession.set(row.session_id, list);
  }
  const transitions = new Map();
  for (const list of bySession.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (let i = 1; i < list.length; i += 1) {
      const key = `${list[i - 1].event_name}\t${list[i].event_name}`;
      transitions.set(key, (transitions.get(key) || 0) + 1);
    }
  }
  const count = (from, to) => transitions.get(`${from}\t${to}`) || 0;
  return {
    event_rows: rows.length,
    sessions: bySession.size,
    transitions: {
      fail_then_start: count('video_generate_fail', 'video_generate_start'),
      complete_then_start: count('video_generate_complete', 'video_generate_start'),
    },
    missing: ['pricing plan exposure', 'plan selection', 'credit balance', 'paywall view/dismiss', 'checkout/purchase outcome'],
  };
}

function sumMetrics(rows) {
  const totals = { started: 0, completed: 0, failed: 0 };
  const names = { videos_started: 'started', videos_completed: 'completed', videos_failed: 'failed' };
  for (const row of rows) {
    const key = names[row.metric_name];
    if (key && Number.isFinite(Number(row.metric_value))) totals[key] += Number(row.metric_value);
  }
  return totals;
}

function countStatuses(rows) {
  const result = { total: rows.length, completed: 0, failed: 0 };
  for (const row of rows) {
    if (String(row.status).toLowerCase() === 'completed') result.completed += 1;
    if (String(row.status).toLowerCase() === 'failed') result.failed += 1;
  }
  return result;
}

function detectSpike(rows, fromDate, throughDate) {
  const groups = new Map();
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    const provider = String(row.provider || 'unknown');
    const model = String(row.model_id || 'unknown');
    const key = `${day}\t${provider}\t${model}`;
    const group = groups.get(key) || { day, provider, model, total: 0, failed: 0 };
    group.total += 1;
    group.failed += Number(String(row.status).toLowerCase() === 'failed');
    groups.set(key, group);
  }
  const candidates = [];
  for (const group of groups.values()) {
    if (group.total < 20 || !group.failed) continue;
    const later = [...groups.values()].filter((item) => item.provider === group.provider && item.model === group.model && item.day > group.day);
    const baselineTotal = later.reduce((sum, item) => sum + item.total, 0);
    const baselineFailed = later.reduce((sum, item) => sum + item.failed, 0);
    if (baselineTotal < 20) continue;
    const rate = group.failed / group.total;
    const baselineRate = baselineFailed / baselineTotal;
    if (rate - baselineRate < 0.2) continue;
    const previousDay = new Date(`${group.day}T00:00:00Z`);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    const previousDate = previousDay.toISOString().slice(0, 10);
    const previousProvider = [...groups.values()].find((item) => item.day === previousDate && item.model === group.model && item.provider !== group.provider && item.total >= 5)?.provider || null;
    candidates.push({
      ...group, rate, baselineTotal, baselineFailed, baselineRate,
      baselineDays: new Set(later.map((item) => item.day)).size,
      ratio: baselineRate > 0 ? rate / baselineRate : Infinity,
      previousProvider,
      dayLabel: new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${group.day}T12:00:00Z`)),
    });
  }
  candidates.sort((a, b) => (b.rate - b.baselineRate) - (a.rate - a.baselineRate));
  return candidates[0] || null;
}

function percent(value) { return `${(value * 100).toFixed(1)}%`; }
function percentPoint(value) { return `${(value * 100).toFixed(1)} percentage points`; }
function send(response, code, text) {
  response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(text);
}
function sendJSON(response, code, data) {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(data));
}

server.listen(PORT, HOST, () => console.log(`VDO-X running at http://${HOST}:${PORT}`));
