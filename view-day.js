/* view-day.js: the Log tab (daily check-ins, groups, sessions, deadlines, skip). */
const valText=(h,d)=>{if(h.type==="group")return isDone(h,d)?"✓":"";const v=dayVal(h,d);if(!v)return"";if(h.type==="yes")return hasSlots(h)?v+"/"+h.slots.length:"✓";if(h.type==="num")return String(r1(v));return v};
const typeLabel=h=>{
  if(h.type==="group"){const n=kids(h).length;return "Group of "+n+(n===1?" habit":" habits")}
  const S=hasSlots(h)?" · "+h.slots.length+" times a day":"";
  return (h.type==="num"?"Number"+(h.target?", goal "+h.target+" "+esc(h.unit||""):h.unit?" ("+esc(h.unit)+")":""):h.type==="time"?"Time of day"+(h.target?", by "+h.target:""):"Yes or no")+S};
const ic=h=>h.icon?'<span class="ic">'+esc(h.icon)+"</span> ":"";
const ci=c=>c.icon?'<span class="ic">'+esc(c.icon)+"</span> ":"";
const streakText=(h,d)=>isWeekly(h)?weekDone(h,d)+" of "+(freq(h).n||1)+" this week · "+streak(h)+"-week streak":streak(h)+"-day streak";
function slotCells(h,d,fut){
  const v=h.done[d]||{};
  return '<div class="slots">'+h.slots.map(s=>{
    const p=periodOf(s.by),lab=esc(s.name)+(p?"<em>by "+p.to+"</em>":""),at='data-id="'+h.id+'" data-d="'+d+'" data-slot="'+s.id+'"',al=esc(h.name)+" "+esc(s.name);
    const c=h.type==="num"?'<input type="number" min="0" step="any" inputmode="decimal" '+at+' value="'+(v[s.id]||"")+'" placeholder="0" '+(fut?"disabled":"")+' aria-label="'+al+'">':'<button class="chk slot" '+at+' aria-pressed="'+!!v[s.id]+'" '+(fut?"disabled":"")+' aria-label="'+al+'">'+(v[s.id]?"✓":"")+"</button>";
    return '<div class="slot"><span>'+lab+"</span>"+c+"</div>"}).join("")+"</div>"}
