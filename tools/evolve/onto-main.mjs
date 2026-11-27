// Publish step helper: if main moved on while the AI was working (e.g. Stuart or a human session pushed a fix),
// rebuild this run's single commit on top of the latest main, so the pull request can merge.
//   node tools/evolve/onto-main.mjs <base-sha> <run-commit> <new-main>
// Environment: RUN (the run number).
// Every file the run changed is taken from the run's commit, except the two shared files, which are merged:
//   data/changes.json  main's log, plus this run's entry
//   version.json       main's version, with this run's number and date
// Leaves the result staged and committed (with the run commit's message) on the current branch.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const [base,run,main]=process.argv.slice(2),RUN=+process.env.RUN;
if(!base||!run||!main||!RUN)throw new Error('usage: RUN=N node tools/evolve/onto-main.mjs <base> <run-commit> <new-main>');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64<<20});
const show=(rev,p)=>{try{return git('show',`${rev}:${p}`);}catch(e){return null;}};
const changed=git('diff','--name-only','--no-renames',base,run).split('\n').filter(Boolean);
const msg=git('log','-1','--format=%B',run);
git('reset','-q','--hard',main);
const SHARED=new Set(['data/changes.json','version.json']);
for(const f of changed){if(SHARED.has(f))continue;
  if(show(run,f)!==null)git('checkout',run,'--',f);else if(fs.existsSync(f))git('rm','-q','--',f);}
// the log: main's runs, with this run's entry added (or replaced, if main somehow has it)
const mine=JSON.parse(show(run,'data/changes.json')),entry=mine.runs.find(r=>r.run===RUN);
if(!entry)throw new Error(`Run ${RUN} has no entry in its own log`);
const log=JSON.parse(fs.readFileSync('data/changes.json','utf8'));
log.runs=log.runs.filter(r=>r.run!==RUN).concat(entry).sort((a,b)=>a.run-b.run);
fs.writeFileSync('data/changes.json',JSON.stringify(log,null,1)+'\n');
const v=JSON.parse(fs.readFileSync('version.json','utf8')),vr=JSON.parse(show(run,'version.json')||'{}');
v.run=vr.run??RUN;if(vr.date)v.date=vr.date;fs.writeFileSync('version.json',JSON.stringify(v)+'\n');
git('add','-A');git('commit','-q','-m',msg.trim());
console.log(`Run ${RUN} moved onto the latest main (${changed.length} files from the run).`);
