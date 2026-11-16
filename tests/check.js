// Retro Arcade test rig. Plays every game on phone, Fold, iPad, laptop and big screens, and checks the
// home page and the evolution log. Exit code 0 only if every check passes.
//
//   node tests/check.js                     everything (both sides, all devices)
//   node tests/check.js --quick             laptop + phone + folded Fold
//   node tests/check.js --side=enhanced     only the AI's games (also: original)
//   node tests/check.js --games=maze,snake  only these games
//   node tests/check.js --url=https://stuartokin.github.io/RetroArcade/   check the live site
const {chromium}=require('playwright');
const {serve}=require('./serve.js');
const fs=require('fs'),path=require('path');
const arg=(k,d)=>{const a=process.argv.find(x=>x.startsWith(`--${k}=`));return a?a.split('=').slice(1).join('='):process.argv.includes(`--${k}`)?true:d;};
const QUICK=!!arg('quick',false),SIDE=arg('side','both'),ONLY=arg('games','')?String(arg('games')).split(',').filter(Boolean):null,URL0=arg('url','');
const ROOT=path.resolve(__dirname,'..');

const DEVICES=[
 {name:'laptop',w:1440,h:900,touch:false,games:'all'},
 {name:'phone',w:390,h:844,touch:true,games:'all'},
 {name:'fold-folded',w:344,h:882,touch:true,games:'all'},
 {name:'fold-open',w:884,h:1104,touch:true,games:'some'},
 {name:'fold-sideways',w:882,h:344,touch:true,games:'some'},
 {name:'ipad',w:820,h:1180,touch:true,games:'some'},
 {name:'stuart-1908',w:1908,h:950,touch:false,games:'some'},
 {name:'qhd',w:2560,h:1440,touch:false,games:'none'},
 {name:'4k',w:3840,h:2160,touch:false,games:'some'},
].filter(d=>!QUICK||['laptop','phone','fold-folded'].includes(d.name));

let pass=0,fail=0;const fails=[];
const ok=(c,name,detail='')=>{if(c){pass++;}else{fail++;fails.push(`${name}${detail?' — '+detail:''}`);console.log(`  ✗ ${name}${detail?' — '+detail:''}`);}};

async function newPage(browser,d){const ctx=await browser.newContext({viewport:{width:d.w,height:d.h},hasTouch:d.touch,isMobile:d.touch,deviceScaleFactor:1});const page=await ctx.newPage();
 const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/favicon|fonts\.g/.test(m.text()))errs.push(m.text());});
 page.on('requestfailed',r=>{if(!/fonts\.(googleapis|gstatic)/.test(r.url()))errs.push('request failed: '+r.url());});
 return{ctx,page,errs};}
const overflow=page=>page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth);

async function checkHome(browser,base,d,E,O){const {ctx,page,errs}=await newPage(browser,d);const tag=`home @${d.name}`;
 await page.goto(base,{waitUntil:'load'});await page.waitForSelector('.tile',{timeout:8000}).catch(()=>{});
 const tiles=await page.$$eval('.tile',t=>t.length);const want=new Set([...E.games.map(g=>g.id),...O.games.map(g=>g.id)]).size;
 ok(tiles===want,`${tag}: one tile per game`,`${tiles} tiles, ${want} games`);
 ok(await overflow(page)<=1,`${tag}: not wider than the screen`,`${await overflow(page)}px too wide`);
 if(d.name==='laptop'){const hrefs=await page.$$eval('.tile a',a=>a.map(x=>x.href));
  for(const h of hrefs){const r=await page.request.get(h.split('?')[0]);ok(r.ok(),`${tag}: link works ${h.replace(base,'')}`,String(r.status()));}}
 ok(!errs.length,`${tag}: no errors`,errs.join(' | '));await ctx.close();
 const ev=await newPage(browser,d);await ev.page.goto(base+'evolution.html',{waitUntil:'load'});await ev.page.waitForSelector('.run',{timeout:8000}).catch(()=>{});
 ok(await ev.page.$$eval('.run',r=>r.length)>=1,`evolution @${d.name}: shows the runs`);
 ok(await overflow(ev.page)<=1,`evolution @${d.name}: not wider than the screen`,`${await overflow(ev.page)}px too wide`);
 ok(!ev.errs.length,`evolution @${d.name}: no errors`,ev.errs.join(' | '));await ev.ctx.close();}