function row(h,d){
  const fut=d>TODAY(),sk=skipped(h,d),dis=fut?"disabled":"",id='data-id="'+h.id+'" data-d="'+d+'"',v=h.done[d],note=h.notes[d]||"",open=noteOpen[h.id],S=hasSlots(h),m=[streakText(h,d)],tm=tmValue(h);
  let ctl;
  if(sk)ctl='<div class="skipbox">Skip</div>';
  else if(S)ctl='<div class="gbadge'+(isDone(h,d)?" ok":"")+'">'+(isDone(h,d)?"✓":r1(dayVal(h,d)))+"</div>";
  else if(tm)ctl='<div class="numin'+(isDone(h,d)?" ok":"")+'"><div class="tval">'+r1(dayVal(h,d)||0)+'</div><span>'+esc(h.unit||"")+(h.target?" / "+h.target:"")+"</span></div>";
  else if(h.type==="num")ctl='<label class="numin'+(isDone(h,d)?" ok":"")+'"><input type="number" min="0" step="any" inputmode="decimal" '+id+' value="'+(v||"")+'" placeholder="0" '+dis+' aria-label="'+esc(h.name)+' amount"><span>'+esc(h.unit||"")+(h.target?" / "+h.target:"")+"</span></label>";
  else if(h.type==="time")ctl='<label class="numin wide'+(isDone(h,d)?" ok":"")+'"><input type="time" '+id+' value="'+(v||"")+'" '+dis+' aria-label="'+esc(h.name)+' time"><span>'+(h.target?"by "+h.target:"time")+"</span></label>";
  else ctl='<button class="chk" '+id+' aria-pressed="'+!!v+'" '+dis+' aria-label="Mark '+esc(h.name)+' done">'+(v?"✓":"")+"</button>";
  if(S)m.push(h.type==="num"?r1(dayVal(h,d))+(h.target?" of "+h.target:"")+" "+esc(h.unit||""):dayVal(h,d)+" of "+(h.need||h.slots.length)+" done");
  else if(h.by&&periodOf(h.by))m.push("by "+periodOf(h.by).name.toLowerCase());
  if(h.type==="time"&&v&&h.target){const df=tmin(v)-tmin(h.target);m.push(df>0?hmFmt(df)+" late":"on time")}
  const runOn=!!settings.run&&settings.run.id===h.id,tb=h.timer&&!S&&!sk&&d===TODAY()?'<button class="tbtn'+(runOn?" on":"")+'" data-ttoggle="'+h.id+'" aria-label="'+(runOn?"Pause timer for ":"Start timer for ")+esc(h.name)+'">'+(runOn?"⏸":"▶")+"</button>":"";
  if(h.timer&&!tm&&entMins(h,d)>0)m.push("⏱ "+hmFmt(entMins(h,d)));
  if(sk)m.push("skipped");
  if(note&&!open)m.push(esc(note));
  const pnl='<div class="pnl">'+(h.desc?'<p class="desc">'+esc(h.desc)+"</p>":"")+'<input class="nt" data-note '+id+' value="'+esc(note)+'" maxlength="200" placeholder="Note for this day" aria-label="Note for '+esc(h.name)+'">'+(h.type==="time"&&settings.rollover>0?'<p class="hint">Times before '+tstr(settings.rollover*60)+" count as late night of this day.</p>":"")+(!isWeekly(h)&&!fut?'<button class="link" data-skip="'+h.id+'" data-d="'+d+'">'+(sk?"Undo skip":"Skip this day (not counted for or against you)")+"</button>":"")+(h.timer&&!S?timeLog(h,d):"")+"</div>";
  return '<section class="habit sm'+(sk?" skipd":"")+'" style="--c:'+h.color+'"><div class="top">'+ctl+'<div class="grow"><div class="name">'+ic(h)+esc(h.name)+'</div><div class="meta">'+m.join(" · ")+'</div></div>'+tb+'<button class="link" data-nt="'+h.id+'">'+(open?"Close":"More")+"</button></div>"+(S&&!sk?slotCells(h,d,fut):"")+(open?pnl:"")+"</section>"}
function groupCard(g,d,K,V){
  const col=settings.collapsed["g"+g.id],n=K.filter(k=>isDone(k,d)).length,ok=isDone(g,d);
  return '<section class="habit sm group" style="--c:'+g.color+'"><div class="top"><div class="gbadge'+(ok?" ok":"")+'">'+(ok?"✓":n+"/"+K.length)+'</div><div class="grow"><div class="name">'+ic(g)+esc(g.name)+'</div><div class="meta">'+streakText(g,d)+" · "+n+" of "+K.length+' done</div></div><button class="link" data-gc="'+g.id+'">'+(col?"Show":"Hide")+"</button></div>"+(col?"":'<div class="kids">'+V.map(k=>row(k,d)).join("")+"</div>")+"</section>"}
function behindHtml(){
  if(sel!==TODAY())return"";const b=behindList();
  return b.length?'<div class="behind">⏰ <b>Behind schedule:</b> '+b.map(x=>ic(x.h)+esc(x.h.name)+(x.slot?" ("+esc(x.slot.name)+")":"")+", due by "+x.p.to).join(" · ")+"</div>":""}
function cycleHtml(){
  if(sel!==TODAY())return"";const t=TODAY();
  return act().filter(h=>h.type!=="group"&&t>cycleEnd(h)&&t<=addDays(cycleEnd(h),7)).map(h=>'<div class="cyc">🎉 <b>'+esc(h.name)+"</b> finished its "+WINDOW*(h.cycles||1)+'-day cycle. <button class="link" data-extend="'+h.id+'">Add 66 more days</button></div>').join("")}
