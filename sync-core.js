/* sync-core.js: account, change stamps, merge and the sync packet format. No DOM access. Loaded after core.js and badges.js.

   HOW SYNC WORKS
   Every piece of data is a record with a key: one habit's settings (h|id), one day's value (d|id|date), a skip (k|), a note (n|),
   timer entries (e|), a category (c|), the order of habits and categories (o|h, o|c), some settings (s|name, m|map|key) and the profile (a|me).
   persist() calls syncStamp(), which compares each record with the last stamp and gives every changed record the time of the change.
   Deleted records leave a tombstone (a stamp with no value) so a deletion also travels. Nothing else in the app has to know about this.
   Merging two devices keeps, for each record, the newer stamp. Records that exist on only one device are added. Nothing is lost by syncing.
   Both devices must have the right time. Records stamped more than 5 minutes in the future are treated as "now".

   Account (settings.account, synced): {id, name, avatar:{emoji,color,photo}, created}. The photo itself is settings.avatarImg.
   Device (its own localStorage key, never synced or exported): {id, name, opts, last, log, devices, pending}.
   devices = trusted devices {id:{id,name,secret,kid,since,last}}. A shared 256-bit secret is created on the first send to a "new" device and travels inside that first
   (plain) code. The other side saves it when you merge; its reply, encrypted with the secret, makes the first device save the pairing too. Later codes between
   the two are AES-GCM encrypted, so they can go through any app (messages, email, share sheet, file) without exposing your data.
   Change stamps live in their own key too: KEY+"-sync" = {v:1, stamps:{recordKey:[time,hash]}} (hash 0 = deleted).

   Everything that arrives is checked and rebuilt field by field (cleanHabit, cleanValue). If you add a field to a habit, add it to cleanHabit,
   or it will not travel. Habit and category names are unique: see dedupeNames(). */
const SYNC_KEY=KEY+"-sync",DEV_KEY=KEY+"-device",CODE_PREFIX="LOSYNC1:",BASE_T=1,TOMB_DAYS=180;
const SYNC_SET=["profile","periods","weekStart","weekend","rollover","keepDays","coachOn","avatarImg"];
const SYNC_MAP=["plan","reflections","rough","rest","badges"];
const rid=n=>{let s="";try{const a=new Uint8Array(n);crypto.getRandomValues(a);a.forEach(x=>{s+=(x%36).toString(36)})}catch(e){while(s.length<n)s+=Math.random().toString(36).slice(2)}return s.slice(0,n)};
function cyrb53(s){let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}
  a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return 4294967296*(2097151&b)+(a>>>0)}
const canon=v=>typeof v!=="object"||v===null?JSON.stringify(v):JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,y)=>(o[y]=x[y],o),{}):x);
const vh=v=>cyrb53(canon(v))||1;
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
/* ---- stored state */
let SYNC={stamps:{},fresh:true},DEVICE=null;
try{const s=JSON.parse(localStorage.getItem(SYNC_KEY));if(s&&isObj(s.stamps)){SYNC.stamps=s.stamps;SYNC.fresh=false}}catch(e){}
const deviceGuess=()=>{const u=(typeof navigator!=="undefined"&&navigator.userAgent)||"";return /iPhone/.test(u)?"iPhone":/iPad/.test(u)?"iPad":/Android/.test(u)?"Android phone":/Mac/.test(u)?"Mac":/Windows/.test(u)?"Windows PC":/Linux/.test(u)?"Linux computer":"This device"};
try{DEVICE=JSON.parse(localStorage.getItem(DEV_KEY))}catch(e){DEVICE=null}
if(!isObj(DEVICE)||!DEVICE.id)DEVICE={id:"d"+rid(10),name:"",opts:{},last:null,log:[]};
DEVICE.opts=Object.assign({density:"m",speed:4,photo:false},isObj(DEVICE.opts)?DEVICE.opts:{});
if(!Array.isArray(DEVICE.log))DEVICE.log=[];
if(!isObj(DEVICE.devices))DEVICE.devices={};if(!isObj(DEVICE.pending))DEVICE.pending={};
const saveDevice=()=>{try{localStorage.setItem(DEV_KEY,JSON.stringify(DEVICE))}catch(e){}};
const writeStamps=()=>{try{localStorage.setItem(SYNC_KEY,JSON.stringify({v:1,stamps:SYNC.stamps}))}catch(e){}};
function ensureAccount(){
  let a=settings.account;
  if(!isObj(a)||!a.id){a={id:"a"+rid(12),name:(settings.profile&&settings.profile.name)||"",created:Date.now()};settings.account=a}
  if(!isObj(a.avatar))a.avatar={emoji:"🙂",color:PAL[0]};
  return a}
