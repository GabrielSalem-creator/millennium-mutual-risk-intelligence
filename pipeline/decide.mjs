// DECIDE + ACT: tests each hypothesis against the data, rules causes in or out, turns the result into a decision
// (what / where / when / how / why), scores each stakeholder's claim, and FIRES automations.
// Run after detect.mjs:  node pipeline/decide.mjs   -> pipeline/out/decisions.json, actions.json, actions.log.jsonl
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { P, C, sum, mean, ASOF } from '../analysis/data.mjs';

const OUT = new URL('./out/', import.meta.url), EV = new URL('./evidence/', import.meta.url);
const SIG = JSON.parse(readFileSync(new URL('signals.json', OUT), 'utf8'));
const log = (m) => console.log(JSON.stringify({ t: new Date().toISOString(), step: 'decide', msg: m }));
const f = (x, d = 2) => (Number.isFinite(x) ? +x.toFixed(d) : null);
const med = (xs) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const money = (x) => (x < 0 ? '-' : '') + '$' + Math.abs(Math.round(x)).toLocaleString('en-CA');
const pctS = (x, d = 0) => (x * 100).toFixed(d) + '%';
const A = { expense: 0.30, lae: 0.14, margin: 0.05 }; // sourced defaults, same as the platform (Definity 2025 expense ratio; MSA LAE 8–11 pts)
const claimsOf = (ps) => ps.flatMap((p) => p.cl), T10 = 10000;
const expOf = (ps) => sum(ps.map((p) => p.exp)), earnedOf = (ps) => sum(ps.map((p) => p.earned)), incOf = (cs) => sum(cs.map((c) => c.inc));
const lrOf = (ps) => incOf(claimsOf(ps)) / earnedOf(ps), freqOf = (ps, fn = () => true) => claimsOf(ps).filter(fn).length / expOf(ps);
const rr = (a, ea, b, eb) => { if (!a || !b) return { ratio: a && !b ? Infinity : 0, lo: 0, hi: Infinity }; const r = a / ea / (b / eb), se = Math.sqrt(1 / a + 1 / b); return { ratio: r, lo: Math.exp(Math.log(r) - 1.96 * se), hi: Math.exp(Math.log(r) + 1.96 * se) }; };
const closeDays = (cs) => cs.filter((c) => c.closed).map((c) => (c.closed - c.rep) / 864e5);
const nonB = P.filter((p) => p.broker_code !== 'B07'), homeNB = nonB.filter((p) => p.policy_type === 'Home');
const sigOf = (detector) => SIG.signals.find((s) => s.detector === detector);

// ------------------------------------------------------------ evidence loading (research agents + live scraper cache)
const EVMAP = { 'mtl-water': ['mtl-water', 'peer-water'], 'b07-fraud': ['b07-fraud'], 'senior-review': ['senior-review'], 'claim-wait-retention': ['claim-wait-retention'], 'home-pricing': ['home-pricing'], 'broker-channel': ['broker-channel'], 'severe-claims': ['severe-claims'], 'bundle-opportunity': [], 'data-quality': [] };
function evidenceFor(issue) {
  const cards = []; const files = [...(EVMAP[issue] || [])];
  for (const name of files) { const u = new URL(name + '.json', EV); if (existsSync(u)) { try { const j = JSON.parse(readFileSync(u, 'utf8')); for (const c of j.cards || []) cards.push({ ...c, source: 'curated' }); } catch { /* skip bad file */ } } }
  const live = new URL('./live/' + issue + '.json', import.meta.url); if (existsSync(live)) { try { for (const c of JSON.parse(readFileSync(live, 'utf8')).cards || []) cards.push({ ...c, source: 'live-scrape' }); } catch { /* skip */ } }
  return cards;
}

// ------------------------------------------------------------ deduction helpers
const test = (name, result, verdict, numbers) => ({ test: name, result, verdict, numbers: numbers || null }); // verdict: confirmed | ruled-out | open | caution