function dayView(){
  const t=TODAY(),A=act(),bd=bounds(),label=sel===t?"Today":fmt(sel,{weekday:"long"});
  let h='<div class="nav"><button class="nb" data-nav="-1" '+(addDays(sel,-1)<bd.min?"disabled ":"")+'aria-label="Previous day">‹</button><b>'+label+"<br><small>"+fmt(sel,{day:"numeric",month:"long",year:"numeric"})+'</small></b><button class="nb" data-nav="1" '+(addDays(sel,1)>bd.max?"disabled ":"")+'aria-label="Next day">›</button></div>';
  h+='<div class="tools">'+(sel!==t?'<button class="nb" data-today>Back to today</button>':"")+'<button class="nb" data-hide aria-pressed="'+!!settings.hideDone+'">Hide done</button></div>';
  h+='<div id="behindbar">'+behindHtml()+"</div>"+cycleHtml();
  if(!A.length)return h+'<p class="empty">No habits yet. Add one in the Habits tab, or start from a template in Settings.</p>';
  const sch=x=>x.type==="group"?kids(x).some(sch):vis(x,sel)&&(isWeekly(x)||isDue(x,sel)||x.done[sel]||skipped(x,sel));
  const want=x=>showOff?vis(x,sel):sch(x),off=A.filter(x=>x.type!=="group"&&vis(x,sel)&&!sch(x)).length;
  h+=cats.map(c=>{
    const top=A.filter(x=>!x.parent&&x.cat===c.id&&want(x));if(!top.length)return"";
    const kOf=g=>kids(g).filter(want),leafs=top.flatMap(x=>x.type==="group"?kOf(x):[x]),col=settings.collapsed[c.id];
    const body=top.map(x=>{
      if(x.type==="group"){const K=kOf(x),V=settings.hideDone?K.filter(k=>!isDone(k,sel)):K;return V.length||!settings.hideDone?groupCard(x,sel,K,V):""}
      return settings.hideDone&&isDone(x,sel)?"":row(x,sel)}).join("");
    return '<button class="cat" data-cc="'+c.id+'" aria-expanded="'+!col+'"><i style="background:'+c.color+'"></i>'+ci(c)+esc(c.name)+"<small>"+leafs.filter(x=>isDone(x,sel)).length+" of "+leafs.length+" "+(col?"▸":"▾")+"</small></button>"+(col?"":body||'<p class="empty" style="margin:0 0 8px">All done.</p>')}).join("");
  return h+(off||showOff?'<p class="legend">'+off+" habit"+(off===1?"":"s")+' not scheduled for this day. <button class="link" data-showoff>'+(showOff?"Hide them":"Show them")+"</button></p>":"")}
function timeLog(h,d){
  const es=(h.ent&&h.ent[d])||[],tot=entMins(h,d),at='data-id="'+h.id+'" data-d="'+d+'"';
  return '<div class="tlog"><div class="mh"><b>Time log</b><span class="meta">'+(tot?hmFmt(tot)+" in "+es.length+(es.length===1?" entry":" entries"):"No entries yet")+"</span></div>"
   +es.map((e,i)=>e.c?'<div class="erow merged"><span class="meta">Earlier entries merged into one total</span><b>'+hmFmt(e.d/60)+"</b></div>":'<div class="erow"><input type="time" '+at+' data-ei="'+i+'" data-ef="t" value="'+(e.t||"")+'" aria-label="Start time"><input type="number" min="0.5" step="any" inputmode="decimal" '+at+' data-ei="'+i+'" data-ef="m" value="'+r1(e.d/60)+'" aria-label="Minutes"><span class="meta">min'+(e.man?" · added":"")+'</span><button class="link" '+at+' data-edel="'+i+'">Delete</button></div>').join("")
   +(d<=TODAY()?'<div class="erow add"><input type="time" data-eat="'+h.id+'" aria-label="Start time (optional)"><input type="number" min="1" step="any" inputmode="decimal" data-eam="'+h.id+'" placeholder="minutes" aria-label="Minutes to add"><button class="btn" data-eadd="'+h.id+'" data-d="'+d+'">Add time</button></div><p class="hint">Forgot to press start or pause? Add the minutes here. A start time is optional and is used for the time-of-day report.</p>':"")+"</div>"}
function runHtml(){
  const h=runH();if(!h)return"";
  return '<div class="runbar">⏱ <b>'+ic(h)+esc(h.name)+'</b> <span id="runel">'+fmtClock((Date.now()-settings.run.at)/1000)+'</span><button class="nb" data-tstop>Pause</button></div>'}
