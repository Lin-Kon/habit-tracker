/* timers.js: dual timers (primary + background), pomodoro, interval log for overlap insights.
   Wraps the timer functions in core.js (runStart, runStop, norm) without editing core.js. Load after ui.js, before app.js.
   settings.run = primary {id,at}; settings.bg = background {id,at}; settings.orph = when the primary stopped while a background was running (grace period);
   settings.ivs = [{h,a,b,s:"p"|"b"}] live timer intervals (kept 180 days) used for overlap; settings.pomo = pomodoro state and options.
   A background timer entry is a normal h.ent entry with s:"b". A habit may be flagged h.bg (can run in background) and linked to an objective via h.obj. */
const GRACE=120000,LONGRUN=6*3600000;
const bgH=()=>settings.bg?habits.find(h=>h.id===settings.bg.id)||null:null;
const canTime=h=>h.type!=="group"&&h.type!=="time"&&!h.archived&&!hasSlots(h)&&vis(h,TODAY());
const runLong=()=>!!settings.run&&Date.now()-settings.run.at>LONGRUN;
const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return pad2(Math.floor(s/60))+":"+pad2(s%60)};
function tNorm(){
  settings.pomo=Object.assign({on:false,focus:25,short:5,long:15,every:4,n:0,nd:"",bgKeep:true,phase:null,at:0,brk:null,bgPaused:null},settings.pomo||{});
  const P=settings.pomo;
  if(!Array.isArray(settings.ivs))settings.ivs=[];
  if(!Array.isArray(settings.goals))settings.goals=[];
  if(!settings.hv)settings.hv={mode:"list",sort:"manual"};
  if(settings.bg&&!habits.some(h=>h.id===settings.bg.id))settings.bg=null;
  if(typeof settings.orph!=="number")settings.orph=0;
  if(!settings.run&&!P.brk)P.phase=null;
  if(settings.bg&&!settings.run&&!P.brk&&!settings.orph)settings.orph=Date.now();
  const lim=Date.now()-180*864e5;settings.ivs=settings.ivs.filter(v=>v.b>=lim)}
const _norm=norm;norm=function(){_norm();tNorm()};
tNorm();
view="home";
const logIv=(h,a,b,s)=>settings.ivs.push({h,a,b,s});
function ping(t,b){toast(t+" "+b);try{if(settings.notify&&typeof Notification!=="undefined"&&Notification.permission==="granted")new Notification(t,{body:b})}catch(e){}}
/* ---- primary: wrap the core.js functions */
const _rst=runStart,_rsp=runStop;
runStop=function(){const r=settings.run,x=_rsp();if(x&&r){logIv(r.id,r.at,Date.now(),"p");if(settings.bg&&!settings.pomo.brk)settings.orph=Date.now()}return x};
runStart=function(h){
  _rst(h);const P=settings.pomo;settings.orph=0;
  if(P.nd!==TODAY()){P.nd=TODAY();P.n=0}
  P.brk=null;P.phase=P.on?"focus":null;P.at=settings.run.at;
  if(settings.bg&&settings.bg.id===h.id)stopBg();
  if(P.bgPaused){const b=habits.find(x=>x.id===P.bgPaused);P.bgPaused=null;if(b&&b.id!==h.id&&!settings.bg)settings.bg={id:b.id,at:Date.now()}}};
function startPrimary(h){
  let pre="";
  if(settings.run&&settings.run.id===h.id){const r=runStop();save();render();if(r)toast(savedMsg(r));return}
  if(settings.run){const r=runStop();if(r)pre="Paused "+r.h.name+" ("+hmFmt(r.secs/60)+"). "}
  h.timer=true;runStart(h);save();render();toast(pre+"Timer started for "+h.name+".")}
function endSession(){
  const P=settings.pomo;P.phase=null;P.brk=null;P.bgPaused=null;
  if(settings.run)return runStop();
  if(settings.bg)settings.orph=Date.now();
  return null}
/* ---- background */
function startBg(h){
  if(!settings.run&&!settings.pomo.brk)return false;
  if(settings.run&&settings.run.id===h.id)return false;
  if(settings.bg)stopBg();
  h.timer=true;settings.bg={id:h.id,at:Date.now()};settings.orph=0;return true}
function stopBg(){
  const r=settings.bg;if(!r)return null;settings.bg=null;settings.orph=0;
  const h=habits.find(x=>x.id===r.id);if(!h)return null;
  const now=Date.now(),secs=Math.max(1,Math.round((now-r.at)/1000)),s=new Date(r.at);
  addEntry(h,ds(s),{t:pad2(s.getHours())+":"+pad2(s.getMinutes()),d:secs,s:"b"});logIv(h.id,r.at,now,"b");compactEntries();
  return{h,secs}}
