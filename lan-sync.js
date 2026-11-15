/* lan-sync.js: connect two devices directly over the same Wi-Fi (WebRTC), with no server and no internet. Loaded after sync-ui.js.
   Setup is done once by scanning two QR codes (the connection offer and its answer). The QR codes carry the connection details, including the
   encryption fingerprint, so only the device you scanned can connect. After that both devices send each other their data over the encrypted
   channel and each shows the same review screen as the QR method before anything is merged.
   It needs both devices on one Wi-Fi network without "client isolation" (many guest networks and some hotspots block device-to-device traffic).
   If it cannot connect, the QR and text methods still work. Untested paths: real-network behaviour differs between routers and browsers. */
let LAN=null,viaLan=false;
const LAN_CHUNK=12000,lanSleep=ms=>new Promise(r=>setTimeout(r,ms));
function lanClose(){if(LAN){clearTimeout(LAN.timer);try{if(LAN.ch)LAN.ch.close()}catch(e){}try{LAN.pc.close()}catch(e){}LAN=null}viaLan=false}
const lanChunks=(text,size)=>{const n=Math.max(1,Math.ceil(text.length/size)),out=[];for(let i=0;i<n;i++)out.push("D|"+i+"|"+n+"|"+text.slice(i*size,(i+1)*size));return out};
function lanAssembler(){let parts=null,got=0,n=0;
  return m=>{const r=/^D\|(\d+)\|(\d+)\|([\s\S]*)$/.exec(String(m));if(!r)return null;const i=+r[1],k=+r[2];
    if(!k||k>5000||i>=k)return null;if(!parts||k!==n){parts={};got=0;n=k}
    if(parts[i]===undefined){parts[i]=r[3];got++}
    if(got<n)return null;let t="";for(let j=0;j<n;j++)t+=parts[j];parts=null;return t}}
const lanOk=()=>{if(typeof RTCPeerConnection==="undefined"){toast("This browser cannot connect over Wi-Fi. Use the QR method.");return false}return true};
const lanGathered=pc=>new Promise(ok=>{if(pc.iceGatheringState==="complete")return ok();const t=setTimeout(ok,5000);
  pc.addEventListener("icegatheringstatechange",()=>{if(pc.iceGatheringState==="complete"){clearTimeout(t);ok()}})});
const lanFail=()=>{if(ov)ovHtml('<h2>Could not connect</h2><p>The two devices could not reach each other. Check that both are on the same Wi-Fi network. Guest networks and some hotspots block device-to-device traffic. The QR method works on any network.</p><div class="row wrap"><button class="add" data-ov="close">Close</button></div>');lanClose()};
const lanWait=ms=>{if(LAN){clearTimeout(LAN.timer);LAN.timer=setTimeout(()=>{if(LAN&&!LAN.live)lanFail()},ms)}};
function lanWire(ch){
  LAN.ch=ch;const asm=lanAssembler();
  ch.onopen=async()=>{
    if(!LAN)return;clearTimeout(LAN.timer);LAN.live=true;viaLan=true;
    ovHtml('<h2>Connected</h2><p class="meta">Sending your data and waiting for the other device’s data…</p><button class="btn" data-ov="close">Cancel</button>');
    try{const parts=lanChunks(await syncPack(syncPacket()),LAN_CHUNK);
      for(const p of parts){while(ch.readyState==="open"&&ch.bufferedAmount>262144)await lanSleep(40);if(ch.readyState!=="open")return;ch.send(p)}}
    catch(e){if(ov)ovHtml('<h2>Could not send</h2><p class="err">'+esc(e.message)+'</p><button class="add" data-ov="close">Close</button>')}};
  ch.onmessage=async e=>{
    const t=asm(e.data);if(t===null)return;
    try{showReview(syncPlan(await syncUnpack(t)))}catch(x){if(ov)ovHtml('<h2>Could not read the data</h2><p class="err">'+esc(x.message)+'</p><button class="add" data-ov="close">Close</button>')}};
  ch.onclose=()=>{if(LAN&&LAN.live&&ov&&!curPlan&&!ovq("[data-ov=apply]")&&!ovq("[data-ov=sendback]"))toast("The Wi-Fi connection closed.")}}
/* Shows a connection code as a looping QR, with the code as text underneath. */
function lanShow(title,help,code,btn){
  const frames=syncFrames(code,300);let i=0;
  ovHtml('<h2>'+title+'</h2><p class="meta">'+help+'</p><canvas id="qrcv" class="qrcv" aria-label="Connection QR code"></canvas><div class="meta" id="qrinfo"></div>'
    +'<details id="ov-codebox"><summary>Show code as text</summary><textarea id="ov-code" readonly aria-label="Connection code">'+esc(CODE_PREFIX+code)+"</textarea></details>"
    +'<div class="row wrap">'+(btn?'<button class="add" data-lan="'+btn.id+'">'+btn.label+"</button>":"")+'<button class="btn" data-ov="close">Cancel</button></div>');
  const cv=ovq("#qrcv"),info=ovq("#qrinfo"),show=()=>{try{QR.draw(cv,frames[i],440,0)}catch(e){info.textContent=e.message;return}info.textContent=frames.length>1?"Frame "+(i+1)+" of "+frames.length+" · repeating":"One code"};
  show();clearInterval(ovTimer);if(frames.length>1)ovTimer=setInterval(()=>{if(!document.getElementById("qrcv")){clearInterval(ovTimer);return}i=(i+1)%frames.length;show()},350)}
