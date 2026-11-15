/* sync-ui.js: events for the Profile tab and the Send and Receive screens. Loaded after app.js.
   Uses its own data attributes (data-pa, data-pcol, data-ov) and ids (pf-*, ov-*) so it never collides with app.js. It uses no <form>,
   because app.js treats every form submit as "add a habit". */
let ov=null,ovStop=null,ovTimer=null,sendS=null,curPlan=null,recvFin=null;
const DENS={s:220,m:380,l:620};
function closeOv(){if(typeof lanClose==="function")lanClose();clearInterval(ovTimer);ovTimer=null;recvFin=null;if(ovStop){ovStop();ovStop=null}if(ov){ov.remove();ov=null}}
function openOv(html){closeOv();ov=document.createElement("div");ov.className="ov";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.innerHTML='<div class="ovc">'+html+"</div>";document.body.appendChild(ov);return ov}
const ovHtml=h=>{if(ov)ov.firstChild.innerHTML=h};
const ovq=s=>ov&&ov.querySelector(s);
const setAcct=fn=>{fn(ensureAccount());save();render()};
const optSel=(id,list,cur)=>'<select id="'+id+'">'+list.map(([x,l])=>'<option value="'+x+'"'+(String(cur)===String(x)?" selected":"")+">"+l+"</option>").join("")+"</select>";
/* ---- Send */
async function openSend(){
  const me=openOv('<h2>Send to another device</h2><p class="meta">Preparing your data…</p><button class="btn" data-ov="close">Cancel</button>');
  try{const payload=await syncPack(syncPacket());if(ov!==me)return;sendS={payload,i:0,paused:false,frames:[]};drawSend()}
  catch(e){if(ov===me)ovHtml('<h2>Could not prepare your data</h2><p class="err">'+esc(e.message)+'</p><button class="add" data-ov="close">Close</button>')}}
function drawSend(){
  const S=sendS,o=DEVICE.opts;S.frames=syncFrames(S.payload,DENS[o.density]||380);S.i=0;
  ovHtml('<h2>Send to another device</h2><p class="meta">On the other device open Profile, choose Receive from a device, and point its camera at this code. Keep both screens bright and steady. The frames can be scanned in any order.</p><canvas id="qrcv" class="qrcv" aria-label="Sync QR code"></canvas><div class="meta" id="qrinfo"></div>'
    +'<div class="cols"><div>'+optSel("ov-dens",[["s","Small"],["m","Medium"],["l","Large"]],o.density)+"</div><div>"+optSel("ov-speed",[[2,"2 a second"],[4,"4 a second"],[6,"6 a second"]],o.speed)+"</div></div>"
    +'<div class="row wrap"><button class="btn" data-ov="pause">Pause</button><button class="btn" data-ov="copy">Copy code</button><button class="btn" data-ov="file">Save file</button></div>'
    +'<details id="ov-codebox"><summary>Show code as text</summary><textarea id="ov-code" readonly aria-label="Sync code">'+esc(CODE_PREFIX+S.payload)+"</textarea></details>"
    +'<div class="row wrap"><button class="btn" data-ov="swap">Now receive from it</button><button class="add" data-ov="close">Done</button></div>');
  const cv=ovq("#qrcv"),info=ovq("#qrinfo");
  const show=()=>{try{QR.draw(cv,S.frames[S.i],440,0)}catch(e){info.textContent=e.message;return}info.textContent="Frame "+(S.i+1)+" of "+S.frames.length+(S.paused?" · paused":" · repeating")};
  show();clearInterval(ovTimer);
  ovTimer=setInterval(()=>{if(!document.getElementById("qrcv")){clearInterval(ovTimer);return}if(S.paused)return;S.i=(S.i+1)%S.frames.length;show()},1000/(+o.speed||4))}