/* ---- records */
function syncFlat(){
  const F={};
  habits.forEach(h=>{
    const meta={};Object.keys(h).forEach(k=>{if(k!=="done"&&k!=="skip"&&k!=="notes"&&k!=="ent")meta[k]=h[k]});
    F["h|"+h.id]=meta;
    Object.keys(h.done||{}).forEach(d=>{F["d|"+h.id+"|"+d]=h.done[d]});
    Object.keys(h.skip||{}).forEach(d=>{F["k|"+h.id+"|"+d]=1});
    Object.keys(h.notes||{}).forEach(d=>{F["n|"+h.id+"|"+d]=h.notes[d]});
    Object.keys(h.ent||{}).forEach(d=>{F["e|"+h.id+"|"+d]=h.ent[d]})});
  cats.forEach(c=>{F["c|"+c.id]=c});
  F["o|h"]=habits.map(h=>h.id);F["o|c"]=cats.map(c=>c.id);
  SYNC_SET.forEach(k=>{if(settings[k]!==undefined&&settings[k]!==null)F["s|"+k]=settings[k]});
  SYNC_MAP.forEach(m=>{const o=settings[m];if(isObj(o))Object.keys(o).forEach(k=>{F["m|"+m+"|"+k]=o[k]})});
  if(settings.account)F["a|me"]=settings.account;
  return F}
/* Called by persist() before every save. The first run on a device stamps everything as old (BASE_T), so existing data never beats a real later edit. */
function syncStamp(){
  ensureAccount();
  const F=syncFlat(),S=SYNC.stamps,now=SYNC.fresh?BASE_T:Date.now(),lim=Date.now()-TOMB_DAYS*864e5;let dirty=SYNC.fresh;
  for(const k in F){const h=vh(F[k]),s=S[k];if(!s||s[1]!==h){S[k]=[now,h];dirty=true}}
  for(const k in S){if(k in F)continue;const s=S[k];if(s[1]!==0){S[k]=[now,0];dirty=true}else if(s[0]>BASE_T&&s[0]<lim){delete S[k];dirty=true}}
  SYNC.fresh=false;if(dirty)writeStamps()}
