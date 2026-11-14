import fs from 'node:fs/promises';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const OUT='/Users/gabrielsalem/Documents/BizOptimizer/.codex-build/finalizer/candidate.pptx';
const PREVIEW='/Users/gabrielsalem/Documents/BizOptimizer/build/presentation';
const W=1280,H=720;
const C={bg:'#1B1428',panel:'#2A2338',panel2:'#332941',ink:'#F5F1FF',muted:'#BEB6CF',dim:'#8E859F',cyan:'#73E6F0',pink:'#F76FE1',lime:'#D8FA7B',amber:'#FFE889',violet:'#A785FF',dark:'#211A2F',white:'#FFFFFF',line:'#ffffff22'};
const FONT='Arial';
const pres=Presentation.create({slideSize:{width:W,height:H}});
function rect(s,x,y,w,h,fill=C.panel,opts={}){return s.shapes.add({geometry:opts.geometry||'roundRect',name:opts.name||undefined,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:opts.stroke||'none',width:opts.stroke?1:0},...(opts.radius?{borderRadius:opts.radius}:{})});}
function txt(s,text,x,y,w,h,size=20,color=C.ink,bold=false,opts={}){const sh=s.shapes.add({geometry:'textbox',name:opts.name||undefined,position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0}});sh.text=text;sh.text.style={fontFamily:FONT,fontSize:size,color,bold,alignment:opts.align||'left',verticalAlignment:opts.valign||'middle',wrap:true};return sh;}
function base(title,kicker='MILLENNIUM MUTUAL · RISK INTELLIGENCE',notes=''){
 const s=pres.slides.add();s.background.fill=C.bg;
 txt(s,kicker.toUpperCase(),58,34,900,24,12,C.lime,true);
 if(title)txt(s,title,58,72,1160,58,37,C.ink,true);
 rect(s,58,676,1164,1,C.line,{geometry:'rect'});
 txt(s,'PORTFOLIO INTELLIGENCE  /  APPLICANT UNDERWRITING',58,684,950,18,10,C.dim,false);
 txt(s,String(pres.slides.items.length).padStart(2,'0'),1170,681,50,21,12,C.cyan,true,{align:'right'});
 if(notes)s.speakerNotes.text=notes;
 return s;
}
function card(s,x,y,w,h,eyebrow,title,body,accent=C.cyan){
 rect(s,x,y,w,h,C.panel,{stroke:'#ffffff22'});txt(s,eyebrow.toUpperCase(),x+18,y+15,w-36,17,11,accent,true);
 txt(s,title,x+18,y+42,w-36,38,21,C.ink,true);txt(s,body,x+18,y+88,w-36,h-98,15,C.muted,false,{valign:'top'});
}
function bar(s,x,y,w,label,value,max,color,detail=''){
 txt(s,label,x,y,w*.4,22,15,C.ink,true);txt(s,value,x+w*.72,y,w*.28,22,14,C.ink,true,{align:'right'});
 rect(s,x,y+28,w,10,'#443951',{geometry:'roundRect'});rect(s,x,y+28,Math.max(5,w*Math.min(value/max,1)),10,color,{geometry:'roundRect'});
 if(detail)txt(s,detail,x,y+43,w,18,11,C.dim,false);
}
function pill(s,text,x,y,w,color=C.cyan){rect(s,x,y,w,25,'#272237',{stroke:color});txt(s,text,x+7,y+3,w-14,19,10,color,true,{align:'center'});}

