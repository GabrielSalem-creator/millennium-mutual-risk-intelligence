const ideas = [
  {
    id: 'third-plan', rank: '01', status: 'YOUR OBSERVATION · NEEDS MEASUREMENT', goal: ['sales', 'learning'],
    title: 'The third plan may be getting the longest look.',
    observation: 'Your instinct: people linger on plan three more than plans one or two. We do not have plan-attention data yet.',
    decision: 'Make each plan easier to compare. On mobile, test a vertical stack and let the most-considered plan explain who it suits—without changing its price.',
    why: 'Attention is a clue, not a purchase. A clearer comparison can turn interest into a confident choice and show us which plan people actually consider.',
    expected: 'Predicted: more plan comparisons and clearer plan selection; potentially more purchases if the third plan is a good fit. Measure before claiming a lift.',
    before: 'Three plan cards share one row. Each gets little room; mobile compresses the choice.', after: 'Plans stack vertically. Each gets space for its best-fit customer, value, and a clear choice.',
    mock: 'plans'
  },
  {
    id: 'value-style', rank: '02', status: 'HUMAN INSIGHT · TEST THE PREFERENCE', goal: ['sales', 'engagement'],
    title: 'People buy through different lenses: price, value, or speed.',
    observation: 'Some visitors want the lowest commitment. Others care more about output quality, time saved, or results.',
    decision: 'Ask one optional question: “What matters most today?” Then change the explanation and order of benefits—not the underlying price.',
    why: 'A stated preference is more useful than guessing someone’s age, income, or willingness to pay.',
    expected: 'Predicted: more relevant plan explanations and fewer mismatched choices. Compare purchase and cancellation quality by selected preference.',
    before: 'Everyone sees the same feature list and discount emphasis.', after: 'A price-focused visitor sees clear savings; a quality-focused visitor sees output examples and value.',
    mock: 'preference'
  },
  {
    id: 'offer-moment', rank: '03', status: 'HUMAN INSIGHT · TIMING HYPOTHESIS', goal: ['sales', 'engagement'],
    title: 'Show the offer when someone wants the next video—not before they love the first.',
    observation: 'A person who has just made a video and starts another may be more receptive to a credit offer than someone who has not seen a result.',
    decision: 'Test an optional offer near the credit limit or when the person opens credits. Keep the first creation uninterrupted and make dismissal easy.',
    why: 'The experience creates value first; the offer appears when the need is real.',
    expected: 'Predicted: more purchases at a relevant moment with less interruption. Watch repeat creation, purchases, refunds, and drop-off.',
    before: 'A pricing popup interrupts before the visitor has made anything.', after: 'The person gets a result. At a credit decision, a calm offer shows the next options.',
    mock: 'offer'
  },
  {
    id: 'country', rank: '04', status: 'HUMAN INSIGHT · OPTIONAL QUESTION', goal: ['sales', 'learning'],
    title: 'Ask for country only when it helps the visitor.',
    observation: 'Location can change currency, taxes, payment methods, and how a price feels—but silently guessing can be wrong.',
    decision: 'Offer a small country/currency choice when the visitor opens pricing. Explain why; remember the choice and let them change it.',
    why: 'A useful question can improve clarity while also giving the product reliable context.',
    expected: 'Predicted: fewer currency surprises and better checkout completion. Measure selector use and checkout outcomes.',
    before: 'A price appears with an unclear currency or payment context.', after: '“Choose your region” gives a clear local price and payment options.',
    mock: 'country'
  },
  {
    id: 'credits', rank: '05', status: 'HUMAN INSIGHT · COST-AWARE TEST', goal: ['sales', 'learning'],
    title: 'Give trial credits where they help a person reach value.',
    observation: 'Some visitors need a little room to discover whether the generator is useful. Credits also have a real serving cost.',
    decision: 'Test a transparent starter allowance based on product cost and what the visitor is trying to do—not inferred age, wealth, or buyer potential.',
    why: 'The right first experience can hook a genuinely interested user without giving away unlimited costly generations.',
    expected: 'Predicted: more visitors reach a satisfying result while keeping trial cost bounded. Track first-result rate, repeat use, cost, and paid conversion.',
    before: 'Everyone gets an unexplained credit amount.', after: 'The visitor sees what credits include and can choose a small starter path or a plan.',
    mock: 'credits'
  },
  {
    id: 'retry', rank: '06', status: 'SEEN IN VDO-X DATA', goal: ['engagement', 'learning'],
    title: 'A failed generation does not always end the session.',
    observation: 'We found 73 adjacent fail → start event transitions in the seven-day VDO-X event window. These are transitions, not 73 distinct people.',
    decision: 'Keep the prompt and settings, explain whether credits were used, and offer Retry or Edit in place.',
    why: 'When someone chooses to try again, remove the work they would otherwise need to repeat.',
    expected: 'Predicted: more successful recoveries and less frustration. Measure retry success and credit clarity.',
    before: 'A failure leaves the visitor to figure out what happened and rebuild the request.', after: 'The request is still there; the person can retry or adjust it with clear credit status.',
    mock: 'retry'
  },
  {
    id: 'first-result', rank: '07', status: 'HUMAN INSIGHT · TEST THE JOURNEY', goal: ['engagement', 'sales'],
    title: 'Protect the moment a visitor is waiting to see their first result.',
    observation: 'A first generated video is the moment the product proves itself. Confusion or a silent wait can break the spell.',
    decision: 'Show a reassuring progress state, explain what is happening in plain language, and keep the prompt visible while it runs.',
    why: 'Reduce uncertainty without distracting from the result the person came to make.',
    expected: 'Predicted: more visitors reach and value their first result. Compare completion, abandonment, and repeat creation.',
    before: 'A spinner gives no sense of progress or what happens next.', after: 'A calm progress message keeps the visitor oriented until the result is ready.',
    mock: 'progress'
  },
  {
    id: 'checkout-hesitation', rank: '08', status: 'GENERAL PATTERN · NEEDS SITE DATA', goal: ['sales', 'learning'],
    title: 'A visitor who returns to pricing may be comparing—not ready to leave.',
    observation: 'Across websites, repeated price checks can signal unresolved questions about value, limits, or commitment. It can also mean simple browsing.',
    decision: 'Offer a compact plan comparison or “help me choose” link instead of launching a discount popup.',
    why: 'Answer the question behind hesitation before lowering price or adding pressure.',
    expected: 'Predicted: more informed checkout starts and less unnecessary discounting. Measure comparison use and purchase quality.',
    before: 'Returning to pricing triggers a generic sale popup.', after: 'A simple comparison answers “which plan fits?” and leaves the visitor in control.',
    mock: 'compare'
  }
];

