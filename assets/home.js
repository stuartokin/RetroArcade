'use strict';
// The home app: tiles that fill one screen, or a 3D carousel; the ⓘ popover; the ⋮ menu and its windows.
(async()=>{
 const {esc,fmt,nextRun,load,runsFor}=RA,$=id=>document.getElementById(id),root=document.documentElement;
 let d;try{d=await load();}catch(e){$('tiles').innerHTML='<p class="empty">Couldn\'t load the games. Please refresh.</p>';return;}
 const {orig,enh,runs}=d,O=new Map(orig.games.map(g=>[g.id,g])),E=new Map(enh.games.map(g=>[g.id,g]));
 const ids=[...enh.games.map(g=>g.id),...orig.games.map(g=>g.id).filter(id=>!E.has(id))];
 // the newest picture of each game (runs are newest first)
 const pic=id=>{for(const r of runs)if(r.shots&&r.shots[id])return r.shots[id];return '';};
 const games=ids.map(id=>{const e=E.get(id),o=O.get(id),g=e||o,hist=runsFor(runs,id);return{id,e,o,g,hist,born:!!(e&&e.origin==='ai'),pic:pic(id)};});

 // ---------- the ⓘ popover: description and stats ----------
 const real=runs.filter(r=>r.kind!=='baseline'&&r.status!=='failed'),lastRun=real[0],aiMade=enh.games.filter(g=>g.origin==='ai').length,nr=nextRun();
 $('stats').innerHTML=[['AI runs so far',real.length],['Last change',lastRun?fmt(lastRun.date):'None yet'],
  ['Next run',nr.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+', early'],['Games',`${enh.games.length}${aiMade?` (${aiMade} by the AI)`:''}`]]
  .map(([k,v])=>`<div class="stat"><small>${k}</small><b>${esc(v)}</b></div>`).join('');

 // ---------- one game, as a tile or a carousel card ----------
 function badge(x){return x.born?'<span class="badge new">AI original</span>':!x.e?'<span class="badge gone">Retired</span>':x.hist.length?`<span class="badge chg">Changed ×${x.hist.length}</span>`:'';}
 function histLine(x){const last=x.hist[0];
  if(x.born)return `🆕 Invented by the AI${x.e.born?` on ${fmt(x.e.born,{day:'numeric',month:'short'})}`:''}`;
  return last?`Changed ${fmt(last.date,{day:'numeric',month:'short'})}: <a href="#log/game=${encodeURIComponent(x.id)}">what changed?</a>`:'Not changed by the AI yet';}
 function face(x){return `${x.pic?`<img class="pic" src="${esc(x.pic)}" alt="" loading="lazy" draggable="false">`:''}${badge(x)}<div class="body"><h2><span class="ico" aria-hidden="true">${esc(x.g.icon)}</span>${esc(x.g.name)}</h2><p class="d">${esc(x.g.desc)}</p>
  <div class="acts">${x.o?`<a class="btn" href="original/${esc(x.o.play)}" title="Play the original">▶<span class="l"> Original</span><span class="s"> Orig.</span></a>`:''}${x.e?`<a class="btn ai" href="enhanced/${esc(x.e.play)}" title="Play the AI's version">✨<span class="l"> AI version</span><span class="s"> AI</span></a>`:''}</div>
  <div class="hist">${histLine(x)}</div></div>`;}

 // ---------- tiles: as many columns and rows as make every game as big as possible on one screen ----------
 const tiles=$('tiles');tiles.innerHTML=games.map(x=>`<article class="tile" id="g-${esc(x.id)}">${face(x)}</article>`).join('');
 function fitTiles(){const W=tiles.clientWidth,H=tiles.clientHeight-10,N=games.length,gap=W<700?8:12;if(!W||!H)return;
  let best=null;for(let c=1;c<=N;c++){const r=Math.ceil(N/c),tw=(W-(c-1)*gap)/c,th=(H-(r-1)*gap)/r,score=Math.min(tw,th*.8);if(!best||score>best.score)best={c,r,tw,th,score};}
  const scroll=best.score<165||W<520;tiles.classList.toggle('scroll',scroll);tiles.style.setProperty('--gap',gap+'px');
  if(scroll){const cols=W>=520?3:2,cw=(W-(cols-1)*gap)/cols;tiles.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;tiles.style.gridTemplateRows='';tiles.style.gridAutoRows=Math.round(Math.min(cw/.72,H*.62))+'px';return;}
  tiles.style.gridAutoRows='';
  const w=Math.floor(Math.min(best.tw,best.th*1.15)),h=Math.floor(Math.min(best.th,w/.62));
  tiles.style.gridTemplateColumns=`repeat(${best.c},${w}px)`;tiles.style.gridTemplateRows=`repeat(${best.r},${h}px)`;}

 // ---------- carousel: cards on a ring, turned by dragging, swiping, arrows or keys ----------
 const wrap=$('ringWrap'),ring=$('ring'),N=games.length,step=360/N;let angle=0,radius=600,cards=[];
 ring.innerHTML=games.map((x,i)=>`<article class="card" data-i="${i}" id="c-${esc(x.id)}">${face(x)}</article>`).join('');cards=[...ring.children];
 $('dots').innerHTML=games.map((x,i)=>`<button type="button" data-i="${i}" aria-label="${esc(x.g.name)}"></button>`).join('');
 const frontIndex=()=>((Math.round(-angle/step)%N)+N)%N;
 function place(anim){const H=wrap.clientHeight,W=wrap.clientWidth;if(!W||!H)return;
  let cw,ch;if(W<640){cw=Math.min(W*.8,H*.86*.66);ch=Math.min(H*.86,cw/.66);}else{ch=Math.min(H*.86,(W*.72)/.74);cw=ch*.74;}wrap.style.setProperty('--cw',cw+'px');wrap.style.setProperty('--ch',ch+'px');
  radius=(cw/2)/Math.tan(Math.PI/N)*1.12;ring.style.transition=anim?'transform .55s cubic-bezier(.2,.8,.2,1)':'none';
  ring.style.transform=`translateZ(${-radius}px) rotateY(${angle}deg)`;const f=frontIndex();
  cards.forEach((c,i)=>{c.style.transform=`rotateY(${i*step}deg) translateZ(${radius}px)`;const dlt=Math.abs(((i*step+angle)%360+540)%360-180);
   c.style.opacity=String(Math.max(.18,1-dlt/150));c.classList.toggle('front',i===f);c.setAttribute('aria-hidden',i===f?'false':'true');
   c.querySelectorAll('a').forEach(a=>a.tabIndex=i===f?0:-1);});
  [...$('dots').children].forEach((b,i)=>b.setAttribute('aria-current',String(i===f)));}
 const goTo=i=>{const cur=frontIndex();let delta=((i-cur)%N+N)%N;if(delta>N/2)delta-=N;angle=Math.round(-angle/step)*-step-delta*step;place(true);};
 $('prev').onclick=()=>goTo(frontIndex()-1);$('next').onclick=()=>goTo(frontIndex()+1);
 $('dots').onclick=e=>{const b=e.target.closest('[data-i]');if(b)goTo(+b.dataset.i);};
 wrap.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){goTo(frontIndex()-1);e.preventDefault();}else if(e.key==='ArrowRight'){goTo(frontIndex()+1);e.preventDefault();}});
 let drag=null,moved=false;
 wrap.addEventListener('pointerdown',e=>{if(e.button>0)return;drag={x:e.clientX,a:angle,id:e.pointerId};moved=false;});
 wrap.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>8){moved=true;try{wrap.setPointerCapture(e.pointerId);}catch(x){}}
  if(moved){const cw=parseFloat(wrap.style.getPropertyValue('--cw'))||300;angle=drag.a+dx*(step/(cw*.9));place(false);}});
 const end=e=>{if(!drag||(e&&e.pointerId!==drag.id))return;const d0=drag;drag=null;if(!moved)return;
  // snap to the nearest card; a clear swipe always moves at least one, however wide the cards are (big screens)
  let snap=Math.round(angle/step)*step;const dx=(e?e.clientX:d0.x)-d0.x;if(snap===Math.round(d0.a/step)*step&&Math.abs(dx)>40)snap+=Math.sign(dx)*step;angle=snap;place(true);};
 wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end);
 // a tap on a side card brings it to the front; a drag never counts as a tap
 wrap.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;return;}const c=e.target.closest('.card');if(c&&!c.classList.contains('front')){e.preventDefault();goTo(+c.dataset.i);}},true);

 // ---------- the view switch ----------
 function setView(v,save){root.dataset.view=v;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
  if(save)try{localStorage.setItem('retro.view',v);}catch(e){}requestAnimationFrame(()=>{fitTiles();place(false);});}
 document.querySelectorAll('.seg [data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view,true));
 setView(root.dataset.view==='carousel'?'carousel':'tiles',false);
 new ResizeObserver(()=>{fitTiles();place(false);}).observe($('stage'));

 // ---------- ⓘ popover and ⋮ menu ----------
 const info=$('info'),infoBtn=$('infoBtn'),menu=$('menu'),menuBtn=$('menuBtn');
 const showInfo=on=>{info.hidden=!on;infoBtn.setAttribute('aria-expanded',String(on));};
 const showMenu=on=>{menu.hidden=!on;menuBtn.setAttribute('aria-expanded',String(on));if(on){const f=menu.querySelector('button,a');if(f)f.focus();}};
 infoBtn.onclick=e=>{e.stopPropagation();showMenu(false);showInfo(info.hidden);};
 menuBtn.onclick=e=>{e.stopPropagation();showInfo(false);showMenu(menu.hidden);};
 document.addEventListener('click',e=>{if(!info.hidden&&!info.contains(e.target))showInfo(false);if(!menu.hidden&&!menu.contains(e.target))showMenu(false);});
 menu.addEventListener('keydown',e=>{const items=[...menu.querySelectorAll('button,a')],i=items.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){items[(i+1)%items.length].focus();e.preventDefault();}else if(e.key==='ArrowUp'){items[(i-1+items.length)%items.length].focus();e.preventDefault();}});

 // ---------- windows, with their own addresses (#log, #log/game=maze, #log/run-3, #how) so Back closes them ----------
 let openWin=null,lastFocus=null,pushed=false;
 let routed=null;
 function route(){if(location.hash===routed&&openWin)return;routed=location.hash;const h=location.hash.replace(/^#/,''),[name,arg]=h.split('/');
  if(name==='log'||name==='how'){const g=(arg||'').match(/^game=([\w-]+)/),r=(arg||'').match(/^run-(\d+)/);show(name);if(name==='log')RALog.show(g&&g[1],r?+r[1]:null);}
  else show(null);}
 function show(name){if(openWin&&openWin!==name){$('win-'+openWin).hidden=true;}
  if(!name){if(openWin){$('scrim').hidden=true;$('win-'+openWin).hidden=true;openWin=null;if(lastFocus)lastFocus.focus();}return;}
  if(openWin!==name){lastFocus=openWin?lastFocus:document.activeElement;openWin=name;$('scrim').hidden=false;const w=$('win-'+name);w.hidden=false;w.querySelector('[data-close]').focus();}}
 function open(name){showMenu(false);showInfo(false);if(name==='about'){showInfo(true);return;}
  if(location.hash.replace(/^#/,'').split('/')[0]===name){route();return;}pushed=true;location.hash=name;route();}
 function close(){if(pushed){pushed=false;history.back();}else{history.replaceState(null,'',location.pathname+location.search);route();}}
 document.addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();open(o.dataset.open);return;}
  if(e.target.closest('[data-close]')||e.target.id==='scrim')close();
  const a=e.target.closest('a[href^="#log/"]');if(a){e.preventDefault();pushed=true;location.hash=a.getAttribute('href').slice(1);route();}});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(openWin)close();else if(!menu.hidden){showMenu(false);menuBtn.focus();}else if(!info.hidden){showInfo(false);infoBtn.focus();}});
 // keep Tab inside an open window
 document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!openWin)return;const w=$('win-'+openWin),f=[...w.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent);if(!f.length)return;
  const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}});
 addEventListener('hashchange',route);route();
 window.ARCADE_HOME={ready:true,view:()=>root.dataset.view,front:()=>games[frontIndex()].id,open,close};
})();
