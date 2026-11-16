'use strict';
// Home page: a tile for every game, with the original and the AI's version side by side.
(async()=>{
 const {esc,fmt,nextRun,load,runsFor}=RA;
 let d;try{d=await load();}catch(e){document.getElementById('grid').innerHTML='<p class="empty">Couldn\'t load the games. Please refresh.</p>';return;}
 const {orig,enh,runs}=d,O=new Map(orig.games.map(g=>[g.id,g])),E=new Map(enh.games.map(g=>[g.id,g]));
 const ids=[...enh.games.map(g=>g.id),...orig.games.map(g=>g.id).filter(id=>!E.has(id))];
 const real=runs.filter(r=>r.kind!=='baseline'&&r.status!=='failed'),lastRun=real[0];
 const aiMade=enh.games.filter(g=>g.origin==='ai').length,nr=nextRun();
 document.getElementById('stats').innerHTML=[
  ['AI runs so far',real.length],
  ['Last change',lastRun?fmt(lastRun.date):'None yet'],
  ['Next run',nr.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+', early morning'],
  ['Games',`${enh.games.length}${aiMade?` (${aiMade} invented by the AI)`:''}`]].map(([k,v])=>`<div class="stat"><small>${k}</small><b>${esc(v)}</b></div>`).join('');
 document.getElementById('grid').innerHTML=ids.map(id=>{const e=E.get(id),o=O.get(id),g=e||o,hist=runsFor(runs,id),born=e&&e.origin==='ai';
  const badge=born?'<span class="badge new">AI original</span>':!e?'<span class="badge gone">Retired by the AI</span>':hist.length?`<span class="badge chg">Changed ×${hist.length}</span>`:'';
  const last=hist[0];
  const line=born?`🆕 Invented by the AI in run ${hist.length?hist[hist.length-1].run:'?'}${e.born?`, ${fmt(e.born)}`:''}.${hist.length>1?` Changed again in ${hist.length-1} later run${hist.length>2?'s':''}.`:''}`
   :hist.length?`Last changed ${fmt(last.date)} (run ${last.run}): ${esc(last.title||'')}`:'The AI hasn\'t changed this one yet.';
  return `<article class="tile" id="g-${esc(id)}">${badge}<div class="ico" aria-hidden="true">${esc(g.icon)}</div><h2>${esc(g.name)}</h2><p class="d">${esc(g.desc)}</p>
   <div class="acts">${o?`<a class="btn" href="original/${esc(o.play)}">▶ Original</a>`:''}${e?`<a class="btn ai" href="enhanced/${esc(e.play)}">✨ AI version</a>`:''}</div>
   <div class="hist">${line} ${hist.length?`<a href="evolution.html#game=${encodeURIComponent(id)}">What changed?</a>`:''}</div></article>`;}).join('');
})();