// ===== mtl-water
function mtlWater() {
  const mtl = homeNB.filter((p) => p.city2 === 'Montreal'), tor = homeNB.filter((p) => p.city2 === 'Toronto'), qc = homeNB.filter((p) => p.city2 === 'Quebec City');
  const isW = (c) => c.claim_type === 'Water Damage';
  const wr = (a, b) => rr(claimsOf(a).filter(isW).length, expOf(a), claimsOf(b).filter(isW).length, expOf(b));
  const slice = (keyf, vals) => vals.map((v) => { const r = wr(mtl.filter((p) => keyf(p) === v), tor.filter((p) => keyf(p) === v)); return { slice: v, ratio: f(r.ratio, 1) }; });
  const bands = slice((p) => p.risk_band, ['Low', 'Medium', 'High']), chans = slice((p) => p.channel, ['Agent', 'Broker', 'Online']), deds = slice((p) => '$' + p.ded, ['$500', '$1000', '$2500']);
  const coh = slice((p) => p.start.getUTCFullYear() + 'H' + (p.start.getUTCMonth() < 6 ? 1 : 2), ['2025H1', '2025H2', '2026H1']);
  const minRatio = (arr) => Math.min(...arr.map((x) => x.ratio));
  const day = {}; for (const c of claimsOf(mtl).filter(isW)) { const k = c.loss.toISOString().slice(0, 10); day[k] = (day[k] || 0) + 1; }
  const maxDay = Math.max(...Object.values(day)), w = claimsOf(mtl).filter(isW), wt = claimsOf(tor).filter(isW);
  const fMtl = w.length / expOf(mtl), fTor = wt.length / expOf(tor), fQc = claimsOf(qc).filter(isW).length / expOf(qc);
  const sevRatio = mean(w.map((c) => c.inc)) / mean(wt.map((c) => c.inc));
  const oth = rr(claimsOf(mtl).filter((c) => !isW(c)).length, expOf(mtl), claimsOf(tor).filter((c) => !isW(c)).length, expOf(tor));
  const spring = w.filter((c) => [2, 3, 4].includes(c.loss.getUTCMonth())).length / w.length;
  const prem = sum(mtl.map((p) => p.earned)) / expOf(mtl), cost = incOf(claimsOf(mtl)) / expOf(mtl), costL = cost * (1 + A.lae);
  const torPrem = sum(tor.map((p) => p.earned)) / expOf(tor);
  const indicated = costL / (1 - A.expense), target = costL / (1 - A.expense - A.margin);
  const marketRel = 2868 / 2412, ourRel = prem / torPrem, step = marketRel / ourRel - 1; // PolicyMe Sep/Jun 2026 relativity, Montréal vs Toronto
  const lrNow = costL / (prem * (1 - A.expense) + 0) * (1 - A.expense) ; // combined ratio style: (loss+LAE)/premium
  const crNow = (costL / prem) + A.expense, crAfter = (costL / (prem * (1 + step))) + A.expense;
  const bandRows = ['Low', 'Medium', 'High'].map((b) => { const ps = mtl.filter((p) => p.risk_band === b), pr = sum(ps.map((p) => p.earned)) / expOf(ps), ct = incOf(claimsOf(ps)) / expOf(ps) * (1 + A.lae); return { band: b, policies: ps.length, avgPremium: f(pr, 0), costPerYear: f(ct, 0), indicatedPremium: f(ct / (1 - A.expense), 0), indicatedChange: f(ct / (1 - A.expense) / pr - 1, 2) }; });
  const why = [
    test('Is it just risk-band mix?', `Montréal/Toronto water ratio in every band: Low ×${bands[0].ratio}, Medium ×${bands[1].ratio}, High ×${bands[2].ratio}`, minRatio(bands) > 1.5 ? 'ruled-out' : 'open', bands),
    test('Is it one sales channel?', `Ratio by channel: Agent ×${chans[0].ratio}, Broker ×${chans[1].ratio}, Online ×${chans[2].ratio}`, minRatio(chans) > 1.5 ? 'ruled-out' : 'open', chans),
    test('Is it the deductible mix?', `Ratio by deductible: $500 ×${deds[0].ratio}, $1000 ×${deds[1].ratio}, $2500 ×${deds[2].ratio}`, minRatio(deds) > 1.5 ? 'ruled-out' : 'open', deds),
    test('Is it one old cohort or one storm?', `Cohort ratios ${coh.map((c) => c.slice + ' ×' + c.ratio).join(', ')}; the most water claims on any single Montréal day is ${maxDay}`, maxDay <= 3 && minRatio(coh) > 1.5 ? 'ruled-out' : 'open', { maxClaimsOneDay: maxDay, cohorts: coh }),
    test('Is it "Quebec" (province rules, Team C coding)?', `Québec City, same province and same adjuster team, has ${f(fQc, 3)} water claims per policy-year versus ${f(fMtl, 3)} in Montréal`, fQc < fMtl * 0.5 ? 'ruled-out' : 'open', { montreal: f(fMtl, 3), quebecCity: f(fQc, 3) }),
    test('Is it bigger claims rather than more claims?', `Cost per water claim Montréal ÷ Toronto = ×${f(sevRatio, 2)}`, sevRatio < 1.25 && sevRatio > 0.75 ? 'ruled-out' : 'open', { severityRatio: f(sevRatio, 2) }),
    test('Is Montréal simply a worse city for every peril?', `Non-water Home claims Montréal/Toronto = ×${f(oth.ratio, 2)} (95% CI ${f(oth.lo, 2)}–${f(oth.hi, 2)}); Montréal Auto loss ratio is ${f(lrOf(P.filter((p) => p.city2 === 'Montreal' && p.policy_type === 'Auto')), 2)}`, oth.lo < 1.2 ? 'ruled-out' : 'open', { nonWaterRatio: f(oth.ratio, 2) }),
    test('Does it have a seasonal signature?', `${pctS(spring)} of Montréal water claims fall in March–May (a flat year would be 25%)`, spring > 0.35 ? 'confirmed' : 'open', { springShare: f(spring, 2) }),
    test('Which building or sewer feature is the cause?', 'Needs postal code, building age and plumbing data, which the files do not contain', 'open', null),
  ];
  return { id: 'mtl-water', title: 'Montréal Home water damage is a structural, unpriced frequency problem', severity: 'critical', owner: 'CFO + Chief Actuary',
    oneLiner: `Home water claims are ${f(fMtl / fTor, 1)}× Toronto's per policy-year and the price does not reflect it (Montréal avg ${money(prem)} vs Toronto ${money(torPrem)}).`,
    conclusion: 'The excess is water-only, seasonal, present in every segment and absent in Québec City, so it points to Montréal-specific building stock and sewer exposure that our rating ignores. The files cannot name the exact mechanism; the evidence suggests old plexes, basements and combined-sewer overload.',
    why, impactUSD: SIG.signals.find((s) => s.detector === 'peer-city rate ratio')?.impactUSD,
    numbers: { montrealHomePremiumPerYear: f(prem, 0), montrealHomeCostPerYearWithLAE: f(costL, 0), indicatedBreakEvenPremium: f(indicated, 0), targetMarginPremium: f(target, 0), marketRelativityMontrealVsToronto: f(marketRel, 2), ourRelativityMontrealVsToronto: f(ourRel, 2), marketParityStep: f(step, 2), combinedRatioNow: f(crNow, 2), combinedRatioAfterStep: f(crAfter, 2), byBand: bandRows },
    decision: { what: `Add a Montréal water-territory factor to Home rating. Step 1: +${pctS(step)} (moves our Montréal/Toronto price relativity from ${f(ourRel, 2)} to the market's ${f(marketRel, 2)}; PolicyMe 2026 quotes: Montréal $2,868 vs Toronto $2,412, one house profile). Step 2: require or credit a backwater valve and shut-off device, and raise the water deductible. Hold new Montréal Home business from brokers until the factor is live.`, where: 'Home · Montréal island (no postal data yet; refine by postal area once collected)', when: 'File before the next renewal cycle; run the valve/inspection outreach in February, before the March–May peak; re-measure after spring 2027', how: `Actuarial: re-fit water frequency with a Montréal factor (indicated break-even premium ${money(indicated)} vs ${money(prem)} today, ${pctS(indicated / prem - 1)}), phase to market parity first because customers can shop (Ratehub: 57% switched after a price rise). Underwriting: add backwater valve, sump pump and building-age questions at quote.`, why: `At today's price a Montréal Home policy loses about ${money(costL + prem * A.expense - prem)} a year after expenses; the parity step moves the combined ratio from ${f(crNow, 2)} to ${f(crAfter, 2)} but does not fully close it, which is why mitigation and exposure control must come with it.`, expected: `Combined ratio ${f(crNow, 2)} → ${f(crAfter, 2)} from price alone; the remaining gap is the mitigation and underwriting target`, confidence: 'High that the problem is real and unpriced; medium on the size of the right rate (no property data, regulatory filing needed)', risks: ['Customer shopping after a +35% increase', 'Regulatory review of a territory factor', 'Peer-city events (Toronto 2024, Ottawa 2026) show water is not unique to Montréal'], ifWrong: 'If the Montréal gap shrinks after property data is added, keep the factor only for the segments where the excess persists' },
    automationIds: ['R4'] };
}

