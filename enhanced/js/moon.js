'use strict';
// =====================================================================================================
// 12. MOON BOUNCE (run 6, 27 Nov 2026) — the first game the AI invented for the arcade.
// A little alien springs from cloud to cloud, climbing from a blue day sky through sunset and night
// into space, towards the moon. Left and right steer (the edges wrap round); FIRE throws a star
// upwards to pop storm-puffs. Everything is drawn in code. Loaded after games.js by play.html.
// World y grows downwards; the climb goes towards negative y. 10 px of climb = 1 metre.
// =====================================================================================================
function makeMoon(env){
 const W=400,H=640,G={W,H,score:0,lives:3,level:1,levelName:'Zone',over:false},FX=Retro.fx();
 const GRAV=1500,JUMP=820,SPRING=1360,ROCKET=1150,PXM=10,ZONE_M=1000,BASE=H-60;
 const ZONES=[ // name, sky top, sky bottom, cloud tint
  ['MEADOW SKY','#3d8bff','#bfe6ff','#ffffff'],['SUNSET SKY','#ff7a59','#ffd36e','#fff1e0'],
  ['TWILIGHT','#4b2a86','#ff8fb1','#f3e4ff'],['STARRY NIGHT','#0b1240','#2b3a8a','#dfe6ff'],
  ['OUTER SPACE','#02030c','#14123a','#d8f4ff'],['MOON ORBIT','#000','#1d0f33','#fff4d6']];
 const P={x:W/2,y:BASE,vx:0,vy:-JUMP,face:1,squash:0,rocket:0,inv:0,bubble:0,target:null};
 let plats=[],items=[],puffs=[],shots=[],pops=[],farClouds=[],banner=null,t=0,camY=0,topY=BASE,bonus=0,best=0,zone=0,cool=0,fireHeld=true,combo=0;
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const metres=()=>Math.max(0,Math.floor((BASE-topY)/PXM));
 const diff=()=>Math.min(1,metres()/5000);
 // ---------- building the sky ----------
 function addPlat(x,y,kind){const p={x,y,w:kind==='crumb'?58:68,kind,vx:kind==='move'?rnd(50,90+70*diff())*(Math.random()<.5?-1:1):0,dead:false,fall:0,spring:false,squash:0};plats.push(p);return p;}
 let nextY=BASE+30,lastX=W/2;
 function generate(){while(nextY>camY-260){const d=diff(),m=Math.max(0,(BASE-nextY)/PXM);
   const gap=m<60?rnd(58,82):rnd(60+45*d,95+70*d);nextY-=gap;
   let x=lastX+rnd(-170,170);x=((x-40)%(W-80)+(W-80))%(W-80)+40;lastX=x;
   const kind=m>80&&Math.random()<.12+.35*d?'move':'norm';const p=addPlat(x,nextY,kind);
   if(m>30&&Math.random()<.07&&kind==='norm')p.spring=true;
   if(m>120&&Math.random()<.016)items.push({k:'rocket',x:p.x,y:p.y-26,plat:p});
   else if(Math.random()<.32){const n=Math.random()<.3?3:1;for(let i=0;i<n;i++)items.push({k:'star',x:p.x+(i-(n-1)/2)*26,y:p.y-34-(n>1?Math.abs(i-1)*-8:0),plat:kind==='move'?p:null,dx:(i-(n-1)/2)*26});}
   // a crumbly cloud between the safe ones (never needed to climb, only a tempting extra)
   if(m>40&&Math.random()<.22+.2*d){let cx=(x+rnd(110,W-110))%W;cx=Math.max(36,Math.min(W-36,cx));addPlat(cx,nextY+gap*.5,'crumb');}
   if(m>100&&Math.random()<.035+.09*d)puffs.push({x:rnd(40,W-40),y:nextY-gap*.5,ph:Math.random()*6,vx:rnd(25,55+45*d)*(Math.random()<.5?-1:1),dead:false});}}
 function start(){plats=[];items=[];puffs=[];shots=[];nextY=BASE+30;lastX=W/2;
  addPlat(W/2,BASE+30,'norm').w=120;generate();
  farClouds=[...Array(9)].map((_,i)=>({x:rnd(0,W),y:i*130,s:rnd(.6,1.4)}));}
 start();
 // ---------- player helpers ----------
 function bounce(v,pitch){P.vy=-v;P.squash=1;combo++;env.beep(pitch||(420+Math.min(8,combo)*30),.09,'triangle',.045,1.7);}
 function loseLife(){if(P.inv>0||G.over)return;G.lives--;FX.shake(10);env.noise(.45,.07,600);env.beep(300,.4,'sawtooth',.04,.3);combo=0;
  if(G.lives<=0){banner={t:2.2,freeze:1,text:'GAME OVER',sub:`YOU CLIMBED ${metres()} M`,color:'#ff2d55',then:()=>G.over=true};P.dead=true;return;}
  // a bubble carries you back: a rescue cloud near the bottom of the view, and a little time to get ready
  const y=camY+H-90,r=addPlat(W/2,y,'norm');r.w=110;r.rescue=true;
  puffs.forEach(e=>{if(Math.abs(e.y-y)<260)e.dead=true;});
  Object.assign(P,{x:W/2,y:y-220,vx:0,vy:0,inv:3,bubble:1.2,rocket:0,target:null});
  banner={t:1.1,freeze:1,text:'WHOOPS!',sub:`${G.lives} ${G.lives>1?'LIVES':'LIFE'} LEFT`};}
 G.pointer=fx=>{P.target=fx*W;};
 // ---------- update ----------
 G.update=(dt,inp)=>{t+=dt;FX.update(dt);pops.forEach(p=>{p.t-=dt;p.y-=30*dt;});pops=pops.filter(p=>p.t>0);
  if(banner){banner.t-=dt;if(banner.t<=0){const f=banner.then;banner=null;if(f)f();}if(banner&&banner.freeze||P.dead)return;}
  // steering: keys or D-pad, or follow a finger dragged on the game
  const dir=(inp.r?1:0)-(inp.l?1:0);if(dir)P.target=null;
  let want=dir*330;if(!dir&&P.target!==null){let dx=P.target-P.x;if(dx>W/2)dx-=W;if(dx<-W/2)dx+=W;want=Math.abs(dx)<6?0:Math.max(-340,Math.min(340,dx*6));}
  P.vx+=(want-P.vx)*Math.min(1,dt*(dir?9:7));if(Math.abs(P.vx)>20)P.face=P.vx>0?1:-1;
  P.x+=P.vx*dt;if(P.x<-14)P.x+=W+28;if(P.x>W+14)P.x-=W+28;
  if(P.bubble>0){P.bubble-=dt;P.vy=0;P.y+=Math.sin(t*5)*.4;}
  else if(P.rocket>0){P.rocket-=dt;P.vy=-ROCKET;if(Math.random()<.7)FX.burst(P.x,P.y+6,['#ffe45e','#ff8a1c','#fff'],1,90,.4,4);if(P.rocket<=0)P.vy=-JUMP*.6;}
  else P.vy+=GRAV*dt;
  const py=P.y;P.y+=P.vy*dt;P.inv=Math.max(0,P.inv-dt);P.squash=Math.max(0,P.squash-dt*4);
  // clouds
  for(const p of plats){if(p.vx){p.x+=p.vx*dt;if(p.x<p.w/2+4||p.x>W-p.w/2-4){p.vx*=-1;p.x=Math.max(p.w/2+4,Math.min(W-p.w/2-4,p.x));}}
   if(p.dead){p.fall+=dt;p.y+=300*dt*p.fall*3;continue;}p.squash=Math.max(0,p.squash-dt*5);
   if(P.vy>0&&P.rocket<=0&&py<=p.y+2&&P.y>=p.y-2&&Math.abs(P.x-p.x)<p.w/2+12){P.y=p.y;p.squash=1;
    if(p.spring&&Math.abs(P.x-p.x)<22){bounce(SPRING,380);env.beep(700,.25,'square',.03,2.4);p.boing=.5;FX.burst(P.x,p.y,['#ff2d55','#fff'],10,140,.4,3);}else bounce(JUMP);
    if(p.kind==='crumb'){p.dead=true;env.noise(.25,.05,1800);FX.burst(p.x,p.y+8,['#c9b79c','#8a7a66'],14,110,.6,4);}}}
  for(const p of plats)if(p.boing)p.boing=Math.max(0,p.boing-dt);
  // stars and rockets
  for(const it of items){if(it.plat&&it.k==='star'&&it.plat.vx)it.x=it.plat.x+(it.dx||0);if(it.plat&&it.k==='rocket')it.x=it.plat.x;
   if(!it.got&&Math.abs(P.x-it.x)<24&&Math.abs(P.y-12-it.y)<30){it.got=true;
    if(it.k==='star'){bonus+=100;pops.push({x:it.x,y:it.y,txt:'+100',t:.8,c:'#ffe45e'});env.beep(1320,.08,'square',.03,1.5);FX.burst(it.x,it.y,['#ffe45e','#fff'],8,100,.4,3);}
    else{P.rocket=2.2;P.bubble=0;pops.push({x:it.x,y:it.y,txt:'ROCKET!',t:1,c:'#ff8a1c'});env.beep(220,.6,'sawtooth',.04,4);}}}
  // star shots
  cool-=dt;const fire=!!inp.f&&!fireHeld;fireHeld=!!inp.f;
  if(fire&&cool<=0&&shots.length<3&&!P.dead){shots.push({x:P.x,y:P.y-30,a:0});cool=.28;env.beep(990,.06,'square',.025,1.8);}
  for(const s of shots){s.y-=760*dt;s.a+=dt*12;if(s.y<camY-30)s.gone=true;}
  // storm-puffs
  for(const e of puffs){if(e.dead)continue;e.ph+=dt;e.x+=e.vx*dt;if(e.x<30||e.x>W-30){e.vx*=-1;e.x=Math.max(30,Math.min(W-30,e.x));}
   const ey=e.y+Math.sin(e.ph*2)*8;
   for(const s of shots)if(!s.gone&&Math.abs(s.x-e.x)<26&&Math.abs(s.y-ey)<22){s.gone=true;popPuff(e,ey,300);}
   if(e.dead)continue;const dx=P.x-e.x,dy=(P.y-14)-ey;
   if(Math.abs(dx)<30&&Math.abs(dy)<28){if(P.vy>0&&dy<-6&&P.rocket<=0){popPuff(e,ey,500);bounce(JUMP*1.05,660);}else if(P.rocket>0||P.inv>0){if(P.rocket>0)popPuff(e,ey,300);}else loseLife();}}
  shots=shots.filter(s=>!s.gone);
  // camera, height and zones
  if(P.y<topY)topY=P.y;const want2=P.y-H*.42;if(want2<camY)camY+=(want2-camY)*Math.min(1,dt*10);
  if(P.y>camY+H+50&&!P.dead)loseLife();
  generate();
  plats=plats.filter(p=>p.y<camY+H+120);items=items.filter(i=>!i.got&&i.y<camY+H+60);puffs=puffs.filter(e=>!e.dead&&e.y<camY+H+80);
  const m=metres(),z=Math.floor(m/ZONE_M);
  if(z>zone){zone=z;const b=1000*z;bonus+=b;const extra=G.lives<5;if(extra)G.lives++;const nm=ZONES[Math.min(z,ZONES.length-1)][0];
   banner={t:1.6,text:z>=ZONES.length-1&&z===5?'YOU MADE IT!':nm,sub:`${z*ZONE_M} M  +${fmtN(b)}${extra?'  +1 LIFE':''}`,color:'cycle'};FX.burst(W/2,camY+H/2,Retro.CYCLE,40,240,1,3);env.beep(660,.12,'square',.04,1.5);setTimeout(()=>env.beep(990,.2,'square',.04,1.5),130);}
  G.level=zone+1;G.score=m*10+bonus;};
 function popPuff(e,ey,pts){e.dead=true;bonus+=pts;pops.push({x:e.x,y:ey,txt:'+'+pts,t:.8,c:'#b9f'});FX.burst(e.x,ey,['#7d5ba6','#c9b3ff','#fff'],18,160,.6,4);env.noise(.2,.05,2500);env.beep(500,.12,'square',.03,2);}
 // ---------- drawing ----------
 const mix=(a,b,k)=>{const p=s=>[1,3,5].map(i=>parseInt(s.length===4?s[Math.ceil(i/2)].repeat(2):s.slice(i,i+2),16));const A=p(a),B=p(b);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`;};
 function skyAt(m){const f=Math.min(ZONES.length-1,m/ZONE_M),i=Math.floor(f),k=f-i,a=ZONES[i],b=ZONES[Math.min(ZONES.length-1,i+1)];
  // blend over the last fifth of each zone so the sky changes smoothly as you climb
  const kk=Math.max(0,(k-.8)/.2);return[mix(a[1],b[1],kk),mix(a[2],b[2],kk),mix(a[3],b[3],kk)];}
 function cloudShape(c,x,y,w,h){const r=h*.62;c.beginPath();c.moveTo(x-w/2+r,y+h);c.arc(x-w/2+r,y+h-r,r,Math.PI/2,Math.PI*1.5);
  c.arc(x-w*.18,y+h*.35,h*.62,Math.PI*1.1,Math.PI*1.9);c.arc(x+w*.16,y+h*.28,h*.72,Math.PI*1.15,Math.PI*1.95);c.arc(x+w/2-r,y+h-r,r,Math.PI*1.5,Math.PI/2);c.closePath();}
 function drawCloud(c,p,tint,oy){const sq=p.squash*4,x=p.x,y=p.y-oy+sq*.5,w=p.w+sq,h=20-sq*.5;c.save();
  if(p.dead)c.globalAlpha=Math.max(0,1-p.fall*2);
  c.fillStyle='rgba(0,0,30,.18)';cloudShape(c,x+3,y+5,w,h);c.fill();
  const g=c.createLinearGradient(0,y-8,0,y+h);
  if(p.kind==='crumb'){g.addColorStop(0,'#e8dcc6');g.addColorStop(1,'#a8957a');}else if(p.kind==='move'){g.addColorStop(0,'#e6fbff');g.addColorStop(1,'#7cc9ff');}else{g.addColorStop(0,tint);g.addColorStop(1,'#a9c4e8');}
  c.fillStyle=g;cloudShape(c,x,y,w,h);c.fill();
  if(p.kind==='crumb'){c.strokeStyle='rgba(90,70,50,.6)';c.lineWidth=1.5;c.beginPath();c.moveTo(x-8,y+2);c.lineTo(x-2,y+10);c.lineTo(x-7,y+17);c.moveTo(x+12,y+4);c.lineTo(x+8,y+12);c.stroke();}
  if(p.kind==='move'){c.fillStyle='rgba(30,90,160,.55)';for(const s of[-1,1]){c.beginPath();c.moveTo(x+s*(w/2-6),y+h*.55);c.lineTo(x+s*(w/2-14),y+h*.55-5);c.lineTo(x+s*(w/2-14),y+h*.55+5);c.fill();}}
  if(p.rescue){c.strokeStyle='rgba(255,228,94,.8)';c.lineWidth=2;cloudShape(c,x,y,w,h);c.stroke();}
  if(p.spring){const ext=p.boing?10*p.boing/.5:0;c.strokeStyle='#d9dde8';c.lineWidth=2.5;c.beginPath();for(let i=0;i<5;i++){const yy=y-2-i*(2.6+ext/5);c.moveTo(x-7,yy);c.lineTo(x+7,yy-1.3);}c.stroke();
   c.fillStyle='#ff2d55';c.beginPath();c.roundRect?c.roundRect(x-11,y-17-ext,22,6,3):c.rect(x-11,y-17-ext,22,6);c.fill();}
  c.restore();}
 function drawAlien(c,x,y,sc=1){const st=P.squash*.28,vy=P.vy,stretch=vy<-200?Math.min(.18,-vy/5000):0,sx=(1+st-stretch*.6)*sc,sy=(1-st+stretch)*sc;
  c.save();c.translate(x,y);c.scale(sx,sy);
  if(P.rocket>0&&sc===1){c.fillStyle='#8a90a8';c.fillRect(-15,-26,7,16);c.fillRect(8,-26,7,16);const fl=8+Math.random()*10;c.fillStyle='#ff8a1c';for(const s of[-11.5,11.5]){c.beginPath();c.moveTo(s-4,-10);c.lineTo(s,-10+fl);c.lineTo(s+4,-10);c.fill();}}
  c.fillStyle='#2f9e44';c.fillRect(-10,-6,6,6);c.fillRect(4,-6,6,6); // feet
  const g=c.createRadialGradient(-5,-26,3,0,-18,18);g.addColorStop(0,'#b6ff8a');g.addColorStop(1,'#37b24d');c.fillStyle=g;c.beginPath();c.ellipse(0,-18,15,15,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#37b24d';c.lineWidth=2;c.beginPath();c.moveTo(-6,-31);c.lineTo(-10,-41);c.moveTo(6,-31);c.lineTo(10,-41);c.stroke();
  c.fillStyle='#ffe45e';c.beginPath();c.arc(-10,-42,3,0,Math.PI*2);c.arc(10,-42,3,0,Math.PI*2);c.fill();
  const f=P.face;c.fillStyle='#fff';c.beginPath();c.ellipse(f*2,-21,7,8,0,0,Math.PI*2);c.fill();
  c.fillStyle='#1b1f3b';c.beginPath();c.arc(f*4,-20+(vy>300?2:vy<-300?-2:0),3.6,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.fillRect(f*4-2.5,-23,1.6,1.6);
  c.strokeStyle='#1b5e20';c.lineWidth=1.6;c.beginPath();if(P.inv>0&&!P.bubble)c.arc(f*2,-9,3,0,Math.PI);else c.arc(f*2,-11,4,.2,Math.PI-.2);c.stroke();
  c.restore();
  if(P.bubble>0||(P.inv>0&&sc===1)){c.save();c.globalAlpha=P.bubble>0?.9:.35+.25*Math.sin(t*20);c.strokeStyle='#bff4ff';c.lineWidth=2.5;c.beginPath();c.arc(x,y-20,28,0,Math.PI*2);c.stroke();c.fillStyle='rgba(191,244,255,.18)';c.fill();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(x-10,y-32,4,0,Math.PI*2);c.fill();c.restore();}}
 function drawPuff(c,x,y,ph,sc=1){c.save();c.translate(x,y);c.scale(sc,sc);c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(3,18,22,5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#5a3f86';for(const [px,py,r] of [[-14,4,12],[0,-4,15],[14,3,12],[-6,8,11],[7,9,11]]){c.beginPath();c.arc(px,py,r,0,Math.PI*2);c.fill();}
  c.fillStyle='#7d5ba6';c.beginPath();c.arc(-3,-7,10,0,Math.PI*2);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(-7,2,4.5,0,Math.PI*2);c.arc(7,2,4.5,0,Math.PI*2);c.fill();c.fillStyle='#1b1f3b';c.beginPath();c.arc(-6,3,2.2,0,Math.PI*2);c.arc(6,3,2.2,0,Math.PI*2);c.fill();
  c.strokeStyle='#1b1f3b';c.lineWidth=2;c.beginPath();c.moveTo(-12,-4);c.lineTo(-3,-1);c.moveTo(12,-4);c.lineTo(3,-1);c.stroke();
  if(Math.sin(ph*3)>.85){c.strokeStyle='#ffe45e';c.lineWidth=2;c.beginPath();c.moveTo(4,16);c.lineTo(0,23);c.lineTo(5,23);c.lineTo(1,31);c.stroke();}
  c.restore();}
 function drawStar(c,x,y,r,a=0,col='#ffe45e'){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r,an=-Math.PI/2+i*Math.PI/5;c.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);}c.closePath();c.fill();c.restore();}
 function drawRocket(c,x,y){c.save();c.translate(x,y+Math.sin(t*4)*3);c.fillStyle='#e6e9f2';c.beginPath();c.moveTo(0,-14);c.quadraticCurveTo(8,-4,6,10);c.lineTo(-6,10);c.quadraticCurveTo(-8,-4,0,-14);c.fill();
  c.fillStyle='#ff2d55';c.beginPath();c.moveTo(-6,4);c.lineTo(-11,12);c.lineTo(-5,10);c.fill();c.beginPath();c.moveTo(6,4);c.lineTo(11,12);c.lineTo(5,10);c.fill();c.fillStyle='#3fe0ff';c.beginPath();c.arc(0,-3,3,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe45e';c.beginPath();c.moveTo(-4,11);c.lineTo(0,16+Math.random()*5);c.lineTo(4,11);c.fill();c.restore();}
 function background(c){const m=Math.max(0,(BASE-camY-H/2)/PXM),[top,bot,tint]=skyAt(m),g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bot);c.fillStyle=g;c.fillRect(-20,-20,W+40,H+40);
  // stars fade in after sunset
  const sa=Math.max(0,Math.min(1,(m-ZONE_M*1.6)/(ZONE_M*1.2)));if(sa>0){for(let i=0;i<80;i++){const x=(i*97.3)%W,y=(((i*61.7-camY*.08)%H)+H)%H;c.globalAlpha=sa*(.4+.6*((i*7+Math.floor(t*2))%5===0?1:.5));c.fillStyle='#fff';const s=i%9===0?2:1;c.fillRect(x,y,s,s);}c.globalAlpha=1;}
  // a far planet in space
  if(m>ZONE_M*3.4){const pa=Math.min(1,(m-ZONE_M*3.4)/300);c.globalAlpha=pa;const py=((140-camY*.03)%(H+300)+H+300)%(H+300)-150;const pg=c.createRadialGradient(70,py-10,4,80,py,40);pg.addColorStop(0,'#ffb3e6');pg.addColorStop(1,'#7b3fa0');c.fillStyle=pg;c.beginPath();c.arc(80,py,34,0,Math.PI*2);c.fill();
   c.strokeStyle='rgba(255,220,255,.6)';c.lineWidth=3;c.beginPath();c.ellipse(80,py,54,10,-.3,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
  // the sun by day, then the moon, which grows as you climb
  const sun=Math.max(0,1-m/(ZONE_M*1.7));if(sun>0){c.globalAlpha=sun;const sy=90+m*.12;c.fillStyle='rgba(255,240,170,.35)';c.beginPath();c.arc(W-70,sy,46,0,Math.PI*2);c.fill();c.fillStyle='#fff3a8';c.beginPath();c.arc(W-70,sy,30,0,Math.PI*2);c.fill();c.globalAlpha=1;}
  const mr=Math.min(100,16+m/45),ma=Math.min(1,m/(ZONE_M*1.2));if(ma>0){c.globalAlpha=ma;const mx=W-80,my=60+mr*.5;const mg=c.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);mg.addColorStop(0,'#fffbe6');mg.addColorStop(1,'#d9cfa8');
   c.fillStyle='rgba(255,250,220,.15)';c.beginPath();c.arc(mx,my,mr*1.25,0,Math.PI*2);c.fill();c.fillStyle=mg;c.beginPath();c.arc(mx,my,mr,0,Math.PI*2);c.fill();
   c.fillStyle='rgba(150,140,110,.35)';for(const [cx,cy,cr] of [[-.35,-.1,.18],[.2,.3,.14],[.3,-.35,.1],[-.1,.45,.08]]){c.beginPath();c.arc(mx+cx*mr,my+cy*mr,cr*mr,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
  // soft far clouds drift slowly (parallax), fading out in space
  const fa=Math.max(0,1-m/(ZONE_M*3.5));if(fa>0){c.fillStyle=tint;for(const f of farClouds){const y=(((f.y-camY*.3)%(H+260))+H+260)%(H+260)-130,x=((f.x+t*6*f.s)%(W+160))-80;c.globalAlpha=fa*.28;cloudShape(c,x,y,90*f.s,22*f.s);c.fill();}c.globalAlpha=1;}
  // green hills at the very start
  const hy=BASE+40-camY;if(hy<H+80){c.fillStyle='#5ccf6a';c.beginPath();c.moveTo(-20,H+40);for(let x=-20;x<=W+20;x+=20)c.lineTo(x,hy+Math.sin(x*.02)*14);c.lineTo(W+20,H+40);c.fill();
   c.fillStyle='#3fa34d';c.beginPath();c.moveTo(-20,H+40);for(let x=-20;x<=W+20;x+=20)c.lineTo(x,hy+30+Math.sin(x*.03+1)*10);c.lineTo(W+20,H+40);c.fill();}
  return tint;}
 G.render=c=>{const[ox,oy]=FX.offset();c.save();c.translate(ox,oy);const tint=background(c),cy=camY;
  for(const p of plats)drawCloud(c,p,tint,cy);
  for(const it of items){if(it.k==='star'){const y=it.y-cy+Math.sin(t*4+it.x)*3;c.fillStyle='rgba(255,228,94,.25)';c.beginPath();c.arc(it.x,y,13,0,Math.PI*2);c.fill();drawStar(c,it.x,y,10,Math.sin(t*2+it.x)*.3);}else drawRocket(c,it.x,it.y-cy);}
  for(const e of puffs)drawPuff(c,e.x,e.y-cy+Math.sin(e.ph*2)*8,e.ph);
  for(const s of shots){c.fillStyle='rgba(255,255,200,.35)';c.beginPath();c.arc(s.x,s.y-cy,10,0,Math.PI*2);c.fill();drawStar(c,s.x,s.y-cy,8,s.a,'#fff7b0');}
  if(!P.dead){const blink=P.inv>0&&!P.bubble&&Math.floor(t*12)%2;c.globalAlpha=blink?.55:1;drawAlien(c,P.x,P.y-cy);if(P.x<20)drawAlien(c,P.x+W+28,P.y-cy);if(P.x>W-20)drawAlien(c,P.x-W-28,P.y-cy);c.globalAlpha=1;}
  FX.render(c);
  for(const p of pops){c.globalAlpha=Math.min(1,p.t*2);Retro.text(c,p.txt,p.x,p.y-cy,2,p.c,'center');}c.globalAlpha=1;
  c.restore();
  // heads-up: height and a little climb bar towards the next zone
  c.fillStyle='rgba(0,0,30,.35)';c.fillRect(0,0,W,30);
  Retro.text(c,`${metres()} M`,10,8,2,'#fff');Retro.text(c,String(G.score).padStart(6,'0'),W-10,8,2,'#ffe45e','right');
  const k=(metres()%ZONE_M)/ZONE_M;c.fillStyle='rgba(255,255,255,.25)';c.fillRect(W/2-60,12,120,6);c.fillStyle='#3cff6a';c.fillRect(W/2-60,12,120*k,6);
  drawBanner(c,W,H,banner);};
 // FX particles are made in world coordinates; shift them into view when drawn
 const fxRender=FX.render;FX.render=(c)=>{c.save();c.translate(0,-camY);fxRender(c);c.restore();};
 G._peek=()=>({P,camY,plats,puffs,items,m:metres(),zone});
 G._climb=m=>{topY=Math.min(topY,BASE-m*PXM);}; // test helper
 const lg=(f)=>(c,x,y)=>{c.save();f(c,x,y);c.restore();};
 const legend=[
  {name:'CLOUD',pts:'BOUNCE',draw:lg((c,x,y)=>drawCloud(c,{x,y:y-6,w:56,kind:'norm',squash:0},'#fff',0))},
  {name:'CRUMBLY',pts:'ONCE ONLY',draw:lg((c,x,y)=>drawCloud(c,{x,y:y-6,w:50,kind:'crumb',squash:0},'#fff',0))},
  {name:'SPRING',pts:'SUPER JUMP',draw:lg((c,x,y)=>drawCloud(c,{x,y:y+4,w:50,kind:'norm',squash:0,spring:true},'#fff',0))},
  {name:'STAR',pts:'100',draw:lg((c,x,y)=>drawStar(c,x,y,10))},
  {name:'ROCKET',pts:'BLAST OFF',draw:lg((c,x,y)=>drawRocket(c,x,y))},
  {name:'STORM PUFF',pts:'JUMP ON IT',draw:lg((c,x,y)=>drawPuff(c,x,y-4,0,.7))}].map(e=>({...e,color:'#ffe45e'}));
 return Retro.intro(G,{title:'MOON BOUNCE',color:'cycle',sub:'BOUNCE UP TO THE MOON',tableTitle:'HOW TO PLAY',legend,hi:env.hi,bg:'#1a2a6c',stars:true,
  hint:'LEFT RIGHT OR DRAG TO STEER - SPACE THROWS A STAR',onStart:()=>{banner=null;}});}
GAME_LIST.push({id:'moon',name:'Moon Bounce',icon:'🌙',desc:'Bounce from cloud to cloud, up through the sky to the moon!'});
GAMES.moon=makeMoon;