/* ---- checking what arrives */
const SAFE=/^[\w.:-]{1,40}$/,DATE=/^\d{4}-\d\d-\d\d$/,HEX=/^#[0-9a-fA-F]{6}$/,TIME=/^\d\d:\d\d$/,PROTO=/__proto__|constructor|prototype/;
const KEYRE=/^(?:[hc]\|[\w.:-]{1,40}|[dken]\|[\w.:-]{1,40}\|\d{4}-\d\d-\d\d|s\|(?:profile|periods|weekStart|weekend|rollover|keepDays|coachOn|avatarImg)|m\|(?:plan|reflections|rough|rest|badges)\|[\w.:-]{1,40}|o\|[hc]|a\|me)$/;
const num=(v,lo,hi)=>typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi;
const str=(v,n)=>typeof v==="string"?v.slice(0,n):"";
function cleanHabit(v,id){
  if(!isObj(v)||typeof v.name!=="string"||!["yes","num","time","group"].includes(v.type)||!DATE.test(v.created||""))return;
  const h={id,name:v.name.trim().slice(0,60)||"Habit",type:v.type,created:v.created,color:HEX.test(v.color)?v.color:PAL[0],cat:SAFE.test(v.cat||"")?v.cat:"other",cycles:num(v.cycles,1,60)?Math.floor(v.cycles):1};
  if(typeof v.desc==="string"&&v.desc)h.desc=v.desc.slice(0,300);
  if(typeof v.icon==="string"&&v.icon)h.icon=v.icon.slice(0,8);
  if(SAFE.test(v.parent||""))h.parent=v.parent;
  if(typeof v.unit==="string")h.unit=v.unit.slice(0,14);
  if(num(v.mpu,0,1440)&&v.mpu>0)h.mpu=v.mpu;
  if(h.type==="time"){if(TIME.test(v.target||""))h.target=v.target}else if(num(v.target,0,1e6)&&v.target>0)h.target=v.target;
  if(num(v.tiny,0,1e6)&&v.tiny>0)h.tiny=v.tiny;
  if(isObj(v.freq)&&["daily","weekdays","weekends","days","weekly"].includes(v.freq.t)){const f={t:v.freq.t};
    if(f.t==="days")f.days=(Array.isArray(v.freq.days)?v.freq.days:[]).filter(x=>Number.isInteger(x)&&x>=0&&x<=6);
    if(f.t==="weekly")f.n=Math.min(7,Math.max(1,Math.floor(v.freq.n)||1));h.freq=f}
  if(SAFE.test(v.by||""))h.by=v.by;
  if(Array.isArray(v.slots)&&v.slots.length>1&&v.slots.length<=12&&v.slots.every(s=>isObj(s)&&SAFE.test(s.id||"")&&typeof s.name==="string")){
    h.slots=v.slots.map(s=>({id:s.id,name:s.name.slice(0,30),by:SAFE.test(s.by||"")?s.by:""}));if(num(v.need,1,12))h.need=Math.floor(v.need)}
  if(v.archived)h.archived=true;if(v.timer)h.timer=true;if(SAFE.test(v.step||""))h.step=v.step;
  return h}
/* Returns the cleaned value, or undefined when the record is not acceptable. */
function cleanValue(k,v){
  const t=k[0];
  if(t==="h")return cleanHabit(v,k.slice(2));
  if(t==="c"){if(!isObj(v)||typeof v.name!=="string"||!v.name.trim()||!HEX.test(v.color))return;return{id:k.slice(2),name:v.name.trim().slice(0,30),color:v.color,icon:str(v.icon,8)}}
  if(t==="d"){
    if(num(v,0,1e7))return v;if(typeof v==="string")return TIME.test(v)?v:undefined;
    if(isObj(v)){const o={};for(const s in v){if(!SAFE.test(s)||!num(v[s],0,1e7))return;o[s]=v[s]}return Object.keys(o).length?o:undefined}return}
  if(t==="k")return v===1?1:undefined;
  if(t==="n")return typeof v==="string"&&v&&v.length<=400?v:undefined;
  if(t==="e"){if(!Array.isArray(v)||!v.length||v.length>200)return;const out=[];
    for(const e of v){if(!isObj(e)||!num(e.d,1,86400*2)||(e.t&&!TIME.test(e.t)))return;const x={t:e.t||"",d:e.d};if(e.man)x.man=1;if(e.c)x.c=1;out.push(x)}return out}
  if(t==="o")return Array.isArray(v)&&v.length<=500&&v.every(x=>typeof x==="string"&&SAFE.test(x))?v:undefined;
  if(t==="a"){if(!isObj(v)||!SAFE.test(v.id||"")||!isObj(v.avatar))return;const a=v.avatar;
    return{id:v.id,name:str(v.name,40),created:num(v.created,0,4e12)?v.created:Date.now(),avatar:{emoji:str(a.emoji,8),color:HEX.test(a.color)?a.color:PAL[0],photo:!!a.photo}}}
  if(t==="m"){const m=k.split("|")[1];
    if(m==="plan")return typeof v==="string"&&SAFE.test(v)?v:undefined;
    if(m==="reflections")return typeof v==="string"&&v&&v.length<=600?v:undefined;
    if(m==="rough")return v===1||v===2?v:undefined;
    if(m==="rest")return Array.isArray(v)&&v.length<=200&&v.every(x=>typeof x==="string"&&SAFE.test(x))?v:undefined;
    if(m==="badges")return typeof v==="string"&&DATE.test(v)?v:undefined;return}
  if(t==="s"){const n=k.slice(2);
    if(n==="avatarImg")return typeof v==="string"&&v.length<80000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)?v:undefined;
    if(n==="profile"){if(!isObj(v))return;const p={name:str(v.name,30),age:str(v.age,10),role:str(v.role,12),focus:(Array.isArray(v.focus)?v.focus:[]).filter(x=>typeof x==="string"&&SAFE.test(x)).slice(0,5),rel:str(v.rel,12),kids:str(v.kids,12),money:str(v.money,12),tone:str(v.tone,12),at:DATE.test(v.at||"")?v.at:TODAY()};return p}
    if(n==="periods"){if(!Array.isArray(v)||v.length<2||v.length>12)return;const o=[];for(const p of v){if(!isObj(p)||!SAFE.test(p.id||"")||typeof p.name!=="string"||!TIME.test(p.from||"")||!TIME.test(p.to||""))return;o.push({id:p.id,name:p.name.slice(0,20),from:p.from,to:p.to})}return o}
    if(n==="weekend")return Array.isArray(v)&&v.length<=7&&v.every(x=>Number.isInteger(x)&&x>=0&&x<=6)?v:undefined;
    if(n==="coachOn")return typeof v==="boolean"?v:undefined;
    if(n==="weekStart")return Number.isInteger(v)&&v>=0&&v<=6?v:undefined;
    if(n==="rollover")return Number.isInteger(v)&&v>=0&&v<=6?v:undefined;
    if(n==="keepDays")return Number.isInteger(v)&&v>=1&&v<=365?v:undefined}}