function promoteBg(){const x=stopBg();if(x){runStart(x.h);return x.h}return null}
const orphDue=()=>!!settings.bg&&!settings.run&&!settings.pomo.brk&&settings.orph>0&&Date.now()-settings.orph>=GRACE;
function orphCard(){
  if(!orphDue())return"";const b=bgH();if(!b)return"";
  return '<div class="runbar orph">Your main task stopped. Keep <b>'+esc(b.name)+'</b> as your main task? <span class="row"><button class="nb" data-xorphyes>Yes</button><button class="nb" data-xorphno>No, stop it</button></span></div>'}
/* ---- pomodoro: a focus round logs as a normal entry, then a break starts. Breaks are not logged. */
function endFocus(){
  const P=settings.pomo,r=settings.run;if(!r)return;
  const h=habits.find(x=>x.id===r.id);settings.run=null;
  if(h){const s=new Date(P.at);addEntry(h,ds(s),{t:pad2(s.getHours())+":"+pad2(s.getMinutes()),d:P.focus*60});compactEntries();logIv(h.id,P.at,P.at+P.focus*60000,"p")}
  P.n++;const long=P.n%P.every===0,m=long?P.long:P.short;
  P.brk={kind:long?"long":"short",until:Date.now()+m*60000,hid:r.id,over:false};P.phase=null;
  if(!P.bgKeep&&settings.bg){P.bgPaused=settings.bg.id;stopBg()}
  ping("🍅 Focus round done.","Take a "+m+" minute break.")}
/* ---- overlap maths from live intervals */
function overlapData(days){
  const lim=days?Date.now()-days*864e5:0,I=settings.ivs.filter(v=>v.b>=lim),Pm=I.filter(v=>v.s==="p"),B=I.filter(v=>v.s==="b"),pair={},pTot={},bTot={},pWith={};
  I.forEach(v=>{const T=v.s==="p"?pTot:bTot;T[v.h]=(T[v.h]||0)+(v.b-v.a)/60000});
  Pm.forEach(p=>B.forEach(b=>{const o=Math.min(p.b,b.b)-Math.max(p.a,b.a);if(o>0){const m=o/60000,k=p.h+"|"+b.h;pair[k]=(pair[k]||0)+m;pWith[p.h]=(pWith[p.h]||0)+m}}));
  return{pair,pTot,bTot,pWith}}
/* ---- one-second tick: clocks, pomodoro phases, grace prompt. Re-renders only when the discrete state changes. */
const tSig=()=>{const P=settings.pomo;return[settings.run&&settings.run.id,settings.bg&&settings.bg.id,P.phase,P.brk&&P.brk.over,orphDue(),runLong()].join("|")};
let lastSig=tSig();
const tSigSync=()=>{lastSig=tSig()};
setInterval(()=>{
  const P=settings.pomo,now=Date.now();
  if(P.on&&settings.run&&P.phase==="focus"&&now-P.at>=P.focus*60000){endFocus();save()}
  else if(P.brk&&!P.brk.over&&now>=P.brk.until){P.brk.over=true;ping("Break over.","Ready for the next round?");save()}
  document.querySelectorAll("[data-tkat]").forEach(el=>{el.textContent=fmtClock((now-+el.dataset.tkat)/1000)});
  document.querySelectorAll("[data-tkleft]").forEach(el=>{el.textContent=mmss(+el.dataset.tkleft-now)});
  const g=tSig();if(g!==lastSig){lastSig=g;render()}},1000);
/* ---- compact bar shown above every tab except Home (replaces runHtml from view-day.js) */
runHtml=function(){
  const h=runH(),b=bgH(),P=settings.pomo;let s="";
  if(h)s+='<div class="runbar">⏱ <b>'+ic(h)+esc(h.name)+'</b> <span class="tk" data-tkat="'+settings.run.at+'">'+fmtClock((Date.now()-settings.run.at)/1000)+"</span>"+(P.on&&P.phase==="focus"?' <span class="meta">🍅 <b data-tkleft="'+(P.at+P.focus*60000)+'">'+mmss(P.at+P.focus*60000-Date.now())+"</b></span>":"")+'<button class="nb" data-xend>Stop</button></div>';
  else if(P.brk)s+='<div class="runbar">🍅 '+(P.brk.over?"Break is over":'Break <b data-tkleft="'+P.brk.until+'">'+mmss(P.brk.until-Date.now())+"</b>")+'<button class="nb" data-view="home">Open</button></div>';
  if(b)s+='<div class="runbar bgbar">🎧 <b>'+ic(b)+esc(b.name)+'</b> <span class="tk" data-tkat="'+settings.bg.at+'">'+fmtClock((Date.now()-settings.bg.at)/1000)+'</span><button class="nb" data-xbgstop>Stop</button></div>';
  return s+orphCard()};
