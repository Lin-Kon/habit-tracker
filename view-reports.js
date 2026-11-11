/* view-reports.js: the Reports tab. Scope = combined, a category, a group or a single habit. Two collapsible sections: Summary and Details. */
function weekBars(list,color){
  const t=TODAY(),mon=addDays(t,-((parse(t).getDay()-settings.weekStart+7)%7));let bars="";
  for(let i=11;i>=0;i--){const ws=addDays(mon,-7*i),we=addDays(ws,6)>t?t:addDays(ws,6);let e=0,n=0;list.forEach(x=>{const s=stats(x,ws,we);e+=s.el;n+=s.dn});const p=pct(n,e);
    bars+='<div class="wk" title="Week of '+fmt(ws,{day:"numeric",month:"short"})+": "+p+'%"><i style="height:'+p+'%'+(color?";background:"+color:"")+'"></i>'+parse(ws).getDate()+"</div>"}
  return '<div class="chart">'+bars+"</div>"}
function dowBars(list,from,to){
  const e=Array(7).fill(0),n=Array(7).fill(0);
  list.filter(x=>!isWeekly(x)).forEach(x=>stats(x,from,to).due.forEach(d=>{const w=parse(d).getDay();e[w]++;if(isDone(x,d))n[w]++}));
  return '<div class="chart">'+wdOrder().map(w=>{const p=pct(n[w],e[w]);return '<div class="wk" title="'+WD[w]+": "+p+'%"><i style="height:'+p+'%"></i>'+WD[w]+"<br>"+p+"%</div>"}).join("")+"</div>"}
function scopeInfo(){
  const A=act();
  if(repScope.startsWith("c:")){const c=cats.find(x=>x.id===repScope.slice(2));if(c)return{L:A.filter(x=>x.cat===c.id&&x.type!=="group"),c}}
  const x=A.find(y=>y.id===repScope);
  if(x&&x.type==="group")return{L:kids(x),g:x};
  if(x)return{L:[x],one:x};
  repScope="all";return{L:A.filter(y=>y.type!=="group")}}
const hmFmt=m=>m>=60?r1(m/60)+" h":Math.round(m)+" min";
const grpTag=h=>{const g=h.parent&&habits.find(x=>x.id===h.parent);return g?' <span class="meta">· '+esc(g.name)+"</span>":""};
const mrow=(label,color,p,extra,scope)=>'<div class="habit sm" style="--c:'+color+'"><div class="mh"><div class="name">'+label+'</div><button class="link" data-scope="'+scope+'">Details</button></div><div class="meter"><i style="width:'+pct(p.dn,p.el)+'%"></i></div><div class="meta">'+pct(p.dn,p.el)+"% · "+p.dn+" of "+p.el+" days"+extra+"</div></div>";
function habitExtra(x,p){
  let s=" · "+freqLabel(x)+" · streak "+streak(x)+(isWeekly(x)?" wk":"")+" · best "+longest(x)+(isWeekly(x)?" wk":"");
  if(x.type==="num"){const tot=p.days.reduce((a,d)=>a+(dayVal(x,d)||0),0),n=p.days.filter(d=>dayVal(x,d)>0).length;s+="<br>Total "+r1(tot)+" "+esc(x.unit||"")+" · average "+r1(n?tot/n:0)+" per logged day"}
  else if(x.type==="time"){const ts=timeStats(x,p.days);if(ts)s+="<br>Average "+tstr(ts.avg)+" · earliest "+tstr(ts.min)+" · latest "+tstr(ts.max)}
  return s}
