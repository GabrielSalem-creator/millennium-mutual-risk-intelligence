// Transparent insurance analytics for the Millennium Mutual hackathon dataset.
// This is an exploratory prototype, not a reserving or rate-filing model.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function parseCSV(text) {
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;continue;}
    if(ch==='"'){quoted=true;continue;}
    if(ch===','){row.push(field);field='';continue;}
    if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(field);field='';
      if(row.some((v)=>v!==''))rows.push(row);
      row=[];continue;
    }
    field+=ch;
  }
  if(field!==''||row.length){row.push(field);rows.push(row);}
  const headers=(rows.shift()||[]).map((x)=>x.replace(/^\uFEFF/, '').trim());
  return rows.map((values)=>Object.fromEntries(headers.map((h,i)=>[h,h==='city'?(values[i]||''):(values[i]||'').trim()])));
}

const number=(v)=>v===null||v===undefined||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
export function parseDate(value){
  const s=String(value||'').trim();if(!s)return null;
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)return new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));
  return null;
}
const dateText=(d)=>d?d.toISOString().slice(0,10):null;
const round=(x,d=2)=>Number.isFinite(x)?Number(x.toFixed(d)):null;
const mean=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const median=(xs)=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const sum=(xs)=>xs.reduce((a,b)=>a+b,0);
const dollars=(x)=>round(x,2);
const percent=(x)=>round(x*100,1);
const countBy=(rows,key)=>rows.reduce((m,r)=>(m.set(key(r),(m.get(key(r))||0)+1),m),new Map());

function canonicalCity(value){
  const normalized=String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  if(['toronto','toronto city'].includes(normalized))return 'Toronto';
  if(['montreal','mtl'].includes(normalized))return 'Montreal';
  if(['quebec city','quebec','qc city'].includes(normalized))return 'Quebec City';
  if(normalized==='ottawa')return 'Ottawa';
  if(normalized==='calgary')return 'Calgary';
  return normalized.replace(/\b\w/g,(x)=>x.toUpperCase());
}

function datasetReadiness(policies,claims,quality){
  return [
    {id:'profit',name:'Why profit is low',status:'BLOCKED',known:['annual premium field','claim amount and paid amount'],missing:['earned premium by accounting period','policy exposure / coverage end dates','case reserves + IBNR + loss-adjustment expense','acquisition and operating expenses / commissions','reinsurance and investment income'],why:'A written annual premium total and partial claim totals do not equal underwriting profit.'},
    {id:'loss-ratio',name:'Loss ratio by product / segment',status:'BLOCKED',known:['annual premium and claim records can be grouped'],missing:['earned premium for the same accident/underwriting period','ultimate incurred loss and loss-adjustment expense','coverage-level exposure and limits'],why:'The claim and policy windows overlap, but annual premium is not earned premium and open claims are not ultimate losses.'},
    {id:'frequency',name:'Claim frequency and pure premium',status:'PARTIAL',known:['policy start dates','claim loss dates','policy and claim IDs'],missing:['coverage end / cancellation effective dates','earned exposure units (vehicle-years, insured property-years, coverage)'],why:'Counts per policy row are useful screening signals, not exposure-adjusted rates.'},
    {id:'severity',name:'Claim severity by peril / line',status:'PARTIAL',known:['claim type','claim amount','paid amount','claim status'],missing:['9 claim amounts','case reserves and ultimate development','coverage limits, deductibles, recovery/subrogation, inflation basis'],why:'Use as reported amount descriptions only; it is not a final cost estimate.'},
    {id:'claims-ops',name:'Claims handling time',status:'PARTIAL',known:['reported and closed dates','adjuster team','claim type and amount'],missing:['adjuster workload / assignment history','severity and complexity controls','customer outcomes and reopen/escalation events'],why:'Team speed comparisons can be confounded by assignment mix.'},
    {id:'retention',name:'Renewal / cancellation drivers',status:'PARTIAL',known:['renewal status','customer and policy IDs'],missing:['renewal dates and offered premium changes','cancellation/nonrenewal reasons','quote/competitor outcome and customer contact history'],why:'Status counts do not explain why customers left or establish a cohort retention rate.'},
    {id:'regional-risk',name:'Weather / theft / local peril pricing',status:'PARTIAL',known:['city field and claim loss date'],missing:['postal/FSA or geocoded insured location','vehicle/property characteristics and coverage','consistent territory definitions','licensed and time-matched external hazard data'],why:'City-level aggregates are too broad for a pricing change; use verified exposure denominators.'},
  ];
}

