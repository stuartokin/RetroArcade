// Turns Claude Code's stream-json output into a readable log in the Actions run:
// what the AI says, and each tool it uses (file edits, commands), one line each.
import readline from 'node:readline';
const rl=readline.createInterface({input:process.stdin});
const short=(s,n=160)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s;};
rl.on('line',line=>{let m;try{m=JSON.parse(line);}catch(e){return;}
 if(m.type==='assistant'&&m.message&&Array.isArray(m.message.content)){for(const c of m.message.content){
  if(c.type==='text'&&c.text.trim())console.log('💬 '+short(c.text,400));
  else if(c.type==='tool_use'){const i=c.input||{};console.log(`🔧 ${c.name} ${short(i.command||i.file_path||i.pattern||i.description||JSON.stringify(i))}`);}}}
 else if(m.type==='result')console.log(`\n🏁 ${m.subtype} · ${m.num_turns} steps · $${(m.total_cost_usd||0).toFixed(2)} · ${Math.round((m.duration_ms||0)/60000)} min`);});