/* ---- packets */
function syncPacket(o){
  o=Object.assign({},DEVICE.opts,o||{});
  syncStamp();
  const F=syncFlat(),S=SYNC.stamps,g={};let n=0;
  for(const k in S){
    if(!o.photo&&k==="s|avatarImg")continue;
    const s=S[k];(g[s[0]]=g[s[0]]||[]).push(s[1]===0?[k]:[k,F[k]]);n++}
  const a=ensureAccount();
  const pkt={app:"lifeos",v:1,acct:a.id,an:a.name,dev:DEVICE.id,dn:DEVICE.name||deviceGuess(),at:Date.now(),n,r:g};
  if(o.pairSecret)pkt.pair={secret:o.pairSecret};
  return pkt}
const b64u=bytes=>{let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const unb64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const pipeBytes=async(bytes,T)=>new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new T("gzip"))).arrayBuffer());
/* Text form of a packet: "z" + compressed (or "r" + raw when the browser cannot compress) + base64url. */
async function syncPack(pkt){
  const raw=new TextEncoder().encode(JSON.stringify(pkt));
  return typeof CompressionStream==="function"?"z"+b64u(await pipeBytes(raw,CompressionStream)):"r"+b64u(raw)}
const cryptoOk=()=>typeof crypto!=="undefined"&&!!crypto.subtle;
const kidOf=secret=>cyrb53(secret).toString(36).padStart(11,"0").slice(0,11);
const newSecret=()=>b64u(crypto.getRandomValues(new Uint8Array(32)));
const keyCache={};
const aesKey=async secret=>keyCache[secret]||(keyCache[secret]=await crypto.subtle.importKey("raw",unb64u(secret),"AES-GCM",false,["encrypt","decrypt"]));
/* Encrypted text form: "e" + key id (11) + iv (16) + ciphertext. AES-GCM, so a changed or forged code is rejected. */
async function syncEncrypt(pkt,secret){
  const raw=new TextEncoder().encode(JSON.stringify(pkt)),z=typeof CompressionStream==="function",body=z?await pipeBytes(raw,CompressionStream):raw,pt=new Uint8Array(body.length+1);
  pt[0]=z?1:0;pt.set(body,1);
  const iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await aesKey(secret),pt));
  return"e"+kidOf(secret)+b64u(iv)+b64u(ct)}
