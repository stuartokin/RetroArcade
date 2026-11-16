'use strict';
// Shared helpers for the home page and the evolution log.
const RA=(()=>{
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const json=u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return r.json();});
 const day=d=>new Date(String(d).slice(0,10)+'T12:00:00Z');
 const fmt=(d,o={day:'numeric',month:'short',year:'numeric'})=>d?day(d).toLocaleDateString('en-GB',o):'—';
 // The weekly run is scheduled for Sundays at 05:17 UTC (see .github/workflows/evolve.yml).
 function nextRun(now=new Date()){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),5,17));let add=(7-d.getUTCDay())%7;if(add===0&&now>=d)add=7;d.setUTCDate(d.getUTCDate()+add);return d;}
 async function load(){const [orig,enh,log,ver]=await Promise.all([json('original/games.json'),json('enhanced/games.json'),json('data/changes.json').catch(()=>({runs:[]})),json('version.json').catch(()=>null)]);
  const runs=(log.runs||[]).slice().sort((a,b)=>b.run-a.run);
  if(ver){const v=document.getElementById('ver');if(v)v.textContent=`Site version ${ver.version}${ver.run?` · AI run ${ver.run}`:""} · updated ${fmt(ver.date)}`;}
  return{orig,enh,runs,ver};}
 // which runs changed a game (baseline excluded)
 const runsFor=(runs,id)=>runs.filter(r=>r.kind!=='baseline'&&r.status!=='failed'&&((r.changes||[]).some(c=>c.game===id||c.game==='all')||(r.new_games||[]).includes(id)));
 return{esc,json,fmt,nextRun,load,runsFor};
})();
