const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(v,d=0)=>Number(v||0).toLocaleString('en-CA',{maximumFractionDigits:d});
const money=v=>Number(v||0).toLocaleString('en-CA',{maximumFractionDigits:0});
const cityOrder=['Montreal','Toronto','Calgary','Ottawa','Quebec City'];
const climate={
  Montreal:{annual:7.0,january:-9.2,url:'https://climate.weather.gc.ca/climate_normals/results_1991_2020_e.html?climate_id=7025250&dispBack=0&lstProvince=&searchType=stnProv&txtCentralLatMin=0&txtCentralLatSec=0&txtCentralLongMin=0&txtCentralLongSec=0'},
  Toronto:{annual:8.6,january:-5.0,url:'https://climate.weather.gc.ca/climate_normals/results_1991_2020_e.html?climate_id=6158731&dispBack=0&lstProvince=&searchType=stnProv&txtCentralLatMin=0&txtCentralLatSec=0&txtCentralLongMin=0&txtCentralLongSec=0'},
  Calgary:{annual:4.5,january:-7.6,url:'https://climate.weather.gc.ca/climate_normals/results_1991_2020_e.html?climate_id=3031092&dispBack=0&lstProvince=AB&searchType=stnProv'},
  Ottawa:{annual:6.5,january:-10.0,url:'https://climate.weather.gc.ca/climate_normals/results_1991_2020_e.html?climate_id=6106000&dispBack=0&lstProvince=&searchType=stnProv&txtCentralLatMin=0&txtCentralLatSec=0&txtCentralLongMin=0&txtCentralLongSec=0'},
  'Quebec City':{annual:4.7,january:-11.9,url:'https://climate.weather.gc.ca/climate_normals/results_1991_2020_e.html?climate_id=7016294&dispBack=1&searchMethod=contains&searchType=stnName_1991&txtCentralLatMin=0&txtCentralLatSec=0&txtCentralLongMin=0&txtCentralLongSec=0&txtStationName_1991=quebec'},
};
const waterSources=[
  {title:'Canadian Climate Normals 1991–2020 · ECCC',url:'https://climate.weather.gc.ca/climate_normals/',scope:'Environment and Climate Change Canada · long-term station normals, not claim-date weather or freeze–thaw exposure.'},
  {title:'Why maintain Montréal’s waterworks?',url:'https://montreal.ca/en/articles/why-perform-maintenance-waterworks-system-20473',scope:'City of Montréal · updated 2021 · describes >9,000 km network, past maintenance deficit before 2000, and continuing hundreds of millions in annual investment. It does not link that history to this insurer’s home claims.'},
  {title:'Montréal infrastructure for heavy rainfall',url:'https://montreal.ca/en/articles/infrastructures-and-developments-designed-to-capture-and-absorb-heavy-rainfall-68389',scope:'City of Montréal · updated 2025 · describes sewer maintenance, retention basins and flood adaptation. City infrastructure mechanism, not portfolio claim attribution.'},
  {title:'Montréal heavy-rain building guidance',url:'https://montreal.ca/en/articles/protecting-your-building-heavy-rains-68382',scope:'City of Montréal · household mechanisms such as sewer backup, basement entry, backwater valves and sump pumps.'},
  {title:'Toronto basement-flooding guidance',url:'https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding/',scope:'City of Toronto · describes similar rain, sewer and basement pathways. This challenges a uniquely-Montréal mechanism.'},
  {title:'Extreme weather impacts on Canadian insurers',url:'https://www150.statcan.gc.ca/n1/pub/11-621-m/11-621-m2026007-eng.htm',scope:'Statistics Canada · national review: Toronto 2024 flood insured losses, a major Montréal watermain break, and Calgary water-main failures. City infrastructure incidents are not household claim counts.'},
  {title:'Québec construction seasonality',url:'https://www.ccq.org/en/En-tete/qui-sommes-nous/industrie-de-la-construction',scope:'Commission de la construction du Québec · province-wide construction activity is strongest April–October and weakest December–January; not evidence of home-repair provider shortage.'},
  {title:'ECCC historical climate data',url:'https://climate.weather.gc.ca/historical_data/search_historic_data_e.html',scope:'Environment and Climate Change Canada · daily/hourly observations can test freeze–thaw, rainfall and loss-date alignment at selected weather stations.'},
];
let report=null,experience=null,signal=null,allQueries=[];
const id=new URLSearchParams(location.search).get('id')||'';