const rsec=(id,title,body,def,count)=>{const o=openSec[id]===undefined?def:openSec[id];return '<details class="rs" data-sec="'+id+'"'+(o?" open":"")+"><summary>"+title+(count!==undefined?' <span class="meta">('+count+")</span>":"")+"</summary>"+body+"</details>"};
function timeSection(per,one,S){
  const rows=per.map(p=>({h:p.h,m:p.days.reduce((a,d)=>a+minsOf(p.h,d),0)})),tot=rows.reduce((a,x)=>a+x.m,0);
  if(one)return tot>0?'<div class="cards"><div class="stat"><b>'+hmFmt(tot)+"</b><small>Time spent</small></div></div>":"";
  const miss=per.filter(p=>p.h.type!=="time"&&!isTimed(p.h)).map(p=>p.h.name);
  const note=miss.length?" Not counted (no time set): "+miss.slice(0,6).map(esc).join(", ")+(miss.length>6?" and "+(miss.length-6)+" more":"")+". Add minutes per check-in or per unit in a habit’s edit panel to include it. Time-of-day habits are never counted.":"";
  if(!tot)return '<h2>Where your time goes</h2><p class="empty">No time logged in this range yet.'+note+"</p>";
  const G=((S.c||S.g)?rows.filter(x=>x.m>0).map(x=>({name:ic(x.h)+esc(x.h.name),color:x.h.color,m:x.m})):cats.map(c=>({name:ci(c)+esc(c.name),color:c.color,m:rows.filter(x=>x.h.cat===c.id).reduce((a,x)=>a+x.m,0)})).filter(g=>g.m>0)).sort((a,b)=>b.m-a.m);
  return '<h2>Where your time goes</h2><div class="stack">'+G.map(g=>'<i style="flex:'+g.m+";background:"+g.color+'"></i>').join("")+"</div>"+G.map(g=>'<div class="dl tl"><span><i class="dot" style="background:'+g.color+'"></i>'+g.name+"</span><b>"+hmFmt(g.m)+" · "+pct(g.m,tot)+"%</b></div>").join("")+'<p class="legend">'+hmFmt(tot)+" in total for this range, from your logged minutes and any minutes per unit you set."+note+"</p>"}
function repView(){
  const A=act();if(!A.length)return '<p class="empty">Reports appear once you add a habit.</p>';
  const S=scopeInfo(),L=S.L,one=S.one,t=TODAY(),groups=A.filter(x=>x.type==="group");
  let h='<select class="scope" id="scope" aria-label="Report scope"><option value="all">Combined: all habits</option><optgroup label="Categories">'+cats.filter(c=>A.some(x=>x.cat===c.id)).map(c=>'<option value="c:'+c.id+'"'+(S.c===c?" selected":"")+">"+esc(c.name)+"</option>").join("")+"</optgroup>"+(groups.length?'<optgroup label="Groups">'+groups.map(x=>'<option value="'+x.id+'"'+(S.g===x?" selected":"")+">"+esc(x.name)+"</option>").join("")+"</optgroup>":"")+'<optgroup label="Habits">'+A.filter(x=>x.type!=="group").map(x=>'<option value="'+x.id+'"'+(one===x?" selected":"")+">"+esc(x.name)+"</option>").join("")+"</optgroup></select>";
  if(!L.length)return h+'<p class="empty">No active habits here yet.</p>';
  const from=rng?addDays(t,-(rng-1)):L.map(x=>x.created).sort()[0];
  const per=L.map(x=>({h:x,...stats(x,from,t)})),el=per.reduce((a,p)=>a+p.el,0),dn=per.reduce((a,p)=>a+p.dn,0);
  h+='<div class="rng">'+[[7,"7 days"],[30,"30 days"],[90,"90 days"],[0,"All time"]].map(([v,l])=>'<button class="tab" data-rng="'+v+'" aria-pressed="'+(rng===v)+'">'+l+"</button>").join("")+"</div>";
  if(one&&one.desc)h+='<p class="note">'+esc(one.desc)+"</p>";
  const card=(b,s)=>'<div class="stat"><b>'+b+"</b><small>"+s+"</small></div>";
  let sum='<div class="cards">'+card(pct(dn,el)+"%","Completion")+card(dn+" of "+el,"Habit-days done");
  if(one){const U=isWeekly(one)?"weeks":"days";sum+=card(streak(one),"Current streak ("+U+")")+card(longest(one),"Longest streak ("+U+")");const sk=Object.keys(one.skip||{}).filter(d=>per[0].days.includes(d)).length;if(sk)sum+=card(sk,"Days skipped on purpose");
    if(one.type==="num"){const p=per[0],tot=p.days.reduce((a,d)=>a+(dayVal(one,d)||0),0),n=p.days.filter(d=>dayVal(one,d)>0).length,mx=Math.max(0,...p.days.map(d=>dayVal(one,d)||0));
      sum+=card(r1(tot),"Total "+esc(one.unit||""))+card(r1(n?tot/n:0),"Average per logged day")+card(r1(mx),"Best single day")+card(n,"Days logged")}
    if(one.type==="time"){const ts=timeStats(one,per[0].days);sum+=card(ts?tstr(ts.avg):"–","Average time")+card(ts?tstr(ts.min):"–","Earliest")+card(ts?tstr(ts.max):"–","Latest")+card(ts?ts.n:0,"Days logged")}}
  else{const Dd=L.filter(x=>!isWeekly(x));
    if(S.g)sum+=card(streak(S.g),"Group streak (days)")+card(longest(S.g),"Longest group streak (days)");
    sum+=card(Dd.length?Math.max(...Dd.map(streak)):"–","Best current streak (days)")+card(Dd.length?Math.max(...Dd.map(longest)):"–","Longest streak ever (days)")}
  sum+="</div>"+timeSection(per,one,S)+whenSection(per)+"<h2>Weekly completion, last 12 weeks</h2>"+weekBars(L,one&&one.color)+'<p class="legend">Share of due habit-days completed in each week. Labels are the first day of each week.</p><h2>By day of the week</h2>'+dowBars(L,from,t)+'<p class="legend">Share of due days completed on each weekday over the selected range.</p>';
  let det="";
  if(!one){
    if(!S.c&&!S.g){const rows=cats.map(c=>{const ps=per.filter(p=>p.h.cat===c.id);if(!ps.length)return"";return mrow(ci(c)+esc(c.name),c.color,{dn:ps.reduce((a,p)=>a+p.dn,0),el:ps.reduce((a,p)=>a+p.el,0)}," · "+ps.length+(ps.length===1?" habit":" habits"),"c:"+c.id)}).filter(Boolean);det+=rsec("rc","By category",rows.join(""),false,rows.length)}
    const GL=S.g?[]:(S.c?groups.filter(g=>g.cat===S.c.id):groups);
    if(GL.length)det+=rsec("rg","By group",GL.map(g=>mrow(ic(g)+esc(g.name),g.color,stats(g,from,t)," · "+kids(g).length+(kids(g).length===1?" sub-habit":" sub-habits")+" · streak "+streak(g)+" · best "+longest(g),g.id)).join(""),false,GL.length);
    det+=rsec("rh","By habit",per.map(p=>mrow(ic(p.h)+esc(p.h.name)+grpTag(p.h),p.h.color,p,habitExtra(p.h,p),p.h.id)).join(""),false,per.length)}
  else{const ks=Object.keys(one.notes).sort().reverse().slice(0,8);det+=rsec("rn","Recent notes",ks.length?'<ul class="nl">'+ks.map(d=>"<li><b>"+fmt(d,{day:"numeric",month:"short"})+"</b> "+esc(one.notes[d])+"</li>").join("")+"</ul>":'<p class="empty">No notes yet.</p>',ks.length>0,ks.length)}
  return h+rsec("rs","Summary",sum,true)+rsec("rd","Details",det,true)}