function dataQuality(policies,rawClaims,claims){
  const rawClaimIds=countBy(rawClaims,r=>r.claim_id);
  const exactDuplicateGroups=[...rawClaimIds].filter(([,n])=>n>1).length;
  const conflictIds=[];
  const claimGroups=new Map();for(const c of rawClaims){const a=claimGroups.get(c.claim_id)||[];a.push(c);claimGroups.set(c.claim_id,a);}
  for(const [id,group] of claimGroups){if(new Set(group.map(r=>JSON.stringify(Object.entries(r).sort()))).size>1)conflictIds.push(id);}
  const rawCities=new Set(policies.map(p=>p.city));const canonicalCities=new Set(policies.map(p=>canonicalCity(p.city)));
  const lossBeforeReport=claims.filter(c=>parseDate(c.reported_date)<parseDate(c.loss_date)).length;
  const closedBeforeReport=claims.filter(c=>c.closed_date&&parseDate(c.closed_date)<parseDate(c.reported_date)).length;
  const missingAge=policies.filter(p=>number(p.customer_age)===null).length;
  const zeroAge=policies.filter(p=>number(p.customer_age)===0).length;
  const zeroPremium=policies.filter(p=>number(p.annual_premium)===0).length;
  const missingClaimAmount=claims.filter(c=>number(c.claim_amount)===null).length;
  const pending=claims.filter(c=>['Open','Under Review'].includes(c.status));
  const missingPaidPending=pending.filter(c=>number(c.paid_amount)===null).length;
  return {
    duplicate_claim_groups:exactDuplicateGroups,duplicate_claim_rows_removed:rawClaims.length-claims.length,conflicting_claim_ids:conflictIds.length,
    city_labels_before:rawCities.size,city_labels_after:canonicalCities.size,city_variants_collapsed:rawCities.size-canonicalCities.size,
    policies_missing_age:missingAge,policies_age_zero:zeroAge,policies_zero_annual_premium:zeroPremium,
    claims_missing_amount:missingClaimAmount,claims_reported_before_loss:lossBeforeReport,claims_closed_before_report:closedBeforeReport,
    open_claims_missing_paid_amount:missingPaidPending,
    automation:[`Removed ${rawClaims.length-claims.length} exact duplicate claim rows by claim_id.`,`Standardized ${rawCities.size} city labels to ${canonicalCities.size} canonical labels.`,`Flagged ${lossBeforeReport} claims reported before recorded loss date; left them unchanged for review.`],
  };
}

export function chebyshevRequiredSample(variance,absoluteError,confidence=0.95){
  if(!(variance>=0)||!(absoluteError>0)||!(confidence>0&&confidence<1))return null;
  const alpha=1-confidence;return Math.ceil(variance/(alpha*absoluteError*absoluteError));
}
export function compoundPoissonSummary(lambda,meanSeverity,varianceSeverity){
  if([lambda,meanSeverity,varianceSeverity].some(x=>!(x>=0)))return null;
  return {expectedAggregateLoss:lambda*meanSeverity,aggregateLossVariance:lambda*(varianceSeverity+meanSeverity**2)};
}

