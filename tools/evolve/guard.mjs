// Step 3 of the weekly evolve run: check the AI kept to the rules before anything can go live.
//   node tools/evolve/guard.mjs <base-commit>
// Fails (exit 1) with a plain list of problems. Checks: only allowed paths changed, the report is
// valid, the game list is valid, every play page exists, nothing links outside enhanced/, sizes are sane.
import fs from 'node:fs';import path from 'node:path';import {execSync} from 'node:child_process';
const base=process.argv[2];if(!base)throw new Error('usage: guard.mjs <base-commit>');
const sh=c=>execSync(c,{encoding:'utf8'}).trim();
const problems=[];const bad=m=>problems.push(m);
// 1. what changed (committed by the agent or not, tracked or new)
const changed=[...new Set([...sh(`git diff --name-only ${base}`).split('\n'),...sh('git ls-files --others --exclude-standard').split('\n')].filter(Boolean))];
const ALLOWED=[/^enhanced\//,/^ai\/JOURNAL\.md$/,/^ai\/RUN-REPORT\.json$/];
for(const f of changed)if(!ALLOWED.some(r=>r.test(f)))bad(`Changed a file it may not touch: ${f}`);
if(!changed.some(f=>f.startsWith('enhanced/')))bad('Nothing in enhanced/ changed, so there is nothing to publish.');
// 2. the report
let rep=null;
try{rep=JSON.parse(fs.readFileSync('ai/RUN-REPORT.json','utf8'));}catch(e){bad(`ai/RUN-REPORT.json is missing or not valid JSON (${e.message})`);}
// 3. the game list
let enh=null;try{enh=JSON.parse(fs.readFileSync('enhanced/games.json','utf8'));}catch(e){bad(`enhanced/games.json is not valid JSON (${e.message})`);}
const ids=new Set();
if(enh){if(!Array.isArray(enh.games)||!enh.games.length)bad('enhanced/games.json lists no games');
 for(const g of enh.games||[]){if(!/^[a-z0-9-]+$/.test(g.id||''))bad(`Bad game id: ${JSON.stringify(g.id)}`);if(ids.has(g.id))bad(`Duplicate game id: ${g.id}`);ids.add(g.id);
  for(const k of ['name','icon','desc','play','origin'])if(!g[k])bad(`${g.id}: missing "${k}" in enhanced/games.json`);
  if(g.inspired_by!==undefined&&!(Array.isArray(g.inspired_by)&&g.inspired_by.every(x=>typeof x==='string'&&x.length<60)))bad(`${g.id}: "inspired_by" must be a list of short names`);
  if(g.origin==='ai'&&!/^\d{4}-\d{2}-\d{2}$/.test(g.born||''))bad(`${g.id}: an AI-made game needs "born": "YYYY-MM-DD"`);
  const f=path.join('enhanced',String(g.play||'').split(/[?#]/)[0]);if(!g.play||!fs.existsSync(f))bad(`${g.id}: play page ${g.play} doesn't exist`);
  if(/^(\/|\.\.|[a-z]+:)/i.test(g.play||''))bad(`${g.id}: play must be a page inside enhanced/`);}}
// 4. the report must match what happened
if(rep){for(const k of ['title','summary','kind','tested'])if(!rep[k]||typeof rep[k]!=='string')bad(`ai/RUN-REPORT.json needs "${k}"`);
 if(!['enhance','new-game','mixed'].includes(rep.kind))bad(`ai/RUN-REPORT.json "kind" must be enhance, new-game or mixed (got ${rep.kind})`);
 if(!Array.isArray(rep.changes)||!rep.changes.length)bad('ai/RUN-REPORT.json needs at least one entry in "changes"');
 const retired=new Set(rep.retired_games||[]);
 for(const c of rep.changes||[]){if(!(c.game==='all'||ids.has(c.game)||retired.has(c.game)))bad(`Report mentions a game that isn't in enhanced/games.json: ${c.game}`);
  if(!c.what||(Array.isArray(c.what)&&!c.what.length))bad(`Report: say what changed in ${c.game}`);if(!c.why)bad(`Report: say why for ${c.game}`);}
 for(const id of rep.new_games||[])if(!ids.has(id))bad(`New game ${id} isn't in enhanced/games.json`);
 // games that disappeared must be declared as retired
 const before=JSON.parse(sh(`git show ${base}:enhanced/games.json`)).games.map(g=>g.id);
 for(const id of before)if(!ids.has(id)&&!retired.has(id))bad(`Game ${id} vanished from enhanced/games.json without being listed in "retired_games"`);
 for(const id of ids)if(!before.includes(id)&&!(rep.new_games||[]).includes(id))bad(`Game ${id} is new but not listed in "new_games"`);}
// 5. self-contained: no links outside enhanced/ and no remote resources
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let total=0;
for(const f of walk('enhanced')){const st=fs.statSync(f);total+=st.size;if(st.size>8*1024*1024)bad(`${f} is over 8 MB`);
 if(/\.(html|js|css|json)$/.test(f)){const s=fs.readFileSync(f,'utf8');
  if(/\.(html|css)$/.test(f)&&/(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(s.replace(/<a\s[^>]*>/gi,'')))bad(`${f} loads something from another website (everything must live in enhanced/)`);
  if(/\.html$/.test(f)&&/<(?:script|link|img|audio|source)[^>]+(?:src|href)\s*=\s*["']\.\.\//i.test(s))bad(`${f} loads a file from outside enhanced/`);
  if(/\.css$/.test(f)&&/url\(\s*["']?(?:https?:|\/\/|\.\.\/)/i.test(s))bad(`${f} uses a file from outside enhanced/`);
  if(/\.js$/.test(f)&&/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|importScripts)\b[^;\n]{0,80}(?:https?:)?\/\//.test(s))bad(`${f} seems to call another website`);}}
if(total>20*1024*1024)bad(`enhanced/ is ${(total/1048576).toFixed(1)} MB (limit 20 MB)`);
if(problems.length){console.log('The run broke these rules:\n'+problems.map(p=>' - '+p).join('\n'));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### ❌ Rule check failed\n'+problems.map(p=>'- '+p).join('\n')+'\n');process.exit(1);}
console.log(`Rule check passed: ${changed.length} files changed, ${ids.size} games, ${(total/1048576).toFixed(2)} MB in enhanced/.`);
