/* view-calendar.js: the Calendar tab (week grid by category, group and habit; month overview; day detail). Browsing is limited by bounds(). */
const scopeSel=(id,cur)=>{
  const A=act(),G=A.filter(x=>x.type==="group");
  return '<select class="scope" id="'+id+'" aria-label="Show"><option value="all">All categories</option><optgroup label="Categories">'+cats.map(c=>'<option value="c:'+c.id+'"'+(cur==="c:"+c.id?" selected":"")+">"+esc(c.name)+"</option>").join("")+"</optgroup>"+(G.length?'<optgroup label="Groups">'+G.map(x=>'<option value="'+x.id+'"'+(cur===x.id?" selected":"")+">"+esc(x.name)+"</option>").join("")+"</optgroup>":"")+'<optgroup label="Habits">'+A.filter(x=>x.type!=="group").map(x=>'<option value="'+x.id+'"'+(cur===x.id?" selected":"")+">"+esc(x.name)+"</option>").join("")+"</optgroup></select>"};
function calInfo(){
  const A=act();
  if(calScope.startsWith("c:")){const c=cats.find(x=>x.id===calScope.slice(2));if(c)return{L:A.filter(x=>x.cat===c.id&&x.type!=="group"),c}}
  const x=A.find(y=>y.id===calScope);
  if(x&&x.type==="group")return{L:kids(x),g:x};
  if(x)return{L:[x],one:x};
  calScope="all";return{L:A.filter(y=>y.type!=="group")}}
/* Category > group > habit structure used by the week grid and the day detail. */
function calRows(S,keep){
  const A=act(),leaf=S.L.filter(keep);
  if(S.one)return leaf.length?[{c:catOf(S.one.cat),items:[{g:null,list:leaf}]}]:[];
  const cs=S.g?[catOf(S.g.cat)]:S.c?[S.c]:cats,out=[];
  cs.forEach(c=>{const items=[];
    A.filter(x=>x.cat===c.id&&!x.parent).forEach(x=>{
      if(x.type==="group"){const K=kids(x).filter(k=>leaf.includes(k));if(K.length&&(!S.g||S.g===x))items.push({g:x,list:K})}
      else if(leaf.includes(x)&&!S.g)items.push({g:null,list:[x]})});
    if(items.length)out.push({c,items})});
  return out}
function wcell(h,d){
  if(!inWin(h,d))return '<div class="wc na"></div>';
  const sk=skipped(h,d);
  return '<button class="wc'+(isDone(h,d)?" ok":logged(h,d)?" part":"")+(d>TODAY()?" fut":"")+(sk||(!logged(h,d)&&!isWeekly(h)&&!isDue(h,d))?" off":"")+'" style="--c:'+h.color+'" data-open="'+d+'" aria-label="'+esc(h.name)+", "+d+'">'+(sk?"skip":valText(h,d)||"·")+"</button>"}
function weekGrid(S){
  const ws=weekStartOf(calDate),we=addDays(ws,6),days=span(ws,we),t=TODAY(),ov=x=>winStart(x)<=we&&cycleEnd(x)>=ws;
  const rows=calRows(S,ov);if(!rows.length)return '<p class="empty">No habits are active in this week.</p>';
  let h='<div class="wg"><div></div>'+days.map(d=>'<div class="wh'+(d===t?" today":"")+'">'+fmt(d,{weekday:"short"})+"<b>"+parse(d).getDate()+"</b></div>").join("");
  rows.forEach(r=>{
    const all=r.items.flatMap(i=>i.list);
    h+='<div class="wcat"><i style="background:'+r.c.color+'"></i>'+ci(r.c)+esc(r.c.name)+"</div>"+days.map(d=>{const s=dayStat(all,d);return '<div class="wsum">'+(s.t?s.n+"/"+s.t:"")+"</div>"}).join("");
    r.items.forEach(it=>{
      if(it.g)h+='<div class="wgrp" style="--c:'+it.g.color+'">'+ic(it.g)+esc(it.g.name)+"</div>"+days.map(d=>{const s=dayStat(it.list,d);return '<div class="wgs'+(isDone(it.g,d)?" ok":"")+'">'+(s.t?s.n+"/"+s.t:"")+"</div>"}).join("");
      it.list.forEach(x=>{h+='<div class="wn'+(it.g?" kid":"")+'" style="--c:'+x.color+'">'+ic(x)+esc(x.name)+"</div>"+days.map(d=>wcell(x,d)).join("")})})});
  return h+"</div>"}