/* Scans a connection code. kind is "offer" or "answer"; onObj gets the connection description. */
async function lanScan(title,help,kind,onObj){
  const me=ov;
  ovHtml('<h2>'+title+'</h2><p class="meta">'+help+'</p><div class="vid"><video id="ov-video" muted playsinline></video></div><p class="meta" id="ov-status">Starting the camera…</p><div class="meter" style="--c:var(--moss)"><i id="ov-bar" style="width:0%"></i></div>'
    +'<details><summary>Paste the code instead</summary><textarea id="ov-paste" placeholder="Paste the code here" aria-label="Connection code"></textarea><div class="row wrap"><button class="btn" data-ov="read">Read pasted code</button></div></details><button class="btn" data-ov="close">Cancel</button>');
  const as=frameAssembler(),st=ovq("#ov-status"),bar=ovq("#ov-bar");let finished=false;
  const fin=async payload=>{
    if(finished)return;finished=true;if(ovStop){ovStop();ovStop=null}
    try{const o=await syncUnpack(payload);
      if(!o||o.lan!==1||o.k!==kind||!o.d||o.d.type!==kind||typeof o.d.sdp!=="string"||o.d.sdp.length>20000)throw new Error(kind==="offer"?"That is not a Wi-Fi connection code from the first device.":"That is not the answer code from the second device.");
      await onObj(o.d)}
    catch(e){finished=false;if(ov===me&&ovq("#ov-status"))ovq("#ov-status").textContent=e.message+" Scan again."}};
  recvFin=fin;
  const onText=t=>{
    if(finished)return;
    if(/^(LOSYNC1:)?[zr][\w-]{40,}$/.test(String(t).trim())){fin(t);return}
    const r=as.add(t);if(r.bad==="checksum"){st.textContent="A frame was misread. Starting this code again.";bar.style.width="0%";return}if(r.bad)return;
    bar.style.width=Math.round(100*r.got/r.n)+"%";st.textContent="Got "+r.got+" of "+r.n+" frames.";if(r.fresh&&navigator.vibrate)navigator.vibrate(8);if(r.done)fin(r.done)};
  const stop=await QRScan.start(ovq("#ov-video"),onText,m=>{if(ov===me&&ovq("#ov-status")){ovq("#ov-status").textContent=m;const v=ovq(".vid");if(v)v.hidden=true}});
  if(ov!==me||finished){stop();return}ovStop=stop;if(ovq(".vid")&&!ovq(".vid").hidden)ovq("#ov-status").textContent="Point the camera at the code on the other device."}
/* ---- first device */
async function lanHost(){
  if(!lanOk())return;
  const me=openOv('<h2>Connect over Wi-Fi</h2><p class="meta">Preparing the connection…</p><button class="btn" data-ov="close">Cancel</button>');
  try{
    const pc=new RTCPeerConnection({iceServers:[]});LAN={pc,live:false,timer:null};
    lanWire(pc.createDataChannel("lifeos"));
    pc.onconnectionstatechange=()=>{if(LAN&&LAN.pc===pc&&pc.connectionState==="failed"&&!LAN.live)lanFail()};
    await pc.setLocalDescription(await pc.createOffer());await lanGathered(pc);
    const code=await syncPack({lan:1,k:"offer",d:{type:"offer",sdp:pc.localDescription.sdp}});
    if(ov!==me)return;
    lanShow("Step 1 of 2: show this code","On the other device open Profile and choose Join over Wi-Fi, then scan this code. When it shows its own code, tap the button below.",code,{id:"scananswer",label:"Next: scan its code"})}
  catch(e){if(ov===me)ovHtml('<h2>Could not start</h2><p class="err">'+esc(e.message)+'</p><button class="add" data-ov="close">Close</button>')}}
async function lanScanAnswer(){
  await lanScan("Step 2 of 2: scan its code","Point the camera at the code now shown on the other device.","answer",async d=>{
    if(!LAN)throw new Error("The connection was closed. Start again.");
    await LAN.pc.setRemoteDescription({type:"answer",sdp:d.sdp});
    ovHtml('<h2>Connecting…</h2><p class="meta">This takes a few seconds. Keep both screens on.</p><button class="btn" data-ov="close">Cancel</button>');lanWait(25000)})}
/* ---- second device */
async function lanJoin(){
  if(!lanOk())return;
  const me=openOv('<h2>Join over Wi-Fi</h2><p class="meta">Starting…</p><button class="btn" data-ov="close">Cancel</button>');
  await lanScan("Step 1 of 2: scan the first device","On the first device open Profile and choose Connect over Wi-Fi. Point this camera at the code it shows.","offer",async d=>{
    const pc=new RTCPeerConnection({iceServers:[]});lanClose();LAN={pc,live:false,timer:null};
    pc.ondatachannel=e=>lanWire(e.channel);
    pc.onconnectionstatechange=()=>{if(LAN&&LAN.pc===pc&&pc.connectionState==="failed"&&!LAN.live)lanFail()};
    await pc.setRemoteDescription({type:"offer",sdp:d.sdp});await pc.setLocalDescription(await pc.createAnswer());await lanGathered(pc);
    const code=await syncPack({lan:1,k:"answer",d:{type:"answer",sdp:pc.localDescription.sdp}});
    if(ov!==me)return;
    lanShow("Step 2 of 2: show this code","Hold this screen up so the first device can scan it. The connection starts by itself.",code,null);lanWait(60000)})}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const D=b.dataset;
  if(D.pa==="lanhost"){lanHost();return}
  if(D.pa==="lanjoin"){lanJoin();return}
  if(D.lan==="scananswer")lanScanAnswer()});
