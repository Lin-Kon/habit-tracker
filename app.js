/* app.js: event handling (clicks, changes, submit, drag-to-reorder, notifications) and first render. Loaded last. */
const exportObj=()=>({v:6,exported:new Date().toISOString(),settings,cats,habits});
let toastT;
function toast(text,undo){let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.setAttribute("role","status");document.body.appendChild(el)}
  el.innerHTML="<span>"+esc(text)+"</span>"+(undo?"<button data-undo>Undo</button>":"");el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},undo?10000:5000)}
const msg=t=>toast(t);
const savedMsg=r=>"Saved "+hmFmt(r.secs/60)+" to "+r.h.name+"."+(r.secs>28800?" That is a long entry. If you forgot to pause, fix it in More, Time log.":"");
const formErr=m=>{const e=document.getElementById("ferr");if(e){e.textContent=m;e.hidden=!m}if(m){const n=document.getElementById("n");if(n)n.focus()}};
const catErr=m=>{const e=document.getElementById("cerr");if(e){e.textContent=m;e.hidden=!m}};
document.addEventListener("toggle",e=>{const s=e.target.dataset&&e.target.dataset.sec;if(s)openSec[s]=e.target.open},true);
/* record the new open state at click time too, so a quick re-render cannot lose it */
document.addEventListener("click",e=>{const sm=e.target.closest&&e.target.closest("summary"),d=sm&&sm.parentElement;if(d&&d.dataset&&d.dataset.sec)openSec[d.dataset.sec]=!d.open},true);
const csvq=s=>'"'+String(s).replace(/"/g,'""')+'"';
/* Runs a destructive change immediately, keeps a snapshot (also in localStorage) and offers Undo. */
function destroy(fn,text){
  snap=JSON.stringify({habits,cats,settings,stamps:SYNC.stamps});try{localStorage.setItem(KEY+"-backup",snap)}catch(e){}
  badgeQuiet=true;fn();norm();save();badgeQuiet=false;render();toast(text,true)}
function applyTpl(id){
  const T=TEMPLATES.find(x=>x.id===id);let n=0,grp=null;
  const catFor=name=>{let c=cats.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!c){c={id:"c"+Date.now().toString(36)+n,name,color:PAL[cats.length%PAL.length],icon:CAT_ICON[name]||"📁"};cats.splice(Math.max(0,cats.length-1),0,c)}return c};
  if(T.group){grp=habits.find(h=>h.type==="group"&&h.name.toLowerCase()===T.group.toLowerCase());
    if(!grp){const c=catFor(T.habits[0].cat);grp={id:"g"+Date.now().toString(36),name:T.group,type:"group",cat:c.id,color:PAL[habits.length%PAL.length],created:TODAY(),cycles:1,done:{},notes:{},icon:T.groupIcon||"📁"};habits.push(grp)}}
  T.habits.forEach(d=>{
    if(habits.some(h=>h.name.toLowerCase()===d.name.toLowerCase()))return;
    const c=grp?cats.find(x=>x.id===grp.cat):catFor(d.cat);
    const h={id:Date.now().toString(36)+n,name:d.name,type:d.type,cat:c.id,color:PAL[habits.length%PAL.length],created:TODAY(),cycles:1,done:{},notes:{}};
    const i=guessIcon(d.name);if(i)h.icon=i;if(d.freq)h.freq=d.freq;if(d.by)h.by=d.by;if(d.unit)h.unit=d.unit;if(d.mpu)h.mpu=d.mpu;if(d.target)h.target=d.target;if(grp)h.parent=grp.id;
    habits.push(h);n++});
  save();render();toast(n?"Added "+n+" habits from "+T.name+". Open the Log tab to start.":"All habits in this template already exist.")}
const notified={};
function notifyBehind(){
  if(!settings.notify||settings.rough[TODAY()]||typeof Notification==="undefined"||Notification.permission!=="granted")return;
  behindList().forEach(b=>{const k=TODAY()+"|"+b.h.id+"|"+(b.slot?b.slot.id:"");if(notified[k])return;notified[k]=1;
    try{new Notification("Behind schedule: "+b.h.name+(b.slot?" ("+b.slot.name+")":""),{body:"It was due by the end of the "+b.p.name.toLowerCase()+" ("+b.p.to+")."})}catch(e){}})}
