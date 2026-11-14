const $ = (id) => document.getElementById(id);
const cityOrder = ['Montreal', 'Toronto', 'Calgary', 'Ottawa', 'Quebec City'];
const money = (x) => Number(x || 0).toLocaleString('en-CA', { maximumFractionDigits: 0 });
const fmt = (x, d = 2) => Number(x || 0).toLocaleString('en-CA', { maximumFractionDigits: d });
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let experience;

function safeMoney(x) { return x < 0 ? `−${money(Math.abs(x))}` : money(x); }
function peersFor(city, product) { return experience.segments.filter(s => s.product === product && s.city !== city); }
function selected() { const [city, product] = $('profile-select').value.split('|'); return experience.segments.find(s => s.city === city && s.product === product); }

function profileLabel(s) {
  const top = s.perils[0];
  const share = s.expectedClaimCostPerExposureYear ? top.expectedClaimCostPerExposureYear / s.expectedClaimCostPerExposureYear * 100 : 0;
  const type = s.product === 'Home' ? 'home' : 'auto';
  const read = top.peril === 'Water Damage' ? 'water claims lead' : top.peril === 'Collision' ? 'collision claims lead' : `${top.peril.toLowerCase()} claims lead`;
  return { top, share, type, read };
}

function renderProfile() {
  const s = selected(); if (!s) return;
  const { top, share, type, read } = profileLabel(s);
  const cityCosts = peersFor(s.city, s.product).map(x => x.expectedClaimCostPerExposureYear).filter(Number.isFinite).sort((a, b) => a - b);
  const median = cityCosts.length % 2 ? cityCosts[(cityCosts.length - 1) / 2] : (cityCosts[cityCosts.length / 2 - 1] + cityCosts[cityCosts.length / 2]) / 2;
  const delta = s.expectedClaimCostPerExposureYear - median;
  $('profile-story').innerHTML = `<b>${esc(s.city)} ${type} · ${esc(read)}</b><span>${esc(top.peril)} represents ${fmt(share, 1)}% of expected claim cost (${money(top.expectedClaimCostPerExposureYear)} per year). Total expected claim cost is ${money(s.expectedClaimCostPerExposureYear)} per policy-year, ${delta >= 0 ? money(delta) + ' above' : money(-delta) + ' below'} the median of other cities.</span><small>This describes the company’s group of policies. It does not tell us this applicant’s personal or property-specific risk.</small>`;
  renderSignals(s);
  calculate();
}

function renderSignals(s) {
  const peerCosts = peersFor(s.city, s.product).map(x => x.expectedClaimCostPerExposureYear).sort((a, b) => a - b);
  const median = peerCosts.length % 2 ? peerCosts[(peerCosts.length - 1) / 2] : (peerCosts[peerCosts.length / 2 - 1] + peerCosts[peerCosts.length / 2]) / 2;
  const gap = s.expectedClaimCostPerExposureYear - median;
  $('signals-title').textContent = `${s.city} ${s.product} · what the data say`;
  $('signal-metrics').innerHTML = `<article><small>DATA SIZE</small><b>${fmt(s.exposureYears, 1)} policy-years</b><span>${money(s.policyRows)} policy rows in the sample</span></article><article><small>CLAIM FREQUENCY</small><b>${fmt(s.claimFrequencyPerExposureYear, 3)} / year</b><span>observed claims per policy-year</span></article><article><small>HISTORICAL LOSS RATIO</small><b>${fmt(s.lossRatioProxy * 100, 1)}%</b><span>claim-cost proxy ÷ earned premium</span></article><article class="${gap > 0 ? 'warm' : ''}"><small>CLAIM COST VS OTHER CITIES</small><b>${gap >= 0 ? '+' : '−'}${money(Math.abs(gap))}</b><span>per policy-year vs peer median</span></article>`;
  const total = s.expectedClaimCostPerExposureYear || 1;
  $('peril-signals').innerHTML = s.perils.slice(0, 4).map(p => {
    const share = p.expectedClaimCostPerExposureYear / total * 100;
    return `<article><div><small>${esc(p.peril.toUpperCase())}</small><b>${money(p.expectedClaimCostPerExposureYear)}<i>/year</i></b></div><span>${fmt(p.frequencyPerExposureYear, 3)} claims per policy-year · ${fmt(share, 1)}% of claim cost</span><div class="bar"><i style="width:${Math.max(0, Math.min(100, share))}%"></i></div></article>`;
  }).join('');
}