/* ---- Receive */
async function openReceive(){
  const me=openOv('<h2>Receive from a device</h2><div class="vid"><video id="ov-video" muted playsinline></video></div><p class="meta" id="ov-status">Starting the camera…</p><div class="meter" style="--c:var(--moss)"><i id="ov-bar" style="width:0%"></i></div>'
    +'<details><summary>Paste a code or open a file instead</summary><textarea id="ov-paste" placeholder="Paste the sync code here" aria-label="Sync code"></textarea><div class="row wrap"><button class="btn" data-ov="read">Read pasted code</button><label class="btn">Open file<input id="ov-file" type="file" accept=".txt,text/plain" hidden></label></div></details>'
    +'<button class="btn" data-ov="close">Cancel</button>');
  const as=frameAssembler(),st=ovq("#ov-status"),bar=ovq("#ov-bar");let finished=false;
  recvFin=async payload=>{
    if(finished)return;finished=true;if(ovStop){ovStop();ovStop=null}
    try{showReview(syncPlan(await syncUnpack(payload)))}catch(e){finished=false;if(ov===me){st.textContent=e.message+" Scan again, or close and retry."}}};
  const onText=t=>{
    if(finished)return;
    if(/^(LOSYNC1:)?[zr][\w-]{40,}$/.test(String(t).trim())){recvFin(t);return}
    const r=as.add(t);
    if(r.bad==="checksum"){st.textContent="A frame was misread. Starting this code again.";bar.style.width="0%";return}
    if(r.bad)return;
    bar.style.width=Math.round(100*r.got/r.n)+"%";st.textContent="Got "+r.got+" of "+r.n+" frames"+(r.got<r.n?". Keep the camera on the code.":".");
    if(r.fresh&&navigator.vibrate)navigator.vibrate(8);
    if(r.done)recvFin(r.done)};
  const stop=await QRScan.start(ovq("#ov-video"),onText,m=>{if(ov===me){st.textContent=m;const v=ovq(".vid");if(v)v.hidden=true}});
  if(ov!==me||finished){stop();return}ovStop=stop;if(!ovq(".vid").hidden)st.textContent="Point the camera at the sending device."}
function showReview(plan){
  curPlan=plan;const f=plan.from,mm=plan.acct.mismatch,me=ensureAccount();
  ovHtml('<h2>Review before merging</h2><p><b>From:</b> '+esc(f.name)+(plan.acct.name?" · account “"+esc(plan.acct.name)+"”":"")+"</p>"
    +(mm?'<p class="cycbox">This device has a different account'+(me.name?" (“"+esc(me.name)+"”)":"")+". Merging links this device to the sender’s account and combines both sets of habits.</p>":"")
    +"<p>"+esc(planText(plan))+'</p><p class="hint">Nothing changes until you choose Merge, and you can undo it afterwards.</p>'
    +'<div class="row wrap">'+(plan.changes||mm?'<button class="add" data-ov="apply">'+(mm?"Link accounts and merge":"Merge")+"</button>":"")+'<button class="btn" data-ov="close">'+(plan.changes||mm?"Cancel":"Close")+"</button></div>")}
