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
 const LABEL={invaders:{l:'◀',r:'▶',f:'● FIRE'},maze:{l:'◀',r:'▶',u:'▲',d:'▼'},meteor:{l:'⟲',r:'⟳',u:'▲ Thrust',f:'● Fire',d:'🌀 Hyper'},guardian:{u:'▲',d:'▼',l:'◀',r:'▶',f:'🔥 Fire',b:'💣 Bomb'},ladder:{l:'◀',r:'▶',u:'▲ Climb',d:'▼',f:'⤴ Jump'},racer:{l:'◀',r:'▶',u:'▲ Go',d:'▼ Brake',f:'🔥 Nitro'},snake:{l:'◀',r:'▶',u:'▲',d:'▼'},pinball:{l:'◀ Flip',r:'Flip ▶',f:'⬆ Launch'},bricks:{l:'◀',r:'▶',f:'● Serve'},hopper:{l:'◀',r:'▶',u:'▲',d:'▼'},blocks:{l:'◀',r:'▶',u:'⟳ Turn',d:'▼',f:'⤓ Drop'}};
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
 function fit(){if(!cv||!game)return;const st=$('stage'),r=st.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
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
 function buildPad(){const groups=(typeof PADS!=='undefined'&&PADS[gameId])||[['l','r'],['f']],lab=LABEL[gameId]||{};
  $('padL').innerHTML=groups[0].map(k=>`<button type="button" data-pad="${k}" class="pad-${k}">${lab[k]||k}</button>`).join('');
  $('padR').innerHTML=(groups[1]||[]).map(k=>`<button type="button" data-pad="${k}" class="pad-${k}">${lab[k]||k}</button>`).join('');
  document.querySelectorAll('.pad').forEach(el=>{
   el.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-pad]');if(!b)return;e.preventDefault();pad[b.dataset.pad]=true;latch[b.dataset.pad]=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(x){}if(game&&game.intro&&game.tap)game.tap();});
   ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,e=>{const b=e.target.closest('[data-pad]');if(b){pad[b.dataset.pad]=false;b.classList.remove('on');}}));
   el.addEventListener('contextmenu',e=>e.preventDefault());});}
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
  $('gSide').textContent=archived?`AI run ${run} (past version)`:SIDE.label;$('gSide').className='side '+(archived?'past':SIDE.id);
  $('help').textContent=`Keys: arrows or W A S D to move, Space to fire, P to pause.${HELP[gameId]||''}`;
  cv=$('cv');ctx=cv.getContext('2d');buildPad();
  addEventListener('keydown',e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.isContentEditable))return;
   if(over){if(e.key==='Enter'||e.key===' '){e.preventDefault();start();}return;}
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
   if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(game&&game.onPause)game.onPause();else setPause();return;}
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