async function syncUnpack(text){
  text=String(text||"").trim();if(text.startsWith(CODE_PREFIX))text=text.slice(CODE_PREFIX.length);
  if(!/^[zre][\w-]+$/.test(text))throw new Error("This is not a Life OS sync code.");
  let raw,auth=null;
  if(text[0]==="e"){
    if(!cryptoOk())throw new Error("Encrypted codes need a secure page (https or localhost).");
    const kid=text.slice(1,12),rec=Object.values(DEVICE.devices).find(d=>d.kid===kid),pend=DEVICE.pending[kid],secret=rec?rec.secret:pend?pend.secret:null;
    if(!secret)throw new Error("This code is encrypted for a pairing this device does not have. Send from the other device to a new device first, or forget the old pairing there.");
    let pt;try{pt=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64u(text.slice(12,28))},await aesKey(secret),unb64u(text.slice(28))))}
    catch(e){throw new Error("The code could not be decrypted. It may be damaged, cut short or from an old pairing.")}
    if(pt[0]===1){if(typeof DecompressionStream!=="function")throw new Error("This browser cannot open compressed sync codes. Use a newer browser.");raw=await pipeBytes(pt.subarray(1),DecompressionStream)}else raw=pt.subarray(1);
    auth={kid,secret,device:rec||null,pending:!rec}}
  else{
    const b=unb64u(text.slice(1));
    if(text[0]==="z"){if(typeof DecompressionStream!=="function")throw new Error("This browser cannot open compressed sync codes. Use a newer browser.");raw=await pipeBytes(b,DecompressionStream)}else raw=b}
  let p;try{p=JSON.parse(new TextDecoder().decode(raw))}catch(e){throw new Error("The sync code is damaged. Try again.")}
  if(isObj(p)){delete p._auth;if(auth)p._auth=auth}
  return p}
/* Builds the text for a send. target: null = plain, "new" = plain and offers to be remembered, or a trusted device id = encrypted for that device. */
async function syncPayloadFor(target){
  if(target&&target!=="new"){
    const d=DEVICE.devices[target];if(!d)throw new Error("That device is no longer in your list.");
    if(!cryptoOk())throw new Error("Encryption needs a secure page (https or localhost). Use a plain send instead.");
    return syncEncrypt(syncPacket(),d.secret)}
  if(target==="new"&&cryptoOk()){
    const secret=newSecret(),kid=kidOf(secret),old=Date.now()-7*864e5;
    DEVICE.pending[kid]={secret,at:Date.now()};
    Object.keys(DEVICE.pending).sort((a,b)=>DEVICE.pending[b].at-DEVICE.pending[a].at).forEach((k,i)=>{if(i>=5||DEVICE.pending[k].at<old)delete DEVICE.pending[k]});
    saveDevice();return syncPack(syncPacket({pairSecret:secret}))}
  return syncPack(syncPacket())}
const forgetDevice=id=>{delete DEVICE.devices[id];saveDevice()};
const deviceList=()=>Object.values(DEVICE.devices).sort((a,b)=>((b.last&&b.last.at)||0)-((a.last&&a.last.at)||0));
/* ---- QR frames: LOS1|session|index|count|checksum|data. Frames can be scanned in any order and repeats are ignored. */
function syncFrames(payload,size){
  const n=Math.ceil(payload.length/size),sid=rid(4),chk=cyrb53(payload).toString(36),out=[];
  for(let i=0;i<n;i++)out.push("LOS1|"+sid+"|"+i+"|"+n+"|"+chk+"|"+payload.slice(i*size,(i+1)*size));
  return out}
function frameAssembler(){
  let cur=null;
  return{
    reset(){cur=null},
    add(t){
      const m=/^LOS1\|(\w+)\|(\d+)\|(\d+)\|(\w+)\|([\w-]*)$/.exec(String(t).trim());if(!m)return{bad:"notframe"};
      const sid=m[1],i=+m[2],n=+m[3],chk=m[4];
      if(!n||n>2000||i>=n)return{bad:"notframe"};
      if(!cur||cur.sid!==sid)cur={sid,n,chk,parts:{},got:0};
      if(n!==cur.n)return{bad:"notframe"};
      let fresh=false;if(cur.parts[i]===undefined){cur.parts[i]=m[5];cur.got++;fresh=true}
      const st={got:cur.got,n:cur.n,fresh,have:Object.keys(cur.parts).map(Number)};
      if(cur.got===cur.n){let p="";for(let k=0;k<cur.n;k++)p+=cur.parts[k];
        if(cyrb53(p).toString(36)!==cur.chk){cur=null;return{bad:"checksum"}}
        st.done=p}
      return st}}}
