// Takes a picture of each game a couple of seconds into play, for the evolution log.
//   node tools/shots.js --dir=enhanced --games=maze,snake --out=media/runs/003
// Prints {"maze":"media/runs/003/maze.jpg", ...} as JSON. Pictures are 480 px wide JPEGs (small files).
const {chromium}=require('playwright');
const {serve}=require('../tests/serve.js');
const fs=require('fs'),path=require('path');
const arg=(k,d)=>{const a=process.argv.find(x=>x.startsWith(`--${k}=`));return a?a.split('=').slice(1).join('='):d;};
const ROOT=path.resolve(__dirname,'..'),DIR=arg('dir','enhanced'),OUT=arg('out','tests/out/shots'),ONLY=arg('games','')?arg('games').split(',').filter(Boolean):null;
(async()=>{const L=JSON.parse(fs.readFileSync(path.join(ROOT,DIR,'games.json'),'utf8'));
 const server=await serve(0),base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch(),res={};
 fs.mkdirSync(path.join(ROOT,OUT),{recursive:true});
 for(const g of L.games.filter(g=>!ONLY||ONLY.includes(g.id))){
  const ctx=await browser.newContext({viewport:{width:900,height:1000},deviceScaleFactor:1}),page=await ctx.newPage();
  try{await page.goto(base+`${DIR}/`+g.play,{waitUntil:'load'});await page.waitForFunction(()=>window.ARCADE&&window.ARCADE.ready,null,{timeout:10000});
   await page.keyboard.press('Space');await page.waitForTimeout(200);
   for(const k of ['ArrowRight','ArrowUp','ArrowLeft','Space']){await page.keyboard.down(k);await page.waitForTimeout(350);await page.keyboard.up(k);}
   await page.waitForTimeout(500);
   const el=await page.evaluateHandle(()=>[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0]||document.body);
   const buf=await el.asElement().screenshot({type:'jpeg',quality:78});
   const rel=path.posix.join(OUT,`${g.id}.jpg`);fs.writeFileSync(path.join(ROOT,rel),buf);res[g.id]=rel;
  }catch(e){console.error(`No picture for ${g.id}: ${e.message.split('\n')[0]}`);}
  await ctx.close();}
 await browser.close();server.close();console.log(JSON.stringify(res));})();