/* ---- drag to reorder */
let drag=null;
function commitSort(box){
  const ids=[...box.children].map(x=>x.dataset.sid).filter(Boolean),kind=box.dataset.sortbox;
  if(kind==="cats")cats=ids.map(id=>cats.find(c=>c.id===id)).filter(Boolean).concat(cats.filter(c=>!ids.includes(c.id)));
  else reorderSubset(ids);
  save();render()}
document.addEventListener("pointerdown",e=>{
  const g=e.target.closest&&e.target.closest(".grip");if(!g)return;const item=g.closest("[data-sid]");if(!item)return;
  e.preventDefault();drag={item,box:item.parentElement};item.classList.add("dragging");try{g.setPointerCapture(e.pointerId)}catch(x){}});
document.addEventListener("pointermove",e=>{
  if(!drag)return;e.preventDefault();
  const sibs=[...drag.box.children].filter(x=>x!==drag.item&&x.dataset.sid);let before=null;
  for(const s of sibs){const r=s.getBoundingClientRect();if(e.clientY<r.top+r.height/2){before=s;break}}
  drag.box.insertBefore(drag.item,before);
  if(e.clientY<80)window.scrollBy(0,-12);else if(e.clientY>window.innerHeight-80)window.scrollBy(0,12)},{passive:false});
function endDrag(){if(!drag)return;const{item,box}=drag;drag=null;item.classList.remove("dragging");commitSort(box)}
document.addEventListener("pointerup",endDrag);document.addEventListener("pointercancel",endDrag);
document.addEventListener("keydown",e=>{
  const g=e.target.closest&&e.target.closest(".grip");if(!g||(e.key!=="ArrowUp"&&e.key!=="ArrowDown"))return;
  e.preventDefault();const item=g.closest("[data-sid]"),box=item.parentElement,sibs=[...box.children].filter(x=>x.dataset.sid),i=sibs.indexOf(item),j=i+(e.key==="ArrowUp"?-1:1);
  if(j<0||j>=sibs.length)return;
  if(j<i)box.insertBefore(item,sibs[j]);else box.insertBefore(sibs[j],item);
  const id=item.dataset.sid;commitSort(box);setTimeout(()=>{const n=document.querySelector('[data-sid="'+id+'"] .grip');if(n)n.focus()},0)});
