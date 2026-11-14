const $=(s)=>document.querySelector(s);
const fmtNum=(v)=>Number(v||0).toLocaleString('en-CA');
const fmtAmount=(v)=>Number(v||0).toLocaleString('en-CA',{maximumFractionDigits:0});
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function runAnalysis(){
  const button=$('#run-analysis');button.disabled=true;button.textContent='Analyzing…';$('#data-status').textContent='READING LOCAL DATA';
  try{const r=await fetch('/api/insurance/analysis',{cache:'no-store'});if(!r.ok)throw new Error('Dataset analysis is unavailable.');const d=await r.json();render(d);$('#data-status').textContent='ANALYZED · LOCAL FILES';}
  catch(e){$('#data-status').textContent='DATA NEEDS CONFIGURATION';$('#observations').innerHTML='<div class="error-state">'+esc(e.message)+'</div>';$('#decisions').innerHTML='<div class="error-state">Set INSURANCE_DATA_DIR to the folder containing policies.csv and claims.csv, then restart the local app.</div>';}
  finally{button.disabled=false;button.textContent='↻ Run analysis';}
}

function render(d){
  $('#kpi-policies').textContent=fmtNum(d.summary.policyRows);$('#kpi-customers').textContent=fmtNum(d.summary.customers);$('#kpi-claims').textContent=fmtNum(d.summary.claimRecords);$('#kpi-profit').textContent='UNKNOWN';
  $('#finding-count').textContent=`${d.observations.length} SIGNALS`;$('#decision-count').textContent=`${d.decisions.length} MOVES`;
  $('#period-note').textContent=`Policies ${d.period.policyStart}–${d.period.policyEnd} · losses ${d.period.lossStart}–${d.period.lossEnd} · report dates through ${d.period.asOf}.`;
  renderObservations(d.observations);renderDecisions(d.decisions);renderCityComparison(d.cityHomeComparison);renderResearch(d.investigation);renderPerils(d.perils);renderRisk(d.byRisk);renderReadiness(d.readiness);renderQuality(d.quality);renderExternal(d.externalData);
}

function renderCityComparison(c){
  if(!c)return;
  const m=c.montreal,t=c.toronto;
  $('#city-gap-chip').textContent=`${c.claimCountPerPolicyRowRatio}× RAW GAP`;
  $('#city-comparison').innerHTML=`<div class="city-metric"><small>MONTREAL</small><b>${(m.claims/m.policyRows*100).toFixed(1)}<i> / 100</i></b><span>${fmtNum(m.claims)} claim records · ${fmtNum(m.policyRows)} policy rows · ${fmtNum(m.policiesWithClaims)} policies claimed</span></div><div class="city-versus">VS</div><div class="city-metric"><small>TORONTO</small><b>${(t.claims/t.policyRows*100).toFixed(1)}<i> / 100</i></b><span>${fmtNum(t.claims)} claim records · ${fmtNum(t.policyRows)} policy rows · ${fmtNum(t.policiesWithClaims)} policies claimed</span></div><div class="city-metric city-total"><small>REPORTED AMOUNT · UNSPECIFIED CURRENCY</small><b>${fmtAmount(m.reportedAmount)} <i>vs</i> ${fmtAmount(t.reportedAmount)}</b><span>Mean claim ${fmtAmount(m.meanReportedAmount)} vs ${fmtAmount(t.meanReportedAmount)}</span></div>`;
  const names=[...new Set([...m.perils.map(x=>x.label),...t.perils.map(x=>x.label)])];
  $('#city-perils').innerHTML=names.map(name=>{const a=m.perils.find(x=>x.label===name)?.claims||0,b=t.perils.find(x=>x.label===name)?.claims||0;return `<div class="city-peril"><span>${esc(name)}</span><b>${a} <i>M</i> · ${b} <i>T</i></b></div>`}).join('')+`<small class="city-year-note">Loss-year counts: 2025 ${m.yearly['2025'].claims} M / ${t.yearly['2025'].claims} T · 2026-to-date ${m.yearly['2026'].claims} M / ${t.yearly['2026'].claims} T.</small>`;
  const explainers=[['Exposure time','How many insured Home-years were actually at risk in each city?'],['Peril & timing','Does the difference concentrate in Water Damage, a particular season, or one event?'],['Property & cover','Do age, construction, basement, coverage limits, or deductibles differ?'],['Location match','Do postal-area weather and flood indicators explain any remaining gap?']];
  $('#city-questions').innerHTML=explainers.map(([a,b])=>`<div class="city-question"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')+`<div class="city-question city-next"><b>Next files to request</b><span>Coverage start/end, property attributes, postal code, limits/deductibles, and claim reserve history.</span></div>`;
}

function renderResearch(data){
  if(!data)return;
  $('#research-status').textContent=data.status;
  $('#research-cards').innerHTML=data.hypotheses.map((h,i)=>`<details class="research-card"><summary><span class="research-index">0${i+1}</span><b>${esc(h.name)}</b><span class="research-open">+</span></summary><div class="research-evidence"><div><small>SUPPORTS THE IDEA</small><p>${esc(h.supports)}</p></div><div><small>CHALLENGES IT</small><p>${esc(h.challenges)}</p></div><div><small>TEST AGAINST THIS PORTFOLIO</small><p>${esc(h.test)}</p></div><div class="source-ledger"><small>SOURCE SCOPE</small>${h.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><span>${esc(s.scope)}</span></p>`).join('')}</div></div></details>`).join('');
  $('#research-method-copy').textContent=data.method;
  $('#research-data-needed').innerHTML=data.dataNeeded.map(x=>`<span>${esc(x)}</span>`).join('');
}

function renderObservations(items){
  $('#observations').innerHTML=items.map((x,i)=>`<article class="observation-item"><button class="observation-toggle" aria-expanded="false" aria-controls="obs-${x.id}"><span class="obs-rank">${String(i+1).padStart(2,'0')}</span><span class="obs-copy"><small>${esc(x.confidence)}</small><b>${esc(x.title)}</b><em>${esc(x.finding)}</em></span><span class="obs-plus">+</span></button><div id="obs-${x.id}" class="obs-detail" hidden><div><small>EVIDENCE</small><p>${esc(x.evidence)}</p></div><div><small>LIMIT</small><p>${esc(x.caveat)}</p></div><div><small>WHY IT MATTERS</small><p>${esc(x.goal)}</p></div></div></article>`).join('');
  $('#observations').querySelectorAll('.observation-toggle').forEach(b=>b.addEventListener('click',()=>{const on=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!on));b.querySelector('.obs-plus').textContent=on?'+':'−';$('#'+b.getAttribute('aria-controls')).hidden=on;}));
}

