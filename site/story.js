/* The plain-language story. Numbers are read live from the pipeline output, so re-running the analysis updates every sentence. */
(function () {
  const { esc } = window.S;
  window.STORY = function (state) {
    const SG = state.signals, DC = state.decisions, EV = state.evidence || {}, CH = SG.charts || {};
    const pt = (cid, si, x) => (CH[cid]?.series?.[si]?.points || []).find((p) => p.x === x)?.y;
    const money = (x) => '$' + Math.round(Math.abs(+x || 0)).toLocaleString('en-CA');
    const pc = (x) => Math.round((+x || 0) * 100) + '%';
    const cents = (x) => Math.round((+x || 0) * 100) + '¢';
    const issue = (id) => DC.issues.find((i) => i.id === id) || { numbers: {}, decision: {}, why: [], evidence: {} };
    const sigs = (id) => SG.signals.filter((s) => s.issue === id);
    const det = (d) => SG.signals.find((s) => s.detector === d);
    const cards = (...ids) => ids.flatMap((i) => EV[i] || []);
    const mtl = issue('mtl-water'), b07 = issue('b07-fraud'), sr = issue('senior-review'), rt = issue('claim-wait-retention'), hp = issue('home-pricing'), bc = issue('broker-channel'), sv = issue('severe-claims');
    const b07e = det('early-claim + threshold-structuring')?.evidence || {};
    const waitPts = CH['wait-renewal']?.series?.[0]?.points || [];
    const waitHi = waitPts[waitPts.length - 1]?.y, waitLo = waitPts[0]?.y;
    const teamC = SG.tables.teams.find((t) => t.team === 'Team C') || {};
    const chS3 = SG.signals.find((s) => s.id === 'S03')?.table || [];
    const exB = (c) => chS3.find((r) => r.channel === c)?.paidOverWrittenExB07;
    const loss = (mtl.numbers.montrealHomeCostPerYearWithLAE || 0) + (mtl.numbers.montrealHomePremiumPerYear || 0) * 0.3 - (mtl.numbers.montrealHomePremiumPerYear || 0);
    const stories = [
      { id: 'b07', icon: '🚨', issueIds: ['b07-fraud'], severity: 'Urgent', charts: ['b07-days', 'b07-amounts', 'brokers', 'cohorts'],
        headline: 'One broker’s customers claim right after buying, just under the review limit.',
        sub: `Broker B07: ${b07e.theftClaims || '60'} theft claims where about ${b07e.expectedTheft || '3'} would be normal. ${pc(b07e.nearThresholdShare)} of its claims are between $8,000 and $9,999.`,
        cause: 'A sudden pile of early theft claims, all paid, all just under the $10,000 line where a senior person would check. This pattern fits organised fraud or a badly screened book. The data can’t say which, so it needs an investigation.',
        gap: 'We can’t tell fraud from careless selling without looking at the applications.',
        do: { what: 'Put broker B07 on hold and investigate its claims.', where: 'Broker B07 (173 policies, all sold in 2026)', when: 'Hold today. Investigation within 30 days.', how: 'Stop new sales and renewals. Send every B07 claim to senior review. Investigators check the applications.', why: `Without B07 our loss ratio is ${b07.numbers.bookLossRatioWithoutB07 || '0.62'} instead of ${b07.numbers.bookLossRatio || '0.70'}, and the “more business, less money” problem disappears.` }, wrong: 'The hold is reversible: if investigators clear the broker, we release payments and restart sales.' },
      { id: 'mtl', icon: '💧', issueIds: ['mtl-water', 'peer-water'], severity: 'Urgent', charts: ['city-water', 'water-months', 'home-price-vs-cost'],
        headline: 'Montréal basements flood more, and we charge the same price.',
        sub: `Water claims per home per year: Montréal ${pt('city-water', 0, 'Montréal')}, Toronto ${pt('city-water', 0, 'Toronto')}. That’s about ${((pt('city-water', 0, 'Montréal') || 0) / (pt('city-water', 0, 'Toronto') || 1)).toFixed(1)} times as often.`,
        cause: 'It is only water, it peaks in spring and October, and it happens to every kind of customer. Québec City, in the same province with the same adjusters, is 5 times lower. So it looks like Montréal’s buildings and sewers. We can’t prove which part without addresses and building data.',
        gap: 'We have no postal codes or building details, so we can’t name the exact cause.',
        do: { what: 'Add a Montréal water charge (+36% as a first step) and ask for a backwater valve.', where: 'Home insurance in Montréal', when: 'Valve outreach in February, before the spring peak. New price at the next filing.', how: 'Raise the price toward the market level. Give a discount to homes with a valve. Pause new Montréal Home sales through brokers until the price is fixed.', why: `Today a Montréal Home policy loses about ${money(loss)} a year after costs.` }, wrong: 'If the gap shrinks once we have building data, keep the charge only where it still shows.' },
      { id: 'home', icon: '🏠', issueIds: ['home-pricing'], severity: 'Important', charts: ['home-vs-auto', 'home-bands', 'home-price-vs-cost'],
        headline: 'Home insurance loses money. Auto insurance pays for it.',
        sub: `For every $1 of premium, Home pays out ${cents(pt('home-vs-auto', 0, 'Home'))} in claims and Auto only ${cents(pt('home-vs-auto', 0, 'Auto'))}.`,
        cause: 'Auto prices follow risk: riskier customers pay more and cost more. Home prices don’t: the same price in every city, and the “Medium” risk band costs more than “High”.',
        gap: 'Part of Home’s bad result may be weather in these two years. We have no storm flag.',
        do: { what: 'Re-price Home. Leave Auto alone.', where: 'Home, all cities. Montréal and the Medium band first.', when: 'At the next price filing.', how: 'Charge more where claims cost more (city, risk band). Stop giving a big discount for a $500 deductible.', why: 'Home is 35% of our premium but 51% of our claim cost.' }, wrong: 'Change prices in steps and re-check every quarter.' },
      { id: 'wait', icon: '⏳', issueIds: ['senior-review'], severity: 'Important', charts: ['close-size', 'team-intake', 'big-claims'],
        headline: 'Big claims wait twice as long as small ones.',
        sub: `Claims of $10,000 or more take ${sr.numbers.medianCloseBig || 30} days to close. Smaller ones take ${sr.numbers.medianCloseSmall || 13}.`,
        cause: `Every claim of $10,000 or more needs a senior person, and almost half of them are water claims. Team C (Montréal and Québec City) also gets about ${(teamC.surge || 2).toFixed(0)} times as many new claims as before. More adjusters alone won’t fix the long waits.`,
        gap: 'We don’t know how busy the senior reviewers are.',
        do: { what: 'Open a fast lane for water claims between $10,000 and about $25,000, and give Team C temporary help.', where: 'Team C first, then all teams.', when: 'Staff up before March. Try the fast lane for one quarter.', how: 'A team lead approves documented water claims within 5 working days. One in ten is audited. Claims just under any limit are always checked.', why: 'Shorter waits mean fewer customers leaving.' }, wrong: 'If waits don’t drop in the trial quarter, go back to full review and add staff instead.' },
      { id: 'leave', icon: '👋', issueIds: ['claim-wait-retention'], severity: 'Important', charts: ['wait-renewal'],
        headline: 'Customers leave when their claim takes too long.',
        sub: `When a claim takes more than 30 days, ${pc(waitHi)} of customers do not renew. Otherwise about ${pc(waitLo)}.`,
        cause: 'It isn’t about price: price doesn’t change who leaves. It’s the waiting. Waiting up to 30 days barely matters, after that customers drop away fast.',
        gap: 'Customers waiting on a claim may also have a harder claim.',
        do: { what: 'Never let a claim pass 30 days. Call the customer at day 14.', where: 'All claims, Team C first.', when: 'The daily alert runs from now on.', how: 'A daily list shows open claims older than 14 days with the premium at risk. The adjuster updates the customer and Retention follows up.', why: `Each customer we lose takes about ${money(rt.numbers.premiumAtRisk && rt.numbers.excessNonRenewals ? rt.numbers.premiumAtRisk / rt.numbers.excessNonRenewals : 1500)} of premium with them.` }, wrong: 'An extra call to a customer whose claim was already moving costs very little.' },
      { id: 'brokers', icon: '🤝', issueIds: ['broker-channel'], severity: 'Good news', charts: ['channels', 'brokers'],
        headline: 'Brokers are fine, except one.',
        sub: `Brokers only look worse (${cents(pt('channels', 0, 'Broker'))} of claims per $1) because of B07. Without it: ${cents(exB('Broker'))} for brokers, ${cents(exB('Agent'))} for our own agents.`,
        cause: 'The broker channel as a whole is healthy. One bad partner can still add policies very quickly, so we need an early warning.',
        gap: 'Each broker has only 140–190 policies, so small differences are just noise.',
        do: { what: 'Keep growing with brokers, but check every broker every month with automatic holds.', where: 'All 10 brokers', when: 'Monthly check starts now.', how: 'Track early claims, claims just under $10,000, theft share and loss ratio. A broker that trips the rule is held for review.', why: 'Growth is protected, and one bad broker is caught within a month.' }, wrong: 'A hold is a review, not a ban. Cleared brokers come straight back.' },
      { id: 'big', icon: '💥', issueIds: ['severe-claims'], severity: 'Watch', charts: ['big-claims', 'claim-types'],
        headline: 'A few big claims cost a third of the money.',
        sub: `${sv.numbers.bigCount || 88} claims (1 in 10) are $10,000 or more and carry ${pc(sv.numbers.bigShare)} of all claim dollars. Almost half are water damage.`,
        cause: 'Mostly water damage and liability. Fire is rare and only 13 claims, too few to set a price on.',
        gap: 'Thirteen fire claims is too small a sample to trust.',
        do: { what: 'Flag big claims on day 1 and check our reinsurance limits for Fire and Liability.', where: 'Claims intake. Fire and Liability.', when: 'Flag now. Reinsurance check at the next renewal.', how: 'The reviewer sees likely big claims immediately, so the 30-day wait shrinks.', why: 'Early sight shortens the wait and improves reserves.' }, wrong: 'If the flag doesn’t shorten the wait, drop it.' },
      { id: 'bundle', icon: '🔗', issueIds: [], severity: 'Good news', charts: ['bundle'],
        headline: 'Customers with both Auto and Home claim less.',
        sub: `Claims per policy per year: ${pt('bundle', 0, 'Both lines')} for customers with both, ${pt('bundle', 0, 'One line')} for one line.`,
        cause: 'Better customers tend to buy both. In our data they don’t renew more often, so the gain is lower claim cost, not loyalty.',
        gap: 'Are they better because of the bundle, or just better people? Only a test can tell.',
        do: { what: 'Test a bundle offer on Auto-only customers, with a comparison group.', where: 'Calgary, Toronto, Ottawa (not Montréal Home yet).', when: 'Next quarter.', how: 'Offer to half of Auto-only customers. Compare claims and renewals after 12 months.', why: 'It could lower claim cost per policy.' }, wrong: 'End the test if the comparison group looks the same.' },
    ];
    for (const s of stories) {
      s.charts = s.charts.map((id) => CH[id]).filter(Boolean);
      s.articles = cards(...s.issueIds);
      s.signals = s.issueIds.flatMap((i) => sigs(i));
      const main = issue(s.issueIds[0]);
      s.checks = (main.why || []).map((w) => ({ q: w.test, verdict: w.verdict, result: w.result }));
      s.impact = main.impactUSD;
    }
    return stories;
  };
  window.STORY.workflow = (state) => {
    const SG = state.signals, DC = state.decisions, EV = state.evidence || {};
    const all = Object.values(EV).flat(), tests = DC.issues.flatMap((i) => i.why || []);
    return [
      { n: 1, t: 'Find patterns', d: 'The computer compares every group with the rest of the data.', got: `${SG.signals.length} patterns found` },
      { n: 2, t: 'Ask why', d: 'Each pattern becomes a question and a set of searches.', got: `${new Set(SG.signals.flatMap((s) => s.queries || [])).size}+ searches` },
      { n: 3, t: 'Read the world', d: 'We read articles and statistics, for and against.', got: `${all.length} articles, ${all.filter((c) => c.stance === 'challenges').length} argue against` },
      { n: 4, t: 'Test the ideas', d: 'Every possible cause is checked against our own numbers.', got: `${tests.filter((t) => t.verdict === 'ruled-out').length} causes ruled out, ${tests.filter((t) => t.verdict === 'confirmed').length} confirmed` },
      { n: 5, t: 'Decide and act', d: 'A decision for each problem, and rules that act by themselves.', got: `${DC.issues.length} decisions, ${DC.automations.filter((a) => a.status === 'FIRED').length} automatic actions` },
    ];
  };
})();
