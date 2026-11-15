/* qr.js: QR code encoder, canvas drawing and camera scanning, with no libraries and no internet.
   QR.make(text, ecl)        -> {size, ver, get(x,y)}   byte mode, ecl 0 = L (default), 1 = M, versions 1 to 40
   QR.draw(canvas, text, px) -> draws the code with its quiet zone on a white background
   QRScan.start(video, onText, onError) -> stops with the returned function; uses BarcodeDetector, or jsQR if vendor/jsqr.min.js exists
   The encoder follows the QR Model 2 standard (ISO/IEC 18004). */
const QR=(()=>{
  const ECC=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
             [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28]];
  const BLK=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
             [-1,1,1,2,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49]];
  const FMT=[1,0];
  const rawMods=v=>{let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r};
  const dataCW=(v,e)=>Math.floor(rawMods(v)/8)-ECC[e][v]*BLK[e][v];
  const gmul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z};
  const rsGen=d=>{const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=gmul(r[j],root);if(j+1<d)r[j]^=r[j+1]}root=gmul(root,2)}return r};
  const rsRem=(data,div)=>{const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=gmul(c,f)})}return r};
  const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  function make(text,ecl,forceMask){
    ecl=ecl||0;
    const bytes=[...new TextEncoder().encode(text)];
    let ver=1;
    for(;;ver++){if(ver>40)throw new Error("Too much data for one QR code.");if(4+(ver<10?8:16)+bytes.length*8<=dataCW(ver,ecl)*8)break}
    const bits=[],put=(v,k)=>{for(let i=k-1;i>=0;i--)bits.push((v>>>i)&1)},cap=dataCW(ver,ecl)*8;
    put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));
    put(0,Math.min(4,cap-bits.length));put(0,(8-bits.length%8)%8);
    for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
    const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=b<<1|bits[i+j];data.push(b)}
    const nb=BLK[ecl][ver],el=ECC[ecl][ver],raw=Math.floor(rawMods(ver)/8),ns=nb-raw%nb,sl=Math.floor(raw/nb),div=rsGen(el),blocks=[];
    for(let i=0,k=0;i<nb;i++){const d=data.slice(k,k+sl-el+(i<ns?0:1));k+=d.length;const e=rsRem(d,div);if(i<ns)d.push(0);blocks.push(d.concat(e))}
    const cw=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-el||j>=ns)cw.push(b[i])});
    const n=ver*4+17,M=[],F=[];
    for(let i=0;i<n;i++){M.push(new Array(n).fill(false));F.push(new Array(n).fill(false))}
    const set=(x,y,v)=>{M[y][x]=v;F[y][x]=true};
    for(let i=0;i<n;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<n&&y>=0&&y<n)set(x,y,d!==2&&d!==4)}};
    finder(3,3);finder(n-4,3);finder(3,n-4);
    const al=[6];
    if(ver>1){const na=Math.floor(ver/7)+2,step=ver===32?26:Math.ceil((ver*2+2)/(na-1))*2;for(let p=n-7;al.length<na;p-=step)al.splice(1,0,p)}
    else al.length=0;
    for(let i=0;i<al.length;i++)for(let j=0;j<al.length;j++){
      if((i===0&&j===0)||(i===0&&j===al.length-1)||(i===al.length-1&&j===0))continue;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(al[i]+dx,al[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
    const fmt=m=>{
      const d=FMT[ecl]<<3|m;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);
      const bs=(d<<10|r)^0x5412,g=i=>((bs>>>i)&1)!==0;
      for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
      for(let i=0;i<8;i++)set(n-1-i,8,g(i));for(let i=8;i<15;i++)set(8,n-15+i,g(i));set(8,n-8,true)};
    fmt(0);
    if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const bs=ver<<12|r;
      for(let i=0;i<18;i++){const b=((bs>>>i)&1)!==0,a=n-11+i%3,c=Math.floor(i/3);set(a,c,b);set(c,a,b)}}
    let bi=0;
    for(let right=n-1;right>=1;right-=2){if(right===6)right=5;
      for(let v=0;v<n;v++)for(let j=0;j<2;j++){const x=right-j,y=((right+1)&2)===0?n-1-v:v;
        if(!F[y][x]&&bi<cw.length*8){M[y][x]=((cw[bi>>>3]>>>(7-(bi&7)))&1)!==0;bi++}}}
    const apply=m=>{for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!F[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x]};
    const penalty=()=>{
      let s=0,dark=0;const lines=[];
      for(let y=0;y<n;y++){let r="",c="";for(let x=0;x<n;x++){r+=M[y][x]?1:0;c+=M[x][y]?1:0;if(M[y][x])dark++}lines.push(r,c)}
      lines.forEach(l=>{(l.match(/0{5,}|1{5,}/g)||[]).forEach(m=>{s+=m.length-2});s+=40*((l.match(/(?=10111010000|00001011101)/g)||[]).length)});
      for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])s+=3}
      return s+(Math.ceil(Math.abs(dark*20-n*n*10)/(n*n))-1)*10};
    let best=0,bs=Infinity;
    if(forceMask===undefined){for(let m=0;m<8;m++){apply(m);fmt(m);const p=penalty();if(p<bs){bs=p;best=m}apply(m)}}else best=forceMask;
    apply(best);fmt(best);
    return{size:n,ver,mask:best,get:(x,y)=>M[y][x]}}
  function draw(cv,text,px,ecl){
    const q=make(text,ecl||0),m=q.size+8,s=Math.max(2,Math.floor(px/m));
    cv.width=cv.height=m*s;const c=cv.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,cv.width,cv.height);c.fillStyle="#000";
    for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.get(x,y))c.fillRect((x+4)*s,(y+4)*s,s,s);
    return q}
  return{make,draw}})();