export async function analyzeInsuranceDataset(directory){
  if(!directory)throw new Error('Set INSURANCE_DATA_DIR to the folder containing policies.csv and claims.csv.');
  const [policyText,claimText]=await Promise.all([readFile(join(directory,'policies.csv'),'utf8'),readFile(join(directory,'claims.csv'),'utf8')]);
  const policies=parseCSV(policyText);const rawClaims=parseCSV(claimText);
  if(!policies.length||!rawClaims.length)throw new Error('The selected insurance files contain no data rows.');

  const byId=new Map();for(const c of rawClaims){const old=byId.get(c.claim_id);if(!old)byId.set(c.claim_id,c);else if(JSON.stringify(Object.entries(old).sort())!==JSON.stringify(Object.entries(c).sort()))throw new Error(`Conflicting duplicate claim_id ${c.claim_id}; needs human review.`);}
  const claims=[...byId.values()];
  const policyById=new Map(policies.map(p=>[p.policy_id,p]));
  const unmatched=claims.filter(c=>!policyById.has(c.policy_id)).length;
  const quality=dataQuality(policies,rawClaims,claims);
  const policyCustomerTypes=new Map();for(const p of policies){const s=policyCustomerTypes.get(p.customer_id)||new Set();s.add(p.policy_type);policyCustomerTypes.set(p.customer_id,s);}
  const bothLines=[...policyCustomerTypes.values()].filter(s=>s.has('Auto')&&s.has('Home')).length;
  const claimsByPolicy=new Map();for(const c of claims){claimsByPolicy.set(c.policy_id,(claimsByPolicy.get(c.policy_id)||0)+1);}
  const claimAmount=claims.map(c=>number(c.claim_amount)).filter(x=>x!==null);
  const paidAmount=claims.map(c=>number(c.paid_amount)).filter(x=>x!==null);
  const policyTypes=[...new Set(policies.map(p=>p.policy_type))].sort();
  const byProduct=policyTypes.map(type=>{
    const ps=policies.filter(p=>p.policy_type===type);const ids=new Set(ps.map(p=>p.policy_id));const cs=claims.filter(c=>ids.has(c.policy_id));const amounts=cs.map(c=>number(c.claim_amount)).filter(x=>x!==null);
    return {label:type,policies:ps.length,claims:cs.length,claimFrequencyPerPolicy:round(cs.length/ps.length,3),reportedClaimAmount: dollars(sum(amounts)),meanClaimAmount:dollars(mean(amounts)),writtenAnnualPremium:dollars(sum(ps.map(p=>number(p.annual_premium)||0))),customersWithClaim:new Set(cs.map(c=>policyById.get(c.policy_id)?.customer_id).filter(Boolean)).size};
  });
  const riskBands=['Low','Medium','High'];
  const byRisk=riskBands.map(risk=>{const ps=policies.filter(p=>p.risk_band===risk);const ids=new Set(ps.map(p=>p.policy_id));const cs=claims.filter(c=>ids.has(c.policy_id));return{label:risk,policies:ps.length,claims:cs.length,claimsPerPolicy:round(cs.length/ps.length,3),policiesWithAnyClaim:new Set(cs.map(c=>c.policy_id)).size};});
  const perils=[...new Set(claims.map(c=>c.claim_type))].map(type=>{const cs=claims.filter(c=>c.claim_type===type);const amts=cs.map(c=>number(c.claim_amount)).filter(x=>x!==null);return{label:type,claims:cs.length,reportedAmount:dollars(sum(amts)),meanClaimAmount:dollars(mean(amts)),shareOfReportedAmount:sum(amts)/sum(claimAmount)};}).sort((a,b)=>b.reportedAmount-a.reportedAmount);
  const statuses={};for(const c of claims)statuses[c.status]=(statuses[c.status]||0)+1;
  const latestReport=claims.map(c=>parseDate(c.reported_date)).filter(Boolean).sort((a,b)=>b-a)[0]||null;
  const open=claims.filter(c=>['Open','Under Review'].includes(c.status));
  const ages=open.map(c=>(latestReport-parseDate(c.reported_date))/86400000).filter(Number.isFinite);
  const olderThan90=ages.filter(x=>x>90).length;
  const teamCycle=['Team A','Team B','Team C'].map(team=>{const cs=claims.filter(c=>c.adjuster_team===team&&c.closed_date);const days=cs.map(c=>(parseDate(c.closed_date)-parseDate(c.reported_date))/86400000).filter(Number.isFinite);return{label:team,closedClaims:days.length,medianDays:round(median(days),1),meanDays:round(mean(days),1),p90Days:days.length?days.sort((a,b)=>a-b)[Math.floor((days.length-1)*.9)]:null};});
  const notRenewed=policies.filter(p=>p.renewal_status==='Not Renewed').length;const renewed=policies.filter(p=>p.renewal_status==='Renewed').length;
  const nonRenewedShare=notRenewed/(notRenewed+renewed);
  const canonicalCityCounts={};for(const p of policies){const c=canonicalCity(p.city);canonicalCityCounts[c]=(canonicalCityCounts[c]||0)+1;}
  const citySignals=['Montreal','Toronto','Calgary','Ottawa','Quebec City'].flatMap(city=>['Home','Auto'].flatMap(product=>{
    const ps=policies.filter(p=>canonicalCity(p.city)===city&&p.policy_type===product),ids=new Set(ps.map(p=>p.policy_id));
    const cs=claims.filter(c=>ids.has(c.policy_id));if(!ps.length||!cs.length)return[];
    const total=cs.reduce((a,c)=>a+(number(c.claim_amount)||0),0);
    return [...new Set(cs.map(c=>c.claim_type))].map(peril=>{
      const group=cs.filter(c=>c.claim_type===peril),amount=group.reduce((a,c)=>a+(number(c.claim_amount)||0),0);
      const slug=`${city}-${product}-${peril}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const monthlyClaims=Array.from({length:12},(_,i)=>{const month=String(i+1).padStart(2,'0'),matched=group.filter(c=>String(c.loss_date||'').slice(5,7)===month);return{month,claims:matched.length,reportedAmount:dollars(matched.reduce((a,c)=>a+(number(c.claim_amount)||0),0))};});
      return{id:`city-${slug}`,city,product,peril,claims:group.length,policyRows:ps.length,claimsPer100Rows:round(group.length/ps.length*100,1),reportedAmount:dollars(amount),meanReportedAmount:dollars(mean(group.map(c=>number(c.claim_amount)).filter(Number.isFinite))),shareOfCityReportedAmount:total?round(amount/total*100,1):0,cityReportedAmount:dollars(total),monthlyClaims,title:`${city} ${product}: ${peril} claims`,finding:`${city}: ${group.length} ${peril} claims across ${ps.length} ${product} policy rows, with ${dollars(amount)} reported amount units (${total?round(amount/total*100,1):0}% of this city/product’s recorded claim amount).`,confidence:'DESCRIPTIVE · REPORTED AMOUNT, NOT PROFIT',caveat:'Policy rows are not earned exposure. Claim amounts are not ultimate losses, and currency, reserves, expenses and coverage terms are missing.',evidence:`policies.csv · city=${city}, policy_type=${product}, policy_id; claims.csv · claim_type=${peril}, claim_amount, loss_date, policy_id; exact duplicate claim rows removed.`,goal:`Test what is driving ${peril} cost in ${city} ${product}, compare like-for-like city peers, then estimate the long-run result with earned exposure and ultimate losses.`};
    }).sort((a,b)=>b.reportedAmount-a.reportedAmount);
  }));
  citySignals.sort((a,b)=>b.reportedAmount-a.reportedAmount);
  // City comparison is deliberately presented as a policy-row screening signal:
  // the files have no coverage-end dates, so city rates are not earned-exposure rates.
  const homePolicies=policies.filter(p=>p.policy_type==='Home');
  const homePolicyById=new Map(homePolicies.map(p=>[p.policy_id,p]));
  const homeClaims=claims.filter(c=>homePolicyById.has(c.policy_id));
  const homeCity=(name)=>{
    const ps=homePolicies.filter(p=>canonicalCity(p.city)===name), ids=new Set(ps.map(p=>p.policy_id));
    const cs=homeClaims.filter(c=>ids.has(c.policy_id));
    const amounts=cs.map(c=>number(c.claim_amount)).filter(x=>x!==null);
    const perils=[...new Set(homeClaims.map(c=>c.claim_type))].map(type=>{
      const group=cs.filter(c=>c.claim_type===type), values=group.map(c=>number(c.claim_amount)).filter(x=>x!==null);
      return {label:type,claims:group.length,reportedAmount:dollars(sum(values)),meanAmount:dollars(mean(values))};
    }).filter(x=>x.claims).sort((a,b)=>b.claims-a.claims);
    const riskMix={};for(const risk of ['Low','Medium','High'])riskMix[risk]=ps.filter(p=>p.risk_band===risk).length;
    const yearly={};for(const year of ['2024','2025','2026']){const group=cs.filter(c=>String(c.loss_date||'').startsWith(year));yearly[year]={claims:group.length,reportedAmount:dollars(sum(group.map(c=>number(c.claim_amount)).filter(x=>x!==null)))}}
    return {city:name,policyRows:ps.length,claims:cs.length,claimsPerPolicyRow:cs.length/Math.max(ps.length,1),policiesWithClaims:new Set(cs.map(c=>c.policy_id)).size,reportedAmount:dollars(sum(amounts)),meanReportedAmount:dollars(mean(amounts)),riskMix,perils,yearly};
  };
  const montrealHome=homeCity('Montreal'),torontoHome=homeCity('Toronto');
  const cityHomeComparison={montreal:montrealHome,toronto:torontoHome,claimCountPerPolicyRowRatio:round(montrealHome.claimsPerPolicyRow/Math.max(torontoHome.claimsPerPolicyRow,1e-9),2),claimCountDifference:montrealHome.claims-torontoHome.claims,reportedAmountDifference:dollars(montrealHome.reportedAmount-torontoHome.reportedAmount),riskMixScreen:{description:'Raw claim counts compared within recorded risk band; still not exposure-adjusted and not causal.',byBand:['Low','Medium','High'].map(risk=>{const mps=homePolicies.filter(p=>canonicalCity(p.city)==='Montreal'&&p.risk_band===risk),tps=homePolicies.filter(p=>canonicalCity(p.city)==='Toronto'&&p.risk_band===risk);const mIds=new Set(mps.map(p=>p.policy_id)),tIds=new Set(tps.map(p=>p.policy_id));return{risk,montrealPolicies:mps.length,montrealClaims:homeClaims.filter(c=>mIds.has(c.policy_id)).length,torontoPolicies:tps.length,torontoClaims:homeClaims.filter(c=>tIds.has(c.policy_id)).length};})}};
  const startDates=policies.map(p=>parseDate(p.start_date)).filter(Boolean);
  const lossDates=claims.map(c=>parseDate(c.loss_date)).filter(Boolean);
  const scoreReliability=quality.duplicate_claim_groups>0||quality.city_variants_collapsed>0||quality.claims_reported_before_loss>0;

  const observations=[
    {id:'montreal-toronto-home',rank:1,title:'Montreal Home has 63% more claim records per policy row than Toronto.',finding:`Montreal: ${montrealHome.claims} claims across ${montrealHome.policyRows} policy rows (${(montrealHome.claimsPerPolicyRow*100).toFixed(1)} per 100 rows); Toronto: ${torontoHome.claims} across ${torontoHome.policyRows} (${(torontoHome.claimsPerPolicyRow*100).toFixed(1)} per 100). Water Damage leads Montreal (${montrealHome.perils.find(x=>x.label==='Water Damage')?.claims} vs Toronto ${torontoHome.perils.find(x=>x.label==='Water Damage')?.claims}); Toronto has more Wind/Hail claims (${torontoHome.perils.find(x=>x.label==='Wind/Hail')?.claims} vs Montreal ${montrealHome.perils.find(x=>x.label==='Wind/Hail')?.claims}).`,evidence:`policies.csv · policy_type=Home, city, policy_id, risk_band; claims.csv · policy_id, claim_type, claim_amount, loss_date. Exact duplicate claim rows removed. Montreal n=${montrealHome.policyRows} policy rows/${montrealHome.claims} claims; Toronto n=${torontoHome.policyRows}/${torontoHome.claims}.`,confidence:'STRONG SCREENING SIGNAL · CAUSE UNKNOWN',caveat:'Claims per policy row is not earned-exposure frequency. Policy end/cancellation dates, location-level exposure, property mix and ultimate losses are absent. City aggregates are not evidence that geography caused the difference.',goal:'Investigate whether the gap persists after exposure, peril, property, coverage, time and risk-mix adjustment; then choose a loss-prevention or underwriting action.'},
    {id:'home-severity',rank:2,title:'Home claim estimates are larger per claim than Auto.',finding:`Home averages ${byProduct.find(x=>x.label==='Home')?.meanClaimAmount?.toLocaleString('en-CA')} reported amount units across ${byProduct.find(x=>x.label==='Home')?.claims} claims; Auto averages ${byProduct.find(x=>x.label==='Auto')?.meanClaimAmount?.toLocaleString('en-CA')} across ${byProduct.find(x=>x.label==='Auto')?.claims} (1.86×).`,evidence:'Claims · claim_type, claim_amount, policy_id joined to policies.policy_type',confidence:'DESCRIPTIVE',caveat:'The files do not specify currency. Reported amounts are not ultimate losses; exposure, reserves, coverage limits, and adjustment expenses are missing.',goal:'Find which home perils and property characteristics drive severity.'},
    {id:'risk-frequency',rank:3,title:'The High risk band has more claim records per policy row.',finding:`High: ${byRisk.find(x=>x.label==='High')?.claims} / ${byRisk.find(x=>x.label==='High')?.policies} = ${byRisk.find(x=>x.label==='High')?.claimsPerPolicy}; Low: ${byRisk.find(x=>x.label==='Low')?.claims} / ${byRisk.find(x=>x.label==='Low')?.policies} = ${byRisk.find(x=>x.label==='Low')?.claimsPerPolicy} claims per policy row.`,evidence:'Claims · unique claim_id joined by policy_id; policies · risk_band',confidence:'SCREENING SIGNAL',caveat:'Policy start/end exposure differs or is not recorded; these are not exposure-adjusted frequencies or causal evidence.',goal:'Test whether current risk classes predict future loss after exposure and mix adjustments.'},
    {id:'water-loss',rank:3,title:'Water Damage is the largest reported claim-amount category.',finding:`${perils.find(x=>x.label==='Water Damage')?.claims} claims total ${perils.find(x=>x.label==='Water Damage')?.reportedAmount?.toLocaleString('en-CA')} amount units (${percent(perils.find(x=>x.label==='Water Damage')?.shareOfReportedAmount)}% of recorded claim amounts).`,evidence:'Claims · claim_type, claim_amount · exact duplicate claim rows removed',confidence:'DESCRIPTIVE',caveat:'No currency field, property attributes, peril exposure, reserves, or loss-adjustment expense. Do not infer which customers to reprice.',goal:'Investigate mitigation, property characteristics, and local water-hazard exposure.'},
    {id:'fire-severity',rank:4,title:'Fire claims are rare in this sample but severe.',finding:`${perils.find(x=>x.label==='Fire')?.claims} claims average ${perils.find(x=>x.label==='Fire')?.meanClaimAmount?.toLocaleString('en-CA')} reported amount units.`,evidence:'Claims · claim_type, claim_amount · exact duplicate claim rows removed',confidence:'LOW VOLUME',caveat:'Only 13 records; large uncertainty and possible catastrophe clustering.',goal:'Review coverage, mitigation, reserve development, and catastrophe protection.'},
    {id:'open-claims',rank:5,title:'A small tail of open claims may deserve a reserve review.',finding:`${open.length} claims are Open / Under Review; ${olderThan90} have been reported for more than 90 days as of ${dateText(latestReport)}.`,evidence:'Claims · status, reported_date, claim_amount, closed_date',confidence:'OPERATIONAL SIGNAL',caveat:'Claim amount is not a case reserve; no IBNR or reserve adequacy data supplied.',goal:'Prioritize old open files for status and reserve review.'},
    {id:'claim-handling',rank:6,title:'Team C’s closed claims take longer in the raw comparison.',finding:`Median report-to-close: A ${teamCycle.find(x=>x.label==='Team A')?.medianDays} days (n=${teamCycle.find(x=>x.label==='Team A')?.closedClaims}), B ${teamCycle.find(x=>x.label==='Team B')?.medianDays} (n=${teamCycle.find(x=>x.label==='Team B')?.closedClaims}), C ${teamCycle.find(x=>x.label==='Team C')?.medianDays} (n=${teamCycle.find(x=>x.label==='Team C')?.closedClaims}).`,evidence:'Claims · reported_date, closed_date, adjuster_team · closed claims only',confidence:'UNADJUSTED COMPARISON',caveat:'Team assignment, complexity, and workload differ; this is not evidence of team performance.',goal:'Compare like-for-like claim mix and workloads before changing routing.'},
    {id:'retention',rank:7,title:'372 policies are marked Not Renewed.',finding:`Among rows marked Renewed or Not Renewed, ${percent(nonRenewedShare)} are Not Renewed (${notRenewed} of ${notRenewed+renewed}).`,evidence:'Policies · renewal_status',confidence:'STATUS INDICATOR',caveat:'No renewal cohort dates, offered premium, or reason for leaving; not a verified retention rate.',goal:'Understand price, claim, service, and competitor reasons before a retention offer.'},
    {id:'multi-line',rank:8,title:'1,405 customers hold both Auto and Home policies.',finding:`${bothLines} of ${policyCustomerTypes.size} distinct customers have both lines.`,evidence:'Policies · customer_id joined across policy_type',confidence:'DESCRIPTIVE',caveat:'Bundle profitability, policy tenure, household consent, and whether products were sold together are unknown.',goal:'Test a retention or service bundle only after customer-level contribution is available.'},
  ];
  const waterSignal=perils.find(x=>x.label==='Water Damage');
  const highRisk=byRisk.find(x=>x.label==='High');const lowRisk=byRisk.find(x=>x.label==='Low');
  const riskRatio=(highRisk?.claimsPerPolicy||0)/(lowRisk?.claimsPerPolicy||1);
  const decisions=[
    {id:'city-home-investigate',priority:'P1 · INVESTIGATE FIRST',title:'Investigate Montreal’s higher Home claim-record count.',observation:`Montreal has ${montrealHome.claims} Home claim records across ${montrealHome.policyRows} policy rows (${montrealHome.policiesWithClaims} distinct policies with ≥1 claim); Toronto has ${torontoHome.claims} across ${torontoHome.policyRows} rows (${torontoHome.policiesWithClaims} policies with ≥1 claim). The raw record-per-row ratio is ${cityHomeComparison.claimCountPerPolicyRowRatio}×.`,action:'Build an exposure-adjusted Montreal–Toronto comparison by accident year and peril; then test property age/type, basement and plumbing, coverage/deductible, postal area, and weather/hazard match. Review prevention options before rate changes.',reason:'A city-level gap can come from time insured, property mix, coverage, claim reporting, one clustered event, or true hazard differences. The current files cannot separate these explanations.',expected:'Identify whether the excess is persistent, concentrated in a peril or period, and preventable—or disappears after adjustment.',needs:['policy effective and cancellation/end dates','insured postal code / location with lawful access','property age/type, construction, basement and mitigation','limits, deductibles, forms and rating factors','case reserves, claim development and claim-adjustment expense','accident-year earned Home exposure'],goal:'Find the actual driver of Home loss and choose a targeted mitigation or actuarially reviewed action.'},
    {id:'profit-bridge',priority:'P0 · UNBLOCK PROFIT',title:'Build the real profit bridge before changing prices.',observation:'Current files cannot establish why profit is low.',action:'Join earned premium and exposure to ultimate losses; add commissions, operating and claim expenses, reinsurance, and investment income by product and period.',reason:'Loss ratio is incurred loss ÷ earned premium; underwriting profit also depends on expenses and risk/capital loads.',expected:'A defensible product / segment profit view instead of comparing annual written premium to claims from a mismatched window.',needs:['earned premium','coverage start/end and cancellations','case reserves + IBNR + LAE','commissions + operating expense','reinsurance + investment income'],goal:'Explain profit and identify the true loss or expense driver.'},
    {id:'water-prevention',priority:(waterSignal?.shareOfReportedAmount||0)>=.2?'P1 · LOSS PREVENTION':'P2 · LOSS PREVENTION',title:'Explore a water-damage prevention pilot.',observation:'Water Damage accounts for the largest reported claim amount in these files.',action:'First add property type, age, basement/plumbing details, mitigation measures, verified postal area, and coverage limits; then compare a prevention/inspection offer against a control.',reason:'Prevention can reduce loss while improving customer value; it avoids jumping straight to higher prices.',expected:'Potentially fewer or smaller water claims; measure take-up, claim frequency/severity, and cost of mitigation.',needs:['property attributes','geographic hazard match','mitigation costs','earned exposure','matured claim development'],goal:'Reduce avoidable claims and protect margin.'},
    {id:'risk-classes',priority:riskRatio>=1.5?'P1 · RATE ADEQUACY':'P2 · RATE ADEQUACY',title:'Validate the risk bands with earned exposure.',observation:`High-risk policies have ${highRisk?.claimsPerPolicy} recorded claims per policy row vs ${lowRisk?.claimsPerPolicy} in Low (${round(riskRatio,2)}×).`,action:'Recalculate by coverage-year and product; test frequency, severity, premium adequacy, confidence, and fairness before any rate action.',reason:'Raw counts can reflect time insured and risk mix, not a pricing error.',expected:'Find whether current tiers are aligned, over/under-priced, or too noisy to act on.',needs:['earned exposures','earned premium','ultimate losses + LAE','rating factors / filed rules','actuarial review'],goal:'Improve rate adequacy without unfair or unsupported segmentation.'},
    {id:'claims-queue',priority:olderThan90>0?'P2 · CLAIMS SERVICE':'P3 · CLAIMS SERVICE',title:'Triage old open claims, then compare teams fairly.',observation:`${olderThan90} open claims are older than 90 days; Team C has a longer unadjusted median.`,action:'Review oldest cases first. Compare teams after adjusting for peril, severity, litigation, and workload.',reason:'Faster resolution can improve customer outcomes and reduce handling cost, but case mix may explain the difference.',expected:'Shorter avoidable delays and better reserve visibility if a process bottleneck is confirmed.',needs:['claim complexity','adjuster workload','case reserve history','supplemental payment / reopen events'],goal:'Reduce claim friction and operating leakage.'},
    {id:'retention-research',priority:nonRenewedShare>=.1?'P2 · RETENTION':'P3 · RETENTION',title:'Find why customers do not renew.',observation:`${notRenewed} policy rows are Not Renewed; status alone does not explain why.`,action:'Add renewal offer premium, prior premium, quote outcome, reason code, service history, and contact timing; test a service/coverage review before discounting.',reason:'A profitable customer may leave over price, friction, or a poor claim experience; the fix depends on the cause.',expected:'Better renewal decisions and fewer unnecessary discounts.',needs:['renewal cohort and offer dates','price change','customer-stated reason','competitor quote if volunteered'],goal:'Retain profitable customers.'},
    {id:'bundle',priority:'P3 · CUSTOMER VALUE',title:'Test Auto + Home retention as a household relationship.',observation:`${bothLines} customers have both Auto and Home policies already.`,action:'Calculate household contribution and test a service/convenience bundle with a holdout group.',reason:'Bundle uptake is not automatically profitable; combined losses, discounts, retention, and service costs matter.',expected:'Potentially higher retention and lower service friction, validated on contribution rather than policy count.',needs:['policy-level earned margin','bundle discount and service costs','household consent and relationship dates'],goal:'Grow profitable customer lifetime value.'},
  ];
  const readiness=datasetReadiness(policies,claims,quality);
  return {
    title:'Millennium Mutual · Auto + Home',period:{policyStart:dateText(new Date(Math.min(...startDates))),policyEnd:dateText(new Date(Math.max(...startDates))),lossStart:dateText(new Date(Math.min(...lossDates))),lossEnd:dateText(new Date(Math.max(...lossDates))),asOf:dateText(latestReport)},
    summary:{policyRows:policies.length,customers:policyCustomerTypes.size,claimRowsRaw:rawClaims.length,claimRecords:claims.length,exactDuplicatesRemoved:rawClaims.length-claims.length,annualPremiumTotal:dollars(sum(policies.map(p=>number(p.annual_premium)||0))),claimAmountTotal:dollars(sum(claimAmount)),paidAmountTotal:dollars(sum(paidAmount)),unresolvedClaims:open.length,customersWithBothLines:bothLines,renewed,notRenewed},
    quality,byProduct,byRisk,perils,claimStatuses:statuses,teamCycle,cityCounts:canonicalCityCounts,cityHomeComparison,citySignals,observations,decisions,readiness,
    investigation:{
      status:'PUBLIC CONTEXT · PORTFOLIO CAUSE UNPROVEN',
      hypotheses:[
        {name:'Water pathway and property vulnerability',supports:'Montréal and Toronto municipal guidance both identify heavy rain, overloaded sewers, basement entry points, drainage and sump/backwater protection as plausible flood pathways.',challenges:'Both cities describe these mechanisms; that does not explain why this portfolio records more Montreal Water Damage claims. Toronto also has more Wind/Hail claims here.',test:'Match each water claim by loss date and postal area to local precipitation/storm and hazard layers; then control for insured-years, basement, building age/type, coverage and mitigation.',sources:[{label:'Montréal heavy-rain guidance',url:'https://montreal.ca/en/articles/protecting-your-building-heavy-rains-68382',scope:'Montréal · municipal guidance · mechanisms, not insurer claims'},{label:'Toronto basement-flooding guidance',url:'https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding/',scope:'Toronto · municipal guidance · mechanisms, not insurer claims'},{label:'ECCC historical weather',url:'https://climate.weather.gc.ca/historical_data/search_historic_data_e.html',scope:'Canadian stations · time-matched weather source; station coverage varies'}]},
        {name:'Broad city crime explains Home theft',supports:'Regional crime statistics can motivate checking local theft context.',challenges:`This portfolio has ${montrealHome.perils.find(x=>x.label==='Theft')?.claims} Montreal vs ${torontoHome.perils.find(x=>x.label==='Theft')?.claims} Toronto Home Theft claims, so theft does not drive the Montreal gap. Statistics Canada 2024 CMA figures also differ by measure: Toronto has the higher overall police-reported crime rate, while Montreal has the slightly higher Crime Severity Index. Neither is insured residential theft.`,test:'Compare exact Home break-and-enter/property-theft categories and matched geography/year as context only; test against insured property-years, coverage, reporting and claim amount.',sources:[{label:'Statistics Canada · 2024 Crime Severity Index by CMA',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/250722/t004a-eng.htm',scope:'2024 · CMA-level police-reported crime · not insured Home claims'}]},
        {name:'Climate change explains the local gap',supports:'Canada reports increasing annual precipitation and expects further increases, making time-matched weather a reasonable factor to test.',challenges:'National climate trends do not attribute this 2024–2026 portfolio difference to either city; local heavy-rain trends and insured-property exposure must be tested.',test:'Link claim loss dates and insured postal areas to documented station/grid data; retain geography, dates, missingness and uncertainty, and compare against matched unexposed periods.',sources:[{label:'Canada’s Changing Climate Report 2026 · Chapter 5',url:'https://www.canada.ca/en/environment-climate-change/services/science-technology/changing-climate-report-2026/cccr-chapter-5-en.html',scope:'Canada-wide assessment · background context, not city-level claim attribution'}]},
        {name:'A short construction season delays prevention or repairs',supports:'Québec construction activity is seasonal: CCQ says outdoor activity is strongest April–October and weakest in December–January. This makes repair timing and mitigation access worth checking.',challenges:'This is province-wide construction activity, not Montreal home-repair capacity and not evidence that delayed maintenance caused this portfolio’s claims. Repairs may also happen in winter.',test:'Request claim discovery-to-repair dates, mitigation/contractor access and cause severity; compare matched Montreal/Toronto claims by month and repair delay, with property-years.',sources:[{label:'Commission de la construction du Québec · industry seasonality',url:'https://www.ccq.org/en/En-tete/qui-sommes-nous/industrie-de-la-construction',scope:'Québec construction industry · seasonality; not residential insurance repairs'}]}
      ],
      method:'For each observation, preserve the exact portfolio slice and denominator; generate competing explanations; search official, academic and industry sources; record geography, period, outcome, method and limitations; gather both supporting and challenging evidence; ask what observation would falsify each hypothesis; request the narrowest missing data; only then compare controlled strategies.',
      dataNeeded:['insured property-years by month and city','claim cause subtype, event ID, repair timing and development','postal area and property/building characteristics','coverage form, limits, deductible and mitigation','matched claims and earned premium for the same period']
    },
    profitability:{status:'NOT CALCULABLE',writtenAnnualPremium:dollars(sum(policies.map(p=>number(p.annual_premium)||0))),claimAmountTotal:dollars(sum(claimAmount)),paidAmountTotal:dollars(sum(paidAmount)),reason:'Different time bases and missing earned premium, ultimate claim liabilities, expenses, reinsurance, and investment income. These totals must not be subtracted to claim a profit or loss.'},
    longRun:{frequencySeverity:'Aggregate claim cost S = sum of N claim severities. Under stable independent risk and complete exposure, E[S] = E[N] × E[severity].',profit:'Underwriting result = earned premium − ultimate incurred losses − loss-adjustment expense − acquisition/admin expense − reinsurance cost. Investment income and capital/risk margin affect total return.',chebyshev:'For independent equal-variance observations: P(|sample mean − μ| ≥ ε) ≤ variance / (n × ε²). Requires valid exposure, finite variance, and suitable independence; weather catastrophes and repeated policies can break independence.',chebyshevReady:false,credibility:'Credibility blending (e.g. Z = N/(N+K)) needs earned exposure and within/between risk variation. K cannot be estimated defensibly from these files.'},
    externalData:{useful:['ECCC historical weather / precipitation matched to insured property coordinates for water, wind, and hail analysis.','Official flood-hazard mapping matched to property location, with licensed-use checks.','Vehicle model, repair-cost inflation, mileage/garaging, and theft experience for Auto if permitted and available.','Coverage-level claim development, loss-adjustment expense, case reserve history, and reinsurance recoveries.'],notRecommended:'Cultural identity, ethnicity, mortality, or hospital-use data are not a substitute for insured risk and are not appropriate proxies for pricing. This sample is Auto/Home, not life or health insurance.'},
    unmatchedClaims:unmatched,
    sources:['NAIC glossary: earned premium, loss ratio, loss reserves and expense ratio.','CIA Standards of Practice, including P&C claim-liability valuation.','FSRA Ontario automobile rating guidance: evidence-based, fair classification; no unfair proxies; filing requirements vary by province.','ECCC historical weather data and NRCan flood hazard mapping are possible external signals after geographic linkage.'],
  };
}
