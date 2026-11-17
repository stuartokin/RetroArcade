'use strict';
// Retro Arcade — the player shell for one game: the canvas, keys, touch buttons, sound, HUD,
// pause, full screen and a local top-5 score table. Adapted from the ApolloMaths arcade shell
// (time limits, family rules and avatars removed). Open as play.html?game=<id>.
//
// Contract the site and test rig rely on (keep it if you rewrite this file):
//   window.ARCADE = {ready:true, side, game, state()}  once the game is on screen;
//   the game starts with Space/Enter or a tap on the game; the page never scrolls sideways.

// Small helpers the games expect as globals.
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];

const Host=(()=>{
 const $=id=>document.getElementById(id);
 const qs=new URLSearchParams(location.search);
 const SIDE=(window.SIDE||{id:'original',label:'Original'});
 const archived=/\/archive\/[^/]+\/[^/]*$/.test(location.pathname);
 // the site's home page, wherever this copy lives (original/, enhanced/ or archive/run-NNN/)
 const HOME=location.pathname.replace(/\/(original|enhanced|archive\/[^/]+)\/[^/]*$/,'/')||'/';
 const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
 let gameId=qs.get('game')||'invaders',info=null,game=null,cv,ctx,raf=0,last=0,paused=false,over=false,view='game';
 let keys={},latch={},pad={l:false,r:false,u:false,d:false,f:false,b:false},ac=null,muted=store.get('retro:mute',false);
 const scoreKey=()=>`retro:${SIDE.id}:${gameId}:scores`;

 // ---------- sound ----------
 function beep(f,d=.08,type='square',vol=.04,slide=0){if(muted)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),gn=ac.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*slide),ac.currentTime+d);gn.gain.value=vol;gn.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(gn).connect(ac.destination);o.start();o.stop(ac.currentTime+d);}catch(e){}}
 let nbuf=null,eng=null;
 function noise(d=.3,vol=.08,freq=1200){if(muted)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(!nbuf){nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const a=nbuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nbuf;f.type='lowpass';f.frequency.value=freq;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);s.connect(f).connect(g).connect(ac.destination);s.start();s.stop(ac.currentTime+d);}catch(e){}}
 const engine={set(freq,vol=.03){if(muted){this.stop();return;}try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(!eng){const o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.connect(g).connect(ac.destination);g.gain.value=0;o.start();eng={o,g};}eng.o.frequency.setTargetAtTime(freq,ac.currentTime,.05);eng.g.gain.setTargetAtTime(vol,ac.currentTime,.05);}catch(e){}},stop(){if(eng){try{eng.g.gain.value=0;eng.o.stop();}catch(e){}eng=null;}}};

 // ---------- input ----------
 const KEYMAP={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r',ArrowUp:'u',w:'u',W:'u',ArrowDown:'d',s:'d',S:'d',' ':'f',Enter:'f',b:'b',B:'b',x:'b',X:'b',Shift:'b'};
 // a quick tap (pressed and released between two frames) is remembered until the game has seen it
 const inp=()=>{const o={};for(const k of ['l','r','u','d','f','b'])o[k]=!!(pad[k]||latch[k]);for(const key in keys)if(keys[key]&&KEYMAP[key])o[KEYMAP[key]]=true;return o;};
 const LABEL={invaders:{l:'◀',r:'▶',f:'● FIRE'},maze:{l:'◀',r:'▶',u:'▲',d:'▼'},meteor:{l:'⟲',r:'⟳',u:'▲ Thrust',f:'● Fire',d:'🌀 Hyper'},guardian:{u:'▲',d:'▼',l:'◀',r:'▶',f:'🔥 Fire',b:'💣 Bomb'},ladder:{l:'◀',r:'▶',u:'▲ Climb',d:'▼',f:'⤴ Jump'},racer:{l:'◀',r:'▶',u:'▲ Go',d:'▼ Brake',f:'🔥 Nitro'},snake:{l:'◀',r:'▶',u:'▲',d:'▼'},pinball:{l:'◀ Flip',r:'▶ Flip',f:'⬆ Launch'},bricks:{l:'◀',r:'▶',f:'● Serve'},hopper:{l:'◀',r:'▶',u:'▲',d:'▼'},blocks:{l:'◀',r:'▶',u:'⟳ Turn',d:'▼',f:'⤓ Drop'}};
 const HELP={maze:' Or swipe on the maze.',snake:' Or swipe on the game.',hopper:' Or swipe on the game.',bricks:' Or drag on the game.',invaders:' Or drag on the game.'};

 // ---------- scores ----------
 const fmtN=n=>Math.round(n||0).toLocaleString('en-GB');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const table=()=>store.get(scoreKey(),[]);
 const best=()=>{const T=table();return T.length?T[0].s:0;};
 function record(score){if(!(score>0))return null;const T=table(),row={s:Math.round(score),d:new Date().toISOString().slice(0,10)};T.push(row);T.sort((a,b)=>b.s-a.s);T.length=Math.min(T.length,5);store.set(scoreKey(),T);return T.includes(row)?row:null;}

 // ---------- HUD ----------
 let hudTxt='';
 function hud(){const t=`<span>Score <b>${fmtN(game.score)}</b></span><span>${esc(game.levelName||'Level')} <b>${game.level||1}</b></span><span class="lives">${'❤️'.repeat(Math.max(0,Math.min(6,game.lives|0)))||'💔'}</span>`;if(t!==hudTxt){$('hud').innerHTML=t;hudTxt=t;}}

 // ---------- the loop ----------
 function loop(t){if(view!=='game'){raf=0;return;}const dt=Math.min(.05,(t-(last||t))/1000);last=t;
  if(!paused&&document.visibilityState==='visible'){game.update(dt,inp());latch={};if(game.over){finish();return;}}
  ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.scale(cv.width/game.W,cv.height/game.H);game.render(ctx);
  if(paused){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,game.W,game.H);Retro.text(ctx,'PAUSED',game.W/2,game.H/2-20,4,'#ffe45e','center');Retro.text(ctx,'PRESS P OR TAP PLAY',game.W/2,game.H/2+24,2,'#fff','center');}
  ctx.restore();hud();raf=requestAnimationFrame(loop);}

 // ---------- fitting the game to the screen ----------
 function fit(){if(!cv||!game)return;layout();const st=$('stage'),r=st.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  const k=Math.max(.1,Math.min((r.width-8)/game.W,(r.height-8)/game.H));
  cv.style.width=Math.floor(game.W*k)+'px';cv.style.height=Math.floor(game.H*k)+'px';cv.width=Math.round(game.W*k*dpr);cv.height=Math.round(game.H*k*dpr);}
 function setFull(on){const el=document.documentElement,fs=document.fullscreenElement||document.webkitFullscreenElement;
  try{if(on&&!fs){const r=el.requestFullscreen||el.webkitRequestFullscreen;if(r){const p=r.call(el);if(p&&p.catch)p.catch(()=>{});}}else if(!on&&fs){const x=document.exitFullscreen||document.webkitExitFullscreen;if(x){const p=x.call(document);if(p&&p.catch)p.catch(()=>{});}}}catch(e){}
  setTimeout(fit,80);setTimeout(fit,400);}
 function setPause(v){if(over)return;paused=v===undefined?!paused:v;$('btnPause').innerHTML=paused?'▶<span class="lbl"> Play</span>':'⏸<span class="lbl"> Pause</span>';}
 function setMute(v){muted=v;store.set('retro:mute',muted);if(muted)engine.stop();$('btnSound').textContent=muted?'🔇':'🔊';$('btnSound').title=muted?'Sound off':'Sound on';}

 // ---------- start / finish ----------
 function start(){over=false;paused=false;view='game';keys={};latch={};Object.keys(pad).forEach(k=>pad[k]=false);$('over').hidden=true;
  game=GAMES[gameId]({theme:'classic',avatar:null,beep,noise,engine,hi:best,players:1,names:['Player'],touch:matchMedia('(pointer:coarse)').matches,
   store:{get:()=>store.get(`retro:${SIDE.id}:${gameId}:save`,null),set:v=>store.set(`retro:${SIDE.id}:${gameId}:save`,v)}});
  hudTxt='';fit();setPause(false);last=0;if(!raf)raf=requestAnimationFrame(loop);
  window.ARCADE.ready=true;}
 function finish(){view='over';over=true;engine.stop();cancelAnimationFrame(raf);raf=0;
  const prev=best(),mine=record(game.score),T=table();
  $('overBody').innerHTML=`<div class="big">💥</div><h2>Game over</h2><p class="sc">${esc(info.name)}: <b>${fmtN(game.score)}</b> points · ${esc(game.levelName||'Level')} ${game.level||1}</p>${game.score>prev&&game.score>0?'<p class="new">🏆 New high score on this device!</p>':''}
   ${T.length?`<table><thead><tr><th>#</th><th>Score</th><th>Date</th></tr></thead><tbody>${T.map((r,i)=>`<tr class="${r===mine?'me':''}"><td>${i+1}</td><td>${fmtN(r.s)}</td><td>${new Date(r.d+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td></tr>`).join('')}</tbody></table>`:''}`;
  $('over').hidden=false;setTimeout(()=>$('btnAgain').focus(),50);}

 // ---------- page ----------
 // ---------- the touch controller ----------
 // Movement goes on a D-pad you can slide your thumb around (left); actions are round buttons in a
 // thumb cluster (right). CTRL lists, per game, the D-pad directions and the action buttons
 // (first = main button, placed where the thumb rests). diag: the D-pad also gives diagonals.
 const CTRL={invaders:{L:'lr',R:['f']},maze:{L:'lrud'},meteor:{L:'lr',R:['f','u','d']},guardian:{L:'lrud',R:['f','b'],diag:true},
  ladder:{L:'lrud',R:['f']},racer:{L:'lr',R:['u','d','f']},snake:{L:'lrud'},pinball:{L:['l'],R:['r','f'],RA:{w:2.15,h:2.05,p:[[.8,.7,1.35],[0,0,.95]]}},bricks:{L:'lr',R:['f']},
  hopper:{L:'lrud'},blocks:{L:'lrd',R:['u','f']}};
 // button positions in units of the button size B: [x,y,w,h]
 const DPAD={lrud:{w:3,h:3,b:{u:[1,0,1,1],l:[0,1,1,1],r:[2,1,1,1],d:[1,2,1,1]}},lrd:{w:3,h:2,b:{l:[0,0,1,1.05],r:[2,0,1,1.05],d:[1,1,1,1]}},
  lr:{w:2.5,h:1.3,b:{l:[0,0,1.2,1.3],r:[1.3,0,1.2,1.3]}}};
 const ACTS=[null,{w:1.35,h:1.35,p:[[0,0,1.35]]},{w:2,h:1.8,p:[[.9,.7,1.1],[0,0,1]]},{w:2.2,h:2.05,p:[[1.15,1.05,1.05],[0,1.05,1],[.6,0,.95]]}];
 const ctl=()=>CTRL[gameId]||{L:'lr',R:['f']};
 const side=v=>!v?{w:0,h:0}:typeof v==='string'?DPAD[v]||DPAD.lr:(v===ctl().R&&ctl().RA)||ACTS[Math.min(3,v.length)];
 const isDpad=v=>typeof v==='string';
 function btnHTML(k,x,y,w,h,cls){const lab=(LABEL[gameId]||{})[k]||k,i=lab.indexOf(' '),ic=i<0?lab:lab.slice(0,i),tx=i<0?'':lab.slice(i+1);
  return `<button type="button" data-pad="${k}" class="pad-${k} ${cls}" style="left:calc(var(--b)*${x});top:calc(var(--b)*${y});width:calc(var(--b)*${w});height:calc(var(--b)*${h})" aria-label="${esc(tx||k)}"><span class="ic">${esc(ic)}</span>${tx?`<span class="tx">${esc(tx)}</span>`:''}</button>`;}
 function clusterHTML(v){if(!v)return'';const S=side(v);let h='';
  if(isDpad(v)){for(const k in S.b){const [x,y,w,hh]=S.b[k];h+=btnHTML(k,x,y,w,hh,'dir');}if(v==='lrud')h+='<i class="hub" style="left:calc(var(--b)*1);top:calc(var(--b)*1);width:var(--b);height:var(--b)"></i>';}
  else v.slice(0,3).forEach((k,i)=>{const [x,y,d]=S.p[i];h+=btnHTML(k,x,y,d,d,'act'+(i?'':' main'));});
  return `<div class="${isDpad(v)?'dpad':'acts'}" style="width:calc(var(--b)*${S.w});height:calc(var(--b)*${S.h})">${h}</div>`;}
 const buzz=()=>{try{if(navigator.vibrate&&!muted)navigator.vibrate(8);}catch(e){}};
 const press=k=>{if(!pad[k]){latch[k]=true;}pad[k]=true;document.querySelectorAll(`.pad [data-pad="${k}"]`).forEach(b=>b.classList.add('on'));};
 const release=k=>{pad[k]=false;document.querySelectorAll(`.pad [data-pad="${k}"]`).forEach(b=>b.classList.remove('on'));};
 const introTap=()=>{if(game&&game.intro&&game.tap)game.tap();};
 function wireDpad(el,dirs,diag){let who=null,cur=[];
  // the direction is the button nearest the thumb; the middle of a cross is a dead zone (keeps the last one)
  const pickDirs=e=>{const bs=[...el.querySelectorAll('[data-pad]')].map(b=>{const r=b.getBoundingClientRect();return{k:b.dataset.pad,d:Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2)),s:r.width};}).sort((a,b)=>a.d-b.d);
   const R=el.getBoundingClientRect(),cx=R.left+R.width/2,cy=dirs==='lrud'?R.top+R.height/2:null;
   if(cy!==null&&Math.hypot(e.clientX-cx,e.clientY-cy)<bs[0].s*.32)return cur;
   const out=[bs[0].k];if(diag&&bs[1]&&bs[1].d<bs[0].d*1.22&&('lr'.includes(bs[0].k)!=='lr'.includes(bs[1].k)))out.push(bs[1].k);return out;};
  const set=nw=>{for(const k of cur)if(!nw.includes(k))release(k);let fresh=false;for(const k of nw)if(!cur.includes(k)){press(k);fresh=true;}if(fresh)buzz();cur=nw;};
  el.addEventListener('pointerdown',e=>{e.preventDefault();if(who!==null&&who!==e.pointerId)return;who=e.pointerId;try{el.setPointerCapture(e.pointerId);}catch(x){}introTap();set(pickDirs(e));});
  el.addEventListener('pointermove',e=>{if(e.pointerId===who)set(pickDirs(e));});
  const end=e=>{if(e.pointerId!==who)return;who=null;set([]);};
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,end));}
 function wireActs(el){el.querySelectorAll('[data-pad]').forEach(b=>{const k=b.dataset.pad;
  b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(x){}press(k);buzz();introTap();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>release(k)));});}
 function buildPad(){const C=ctl();
  $('padL').innerHTML=clusterHTML(C.L);$('padR').innerHTML=clusterHTML(C.R);
  document.body.classList.toggle('solo',!C.R);
  for(const [id,v] of [['padL',C.L],['padR',C.R]]){if(!v)continue;const el=$(id).firstElementChild;if(isDpad(v))wireDpad(el,v,!!C.diag);else wireActs(el);}
  document.querySelectorAll('.pad').forEach(el=>el.addEventListener('contextmenu',e=>e.preventDefault()));}
 // Choose where the controller goes: below the game, or either side of it, whichever leaves the
 // bigger game (sideways screens lean towards "either side"). Sizes the buttons to the room left over.
 function layout(){const B=document.body,touch=matchMedia('(pointer:coarse)').matches;B.classList.toggle('touch',touch);
  if(!touch||!game){B.classList.remove('at-bottom','at-sides');return;}
  const cs=getComputedStyle(B),W=B.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),
   H=B.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-document.querySelector('.bar').offsetHeight;
  const C=ctl(),L=side(C.L),Rs=side(C.R),uw=L.w+Rs.w+(C.R?.35:0),uh=Math.max(L.h,Rs.h),uside=Math.max(L.w,Rs.w),gW=game.W,gH=game.H;
  const bMin=Math.max(42,Math.min(56,Math.min(W,H)*.14)),pad=20;
  // below: buttons as big as the width allows, up to a limit; the game gets what is left
  const bWide=Math.min(84,(W-32)/uw),bBase=Math.min(bWide,Math.max(bMin,Math.min(W,H)*.075)),kW=(W-8)/gW;
  const kB=Math.min(kW,(H-8-uh*bBase-pad)/gH),spare=H-8-gH*kW-pad,bBottom=Math.min(bWide,Math.max(bBase,spare/uh));
  // either side: buttons sized from the height
  const bSide=Math.max(38,Math.min(72,(H-pad)/(uh+.4),(W*.2)/uside)),kS=Math.min((W-8-2*(uside*bSide+pad))/gW,(H-8)/gH);
  const useSide=W>H?kS>=kB*.9:kS>kB*1.15,b=useSide?bSide:bBottom;
  B.classList.toggle('at-sides',useSide);B.classList.toggle('at-bottom',!useSide);
  B.style.setProperty('--b',Math.floor(b)+'px');B.style.setProperty('--sideW',Math.ceil(uside*b+pad)+'px');
  B.style.setProperty('--colL',Math.ceil(L.w*b+16)+'px');B.style.setProperty('--padH',Math.ceil(uh*b+pad)+'px');}
 function wireCanvas(){
  if(game.onPointer){const gp=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*game.W,(e.clientY-r.top)/r.height*game.H];};
   cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}game.onPointer('down',...gp(e),e.pointerId,e.pointerType);});
   cv.addEventListener('pointermove',e=>game.onPointer('move',...gp(e),e.pointerId,e.pointerType));
   ['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,e=>game.onPointer('up',...gp(e),e.pointerId,e.pointerType)));return;}
  let sw=null;
  cv.addEventListener('pointerdown',e=>{if(!game||over)return;if(paused){setPause(false);return;}if(game.tap&&game.tap())return;sw=[e.clientX,e.clientY];const r=cv.getBoundingClientRect();if(game.pointer){game.pointer((e.clientX-r.left)/r.width);pad.f=true;latch.f=true;setTimeout(()=>pad.f=false,120);}});
  cv.addEventListener('pointermove',e=>{if(!game)return;const r=cv.getBoundingClientRect();if(e.buttons&&game.pointer)game.pointer((e.clientX-r.left)/r.width);if(sw&&game.swipe){const dx=e.clientX-sw[0],dy=e.clientY-sw[1];if(Math.hypot(dx,dy)>24){game.swipe(dx,dy);sw=[e.clientX,e.clientY];}}});
  cv.addEventListener('pointerup',()=>sw=null);}
 function init(){
  window.ARCADE={ready:false,side:SIDE.id,game:gameId,state:()=>({score:game?game.score:0,over,paused,intro:!!(game&&game.intro),level:game?game.level:0})};
  info=(typeof GAME_LIST!=='undefined'&&GAME_LIST.find(g=>g.id===gameId))||null;
  document.querySelectorAll('a.home').forEach(a=>a.href=HOME);
  if(!info||!GAMES[gameId]){$('stage').innerHTML=`<div class="missing"><h2>That game isn't here</h2><p><a href="${HOME}">◀ Back to the arcade</a></p></div>`;window.ARCADE.ready=true;return;}
  document.title=`${info.name} — ${SIDE.label} — Retro Arcade`;
  $('gName').textContent=`${info.icon} ${info.name}`;
  const run=archived?(location.pathname.match(/archive\/run-0*(\d+)/)||[])[1]:null;
  $('gSide').innerHTML=archived?`<span class="l">AI run ${esc(run)} (past version)</span><span class="s">Run ${esc(run)}</span>`:`<span class="l">${esc(SIDE.label)}</span><span class="s">${SIDE.id==='enhanced'?'AI':esc(SIDE.label)}</span>`;$('gSide').className='side '+(archived?'past':SIDE.id);
  $('help').textContent=`Keys: arrows or W A S D to move, Space to fire, P to pause.${HELP[gameId]||''}`;
  cv=$('cv');ctx=cv.getContext('2d');buildPad();
  addEventListener('keydown',e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.isContentEditable))return;
   if(over){if(e.key==='Enter'||e.key===' '){e.preventDefault();start();}return;}
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
   if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(game&&game.onPause)game.onPause();else setPause();return;}
   // Space/Enter on the start screen starts at once (not on the next frame, which can be slow on huge screens)
   if((e.key===' '||e.key==='Enter')&&!e.repeat&&!paused&&game&&game.intro&&game.tap&&!game.onKey)game.tap();
   if(game&&game.onKey&&game.onKey('down',e.key,e.code)!==false)e.preventDefault();
   keys[e.key]=true;if(KEYMAP[e.key])latch[KEYMAP[e.key]]=true;});
  addEventListener('keyup',e=>{keys[e.key]=false;if(game&&game.onKey)game.onKey('up',e.key,e.code);});
  addEventListener('blur',()=>{keys={};});
  addEventListener('resize',fit);
  if(window.visualViewport)visualViewport.addEventListener('resize',fit);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'&&view==='game'){if(game&&game.onPause)game.onPause('open');else setPause(true);}});
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{const on=!!(document.fullscreenElement||document.webkitFullscreenElement);$('btnFull').textContent=on?'🗗':'⛶';setTimeout(fit,60);}));
  $('btnPause').onclick=()=>{if(game&&game.onPause)game.onPause();else setPause();};
  $('btnSound').onclick=()=>setMute(!muted);
  $('btnFull').onclick=()=>setFull(!(document.fullscreenElement||document.webkitFullscreenElement));
  $('btnAgain').onclick=()=>start();
  setMute(muted);start();wireCanvas();
  if(game.preferFull&&matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<700){/* full screen needs a tap first on phones; the button is there */}
  new ResizeObserver(fit).observe($('stage'));}
 return{init,beep,noise,engine};
})();
document.addEventListener('DOMContentLoaded',Host.init);
