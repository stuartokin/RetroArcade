// Records a short silent looping clip of each game being played (by a simple autopilot), for the home page.
//   node tools/clips.js --dir=enhanced [--games=maze,snake]      (also --dir=original)
// Writes media/clips/<dir>/<id>.mp4 (about 6 s, 360 px wide, H.264) and updates data/clips.json.
// Needs ffmpeg. If a game ends during the take, it tries again (up to 4 takes).
const {chromium}=require('playwright');
const {serve}=require('../tests/serve.js');
const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const arg=(k,d)=>{const a=process.argv.find(x=>x.startsWith(`--${k}=`));return a?a.split('=').slice(1).join('='):d;};
const ROOT=path.resolve(__dirname,'..'),DIR=arg('dir','enhanced'),ONLY=arg('games','')?arg('games').split(',').filter(Boolean):null;
const LEN=6,LEAD=1.6,VW=520,VH=680;
// light-touch autopilot: steer about, fire often; each game gets a pattern that keeps it alive and busy
const PLAN={snake:['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'],maze:['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'],hopper:['ArrowUp','ArrowLeft','ArrowUp','ArrowRight'],
 blocks:['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'],racer:['ArrowUp','ArrowLeft','ArrowUp','ArrowRight'],ladder:['ArrowRight','ArrowRight','ArrowLeft','ArrowUp']};
// how long each key is held (ms): longer for games that move one square at a time
const HOLD={snake:[700,1100],maze:[600,1000],hopper:[250,400],blocks:[150,300]};
// games where Space isn't 'fire' (Block Drop: Space drops the piece, so the autopilot would stack to the top)
const NOFIRE=new Set(['blocks','snake','maze','hopper']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function take(browser,base,g,tmp){
 const ctx=await browser.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,recordVideo:{dir:tmp,size:{width:VW,height:VH}}});
 const t0=Date.now(),page=await ctx.newPage();let over=false,box=null;
 try{await page.goto(base+`${DIR}/`+g.play,{waitUntil:'load'});await page.waitForFunction(()=>window.ARCADE&&window.ARCADE.ready,null,{timeout:10000});
  box=await page.evaluate(()=>{const c=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];const r=c.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
  await page.keyboard.press('Space');await sleep(150);await page.keyboard.press('Enter');
  const keys=PLAN[g.id]||['ArrowLeft','ArrowRight','ArrowUp','ArrowRight','ArrowLeft'];
  const end=Date.now()+(LEAD+LEN+0.4)*1000;let i=0;
  while(Date.now()<end){const k=keys[i++%keys.length];
   await page.keyboard.down(k);if(!NOFIRE.has(g.id))await page.keyboard.press('Space');const [h0,h1]=HOLD[g.id]||[140,300];await sleep(h0+Math.random()*(h1-h0));await page.keyboard.up(k);
   if(i>3){const st=await page.evaluate(()=>window.ARCADE.state?window.ARCADE.state():{}).catch(()=>({}));if(st.over){over=true;break;}}}
 }catch(e){over=true;console.error(`  ${g.id}: ${e.message.split('\n')[0]}`);}
 const ready=Date.now();await page.close();const vid=await page.video().path();await ctx.close();
 return{over,vid,box,offset:(ready-t0)/1000-(LEN+0.4)};}
(async()=>{const L=JSON.parse(fs.readFileSync(path.join(ROOT,DIR,'games.json'),'utf8'));
 const server=await serve(0),base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch(),out=path.join(ROOT,'media','clips',DIR);
 fs.mkdirSync(out,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'clips-'));
 const mf=path.join(ROOT,'data','clips.json');let man={};try{man=JSON.parse(fs.readFileSync(mf,'utf8'));}catch(e){}man[DIR]=man[DIR]||{};
 for(const g of L.games.filter(g=>!ONLY||ONLY.includes(g.id))){let ok=false;
  for(let t=1;t<=4&&!ok;t++){const r=await take(browser,base,g,tmp);if(r.over||!r.box){console.error(`  ${g.id}: take ${t} ended early, trying again`);continue;}
   const b=r.box,crop=`crop=${Math.floor(b.w/2)*2}:${Math.floor(b.h/2)*2}:${Math.round(b.x)}:${Math.round(b.y)}`;
   const file=path.join(out,`${g.id}.mp4`);
   execFileSync('ffmpeg',['-v','error','-y','-ss',String(Math.max(0,r.offset)),'-i',r.vid,'-t',String(LEN),'-vf',`${crop},scale=360:-2,fps=20`,'-c:v','libx264','-preset','slow','-crf','30','-pix_fmt','yuv420p','-an','-movflags','+faststart',file]);
   man[DIR][g.id]=path.posix.join('media','clips',DIR,`${g.id}.mp4`);ok=true;console.log(`  ${g.id}: ${(fs.statSync(file).size/1024).toFixed(0)} KB`);}
  if(!ok)console.error(`  ${g.id}: no clip (the game kept ending)`);}
 fs.writeFileSync(mf,JSON.stringify(man,null,1)+'\n');fs.rmSync(tmp,{recursive:true,force:true});
 await browser.close();server.close();})();
