import { Presentation, PresentationFile } from '/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';

const OUT='/Users/gabrielsalem/Documents/BizOptimizer/deliverables/VDO-X-Behavior-Intelligence.pptx';
const PREVIEW='/Users/gabrielsalem/Documents/BizOptimizer/.codex-build/previews';
await fs.mkdir(PREVIEW,{recursive:true});
const ppt=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#0B1020',panel:'#131B2E',panel2:'#19243A',ink:'#F4F7FF',muted:'#A8B4CC',line:'#2B3852',mint:'#70F0C2',blue:'#76A8FF',amber:'#FFC46B',pink:'#FF7C91',white:'#FFFFFF'};
const FONT='Aptos';
function shape(s,geometry,x,y,w,h,fill='none',lineFill='none',radius=0){return s.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:lineFill,width:lineFill==='none'?0:1},borderRadius:radius||undefined});}
function text(s,t,x,y,w,h,size=20,color=C.ink,bold=false,opts={}){const z=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0},text:{text:t,style:{fontFamily:FONT,fontSize:size,color,bold,verticalAlignment:'middle',wrap:true,alignment:opts.align||'left'}}});z.text.insets=0;return z;}
function pill(s,t,x,y,color=C.mint,w=150){shape(s,'roundRect',x,y,w,28,color+'20',color+'60',14);text(s,t,x+10,y+1,w-20,25,12,color,true);}
function base(title,kicker='VDO-X • BEHAVIOR INTELLIGENCE'){const s=ppt.slides.add({background:{fill:C.bg}});shape(s,'rect',0,0,8,720,C.mint);text(s,kicker,58,32,600,22,12,C.mint,true);text(s,title,58,68,1164,62,34,C.ink,true);shape(s,'line',58,142,1164,1,'none',C.line);text(s,'VDO-X  /  Strategy system',58,681,600,18,11,C.muted);text(s,String(ppt.slides.items.length).padStart(2,'0'),1190,681,32,18,11,C.muted,true,{align:'right'});return s;}
function card(s,x,y,w,h,title,body,accent=C.blue,tag){shape(s,'roundRect',x,y,w,h,C.panel,C.line,18);shape(s,'rect',x,y,5,h,accent);if(tag)pill(s,tag,x+20,y+16,accent,Math.max(112,tag.length*9+16));text(s,title,x+20,y+(tag?54:20),w-40,32,20,C.ink,true);text(s,body,x+20,y+(tag?92:61),w-40,h-(tag?108:78),15,C.muted,false);}
function note(s,txt){s.speakerNotes.text=txt;}