function selectedExperience(city,product){return experience?.segments?.find(x=>x.city===city&&x.product===product);}
function getPerilExp(city,product,peril){return selectedExperience(city,product)?.perils?.find(x=>x.peril===peril);}
function getSignal(){return report?.citySignals?.find(x=>x.id===id)||report?.observations?.find(x=>x.id===id)||null;}

function renderHeader(){
  const city=signal.city||'Portfolio',product=signal.product||'ALL LINES',peril=signal.peril||'Cross-book';
  $('signal-kicker').textContent=`${city.toUpperCase()} · ${product.toUpperCase()} · ${peril.toUpperCase()} · SIGNAL ${signal.id}`;
  $('signal-title').textContent=signal.city?`${city}: ${peril} in ${product}`:signal.title;
  $('signal-summary').textContent=signal.finding;
  if(signal.city){
    $('signal-verdict').textContent=peril==='Water Damage'&&city==='Montreal'?'HIGH SIGNAL · CAUSE NOT SETTLED':'MEASURED PATTERN · TEST THE DRIVER';
    $('verdict-caveat').textContent=peril==='Water Damage'&&city==='Montreal'?'Montreal’s water rate stands out. Temperature, infrastructure and seasonality are candidate explanations—not yet the cause.':'This city has a measurable claims pattern. Compare exposure and peer cities before naming the cause.';
    $('signal-stats').innerHTML=`<article class="stat"><small>CLAIM RECORDS</small><b>${n(signal.claims)}</b><span>${esc(signal.peril)} in supplied rows</span></article><article class="stat"><small>POLICY ROWS</small><b>${n(signal.policyRows)}</b><span>not the same as insured years</span></article><article class="stat"><small>REPORTED AMOUNT</small><b>${money(signal.reportedAmount)}</b><span>currency unspecified</span></article><article class="stat"><small>RECORDS / 100 ROWS</small><b>${n(signal.claimsPer100Rows,1)}</b><span>screening ratio only</span></article>`;
  }else{
    $('signal-verdict').textContent=signal.confidence||'DESCRIPTIVE PATTERN';$('verdict-caveat').textContent=signal.caveat||'Observed association is not proof of cause.';
    $('signal-stats').innerHTML=`<article class="stat"><small>RANK</small><b>${n(signal.rank||'—')}</b><span>within current detection rules</span></article><article class="stat"><small>CONFIDENCE</small><b>${esc(signal.confidence||'SCREENING')}</b><span>evidence quality label</span></article><article class="stat"><small>SIGNAL</small><b>${esc(signal.title.split(' ').slice(0,3).join(' '))}</b><span>open the evidence trail below</span></article><article class="stat"><small>BUSINESS GOAL</small><b>TEST FIRST</b><span>measure before changing price</span></article>`;
  }
}