function calculate(event) {
  event?.preventDefault();
  const s = selected(); if (!s) return;
  const expense = Number($('expense').value) / 100;
  const margin = Number($('margin').value) / 100;
  const count = Math.max(1, Math.floor(Number($('volume').value) || 1));
  const competitor = Number($('market').value) || null;
  const loss = s.expectedClaimCostPerExposureYear;
  if (!Number.isFinite(expense) || !Number.isFinite(margin) || expense < 0 || margin < 0 || expense + margin >= 1) {
    $('outcome-title').textContent = 'Adjust the pricing scenario';
    $('outcome-reason').textContent = 'Expenses plus desired profit must be less than 100% of premium.';
    $('outcome-tag').textContent = 'CHECK INPUTS'; $('outcome-tag').className = 'tag attention';
    $('price').textContent = '—'; $('profit-one').textContent = '—'; $('gap').textContent = '—';
    $('long-run').innerHTML = ''; $('equation-content').innerHTML = '';
    return;
  }
  const price = loss / (1 - expense - margin);
  const annualResult = price * (1 - expense) - loss;
  const gap = competitor ? (price / competitor - 1) * 100 : null;
  const highLoss = s.lossRatioProxy > 1;
  let title, explanation, badge, next;
  if (highLoss) {
    title = 'Refer this profile for underwriting review'; badge = 'REVIEW';
    explanation = `This group’s historical claim-cost proxy was ${fmt(s.lossRatioProxy * 100, 1)}% of its earned premium. The price scenario may not fix its underlying loss pattern.`;
    next = 'Check the actual property, coverage and eligibility rules. Do not infer this applicant has the group average risk.';
  } else if (gap !== null && gap > 0) {
    title = 'Price is above the competitor quote'; badge = 'ABOVE MARKET';
    explanation = `The indicated price is ${fmt(gap, 1)}% higher than the competitor number you entered. First confirm the coverage and deductible match.`;
    next = 'Review the market difference and policy details with an underwriter.';
  } else {
    title = 'This profile can proceed to a quote review'; badge = 'QUOTE CANDIDATE';
    explanation = gap === null ? 'Add a same-coverage competitor quote to compare market position.' : `The indicated price is ${fmt(Math.abs(gap), 1)}% ${gap < 0 ? 'below' : 'above'} the competitor number you entered.`;
    next = 'Verify applicant facts and approved rating rules before offering terms.';
  }
  $('price').textContent = money(price);
  $('profit-one').textContent = safeMoney(annualResult * count);
  $('gap').textContent = gap === null ? 'Add quote' : `${gap > 0 ? '+' : ''}${fmt(gap, 1)}%`;
  $('outcome-title').textContent = title;
  $('outcome-reason').textContent = explanation;
  $('outcome-tag').textContent = badge;
  $('outcome-tag').className = `tag ${highLoss || (gap !== null && gap > 0) ? 'attention' : 'ready'}`;
  $('next-step').textContent = next;
  renderLongRun(s, price, expense, annualResult, count);
}

function renderLongRun(s, price, expense, annualResult, count) {
  const variance = s.compoundPoissonVariancePerExposureYear;
  const cells = [1, 5].map(years => {
    const expected = annualResult * count * years;
    const bound = Math.sqrt(variance * count * years / .05);
    return `<div><small>${years} ${years === 1 ? 'YEAR' : 'YEARS'} · ${count} similar ${count === 1 ? 'policy' : 'policies'}</small><b>${safeMoney(expected)}</b><span>expected underwriting result · broad 95% range ${safeMoney(expected - bound)} to ${safeMoney(expected + bound)}</span></div>`;
  }).join('');
  $('long-run').innerHTML = `<small>LONG-RUN VIEW</small><div class="long-grid">${cells}</div><p>More similar policies make the average more stable; a flood or storm can still affect many policies together.</p>`;
  $('equation-content').innerHTML = `<p><b>1 · Expected yearly claim cost</b><br/>Claim frequency (${fmt(s.claimFrequencyPerExposureYear, 3)} per policy-year) × average claim cost proxy = <b>${money(s.expectedClaimCostPerExposureYear)} units</b>. The cost proxy comes from this city and product’s supplied claims divided by estimated insured time.</p><p><b>2 · Indicated annual price</b><br/>Expected claim cost ÷ (1 − expense share − desired profit share)<br/>${money(s.expectedClaimCostPerExposureYear)} ÷ (1 − ${fmt(expense * 100, 1)}% − ${fmt(Number($('margin').value), 1)}%) = <b>${money(price)} units</b>.</p><p><b>3 · Expected profit over time</b><br/>similar policies × years × [annual price × (1 − expenses) − yearly claim cost]. The range uses compound-Poisson claim variation and Chebyshev’s broad 95% bound.</p><p class="equation-limit">This is expected underwriting contribution, not net profit. It excludes fixed operating costs, reinsurance, taxes, investment income and changing risk mix. Open claims use an estimate; final claim costs and currency are not supplied.</p>`;
}

async function load() {
  try {
    const response = await fetch('/api/insurance/experience', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not read the connected portfolio data.');
    experience = await response.json();
    const productOrder = ['Home', 'Auto'];
    const options = experience.segments.slice().sort((a, b) => productOrder.indexOf(a.product) - productOrder.indexOf(b.product) || cityOrder.indexOf(a.city) - cityOrder.indexOf(b.city));
    $('profile-select').innerHTML = options.map(s => {
      const { top, share, type } = profileLabel(s);
      return `<option value="${s.city}|${s.product}">${s.city} ${type} — ${top.peril.toLowerCase()} leads (${fmt(share, 0)}% of claim cost)</option>`;
    }).join('');
    $('data-state').textContent = 'Company data connected';
    $('data-period').textContent = `${experience.asOf} experience · five cities · Home + Auto`;
    $('profile-select').addEventListener('change', renderProfile);
    ['expense', 'margin', 'market', 'volume'].forEach(id => $(id).addEventListener('input', () => calculate()));
    $('quote-form').addEventListener('submit', calculate);
    renderProfile();
  } catch (error) {
    $('data-state').textContent = 'Data unavailable';
    $('data-period').textContent = error.message;
    $('outcome-title').textContent = 'Company data is needed first';
    $('outcome-reason').textContent = 'Connect policies.csv and claims.csv to build real example profiles.';
  }
}

load();
