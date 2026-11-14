const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>Number(v||0).toLocaleString('en-CA',{maximumFractionDigits:d});
let data=null,showAll=false;

function render(){
  if(!data)return;
  const city=$('city-filter').value,product=$('product-filter').value,sort=$('sort-filter').value;
  const items=data.citySignals.filter(x=>(city==='all'||x.city===city)&&(product==='all'||x.product===product));
  const metric=sort==='amount'?'reportedAmount':sort==='claims'?'claims':'claimsPer100Rows';
  items.sort((a,b)=>Number(b[metric])-Number(a[metric]));
  $('city-count').textContent=Object.keys(data.cityCounts).length;
  $('signal-count').textContent=num(items.length);
  $('portfolio-count').textContent=num(data.observations.length);
  $('data-status').textContent=`LIVE · ${data.summary.policyRows.toLocaleString('en-CA')} POLICY ROWS`;
  const shown=showAll?items:items.slice(0,14);
  $('city-feed').innerHTML=`<div class="feed-head"><span>PLACE</span><span>OBSERVATION</span><span>CLAIM SLICE</span><span>REPORTED AMOUNT</span><span></span></div>`+
    shown.map((x,i)=>`<a class="signal-row ${i===0?'lead':''}" href="/signal?id=${encodeURIComponent(x.id)}">
      <span class="signal-city"><b>${esc(x.city)}</b><span class="pill">${esc(x.product)}</span></span>
      <span class="signal-copy"><small>${esc(x.peril.toUpperCase())} · ${i<3&&sort==='amount'?'HIGH RECORDED AMOUNT':'DATA SIGNAL'}</small><b>${esc(x.title)}</b><span>${esc(x.finding)}</span></span>
      <span class="signal-meta"><small>CLAIM ROWS / POLICY ROWS</small><b>${num(x.claims)} / ${num(x.policyRows)}</b><span>${num(x.claimsPer100Rows,1)} claim records per 100 rows · ${num(x.shareOfCityReportedAmount,1)}% of city/product amount</span></span>
      <span class="signal-amount"><small>REPORTED AMOUNT</small><b>${num(x.reportedAmount)}</b><span>currency unspecified</span></span><span class="open-link">INVESTIGATE ↗</span>
    </a>`).join('')+(!showAll&&items.length>shown.length?`<button class="more" id="more-signals">SHOW ${num(items.length-shown.length)} MORE CITY / PERIL SIGNALS ↓</button>`:'')+(items.length===0?'<div class="empty">No signal in this filter.</div>':'');
  $('portfolio-feed').innerHTML=data.observations.slice(0,6).map((x,i)=>`<a class="portfolio-row" href="/signal?id=${encodeURIComponent(x.id)}"><small>${String(i+1).padStart(2,'0')} · ${esc(x.confidence)}</small><b>${esc(x.title)}</b><span>${esc(x.finding)}</span></a>`).join('');
  const more=$('more-signals');if(more)more.addEventListener('click',()=>{showAll=true;$('show-all').textContent='SHOW TOP 14';render();});
  $('show-all').onclick=()=>{showAll=!showAll;$('show-all').textContent=showAll?'SHOW TOP 14':'SHOW ALL SIGNALS';render();};
}

async function load(){
  try{const r=await fetch('/api/insurance/analysis',{cache:'no-store'});if(!r.ok)throw new Error('The local CSV analysis is unavailable.');data=await r.json();render();}
  catch(e){$('data-status').textContent='DATA NOT CONNECTED';$('city-feed').innerHTML=`<div class="error">${esc(e.message)} Set INSURANCE_DATA_DIR to the folder containing policies.csv and claims.csv, then restart the app.</div>`;}
}
['city-filter','product-filter','sort-filter'].forEach(id=>$(id).addEventListener('change',render));
load();