// ===== b07-fraud
function b07() {
  const B = P.filter((p) => p.broker_code === 'B07'), cs = claimsOf(B), others = P.filter((p) => p.broker_code !== 'B07'), oc = claimsOf(others);
  const theft = cs.filter((c) => c.claim_type === 'Theft'), sig = sigOf('early-claim + threshold-structuring'), ev = sig?.evidence || {};
  const near = (c) => c.amt >= 8000 && c.amt < T10, bookNear = oc.filter(near).length / oc.length;
  const torNonB = nonB.filter((p) => p.city2 === 'Toronto'), tTheft = claimsOf(torNonB).filter((c) => c.claim_type === 'Theft').length / expOf(torNonB), bookTheft = claimsOf(nonB).filter((c) => c.claim_type === 'Theft').length / expOf(nonB);
  const brokerStats = SIG.tables.brokers.filter((b) => b.broker !== 'B07'), maxEarlyOther = Math.max(...brokerStats.map((b) => +b.earlyShare)), maxNearOther = Math.max(...brokerStats.map((b) => +b.nearThresholdShare));
  const denyBook = oc.filter((c) => c.status === 'Denied').length / oc.length, pZeroDeny = Math.pow(1 - denyBook, cs.length);
  const teamShare = cs.filter((c) => c.adjuster_team === 'Team A').length / cs.length;
  const why = [
    test('Is it Toronto-wide theft rather than one broker?', `Toronto theft outside B07 is ${f(tTheft, 3)} per policy-year, the same as the book (${f(bookTheft, 3)}); B07 runs ${f(theft.length / expOf(B), 2)}`, Math.abs(tTheft / bookTheft - 1) < 0.4 ? 'ruled-out' : 'open', { tor: f(tTheft, 3), book: f(bookTheft, 3) }),
    test('Is it the timing of claims?', `Median ${f(med(cs.map((c) => c.dayIn)), 0)} days from policy start to loss versus ${f(med(oc.map((c) => c.dayIn)), 0)} for every other broker and channel; ${pctS(+ev.earlyShare || 0)} of its claims fall within 45 days (others ${pctS(+ev.bookEarlyShare || 0)})`, 'confirmed', { median: med(cs.map((c) => c.dayIn)) }),
    test('Are claim amounts shaped around the review line?', `${pctS(cs.filter(near).length / cs.length)} of B07 claims are $8,000–$9,999 versus ${pctS(bookNear)} elsewhere, just under the $10,000 senior-review trigger`, 'confirmed', { b07: f(cs.filter(near).length / cs.length, 2), book: f(bookNear, 2) }),
    test('Are claims scrutinised normally?', `${cs.filter((c) => c.status === 'Denied').length} of ${cs.length} B07 claims were denied versus ${pctS(denyBook, 1)} elsewhere (chance of zero denials ≈ ${pctS(pZeroDeny, 1)}), and ${pctS(teamShare)} went to Team A`, 'caution', { pZeroDenials: f(pZeroDeny, 3) }),
    test('Is every broker like this?', `No other broker exceeds ${pctS(maxEarlyOther)} early-claim share or ${pctS(maxNearOther)} near-threshold share`, 'ruled-out', { maxEarlyOther, maxNearOther }),
    test('Is it a data error?', `All ${B.length} B07 policies start in 2026 and pass the same cleaning as the rest; the pattern survives removing duplicates and re-parsing dates`, 'ruled-out', null),
    test('Is it fraud or adverse selection?', 'The data cannot separate organised fraud from a poorly screened book; both call for the same first action (hold and review)', 'open', null),
  ];
  const excess = sig?.impactUSD || 0;
  return { id: 'b07-fraud', title: 'Broker B07 writes business that claims immediately and just under the review threshold', severity: 'critical', owner: 'Head of Distribution + Special Investigations (SIU)',
    oneLiner: `${theft.length} theft claims where about ${ev.expectedTheft} were expected; loss ratio ${SIG.tables.brokers.find((b) => b.broker === 'B07').lossRatio}; ${pctS(cs.filter(near).length / cs.length)} of its claims sit just under $10,000.`,
    conclusion: 'B07 explains the entire 2026 deterioration ("more business, less money"). The pattern (early theft claims, amounts just below senior review, no denials) is consistent with organised early-claim fraud or severe adverse selection. It needs investigation, not a verdict.',
    why, impactUSD: excess, numbers: { policies: B.length, claims: cs.length, theftClaims: theft.length, earnedPremium: ev.earnedPremium, incurred: ev.incurred, excessCostObserved: excess, bookLossRatio: SIG.meta.bookLossRatio, bookLossRatioWithoutB07: f(lrOf(others), 2) },
    decision: { what: 'Place B07 on hold (stop new binding and renewals), freeze payment of unpaid B07 claims pending review, and open an SIU file on its policies and its 70 claims.', where: `Broker B07 (${B.length} policies; Toronto ${B.filter((p) => p.city2 === 'Toronto').length}, Ottawa ${B.filter((p) => p.city2 === 'Ottawa').length}, Montréal ${B.filter((p) => p.city2 === 'Montreal').length}, other ${B.filter((p) => !['Toronto', 'Ottawa', 'Montreal'].includes(p.city2)).length})`, when: 'Hold today; SIU triage of the near-threshold claims within 30 days; review commission clawback under the broker contract', how: 'Distribution suspends binding authority; Claims routes any B07 claim to senior review regardless of amount; SIU samples applications for ghost-brokering, identity and address mismatches; add the same early-claim and near-threshold monitors for every broker (see automation R1 and R2).', why: `The book excluding B07 runs a ${f(lrOf(others), 2)} loss ratio; with B07 it is ${SIG.meta.bookLossRatio}. Fixing one broker recovers about ${money(excess)} of observed excess cost without slowing the other nine brokers.`, expected: `Book loss ratio ${SIG.meta.bookLossRatio} → ${f(lrOf(others), 2)}; about ${money(excess)} of observed excess cost stops accruing`, confidence: 'High that the pattern is abnormal (probability under chance < 1e-12); medium on the cause', risks: ['Wrongly penalising honest B07 customers', 'Relationship damage with the partner', 'Fraudsters move to another broker'], ifWrong: 'The hold is reversible: if SIU clears the claims, release payments, reinstate the broker and keep the monitors' },
    automationIds: ['R1', 'R2'] };
}

// ===== senior-review
function seniorReview() {
  const big = C.filter((c) => c.amt >= T10), small = C.filter((c) => c.amt < T10), cdB = closeDays(big), cdS = closeDays(small);
  const teams = SIG.tables.teams, tC = teams.find((t) => t.team === 'Team C'), others = teams.filter((t) => t.team !== 'Team C');
  const water = big.filter((c) => c.claim_type === 'Water Damage').length;
  const bins = SIG.tables.bins;
  const claimant = P.filter((p) => ['Renewed', 'Not Renewed'].includes(p.renewal_status) && p.cl.some((c) => c.closed)); const wait = (p) => Math.max(...p.cl.filter((c) => c.closed).map((c) => (c.closed - c.rep) / 864e5));
  const slow = claimant.filter((p) => wait(p) > 20), fast = claimant.filter((p) => wait(p) <= 20), nr = (ps) => ps.filter((p) => p.renewal_status === 'Not Renewed').length / ps.length;
  const slowBig = slow.filter((p) => p.cl.some((c) => c.amt >= T10)).length, avgPrem = mean(claimant.filter((p) => p.prem > 0).map((p) => p.prem));
  const saved = 0.5 * slow.length * (nr(slow) - nr(fast)) * avgPrem; // if half of slow claims were brought under 20 days
  const inflight = (t) => f(t.monthlyIntakeLast3.reduce((a, b) => a + b, 0) / 3 * t.medianClose / 30, 1), inflightBefore = f(+tC.monthlyIntakeBefore * tC.medianClose / 30, 1);
  const why = [
    test('Are large claims slower because of the $10,000 review?', `Median ${f(med(cdB), 0)} days at $10,000+ versus ${f(med(cdS), 0)} days below; the jump is the same in all three teams (A ${others[0].medianCloseOver10k}, B ${others[1].medianCloseOver10k}, C ${tC.medianCloseOver10k})`, 'confirmed', { big: med(cdB), small: med(cdS) }),
    test('Is it only Team C being slow?', `Team C is also slower on small claims (${tC.medianCloseUnder10k} days vs ${others.map((t) => t.medianCloseUnder10k).join('/')}), so it is a capacity problem on top of the threshold`, 'confirmed', { teamCsmall: tC.medianCloseUnder10k }),
    test('Is Team C really overloaded?', `Monthly intake ${tC.monthlyIntakeLast3.join(', ')} over the last 3 months vs ${tC.monthlyIntakeBefore} before (×${tC.surge}); claims in progress ≈ ${inflight(tC)} vs ${inflightBefore} before. Teams A and B are at ×${others[0].surge} and ×${others[1].surge}`, +tC.surge > 1.8 ? 'confirmed' : 'open', { surge: tC.surge }),
    test('What fills the senior-review queue?', `${water} of the ${big.length} large claims (${pctS(water / big.length)}) are Water Damage, the Montréal peril; Team C reviews ${tC.over10k} of ${big.length}`, 'confirmed', { water, total: big.length }),
    test('Does the threshold distort behaviour?', `Claims at $9–10k: ${bins[3].all} (${bins[3].withoutFlagged} without the flagged broker) vs $10–11k: ${bins[4].all} (${bins[4].withoutFlagged}); a small bunching remains after removing B07`, bins[3].withoutFlagged > 1.4 * bins[4].withoutFlagged ? 'caution' : 'open', bins),
    test('Does waiting cost renewals?', `Slow-claim customers (> 20 days, ${slow.length}) did not renew ${pctS(nr(slow))} vs ${pctS(nr(fast))} (${fast.length}); ${slowBig} of the slow ones had a large claim`, 'confirmed', { nrSlow: f(nr(slow), 3), nrFast: f(nr(fast), 3) }),
  ];
  return { id: 'senior-review', title: 'The $10,000 senior-review step and a Team C surge create the waiting', severity: 'high', owner: 'VP Claims',
    oneLiner: `Claims ≥ $10,000 take ${f(med(cdB), 0)} days (vs ${f(med(cdS), 0)}); Team C intake is ${tC.surge}× its earlier pace and holds ${tC.open} of ${sum(teams.map((t) => t.open))} open claims.`,
    conclusion: 'The VP of Claims is partly right: Team C is overloaded, but adding adjusters alone will not fix the largest delays, which come from the approval step on large Water Damage claims. Process and authority design is the faster lever, with temporary capacity for Team C during the March–May and October peaks.',
    why, impactUSD: null, numbers: { bigClaims: big.length, bigClaimShareOfDollars: SIG.signals.find((s) => s.kind === 'league-table' && s.issue === 'severe-claims')?.metric.value, medianCloseBig: med(cdB), medianCloseSmall: med(cdS), teamC: tC, claimsInProgressNow: inflight(tC), claimsInProgressBefore: inflightBefore, renewalPremiumProtectedIfHalfSlowFixed: f(saved, 0) },
    decision: { what: 'Create a fast-track lane for Water Damage claims between $10,000 and about $25,000 (documented, photo and contractor estimate, not from a flagged source) with team-lead approval inside 5 business days; keep full senior review above that. Add temporary adjuster capacity to Team C for March–May and October. Set a 20-day claim target with automatic ageing alerts.', where: 'Claims: Team C (Montréal + Québec City) first; fast-track rule for all teams', when: 'Staff Team C before March; pilot the fast-track for one quarter; ageing alerts start now (automation R3)', how: 'Raise delegated authority for a defined claim class only, with a 10% random audit and an automatic escalation for claims within 20% under the new line (the B07 detector). Use the claims-in-progress figure (≈ intake × cycle days ÷ 30) to size capacity: ' + inflight(tC) + ' now vs ' + inflightBefore + ' before.', why: `Slow claims cost renewals: moving half of the ${slow.length} slow claims under 20 days protects roughly ${money(saved)} of annual premium in this sample, and it addresses the Retention complaint at its source.`, expected: `Median large-claim close from ${f(med(cdB), 0)} toward 20 days; non-renewal after slow claims falls toward the ${pctS(nr(fast))} baseline`, confidence: 'Medium: the delay-to-churn link is observational, and the fast-track must not reopen the fraud route the B07 pattern exploits', risks: ['Threshold gaming (see B07)', 'Lower adjuster oversight (FSRA flagged adjuster oversight in its 2024 home-claims review)'], ifWrong: 'If cycle time does not fall in the pilot quarter, revert authority and add capacity instead' },
    automationIds: ['R2', 'R3'] };
}

