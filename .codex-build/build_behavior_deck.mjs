import { Presentation } from '/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';
const DIR='/Users/gabrielsalem/Documents/BizOptimizer/.codex-build/behavior-previews';await fs.mkdir(DIR,{recursive:true});
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#F5F3ED',paper:'#FFFEFA',ink:'#24352A',muted:'#788278',line:'#E2E5DC',green:'#2E5238',sage:'#8EA485',lime:'#D5EEA7',amber:'#D59A55',amberBg:'#F6EEDF',soft:'#EDF1E8',white:'#FFFFFF'};
function box(s,x,y,w,h,fill=C.paper,line=C.line,r=14){return s.shapes.add({geometry:'roundRect',position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:line,width:1},borderRadius:r});}
function rect(s,x,y,w,h,fill){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:'none',width:0}});}
function t(s,str,x,y,w,h,size=18,color=C.ink,bold=false,align='left',font='Aptos'){let z=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{style:'solid',fill:'none',width:0},text:{text:str,style:{fontFamily:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',wrap:true}}});z.text.insets=0;return z;}
function pill(s,str,x,y,color=C.green,w=200){box(s,x,y,w,25,color+'15',color+'50',12);t(s,str,x+9,y+1,w-18,22,10,color,true);}
function base(title,n,tag='HUMAN BEHAVIOR → PAGE STRATEGY'){let s=p.slides.add({background:{fill:C.bg}});rect(s,0,0,7,720,C.green);t(s,tag,54,27,750,22,11,C.green,true);t(s,title,54,61,1155,58,34,C.ink,true);rect(s,54,133,1172,1,C.line);t(s,'VDO-X   /   Observe · Reshape · Learn',54,681,700,18,10,C.muted);t(s,String(n).padStart(2,'0'),1190,681,32,18,10,C.muted,true,'right');return s;}
function addScreen(s,x,y,w,h,label,kind,variant){
 t(s,label,x,y-23,w,18,10,variant==='before'?C.muted:C.green,true);
 box(s,x,y,w,h,C.paper,C.line,12);rect(s,x,y,w,31,'#F0F2EC');t(s,'v/  VDO-X',x+12,y+7,100,17,9,C.green,true);t(s,'•••',x+w-37,y+7,24,17,10,C.muted,false,'center');
 const ix=x+15,iw=w-30,top=y+43;
 const title={plans:'Choose your plan',preference:variant==='before'?'Plans that fit everyone':'What matters most to you?',offer:variant==='before'?'Make your first video':'Ready to make another?',country:variant==='before'?'Choose a plan':'Choose your region',credits:variant==='before'?'Start creating':'Your first credits',retry:variant==='before'?'Generation failed':'Your idea is still here',progress:variant==='before'?'Creating video…':'Your video is taking shape',compare:variant==='before'?'A special deal for you':'Compare plans, simply'}[kind];
 t(s,title,ix,top,iw,27,16,C.ink,true);
 if(kind==='plans'){
  if(variant==='before'){
   const cw=(iw-14)/3;['Basic','$9','Creator','$19','Studio','$39'];
   [['Basic','$9'],['Creator','$19'],['Studio','$39']].forEach(([a,b],i)=>{const xx=ix+i*(cw+7);box(s,xx,top+40,cw,150,'#FAFAF6',C.line,7);t(s,a,xx+7,top+51,cw-14,17,9,C.ink,true);t(s,b,xx+7,top+78,cw-14,23,17,C.ink,true);t(s,'Credits\nFeatures',xx+7,top+111,cw-14,34,8,C.muted);});
  }else{
   [['Basic','For trying it out'],['Creator','For regular videos'],['Studio','For bigger projects']].forEach(([a,b],i)=>{const yy=top+39+i*53;box(s,ix,yy,iw,45,i===1?'#F1F6EC':'#FAFAF6',i===1?C.sage:C.line,6);t(s,a,ix+9,yy+5,120,17,9,C.ink,true);t(s,b,ix+9,yy+23,iw-18,14,8,C.muted);t(s,['$9','$19','$39'][i],ix+iw-55,yy+11,45,20,10,C.green,true,'right');});
  }
 }else if(kind==='preference'){
  if(variant==='before')t(s,'One feature list. One way to explain the value.',ix,top+48,iw,50,11,C.muted);
  else ['Save more','Best quality','Move faster'].forEach((v,i)=>{let yy=top+43+i*39;box(s,ix,yy,iw,32,C.soft,C.line,6);t(s,v,ix+10,yy+6,iw-20,20,10,C.green,true);});
 }else if(kind==='offer'){
  if(variant==='before'){box(s,ix+25,top+44,iw-50,100,'#FFF8ED','#E8D9C1',9);t(s,'Unlock more credits!',ix+38,top+57,iw-76,22,12,C.ink,true);t(s,'Pick a plan to continue.',ix+38,top+82,iw-76,16,9,C.muted);box(s,ix+38,top+108,iw-76,26,C.green,C.green,5);t(s,'See plans',ix+42,top+111,iw-84,18,9,C.white,true,'center');}
  else{box(s,ix,top+41,iw,56,'#F0F5EC','#DDE6D8',8);t(s,'Your video is ready  ✓',ix+10,top+53,iw-20,22,11,C.green,true);t(s,'Make another when you’re ready.',ix,top+111,iw,18,9,C.muted);box(s,ix,top+136,iw,27,C.green,C.green,5);t(s,'See credit options',ix+5,top+140,iw-10,17,9,C.white,true,'center');}
 }else if(kind==='country'){
  if(variant==='before')t(s,'Price shown with no clear currency or local payment context.',ix,top+48,iw,55,10,C.muted);
  else{t(s,'Prices and payment options vary by region.',ix,top+43,iw,29,9,C.muted);box(s,ix,top+81,iw,37,'#FAFAF6',C.line,6);t(s,'Country or region',ix+9,top+89,iw-18,20,9,C.ink);box(s,ix,top+130,iw,26,C.green,C.green,5);t(s,'Show local price',ix+4,top+134,iw-8,18,9,C.white,true,'center');}
 }else if(kind==='credits'){
  if(variant==='before')t(s,'Free credits',ix,top+50,iw,30,14,C.ink,true);
  else{box(s,ix,top+44,iw,54,C.soft,C.line,7);t(s,'Starter credits',ix+10,top+50,iw-20,20,10,C.green,true);t(s,'Enough to try one idea',ix+10,top+72,iw-20,17,9,C.muted);t(s,'Know what each credit includes.',ix,top+110,iw,22,9,C.muted);}
 }else if(kind==='retry'){
  if(variant==='before'){box(s,ix,top+45,iw,45,'#F8EFEB','#EAD8D1',7);t(s,'Something went wrong.',ix+9,top+57,iw-18,20,10,'#936257');t(s,'Prompt and credit status unclear',ix,top+105,iw,18,8,C.muted);}
  else{box(s,ix,top+43,iw,44,C.soft,C.line,7);t(s,'Prompt saved · credits returned',ix+9,top+54,iw-18,20,9,C.green,true);box(s,ix,top+98,iw/2-4,28,C.green,C.green,5);t(s,'Retry',ix+5,top+103,iw/2-14,18,9,C.white,true,'center');box(s,ix+iw/2+4,top+98,iw/2-4,28,'#FAFAF6',C.line,5);t(s,'Edit',ix+iw/2+9,top+103,iw/2-14,18,9,C.ink,true,'center');}
 }else if(kind==='progress'){
  if(variant==='before'){box(s,ix+iw/2-12,top+60,24,24,'#E9EDE5',C.line,12);t(s,'Please wait',ix,top+99,iw,19,9,C.muted,false,'center');}
  else{box(s,ix,top+53,iw,8,'#E7EBE3',C.line,4);box(s,ix,top+53,iw*.66,8,C.sage,C.sage,4);t(s,'Still working · your prompt is saved',ix,top+73,iw,24,9,C.green);t(s,'We’ll show the result here.',ix,top+104,iw,18,8,C.muted);}
 }else if(kind==='compare'){
  if(variant==='before'){box(s,ix+20,top+45,iw-40,79,'#FFF7E9','#E7D6BD',8);t(s,'Sale ends soon!',ix+30,top+56,iw-60,25,12,C.amber,true,'center');t(s,'Buy now',ix+30,top+86,iw-60,21,9,C.ink,false,'center');}
  else{t(s,'Not sure which plan fits?',ix,top+43,iw,22,10,C.ink,true);[['Basic','Try it'],['Creator','Create often']].forEach(([a,b],i)=>{let yy=top+74+i*39;box(s,ix,yy,iw,31,C.soft,C.line,5);t(s,`${a} · ${b}`,ix+8,yy+6,iw-16,19,9,C.green);});}
 }
}
function caseSlide(n,d){const s=base(d.title,n);pill(s,d.status,56,151,d.color||C.amber,Math.min(390,d.status.length*7+28));
 box(s,56,193,342,151,C.paper,C.line,14);t(s,'THE OBSERVATION',76,209,294,19,10,C.muted,true);t(s,d.observation,76,238,294,91,16,C.ink,false,'left','Aptos');
 box(s,56,358,342,173,'#F0F4EB','#DCE5D8',14);t(s,'THE DECISION',76,374,294,19,10,C.green,true);t(s,d.decision,76,401,294,105,13,C.ink,false);
 const rightX=430,w=367,gap=22;addScreen(s,rightX,218,w,274,'BEFORE',d.kind,'before');addScreen(s,rightX+w+gap,218,w,274,'AFTER · CONCEPT',d.kind,'after');
 box(s,56,548,342,103,C.amberBg,'#E9DCC7',12);t(s,'WHY + GOAL',73,560,305,16,9,C.amber,true);t(s,d.goal,73,580,305,52,12,C.ink,false);
 box(s,430,548,756,103,C.paper,C.line,12);t(s,'PREDICTED DIRECTION · NOT A PROMISE',448,560,720,16,9,C.green,true);t(s,d.prediction,448,580,715,53,12,C.ink,false);
 t(s,'CONCEPT MOCKUPS · not live screenshots or proven results',801,652,385,18,9,C.muted,false,'right');s.speakerNotes.text=d.notes||'Behavior hypothesis and concept mockup. Predicted outcomes are directional hypotheses, not measured lifts.';return s;}

// Cover
{
 const s=p.slides.add({background:{fill:C.bg}});rect(s,0,0,8,720,C.green);pill(s,'VDO-X · HUMAN BEHAVIOR STRATEGY',62,64,C.green,264);
 t(s,'Find the human signal.\nMake the page respond.',62,156,760,190,52,C.ink,true,'left','Aptos Display');
 t(s,'A living feed of observations, creative page changes, and the reason behind each move.',66,388,640,56,20,C.muted);
 box(s,842,169,320,316,C.paper,C.line,24);t(s,'NOTICE',874,202,240,20,10,C.green,true);t(s,'Someone pauses\non plan three.',874,244,250,72,25,C.ink,true);rect(s,874,338,253,1,C.line);t(s,'RESHAPE',874,360,240,20,10,C.amber,true);t(s,'Give it room.\nExplain who it helps.',874,396,250,61,17,C.ink);
 t(s,'OBSERVE → DECIDE → TEST → LEARN',66,648,620,24,13,C.green,true);t(s,'01',1186,681,32,18,10,C.muted,true,'right');s.speakerNotes.text='A product for discovering useful human behavior signals, proposing creative page changes, and learning from their outcomes. Some examples are based on user intuition and need validation; one retry signal is measured in VDO-X data.';
}
// How ideas are framed
{
 const s=base('Every idea answers five simple questions.',2);const rows=[['01','What did we notice?','A measured signal or an intuition worth testing.'],['02','What should change?','One concrete page or journey decision.'],['03','Why might it work?','The human reason behind the change.'],['04','What is the goal?','Sales, engagement, or learning.'],['05','What should improve?','A predicted direction—then test it.']];let y=173;for(const [n,a,b] of rows){box(s,58,y,1125,78,C.paper,C.line,12);t(s,n,78,y+20,48,31,22,C.sage,true);t(s,a,147,y+12,340,26,17,C.ink,true);t(s,b,492,y+13,650,45,14,C.muted);y+=91;}s.speakerNotes.text='The feed labels evidence. “Seen in data” means there is an observed VDO-X behavior sequence. “Human insight” means a plausible pattern from product intuition, not a proven VDO-X finding.';
}

const cases=[
 {title:'Does plan three deserve more room?',status:'YOUR OBSERVATION · NEEDS MEASUREMENT',kind:'plans',color:C.amber,observation:'Your intuition: visitors spend longer looking at the third plan than the first two. The current data cannot confirm it yet.',decision:'Test stacked plan cards on mobile. Give each plan room to explain who it is for, then track what becomes visible and what people choose.',goal:'GOAL · Learn which plan earns attention—and help visitors choose with confidence.',prediction:'More meaningful plan comparisons and clearer selection. Sales may improve if the highlighted plan is the right fit; verify with a controlled test.',notes:'User-provided hypothesis. Before/after is a concept recreation based on the described three-across plan layout, not a live screenshot. Directional prediction only; no lift is claimed.'},
 {title:'Price-first and value-first visitors need different explanations.',status:'HUMAN INSIGHT · TEST THE PREFERENCE',kind:'preference',observation:'Some people prioritize a lower commitment. Others care most about quality, speed, or the result they can get.',decision:'Ask one optional “what matters most?” question. Reorder the explanation around their answer; keep prices and terms consistent.',goal:'GOAL · Make the page feel relevant without guessing who the visitor is.',prediction:'More useful plan discovery and fewer mismatched purchases. Compare conversion, cancellation, and satisfaction by stated preference.',notes:'Hypothesis, not measured VDO-X behavior. Segment by explicit preference, never inferred age or wealth.'},
 {title:'Show the credit offer after the first win.',status:'HUMAN INSIGHT · TIMING HYPOTHESIS',kind:'offer',observation:'A visitor who has made a video and wants another has felt the product’s value. A visitor who has not seen a result has not.',decision:'Test a quiet, optional offer near the credit limit or when they open credit options—after a successful result.',goal:'GOAL · Increase revenue while protecting the first-success moment.',prediction:'More relevant offer engagement with less interruption. Watch purchases alongside first-result completion, refunds, and repeat use.',notes:'Hypothesis from user-provided product insight. No current credit/paywall events establish this pattern. Offer timing must be tested with user-experience guardrails.'},
 {title:'Make the price feel clear in the visitor’s region.',status:'HUMAN INSIGHT · OPTIONAL QUESTION',kind:'country',observation:'Currency, taxes, and payment methods change how a price is understood. Silent location guesses can be wrong.',decision:'Offer a simple country/currency selector when pricing opens. Explain why and let the visitor change it.',goal:'GOAL · Reduce checkout surprise and learn which local options matter.',prediction:'Fewer price misunderstandings and potentially more completed checkouts. Measure selector use and checkout completion.',notes:'General ecommerce pattern, not a measured VDO-X signal. Ask only when useful, and allow the visitor to change the region.'},
 {title:'Give enough credits to reach value—not unlimited free use.',status:'HUMAN INSIGHT · COST-AWARE TEST',kind:'credits',observation:'Visitors need a real chance to discover whether video creation is useful. Each generation also costs the business money.',decision:'Test a clear starter allowance that balances a satisfying first result with generation cost. Explain what the credits include.',goal:'GOAL · Hook interested creators while keeping trial cost sustainable.',prediction:'More visitors reach a good first result at a controlled cost. Track first success, repeat use, cost, and paid conversion.',notes:'Hypothesis. Do not ration by inferred age, wealth, or predicted buyer status. Tie any allowance to transparent product rules and test outcomes.'},
 {title:'A failed video does not always end the session.',status:'SEEN IN VDO-X DATA · 73 RETRY TRANSITIONS',kind:'retry',color:C.green,observation:'In the Nov 7–13 VDO-X event window, 73 adjacent failure → new-start transitions appeared. That is not 73 distinct people.',decision:'Keep the prompt and settings. Explain credit status, then offer Retry or Edit right where the failure happened.',goal:'GOAL · Save the visitor’s effort and turn a failed attempt into a successful result.',prediction:'More recovered generations and less frustration. Measure retry success and whether people continue creating.',notes:'Measured VDO-X behavior: 73 adjacent video_generate_fail → video_generate_start transitions during Nov 7–13, 2026 UTC. Transitions, not unique users. Supabase public.events aggregate; the slide omits provider/API troubleshooting.'},
 {title:'Keep the visitor with you while the first result is forming.',status:'HUMAN INSIGHT · TEST THE MOMENT',kind:'progress',observation:'The first result is when the product proves itself. A silent wait can feel like a broken promise.',decision:'Show progress in plain language and keep the visitor’s idea visible while the video is being created.',goal:'GOAL · Help more visitors reach the first result and enjoy the experience.',prediction:'Fewer early exits and more completed first creations. Compare first-result completion and later repeat use.',notes:'Hypothesis about waiting and uncertainty. Proposed progress UI is a concept; no lift is measured.'},
 {title:'Repeated pricing visits may mean “help me choose.”',status:'GENERAL PATTERN · NEEDS SITE DATA',kind:'compare',observation:'On many websites, repeated price checks can mean a person is weighing value, limits, or commitment. It can also be ordinary browsing.',decision:'Offer a calm plan comparison or “help me choose” guide before reaching for a discount popup.',goal:'GOAL · Answer hesitation and protect revenue from unnecessary discounting.',prediction:'More informed checkout starts and healthier purchase quality. Measure comparison use and completed purchases.',notes:'General ecommerce hypothesis, not VDO-X evidence. Do not claim repeat pricing views until measured.'},
];
cases.forEach((d,i)=>caseSlide(i+3,d));
{
 const s=base('One feed. Three goals. Better decisions.',11);const goals=[['MORE SALES','Convert genuine interest into a clear purchase.'],['MORE ENGAGEMENT','Help more visitors reach value and come back.'],['MORE LEARNING','Collect the signal needed to make the next choice smarter.']];let x=58;for(const [a,b] of goals){box(s,x,191,355,185,C.paper,C.line,18);t(s,a,x+22,215,310,20,11,C.green,true);t(s,b,x+22,258,310,75,20,C.ink,false,'left','Aptos');x+=380;}box(s,58,419,1120,164,'#EDF2E9','#DCE5D8',17);t(s,'The loop',82,443,250,25,18,C.ink,true);t(s,'Notice → choose a goal → change the page → watch what happens → keep, improve, or undo.',82,485,1040,55,21,C.green,false);t(s,'Every concept is a proposal. The owner decides what to test and when to apply it.',58,617,1120,27,14,C.muted);s.speakerNotes.text='Summary: the system should support multiple objectives, not only revenue. Make predicted results explicit as hypotheses, run controlled comparisons, and retain owner approval.';
}

for(let i=0;i<p.slides.items.length;i++){
 const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});
 await fs.writeFile(`${DIR}/slide-${String(i+1).padStart(2,'0')}.png`,Buffer.from(await blob.arrayBuffer()));
}
console.log(`Rendered ${p.slides.items.length} behavior-centered slides`);