/* ---- merging */
function syncPlan(p){
  if(!isObj(p)||p.app!=="lifeos"||p.v!==1||!isObj(p.r))throw new Error("This is not a Life OS sync code, or it comes from a newer version of the app.");
  const S=SYNC.stamps,F=syncFlat(),maxT=Date.now()+300000,take=[],sum={newHabits:[],goneHabits:[],entries:0,other:0,same:0},me=ensureAccount();
  for(const ts in p.r){
    const t=Math.min(+ts,maxT);if(!(t>=0)||!Array.isArray(p.r[ts]))continue;
    p.r[ts].forEach(rec=>{
      if(!Array.isArray(rec)||typeof rec[0]!=="string")return;
      const k=rec[0];if(!KEYRE.test(k)||PROTO.test(k))return;
      const tomb=rec.length<2;let v;
      if(!tomb){v=cleanValue(k,rec[1]);if(v===undefined)return}
      const h=tomb?0:vh(v),l=S[k];
      if(l&&(l[0]>t||(l[0]===t&&l[1]>=h)))return;
      const had=F[k]!==undefined,diff=tomb?had:(!had||canon(F[k])!==canon(v));
      take.push({k,t,tomb,v,diff});
      if(!diff){sum.same++;return}
      if(k[0]==="h"){if(tomb)sum.goneHabits.push((habits.find(x=>x.id===k.slice(2))||{}).name||"a habit");else if(!had)sum.newHabits.push(v.name)}
      else if("dkne".includes(k[0]))sum.entries++;else sum.other++})}
  const fromId=str(p.dev,20),au=isObj(p._auth)?p._auth:null,okId=/^d[a-z0-9]{3,19}$/.test(fromId)&&fromId!==DEVICE.id,fname=str(p.dn,40)||"another device";
  const pairSecret=isObj(p.pair)&&typeof p.pair.secret==="string"&&/^[\w-]{43}$/.test(p.pair.secret)?p.pair.secret:null;
  return{take,sum,pairNew:!au&&pairSecret&&okId&&cryptoOk()?{id:fromId,name:fname,secret:pairSecret}:null,promote:au&&au.pending&&okId?{id:fromId,name:fname,secret:au.secret}:null,trusted:au&&au.device?au.device:null,from:{id:fromId,name:fname,at:+p.at||0},acct:{id:str(p.acct,40),name:str(p.an,40),mismatch:!!p.acct&&p.acct!==me.id},changes:take.filter(x=>x.diff).length}}
const planText=pl=>{
  const s=pl.sum,b=[];
  if(s.newHabits.length)b.push("adds "+s.newHabits.length+(s.newHabits.length===1?" habit":" habits")+" ("+s.newHabits.slice(0,4).join(", ")+(s.newHabits.length>4?", …":"")+")");
  if(s.goneHabits.length)b.push("removes "+s.goneHabits.length+(s.goneHabits.length===1?" habit":" habits")+" ("+s.goneHabits.slice(0,4).join(", ")+(s.goneHabits.length>4?", …":"")+")");
  if(s.entries)b.push("changes "+s.entries+" daily "+(s.entries===1?"record":"records"));
  if(s.other)b.push("updates "+s.other+" "+(s.other===1?"setting or detail":"settings and details"));
  return b.length?"This "+b.join(", ")+".":"Nothing to change. This device already has everything in the code."}
/* Names must be unique. When two devices add different habits with the same name, the habit with the smaller id keeps the name and the
   other becomes "Name (2)". Every device reaches the same result, so the devices settle on the same names after one exchange. */
function dedupeNames(list){
  const seen=new Set();
  list.slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).forEach(x=>{
    let n=String(x.name),base=n.slice(0,54),k=2;
    while(seen.has(normName(n)))n=base+" ("+k+++")";
    x.name=n;seen.add(normName(n))})}