const feed = document.querySelector('#strategy-feed');
const filterButtons = document.querySelectorAll('.filter-chip');
let activeFilter = 'all';

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function miniPage(kind, label, variant) {
  const heading = {
    plans: variant === 'before' ? 'Pick a plan' : 'Find the right fit',
    preference: variant === 'before' ? 'Plans' : 'What matters most?',
    offer: variant === 'before' ? 'Create your video' : 'You’re ready for another',
    country: variant === 'before' ? 'Plans' : 'Set your region',
    credits: variant === 'before' ? 'Start creating' : 'Your first credits',
    retry: variant === 'before' ? 'Generation failed' : 'Try again your way',
    progress: variant === 'before' ? 'Creating video…' : 'Your video is taking shape',
    compare: variant === 'before' ? 'Limited time offer!' : 'Compare plans'
  }[kind];
  const body = {
    plans: variant === 'before' ? '<div class="mock-row"><i>Basic</i><i>Creator</i><i>Studio</i></div>' : '<div class="mock-stack"><i>Basic · for trying it out</i><i class="mock-highlight">Creator · for regular videos</i><i>Studio · for bigger projects</i></div>',
    preference: variant === 'before' ? '<div class="mock-row"><i>Same features</i><i>Same copy</i><i>Same price</i></div>' : '<div class="mock-choices"><i>Save more</i><i>Best quality</i><i>Move faster</i></div>',
    offer: variant === 'before' ? '<i class="mock-button">See plans</i><small class="mock-muted">Before your first result</small>' : '<div class="mock-result">Your video is ready ✓</div><i class="mock-button">See credit options</i>',
    country: variant === 'before' ? '<div class="mock-price">$19 / ???</div>' : '<div class="mock-result">Choose region · CAD $19</div>',
    credits: variant === 'before' ? '<div class="mock-price">Free credits</div>' : '<div class="mock-result">Starter credits · enough to try one idea</div>',
    retry: variant === 'before' ? '<div class="mock-error">Something went wrong</div>' : '<div class="mock-result">Prompt saved · credits returned</div><i class="mock-button">Retry video</i>',
    progress: variant === 'before' ? '<div class="mock-spinner"></div>' : '<div class="mock-progress"><i></i></div><small class="mock-muted">Still working · your prompt is saved</small>',
    compare: variant === 'before' ? '<div class="mock-pop">SALE! Buy now</div>' : '<div class="mock-stack"><i>Basic · what’s included</i><i>Creator · what’s included</i></div>'
  }[kind];
  return `<div class="page-preview ${variant}"><div class="preview-top"><b>v/ VDO-X</b><span>•••</span></div><small>${label}</small><strong>${heading}</strong><div class="preview-content">${body}</div></div>`;
}