// ===== claim-wait-retention
function retention() {
  const sig = sigOf('wait-time threshold search'), ev = sig.evidence, buckets = sig.table;
  const claimant = P.filter((p) => ['Renewed', 'Not Renewed'].includes(p.renewal_status) && p.cl.some((c) => c.closed)), wait = (p) => Math.max(...p.cl.filter((c) => c.closed).map((c) => (c.closed - c.rep) / 864e5));
  const nr = (ps) => ps.filter((p) => p.renewal_status === 'Not Renewed').length / Math.max(1, ps.length);
  const smallOnly = claimant.filter((p) => !p.cl.some((c) => c.amt >= T10)), s20 = smallOnly.filter((p) => wait(p) > 20), f20 = smallOnly.filter((p) => wait(p) <= 20);
  const denied = claimant.filter((p) => p.cl.some((c) => c.status === 'Denied')), notDen = claimant.filter((p) => !p.cl.some((c) => c.status === 'Denied'));
  const done = P.filter((p) => ['Renewed', 'Not Renewed'].includes(p.renewal_status) && p.prem > 0).sort((a, b) => a.prem - b.prem), q = (i) => done.slice(Math.floor(i * done.length / 4), Math.floor((i + 1) * done.length / 4));
  const quart = [0, 1, 2, 3].map((i) => f(nr(q(i)), 3));
  const why = [
    test('Does the effect rise steadily with the wait?', buckets.map((b) => `${b.wait}: ${pctS(+b.nonRenewalRate)}`).join(' · '), 'confirmed', buckets),
    test('Is it just big claims being slow and unhappy?', `Among claims under $10,000 only, waits over 20 days did not renew ${pctS(nr(s20))} (n=${s20.length}) vs ${pctS(nr(f20))} (n=${f20.length})`, nr(s20) > nr(f20) * 1.2 ? 'confirmed' : 'open', { slow: f(nr(s20), 3), fast: f(nr(f20), 3) }),
    test('Is it the claim outcome (denial) rather than the wait?', `Customers with a denied claim: ${pctS(nr(denied))} non-renewal vs ${pctS(nr(notDen))} otherwise (n=${denied.length})`, 'caution', { denied: f(nr(denied), 3), other: f(nr(notDen), 3) }),
    test('Is it price?', `Non-renewal by premium quartile: ${quart.map((x) => pctS(+x)).join(' / ')} (flat)`, 'ruled-out', quart),
    test('Is the cut-off cherry-picked?', `Best cut-off found by search was ${ev.cutoffDays} days (${pctS(+ev.nrSlow)} vs ${pctS(+ev.nrFast)}); at the plain 20-day line it is ${pctS(+ev.at20days.nrSlow)} vs ${pctS(+ev.at20days.nrFast)}. The buckets show a cliff after 30 days rather than a smooth slope, so the 30-day line is the one to defend`, 'caution', ev.at20days),
  ];
  return { id: 'claim-wait-retention', title: 'Waiting for a claim to close drives non-renewal', severity: 'high', owner: 'Head of Retention',
    oneLiner: `Customers whose claim took more than ${ev.cutoffDays} days did not renew ${pctS(+ev.nrSlow)} of the time versus ${pctS(+ev.nrFast)} (n=${ev.nSlow} vs ${ev.nFast}); at 20 days it is ${pctS(+ev.at20days.nrSlow)} vs ${pctS(+ev.at20days.nrFast)}.`,
    conclusion: 'The Head of Retention is right. Waits up to 30 days barely move renewal, but beyond 30 days non-renewal jumps to more than three times the baseline; the effect survives restricting to small claims and is not about price. So the hard line is 30 days, with 20 days as the working target.',
    why, impactUSD: sig.impactUSD, numbers: { slow20: ev.at20days, premiumAtRisk: ev.premiumAtRisk, excessNonRenewals: ev.excessNonRenewals, byBucket: buckets },
    decision: { what: 'Set a 30-day hard limit and a 20-day working target; send proactive status updates at day 7 and day 14, and make a retention call for any claim still open at day 14 so none crosses day 30.', where: 'All claims; start with Team C where 38 of 48 open claims sit', when: 'Alerts live now (automation R3); measure renewals on the next two cohorts', how: 'Daily job lists open claims older than 14 days, ranks them by premium at risk, and creates tasks for the adjuster and a retention call (see R3).', why: `Each excess non-renewal costs about ${money(mean(claimant.filter((p) => p.prem > 0).map((p) => p.prem)))} of premium; in this sample the slow-claim gap is about ${money(+ev.premiumAtRisk)}.`, expected: 'Non-renewal after slow claims falls toward the 16% baseline', confidence: 'Medium: observational; satisfaction research supports speed and communication (J.D. Power 2025) but is mostly US and stated intent', risks: ['Proactive calls on denied claims can backfire', 'Slow claims may also be harder claims'], ifWrong: 'If renewal does not improve after speed improves, redirect effort to claim outcome and price' },
    automationIds: ['R3'] };
}