/* Applies a plan. Call it inside destroy() so the user can undo. Returns the number of records that changed something. */
function syncApply(plan){
  const by={};plan.take.forEach(r=>{(by[r.k[0]]=by[r.k[0]]||[]).push(r)});
  const done=[],H=id=>habits.find(x=>x.id===id),ok=r=>done.push(r);
  (by.s||[]).forEach(r=>{const n=r.k.slice(2);
    if(r.tomb){if(n==="profile")settings.profile=null;else if(n==="avatarImg")delete settings.avatarImg;ok(r);return}
    settings[n]=r.v;ok(r)});
  (by.m||[]).forEach(r=>{const[,m,key]=r.k.split("|");settings[m]=isObj(settings[m])?settings[m]:{};
    if(r.tomb)delete settings[m][key];else settings[m][key]=r.v;ok(r)});
  (by.c||[]).forEach(r=>{const id=r.k.slice(2),c=cats.find(x=>x.id===id);
    if(r.tomb){if(c&&cats.length>1)cats.splice(cats.indexOf(c),1);ok(r);return}
    if(c)Object.assign(c,r.v);else cats.push(Object.assign({},r.v));ok(r)});
  (by.h||[]).forEach(r=>{const id=r.k.slice(2),h=H(id);
    if(r.tomb){if(h)habits.splice(habits.indexOf(h),1);ok(r);return}
    const meta=Object.assign({},r.v);
    if(h){const keep={done:h.done,skip:h.skip,notes:h.notes,ent:h.ent};Object.keys(h).forEach(x=>{delete h[x]});Object.assign(h,meta);Object.keys(keep).forEach(x=>{if(keep[x]!==undefined)h[x]=keep[x]})}
    else habits.push(Object.assign(meta,{done:{},notes:{}}));ok(r)});
  habits.forEach(h=>{if(h.parent&&!H(h.parent))delete h.parent});
  dedupeNames(habits);dedupeNames(cats);
  const kinds={d:"done",k:"skip",n:"notes",e:"ent"};
  ["d","k","n","e"].forEach(t=>(by[t]||[]).forEach(r=>{
    const[,id,date]=r.k.split("|"),h=H(id);if(!h)return;const f=kinds[t];
    if(r.tomb){if(h[f]){delete h[f][date];if(f==="ent"&&!Object.keys(h.ent).length)delete h.ent}ok(r);return}
    h[f]=isObj(h[f])?h[f]:{};h[f][date]=r.v;ok(r)}));
  (by.o||[]).forEach(r=>{if(r.tomb)return;const list=r.k==="o|h"?habits:cats,pos={};r.v.forEach((id,i)=>{pos[id]=i});
    const ord=list.map((x,i)=>({x,i,p:pos[x.id]===undefined?1e9+i:pos[x.id]})).sort((a,b)=>a.p-b.p).map(o=>o.x);list.splice(0,list.length,...ord);ok(r)});
  (by.a||[]).forEach(r=>{if(r.tomb)return;if(plan.acct.mismatch||settings.account.id===r.v.id){settings.account=Object.assign({},r.v);ok(r)}});
  if(plan.acct.mismatch&&plan.acct.id&&settings.account)settings.account.id=plan.acct.id;
  norm();
  const F=syncFlat(),S=SYNC.stamps;
  done.forEach(r=>{if(r.tomb){if(!(r.k in F))S[r.k]=[r.t,0]}else if(r.k in F&&canon(F[r.k])===canon(r.v))S[r.k]=[r.t,vh(F[r.k])]});
  writeStamps();
  const pn=plan.pairNew||plan.promote;
  if(pn){DEVICE.devices[pn.id]={id:pn.id,name:pn.name,secret:pn.secret,kid:kidOf(pn.secret),since:Date.now(),last:{at:Date.now(),n:plan.changes}};delete DEVICE.pending[kidOf(pn.secret)]}
  else if(plan.trusted&&DEVICE.devices[plan.trusted.id]){const d=DEVICE.devices[plan.trusted.id];d.name=plan.from.name||d.name;d.last={at:Date.now(),n:plan.changes}}
  DEVICE.last={at:Date.now(),from:plan.from.name,n:plan.changes};DEVICE.log.unshift(DEVICE.last);DEVICE.log.length=Math.min(DEVICE.log.length,5);saveDevice();
  return plan.changes}
syncStamp();persist();
