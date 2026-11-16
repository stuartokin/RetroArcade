// Step 5 of the weekly evolve run (after the rule check and tests pass): record the run.
//   node tools/evolve/finalise.mjs            add the log entry, archive this week's games, take pictures
//   node tools/evolve/finalise.mjs --pr=URL   afterwards: add the pull request link to the entry
// Environment: RUN, RUN3, DATE, FOCUS, GAME, MODEL, ACTIONS_URL, RESULT_FILE (the AI's final result line, JSON).
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const E=process.env,LOG='data/changes.json';
const log=JSON.parse(fs.readFileSync(LOG,'utf8'));
const pr=(process.argv.find(a=>a.startsWith('--pr='))||'').slice(5);
if(pr){const e=log.runs.find(r=>r.run===+E.RUN);if(!e)throw new Error(`No log entry for run ${E.RUN}`);e.pr=pr;fs.writeFileSync(LOG,JSON.stringify(log,null,1)+'\n');console.log(`Run ${E.RUN}: pull request ${pr}`);process.exit(0);}

const run=+E.RUN,run3=E.RUN3,date=E.DATE;if(!run||!run3||!date)throw new Error('RUN, RUN3 and DATE are needed');
if(log.runs.some(r=>r.run===run))throw new Error(`Run ${run} is already in the log`);
const rep=JSON.parse(fs.readFileSync('ai/RUN-REPORT.json','utf8'));
let res={};try{res=JSON.parse(fs.readFileSync(E.RESULT_FILE||'','utf8'));}catch(e){}
// 1. stamp the AI's copy with the run number, and make phones fetch fresh files
const gj='enhanced/games.json',enh=JSON.parse(fs.readFileSync(gj,'utf8'));enh.run=run;fs.writeFileSync(gj,JSON.stringify(enh,null,1)+'\n');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const f of walk('enhanced').filter(f=>f.endsWith('.html'))){const s=fs.readFileSync(f,'utf8'),t=s.replace(/((?:src|href)\s*=\s*["'][^"'?#]+\.(?:js|css))(?:\?v=[\w.-]*)?(["'])/g,`$1?v=r${run}$2`);if(t!==s)fs.writeFileSync(f,t);}
// 2. keep a playable copy of this week's arcade
const arch=`archive/run-${run3}`;fs.rmSync(arch,{recursive:true,force:true});fs.cpSync('enhanced',arch,{recursive:true});
// 3. pictures of the games that changed
const touched=[...new Set([...(rep.changes||[]).map(c=>c.game),...(rep.new_games||[])])];
const ids=touched.includes('all')?enh.games.map(g=>g.id):touched.filter(id=>enh.games.some(g=>g.id===id));
let shots={};
if(ids.length){try{shots=JSON.parse(execFileSync('node',['tools/shots.js','--dir=enhanced',`--games=${ids.join(',')}`,`--out=media/runs/${run3}`],{encoding:'utf8',stdio:['ignore','pipe','inherit']}).trim().split('\n').pop());}catch(e){console.error('Pictures failed: '+e.message);}}
// 4. the log entry
const entry={run,date,kind:rep.kind,focus:E.FOCUS||'ai-decides',...(E.GAME?{focus_game:E.GAME}:{}),title:rep.title,summary:rep.summary,
 changes:(rep.changes||[]).map(c=>({game:c.game,what:Array.isArray(c.what)?c.what:[String(c.what)],why:c.why||''})),
 new_games:rep.new_games||[],retired_games:rep.retired_games||[],tested:rep.tested||'',next:rep.next||'',
 status:'live',archive:`${arch}/`,shots,
 cost_usd:typeof res.total_cost_usd==='number'?Math.round(res.total_cost_usd*100)/100:null,
 turns:res.num_turns||null,minutes:res.duration_ms?Math.round(res.duration_ms/60000):null,
 model:E.MODEL||null,actions:E.ACTIONS_URL||null,pr:null};
log.runs.push(entry);log.runs.sort((a,b)=>a.run-b.run);fs.writeFileSync(LOG,JSON.stringify(log,null,1)+'\n');
const ver=JSON.parse(fs.readFileSync('version.json','utf8'));ver.run=run;ver.date=date;fs.writeFileSync('version.json',JSON.stringify(ver)+'\n');
// 5. the pull request description
const md=`## 🤖 Run ${run} — ${rep.title}\n\n${rep.summary}\n\n${entry.changes.map(c=>`### ${c.game}\n${c.what.map(w=>`- ${w}`).join('\n')}\n\n**Why:** ${c.why}\n`).join('\n')}\n**Tested:** ${entry.tested}\n\n**Next:** ${entry.next}\n\n${entry.cost_usd!=null?`API cost $${entry.cost_usd.toFixed(2)} · `:''}${entry.turns?`${entry.turns} steps · `:''}${entry.minutes?`${entry.minutes} min`:''}\n\nThe rule check and the full test rig passed. Archived as \`${arch}/\`.\n`;
fs.writeFileSync(E.PR_BODY||'pr-body.md',md);
if(E.GITHUB_STEP_SUMMARY)fs.appendFileSync(E.GITHUB_STEP_SUMMARY,md);
console.log(`Run ${run} recorded: ${entry.changes.length} change(s), ${Object.keys(shots).length} picture(s), archived in ${arch}/`);