// ===== home-pricing
function homePricing() {
  const homeBands = ['Low', 'Medium', 'High'].map((b) => { const ps = homeNB.filter((p) => p.risk_band === b); return { band: b, policies: ps.length, lr: lrOf(ps), freq: freqOf(ps), prem: mean(ps.filter((p) => p.prem > 0).map((p) => p.prem)), sev: mean(claimsOf(ps).map((c) => c.inc)) }; });
  // bootstrap CI for LR(Medium) - LR(High)
  const med_ = homeNB.filter((p) => p.risk_band === 'Medium'), hi_ = homeNB.filter((p) => p.risk_band === 'High'); let le = 0; const Bn = 600; const lr = (ps) => incOf(claimsOf(ps)) / earnedOf(ps); const rs = (a) => Array.from({ length: a.length }, () => a[Math.floor(Math.random() * a.length)]);
  for (let b = 0; b < Bn; b++) if (lr(rs(med_)) <= lr(rs(hi_))) le++;
  const pInv = le / Bn;
  const auto = P.filter((p) => p.policy_type === 'Auto' && p.broker_code !== 'B07'), autoBands = ['Low', 'Medium', 'High'].map((b) => f(lrOf(auto.filter((p) => p.risk_band === b)), 2));
  const homeAll = P.filter((p) => p.policy_type === 'Home'), autoAll = P.filter((p) => p.policy_type === 'Auto');
  const d500 = homeNB.filter((p) => p.ded === 500), d1k = homeNB.filter((p) => p.ded === 1000);
  const cityRows = ['Montreal', 'Toronto', 'Calgary', 'Ottawa', 'Quebec City'].map((c) => { const ps = homeNB.filter((p) => p.city2 === c); const pr = sum(ps.map((p) => p.earned)) / expOf(ps), ct = incOf(claimsOf(ps)) / expOf(ps) * (1 + A.lae); return { city: c, avgPremium: f(pr, 0), costPerYearWithLAE: f(ct, 0), indicatedPremium: f(ct / (1 - A.expense), 0), indicatedChange: f(ct / (1 - A.expense) / pr - 1, 2) }; });
  const bandRows = homeBands.map((b) => { const ct = b.lr * b.prem * (1 + A.lae); return { band: b.band, avgPremium: f(b.prem, 0), lossRatio: f(b.lr, 2), freq: f(b.freq, 3), indicatedPremium: f(ct / (1 - A.expense), 0), indicatedChange: f(ct / (1 - A.expense) / b.prem - 1, 2) }; });
  const why = [
    test('Is Home really the money-loser?', `Earned loss ratio Home ${f(lrOf(homeAll), 2)} vs Auto ${f(lrOf(autoAll), 2)}; Home is ${pctS(earnedOf(homeAll) / earnedOf(P))} of earned premium but ${pctS(incOf(claimsOf(homeAll)) / incOf(C))} of incurred cost`, 'confirmed', { home: f(lrOf(homeAll), 2), auto: f(lrOf(autoAll), 2) }),
    test('Does Auto price follow risk while Home does not?', `Auto loss ratio by band (Low/Medium/High, ex-B07): ${autoBands.join(' / ')}; Home: ${homeBands.map((b) => f(b.lr, 2)).join(' / ')}`, 'confirmed', { auto: autoBands }),
    test('Is the Home Medium-over-High inversion real?', `Medium ${f(homeBands[1].lr, 2)} vs High ${f(homeBands[2].lr, 2)}; frequency is not inverted (${f(homeBands[1].freq, 3)} vs ${f(homeBands[2].freq, 3)}) but severity is higher in Medium; bootstrap probability that Medium ≤ High = ${pctS(pInv)}`, pInv < 0.1 ? 'confirmed' : 'caution', { pInversionNotReal: f(pInv, 2) }),
    test('Is the High band over-loaded?', `High premium is ${pctS(homeBands[2].prem / homeBands[1].prem - 1)} above Medium for ${pctS(homeBands[2].freq / homeBands[1].freq - 1)} more claims`, 'confirmed', { premiumGap: f(homeBands[2].prem / homeBands[1].prem - 1, 2) }),
    test('Does city enter the Home price?', `Average Home premium ranges only ${money(Math.min(...cityRows.map((r) => +r.avgPremium)))}–${money(Math.max(...cityRows.map((r) => +r.avgPremium)))} while cost per policy-year ranges ${money(Math.min(...cityRows.map((r) => +r.costPerYearWithLAE)))}–${money(Math.max(...cityRows.map((r) => +r.costPerYearWithLAE)))}`, 'confirmed', cityRows),
    test('Is the $500 deductible under-priced?', `Loss ratio $500: ${f(lrOf(d500), 2)} vs $1,000: ${f(lrOf(d1k), 2)}; the gap is modest`, 'caution', { d500: f(lrOf(d500), 2), d1000: f(lrOf(d1k), 2) }),
    test('Could this be a catastrophe year or noise?', 'Industry Home results swing above 100% in catastrophe quarters (Q3 2024 claims ratio 121.7%); our data has no catastrophe flag, so part of the Home gap may be weather, but the city and band patterns persist', 'caution', null),
  ];
  return { id: 'home-pricing', title: 'Home pricing ignores the risks that cost most; Auto pricing does not', severity: 'high', owner: 'Chief Actuary',
    oneLiner: `Home loss ratio ${f(lrOf(homeAll), 2)} vs Auto ${f(lrOf(autoAll), 2)}; Home Medium band ${f(homeBands[1].lr, 2)} vs High ${f(homeBands[2].lr, 2)}.`,
    conclusion: 'Auto cross-subsidises Home. Home rates are flat across city and mis-ordered across bands. The fix is re-rating Home (water territory, band balance), not raising Auto.',
    why, impactUSD: SIG.signals.find((s) => s.headline.startsWith('Home insurance:'))?.impactUSD, numbers: { byBand: bandRows, byCity: cityRows, autoBandLR: autoBands },
    decision: { what: 'Re-rate Home: add a water territory factor (Montréal first), rebalance Medium and High bands using frequency and severity, and tighten the $500 deductible credit. Do not raise Auto prices.', where: 'Home, all cities; Montréal and the Medium band first', when: 'Next rate filing; validate the bands on 2026 claims before filing', how: 'Re-fit frequency and severity with city, band and deductible, check lift by band, and apply credibility (13 fire claims earn about 11% weight; Medium/High have hundreds). The indicated changes above are screening numbers, not a filing.', why: 'The loss ratio gap between Home and Auto is the largest and most persistent finding, and the band ordering is wrong in a way price can fix.', expected: 'Home loss ratio moves from about 1.0 toward the 0.65–0.70 needed after 30% expenses and 14% claims handling', confidence: 'High on direction; medium on size (catastrophe noise, no property data)', risks: ['Rate shock and shopping', 'Regulatory review', 'Overreacting to a catastrophe-heavy window'], ifWrong: 'Phase changes and re-test each quarter on new claims' },
    automationIds: ['R4'] };
}

// ===== broker-channel
function brokerChannel() {
  const chan = (ch, prod) => nonB.filter((p) => p.channel === ch && p.policy_type === prod);
  const lrs = { autoBroker: lrOf(chan('Broker', 'Auto')), autoAgent: lrOf(chan('Agent', 'Auto')), autoOnline: lrOf(chan('Online', 'Auto')), homeBroker: lrOf(chan('Broker', 'Home')), homeAgent: lrOf(chan('Agent', 'Home')), homeOnline: lrOf(chan('Online', 'Home')) };
  const homeMtlShare = (ch) => chan(ch, 'Home').filter((p) => p.city2 === 'Montreal').length / chan(ch, 'Home').length;
  const bHome = chan('Broker', 'Home'), bHomeExMtl = bHome.filter((p) => p.city2 !== 'Montreal'), oHomeExMtl = chan('Online', 'Home').filter((p) => p.city2 !== 'Montreal');
  const brokers = SIG.tables.brokers.filter((b) => b.broker !== 'B07'), spread = brokers.map((b) => +b.lossRatio);
  const why = [
    test('Is the whole broker channel the problem?', `Paid-over-written for brokers is ${pctS(SIG.signals.find((s) => s.id === 'S03').metric.value)} with B07 and ${pctS(SIG.signals.find((s) => s.id === 'S03').table[0].paidOverWrittenExB07)} without it, next to ${pctS(+SIG.signals.find((s) => s.id === 'S03').table[2].paidOverWrittenExB07)} Agent`, 'ruled-out', SIG.signals.find((s) => s.id === 'S03').table),
    test('Is Auto through brokers worse once B07 is removed?', `Auto earned loss ratio: Broker ${f(lrs.autoBroker, 2)}, Agent ${f(lrs.autoAgent, 2)}, Online ${f(lrs.autoOnline, 2)}`, lrs.autoBroker <= lrs.autoAgent * 1.15 ? 'ruled-out' : 'open', lrs),
    test('Is Home through brokers worse?', `Home loss ratio: Broker ${f(lrs.homeBroker, 2)}, Agent ${f(lrs.homeAgent, 2)}, Online ${f(lrs.homeOnline, 2)}; Montréal is ${pctS(homeMtlShare('Broker'))} of broker Home vs ${pctS(homeMtlShare('Online'))} Online; outside Montréal: Broker ${f(lrOf(bHomeExMtl), 2)} vs Online ${f(lrOf(oHomeExMtl), 2)}`, lrOf(bHomeExMtl) > lrOf(oHomeExMtl) * 1.25 ? 'caution' : 'open', null),
    test('Are other brokers uneven?', `Broker loss ratios excluding B07 range ${f(Math.min(...spread), 2)}–${f(Math.max(...spread), 2)}; each broker has only ${Math.min(...brokers.map((b) => b.policies))}–${Math.max(...brokers.map((b) => b.policies))} policies, so most differences are noise`, 'caution', brokers),
  ];
  return { id: 'broker-channel', title: 'Brokers are not the problem: one broker is', severity: 'medium', owner: 'Head of Distribution',
    oneLiner: `Without B07, brokers cost ${pctS(SIG.signals.find((s) => s.id === 'S03').table[0].paidOverWrittenExB07)} of premium versus ${pctS(+SIG.signals.find((s) => s.id === 'S03').table[2].paidOverWrittenExB07)} for Agents.`,
    conclusion: 'The Head of Distribution is right that the channel is healthy, and wrong to protect B07. Slowing every broker would waste growth; monitoring every broker, with automatic holds, protects it.',
    why, impactUSD: SIG.signals.find((s) => s.id === 'S14')?.impactUSD, numbers: { lossRatios: lrs, brokers },
    decision: { what: 'Keep the broker growth programme, but give every broker a scorecard: early-claim share, near-threshold share, theft share and loss ratio, with automatic hold triggers. Tie part of commission to loss ratio on Home.', where: 'All ten brokers; Home business first', when: 'Scorecard monthly; contract change at next renewal of broker agreements', how: 'Run the B07 detectors on every broker each month (automation R1); share the scorecard with brokers so honest ones see clear rules.', why: 'The data shows the channel is fine without B07; the risk is the speed at which a bad partner can add policies.', expected: 'Growth preserved; one-broker shocks caught within a month', confidence: 'High on the channel result; low on individual broker ranking (small samples)', risks: ['Broker pushback', 'Small-sample false alarms'], ifWrong: 'Hold is a review, not a termination: broker is reinstated if cleared' },
    automationIds: ['R1'] };
}

