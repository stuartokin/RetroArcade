'use strict';
// Evolution log: every run, newest first; filter by game; before/after pictures; play any past version.
// Drawn inside the "Evolution log" window. RALog.show(game, run) opens it on a game filter or scrolls to a run.
// Addresses: #log, #log/game=maze, #log/run-3.
const RALog=(()=>{
 const {esc,fmt,load}=RA;let ready=null,render=null,filter='*';
 const log=()=>document.getElementById('log'),chipsEl=()=>document.getElementById('chips');
 async function init(){let d;try{d=await load();}catch(e){log().innerHTML='<p class="empty">Couldn\'t load the log. Please refresh.</p>';return;}
 const {orig,enh,runs,clips}=d,oclip=(clips&&clips.original)||{},info=new Map(orig.games.map(g=>[g.id,g]));
 // the AI may rename a game; its newest name wins
 enh.games.forEach(g=>info.set(g.id,g));
 const name=id=>{if(id==='all')return '🕹️ Every game';const g=info.get(id);return g?`${g.icon} ${g.name}`:id;};
 const KIND={baseline:'Starting line','new-game':'New game',enhance:'Enhancement',mixed:'Enhancement + new game',failed:'Didn\'t pass the checks'};
 const touched=r=>[...new Set([...(r.changes||[]).map(c=>c.game),...(r.new_games||[])])];
 const hits=(r,id)=>touched(r).some(g=>g===id||g==='all');
 // the latest picture of a game taken before a given run (the "before" shot)
 function before(id,run){for(const r of runs){if(r.run<run&&r.shots&&r.shots[id])return{src:r.shots[id],run:r.run};}return null;}
 const order=[...enh.games.map(g=>g.id),...orig.games.map(g=>g.id)];
 const allIds=[...new Set(runs.flatMap(touched))].filter(id=>id!=='all').sort((a,b)=>order.indexOf(a)-order.indexOf(b));
 function chips(){chipsEl().innerHTML=[['*','All games'],...allIds.map(id=>[id,name(id)])].map(([id,l])=>`<button type="button" class="chip" data-g="${esc(id)}" aria-pressed="${filter===id}">${esc(l)}</button>`).join('');}
 const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // the original game, playing on a loop, for comparison
 const origClip=id=>oclip[id]&&!still?`<figure><video src="${esc(oclip[id])}" muted loop autoplay playsinline preload="metadata" aria-label="${esc(name(id))}: the original, playing"></video><figcaption>The original, playing</figcaption></figure>`:'';
 function shotsHTML(id,r){const a=r.shots&&r.shots[id],b=before(id,r.run);if(!a&&!b)return'';
  return `<div class="shots">${b?`<figure><img loading="lazy" src="${esc(b.src)}" alt="${esc(name(id))} before run ${r.run}"><figcaption>Before (${b.run===0?'the start':'run '+b.run})</figcaption></figure><span class="arrow" aria-hidden="true">→</span>`:''}${a?`<figure><img loading="lazy" src="${esc(a)}" alt="${esc(name(id))} after run ${r.run}"><figcaption>After run ${r.run}</figcaption></figure>`:''}${origClip(id)}</div>`;}
 function changeHTML(r,c){const id=c.game,what=Array.isArray(c.what)?c.what:[c.what].filter(Boolean),isNew=(r.new_games||[]).includes(id);
  const playPast=r.archive&&id!=='all'?`<a class="btn ai" href="${esc(r.archive)}play.html?game=${encodeURIComponent(id)}">▶ Play the run ${r.run} version</a>`:'';
  const playOrig=!isNew&&orig.games.some(g=>g.id===id)?`<a class="btn" href="original/play.html?game=${encodeURIComponent(id)}">▶ Original</a>`:'';
  return `<section class="gc"><h3>${esc(name(id))}${isNew?' <span class="kind new-game">new</span>':''}</h3>${what.length?`<ul>${what.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}${c.why?`<p class="why"><b>Why:</b> ${esc(c.why)}</p>`:''}${shotsHTML(id,r)}${playPast||playOrig?`<div class="acts">${playPast}${playOrig}</div>`:''}</section>`;}
 function runHTML(r){let ch=(r.changes||[]).slice();(r.new_games||[]).forEach(id=>{if(!ch.some(c=>c.game===id))ch.push({game:id,what:[],why:''});});
  if(filter!=='*')ch=ch.filter(c=>c.game===filter||c.game==='all');
  const kind=r.status==='failed'?'failed':r.kind||'enhance',cost=r.cost_usd!=null?`$${(+r.cost_usd).toFixed(2)}`:null;
  const first=touched(r).find(id=>id!=='all');
  const meta=[r.pr?`<a href="${esc(r.pr)}">Code changes</a>`:'',r.actions?`<a href="${esc(r.actions)}">Run log</a>`:'',r.archive&&first?`<a href="${esc(r.archive)}play.html?game=${encodeURIComponent(first)}">This week's arcade</a>`:''].filter(Boolean).join('');
  const how=[r.tested?`<p><b>How the AI tested it:</b> ${esc(r.tested)}</p>`:'',r.next?`<p><b>Ideas for next time:</b> ${esc(r.next)}</p>`:'',(cost||r.turns||r.minutes)?`<p>${[cost&&`API cost ${cost}`,r.turns&&`${r.turns} steps`,r.minutes&&`${r.minutes} minutes`,r.model&&`model ${esc(r.model)}`].filter(Boolean).join(' · ')}</p>`:''].join('');
  return `<article class="run${r.status==='failed'?' failed':''}" id="run-${r.run}"><div class="rhead"><span class="rnum">RUN ${r.run}</span><time datetime="${esc(r.date)}">${fmt(r.date,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</time><span class="kind ${esc(kind)}">${esc(KIND[kind]||kind)}</span>${r.focus&&r.focus!=='ai-decides'&&r.kind!=='baseline'?`<span>Asked to focus on: ${esc(r.focus)}</span>`:''}</div>
   <h2>${esc(r.title||'')}</h2>${r.summary?`<p>${esc(r.summary)}</p>`:''}${Array.isArray(r.ideas)&&r.ideas.length?`<div class="ideas"><b>The ideas it considered:</b><ul>${r.ideas.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`:''}${ch.map(c=>changeHTML(r,c)).join('')}
   ${r.kind==='baseline'&&r.shots?`<div class="shots start">${Object.entries(r.shots).filter(([id])=>filter==='*'||id===filter).map(([id,src])=>`<figure><a href="original/play.html?game=${encodeURIComponent(id)}"><img loading="lazy" src="${esc(src)}" alt="${esc(name(id))} at the start"></a><figcaption>${esc(name(id))}</figcaption></figure>`).join('')}</div>`:''}
   ${how?`<details><summary>How it was tested, cost and ideas</summary>${how}</details>`:''}${meta?`<div class="meta">${meta}</div>`:''}</article>`;}
 render=()=>{chips();const list=filter==='*'?runs:runs.filter(r=>hits(r,filter)||r.kind==='baseline');
  log().innerHTML=list.length?list.map(runHTML).join(''):'<p class="empty">No runs yet.</p>';};
 chipsEl().addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;filter=b.dataset.g;history.replaceState(history.state,'',filter==='*'?'#log':`#log/game=${filter}`);render();log().parentElement.scrollTop=0;});}
 async function show(game,run){if(!ready)ready=init();await ready;filter=game||'*';if(render)render();
  const box=log().closest('.wbody');if(run!=null){const el=document.getElementById('run-'+run);if(el&&box)box.scrollTop=el.offsetTop-box.offsetTop-8;}else if(box)box.scrollTop=0;}
 return{show};
})();
