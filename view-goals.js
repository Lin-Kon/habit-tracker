/* view-goals.js: the Goals tab. Goal > objective > habit. A habit links to an objective with h.obj (set in its edit panel). Stored in settings.goals:
   goal = {id,name,desc,due,status:"active"|"paused"|"done",created,obj:[{id,name,mode:"time"|"days"|"num"|"check",target,unit,cur,done,due,created}]}. */
let gOpen=null,gNew=false,gObjNew=null,gArm=null;
const gl=()=>settings.goals||(settings.goals=[]);
const gid=()=>Date.now().toString(36)+Math.floor(Math.random()*999);
const objLinked=o=>habits.filter(h=>h.obj===o.id);
const findObj=id=>{for(const g of gl()){const o=g.obj.find(x=>x.id===id);if(o)return{g,o}}return null};
const dueText=d=>{if(!d)return"";const n=dayDiff(TODAY(),d);return n<0?"overdue by "+(-n)+(n===-1?" day":" days"):n===0?"due today":"due in "+n+(n===1?" day":" days")};
function objProg(o){
  const L=objLinked(o),t0=o.created||TODAY(),today=TODAY();let v=0;
  if(o.mode==="time"){if(t0<=today)L.forEach(h=>span(t0,today).forEach(d=>{v+=minsOf(h,d)}));v=r1(v/60)}
  else if(o.mode==="days")L.forEach(h=>{v+=doneKeys(h).filter(d=>d>=t0).length});
  else if(o.mode==="num")v=o.cur||0;
  else v=o.done?1:0;
  const t=o.mode==="check"?1:(o.target||0);
  return{v,t,p:t?Math.min(100,pct(v,t)):0}}
const objText=(o,p)=>o.mode==="check"?(o.done?"Done":"Not done yet"):p.v+" of "+p.t+(o.mode==="time"?" h":o.mode==="days"?" check-ins":o.unit?" "+esc(o.unit):"");
const goalProg=g=>g.status==="done"?100:g.obj.length?Math.round(g.obj.reduce((a,o)=>a+objProg(o).p,0)/g.obj.length):0;
const ringHtml=(p,c)=>'<div class="ring" style="--p:'+p+";--c:"+c+'"><b>'+p+"%</b></div>";
const goalForm=()=>'<div class="edit" style="--c:var(--moss)"><input id="xg-name" maxlength="80" placeholder="Goal, e.g. Pass the BCS preliminary" aria-label="Goal name"><textarea id="xg-desc" data-f2 rows="2" maxlength="300" placeholder="Why it matters (optional)" aria-label="Goal details"></textarea><label class="note" for="xg-due">Target date (optional)</label><input id="xg-due" type="date"><button class="add" data-xgsave>Add goal</button></div>';
const objForm=g=>'<div class="edit" style="--c:var(--moss)"><input id="xo-name" maxlength="80" placeholder="Objective, e.g. Finish the English grammar syllabus" aria-label="Objective name"><select id="xo-mode" aria-label="How to measure"><option value="time">Time from linked habits (hours)</option><option value="days">Check-ins from linked habits (days done)</option><option value="num">A number I update myself</option><option value="check">Simply done or not done</option></select><div class="cols"><div><label class="note">Target (hours, days or amount)</label><input id="xo-target" type="number" min="0" step="any" inputmode="decimal"></div><div><label class="note">Unit (own number only)</label><input id="xo-unit" maxlength="14" placeholder="e.g. mock tests"></div></div><label class="note" for="xo-due">Due date (optional)</label><input id="xo-due" type="date"><button class="add" data-xosave="'+g.id+'">Add objective</button></div>';
function objCard(o){
  const p=objProg(o),L=objLinked(o),auto=o.mode==="time"||o.mode==="days";
  return '<div class="obj"><div class="mh"><b>'+esc(o.name)+'</b><span class="meta">'+objText(o,p)+'</span></div><div class="meter" style="--c:var(--moss)"><i style="width:'+p.p+'%"></i></div>'
   +(o.mode==="num"?'<input type="number" min="0" step="any" inputmode="decimal" data-xcur="'+o.id+'" value="'+(o.cur||"")+'" placeholder="Progress so far" aria-label="Progress so far">':"")
   +(o.mode==="check"?'<button class="btn" data-xocheck="'+o.id+'">'+(o.done?"Undo done":"Mark done")+"</button>":"")
   +'<div class="meta">'+[auto?(L.length?"Linked: "+L.map(x=>esc(x.name)).join(", "):"No habits linked yet. Open a habit’s edit panel and choose this objective under “Supports objective”."):"",dueText(o.due)].filter(Boolean).join(" · ")+'</div><button class="link" data-xodel="'+o.id+'">'+(gArm==="o"+o.id?"Tap again to delete":"Delete objective")+"</button></div>"}
function goalCard(g,i){
  const p=goalProg(g),open=gOpen===g.id,col=PAL[i%PAL.length],st=g.status;
  let s='<section class="habit sm" style="--c:'+col+'"><div class="top">'+ringHtml(p,col)+'<div class="grow"><div class="name">'+esc(g.name)+'</div><div class="meta">'+[st==="done"?"Done":st==="paused"?"Paused":"",dueText(g.due),g.obj.length+(g.obj.length===1?" objective":" objectives")].filter(Boolean).join(" · ")+'</div></div><button class="link" data-xgopen="'+g.id+'">'+(open?"Close":"Open")+"</button></div>";
  if(open)s+='<div class="pnl">'+(g.desc?'<p class="desc">'+esc(g.desc)+"</p>":"")+(g.obj.length?g.obj.map(objCard).join(""):'<p class="meta">No objectives yet. Add one you can measure.</p>')+(gObjNew===g.id?objForm(g):'<button class="btn" data-xonew="'+g.id+'">+ Add objective</button>')
   +'<div class="row wrap"><button class="link" data-xg="'+g.id+'" data-xgstat="'+(st==="paused"?"active":"paused")+'">'+(st==="paused"?"Resume":"Pause")+'</button><button class="link" data-xg="'+g.id+'" data-xgstat="'+(st==="done"?"active":"done")+'">'+(st==="done"?"Reopen":"Mark goal done")+'</button><button class="link" data-xgdel="'+g.id+'">'+(gArm==="g"+g.id?"Tap again to delete":"Delete goal")+"</button></div></div>";
  return s+"</section>"}
function goalsView(){
  let h='<div class="nav"><b style="text-align:left;font-size:1.15rem">Your goals</b><button class="add" data-xgnew>'+(gNew?"Cancel":"+ New goal")+"</button></div>"+(gNew?goalForm():"");
  if(!gl().length)return h+(gNew?"":'<div class="gcard"><b>Start with one goal</b><p class="meta">A goal is the outcome you want, like “Pass the BCS preliminary”. Break it into objectives you can measure, then link your habits to them. Habits work fine without any of this.</p></div>');
  const rank={active:0,paused:1,done:2};
  return h+gl().map((g,i)=>({g,i})).sort((a,c)=>rank[a.g.status]-rank[c.g.status]).map(x=>goalCard(x.g,x.i)).join("")}