/* Camera scanning. BarcodeDetector is built into Chrome and Android browsers. Safari on iPhone does not have it, so the
   app looks for an optional jsQR file at vendor/jsqr.min.js (MIT licence, a single file). Without either, the Paste and File options still work. */
const QRScan=(()=>{
  let jsqrTry=null;
  const loadJsqr=()=>jsqrTry||(jsqrTry=new Promise(ok=>{
    if(typeof window.jsQR==="function")return ok(true);
    const s=document.createElement("script");s.src="vendor/jsqr.min.js";s.onload=()=>ok(typeof window.jsQR==="function");s.onerror=()=>ok(false);document.head.appendChild(s)}));
  async function engine(){
    try{if("BarcodeDetector" in window&&(await BarcodeDetector.getSupportedFormats()).includes("qr_code")){const d=new BarcodeDetector({formats:["qr_code"]});return async v=>{const r=await d.detect(v);return r.length?r[0].rawValue:null}}}catch(e){}
    if(await loadJsqr()){const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
      return async v=>{const w=v.videoWidth,h=v.videoHeight;if(!w)return null;const k=Math.min(1,640/w);cv.width=Math.round(w*k);cv.height=Math.round(h*k);cx.drawImage(v,0,0,cv.width,cv.height);
        const r=window.jsQR(cx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:"dontInvert"});return r?r.data:null}}
    return null}
  async function start(video,onText,onError){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){onError("The camera needs a secure page (https or localhost). Use Paste or File instead.");return()=>{}}
    const read=await engine();
    if(!read){onError("This browser cannot read QR codes from the camera. Use Paste or File instead, or add vendor/jsqr.min.js.");return()=>{}}
    let stream,live=true,busy=false,timer=null;
    try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});video.srcObject=stream;video.setAttribute("playsinline","");await video.play()}
    catch(e){onError("Camera not available: "+(e&&e.name==="NotAllowedError"?"permission was denied.":"it could not be started.")+" Use Paste or File instead.");return()=>{}}
    const stop=()=>{live=false;clearTimeout(timer);if(stream)stream.getTracks().forEach(t=>t.stop());video.srcObject=null};
    const tick=async()=>{if(!live)return;if(!busy){busy=true;try{const t=await read(video);if(t&&live)onText(t)}catch(e){}busy=false}timer=setTimeout(tick,90)};
    tick();return stop}
  return{start}})();