function renderLenses(){
  const c=signal.city,p=signal.product,peril=signal.peril;
  if(signal.city){
    const monthly=signal.monthlyClaims||[],peak=[...monthly].sort((a,b)=>b.claims-a.claims)[0];
    const exp=getPerilExp(c,p,peril),annual=exp?.frequencyPerExposureYear;
    const claimsLens=annual!==undefined?`After the 12-month start-date exposure assumption and excluding broker B07, the estimated rate is ${n(annual,3)} claims per property-year. The assumption is not verified by policy end dates.`:`The raw ratio is ${n(signal.claimsPer100Rows,1)} claims per 100 policy rows; it is not an annual frequency.`;
    $('lenses').innerHTML=`<article class="lens"><small>01 · AMOUNT LENS</small><b>“Where did the reported dollars collect?”</b><p>${n(signal.shareOfCityReportedAmount,1)}% of ${c} ${p} claim amount is tagged ${peril}; ${money(signal.reportedAmount)} units. Reported amount is not ultimate loss or profit.</p></article><article class="lens"><small>02 · FREQUENCY LENS</small><b>“Does this happen more often?”</b><p>${claimsLens} Frequency and severity must stay separate.</p></article><article class="lens"><small>03 · TIME LENS</small><b>“When does it cluster?”</b><p>${peak?.claims?`${n(peak.claims)} claims fell in ${new Date(2000,+peak.month-1,1).toLocaleString('en-CA',{month:'long'})}, the busiest month in this extract.`:'No single month stands out yet.'} Month counts alone do not identify weather or repair causes.</p></article>`;
  }else{
    $('lenses').innerHTML=`<article class="lens"><small>OBSERVATION</small><b>What the file shows</b><p>${esc(signal.finding||'')}</p></article><article class="lens"><small>LIMIT</small><b>What remains uncertain</b><p>${esc(signal.caveat||'The extract does not provide enough context to establish a cause.')}</p></article><article class="lens"><small>GOAL</small><b>What would make this actionable?</b><p>${esc(signal.goal||'Compare outcomes after collecting the missing exposure, cost and segment fields.')}</p></article>`;
  }
}