async function checkGame(browser,base,d,side,g){const {ctx,page,errs}=await newPage(browser,d);const tag=`${side}/${g.id} @${d.name}`;
 try{
  const r=await page.goto(base+`${side}/`+g.play,{waitUntil:'load'});ok(r&&r.ok(),`${tag}: page opens`,String(r&&r.status()));
  const ready=await page.waitForFunction(()=>window.ARCADE&&window.ARCADE.ready,null,{timeout:10000}).then(()=>true,()=>false);
  ok(ready,`${tag}: game says it is ready (window.ARCADE.ready)`);if(!ready){await ctx.close();return;}
  // the game area: the biggest canvas (or the stage) must be on screen and a decent size
  const box=await page.evaluate(()=>{const els=[...document.querySelectorAll('canvas')].map(c=>c.getBoundingClientRect()).sort((a,b)=>b.width*b.height-a.width*a.height);const r=els[0];return r?{x:r.x,y:r.y,w:r.width,h:r.height,W:innerWidth,H:innerHeight}:null;});
  ok(!!box,`${tag}: has a game area`);
  if(box){ok(box.x>=-1&&box.y>=-1&&box.x+box.w<=box.W+1&&box.y+box.h<=box.H+1,`${tag}: game fully on screen`,JSON.stringify(box));
   ok(box.w*box.h>=box.W*box.H*.15,`${tag}: game is big enough`,`${Math.round(box.w)}×${Math.round(box.h)} on ${box.W}×${box.H}`);}
  // start it: a tap with a small wobble on touch screens, Space on keyboards
  const cx=box?box.x+box.w/2:d.w/2,cy=box?box.y+box.h/2:d.h/2;
  if(d.touch){await page.touchscreen.tap(cx,cy);await page.waitForTimeout(60);await page.touchscreen.tap(cx+4,cy+3);}
  else{await page.keyboard.press('Space');await page.waitForTimeout(80);await page.keyboard.press('Enter');}
  await page.waitForTimeout(300);
  const st0=await page.evaluate(()=>window.ARCADE.state?window.ARCADE.state():{});
  ok(!st0.intro,`${tag}: starts from a ${d.touch?'tap':'key press'}`,JSON.stringify(st0));
  // play for a bit with a mix of controls
  const keys=['ArrowLeft','ArrowRight','ArrowUp','Space','ArrowDown'];
  for(let i=0;i<10;i++){const k=keys[i%keys.length];await page.keyboard.down(k);await page.waitForTimeout(150);await page.keyboard.up(k);}
  if(d.touch){const pads=await page.$$('.pad button');for(const b of pads.slice(0,4)){const bb=await b.boundingBox();if(bb)await page.touchscreen.tap(bb.x+bb.width/2+3,bb.y+bb.height/2-2);}}
  const a=await page.screenshot({type:'jpeg',quality:70}),b2=await page.waitForTimeout(350).then(()=>page.screenshot({type:'jpeg',quality:70}));
  ok(!a.equals(b2),`${tag}: picture is moving`);
  ok(a.length>Math.min(9000,d.w*d.h/60),`${tag}: picture isn't blank`,`${a.length} bytes`);
  ok(await overflow(page)<=1,`${tag}: not wider than the screen`,`${await overflow(page)}px too wide`);
  ok(!errs.length,`${tag}: no errors`,errs.slice(0,3).join(' | '));
 }catch(e){ok(false,`${tag}: ran without crashing`,e.message.split('\n')[0]);}
 await ctx.close();}

(async()=>{const t0=Date.now();let server=null,base=URL0;
 if(!base){server=await serve(0);base=`http://127.0.0.1:${server.address().port}/`;}if(!base.endsWith('/'))base+='/';
 const read=p=>URL0?fetch(base+p).then(r=>r.json()):Promise.resolve(JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')));
 const O=await read('original/games.json'),E=await read('enhanced/games.json');
 // the game lists themselves
 for(const [nm,L] of [['original',O],['enhanced',E]]){ok(Array.isArray(L.games)&&L.games.length>0,`${nm}/games.json lists games`);
  const ids=L.games.map(g=>g.id);ok(new Set(ids).size===ids.length,`${nm}/games.json: ids are unique`);
  for(const g of L.games){ok(/^[a-z0-9-]+$/.test(g.id)&&g.name&&g.icon&&g.desc&&g.play,`${nm}/games.json: ${g.id} has id, name, icon, desc and play`);
   if(!URL0){const f=path.join(ROOT,nm,String(g.play).split('?')[0]);ok(fs.existsSync(f),`${nm}/${g.id}: play page exists`,g.play);}}}
 const log=await read('data/changes.json');ok(Array.isArray(log.runs)&&log.runs.some(r=>r.run===0),'data/changes.json has the starting line (run 0)');
 const browser=await chromium.launch();
 for(const d of DEVICES){console.log(`• ${d.name} (${d.w}×${d.h}${d.touch?', touch':''})`);
  await checkHome(browser,base,d,E,O);
  if(d.games==='none')continue;
  for(const [side,L] of [['original',O],['enhanced',E]]){if(SIDE!=='both'&&SIDE!==side)continue;
   let list=L.games.filter(g=>!ONLY||ONLY.includes(g.id));
   if(d.games==='some'&&!ONLY)list=side==='enhanced'?list:list.filter((g,i)=>i%4===DEVICES.indexOf(d)%4);
   for(const g of list)await checkGame(browser,base,d,side,g);}}
 await browser.close();if(server)server.close();
 console.log(`\n${fail?'❌':'✅'} ${pass} passed, ${fail} failed (${Math.round((Date.now()-t0)/1000)}s)`);
 if(fail){console.log('\nFailures:\n'+fails.map(f=>' - '+f).join('\n'));}
 const out=path.join(__dirname,'out');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'last-run.txt'),`${pass} passed, ${fail} failed\n${fails.join('\n')}\n`);
 process.exit(fail?1:0);})();
