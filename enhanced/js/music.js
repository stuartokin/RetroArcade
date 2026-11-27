'use strict';
// Run 4 (AI): a small chiptune player shared by every game. Each game has its own theme, written
// here as a short recipe (tempo, key, mood, chords, instruments). The tune itself is composed from
// the recipe the same way every time: a one-bar motif that follows the chords, a bass line, an
// optional arpeggio and a drum kit, all made from oscillators and noise on the Web Audio clock.
const Music=(()=>{
 const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],mixo:[0,2,4,5,7,9,10],harm:[0,2,3,5,7,8,11]};
 // prog: chords as scale degrees (0 = home chord), section A then B. bass: drive | walk | pulse | oompah.
 // drums: four | back | shuffle | soft. lead/bass: oscillator types. arp: a quiet broken chord.
 const SONGS={
  invaders:{bpm:124,root:57,scale:'minor',A:[0,0,5,4],B:[5,3,6,4],lead:'square',bass:'drive',drums:'four',arp:false,seed:11},
  maze:{bpm:144,root:55,scale:'major',A:[0,5,3,4],B:[3,4,0,5],lead:'square',bass:'walk',drums:'back',arp:false,seed:23},
  meteor:{bpm:108,root:50,scale:'dorian',A:[0,0,6,3],B:[2,6,0,4],lead:'triangle',bass:'pulse',drums:'soft',arp:true,seed:37},
  guardian:{bpm:150,root:52,scale:'minor',A:[0,5,6,0],B:[3,4,5,4],lead:'sawtooth',bass:'drive',drums:'four',arp:false,seed:41},
  ladder:{bpm:128,root:55,scale:'mixo',A:[0,6,3,0],B:[3,0,6,4],lead:'square',bass:'oompah',drums:'back',arp:false,seed:53},
  racer:{bpm:164,root:57,scale:'major',A:[0,4,5,3],B:[3,4,1,4],lead:'sawtooth',bass:'drive',drums:'four',arp:false,seed:67},
  snake:{bpm:104,root:55,scale:'major',A:[0,3,0,4],B:[5,3,1,4],lead:'triangle',bass:'pulse',drums:'soft',arp:true,seed:71},
  pinball:{bpm:136,root:55,scale:'mixo',A:[0,6,3,0],B:[5,6,3,4],lead:'square',bass:'walk',drums:'back',arp:true,seed:83},
  bricks:{bpm:130,root:53,scale:'dorian',A:[0,3,0,6],B:[2,3,4,4],lead:'square',bass:'drive',drums:'back',arp:false,seed:97},
  hopper:{bpm:118,root:53,scale:'major',A:[0,0,3,4],B:[5,1,4,4],lead:'triangle',bass:'oompah',drums:'shuffle',arp:false,seed:101},
  blocks:{bpm:116,root:57,scale:'harm',A:[0,3,4,0],B:[5,3,1,4],lead:'square',bass:'pulse',drums:'back',arp:true,seed:113},
  moon:{bpm:112,root:60,scale:'major',A:[0,5,3,4],B:[5,3,0,4],lead:'triangle',bass:'oompah',drums:'soft',arp:true,seed:131}};
 const RHYTHMS=[ // note onsets in a bar of 16 steps: [step, length]
  [[0,2],[2,2],[4,2],[6,2],[8,4],[12,2],[14,2]],
  [[0,3],[3,3],[6,2],[8,2],[10,2],[12,4]],
  [[0,2],[2,1],[3,1],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],
  [[0,4],[4,2],[6,2],[8,3],[11,1],[12,4]],
  [[0,1],[2,1],[4,2],[6,2],[8,1],[10,1],[12,2],[14,2]],
  [[0,6],[6,2],[8,2],[10,2],[12,4]]];
 const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 const cache={};
 // Compose a song from its recipe: 16 bars (A A B A'), each bar a list of notes per voice.
 function compose(id){if(cache[id])return cache[id];const S=SONGS[id]||SONGS.invaders,r=rng(S.seed),sc=SCALES[S.scale];
  const deg=d=>{const o=Math.floor(d/7),i=((d%7)+7)%7;return S.root+12*o+sc[i];}; // scale degree → MIDI note
  const motif=(ry)=>{let p=0;return RHYTHMS[ry].map(([s,l],i)=>{if(s%8===0)p=[0,2,4,7][Math.floor(r()*4)];else if(s%4===0)p=[0,2,4,2][Math.floor(r()*4)]+(r()<.3?7:0);else p+=r()<.5?(r()<.5?1:-1):(r()<.5?2:-2);p=Math.max(-2,Math.min(7,p));return[s,l,p];});};
  const m1=motif(Math.floor(r()*RHYTHMS.length)),m2=motif(Math.floor(r()*RHYTHMS.length)),m3=motif(Math.floor(r()*RHYTHMS.length));
  const end=[[0,4,4],[4,4,2],[8,8,0]],ends=[[0,4,2],[4,4,4],[8,8,7]];
  const bars=[],sec=(prog,ms,last)=>prog.forEach((c,i)=>{const m=i===3?last:ms[i%ms.length];
   const cc=c>=4?c-7:c;bars.push({c,lead:m.map(([s,l,p])=>({s,l,n:deg(cc+p+7)}))});});
  sec(S.A,[m1,m2,m1],ends);sec(S.A,[m1,m2,m1],end);sec(S.B,[m3,m3,m2],ends);sec(S.A,[m1,m2,m1],end);
  for(const b of bars){const c=b.c>=4?b.c-7:b.c,R=deg(c-7),F=deg(c-7+4),O=R+12,t=[deg(c),deg(c+2),deg(c+4)];
   b.bass=S.bass==='drive'?[0,2,4,6,8,10,12,14].map((s,i)=>({s,l:2,n:i%4===3?O:R})):
    S.bass==='walk'?[[0,R],[4,F],[8,O],[12,deg(c-7+5)]].map(([s,n])=>({s,l:3,n})):
    S.bass==='oompah'?[[0,R],[4,F],[8,R],[12,F]].map(([s,n])=>({s,l:2,n})):
    [[0,R],[6,R],[8,O],[12,R]].map(([s,n])=>({s,l:3,n}));
   b.arp=S.arp?[...Array(16)].map((_,s)=>({s,l:1,n:t[[0,1,2,1][s%4]]+12})):[];}
  return cache[id]={S,bars};}
 // drum patterns: k = kick, s = snare, h = hat, one letter group per 16th step
 const DRUMS={four:'k..hs.h.k..hs.hh',back:'k.h.s.h.k.k.s.hh',shuffle:'k..hs..hk..hs.h.',soft:'k...h...k...h..h'};
 let ac=null,bus=null,cur=null,step=0,next=0,on=false,lvl=1,noiseBuf=null;
 function voice(type,f,t,d,v){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.setValueAtTime(v*.8,t+d*.6);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(bus);o.start(t);o.stop(t+d+.02);}
 function hit(k,t){if(k==='k'){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g).connect(bus);o.start(t);o.stop(t+.17);return;}
  if(!noiseBuf){noiseBuf=ac.createBuffer(1,ac.sampleRate/2,ac.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),d=k==='s'?.12:.04;s.buffer=noiseBuf;f.type='highpass';f.frequency.value=k==='s'?1500:6500;
  g.gain.setValueAtTime(k==='s'?.05:.022,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(bus);s.start(t);s.stop(t+d+.02);}
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function schedule(t){const {S,bars}=cur,bar=bars[Math.floor(step/16)%bars.length],s=step%16,len=60/(S.bpm*(1+Math.min(.16,(lvl-1)*.02)))/4;
  const vl=S.lead==='triangle'?.05:S.lead==='sawtooth'?.016:.022;
  for(const n of bar.lead)if(n.s===s)voice(S.lead,hz(n.n),t,n.l*len*.92,vl);
  for(const n of bar.bass)if(n.s===s)voice('triangle',hz(n.n),t,n.l*len*.9,.07);
  for(const n of bar.arp)if(n.s===s)voice('square',hz(n.n),t,len*.7,.006);
  const d=DRUMS[S.drums]||DRUMS.soft,ch=d[s];if(ch&&ch!=='.')hit(ch,t);
  return len;}
 return{
  songs:SONGS,compose,
  // called every frame by the shell: playing = the game is running and music is switched on
  tick(ctx,dest,id,playing,level){if(!playing||!ctx){on=false;return;}
   try{if(ac!==ctx){ac=ctx;bus=null;noiseBuf=null;}
    if(!bus){bus=ac.createGain();bus.gain.value=.55;bus.connect(dest||ac.destination);}
    if(!cur||cur.id!==id){cur={id,...compose(id)};step=0;on=false;}
    lvl=level||1;if(!on){on=true;next=ac.currentTime+.06;}
    if(next<ac.currentTime-.3)next=ac.currentTime+.03; // after a stall, don't try to catch up
    while(next<ac.currentTime+.18){next+=schedule(next);step++;}}catch(e){on=false;}},
  // a short "game over" tune in the game's own key, played once by the shell
  jingle(ctx,id){if(!ctx)return;try{const S=SONGS[id]||SONGS.invaders,sc=SCALES[S.scale],n=d=>S.root+12+sc[((d%7)+7)%7]+12*Math.floor(d/7),t0=ctx.currentTime+.05,g=ctx.createGain();g.gain.value=.5;g.connect(ctx.destination);
   [[4,0,.16],[3,.16,.16],[2,.32,.16],[1,.48,.16],[0,.64,.5]].forEach(([d,at,l])=>{const o=ctx.createOscillator(),v=ctx.createGain(),t=t0+at;o.type='square';o.frequency.value=440*Math.pow(2,(n(d)-69)/12);
    v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(.03,t+.01);v.gain.exponentialRampToValueAtTime(.0001,t+l);o.connect(v).connect(g);o.start(t);o.stop(t+l+.02);});}catch(e){}},
  restart(){step=0;on=false;},
  stop(){on=false;if(bus){try{const b=bus;b.gain.setTargetAtTime(0,ac.currentTime,.03);setTimeout(()=>{try{b.disconnect();}catch(e){}},300);}catch(e){}bus=null;}}};
})();