function renderPeers(){
  const city=signal.city||'Montreal',product=signal.product||'Home',peril=signal.peril||'Water Damage';
  $('peer-title').textContent=`${product} · ${peril} across all cities`;
  const rows=cityOrder.map(name=>{
    const raw=report.citySignals.find(x=>x.city===name&&x.product===product&&x.peril===peril);
    const rate=getPerilExp(name,product,peril);
    return `<tr class="${name===city?'selected':''}"><td>${esc(name)}</td><td>${raw?`${n(raw.claims)} / ${n(raw.policyRows)}`:'—'}</td><td>${raw?`${n(raw.claimsPer100Rows,1)} / 100`:'—'}</td><td>${rate?`${n(rate.frequencyPerExposureYear,3)} / year`:'—'}</td><td>${rate?money(rate.expectedClaimCostPerExposureYear):'—'}</td><td>${rate?n(rate.claims):'—'}</td></tr>`;
  }).join('');
  $('peer-table').innerHTML=`<div class="table-wrap"><table><thead><tr><th>CITY</th><th>CLAIMS / POLICY ROWS</th><th>RAW RATE</th><th>EST. RATE*</th><th>EST. CLAIM COST / YEAR*</th><th>B07-EXCLUDED CLAIMS*</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  $('peer-note').textContent='*Estimated exposure and incurred proxy; broker B07 excluded consistently from all city segments. 12-month term is assumed, canceled policies are treated as full exposure, claim ultimate is not known. Raw values include all records and remain a screening ratio.';
}

function renderSeason(){
  if(!signal.city){$('season-panel').hidden=true;return;}
  const vals=signal.monthlyClaims||[],max=Math.max(1,...vals.map(x=>x.claims));
  const months=vals.map(x=>new Date(2000,+x.month-1,1).toLocaleString('en-CA',{month:'short'}));
  $('season-chart').innerHTML=`<div class="month-grid">${vals.map((x,i)=>`<div class="month" title="${months[i]} · ${x.claims} claims · ${money(x.reportedAmount)} reported amount"><i style="height:${Math.max(3,x.claims/max*82)}px"></i><b>${months[i]}</b><span>${x.claims}</span></div>`).join('')}</div>`;
}

function median(values){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;}
function renderExperience(){
  if(!signal.city){$('experience-panel').hidden=true;return;}
  const seg=selectedExperience(signal.city,signal.product),peril=getPerilExp(signal.city,signal.product,signal.peril);
  if(!seg){$('experience-content').innerHTML='<div class="loading">No comparable exposure experience was found for this city and product.</div>';return;}
  const peerCosts=cityOrder.filter(c=>c!==signal.city).map(c=>getPerilExp(c,signal.product,signal.peril)?.expectedClaimCostPerExposureYear).filter(Number.isFinite);
  const peerMedian=median(peerCosts),excessPerYear=peril&&peerMedian!==null?peril.expectedClaimCostPerExposureYear-peerMedian:null;
  const excessObserved=excessPerYear===null?null:excessPerYear*seg.exposureYears;
  $('experience-content').innerHTML=`<div class="economics-top"><article class="econ-card"><small>EST. ANNUAL PREMIUM / PROPERTY-YEAR</small><b>${money(seg.earnedPremiumPerExposureYear)}</b><span>earned premium proxy; currency unspecified</span></article><article class="econ-card"><small>ALL-PERIL EXPECTED CLAIM COST</small><b>${money(seg.expectedClaimCostPerExposureYear)}</b><span>per exposure-year</span></article><article class="econ-card"><small>LOSS-RATIO PROXY</small><b>${n(seg.lossRatioProxy,2)}</b><span>incurred proxy ÷ earned premium proxy</span></article><article class="econ-card"><small>CONTRIBUTION BEFORE EXPENSES</small><b>${seg.contributionBeforeExpensesPerExposureYear<0?'−':''}${money(Math.abs(seg.contributionBeforeExpensesPerExposureYear))}</b><span>premium less claim proxy only</span></article></div>
  <div class="economics-summary"><div class="econ-table"><div class="table-wrap"><table><thead><tr><th>PERIL</th><th>CLAIMS / YEAR*</th><th>CLAIM COST / YEAR*</th><th>SHARE OF EXPECTED CLAIM COST</th></tr></thead><tbody>${seg.perils.map(x=>`<tr class="${x.peril===signal.peril?'selected':''}"><td>${esc(x.peril)}</td><td>${n(x.frequencyPerExposureYear,3)}</td><td>${money(x.expectedClaimCostPerExposureYear)}</td><td>${seg.expectedClaimCostPerExposureYear? n(x.expectedClaimCostPerExposureYear/seg.expectedClaimCostPerExposureYear*100,1):'—'}%</td></tr>`).join('')}</tbody></table></div><p class="method">*Estimated from exposure and incurred proxy. ${excessObserved!==null?`Against the median of the other city rates, this peril’s excess-cost screen is ${excessObserved<0?'below peers by ':'above peers by '}${money(Math.abs(excessObserved))} units across ${n(seg.exposureYears,1)} estimated exposure-years.`:'Peer cost comparison unavailable.'} This is a comparison estimate, not proof that geography caused the loss.</p></div>
  <aside class="assumption-box"><small>LONG-RUN SCENARIO · NOT A FORECAST</small><p>Repeat the observed city/product experience across comparable exposure-years to see how the average contribution scales.</p><label>Number of comparable property-years<input id="book-size" type="number" min="1" step="1" value="1000" /></label><label>Expense ratio (% of premium) · optional<input id="expense-ratio" type="number" min="0" max="100" step="0.1" placeholder="leave blank to exclude expenses" /></label><div id="math-result" class="math-result"></div></aside></div>
  <p class="method">*Exposure = min(1 year, time from policy start to 2026-10-31); broker B07 excluded. Incurred proxy: paid claims use paid amount, denied = 0, open claims estimated by same-peril paid-to-reported ratio. No claim reserves/IBNR, LAE, expenses, reinsurance or investment income in source. Law of large numbers only stabilizes a comparable, independent book; catastrophe losses can move together. Chebyshev bound is a deliberately broad 95% deviation bound, not a probability forecast.</p>`;
  const inputs=['book-size','expense-ratio'];inputs.forEach(x=>$(x).addEventListener('input',()=>updateMath(seg)));
  updateMath(seg);
}
function updateMath(seg){
  const count=Number($('book-size').value),rawExpense=$('expense-ratio').value.trim(),expense=rawExpense===''?0:Number(rawExpense)/100;
  if(!Number.isFinite(count)||count<1||!Number.isFinite(expense)||expense<0||expense>=1){$('math-result').textContent='Enter a valid number of exposure-years and an expense ratio below 100%.';return;}
  const expectedPer=seg.earnedPremiumPerExposureYear*(1-expense)-seg.expectedClaimCostPerExposureYear;
  const expected=count*expectedPer;
  const variance=count*seg.compoundPoissonVariancePerExposureYear;
  const bound=Math.sqrt(variance/0.05);
  $('math-result').innerHTML=`For <b>${n(count)}</b> comparable policy-years: expected contribution ${expected<0?'−':''}<b>${money(Math.abs(expected))}</b> ${expense?'after the entered expense ratio':'before expenses'}. Approx. Chebyshev band: ${expected-bound<0?'−':''}${money(Math.abs(expected-bound))} to ${expected+bound<0?'−':''}${money(Math.abs(expected+bound))}. Water excess vs peer median over the observed period: <b>${(()=>{const peers=cityOrder.filter(c=>c!==signal.city).map(c=>getPerilExp(c,signal.product,signal.peril)?.expectedClaimCostPerExposureYear).filter(Number.isFinite);const med=median(peers),p=getPerilExp(signal.city,signal.product,signal.peril);return p&&med!==null?money(Math.max(0,(p.expectedClaimCostPerExposureYear-med)*seg.exposureYears)):'—';})()}</b> units.</div>`;
}

function sourcesFor(){
  if(signal.peril==='Water Damage')return waterSources;
  const base=report?.investigation?.hypotheses?.flatMap(h=>h.sources||[])||[];
  return base.length?base.map(s=>({title:s.label,url:s.url,scope:s.scope})):waterSources.filter(s=>s.title.includes('Statistics Canada')||s.title.includes('ECCC'));
}
function renderHypotheses(){
  if(signal.city&&signal.peril==='Water Damage'){
    const normals=cityOrder.map(c=>`${c} ${climate[c].annual.toFixed(1)}°C annual mean, ${climate[c].january.toFixed(1)}°C January`).join(' · ');
    const selected=signal.city, rate= getPerilExp(selected,signal.product,signal.peril)?.frequencyPerExposureYear;
    const cards=[
      {title:'Freeze–thaw and cold',support:`ECCC 1991–2020 airport normals: ${normals}. ${selected} has an estimated ${n(rate,3)} water claims/property-year in this portfolio (B07 excluded).`,challenge:'Annual average is not pipe-freeze exposure. Montreal is colder than Toronto on annual mean, but warmer than Calgary, Ottawa and Quebec City; those colder peers have lower observed water rates in this extract. Temperature alone cannot explain the city ranking.',test:'Match each insured location and claim date to daily temperature, freeze–thaw crossings and precipitation. Compare building plumbing, basement, mitigation and insured-years.',sources:['climate']},
      {title:'Municipal water / sewer maintenance and breakage',support:'Montréal reports a pre-2000 water-network maintenance deficit and describes an ongoing program across its water and sewer networks; its city guidance explains how sewer backup and heavy rainfall can affect buildings.',challenge:'The City also reports large ongoing investments and regular maintenance. A municipal water-main break is not the same thing as an insured home water claim, and the CSV has no water-cause subtype or location.',test:'Join insurer loss dates and postal areas to municipal main breaks, sewer backup/overflow events, property-side pipe failures, basement entry and claim severity. Compare the same definitions in every city.',sources:['maintenance','heavy','statscan']},
      {title:'A shorter construction / repair season',support:'CCQ reports Québec outdoor construction activity is strongest April–October and weakest December–January. Montreal water claims in this file cluster in March–May and October.',challenge:'CCQ describes provincial construction activity, not the availability of home-repair companies or abandoned/uncovered jobs in Montreal. Claims timing is not repair timing.',test:'Collect first-discovery, mitigation-start, contractor-booked and repair-complete dates; compare delay and severity in all five cities.',sources:['season']},
      {title:'Rain, drainage, older properties and urban form',support:'Montreal’s heavy-rain guidance describes sewer overload, backflow and basement protection as real mechanisms. These are plausible property loss pathways.',challenge:'Toronto’s city guidance describes many of the same pathways, and Statistics Canada documents severe insured flood impacts in Toronto too. The portfolio’s Montreal-only excess is not explained by a shared hazard alone.',test:'Link loss dates and postal-area exposure to rainfall, sewer overflow, building age/type, basement, imperviousness, backwater valve and sump protection. Model frequency and severity separately.',sources:['heavy','toronto','eccc']},
      {title:'Not just one city-wide mix effect',support:'The Montreal/Toronto water difference persists in the prior analysis within recorded risk bands, deductible, channel and start cohorts; Quebec City is much colder but shows lower water frequency.',challenge:'The source lacks property age, insured postal area, verified policy end dates, coverage, claim cause, repair timing and mature ultimate cost. Residual confounding remains.',test:'Rebuild an exposure-weighted, property-matched city comparison. Then check if the difference survives a later-period holdout.',sources:['climate','statscan']},
    ];
    const sourceMap={climate:waterSources[0],maintenance:waterSources[1],heavy:waterSources[2],statscan:waterSources[5],season:waterSources[6],toronto:waterSources[4],eccc:waterSources[7]};
    return cards.map(h=>({...h,sourceRefs:h.sources.map(key=>sourceMap[key]).filter(Boolean)}));
  }
  const existing=report?.investigation?.hypotheses||[];
  return existing.map(h=>({title:h.name,support:h.supports,challenge:h.challenges,test:h.test,sourceRefs:(h.sources||[]).map(s=>({title:s.label,url:s.url,scope:s.scope}))}));
}
function renderResearch(){
  const sourceMap={climate:waterSources.find(s=>s.title.includes('ECCC historical')),maintenance:waterSources[0],heavy:waterSources[1],statscan:waterSources[4],season:waterSources[5],toronto:waterSources[3],eccc:waterSources[6]};
  const hypotheses=renderHypotheses();
  $('hypotheses').innerHTML=hypotheses.map(h=>`<details class="hypothesis"><summary>${esc(h.title)}</summary><div class="hypo-body"><div class="evidence-block"><small>SUPPORTS THE IDEA · NOT PROOF</small><p>${esc(h.support)}</p></div><div class="evidence-block"><small>CHALLENGES IT</small><p class="challenge">${esc(h.challenge)}</p></div><div class="evidence-block"><small>TEST THAT COULD CONFIRM OR REJECT IT</small><p>${esc(h.test)}</p></div><div class="evidence-block"><small>SOURCES · READ THEIR SCOPE</small><div class="sources">${(h.sourceRefs||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('')}</div></div></div></details>`).join('');
  const city=signal.city||'Montreal',peril=signal.peril||'water damage',prod=signal.product||'Home';
  const queries=[
    `${city} ${peril} ${prod} insurance claims causes frequency statistics Canada`,
    `ECCC 1991-2020 climate normals ${cityOrder.join(' ')} mean temperature freeze thaw`,
    `${city} water sewer infrastructure maintenance backlog breaks flooding official report`,
    `${city} residential basement water damage freeze thaw pipes plumbing research Canada`,
    `${city} construction season residential maintenance repair contractor availability data`,
    `${city} rainfall sewer backup flood insurance claims versus ${cityOrder.filter(x=>x!==city).join(' ')}`,
    `site:statcan.gc.ca ${city} insured flood damage water infrastructure Canada`,
  ];
  allQueries=queries;
  $('queries').innerHTML=queries.map(q=>`<div class="query"><span>${esc(q)}</span><a href="https://www.google.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">SEARCH ↗</a></div>`).join('');
  const prompt=`Investigate this insurance signal as a research analyst.\n\nObserved signal: ${signal.finding}\nCity: ${city}; product: ${prod}; peril: ${peril}.\n\nFind primary, academic, insurer, and local reporting sources. Search for temperature normals, freeze-thaw, rain, sewer/water infrastructure, maintenance funding, construction/repair seasonality, contractor capacity, building age/plumbing, and claim reporting. Compare all five portfolio cities with the same definitions. For every source, capture title, URL, publication date, geography, study period, metric, method, finding, limits, and whether it supports or challenges each explanation. Do not treat municipal pipe breaks as private-home claims or population statistics as insured risk.\n\nCSV evidence: ${signal.evidence||signal.finding}\nLimit: ${signal.caveat||'Exposure, ultimate costs and property causes are not fully known.'}\n\nReturn: (1) measured pattern, (2) competing explanations, (3) evidence for and against, (4) strongest falsification test, (5) missing insurer fields, (6) impact on long-run expected loss and uncertainty, (7) a conditional decision. No causal conclusion without matched insurer evidence.`;
  $('copy-prompt').onclick=async()=>{try{await navigator.clipboard.writeText(prompt);$('copy-prompt').textContent='BRIEF COPIED ✓';setTimeout(()=>$('copy-prompt').textContent='COPY RESEARCH BRIEF',1800);}catch{$('copy-prompt').textContent='COPY NOT AVAILABLE';}};
  loadSavedSources();
  const form=$('source-form');form.onsubmit=e=>{e.preventDefault();const url=$('source-url').value.trim();try{if(new URL(url).protocol!=='https:')throw new Error();}catch{$('source-url').setCustomValidity('Use a valid https:// source link.');$('source-url').reportValidity();return;}$('source-url').setCustomValidity('');const entry={title:$('source-title').value.trim(),url,note:$('source-note').value.trim(),savedAt:new Date().toISOString()};const key=`signal-sources:${id}`,saved=JSON.parse(localStorage.getItem(key)||'[]');saved.unshift(entry);localStorage.setItem(key,JSON.stringify(saved));form.reset();loadSavedSources();};
  $('saved-sources').innerHTML='';
}
function loadSavedSources(){
  const saved=JSON.parse(localStorage.getItem(`signal-sources:${id}`)||'[]');
  $('saved-sources').innerHTML=saved.map(s=>`<article class="saved-source"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><p>${esc(s.note)}</p></article>`).join('');
}

function renderVerdict(){
  if(signal.city&&signal.peril==='Water Damage'&&signal.city==='Montreal'){
    const exp=getPerilExp('Montreal','Home','Water Damage');
    const peer=cityOrder.filter(c=>c!=='Montreal').map(c=>getPerilExp(c,'Home','Water Damage')?.frequencyPerExposureYear).filter(Number.isFinite);
    $('verdict-grid').innerHTML=`<article class="verdict-card"><small>WHAT IS HAPPENING</small><b>Water is Montreal Home’s standout frequency signal</b><p>${n(exp?.frequencyPerExposureYear,3)} estimated water claims per property-year vs lower rates in all four peer cities. The rate uses a start-date exposure assumption; it is not a verified actuarial frequency.</p></article><article class="verdict-card"><small>WHAT MAY EXPLAIN IT</small><b>Several mechanisms can stack together</b><p>Freeze–thaw, sewer capacity, municipal / property-pipe maintenance, building age and repair timing are plausible. Public sources confirm some mechanisms exist, but not that they caused this portfolio pattern.</p></article><article class="verdict-card"><small>WHAT THE DATA SAY TO DO</small><b>Test matched causes before a rate change</b><p>Join claim dates and postal areas to weather, pipe incidents and property features. Track the expected loss after mitigation; the file does not yet prove actual profit or a cause.</p></article>`;
  }else{
    const goal=signal.goal||'Gather the missing fields, then compare the same measure across cities and time.';
    $('verdict-grid').innerHTML=`<article class="verdict-card"><small>OBSERVED</small><b>${esc(signal.title)}</b><p>${esc(signal.finding||'')}</p></article><article class="verdict-card"><small>LIMIT</small><b>Do not turn association into cause</b><p>${esc(signal.caveat||'The supplied files do not establish why the pattern occurs.')}</p></article><article class="verdict-card"><small>NEXT DECISION</small><b>Collect the evidence that would change the decision</b><p>${esc(goal)}</p></article>`;
  }
}

async function load(){
  try{
    const [r1,r2]=await Promise.all([fetch('/api/insurance/analysis',{cache:'no-store'}),fetch('/api/insurance/experience',{cache:'no-store'})]);
    if(!r1.ok)throw new Error('CSV analysis is not connected.');report=await r1.json();experience=r2.ok?await r2.json():null;signal=getSignal();
    if(!signal)throw new Error('This signal is unavailable. Return to the signal list and choose another.');
    renderHeader();renderLenses();renderPeers();renderSeason();renderExperience();renderResearch();renderVerdict();
  }catch(e){$('signal-title').textContent='Signal could not be loaded';$('signal-summary').textContent=e.message;$('signal-verdict').textContent='DATA NOT AVAILABLE';$('verdict-caveat').textContent='Open the signal list and confirm the local CSV directory is configured.';}
}
load();