function render() {
  const visible = ideas.filter((idea) => activeFilter === 'all' || idea.goal.includes(activeFilter));
  feed.innerHTML = visible.map((idea) => `<article class="idea-card" data-idea="${idea.id}">
    <button class="idea-summary" aria-expanded="false" aria-controls="detail-${idea.id}">
      <span class="idea-rank">${idea.rank}</span><span class="idea-summary-copy"><small class="idea-status ${idea.id === 'retry' ? 'measured' : ''}">${idea.status}</small><strong>${escapeHTML(idea.title)}</strong><span>${escapeHTML(idea.observation)}</span></span><span class="idea-open">+</span>
    </button>
    <div class="idea-detail" id="detail-${idea.id}" hidden>
      <div class="idea-decision"><span>THE DECISION</span><p>${escapeHTML(idea.decision)}</p></div>
      <div class="preview-pair"><div><small>BEFORE</small>${miniPage(idea.mock, 'CURRENT EXPERIENCE', 'before')}<p>${escapeHTML(idea.before)}</p></div><div><small>AFTER · CONCEPT</small>${miniPage(idea.mock, 'PROPOSED CHANGE', 'after')}<p>${escapeHTML(idea.after)}</p></div></div>
      <div class="idea-bottom"><div><span>WHY THIS COULD WORK</span><p>${escapeHTML(idea.why)}</p></div><div><span>GOAL · PREDICTED DIRECTION</span><p>${escapeHTML(idea.expected)}</p></div></div>
      <div class="idea-actions"><span class="goal-tags">${idea.goal.map((goal) => `<i>${goal === 'sales' ? 'SALES' : goal === 'engagement' ? 'HOOK / ENGAGEMENT' : 'LEARN / DATA'}</i>`).join('')}</span><button class="stage-button">Stage for review <b>↗</b></button></div>
    </div>
  </article>`).join('');

  feed.querySelectorAll('.idea-summary').forEach((button) => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.querySelector('.idea-open').textContent = open ? '+' : '−';
    document.querySelector(`#${button.getAttribute('aria-controls')}`).hidden = open;
  }));
  feed.querySelectorAll('.stage-button').forEach((button) => button.addEventListener('click', () => {
    button.disabled = true;
    button.innerHTML = 'Added to your review list <b>✓</b>';
  }));
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach((filter) => filter.classList.toggle('active', filter === button));
  render();
}));

document.querySelector('#connect-open').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Checking VDO-X…';
  try {
    const response = await fetch('/api/analysis', { cache: 'no-store' });
    if (!response.ok) throw new Error('unavailable');
    const report = await response.json();
    const retry = ideas.find((idea) => idea.id === 'retry');
    retry.observation = `${report.behavior.transitions.fail_then_start} adjacent fail → start event transitions in the seven-day VDO-X window. These are transitions, not distinct people.`;
    showToast('VDO-X behavior evidence refreshed.');
  } catch {
    showToast('Showing the verified VDO-X snapshot and clearly labeled strategy hypotheses.');
  } finally {
    button.disabled = false;
    button.textContent = '↻ Refresh evidence';
    render();
  }
});

function showToast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('visible');
  window.setTimeout(() => node.classList.remove('visible'), 3500);
}

render();