// 1 — Cover
{
 const s=pres.slides.add();s.background.fill=C.bg;
 rect(s,790,0,490,720,'#241B34',{geometry:'rect'});
 txt(s,'MILLENNIUM MUTUAL  /  INSURANCE TRACK',62,58,700,25,13,C.lime,true);
 txt(s,'See the loss.\nFind the cause.\nPrice the risk.',62,148,690,246,54,C.ink,true);
 txt(s,'A two-part intelligence system',64,425,650,42,23,C.cyan,true);
 txt(s,'1  Portfolio signal → evidence → action\n2  Applicant facts → expected loss → reviewed quote',64,486,660,94,19,C.muted,false);
 pill(s,'REAL CSV FINDINGS',810,108,180,C.cyan);pill(s,'NO MOCK RATES',1000,108,165,C.pink);
 txt(s,'1.63×',820,190,350,120,76,C.pink,true);
 txt(s,'raw Montreal / Toronto\nHome claim-record ratio',824,314,370,63,22,C.ink,true);
 rect(s,820,410,350,1,'#ffffff30',{geometry:'rect'});
 txt(s,'115 Montreal claims / 510 policy rows\n79 Toronto claims / 570 policy rows',820,434,370,65,18,C.muted,false);
 txt(s,'A lead to investigate — not a city risk rate.',820,537,360,48,15,C.amber,true);
 txt(s,'Built from the supplied policies + claims files',64,662,690,20,12,C.dim,false);
 s.speakerNotes.text='Opening: the product has two systems. First, explain what the insurer portfolio is experiencing. Second, use validated actuarial assumptions to support an individual application review. The Montreal figure is a raw record-per-policy-row ratio, not an exposure-adjusted risk rate.';
}
// 2 — System map
{
 const s=base('Two systems. One evidence trail.','THE PRODUCT');
 const xs=[58,354,650,946],ws=250;
 const a=[['01 · PORTFOLIO','Detect','Find a measured pattern'],['02 · RESEARCH','Explain','Check both sides of “why”'],['03 · UNDERWRITE','Estimate','Apply approved class rules'],['04 · LEARN','Improve','Compare predicted vs actual']];
 a.forEach((it,i)=>{card(s,xs[i],190,ws,168,...it,i===0?C.cyan:i===1?C.pink:i===2?C.lime:C.amber);if(i<3)txt(s,'→',xs[i]+255,254,35,40,24,C.pink,true,{align:'center'});});
 rect(s,58,401,1164,2,'#ffffff18',{geometry:'rect'});
 txt(s,'PART 01',64,431,120,24,12,C.cyan,true);txt(s,'The insurer book',64,461,450,35,25,C.ink,true);txt(s,'Observed patterns, local context, and portfolio actions.',64,506,500,54,16,C.muted);
 txt(s,'PART 02',650,431,120,24,12,C.pink,true);txt(s,'The applicant',650,461,450,35,25,C.ink,true);txt(s,'Property profile, expected loss, price indication, human review.',650,506,520,54,16,C.muted);
 s.speakerNotes.text='The portfolio analysis engine does not make an individual quote. The underwriting workbench needs a validated classification/rating plan and insurer assumptions. Both use traceable evidence.';
}
// 3 — data inventory
{
 const s=base('The starting dataset: useful, incomplete','PART 01 · WHAT WE CAN MEASURE');
 const stats=[['4,684','policy rows'],['3,276','customers'],['862 → 847','claim rows → unique claims'],['15','exact duplicate rows removed']];
 stats.forEach((d,i)=>{const x=58+i*292;rect(s,x,166,270,114,C.panel,{stroke:'#ffffff22'});txt(s,d[0],x+17,181,240,48,34,i===2?C.pink:C.cyan,true);txt(s,d[1],x+17,236,240,21,13,C.muted);});
 card(s,58,311,550,268,'DATA CLEANUP','Make comparisons trustworthy','16 city labels → 5 canonical cities\n6 claims reported before loss date\n8 claim amounts missing after dedup\n48 claims Open / Under Review',C.lime);
 card(s,628,311,594,268,'IMPORTANT LIMIT','We cannot calculate profit yet','No earned premium by period, insured years, claim reserves / IBNR, claim expense, operating expense, reinsurance, or investment income.\n\nAnnual written premium − claim amounts ≠ profit.',C.amber);
 s.speakerNotes.text='Sources: supplied policies.csv and claims.csv. 4,684 policies and 862 raw claims. There are 15 exact duplicate claim records, leaving 847 unique claim IDs. Currency is not specified in the claim data. The portfolio window is 2024-11 through 2026-10.';
}
// 4 — Montreal and Toronto
{
 const s=base('Montreal records more Home claims per policy row','PART 01 · THE FIRST SIGNAL');
 txt(s,'CLAIM RECORDS PER 100 HOME POLICY ROWS',58,152,550,20,12,C.cyan,true);
 bar(s,60,199,500,'Montreal','22.5',25,C.pink,'115 claim records · 510 rows · 96 policies with ≥1 claim');
 bar(s,60,293,500,'Toronto','13.9',25,C.cyan,'79 claim records · 570 rows · 72 policies with ≥1 claim');
 rect(s,670,158,552,263,C.panel,{stroke:'#ffffff22'});
 txt(s,'THE SHAPE OF THE GAP',693,178,500,22,12,C.lime,true);
 txt(s,'1.63×',693,216,280,92,57,C.pink,true);
 txt(s,'raw records / policy row',693,312,300,28,16,C.ink,true);
 txt(s,'Montreal mean amount: 8,268\nToronto mean amount: 8,840',984,229,207,73,15,C.muted,false);
 txt(s,'Currency unspecified · reported amount, not ultimate cost',693,373,500,20,11,C.dim);
 rect(s,58,430,1164,144,'#2b233a',{stroke:'#ffe88966'});
 txt(s,'READ THIS AS A QUESTION, NOT A VERDICT',79,450,500,23,12,C.amber,true);
 txt(s,'We do not know how long each policy was insured. More claim records per row may reflect exposure time, property mix, coverage, reporting, or chance.',79,487,1090,62,20,C.ink,false);
 s.speakerNotes.text='Exact comparison from policies.csv and deduplicated claims.csv. Montreal: 115 Home claims / 510 policy rows = 22.549 claims per 100; Toronto: 79 / 570 = 13.86. Ratio = 1.629. Distinct policies with at least one claim: Montreal 96; Toronto 72. Mean reported amount: Montreal 8,267.89; Toronto 8,840.49. Currency absent. Exposure end dates absent, so do not call this a loss frequency.';
}
// 5 — Perils and years
{
 const s=base('The gap is concentrated in Water Damage','PART 01 · BREAK IT APART');
 txt(s,'HOME CLAIMS BY PERIL',58,155,420,22,12,C.cyan,true);
 const perils=[['Water Damage',79,28,C.pink],['Theft',19,21,C.violet],['Wind / Hail',14,24,C.cyan],['Fire',3,6,C.amber]];
 perils.forEach((p,i)=>{const y=198+i*72;txt(s,p[0],62,y,180,22,15,C.ink,true);txt(s,String(p[1]),258,y,56,22,14,C.pink,true,{align:'right'});rect(s,332,y+4,330,12,'#41374d');rect(s,332,y+4,330*p[1]/80,12,C.pink);txt(s,String(p[2]),685,y,55,22,14,C.cyan,true,{align:'right'});rect(s,754,y+4,330,12,'#41374d');rect(s,754,y+4,330*p[2]/80,12,C.cyan);});
 txt(s,'MONTREAL',333,170,330,18,10,C.pink,true);txt(s,'TORONTO',755,170,330,18,10,C.cyan,true);
 rect(s,58,500,1164,96,C.panel,{stroke:'#ffffff22'});
 txt(s,'A DIFFERENT STORY BY PERIL',77,519,400,20,12,C.lime,true);
 txt(s,'Montreal: +51 Water Damage records.  Toronto: +10 Wind/Hail records. Theft is 19 vs 21 — it does not explain Montreal’s gap.',77,552,1090,30,17,C.ink);
 txt(s,'2025: 46 Montreal / 34 Toronto · 2026 to Oct 30: 65 / 44 · 2024 is too thin to compare',62,621,1120,24,13,C.muted);
 s.speakerNotes.text='Claims by loss peril from supplied files after deduplication. Montréal has 79 water, 19 theft, 14 wind/hail, 3 fire; Toronto 28, 21, 24, 6. Claims by loss year: 2025 MTL 46/TOR 34; 2026 through 2026-10-30 MTL 65/TOR 44; 2024 MTL 1/TOR 0 so not interpretable. This is a decomposition, not a causal analysis.';
}
// 6 — exposure adjusted peer comparison
{
 const s=base('After estimated exposure, Montreal water claims remain the outlier','PART 01 · TEST THE PATTERN');
 txt(s,'WATER CLAIMS PER ESTIMATED INSURED PROPERTY-YEAR',58,153,690,20,12,C.cyan,true);
 bar(s,62,198,480,'Montreal','0.205',.22,C.pink,'77 claims · 376 estimated property-years');
 bar(s,62,286,480,'Toronto','0.068',.22,C.cyan,'28 claims · 410 estimated property-years');
 bar(s,62,374,480,'Quebec City','0.043',.22,C.lime,'7 claims · 164 estimated property-years');
 rect(s,602,163,620,333,C.panel,{stroke:'#ffffff22'});
 txt(s,'WHAT THE COMPARISON SAYS',626,185,560,22,12,C.lime,true);
 txt(s,'3.00×',626,226,250,87,57,C.pink,true);
 txt(s,'Montreal / Toronto water rate',626,313,365,26,17,C.ink,true);
 txt(s,'95% interval: 1.95–4.63',626,352,400,26,16,C.muted);
 txt(s,'Every other peril is near or below Toronto. Water severity is similar: 8,578 vs 9,083.',626,394,540,55,16,C.ink);
 rect(s,58,527,1164,105,'#30273d',{stroke:'#ffe88966'});
 txt(s,'WHY THIS IS STRONGER — AND STILL PROVISIONAL',78,546,570,20,12,C.amber,true);
 txt(s,'The gap persists across recorded risk bands, deductibles, sales channels and start cohorts. Quebec City is a useful peer check, but these are not randomized comparisons.',78,578,1080,40,16,C.ink);
 txt(s,'Exposure estimated from policy start date; 12-month term assumed, B07 excluded, canceled rows treated as full year. No recorded end dates.',61,646,1150,22,11,C.dim);
 s.speakerNotes.text='Analysis from analysis/data.mjs and analysis/PATTERNS.md. Montreal Home Water Damage: 77 claims / 376 estimated insured property-years = 0.205; Toronto 28 / 410 = 0.068; ratio 3.00, approximate 95% Poisson rate-ratio interval 1.95–4.63. Quebec City 7 / 164 = 0.043. B07 excluded for the city comparison. Exposure is estimated as min(1, (2026-10-31 minus policy start)/365); the 12-month term assumption is not verified by a recorded expiry date and canceled policies were treated as full exposure. Recorded risk-band rates: Montreal/Toronto Low 0.177/0.028, Medium 0.239/0.131, High 0.220/0.067. This reduces simple mix explanations but does not control property age/type, location, coverage, reporting, or event effects. Water severity means: Montreal 8,578, Toronto 9,083. This remains an observational city-level signal, not proof that Montreal itself causes risk or a filed rating basis.';
}
// 7 — supporting and challenging evidence
{
 const s=base('External sources suggest mechanisms in both cities','PART 01 · RESEARCH BOTH SIDES');
 card(s,58,163,552,190,'SUPPORTS A WATER HYPOTHESIS','Both cities describe flood pathways','Montreal and Toronto both cite heavy rain, overloaded sewers, basement entry points and drainage / pump protection. These are mechanisms to test.',C.cyan);
 card(s,628,163,594,190,'CHALLENGES A SIMPLE CITY STORY','Shared pathways do not explain the gap','The same hazards exist in both places. The portfolio has more Montreal Water claims, but no location, insured years or cause subtype to prove why.',C.amber);
 card(s,58,383,552,190,'THEFT CHECK','Counts do not point to Montreal','Portfolio Home theft is 19 Montreal vs 21 Toronto. In 2024, Toronto’s overall CMA crime rate was higher; Montreal’s Crime Severity Index was slightly higher. Neither equals insured-home theft.',C.pink);
 card(s,628,383,594,190,'CLIMATE CONTEXT','National trend ≠ local attribution','Canada’s climate assessment supports testing precipitation. It does not show that weather caused this portfolio’s Montreal–Toronto difference.',C.lime);
 txt(s,'Québec construction is seasonal too: busiest April–October, weakest December–January. Could affect repair timing; does not prove fewer Montreal home-maintenance firms.',62,613,1120,38,14,C.amber,true);
 s.speakerNotes.text='Source notes and links: Montreal heavy-rain guidance https://montreal.ca/en/articles/protecting-your-building-heavy-rains-68382 ; Toronto basement flooding https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding/ ; Statistics Canada 2024 Crime Severity Index by CMA https://www150.statcan.gc.ca/n1/daily-quotidien/250722/t004a-eng.htm (overall police-reported crime, not insured property theft); Canada’s Changing Climate Report 2026 Chapter 5 https://www.canada.ca/en/environment-climate-change/services/science-technology/changing-climate-report-2026/cccr-chapter-5-en.html (national scale); Commission de la construction du Québec https://www.ccq.org/en/En-tete/qui-sommes-nous/industrie-de-la-construction (province-wide construction seasonality, not Montreal home-repair provider capacity). These sources motivate tests; none proves portfolio-level causation.';
}
// 7 — Repeatable research loop
{
 const s=base('Run the same investigation loop for every signal','PART 01 · AGENTIC WORKFLOW');
 const steps=[['1','DETECT','Exact slice + denominator'],['2','DESCRIBE','Plain-language pattern + numbers'],['3','QUESTION','Multiple causes + alternatives'],['4','SEARCH','Official, academic, market sources'],['5','CROSS-CHECK','Evidence for / against + scope'],['6','TEST','Join local data; adjust exposure'],['7','DECIDE','Action, goal, uncertainty'],['8','LEARN','Compare before / after']];
 steps.forEach((d,i)=>{const col=i%4,row=Math.floor(i/4),x=58+col*292,y=163+row*195;rect(s,x,y,267,145,C.panel,{stroke:'#ffffff22'});rect(s,x+15,y+15,33,33,i===2||i===4?C.pink:C.cyan);txt(s,d[0],x+15,y+20,33,20,13,C.dark,true,{align:'center'});txt(s,d[1],x+59,y+17,195,25,12,C.lime,true);txt(s,d[2],x+17,y+67,232,49,16,C.ink,false);});
 txt(s,'OUTPUT EACH TIME',62,574,190,20,11,C.pink,true);
 txt(s,'Observation · evidence citation · competing explanation · missing data · falsification test · decision · predicted measure',253,567,900,48,16,C.muted);
 s.speakerNotes.text='This is the repeatable research workflow. The app currently provides the first Montréal Home evidence ledger and a curated source set. Live, unattended crawling/LLM research is not yet connected; sources should be retrieved through an approved search provider and captured with URL, date, geography, method and limitations.';
}
// 8 — More signals
{
 const s=base('Other patterns are leads, not verdicts','PART 01 · THE PORTFOLIO HAS MORE TO ASK');
 const rows=[
  ['WATER','143 claims · 1,205,494 reported amount · 25.5% of all recorded amount','Preventable property losses? Need property + peril + insured-years.'],
  ['HIGH vs LOW','0.296 vs 0.127 claim records / policy row · 2.33×','Does current class predict loss after exposure adjustment?'],
  ['FIRE','13 claims · mean 30,165 reported amount','Rare / severe; too few for stable city pricing. Check event clustering.'],
  ['OPEN CLAIMS','48 open / under review · 4 older than 90 days','Could reserve or service friction be hiding? Case reserve history needed.'],
  ['TEAM C','18-day raw median vs Team A 12 days','Case complexity/workload may explain it; compare like with like.'],
  ['RENEWALS','372 Not Renewed status rows','No dates, renewal offer or reason; this is not a cohort churn rate.'],
 ];
 rows.forEach((r,i)=>{const col=i%2,row=Math.floor(i/2),x=58+col*590,y=156+row*145;rect(s,x,y,558,121,C.panel,{stroke:'#ffffff1c'});pill(s,r[0],x+14,y+13,120,i===0?C.pink:i===2?C.amber:C.cyan);txt(s,r[1],x+151,y+14,386,42,15,C.ink,true);txt(s,r[2],x+16,y+70,520,34,12,C.muted);});
 s.speakerNotes.text='All values from supplied policies.csv and claims.csv after exact duplicate claim cleanup. Amount units/currency unspecified. Risk class, adjuster-team, and renewal observations are raw, unadjusted or status-only comparisons. See reports/Millennium Mutual insurance findings.md for further data-quality and portfolio details.';
}
// 9 — What data next
// 9 — Broker anomaly and investigation
{
 const s=base('Broker B07 is a severe outlier. It is a lead—not proof of fraud.','PART 01 · BROKER-SOURCE PATTERN');
 const metrics=[['60 / 2.6','Theft claims observed / expected'],['37 vs 159','Median days to claim · B07 / others'],['4.29','B07 loss-ratio proxy'],['~0.42M','Excess incurred proxy · dataset units']];
 metrics.forEach((m,i)=>{const x=58+(i%2)*292,y=160+Math.floor(i/2)*130;rect(s,x,y,270,105,C.panel,{stroke:i===0||i===2?'#f76fe166':'#ffffff22'});txt(s,m[0],x+15,y+13,240,38,27,i===0||i===2?C.pink:C.cyan,true);txt(s,m[1],x+15,y+61,240,29,12,C.muted);});
 rect(s,662,160,560,235,C.panel,{stroke:'#ffffff22'});
 txt(s,'WHAT THE FILES SHOW',685,180,480,20,12,C.lime,true);
 txt(s,'173 policies · 70 claims\n60 theft · 0 denied · all policies begin in 2026\n63% of claims arrive within 45 days (others: 19%)',685,221,493,112,19,C.ink);
 rect(s,58,438,1164,140,'#30273d',{stroke:'#ffe88966'});
 txt(s,'WHAT TO DO',78,458,200,18,12,C.amber,true);
 txt(s,'Review broker records, bind evidence, claim timing and referral controls with the Special Investigations Unit. Do not label a broker or customer fraudulent from this pattern alone.',78,493,1070,53,18,C.ink);
 txt(s,'External fraud guidance treats unusual early claims as a red flag, not proof; no validated 30-day cutoff was found.',61,612,1150,23,12,C.dim);
 s.speakerNotes.text='The verified pattern is in analysis/PATTERNS.md: B07 wrote 173 policies; 70 claims, 60 Theft. Applying non-B07 Theft rates to B07 exposure gives 2.6 expected claims; Poisson tail probability is below 1e-15 under the model assumptions. Median start-to-loss is 37 days vs 159 elsewhere; 63% within 45 days vs 19%. The cohort incurred-loss proxy / estimated earned premium is 4.29 (earned 112k; incurred proxy 480k), about 0.42M excess vs expected peer loss. All B07 policies start during 2026. “100% paid, 0 denied” is a descriptive anomaly, not proof. External sources: Canadian Underwriter fraud red flags https://canadianunderwriter.ca/2021/04/07/brokers-pay-attention-to-these-insurance-fraud-red-flags/ and Gore Mutual https://www.goremutual.ca/broker-circle/fraud-prevention-starts-before-the-claim/; early claims motivate investigation, but no 30-day threshold is validated here. Do not infer intent or automate declination; refer for human SIU review. Currency unspecified. Exposure and incurred values are provisional as described in analysis/PATTERNS.md.';
}
// 10 — Rating fit by product
{
 const s=base('Home prices do not track risk as closely as Auto prices','PART 01 · RATING ADEQUACY SCREEN');
 const headers=['Risk band','Home loss ratio','Home claims / yr','Auto loss ratio','Auto claims / yr'];
 const rows=[['Low','0.66','0.128','0.39','0.183'],['Medium','1.29','0.243','0.46','0.286'],['High','0.98','0.289','0.51','0.442']];
 const xs=[78,280,500,730,960], widths=[180,200,200,210,210];
 headers.forEach((h,i)=>txt(s,h,xs[i],164,widths[i],36,12,C.cyan,true,{align:i? 'center':'left'}));
 rows.forEach((r,ri)=>{const y=213+ri*72;rect(s,58,y,1164,56,ri===1?'#392a3d':C.panel,{stroke:ri===1?'#f76fe155':'#ffffff16'});r.forEach((v,i)=>txt(s,v,xs[i],y+12,widths[i],31,i===1&&ri===1?19:17,i===1&&ri===1?C.pink:C.ink,i===0||i===1||i===3,{align:i? 'center':'left'}));});
 card(s,58,435,550,152,'HOME · INVESTIGATE','Medium band is the concern','Its 1.29 loss-ratio proxy is above 1. The High band is priced 42% above Medium while its claim frequency is 19% higher.',C.pink);
 card(s,628,435,594,152,'AUTO · CONTROL','Premium broadly follows frequency','The loss ratio rises modestly with risk band; use this only as a contrast, not proof that Auto rating is optimal.',C.cyan);
 txt(s,'Review Home rating factors and actuarial support. This screening proxy excludes expenses and is not a customer-level accept / decline rule.',61,605,1150,31,14,C.amber,true);
 s.speakerNotes.text='Values from analysis/PATTERNS.md, excluding B07. Home band (Low/Medium/High): loss-ratio proxy 0.66/1.29/0.98; claim frequency per estimated policy-year 0.128/0.243/0.289; average premium 1,059/1,324/1,879. Auto: 0.39/0.46/0.51; frequency 0.183/0.286/0.442; average premium 1,242/1,586/2,350. Medium Home is a screening concern. The current Home High premium is 42% above Medium for 19% higher frequency. Data are synthetic/unspecified currency; exposure assumes 12-month terms and canceled policies as full year. Incurred proxy uses paid, denied=0, and open claims estimated by peril ratio; excludes expenses and true reserve development. It is not a filed loss ratio or an individual eligibility rule. Next: validate exposure, ultimate costs, rating plan and fairness, then actuarial/regulatory review.';
}
// 11 — What data next
{
 const s=base('Ask for the data that separates these causes','PART 01 · NEXT DATA REQUEST');
 const left=[['EXPOSURE','Effective + cancellation dates; insured property-years'],['PROPERTY','Age, type, construction, basement, occupancy'],['COVER','Forms, limits, deductible, endorsements, premium earned'],['CLAIMS','Cause subtype, event ID, reserves, paid / incurred development']];
 left.forEach((r,i)=>{const y=162+i*103;rect(s,58,y,545,82,C.panel,{stroke:'#ffffff18'});txt(s,r[0],77,y+13,125,18,11,C.cyan,true);txt(s,r[1],211,y+14,365,48,16,C.ink);});
 rect(s,640,163,580,390,'#2b233a',{stroke:'#a785ff55'});
 txt(s,'EXTERNAL ENRICHMENT',662,186,400,20,12,C.lime,true);
 txt(s,'ECCC weather\nLoss date + nearest station/grid\n\nNRCan flood layers\nScreening only; not property-level truth\n\nStatsCan housing / crime\nContext only; geography may not match',662,230,510,244,20,C.ink,false);
 txt(s,'Also request contractor/mitigation access and claim discovery-to-repair dates; test seasonal delay against severity.',662,499,500,41,14,C.muted,true);
 s.speakerNotes.text='Environment and Climate Change Canada historical data https://climate.weather.gc.ca/historical_data/search_historic_data_e.html. Natural Resources Canada historic flood susceptibility data is regional screening, not individual property prediction: https://open.canada.ca/data/en/dataset/ea1384df-bf4a-4743-97bb-870dc43f8d77 and intended use https://open.canada.ca/data/en/dataset/1074f781-85d3-4c86-bf4a-4743-97bb-870dc43f8d77 (see report for exact catalog source). Statistics Canada census profile is tract-level, not property-level: https://www150.statcan.gc.ca/n1/en/catalogue/98-401-X. CCQ reports province-wide construction activity strongest April–October and weakest December–January; that is not evidence of Montreal home repair contractor supply or the cause of this claim gap: https://www.ccq.org/en/En-tete/qui-sommes-nous/industrie-de-la-construction. Do not use culture, ethnicity, age, mortality or hospital use as Home-loss proxies.';
}
// 10 — Conditional actions
{
 const s=base('The action depends on what survives the test','PART 01 · DECIDE AFTER EXPLANATION');
 const rows=[
  ['IF','Montreal Water Damage stays higher per insured property-year after matching','THEN','Pilot basement-water prevention; track claims, cost and customer outcomes.'],
  ['IF','The gap is one storm/event or reporting/coding difference','THEN','Improve event accumulation, claim coding or data quality — no city-wide rate jump.'],
  ['IF','The gap vanishes after tenure, property or coverage adjustment','THEN','Do not price on city label; keep the verified explanatory factors.'],
  ['IF','Ultimate loss cost exceeds earned premium after expense and credibility','THEN','Prepare a segment-level actuarial rate review, with jurisdiction approvals.'],
 ];
 rows.forEach((r,i)=>{const y=158+i*109;rect(s,58,y,1164,88,C.panel,{stroke:'#ffffff19'});pill(s,r[0],76,y+16,48,C.pink);txt(s,r[1],143,y+13,475,57,15,C.ink,true);pill(s,r[2],642,y+16,70,C.lime);txt(s,r[3],733,y+13,461,58,15,C.muted);});
 txt(s,'Current decision: investigate and collect exposure data. No repricing is supported by this extract.',63,611,1130,35,18,C.amber,true);
 s.speakerNotes.text='Actions are contingent strategies, not approved actions. Loss prevention should use a controlled comparison. Pricing requires matched earned exposure, ultimate losses, expenses, stable credibility and provincial actuarial/regulatory review. The application of any regulatory rules depends on product and jurisdiction.';
}
// 11 — mathematics
{
 const s=base('Profit is an expected value plus uncertainty','PART 01 · LONG-RUN MATHEMATICS');
 rect(s,58,156,551,402,C.panel,{stroke:'#ffffff22'});txt(s,'ONE POLICY',80,180,420,22,12,C.cyan,true);
 txt(s,'N ~ claim count\nX ~ cost of one claim\nS = X₁ + … + Xₙ',80,224,230,145,25,C.ink,true);
 txt(s,'E[S] = E[N] × E[X]',344,236,230,54,22,C.lime,true);
 txt(s,'Poisson count + independent severity:\nVar(S) = λ(Var(X) + E[X]²)',344,314,233,91,16,C.muted);
 txt(s,'UNDERWRITING RESULT',80,438,245,18,11,C.pink,true);
 txt(s,'Earned premium − ultimate claims − LAE − operating costs − reinsurance',80,469,450,59,18,C.ink,true);
 rect(s,634,156,588,402,'#2b233a',{stroke:'#ffffff22'});
 txt(s,'A BOOK OF MANY POLICIES',657,180,500,22,12,C.cyan,true);
 txt(s,'Law of large numbers',657,225,330,31,23,C.ink,true);
 txt(s,'Average outcomes stabilize only when exposures are comparable and dependence is limited.',657,267,515,55,16,C.muted);
 txt(s,'Chebyshev bound',657,347,280,30,21,C.ink,true);
 txt(s,'P(|mean − μ| ≥ ε) ≤ σ² / (n ε²)',657,388,500,33,20,C.lime,true);
 txt(s,'Storm losses move together. More policies do not erase catastrophe risk or bad assumptions.',657,447,513,55,15,C.amber,true);
 txt(s,'No profit result yet: earned premium, reserves / IBNR, LAE, expenses and reinsurance are missing.',61,599,1155,37,17,C.pink,true);
 s.speakerNotes.text='Aggregate loss S is a compound sum. For compound Poisson, E[S]=λE[X], Var(S)=λ(E[X²]) = λ(Var(X)+E[X]^2). Chebyshev bound and formula follow if finite variance and the relevant independence/variance assumptions hold. Credibility Z=N/(N+K) requires valid exposure and estimate of K (process vs between-risk variance). Sources: CAS credibility review https://www.casact.org/sites/default/files/2021-03/8_Fisher_et_al.pdf ; CIA P&C standards https://www.cia-ica.ca/app/themes/wicket/custom/dl_file.php?fid=32707&p=37243 ; NAIC glossary https://content.naic.org/glossary-insurance-terms?id=37 ; OSFI 2026 MCT https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/minimum-capital-test-guideline-2026.';
}
// 12 — divider
{
 const s=pres.slides.add();s.background.fill='#231A31';
 txt(s,'PART 02  /  APPLICANT UNDERWRITING',62,70,800,25,13,C.lime,true);
 txt(s,'Before we quote,\nwhat risk are we\nactually taking?',62,170,880,228,52,C.ink,true);
 txt(s,'A transparent intake and decision-support app',65,444,800,38,23,C.cyan,true);
 rect(s,930,170,270,270,C.panel,{stroke:C.pink});txt(s,'PROFILE',970,204,195,28,14,C.cyan,true,{align:'center'});txt(s,'→',1042,242,45,39,27,C.pink,true,{align:'center'});txt(s,'EXPECTED\nLOSS',970,288,195,70,21,C.ink,true,{align:'center'});txt(s,'→',1042,366,45,35,27,C.pink,true,{align:'center'});txt(s,'REVIEW',970,409,195,28,14,C.lime,true,{align:'center'});
 txt(s,'Risk class · loss distribution · technical price · appetite review',65,590,920,30,17,C.muted);
 s.speakerNotes.text='The second product is an application intake and underwriting workbench. It must not improvise rate classes from the current aggregate file. A licensed insurer has to supply approved rules, rates, appetite and claim assumptions. The prototype is transparent decision support, not automatic acceptance or decline.';
}
// 13 — profile and category
{
 const s=base('Start with the insured property, not a guess about the person','PART 02 · INTAKE + CLASSIFICATION');
 const groups=[['LOCATION','Province · rating territory · postal prefix'],['PROPERTY','Type · year built · construction · occupancy'],['PERIL','Basement · drainage · protection devices'],['COVERAGE','Insured amount · form · deductible · endorsements']];
 groups.forEach((g,i)=>{const x=58+(i%2)*590,y=160+Math.floor(i/2)*141;card(s,x,y,558,116,g[0],g[1],'Capture verified details from the application.',i%2?C.pink:C.cyan);});
 rect(s,58,470,1164,100,'#30273d',{stroke:'#ffe88966'});
 txt(s,'CATEGORY',78,491,150,19,11,C.amber,true);txt(s,'Use the carrier’s validated, jurisdiction-approved rating rules.',232,485,820,28,20,C.ink,true);txt(s,'Current CSV has no property feature → outcome links, so it cannot infer a class yet.',232,520,850,22,13,C.muted);
 txt(s,'No demographic or health proxies. Ask only for data needed to insure this property.',62,612,1100,30,16,C.pink,true);
 s.speakerNotes.text='The AMF says Quebec home premiums can depend on home characteristics and coverage, and clients should make honest declarations. AMF home insurance shopping guidance https://lautorite.qc.ca/en/general-public/insurance/home-insurance/shopping-for-home-insurance. Rating classification should be approved for the specific insurer, product, province and filing. This prototype keeps personal demographics and health fields out.';
}
// 14 — price math
{
 const s=base('Indicated price comes from validated loss cost','PART 02 · FREQUENCY + SEVERITY');
 rect(s,58,162,710,385,C.panel,{stroke:'#ffffff22'});
 txt(s,'STEP 1 · EXPECTED LOSS',81,187,570,22,12,C.cyan,true);
 txt(s,'Pure loss = λ × E[X]',81,223,600,44,28,C.ink,true);
 txt(s,'λ = claims per insured property-year\nE[X] = expected ultimate claim severity',81,278,610,68,17,C.muted);
 rect(s,81,365,641,1,'#ffffff22',{geometry:'rect'});
 txt(s,'STEP 2 · TECHNICAL PREMIUM',81,390,570,22,12,C.pink,true);
 txt(s,'Premium = (loss + expenses + reinsurance + risk load)\n÷ (1 − variable expense ratio − target margin)',81,429,642,70,20,C.lime,true);
 card(s,810,162,412,179,'DATA GATE','No calibrated assumptions, no price','The current files lack insured-years and ultimate loss by property class. The app leaves price blank until the carrier supplies validated inputs.',C.amber);
 card(s,810,368,412,179,'COMPETITION','Protect the technical floor','Compare with equivalent coverage in the market. If the market price is lower, review coverage, deductible or mitigation; do not hide an expected loss deficit.',C.cyan);
 txt(s,'A class rate is an estimate with uncertainty—not a promise of profit on every policy.',62,601,1120,34,17,C.muted,true);
 s.speakerNotes.text='Pricing equation uses expense and margin ratios as proportions of premium. Exact treatment of commission, reinsurance, capital load, taxes/fees and profit margin must follow insurer accounting and approved actuarial methodology. Price comparison must be apples-to-apples by limits, form, deductible, endorsements and jurisdiction. AMF Quebec consumer guide explains coverage variation and premium considerations: https://lautorite.qc.ca/en/general-public/insurance/home-insurance/shopping-for-home-insurance.';
}
// 15 — portfolio outcome and disposition
{
 const s=base('A quote is one risk inside a whole book','PART 02 · APPETITE + HUMAN DECISION');
 const columns=[['WITHIN APPETITE','Expected loss fits validated rules','Prepare a price indication; underwriter verifies coverage and declarations.',C.lime],['UNCERTAIN / THIN DATA','Low credibility or missing facts','Ask for missing property data or refer to a human underwriter.',C.amber],['OUTSIDE APPETITE','Projected loss / concentration exceeds approved limits','Refer for a documented human decision under carrier rules.',C.pink]];
 columns.forEach((d,i)=>card(s,58+i*392,169,365,224,d[0],d[1],d[2],d[3]));
 rect(s,58,437,1164,129,C.panel,{stroke:'#ffffff22'});
 txt(s,'FOR 1,000 SIMILAR RISKS',80,460,360,20,12,C.cyan,true);
 txt(s,'Expected claims · expected losses · expected premium · expected underwriting result · variance / stress range',80,498,1080,44,20,C.ink,true);
 txt(s,'The system can flag “refer” or “outside approved appetite”; it does not make the final individual accept/decline decision.',62,601,1150,37,16,C.amber,true);
 s.speakerNotes.text='Portfolio expectation depends on class mix and credible models. For heterogeneous classes, sum expected losses and variances by segment; account for event dependence, catastrophe accumulation and reinsurance. Final underwriting disposition must comply with insurer authority, consumer treatment and local rules. AMF Quebec home insurance information states no law requires an insurer to sell insurance: https://lautorite.qc.ca/en/general-public/insurance/home-insurance/shopping-for-home-insurance. That does not remove obligations to follow applicable anti-discrimination and commercial practice rules.';
}
// 16 — closing architecture and governance
{
 const s=base('Learn from outcomes. Do not skip the evidence.','PART 02 · OPERATING LOOP');
 const stages=[['APPLICATION','Facts + coverage'],['MODEL','Frequency + severity'],['REVIEW','Price + appetite'],['OUTCOME','Bound / declined / referred'],['FEEDBACK','Actual claims + renewal']];
 stages.forEach((d,i)=>{const x=58+i*234;rect(s,x,176,204,110,C.panel,{stroke:'#ffffff22'});txt(s,d[0],x+15,193,176,19,10,i===2?C.pink:C.cyan,true);txt(s,d[1],x+15,228,176,43,16,C.ink,true);if(i<4)txt(s,'→',x+204,211,28,32,20,C.lime,true,{align:'center'});});
 const rules=[['VALIDATE','Back-test predictions vs matured losses.'],['MONITOR','Watch drift, data quality, event concentration.'],['EXPLAIN','Keep reason, evidence and source provenance.'],['GOVERN','Human review, fairness checks, provincial rules.']];
 rules.forEach((r,i)=>{const x=58+i*292;rect(s,x,342,267,102,'#30273d',{stroke:'#ffffff17'});txt(s,r[0],x+14,356,235,16,10,C.lime,true);txt(s,r[1],x+14,382,238,46,14,C.muted);});
 rect(s,58,490,1164,102,'#34243f',{stroke:C.pink});
 txt(s,'THE FIRST RELEASE',79,510,200,19,11,C.pink,true);txt(s,'1  Explain the Montreal signal   ·   2  request missing exposure   ·   3  build approved rate inputs   ·   4  keep underwriting review human',79,546,1100,35,17,C.ink,true);
 s.speakerNotes.text='Québec AMF AI guideline (issued March/April 2026; comes into force May 1, 2027) applies to authorized insurers and expects risk-based classification, AI governance, lifecycle management, risk management, and fair treatment: https://lautorite.qc.ca/en/professionals/insurers/guidelines/use-of-models/guideline-for-the-use-of-artificial-intelligence. Quebec Charter of Human Rights and Freedoms §20.1 has an insurance-specific provision concerning age, sex or civil status; consult counsel for applicability and exceptions: https://www.legisquebec.gouv.qc.ca/en/pdf/cs/C-12.pdf. This slide is not legal advice.';
}

await fs.mkdir(PREVIEW,{recursive:true});
for(let i=0;i<pres.slides.items.length;i++){
 const blob=await pres.export({slide:pres.slides.items[i],format:'png',scale:1});
 await fs.writeFile(`${PREVIEW}/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await blob.arrayBuffer()));
}
const pptx=await PresentationFile.exportPptx(pres);
await pptx.save(OUT);
console.log(`saved ${OUT} (${pres.slides.items.length} slides)`);
