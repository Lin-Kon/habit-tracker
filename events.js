/* events.js: click and change handling for Home, timers, goals, habit views and pomodoro settings. Loaded before app.js; app.js ignores these data attributes. */
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const D=b.dataset,P=settings.pomo;
  if(D.xstart){const h=habits.find(x=>x.id===D.xstart);if(h&&canTime(h))startPrimary(h);return}
  if(b.hasAttribute("data-xend")){const r=endSession();save();render();if(r)toast(savedMsg(r));return}
  if(D.xbg){const h=habits.find(x=>x.id===D.xbg);if(h&&canTime(h)){if(startBg(h)){save();render();toast(h.name+" is running in the background.")}else toast("Start a main timer first.")}return}
  if(b.hasAttribute("data-xbgstop")){const r=stopBg();save();render();if(r)toast(savedMsg(r));return}
  if(b.hasAttribute("data-xpomo")){
    P.on=!P.on;
    if(P.on&&settings.run){const h=runH();runStop();runStart(h)}
    else if(!P.on){P.phase=null;P.brk=null}
    save();render();return}
  if(b.hasAttribute("data-xpnext")){const h=P.brk&&habits.find(x=>x.id===P.brk.hid);P.brk=null;if(h)startPrimary(h);else{save();render()}return}
  if(b.hasAttribute("data-xorphyes")){const h=promoteBg();save();render();if(h)toast(h.name+" is now your main task.");return}
  if(b.hasAttribute("data-xorphno")){const r=stopBg();save();render();if(r)toast(savedMsg(r));return}
  if(D.xhvm){settings.hv.mode=D.xhvm;save();render();return}
  /* goals */
  if(b.hasAttribute("data-xgnew")){gNew=!gNew;render();return}
  if(b.hasAttribute("data-xgsave")){
    const n=document.getElementById("xg-name").value.trim();if(!n){toast("Enter a name for the goal.");return}
    const g={id:gid(),name:n,desc:document.getElementById("xg-desc").value.trim(),due:document.getElementById("xg-due").value||"",status:"active",created:TODAY(),obj:[]};
    gl().push(g);gOpen=g.id;gNew=false;gObjNew=g.id;save();render();toast("Goal added. Now add an objective you can measure.");return}
  if(D.xgopen){gOpen=gOpen===D.xgopen?null:D.xgopen;gObjNew=null;gArm=null;render();return}
  if(D.xgstat){const g=gl().find(x=>x.id===D.xg);if(g){g.status=D.xgstat;save();render()}return}
  if(D.xgdel){
    if(gArm!=="g"+D.xgdel){gArm="g"+D.xgdel;render();return}
    gArm=null;const g=gl().find(x=>x.id===D.xgdel);if(!g)return;
    destroy(()=>{const ids=g.obj.map(o=>o.id);habits.forEach(h=>{if(ids.includes(h.obj))delete h.obj});settings.goals=gl().filter(x=>x!==g);if(gOpen===g.id)gOpen=null},"Goal deleted.");return}
  if(D.xonew){gObjNew=gObjNew===D.xonew?null:D.xonew;render();return}
  if(D.xosave){
    const g=gl().find(x=>x.id===D.xosave);if(!g)return;
    const n=document.getElementById("xo-name").value.trim(),mode=document.getElementById("xo-mode").value,tg=parseFloat(document.getElementById("xo-target").value);
    if(!n){toast("Enter a name for the objective.");return}
    if(mode!=="check"&&!(tg>0)){toast("Enter a target above 0.");return}
    const o={id:gid(),name:n,mode,created:TODAY(),due:document.getElementById("xo-due").value||""};
    if(mode!=="check")o.target=tg;if(mode==="num"){o.unit=document.getElementById("xo-unit").value.trim();o.cur=0}
    g.obj.push(o);gObjNew=null;save();render();return}
  if(D.xocheck){const f=findObj(D.xocheck);if(f){f.o.done=!f.o.done;save();render()}return}
  if(D.xodel){
    if(gArm!=="o"+D.xodel){gArm="o"+D.xodel;render();return}
    gArm=null;const f=findObj(D.xodel);if(!f)return;
    destroy(()=>{f.g.obj=f.g.obj.filter(x=>x!==f.o);habits.forEach(h=>{if(h.obj===f.o.id)delete h.obj})},"Objective deleted.")}
});
document.addEventListener("change",e=>{
  const i=e.target,D=i.dataset;
  if(i.id==="hvsort"){settings.hv.sort=i.value;save();render();return}
  if(i.id==="xhsel"){const h=habits.find(x=>x.id===i.value);if(h&&canTime(h))startPrimary(h);return}
  if(i.id==="xbgsel"){const h=habits.find(x=>x.id===i.value);if(h&&canTime(h)){h.bg=true;if(startBg(h)){save();render();toast(h.name+" is running in the background.")}else{save();render();toast("Start a main timer first.")}}return}
  if(D.xpset){
    const P=settings.pomo,k=D.xpset;
    if(k==="bgKeep")P.bgKeep=i.checked;
    else{const lim={focus:[5,120],short:[1,60],long:[5,60],every:[2,10]}[k],v=Math.min(lim[1],Math.max(lim[0],Math.round(+i.value)||lim[0]));P[k]=v;i.value=v}
    save();return}
  if(D.xcur){const f=findObj(D.xcur);if(f){f.o.cur=Math.max(0,parseFloat(i.value)||0);save();render()}return}
  if(D.f==="bg"){const h=habits.find(x=>x.id===D.id);if(h){if(i.checked)h.bg=true;else{delete h.bg;if(settings.bg&&settings.bg.id===h.id)stopBg()}save();render()}return}
  if(D.f==="obj"){const h=habits.find(x=>x.id===D.id);if(h){if(i.value)h.obj=i.value;else delete h.obj;save();render()}}
});
