import pptxgen from '/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs/dist/pptxgen.es.js';
const pptx=new pptxgen();pptx.layout='LAYOUT_WIDE';pptx.author='Codex';pptx.subject='VDO-X behavior intelligence';pptx.title='Turn behavior into better decisions';pptx.company='VDO-X';pptx.lang='en-US';
const notes=[
'The product finds human behavior patterns, suggests ways to change the page, and learns from what happens. Some are VDO-X signals; some are hypotheses.',
'Each idea names an observation, a page decision, the human reason, a goal, and an expected direction. Expected results are predictions, not measured lifts.',
'The three-across layout is based on the user’s description; the plan-three attention pattern is their hypothesis. Concept mockup, not a current screenshot.',
'Visitors may prioritize price, quality, or speed. Ask their preference instead of inferring traits. Keep actual pricing and terms consistent.',
'Test an optional credit offer after the visitor reaches a first successful result and approaches a credit decision. Measure revenue alongside experience guardrails.',
'An optional region selector can make currency and checkout terms clearer. Ask only when useful and let the visitor change the selection.',
'Credit allowance is a cost-aware experiment. Do not infer age or wealth or assign less value based on guessed buyer potential.',
'Measured VDO-X event data for Nov 7–13, 2026 UTC included 73 adjacent failure → new-start transitions. These are transitions, not distinct people. Page redesign is a proposal.',
'A progress state may reduce uncertainty during the first creation. This is a human-behavior hypothesis to test.',
'Repeated price checks may indicate unresolved questions, but can also be ordinary browsing. The proposed comparison should be tested before discounting.',
'Choose a goal for each experiment: sales, engagement, or learning. Keep, improve, or undo the change based on observed outcomes.'
];
for(let i=1;i<=11;i++){const slide=pptx.addSlide();slide.addImage({path:`/Users/gabrielsalem/Documents/BizOptimizer/.codex-build/behavior-previews/slide-${String(i).padStart(2,'0')}.png`,x:0,y:0,w:13.333333,h:7.5});slide.addNotes(notes[i-1]||'');}
await pptx.writeFile({fileName:'/Users/gabrielsalem/Documents/BizOptimizer/deliverables/VDO-X-Human-Behavior-Strategies.pptx'});console.log('Packaged 11 slides');