function periodIdx(t){const P=settings.periods;for(let i=P.length-1;i>=0;i--)if(hm2m(t)>=hm2m(P[i].from))return i;return 0}
/* Timed minutes by the time of day each timer entry started. Only shows when timer entries exist, so most people never see it. */
function whenSection(per){
  const P=settings.periods,tot=P.map(()=>0);let un=0,all=0,n=0;
  per.forEach(p=>{const E=p.h.ent;if(!E||!p.h.timer)return;p.days.forEach(d=>(E[d]||[]).forEach(e=>{const m=e.d/60;all+=m;n++;if(e.t)tot[periodIdx(e.t)]+=m;else un+=m}))});
  if(!all)return"";
  const placed=tot.reduce((a,b)=>a+b,0),rows=P.map((p,i)=>({name:esc(p.name)+' <span class="meta">'+p.from+"–"+p.to+"</span>",m:tot[i],color:PAL[i%PAL.length]})).filter(x=>x.m>0);
  return "<h2>When you spend timed minutes</h2>"+(placed?'<div class="stack">'+rows.map(x=>'<i style="flex:'+x.m+";background:"+x.color+'"></i>').join("")+"</div>"+rows.map(x=>'<div class="dl tl"><span><i class="dot" style="background:'+x.color+'"></i>'+x.name+"</span><b>"+hmFmt(x.m)+" · "+pct(x.m,placed)+"%</b></div>").join(""):"")+'<p class="legend">From '+n+" timer "+(n===1?"entry":"entries")+": "+hmFmt(all)+" in total"+(un?", of which "+hmFmt(un)+" has no start time (added without one, or older than the "+keepDays()+"-day detail window)":"")+". Each entry is placed by the time it started. Detailed entries are kept for "+keepDays()+" days; older ones are merged into daily totals.</p>"}