function monthGrid(S){
  const mk=calDate.slice(0,7),[y,m]=mk.split("-").map(Number),n=new Date(y,m,0).getDate(),off=(new Date(y,m-1,1).getDay()-settings.weekStart+7)%7,t=TODAY();
  let h='<div class="cal">'+wdOrder().map(i=>'<div class="wd">'+WD[i]+"</div>").join("");
  for(let i=0;i<off;i++)h+="<div></div>";
  for(let i=1;i<=n;i++){const d=mk+"-"+String(i).padStart(2,"0"),s=dayStat(S.L,d);let body="";
    if(S.one)body="<em>"+(skipped(S.one,d)?"skip":valText(S.one,d)||"")+"</em>";
    else if(S.c||S.g)body='<div class="dots">'+S.L.filter(x=>dueOn(x,d)).map(x=>'<i class="d'+(isDone(x,d)?" full":"")+'" style="--c:'+x.color+'"></i>').join("")+"</div>";
    else body='<div class="dots">'+cats.map(c=>{const L=S.L.filter(x=>x.cat===c.id&&dueOn(x,d));if(!L.length)return"";const k=L.filter(x=>isDone(x,d)).length;return '<i class="d'+(k===L.length?" full":"")+'" style="--c:'+c.color+(k&&k<L.length?";opacity:.55":"")+'"></i>'}).join("")+"</div>";
    h+='<button class="day'+(d>t?" fut":"")+(d===t?" today":"")+(d===calPick?" pick":"")+(S.one&&!inWin(S.one,d)?" na":"")+'" data-calpick="'+d+'" style="--p:'+pct(s.n,s.t)+(S.one?";--c:"+S.one.color:S.g?";--c:"+S.g.color:"")+'" aria-label="'+fmt(d,{day:"numeric",month:"long"})+'"><span>'+i+"</span>"+body+"</button>"}
  return h+"</div>"}
function dayDetail(d,S){
  const rows=calRows(S,x=>dueOn(x,d)||logged(x,d)||skipped(x,d));
  return '<div class="detail"><div class="nav" style="margin-bottom:4px"><b style="text-align:left">'+fmt(d,{weekday:"long",day:"numeric",month:"long"})+'</b><button class="nb" data-open="'+d+'">Open day</button></div>'+(rows.length?"":'<p class="empty">Nothing scheduled this day.</p>')+rows.map(r=>{
    const s=dayStat(r.items.flatMap(i=>i.list),d);
    return '<div class="dcat"><i style="background:'+r.c.color+'"></i>'+ci(r.c)+esc(r.c.name)+"<small>"+s.n+" of "+s.t+"</small></div>"+r.items.map(it=>{
      const gs=it.g?dayStat(it.list,d):null;
      return (it.g?'<div class="dgrp">'+ic(it.g)+esc(it.g.name)+"<small>"+gs.n+" of "+gs.t+"</small></div>":"")+it.list.map(x=>'<div class="dl'+(it.g?" kid":"")+'"><span>'+ic(x)+esc(x.name)+'</span><b class="'+(isDone(x,d)?"ok":"")+'">'+(skipped(x,d)?"skip":valText(x,d)||"–")+"</b></div>").join("")}).join("")}).join("")+"</div>"}
function calView(){
  if(!act().length)return '<p class="empty">No habits yet. Add some in the Habits tab or start from a template in Settings.</p>';
  const S=calInfo(),wk=calMode==="week",ws=weekStartOf(calDate),bd=bounds();
  const canPrev=wk?addDays(ws,-1)>=bd.min:calDate.slice(0,7)>bd.minYM,canNext=wk?addDays(ws,7)<=bd.max:calDate.slice(0,7)<bd.maxYM;
  let h='<div class="rng"><button class="tab" data-cmode="week" aria-pressed="'+wk+'">Week</button><button class="tab" data-cmode="month" aria-pressed="'+!wk+'">Month</button></div>'+scopeSel("calScope",calScope);
  const lbl=wk?fmt(ws,{day:"numeric",month:"short"})+" – "+fmt(addDays(ws,6),{day:"numeric",month:"short"}):parse(calDate).toLocaleDateString(undefined,{month:"long",year:"numeric"});
  h+='<div class="nav"><button class="nb" data-cnav="-1" '+(canPrev?"":"disabled ")+'aria-label="Previous">‹</button><b>'+lbl+'</b><button class="nb" data-ctoday>Today</button><button class="nb" data-cnav="1" '+(canNext?"":"disabled ")+'aria-label="Next">›</button></div>';
  const lim='<p class="legend">You can browse from '+fmt(bd.min,{month:"short",year:"numeric"})+" to "+fmt(bd.max,{month:"short",year:"numeric"})+". Habits only appear inside their 66-day cycle.</p>";
  if(wk){let n=0,t=0;span(ws,addDays(ws,6)).forEach(d=>{const s=dayStat(S.L,d);n+=s.n;t+=s.t});
    return h+weekGrid(S)+'<p class="legend">'+n+" of "+t+" habit-days done this week ("+pct(n,t)+"%). Numbers beside a category or group show how many of its habits were done that day. Tap a cell to open the day.</p>"+lim}
  const lg=S.one?"Each cell shows what you logged. Colour shows done days.":S.g?"Each dot is a sub-habit of the group: filled when done, ring when not. Shading shows how much of the group was done.":S.c?"Each dot is a habit: filled when done, ring when not. Shading shows overall completion.":"Each dot is a category: filled when all its habits are done, faded when some are, ring when none. Shading shows overall completion. Choose a group in the menu to see its sub-habits, or tap a day to see categories and groups by name.";
  return h+monthGrid(S)+'<p class="legend">'+lg+"</p>"+(calPick&&calPick.slice(0,7)===calDate.slice(0,7)?dayDetail(calPick,S):"")+lim}