// 1
{
 const s=ppt.slides.add({background:{fill:C.bg}});
 shape(s,'ellipse',850,30,420,420,'#18284A','none');shape(s,'ellipse',945,105,280,280,'#15233D','none');
 pill(s,'OBSERVE → DECIDE → LEARN',66,62,C.mint,226);
 text(s,'Turn behavior\ninto better decisions.',66,154,710,185,54,C.ink,true);
 text(s,'A living strategy system for VDO-X—and any product with user behavior data.',70,366,660,68,21,C.muted);
 shape(s,'roundRect',820,190,350,300,C.panel,C.line,26);
 text(s,'SIGNAL',852,224,260,22,12,C.mint,true);text(s,'A user retries\nafter a failed video.',852,267,285,82,27,C.ink,true);
 shape(s,'line',852,376,280,1,'none',C.line);text(s,'DESIGN MOVE',852,395,260,20,12,C.blue,true);text(s,'Keep settings. Explain credit status.\nOffer Retry or Edit.',852,426,285,55,16,C.ink);
 text(s,'Real VDO-X data • clear evidence • human-approved experiments',70,646,760,26,15,C.muted);
 note(s,'The product continuously turns observed platform and user behavior into concrete options. This presentation distinguishes measured signals, instrumentation gaps, and hypotheses. Public site: https://www.vdo-x.art/');
}
// 2
{
 const s=base('A real signal: people try again after failure');
 pill(s,'OBSERVED • NOV 7–13 UTC',60,166,C.mint,222);
 text(s,'73',60,222,270,126,92,C.mint,true);text(s,'adjacent fail → start\nevent transitions',64,347,300,58,20,C.ink,true);
 text(s,'4,708',445,225,290,68,50,C.ink,true);text(s,'event rows',449,298,220,26,16,C.muted);
 text(s,'1,342',760,225,290,68,50,C.ink,true);text(s,'sessions with an ID',764,298,270,26,16,C.muted);
 card(s,60,436,545,164,'What this suggests','A failure is not always the end of intent. Some sessions immediately try again. Transition count ≠ unique people.',C.mint,'OBSERVATION');
 card(s,635,436,585,164,'A useful move to test','Retain the prompt and settings. Show credit status, a plain error explanation, and clear Retry / Edit choices.',C.blue,'DECISION');
 text(s,'Source: public.events; event_name, session_id, created_at only. No prompt or user identity used.',60,615,1120,30,12,C.muted);
 note(s,'Read-only aggregation from the connected VDO-X Supabase project for Nov 7–13, 2026 UTC. Queried event_name, session_id, created_at only. 73 adjacent transitions are sequence counts, not distinct users or causal evidence. Decision is a test proposal.');
}
// 3
{
 const s=base('A platform issue may be masking user intent');
 pill(s,'OBSERVED • ROUTE FAILURE',60,166,C.amber,214);
 text(s,'41 / 49',62,220,360,70,52,C.amber,true);text(s,'failed on Nov 8',64,292,340,27,18,C.ink,true);
 shape(s,'roundRect',460,224,660,22,C.panel2,'none',11);shape(s,'roundRect',460,224,553,22,C.amber,'none',11);
 text(s,'83.7%',1138,215,94,34,22,C.amber,true,{align:'right'});
 text(s,'Same model route, Nov 9–13',62,361,380,27,17,C.muted);text(s,'13 / 84 failed  •  15.5%',460,353,470,40,26,C.mint,true);
 card(s,60,432,540,162,'What we can say','A large failure spike occurred on one provider/model route, then the rate was lower in the following days.',C.amber,'MEASURED');
 card(s,630,432,590,162,'What we should do','Investigate route health and annotate releases. Don’t read a recovery as a UX win until metric definitions line up.',C.blue,'NEXT STEP');
 text(s,'Caution: provider label changed around this period; correlation does not establish cause.',60,615,1120,28,13,C.muted);
 note(s,'Read-only public.videos aggregation: Nov 8 vivix-ai / vivix-w1-fast-i2v: 41 failed of 49. Nov 9–13 same route: 13 failed of 84. Nov 7 under provider label vivix: 0 failed of 19. Provider label changed, so do not infer the label caused the difference. daily_metrics and videos totals differ; reconcile before combining.');
}
// 4
{
 const s=base('A ranked queue of interesting signals');
 const rows=[
  ['01','Retry after failure','Observed','73 fail → start transitions','Recover intent; test retained state + clear retry.'],
  ['02','Generate again after success','Observed','278 complete → start transitions','Test a calm balance cue at the next credit boundary.'],
  ['03','Which plan earns attention?','Missing','No plan exposure / selection events','Measure visible time, taps and checkout by plan.'],
  ['04','When does an offer help?','Hypothesis','No paywall timing events','Compare offer at credit boundary vs after result.'],
  ['05','Who needs more context?','Testable','No explicit preference signal yet','Ask “what matters most?”; tailor explanation, not price.']
 ];
 let y=166;for(const [n,title,status,signal,move] of rows){shape(s,'roundRect',60,y,1160,86,C.panel,C.line,14);text(s,n,78,y+21,52,34,24,C.mint,true);text(s,title,142,y+12,280,28,18,C.ink,true);pill(s,status,430,y+18,status==='Observed'?C.mint:status==='Missing'?C.amber:C.blue,Math.max(110,status.length*9));text(s,signal,590,y+14,270,52,14,C.muted);text(s,move,875,y+14,315,54,14,C.ink);y+=96;}
 text(s,'Ranked by evidence × potential value. Missing data is a product opportunity, not a finding.',60,650,1140,24,13,C.muted);
 note(s,'Event sequence counts from public.events, Nov 7–13 UTC: 278 adjacent video_generate_complete→video_generate_start transitions. This is not 278 distinct users. No pricing, plan, viewport, or paywall events exist in the inspected event set. The remaining ideas are instrumentation or experiment proposals.');
}
// 5
{
 const s=base('Pricing attention: measure the choice, then redesign');
 pill(s,'CONCEPT MOCKUP • NOT A LIVE SCREENSHOT',60,160,C.amber,320);
 text(s,'CURRENT (as described)',76,205,475,28,14,C.muted,true);text(s,'TEST: STACKED ON MOBILE',670,205,490,28,14,C.muted,true);
 // before frame
 shape(s,'roundRect',60,246,530,310,'#101827',C.line,18);text(s,'Choose your plan',85,263,460,28,18,C.ink,true);
 const plans=[['Basic','$9'],['Creator','$19'],['Studio','$39']];let xx=84;for(const [a,b] of plans){shape(s,'roundRect',xx,313,146,188,C.panel2,C.line,12);text(s,a,xx+12,330,120,24,14,C.ink,true);text(s,b,xx+12,370,120,34,23,C.ink,true);text(s,'Credits\nFeatures',xx+12,418,120,40,12,C.muted);shape(s,'roundRect',xx+12,465,120,24,'#24314A','none',12);xx+=160;}
 // after frame
 shape(s,'roundRect',650,246,570,310,'#101827',C.line,18);text(s,'Choose your plan',676,263,480,28,18,C.ink,true);
 let yy=310;for(const [a,b,col] of [['Basic','$9',C.line],['Creator','$19',C.blue],['Studio','$39',C.line]]){shape(s,'roundRect',676,yy,518,66,C.panel2,col,12);text(s,a,695,yy+10,180,25,15,C.ink,true);text(s,b,1014,yy+10,140,25,17,C.ink,true,{align:'right'});text(s,'Credits + feature summary',695,yy+36,390,18,11,C.muted);yy+=75;}
 shape(s,'roundRect',60,570,1160,86,C.panel,C.line,18);shape(s,'rect',60,570,5,86,C.mint);pill(s,'MEASURE FIRST',80,581,C.mint,152);text(s,'What we’ll learn',80,611,1080,25,18,C.ink,true);text(s,'Visible exposure ≠ interest. Track viewable time, tap, checkout and purchase by device.',80,635,1100,22,13,C.muted);
 note(s,'Both UI panels are editable conceptual mockups, not screenshots and not measured outcomes. The “current” horizontal arrangement follows the user’s description and must be verified against a current live capture. Keep price and copy fixed in the first layout test to isolate the layout effect. Mobile exposure should use viewport visibility and dwell thresholds; desktop can additionally record pointer entry/dwell. Do not call either measure intent.');
}
// 6
{
 const s=base('Offer timing: follow the credit journey');
 pill(s,'HYPOTHESIS • NEEDS A CONTROLLED TEST',60,165,C.blue,306);
 const steps=[['01','Create','first success'],['02','Repeat','momentum'],['03','Near limit','decision point'],['04','Offer','clear choice']];let x=65;for(let i=0;i<steps.length;i++){const [n,a,b]=steps[i];shape(s,'roundRect',x,252,250,142,C.panel,C.line,18);text(s,n,x+18,269,40,24,13,C.mint,true);text(s,a,x+18,302,210,34,24,C.ink,true);text(s,b,x+18,345,210,24,14,C.muted);if(i<3){shape(s,'rightArrow',x+252,306,35,28,C.blue,'none');}x+=295;}
 card(s,60,445,545,150,'Variant A','At a defined low-credit threshold, show remaining credits and a transparent offer. Keep generation available where possible.',C.blue,'TEST');
 card(s,635,445,585,150,'Variant B','After a successful result, show the same optional offer only when the user opens the credit panel.',C.mint,'TEST');
 text(s,'Win on paid contribution and retention—not clicks alone. Guardrail: first-result success, refunds, complaints.',60,619,1160,30,13,C.muted);
 note(s,'VDO-X event sequence includes 278 adjacent completion→start transitions, suggesting repeated generation sessions are common enough to study. It does not show credit balance or purchase timing. Compare timing variants with randomized assignment and guardrails. Avoid interrupting creation or using urgency/depletion tricks. Source for experiment design: Microsoft trustworthy experimentation guidance, https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-during-experiment-stage/');
}
// 7
{
 const s=base('More ways to turn behavior into useful choices');
 const items=[
  ['Failure → confident retry','Keep prompt and settings; state whether credits were consumed.','Reduce abandonment without hiding failures.'],
  ['Repeated creation → value clarity','Show what each credit buys before the next generation.','Help users choose the right plan.'],
  ['Plan comparison → self-selected need','Ask “more videos, faster output, or best quality?” and reorder explanations.','Personalize by stated goal, not inferred wealth.'],
  ['Mobile plan exposure → better layout','Stack cards and track visible seconds + tap; compare with control.','Learn which plan is actually seen.'],
  ['Offer dismissal → respect timing','Remember dismissal for the session; provide a persistent pricing link.','Avoid repeated interruption.'],
  ['Country / currency → user choice','Offer a region selector when relevant; don’t infer sensitive traits.','Show accurate price and terms.']
 ];
 let y=167;for(let i=0;i<items.length;i++){const [a,b,c]=items[i];const col=i%2?C.blue:C.mint,x=i%2?655:60, yy=167+Math.floor(i/2)*158;card(s,x,yy,565,140,a,b+'\nGoal: '+c,col,'STRATEGY');}
 note(s,'All six are strategy ideas, not findings from VDO-X event data. Personalization uses explicit user preference and context, not inferred age, wealth, or vulnerability. Pricing, credits, and offer terms remain transparent and consistent. FTC dark patterns report: https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers');
}
// 8
{
 const s=base('Collect the smallest useful behavior signal');
 const ev=[['plan_impression','plan + variant'],['plan_viewable','% visible + ms'],['plan_select','plan tapped'],['credits_view','balance bucket'],['offer_view / dismiss','trigger + action'],['checkout / purchase','plan + outcome']];
 let y=177;for(let i=0;i<ev.length;i++){const [a,b]=ev[i];const x=i%2?650:60,yy=177+Math.floor(i/2)*132;shape(s,'roundRect',x,yy,570,106,C.panel,C.line,16);text(s,String(i+1).padStart(2,'0'),x+18,yy+20,42,25,15,C.mint,true);text(s,a,x+72,yy+17,260,28,17,C.ink,true);text(s,b,x+72,yy+54,440,24,14,C.muted);}
 text(s,'Attach: anonymous session • page • device class • experiment variant • consent state',60,595,1160,28,16,C.blue,true);
 text(s,'Desktop: pointer dwell is a weak proxy. Mobile: viewport exposure + scroll. Neither proves attention.',60,635,1160,26,13,C.muted);
 note(s,'Implementation proposal based on IntersectionObserver and Page Visibility API. Record only events needed for a defined decision; respect consent and retention controls. Desktop pointer events can supplement but do not establish attention. Mobile exposure can use visible fraction and time in viewport. MDN: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API and https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API');
}
// 9
{
 const s=base('The system proposes. The owner decides.');
 const stages=[['CONNECT','Bring in product, billing and behavior data.'],['UNDERSTAND','Map schemas; surface missing measurements.'],['OBSERVE','Rank signals with counts, time window and source.'],['PROPOSE','Generate multiple creative strategies + tradeoffs.'],['PREVIEW','Show before / after and expected measurement.'],['APPROVE','User selects; experiment runs with rollback.']];
 let y=170;for(let i=0;i<stages.length;i++){const [a,b]=stages[i];const x=60+i*198;shape(s,'roundRect',x,y,176,220,C.panel,C.line,18);text(s,String(i+1).padStart(2,'0'),x+16,y+18,44,26,14,C.mint,true);text(s,a,x+16,y+62,145,27,15,C.ink,true);text(s,b,x+16,y+102,145,84,14,C.muted);if(i<5)shape(s,'rightArrow',x+178,y+94,19,24,C.blue,'none');}
 card(s,60,435,1160,155,'Every recommendation carries its evidence','Observed value + denominator + date range + source table. If data is missing: say so, propose how to collect it, then wait for evidence.',C.mint,'TRACEABLE');
 text(s,'Apply means staged change → preview → explicit approval → monitored rollout → one-click rollback.',60,613,1160,28,14,C.blue,true);
 note(s,'Product architecture and human approval flow proposed for this system. No automatic production changes. Include provenance, confidence, competing explanations, experiment assignment, guardrails, audit trail, and rollback. NIST AI RMF: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf');
}
// 10
{
 const s=base('Open datasets can teach the system—not speak for VDO-X');
 const ds=[
  ['UCI Online Shoppers','12,330 sessions • CC BY 4.0','Useful for session-level purchase behavior; no raw event sequence.'],
  ['Google GA4 demo','Public BigQuery ecommerce sample','Useful schema / funnel practice; verify terms before redistribution.'],
  ['Coveo SIGIR eCom','Rich query + click sessions','Research challenge data; check permitted purpose and access terms.'],
  ['YOOCHOOSE / Retailrocket','Clickstream + ecommerce events','Potential sequence benchmarks; reuse rights need review.']
 ];let y=170;for(const [a,b,c] of ds){shape(s,'roundRect',60,y,1160,88,C.panel,C.line,14);text(s,a,82,y+12,250,28,18,C.ink,true);text(s,b,350,y+11,330,29,14,C.mint,true);text(s,c,710,y+10,480,58,14,C.muted);y+=101;}
 text(s,'Use public data to test pipeline and methods. Never present it as VDO-X customer evidence.',60,600,1160,36,17,C.amber,true);
 note(s,'Sources and caveats: UCI https://archive.ics.uci.edu/dataset/468/online (CC BY 4.0); Google GA4 sample https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset; Coveo challenge https://sigir-ecom.github.io/ecom2021/data-task.html and https://github.com/coveooss/SIGIR-ecom-data-challenge/blob/main/README.md; YOOCHOOSE https://recsys.acm.org/recsys15/challenge/; Retailrocket https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset. Verify dataset terms before use. Public datasets validate analysis methods; they do not establish VDO-X behavior.');
}
// 11
{
 const s=base('A practical first build');
 card(s,60,170,360,180,'1 • Instrument','Add plan exposure, device-aware visibility, credit milestones, offer actions and checkout outcomes.',C.mint,'NOW');
 card(s,460,170,360,180,'2 • Recover intent','Prototype retained-state retry and clear credit/error messaging for generation failures.',C.blue,'NEXT');
 card(s,860,170,360,180,'3 • Learn safely','Run layout and offer-timing tests with a holdout, contribution metric and user-experience guardrails.',C.amber,'THEN');
 shape(s,'roundRect',60,395,1160,196,C.panel,C.line,20);text(s,'What we can trust today',88,421,350,28,20,C.ink,true);text(s,'• Generation, completion, failure and retry sequences\n• Route-level failure spike (with provider-label caveat)\n• No pricing attention, plan choice, credit balance or paywall timing yet',88,464,720,100,16,C.muted);
 text(s,'Connection access',856,423,270,25,13,C.mint,true);text(s,'Read-only aggregation used. Keep service keys server-side; rotate the key shared in chat.',856,460,300,86,15,C.ink);
 text(s,'Next outcome: a live ranked strategy feed with evidence, concept previews and an explicit “apply” review.',60,625,1160,30,15,C.blue,true);
 note(s,'Prioritized based on actual available event stream and gaps. Important data reconciliation: daily_metrics Nov 7–13 reports 562 started, 429 completed, 133 failed; videos table has 550 rows with 424 completed and 126 failed. Align definitions/retries before deriving rates. The service secret provided in chat should be rotated and kept in a server-only environment variable.');
}

await fs.mkdir(new URL('../deliverables/',import.meta.url),{recursive:true});
for(let i=0;i<ppt.slides.items.length;i++){
 const blob=await ppt.export({slide:ppt.slides.items[i],format:'png',scale:1});
 await fs.writeFile(`${PREVIEW}/slide-${String(i+1).padStart(2,'0')}.png`,Buffer.from(await blob.arrayBuffer()));
}
for(let si=0;si<ppt.slides.items.length;si++) for(const sh of ppt.slides.items[si].shapes.items){const p=sh.position;if(p&&(p.width<0||p.height<0||!Number.isFinite(p.width)||!Number.isFinite(p.height))) console.log('BAD SHAPE',si+1,sh.geometry,p);}
const out=await PresentationFile.exportPptx(ppt);await out.save(OUT);
console.log(`Created ${OUT}; ${ppt.slides.items.length} slides`);
