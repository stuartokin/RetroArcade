// Step 1 of the weekly evolve run: work out the run number and write the AI's prompt.
//   node tools/evolve/prepare.mjs <prompt-file>
// Reads EVENT, FOCUS (ai-decides | one-game | all-games | new-game), GAME, NOTE, MAX_TURNS and BUDGET from the environment.
// A scheduled run in the first 7 days of the month is a new-game run. Blank budget/steps: 10/150, or 15/250 for a new game.
// Writes the prompt to <prompt-file> and RUN, RUN3 and DATE to $GITHUB_OUTPUT (or prints them).
import fs from 'node:fs';
const out=process.argv[2]||'run-prompt.md';
const log=JSON.parse(fs.readFileSync('data/changes.json','utf8'));
const enh=JSON.parse(fs.readFileSync('enhanced/games.json','utf8'));
const runs=log.runs||[];
const run=Math.max(0,...runs.map(r=>r.run))+1,run3=String(run).padStart(3,'0'),date=new Date().toISOString().slice(0,10);
// the scheduled run on the first Sunday of each month makes a new game; other Sundays the AI decides
const EVENT=process.env.EVENT||'';
const FOCUS=EVENT==='schedule'?(new Date().getUTCDate()<=7?'new-game':'ai-decides'):(process.env.FOCUS||'ai-decides').trim(),NOTE=(process.env.NOTE||'').trim();
// a whole game is more work than a tweak: new-game runs get more steps and budget unless set by hand
const NEW=FOCUS==='new-game',num=(v,d)=>{const n=parseFloat(String(v||'').trim());return n>0?String(n):d;};
const turns=num(process.env.MAX_TURNS,NEW?'250':'150'),budget=num(process.env.BUDGET,NEW?'15':'10');
const ok=runs.filter(r=>r.kind!=='baseline'&&r.status!=='failed');
const lastNew=[...ok].reverse().find(r=>(r.new_games||[]).length);
const sinceNew=lastNew?ok.filter(r=>r.run>lastNew.run).length:ok.length;
const ids=enh.games.map(g=>g.id);
// the game box takes the id ("guardian") or the name ("Planet Guardian", any case, or a clear part of it)
const want=(process.env.GAME||'').trim(),norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
let GAME='';
if(want){const w=norm(want),by=f=>enh.games.filter(f).map(g=>g.id);
  const hits=[by(g=>norm(g.id)===w||norm(g.name)===w),by(g=>norm(g.name).split(' ').includes(w)),by(g=>norm(g.name).includes(w)||norm(g.id).includes(w))].find(h=>h.length===1);
  if(!hits){const msg=`No single game matches "${want}". Type one of: ${enh.games.map(g=>`${g.id} (${g.name})`).join(', ')}`;
    if(process.env.GITHUB_ACTIONS)console.log(`::error title=Which game?::${msg}`);throw new Error(msg);}
  GAME=hits[0];
}
let task;
if(FOCUS==='one-game'){
  task=GAME?`Stuart asked you to focus this run on one game: **${enh.games.find(g=>g.id===GAME).name}** (\`${GAME}\`). Spend the run on it.`:'Stuart asked you to focus this run on one game of your choice. Pick it and say why.';
}else if(FOCUS==='all-games')task='Stuart asked you to work across **all** the games this run. Something for every game, or a change that lifts them all, such as the shared player shell, sound, look or controls.';
else if(FOCUS==='new-game')task=`${EVENT==='schedule'?'This is the monthly new-game run:':'Stuart asked you to'} **create a new game** this run. Start with 2 or 3 one-line ideas in your journal, pick one and say why, then build it. Make it original, finished and fun, and different in kind from the games already here. Add it to \`enhanced/games.json\` with \`"origin": "ai"\` and \`"born": "${date}"\`, and list your ideas in the report's \`"ideas"\`. Don't retire any game.`;
else{task='Your choice. Decide where to spend this run: one game, a few, all of them, or a new game.';
  if(sinceNew>=4)task+=` It has been ${sinceNew} runs since a new game was added; consider creating one this time (your call).`;}
const prompt=`${fs.readFileSync('ai/BRIEF.md','utf8')}

---

## This run

- **Run number:** ${run} (date ${date})
- **Task:** ${task}
${NOTE?`- **Note from Stuart:** ${NOTE.replace(/\n+/g,' ')}\n`:''}- **Games now in enhanced/:** ${ids.join(', ')}
- **Runs so far:** ${ok.length} (runs since the last new game: ${sinceNew})
${turns?`- **Step limit:** about ${turns} steps. Leave room at the end to test, back out anything unfinished, and write the report and journal.\n`:''}${budget?`- **Budget:** about $${budget} of API time. The run stops when it's used up, so keep the games working at every stage.\n`:''}
Begin by reading \`ai/JOURNAL.md\`. Finish with \`ai/RUN-REPORT.json\` and a new journal entry headed \`## Run ${run} — ${date}\`.
`;
fs.writeFileSync(out,prompt);
// leave no stale report from an earlier run
try{fs.unlinkSync('ai/RUN-REPORT.json');}catch(e){}
const kv=`RUN=${run}\nRUN3=${run3}\nDATE=${date}\nSINCE_NEW=${sinceNew}\nGAME=${GAME}\nFOCUS=${FOCUS}\nBUDGET=${budget}\nMAX_TURNS=${turns}\n`;  // GAME: the matched id; FOCUS/BUDGET/MAX_TURNS as decided above
if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,kv);else process.stdout.write(kv);
console.error(`Run ${run} prepared (${FOCUS}${GAME?' '+GAME:''}, up to ${turns} steps and $${budget}); prompt in ${out}`);