function renderDecisions(items){
  $('#decisions').innerHTML=items.map((x,i)=>`<article class="decision-item"><header><small>${esc(x.priority)}</small><span>${String(i+1).padStart(2,'0')}</span></header><h3>${esc(x.title)}</h3><p class="decision-evidence">${esc(x.observation)}</p><div class="decision-action"><small>DO THIS</small><p>${esc(x.action)}</p></div><div class="decision-reason"><b>WHY</b><span>${esc(x.reason)}</span></div><div class="decision-goal"><small>GOAL · EXPECTED DIRECTION</small><p>${esc(x.expected)}</p></div><details class="decision-needs"><summary>Data needed to make it decision-grade</summary><ul>${x.needs.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></details><button class="queue-button">Add to review queue <span>↗</span></button></article>`).join('');
  $('#decisions').querySelectorAll('.queue-button').forEach(b=>b.addEventListener('click',()=>{b.disabled=true;b.innerHTML='Added to review queue <span>✓</span>';b.closest('.decision-item').classList.add('queued');}));
}

function renderPerils(perils){
  const max=Math.max(...perils.map(x=>x.reportedAmount),1);
  $('#peril-chart').innerHTML=perils.map((x,i)=>`<div class="bar-row"><div class="bar-label"><span>${esc(x.label)}</span><b>${fmtAmount(x.reportedAmount)}</b></div><div class="bar-track"><i style="width:${Math.max(3,x.reportedAmount/max*100)}%;--bar-color:${i<3?'#fa65d3':'#8d65ed'}"></i></div><small>${fmtNum(x.claims)} claims · avg amount ${fmtAmount(x.meanClaimAmount)}</small></div>`).join('');
}
function renderRisk(rows){const max=Math.max(...rows.map(x=>x.claimsPerPolicy),.01);$('#risk-chart').innerHTML=rows.map(x=>`<div class="bar-row"><div class="bar-label"><span>${esc(x.label)} risk</span><b>${x.claimsPerPolicy.toFixed(3)}</b></div><div class="bar-track"><i style="width:${x.claimsPerPolicy/max*100}%;--bar-color:${x.label==='High'?'#fa65d3':x.label==='Medium'?'#aa75f5':'#62d5ea'}"></i></div><small>${fmtNum(x.claims)} claim records / ${fmtNum(x.policies)} policy rows</small></div>`).join('');}
function renderReadiness(rows){$('#readiness').innerHTML=rows.map(x=>`<details class="readiness-row"><summary><span>${esc(x.name)}</span><b class="state-${x.status.toLowerCase()}">${esc(x.status)}</b></summary><p>${esc(x.why)}</p><div class="known"><small>HAVE</small><span>${x.known.map(esc).join(' · ')}</span></div><div class="missing"><small>NEED</small><span>${x.missing.map(esc).join(' · ')}</span></div></details>`).join('');}
function renderQuality(q){const rows=[['Duplicate claims',`${q.duplicate_claim_rows_removed} exact duplicate rows removed across ${q.duplicate_claim_groups} claim IDs`],['City names',`${q.city_labels_before} labels standardized to ${q.city_labels_after} places`],['Date order',`${q.claims_reported_before_loss} reported-before-loss records flagged for review`],['Missing profile values',`${q.policies_missing_age} ages missing · ${q.policies_age_zero} coded as zero`],['Premium completeness',`${q.policies_zero_annual_premium} policies have a zero annual premium`],['Claim amounts',`${q.claims_missing_amount} claim amount fields missing`],['Open claim payment fields',`${q.open_claims_missing_paid_amount} open / under-review claims have no paid amount yet`]];$('#quality-list').innerHTML=rows.map(([a,b])=>`<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('');}
function renderExternal(d){const links=[['ECCC weather history','https://climate.weather.gc.ca/historical_data/search_historic_data_e.html'],['NRCan flood-hazard program','https://natural-resources.canada.ca/science-data/science-research/natural-hazards/flood-mapping/flood-hazard-identification-mapping-program']];$('#external-data').innerHTML=d.useful.map((x,i)=>`<div class="external-row"><span>0${i+1}</span><p>${esc(x)}</p></div>`).join('')+`<div class="source-links">Possible official sources: ${links.map(([a,u])=>`<a href="${u}" target="_blank" rel="noreferrer">${a} ↗</a>`).join(' · ')}</div><p class="no-culture">${esc(d.notRecommended)}</p>`;}

$('#run-analysis').addEventListener('click',runAnalysis);runAnalysis();