/* ---- clicks */
function ovAction(a){
  if(a==="close"){closeOv();return}
  if(a==="pause"&&sendS){sendS.paused=!sendS.paused;const b=ovq('[data-ov="pause"]');if(b)b.textContent=sendS.paused?"Resume":"Pause";const i=ovq("#qrinfo");if(i)i.textContent=i.textContent.replace(/ · .*$/,"")+(sendS.paused?" · paused":" · repeating");return}
  if(a==="copy"&&sendS){const text=CODE_PREFIX+sendS.payload;
    (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text):Promise.reject()).then(()=>toast("Sync code copied. Paste it on the other device under Receive.")).catch(()=>{const d=ovq("#ov-codebox");if(d)d.open=true;const t=ovq("#ov-code");if(t){t.focus();t.select()}toast("Copy was blocked. Select the code below and copy it by hand.")});return}
  if(a==="file"&&sendS){try{const bl=new Blob([CODE_PREFIX+sendS.payload],{type:"text/plain"}),l=document.createElement("a");l.href=URL.createObjectURL(bl);l.download="life-os-sync-"+TODAY()+".txt";document.body.appendChild(l);l.click();l.remove();toast("File saved. On the other device choose Receive, then Open file.")}catch(e){toast("Saving a file is not available here. Use Copy code.")}return}
  if(a==="swap"){openReceive();return}
  if(a==="sendback"){openSend();return}
  if(a==="read"&&recvFin){const t=ovq("#ov-paste").value;if(t.trim())recvFin(t);return}
  if(a==="apply"&&curPlan){
    const plan=curPlan,n=plan.changes;curPlan=null;
    destroy(()=>{syncApply(plan)},"Merged from "+plan.from.name+": "+n+(n===1?" change":" changes")+".");
    ovHtml('<h2>Merged</h2><p>'+esc(plan.from.name)+" is now merged into this device ("+n+(n===1?" change":" changes")+'). You can undo this from the message at the bottom for a few seconds.</p>'+(typeof viaLan!=="undefined"&&viaLan?'<p class="meta">Both devices sent each other their data over Wi-Fi, so there is nothing to send back. Merge on the other device too.</p><div class="row wrap"><button class="add" data-ov="close">Done</button></div>':'<p class="meta">If the other device should receive what only this one has, send it back now.</p><div class="row wrap"><button class="add" data-ov="sendback">Send mine back</button><button class="btn" data-ov="close">Done</button></div>'))}}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const D=b.dataset;
  if(D.pcol&&HEX.test(D.pcol)){setAcct(a=>{a.avatar.color=D.pcol});return}
  if(D.pa==="emoji"){setAcct(a=>{a.avatar.emoji=D.v;a.avatar.photo=false});return}
  if(D.pa==="nophoto"){setAcct(a=>{a.avatar.photo=false;delete settings.avatarImg});return}
  if(D.pa==="send"){openSend();return}
  if(D.pa==="receive"){openReceive();return}
  if(D.ov)ovAction(D.ov)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ov)closeOv()});
/* ---- changes */
function shrinkPhoto(file){
  return new Promise((ok,no)=>{const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{try{const s=96,cv=document.createElement("canvas"),m=Math.min(img.width,img.height);cv.width=cv.height=s;
      cv.getContext("2d").drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,s,s);URL.revokeObjectURL(url);ok(cv.toDataURL("image/jpeg",.72))}catch(x){no(x)}};
    img.onerror=()=>{URL.revokeObjectURL(url);no(new Error("bad image"))};img.src=url})}
document.addEventListener("change",async e=>{
  const i=e.target;
  if(i.id==="pf-name"){setAcct(a=>{a.name=i.value.trim().slice(0,40)});return}
  if(i.id==="pf-dev"){DEVICE.name=i.value.trim().slice(0,30);saveDevice();return}
  if(i.id==="pf-dens"||i.id==="ov-dens"){DEVICE.opts.density=i.value;saveDevice();if(i.id==="ov-dens"&&sendS)drawSend();else render();return}
  if(i.id==="pf-speed"||i.id==="ov-speed"){DEVICE.opts.speed=+i.value;saveDevice();if(i.id==="ov-speed"&&sendS)drawSend();else render();return}
  if(i.id==="pf-photosync"){DEVICE.opts.photo=i.checked;saveDevice();return}
  if(i.id==="pf-photo"&&i.files&&i.files[0]){
    try{const img=await shrinkPhoto(i.files[0]);settings.avatarImg=img;setAcct(a=>{a.avatar.photo=true})}catch(x){toast("That file could not be used as a photo.")}return}
  if(i.id==="ov-file"&&i.files&&i.files[0]&&recvFin){const r=new FileReader();r.onload=()=>recvFin(String(r.result||""));r.onerror=()=>toast("The file could not be read.");r.readAsText(i.files[0])}});