// ===== severe-claims
function severe() {
  const big = C.filter((c) => c.amt >= T10), fire = C.filter((c) => c.claim_type === 'Fire'), share = sum(big.map((c) => c.amt)) / sum(C.map((c) => c.amt || 0));
  const byType = Object.entries(big.reduce((m, c) => ((m[c.claim_type] = (m[c.claim_type] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const z = Math.sqrt(fire.length / 1082);
  const why = [
    test('Is exposure concentrated in large claims?', `${big.length} claims (${pctS(big.length / C.length)}) carry ${pctS(share)} of claim dollars`, 'confirmed', { count: big.length, share: f(share, 2) }),
    test('Which perils fill the large-claim list?', byType.map(([k, v]) => `${k} ${v}`).join(', '), 'confirmed', byType),
    test('Is Fire a pricing signal?', `${fire.length} Fire claims; limited-fluctuation credibility ≈ ${pctS(z)} (full credibility needs about 1,082 claims)`, 'caution', { n: fire.length, credibility: f(z, 2) }),
    test('Does large-claim cost explain Montréal?', `Large claims are ${pctS(C.filter((c) => c.p.city2 === 'Montreal' && c.amt >= T10).length / C.filter((c) => c.p.city2 === 'Montreal').length)} of Montréal claims vs ${pctS(C.filter((c) => c.p.city2 !== 'Montreal' && c.amt >= T10).length / C.filter((c) => c.p.city2 !== 'Montreal').length)} elsewhere (mostly water)`, 'confirmed', null),
  ];
  return { id: 'severe-claims', title: 'A tenth of the claims carry a third of the dollars', severity: 'medium', owner: 'VP Claims + Chief Actuary',
    oneLiner: `${big.length} claims ≥ $10,000 = ${pctS(share)} of claim dollars; ${fire.length} Fire claims average ${money(mean(fire.filter((c) => c.amt).map((c) => c.amt)))}.`,
    conclusion: 'Large claims are mostly Water Damage and Liability, and deserve early visibility. Fire is too thin to reprice on its own: check reinsurance and limits instead.',
    why, impactUSD: null, numbers: { bigCount: big.length, bigShare: f(share, 3), byType },
    decision: { what: 'Give every claim ≥ $7,500 an early heads-up flag to the senior reviewer (visibility, not delay); review per-risk reinsurance and policy limits for Fire and Liability; do not reprice on Fire alone.', where: 'Claims intake; Fire and Liability books', when: 'Flag now; reinsurance review at next treaty renewal', how: 'The intake system tags claims by expected size; the senior reviewer sees them on day 1 so the 30-day wait shrinks.', why: 'Large claims drive both cost and waiting; early visibility helps both without changing authority.', expected: 'Shorter senior-review cycle; better reserve accuracy', confidence: 'Medium', risks: ['Flag fatigue'], ifWrong: 'Drop the threshold flag if it does not shorten cycle time' },
    automationIds: ['R2'] };
}

// ===== bundle + data quality
function bundle() {
  const b = P.filter((p) => p.bundle === 'yes'), s = P.filter((p) => p.bundle === 'no');
  const done = (ps) => ps.filter((p) => ['Renewed', 'Not Renewed'].includes(p.renewal_status)), nr = (ps) => done(ps).filter((p) => p.renewal_status === 'Not Renewed').length / done(ps).length;
  const why = [test('Do bundled customers cost less?', `Claims per policy-year ${f(freqOf(b), 3)} vs ${f(freqOf(s), 3)}; loss ratio ${f(lrOf(b), 2)} vs ${f(lrOf(s), 2)}`, 'confirmed', null), test('Do they stay longer?', `Non-renewal ${pctS(nr(b), 1)} vs ${pctS(nr(s), 1)}: no retention difference in this data (J.D. Power US reports 95% vs 85%, a different population)`, Math.abs(nr(b) - nr(s)) < 0.02 ? 'ruled-out' : nr(b) < nr(s) ? 'confirmed' : 'open', null), test('Is it the bundle or the customer?', 'Better customers choose bundles (selection), so the discount should be tested, not assumed', 'caution', null)];
  return { id: 'bundle-opportunity', title: 'Bundled customers are better risks: a growth lever with a caveat', severity: 'watch', owner: 'Head of Retention', oneLiner: `Bundled customers: ${f(freqOf(b), 3)} claims per policy-year vs ${f(freqOf(s), 3)}; loss ratio ${f(lrOf(b), 2)} vs ${f(lrOf(s), 2)}.`, conclusion: 'Bundled customers claim less and cost less, but they do not renew more in this data, so the benefit is lower loss cost, not retention. Test a bundle offer with a holdout group to separate selection from effect.', why, impactUSD: null, numbers: {}, decision: { what: 'Run a bundle offer test on single-line Auto customers with a holdout group.', where: 'Single-line customers in Calgary, Toronto, Ottawa (not Montréal Home until water is priced)', when: 'Next quarter', how: 'Randomise the offer; measure claims, retention and margin after 12 months.', why: 'Bundled customers claim less and renew more in this book.', expected: 'Lower loss cost per policy if the effect is causal; no retention gain assumed', confidence: 'Low-medium (selection)', risks: ['Selection bias', 'Bundle discount erodes margin'], ifWrong: 'End the test if the holdout shows no difference' }, automationIds: [] };
}
function dataQuality() {
  const q = SIG.signals.find((s) => s.issue === 'data-quality').evidence;
  return { id: 'data-quality', title: 'Dirty inputs would have understated premium and misdated 108 rows', severity: 'watch', owner: 'Data team', oneLiner: `${q.premiumAsText} premiums as text, ${q.policyDatesDMY + q.claimDatesDMY} dates in another format, ${q.duplicatesRemoved} duplicate claims.`, conclusion: 'Cleaning changed the totals: written premium is 6.70M (6.50M if text premiums are read as zero). Validation should run at ingestion.', why: [test('Did cleaning change conclusions?', 'Yes: text premiums read as zero understate premium by about 3%; day-first dates misplace 108 rows in time', 'confirmed', q)], impactUSD: null, numbers: q, decision: { what: 'Add ingestion validators for currency text, date formats, duplicate IDs and city labels.', where: 'Data pipeline', when: 'Now', how: 'Reject or repair rows at load and log what changed (this pipeline already does).', why: 'Silent errors changed premium totals and dates.', expected: 'Trustworthy totals', confidence: 'High', risks: [], ifWrong: 'n/a' }, automationIds: ['R5'] };
}

// ------------------------------------------------------------ automations (fire on the data; each writes to the action log)
const actions = [];
const fire = (a) => { actions.push({ ...a, firedAt: new Date().toISOString() }); appendFileSync(new URL('actions.log.jsonl', OUT), JSON.stringify({ t: new Date().toISOString(), rule: a.id, status: a.status, matched: a.matched.count }) + '\n'); };
writeFileSync(new URL('actions.log.jsonl', OUT), '');
log('ACT: evaluating automation rules on the data');
// R1 broker hold
{ const rows = SIG.tables.brokers.filter((b) => b.flagged); const b07r = rows[0];
  fire({ id: 'R1', name: 'Broker hold on early-claim + threshold pattern', condition: 'Broker with ≥ 15 claims where early-claim (≤ 45 days) share or near-threshold ($8–10k) share is improbable versus the book (binomial tail < 1e-6)', status: rows.length ? 'FIRED' : 'idle', matched: { count: rows.length, items: rows.map((r) => ({ broker: r.broker, policies: r.policies, claims: r.claims, lossRatio: r.lossRatio, earlyShare: r.earlyShare, nearThresholdShare: r.nearThresholdShare })) }, actions: [{ do: 'Suspend new binding and renewals for the broker', to: 'Head of Distribution' }, { do: 'Open SIU file on policies and claims', to: 'Special Investigations' }, { do: 'Route every claim from this broker to senior review regardless of amount', to: 'VP Claims' }], notify: ['Head of Distribution', 'VP Claims', 'SIU'], ifWrong: 'A hold is a review, not a termination; if SIU clears the broker, payments are released and the broker reinstated. False alarms cost a few weeks of binding.', logged: true }); }
// R2 threshold audit
{ const near = C.filter((c) => c.amt >= 8000 && c.amt < T10); const flaggedBrokers = new Set(SIG.tables.brokers.filter((b) => b.flagged).map((b) => b.broker)); const nearFlag = near.filter((c) => flaggedBrokers.has(c.p.broker_code)); const rest = near.filter((c) => !flaggedBrokers.has(c.p.broker_code));
  fire({ id: 'R2', name: 'Near-threshold claim audit', condition: 'Any claim between 80% and 100% of the $10,000 senior-review line, or any group whose share in that band exceeds 3× the book', status: near.length ? 'FIRED' : 'idle', matched: { count: near.length, items: [{ group: 'flagged brokers', claims: nearFlag.length }, { group: 'everyone else', claims: rest.length, sampleToAudit: Math.ceil(rest.length * 0.25) }], examples: nearFlag.slice(0, 8).map((c) => ({ claim: c.claim_id, amount: Math.round(c.amt), type: c.claim_type, broker: c.p.broker_code })) }, actions: [{ do: 'Send all flagged-broker near-threshold claims to senior review', to: 'VP Claims' }, { do: 'Sample 25% of other near-threshold claims for audit', to: 'Claims QA' }], notify: ['VP Claims'], ifWrong: 'Wasted review time on honest claims; mitigated by sampling only 25% outside flagged sources.', logged: true }); }
// R3 ageing claim escalation
{ const open = C.filter((c) => ['Open', 'Under Review'].includes(c.status)).map((c) => ({ c, age: (ASOF - c.rep) / 864e5 })).filter((x) => x.age > 14).sort((a, b) => b.age - a.age); const prem = sum(open.map((x) => x.c.p.prem || 0));
  fire({ id: 'R3', name: 'Ageing-claim escalation and retention call', condition: 'Open or under-review claim older than 14 days (the 20-day line minus a 6-day buffer)', status: open.length ? 'FIRED' : 'idle', matched: { count: open.length, premiumAtRisk: f(prem, 0), byTeam: ['Team A', 'Team B', 'Team C'].map((t) => ({ team: t, claims: open.filter((x) => x.c.adjuster_team === t).length })), examples: open.slice(0, 8).map((x) => ({ claim: x.c.claim_id, ageDays: Math.round(x.age), team: x.c.adjuster_team, type: x.c.claim_type, amount: Math.round(x.c.amt || 0) })) }, actions: [{ do: 'Move to the priority queue and ask the adjuster for a status update', to: 'Adjuster team lead' }, { do: 'Schedule a proactive customer call', to: 'Retention' }, { do: 'Escalate claims ≥ $10,000 to the fast-track reviewer', to: 'Senior reviewer' }], notify: ['VP Claims', 'Head of Retention'], ifWrong: 'An unnecessary call to a customer whose claim was already moving; low cost.', logged: true }); }
// R4 pricing review ticket
{ const segs = []; for (const city of ['Montreal', 'Toronto', 'Calgary', 'Ottawa', 'Quebec City']) for (const prod of ['Home', 'Auto']) { const ps = nonB.filter((p) => p.city2 === city && p.policy_type === prod); if (ps.length < 150) continue; const rest = nonB.filter((p) => p.policy_type === prod && p.city2 !== city); const r = rr(claimsOf(ps).length, expOf(ps), claimsOf(rest).length, expOf(rest)); const lr = lrOf(ps); if (lr * (1 + A.lae) + A.expense > 1.05 && r.lo > 1.3) segs.push({ segment: prod + ' · ' + city, policies: ps.length, lossRatio: f(lr, 2), frequencyRatio: f(r.ratio, 2), ci95: [f(r.lo, 2), f(r.hi, 2)], combinedRatio: f(lr * (1 + A.lae) + A.expense, 2) }); }
  fire({ id: 'R4', name: 'Pricing review ticket', condition: 'City × product with ≥ 150 policies, combined ratio (loss ratio × (1 + LAE) + expenses) above 1.05, and claim-frequency ratio with 95% CI lower bound above 1.3', status: segs.length ? 'FIRED' : 'idle', matched: { count: segs.length, items: segs }, actions: [{ do: 'Open pricing review with the indicated change table', to: 'Chief Actuary' }, { do: 'Freeze broker new business in the segment until rated', to: 'Head of Distribution' }], notify: ['CFO', 'Chief Actuary'], ifWrong: 'A review ticket costs analyst time only; no price changes without an actuarial filing.', logged: true }); }
// R5 data validation
{ const q = SIG.signals.find((s) => s.issue === 'data-quality').evidence; const n = q.premiumAsText + q.policyDatesDMY + q.claimDatesDMY + q.duplicatesRemoved;
  fire({ id: 'R5', name: 'Ingestion validation', condition: 'Premium stored as text, non-ISO dates, duplicate claim IDs or city-label variants in a new extract', status: n ? 'FIRED' : 'idle', matched: { count: n, items: [{ issue: 'premiums as text', rows: q.premiumAsText }, { issue: 'day-first dates', rows: q.policyDatesDMY + q.claimDatesDMY }, { issue: 'duplicate claims', rows: q.duplicatesRemoved }, { issue: 'city label variants', rows: q.cityLabels - q.cityCanonical }] }, actions: [{ do: 'Repair rows and log each change', to: 'Data team' }], notify: ['Data team'], ifWrong: 'A wrongly repaired row is logged and reversible; original files are never edited.', logged: true }); }


// ------------------------------------------------------------ pricing answer: how much must price rise to break even / hit target, and what it takes to win
function pricingPlan() {
  const e = A.expense, l = A.lae, m = A.margin;
  const row = (ps, label, extra = {}) => { const ex = expOf(ps), prem = earnedOf(ps) / ex, cost = incOf(claimsOf(ps)) / ex, costL = cost * (1 + l), be = costL / (1 - e), tg = costL / (1 - e - m); return { label, policies: ps.length, exposureYears: f(ex, 0), premiumPerYear: f(prem, 0), costPerYear: f(cost, 0), costWithHandling: f(costL, 0), breakEvenPremium: f(be, 0), increaseToBreakEven: f(be / prem - 1, 3), targetPremium: f(tg, 0), increaseToTarget: f(tg / prem - 1, 3), combinedRatioNow: f(costL / prem + e, 2), ...extra }; };
  const cities = ['Montreal', 'Toronto', 'Ottawa', 'Calgary', 'Quebec City'], nm = { Montreal: 'Montréal', Toronto: 'Toronto', Ottawa: 'Ottawa', Calgary: 'Calgary', 'Quebec City': 'Québec City' };
  const rows = []; for (const prod of ['Home', 'Auto']) for (const c of cities) rows.push(row(nonB.filter((p) => p.policy_type === prod && p.city2 === c), prod + ' · ' + nm[c], { product: prod, city: nm[c] }));
  const mtl = homeNB.filter((p) => p.city2 === 'Montreal'), peers = homeNB.filter((p) => p.city2 !== 'Montreal'), isW = (c) => c.claim_type === 'Water Damage';
  const exM = expOf(mtl), prem = earnedOf(mtl) / exM, waterCost = incOf(claimsOf(mtl).filter(isW)) / exM, otherCost = incOf(claimsOf(mtl).filter((c) => !isW(c))) / exM;
  const fM = claimsOf(mtl).filter(isW).length / exM, fP = claimsOf(peers).filter(isW).length / expOf(peers), peerFactor = fP / fM;
  const cr = (cost, price) => (cost * (1 + l)) / price + e, needPrice = (cost, margin) => (cost * (1 + l)) / (1 - e - margin);
  const marketStep = mtlWater().numbers.marketParityStep, pMarket = prem * (1 + marketStep);
  const allowedBE = ((1 - e) * pMarket) / (1 + l), allowedTG = ((1 - e - m) * pMarket) / (1 + l);
  const cutBE = Math.max(0, 1 - (allowedBE - otherCost) / waterCost), cutTG = Math.max(0, 1 - (allowedTG - otherCost) / waterCost);
  const costPeerWater = otherCost + waterCost * peerFactor;
  const scen = [
    { id: 'today', name: 'Price alone, water claims as they are today', price: f(needPrice(waterCost + otherCost, 0), 0), increase: f(needPrice(waterCost + otherCost, 0) / prem - 1, 3), note: 'Not realistic: customers would leave long before this.' },
    { id: 'peer', name: 'Price alone, if water claims fell to the level of our other cities', price: f(needPrice(costPeerWater, 0), 0), increase: f(needPrice(costPeerWater, 0) / prem - 1, 3), note: 'Needs the water problem fixed first.' },
    { id: 'market', name: `Raise price to the market level (+${pctS(marketStep)}) and cut water claims by about ${pctS(cutBE)}`, price: f(pMarket, 0), increase: f(marketStep, 3), note: `Break-even at ${pctS(cutBE)} fewer water claims; ${pctS(cutTG)} for the 5% target margin.` },
  ];
  const bands = ['Low', 'Medium', 'High'].map((b) => row(mtl.filter((p) => p.risk_band === b), b + ' risk', { band: b }));
  const home = rows.filter((r) => r.product === 'Home'), mrow = rows.find((r) => r.label === 'Home · Montréal');
  return { assumptions: { expense: e, laeOfLosses: l, targetMargin: m, note: 'Expense 30% (Definity 2025: 29.6%); claims handling 14% of losses (MSA Research: 8–11 points of premium); target margin 5%. Excludes broker B07.' }, rows, bands, montrealHome: { premiumPerYear: f(prem, 0), waterCostPerYear: f(waterCost, 0), otherCostPerYear: f(otherCost, 0), waterShareOfCost: f(waterCost / (waterCost + otherCost), 2), waterFreqMontreal: f(fM, 3), waterFreqOtherCities: f(fP, 3), waterFreqRatio: f(fM / fP, 1), increaseToBreakEven: mrow.increaseToBreakEven, breakEvenPremium: mrow.breakEvenPremium, increaseToTarget: mrow.increaseToTarget, targetPremium: mrow.targetPremium, combinedRatioNow: mrow.combinedRatioNow, combinedRatioWithoutWater: f(cr(otherCost, prem), 2), marketParityStep: f(marketStep, 3), marketPrice: f(pMarket, 0), combinedRatioAtMarketPrice: f(cr(waterCost + otherCost, pMarket), 2), waterCutNeededToBreakEven: f(cutBE, 2), waterCutNeededForTarget: f(cutTG, 2), scenarios: scen }, homeRowsNeedingIncrease: home.filter((r) => r.increaseToBreakEven > 0).map((r) => r.label) };
}

// ------------------------------------------------------------ assemble
const issues = [mtlWater(), b07(), seniorReview(), retention(), homePricing(), brokerChannel(), severe(), bundle(), dataQuality()];
for (const is of issues) { const ev = evidenceFor(is.id); is.evidence = { cards: ev.length, supports: ev.filter((c) => c.stance === 'supports').length, challenges: ev.filter((c) => c.stance === 'challenges').length, context: ev.filter((c) => c.stance === 'context').length, verified: ev.filter((c) => c.verified).length }; is.evidenceCards = ev; is.signalIds = SIG.issues.find((i) => i.id === is.id)?.signalIds || []; }
const order = { critical: 0, high: 1, medium: 2, watch: 3 }; issues.sort((a, b) => order[a.severity] - order[b.severity] || (b.impactUSD || 0) - (a.impactUSD || 0)); issues.forEach((i, k) => (i.priority = k + 1));
const b07x = issues.find((i) => i.id === 'b07-fraud'), mw = issues.find((i) => i.id === 'mtl-water'), sr = issues.find((i) => i.id === 'senior-review'), rt = issues.find((i) => i.id === 'claim-wait-retention');
const stakeholders = [
  { who: 'CFO', said: '"We\'re writing more business than ever and making less money on it. Where is the money going?"', verdict: 'right', answer: `Three leaks: broker B07 (~${money(b07x.impactUSD)} excess), Montréal Home water (~${money(mw.impactUSD)}), and Home pricing that ignores risk. B07 alone explains the 2026 deterioration (loss ratio ${SIG.tables.cohorts[2].lossRatio} → ${SIG.tables.cohorts[2].lossRatioExFlaggedBrokers} without it).`, issues: ['b07-fraud', 'mtl-water', 'home-pricing'] },
  { who: 'VP Claims', said: '"My teams are drowning. Some offices are fine, others aren\'t. I need more adjusters."', verdict: 'partly right', answer: `Team C is overloaded (intake ×${SIG.tables.teams[2].surge}, ${SIG.tables.teams[2].open} of 48 open claims); Teams A and B are not. But the longest waits come from the $10,000 senior-review step (median ${sr.numbers.medianCloseBig} vs ${sr.numbers.medianCloseSmall} days), so more adjusters alone will not fix it.`, issues: ['senior-review'] },
  { who: 'Head of Retention', said: '"Renewals are slipping. The complaints are about waiting for their claim to be paid."', verdict: 'right', answer: `Customers whose claim took more than 30 days did not renew ${pctS(+rt.numbers.byBucket.find((b) => b.wait.startsWith('>')).nonRenewalRate)} vs about 16–17% when it closed sooner (more than 20 days: ${pctS(+rt.numbers.slow20.nrSlow)} vs ${pctS(+rt.numbers.slow20.nrFast)}). The effect is not about price.`, issues: ['claim-wait-retention', 'senior-review'] },
  { who: 'Head of Distribution', said: '"Brokers are our best growth engine. Don\'t slow them down."', verdict: 'partly right', answer: 'The channel is healthy without B07 (Auto through brokers is as profitable as through agents). Do not slow brokers in general; do put one broker on hold, and add automatic monitors for all.', issues: ['broker-channel', 'b07-fraud'] },
];
const pricing = pricingPlan();
const out = { pricing, meta: { generated: new Date().toISOString(), assumptions: A, asOf: SIG.meta.asOf, note: 'Impact figures are observed in the data window (about two years of policies; B07 is 2026 only), not annual forecasts.' }, stakeholders, issues, automations: actions };
writeFileSync(new URL('decisions.json', OUT), JSON.stringify(out, null, 1));
writeFileSync(new URL('actions.json', OUT), JSON.stringify(actions, null, 1));
log(`wrote ${issues.length} decisions, ${stakeholders.length} stakeholder verdicts, ${actions.filter((a) => a.status === 'FIRED').length} automations fired → pipeline/out/decisions.json`);