/* ---- clicks */
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const D=b.dataset;
  if(b.id==="back"){goBack();return}
  if(b.id==="fwd"){goForward();return}
  if(D.view){if(D.view!==view){navPush();view=D.view}armed=null;render();return}
  if(D.nav){const n=addDays(sel,+D.nav),bd=bounds();if(n<bd.min||n>bd.max)return;sel=n;noteOpen={};render();return}
  if(b.hasAttribute("data-today")){sel=TODAY();render();return}
  if(D.cmode){calMode=D.cmode;calPick=null;render();return}
  if(D.cnav){const k=+D.cnav,bd=bounds();
    if(calMode==="week"){const nd=addDays(calDate,7*k),ws=weekStartOf(nd);if(addDays(ws,6)<bd.min||ws>bd.max)return;calDate=nd}
    else{const ym=monthShift(calDate.slice(0,7),k);if(ym<bd.minYM||ym>bd.maxYM)return;calDate=ym===TODAY().slice(0,7)?TODAY():ym+"-01"}
    calPick=null;render();return}
  if(b.hasAttribute("data-ctoday")){calDate=TODAY();calPick=null;render();return}
  if(D.calpick){calPick=D.calpick;render();return}
  if(D.open){navPush();sel=D.open;view="day";noteOpen={};render();window.scrollTo(0,0);return}
  if(D.cc){settings.collapsed[D.cc]=!settings.collapsed[D.cc];save();render();return}
  if(D.gc){settings.collapsed["g"+D.gc]=!settings.collapsed["g"+D.gc];save();render();return}
  if(b.hasAttribute("data-hide")){settings.hideDone=!settings.hideDone;save();render();return}
  if(D.nt){noteOpen[D.nt]=!noteOpen[D.nt];render();return}
  if(D.skip){const h=habits.find(x=>x.id===D.skip);if(h){h.skip=h.skip||{};if(h.skip[D.d])delete h.skip[D.d];else{h.skip[D.d]=1;delete h.done[D.d]}save();render()}return}
  if(D.extend){const h=habits.find(x=>x.id===D.extend);if(h){h.cycles=(h.cycles||1)+1;save();render();toast(h.name+" now runs until "+fmt(cycleEnd(h),{day:"numeric",month:"short",year:"numeric"})+".")}return}
  if(D.edit){editing=editing===D.edit?null:D.edit;armed=null;render();return}
  if(b.hasAttribute("data-newtoggle")){showNew=!showNew;render();return}
  if(b.hasAttribute("data-reorder")){reorder=!reorder;showNew=false;render();return}
  if(D.rng!==undefined){rng=+D.rng;render();return}
  if(D.scope!==undefined){navPush();repScope=D.scope;render();window.scrollTo(0,0);return}
  if(D.ec){const h=habits.find(x=>x.id===D.ec);if(h){h.color=D.c;save();render()}return}
  if(D.arch){const h=habits.find(x=>x.id===D.arch);if(h){h.archived=!h.archived;habits.forEach(k=>{if(k.parent===h.id)k.archived=h.archived});save();render()}return}
  if(D.rm){if(armed===D.rm){habits=habits.filter(h=>h.id!==armed);habits.forEach(h=>{if(h.parent===armed)delete h.parent});armed=null;save()}else armed=D.rm;render();return}
  if(D.hcc){settings.hcollapsed[D.hcc]=!settings.hcollapsed[D.hcc];save();render();return}
  if(D.hall){cats.forEach(c=>{settings.hcollapsed[c.id]=D.hall==="collapse"});settings.hcollapsed._arch=D.hall==="collapse";save();render();return}
  if(b.hasAttribute("data-showoff")){showOff=!showOff;render();return}
  if(D.ed!==undefined){const h=habits.find(x=>x.id===D.id);if(h){const d=freq(h).days||[],w=+D.ed;h.freq={t:"days",days:d.includes(w)?d.filter(x=>x!==w):d.concat(w)};save();render()}return}
  if(D.hic!==undefined){const h=habits.find(x=>x.id===D.hic);if(h){if(D.v)h.icon=D.v;else delete h.icon;save();render()}return}
  if(D.cip){iconEdit=iconEdit===D.cip?null:D.cip;render();return}
  if(D.cic){const c=cats.find(x=>x.id===D.cic);if(c){c.icon=D.v;iconEdit=null;save();render()}return}
  if(D.cdel){if(cats.length<2){toast("Keep at least one category.");return}
    if(armed!=="c"+D.cdel){armed="c"+D.cdel;render();return}
    const keep=cats.find(c=>c.id!==D.cdel).id;habits.forEach(h=>{if(h.cat===D.cdel)h.cat=keep});cats=cats.filter(c=>c.id!==D.cdel);armed=null;save();render();return}
  if(D.ttoggle){const h=habits.find(x=>x.id===D.ttoggle);if(!h)return;
    if(settings.run&&settings.run.id===h.id){const r=runStop();save();render();if(r)toast(savedMsg(r))}
    else{let pre="";if(settings.run){const r=runStop();if(r)pre="Paused "+r.h.name+" ("+hmFmt(r.secs/60)+"). "}runStart(h);save();render();toast(pre+"Timer started for "+h.name+".")}
    return}
  if(b.hasAttribute("data-tstop")){const r=runStop();if(r){save();render();toast(savedMsg(r))}return}
  if(D.eadd){const h=habits.find(x=>x.id===D.eadd);if(!h)return;
    const t=document.querySelector('[data-eat="'+h.id+'"]').value,m=parseFloat(document.querySelector('[data-eam="'+h.id+'"]').value);
    if(!(m>=1&&m<=1440)){toast("Enter the minutes spent, from 1 to 1440.");return}
    addEntry(h,D.d,{t:t||"",d:Math.round(m*60),man:1});compactEntries();save();render();return}
  if(D.edel!==undefined){const h=habits.find(x=>x.id===D.id);if(h&&h.ent&&h.ent[D.d]){h.ent[D.d].splice(+D.edel,1);if(!h.ent[D.d].length)delete h.ent[D.d];save();render()}return}
  if(D.gtab){guideTab=D.gtab;render();return}
  if(b.hasAttribute("data-obstart")){obStart();render();window.scrollTo(0,0);return}
  if(b.hasAttribute("data-obnext")){ob.step=Math.min(6,ob.step+1);render();window.scrollTo(0,0);return}
  if(b.hasAttribute("data-obback")){ob.step=Math.max(0,ob.step-1);render();return}
  if(b.hasAttribute("data-obquit")){ob=null;settings.promptSeen=true;save();render();return}
  if(b.hasAttribute("data-obfinish")){finishOb();return}
  if(D.obset){ob.a[D.obset]=(ob.a[D.obset]===D.v&&["rel","kids","money"].includes(D.obset))?"":D.v;render();return}
  if(D.obfocus){const f=ob.a.focus,i=f.indexOf(D.obfocus);if(i>=0)f.splice(i,1);else if(f.length<5)f.push(D.obfocus);else toast("Choose up to five. You can change them later.");render();return}
  if(D.stepadd){const s=STEPS.find(x=>x.id===D.stepadd),h=s&&addStep(s);save();render();toast(h?"Added “"+h.name+"”. You will find it in your Log.":"That habit already exists.");return}
  if(b.hasAttribute("data-stepall")){let n=0;buildPlan(settings.profile).forEach(s=>{if(settings.plan[s.id]==="skip")return;if(!habits.some(h=>h.step===s.id)&&addStep(s))n++});save();render();toast(n?"Added "+n+" habits. Start with one or two and archive the rest for later.":"Everything in your plan is already added.");return}
  if(D.stepskip){settings.plan[D.stepskip]="skip";save();render();return}
  if(D.stepun){delete settings.plan[D.stepun];save();render();return}
  if(b.hasAttribute("data-showhidden")){showHidden=!showHidden;render();return}
  if(b.hasAttribute("data-rough")){roughOpen=!roughOpen;render();return}
  if(b.hasAttribute("data-roughon")){settings.rough[TODAY()]=1;roughOpen=false;save();render();return}
  if(b.hasAttribute("data-roughoff")){delete settings.rough[TODAY()];save();render();return}
  if(b.hasAttribute("data-rest")){const n=restDay();settings.rough[TODAY()]=2;roughOpen=false;save();render();toast(n?"Rest day set. "+n+" habits are left out of today's totals.":"Rest day set.");return}
  if(b.hasAttribute("data-restundo")){undoRest();delete settings.rough[TODAY()];save();render();return}
  if(D.tiny){const h=habits.find(x=>x.id===D.tiny);if(h&&h.tiny){const was=isDone(h,D.d);if(tmValue(h))addEntry(h,D.d,{t:"",d:Math.round(h.tiny*unitMins(h)*60),man:1});else setVal(h,D.d,null,h.tiny);save();render();logHook(h,D.d,was)}return}
  if(b.hasAttribute("data-pdismiss")){settings.promptSeen=true;save();render();return}
  if(b.hasAttribute("data-coachtoggle")){settings.coachOn=settings.coachOn===false;save();render();return}
  if(b.hasAttribute("data-profreset")){destroy(()=>{settings.profile=null;settings.plan={};settings.reflections={};settings.rough={};settings.rest={}},"Your profile and guidance data were removed.");return}
  if(D.tpl){applyTpl(D.tpl);return}
  if(b.hasAttribute("data-notify")){
    if(typeof Notification==="undefined"){toast("Notifications are not available in this browser. Behind-schedule alerts still show on the Log tab.");return}
    Notification.requestPermission().then(p=>{settings.notify=p==="granted";save();render();toast(p==="granted"?"Notifications on. They only fire while this app is open.":"Notifications were not allowed.")}).catch(()=>toast("Notifications are not available here."));return}
  if(b.hasAttribute("data-notifyoff")){settings.notify=false;save();render();return}
  if(D.exp){const o=document.getElementById("out");
    if(D.exp==="json")o.value=JSON.stringify(exportObj(),null,2);
    else{const L=["date,habit,category,type,value,done,skipped,note"];habits.forEach(h=>{const cn=(cats.find(c=>c.id===h.cat)||{}).name||"";new Set([...Object.keys(h.done),...Object.keys(h.notes),...Object.keys(h.skip||{})]).forEach(d=>L.push([d,csvq(h.name),csvq(cn),h.type,dayVal(h,d)||"",isDone(h,d)?"yes":"no",skipped(h,d)?"yes":"",csvq(h.notes[d]||"")].join(",")))});o.value=L.join("\n")}
    o.focus();o.select();toast("Export ready. Copy the text above and save it somewhere safe.");return}
  if(b.hasAttribute("data-imp")){let p;try{p=JSON.parse(document.getElementById("out").value)}catch(x){toast("Import failed: the text is not valid JSON.");return}
    const a=Array.isArray(p)?p:p&&p.habits;if(!Array.isArray(a)||a.some(h=>!h||!h.id||!h.name||typeof h.done!=="object")){toast("Import failed: this does not look like a habit export.");return}
    destroy(()=>{habits=a;if(p&&Array.isArray(p.cats)&&p.cats.length)cats=p.cats;if(p&&p.settings)Object.assign(settings,p.settings)},"Imported "+a.length+" habits.");return}
  if(b.hasAttribute("data-dl")){try{const bl=new Blob([JSON.stringify(exportObj(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(bl);a.download="habit-tracker-"+TODAY()+".json";document.body.appendChild(a);a.click();a.remove();toast("Download started. If nothing downloads here, use Export JSON and copy the text.")}catch(x){toast("Download is not available here. Use Export JSON and copy the text.")}return}
  if(b.hasAttribute("data-sample")){destroy(()=>{habits=makeSample();cats=DEFAULT_CATS.map(c=>({...c}));settings.badges={};if(!settings.profile)settings.profile={name:"Sam",age:"23-29",role:"grad",focus:["career","skills","move","body","fun"],rel:"",kids:"",money:"",tone:"warm",at:TODAY()}},"Sample data loaded: 14 habits with about 6 months of history.");return}
  if(b.hasAttribute("data-clear")){destroy(()=>{habits=[];settings.badges={}},"All habits and history cleared.");return}
  if(b.hasAttribute("data-undo")){if(!snap)return;const s=JSON.parse(snap);habits=s.habits;cats=s.cats;Object.assign(settings,s.settings);if(s.stamps)SYNC.stamps=s.stamps;norm();save();render();toast("Restored.");return}
  if(b.classList.contains("chk")){armed=null;const h=habits.find(x=>x.id===D.id);if(!h)return;const was=isDone(h,D.d);
    if(D.slot){setVal(h,D.d,D.slot,(h.done[D.d]||{})[D.slot]?0:1)}else setVal(h,D.d,null,h.done[D.d]?0:1);
    save();render();logHook(h,D.d,was)}
});
/* ---- changes */
const startOk=v=>v>=addDays(TODAY(),-7)&&v<=addDays(TODAY(),7);
document.addEventListener("change",e=>{
  const i=e.target;
  if(i.id==="t"){document.getElementById("numopts").hidden=i.value!=="num";document.getElementById("timeopts").hidden=i.value!=="time";document.getElementById("sdwrap").hidden=i.value==="group";return}
  if(i.id==="kd"){const before=settings.keepDays||30;settings.keepDays=+i.value;compactEntries();save();render();toast(+i.value<before?"Timer entries older than "+i.value+" days were merged into daily totals.":"Detailed timer entries are now kept for "+i.value+" days.");return}
  if(i.id==="obn"){ob.a.name=i.value.trim().slice(0,30);return}
  if(i.id==="tonesel"){settings.profile.tone=i.value;save();render();return}
  if(i.dataset.refl){const k=i.dataset.refl,v=i.value.trim().slice(0,600);if(v)settings.reflections[k]=v;else delete settings.reflections[k];save();return}
  if(i.id==="ws"){settings.weekStart=+i.value;save();render();return}
  if(i.id==="wk"){settings.weekend=i.value.split(",").map(Number);save();render();return}
  if(i.id==="ro"){settings.rollover=+i.value;save();render();return}
  if(i.dataset.pi!==undefined){const idx=+i.dataset.pi,p=settings.periods[idx],f=i.dataset.pf,v=i.value.trim();if(!p)return;
    if(f==="name"){const err=periodNameError(idx,v);if(err){i.value=p.name;toast(err);return}p.name=v;save();render();return}
    if(f==="from"){const err=periodStartError(idx,v);if(err){i.value=p.from;toast(err);return}p.from=v;fixTo();save();render();return}
    return}
  if(i.id==="scope"){repScope=i.value;render();return}
  if(i.id==="calScope"){calScope=i.value;calPick=null;render();return}
  if(i.dataset.cf){const c=cats.find(x=>x.id===i.dataset.cid);if(!c)return;
    if(i.dataset.cf==="name"){const v=i.value.trim();if(!v){i.value=c.name;toast("A category needs a name.");return}const dup=catNameTaken(v,c.id);if(dup){i.value=c.name;toast("A category named “"+dup.name+"” already exists. Category names must be different.");return}c.name=v}
    else c.color=i.value;save();return}
  const h=habits.find(x=>x.id===i.dataset.id);if(!h)return;
  if(i.dataset.ef!==undefined){const es=(h.ent&&h.ent[i.dataset.d])||[],e=es[+i.dataset.ei];if(!e)return;
    if(i.dataset.ef==="t"){e.t=i.value||""}
    else{const m=parseFloat(i.value);if(!(m>=0.5&&m<=1440)){i.value=r1(e.d/60);toast("Minutes must be between 0.5 and 1440.");return}e.d=Math.round(m*60)}
    es.sort((p,q)=>(p.t||"").localeCompare(q.t||""));save();render();return}
  if(i.dataset.slby!==undefined){const s=(h.slots||[]).find(x=>x.id===i.dataset.slby);if(s){s.by=i.value;save()}return}
  if(i.dataset.f){const f=i.dataset.f,v=i.value.trim();
    if(f==="name"){if(!v){i.value=h.name;toast("A habit needs a name.");return}const dup=habitNameTaken(v,h.id);if(dup){i.value=h.name;toast(nameMsg(v,dup));return}h.name=v}
    else if(f==="desc"){if(v)h.desc=v;else delete h.desc}
    else if(f==="unit")h.unit=v;
    else if(f==="cat"){h.cat=v;if(h.type==="group")habits.forEach(k=>{if(k.parent===h.id)k.cat=v});save();render();return}
    else if(f==="parent"){const g=habits.find(x=>x.id===v);if(g){h.parent=g.id;h.cat=g.cat}else delete h.parent;save();render();return}
    else if(f==="freq"){h.freq=v==="days"?{t:"days",days:freq(h).days||[]}:v==="weekly"?{t:"weekly",n:freq(h).n||3}:{t:v};if(v==="weekly")delete h.by;save();render();return}
    else if(f==="fn"){const n=Math.min(7,Math.max(1,parseInt(v)||1));h.freq={t:"weekly",n};i.value=n}
    else if(f==="by"){if(v)h.by=v;else delete h.by}
    else if(f==="need"){const n=Math.min((h.slots||[]).length||1,Math.max(1,parseInt(v)||1));h.need=n;i.value=n}
    else if(f==="slots"){const names=v.split(",").map(s=>s.trim()).filter(Boolean),err=slotNamesError(names);if(err){i.value=(h.slots||[]).map(s=>s.name).join(", ");toast(err);return}if(names.length>=2&&h.timer){if(settings.run&&settings.run.id===h.id)runStop();delete h.timer;toast("Timer turned off: it is not available with several times a day.")}setSlots(h,names);save();render();return}
    else if(f==="timer"){if(i.checked)h.timer=true;else{if(settings.run&&settings.run.id===h.id)runStop();delete h.timer}save();render();return}
    else if(f==="tiny"){if(!v)delete h.tiny;else{const g=parseFloat(v);if(g>0&&(!h.target||g<h.target))h.tiny=g;else{toast("The small step must be smaller than your goal ("+h.target+"). Your earlier value was kept.");render();return}}save();render();return}
    else if(f==="mpu"){const g=parseFloat(v);if(g>0)h.mpu=g;else delete h.mpu}
    else if(f==="target"){if(h.type==="time"){if(v)h.target=v;else delete h.target}else{const g=parseFloat(v);if(g>0)h.target=g;else delete h.target}}
    save();return}
  if(i.hasAttribute("data-note")){if(i.value.trim())h.notes[i.dataset.d]=i.value.trim();else delete h.notes[i.dataset.d];save();return}
  if(i.dataset.slot&&i.type==="number"){const was=isDone(h,i.dataset.d);setVal(h,i.dataset.d,i.dataset.slot,parseFloat(i.value)||0);save();render();logHook(h,i.dataset.d,was);return}
  if(i.type==="number"){const was=isDone(h,i.dataset.d),v=parseFloat(i.value);setVal(h,i.dataset.d,null,v>0?v:0);save();render();logHook(h,i.dataset.d,was);return}
  if(i.type==="time"){const was=isDone(h,i.dataset.d);setVal(h,i.dataset.d,null,i.value);save();render();logHook(h,i.dataset.d,was)}
});
/* ---- submit */
document.addEventListener("submit",e=>{
  e.preventDefault();
  if(e.target.id==="cfm"){const v=document.getElementById("cn").value.trim();if(!v){catErr("Enter a name for the category.");return}const dup=catNameTaken(v);if(dup){catErr("A category named “"+dup.name+"” already exists. Category names must be different.");return}catErr("");cats.push({id:"c"+Date.now().toString(36),name:v,color:PAL[cats.length%PAL.length],icon:"📁"});save();render();return}
  const name=document.getElementById("n").value.trim();if(!name){formErr("Enter a name for the habit.");return}
  if(e.target.id==="f"){const dup=habitNameTaken(name);if(dup){formErr(nameMsg(name,dup));return}formErr("")}
  const type=document.getElementById("t").value,cat=document.getElementById("cat").value;
  let start=TODAY();
  if(type!=="group"){const v=document.getElementById("sd").value;if(v){if(!startOk(v)){toast("Start date can only be 7 days before or after today. It can’t be changed after the habit is added.");return}start=v}}
  const h={id:Date.now().toString(36),name,type,cat,color:PAL[habits.length%PAL.length],created:start,cycles:Math.max(1,start<=TODAY()?Math.ceil((dayDiff(start,TODAY())+1)/WINDOW):1),done:{},notes:{},freq:{t:"daily"}};
  const i=type==="group"?"📁":guessIcon(name);if(i)h.icon=i;
  if(type==="num"){h.unit=document.getElementById("u").value.trim();const g=parseFloat(document.getElementById("g").value);if(g>0)h.target=g}
  if(type==="time"){const tt=document.getElementById("tt").value;if(tt)h.target=tt}
  habits.push(h);editing=h.id;settings.hcollapsed[cat]=false;showNew=false;save();render();
  const el=document.querySelector(".edit");if(el)el.scrollIntoView({block:"center"});
  toast("Added. Set how often, several sessions a day, a finish-by time and more below.")});
setInterval(()=>{notifyBehind();const el=document.getElementById("behindbar");if(el&&view==="day"&&sel===TODAY())el.innerHTML=behindHtml()},60000);
setInterval(()=>{const el=document.getElementById("runel");if(el&&settings.run)el.textContent=fmtClock((Date.now()-settings.run.at)/1000)},1000);
checkBadges(true);
notifyBehind();
render();
