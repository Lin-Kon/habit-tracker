/* sample.js: seeded sample-data generator for testing (14 habits, about 6 months: groups, sessions, skips, deadlines, mixed frequencies). Same history on every load. */
function makeSample(){
  let s=20260107;
  const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const t=TODAY(),notes=["Felt great","Low energy but did it","Short session","Good focus","Interrupted","Best one this week","Hard to start","Easy today"];
  const defs=[
    {name:"BCS English",cat:"study",type:"group",start:90},
    {name:"English grammar",cat:"study",type:"num",unit:"minutes",target:45,parent:"BCS English",by:"morning",desc:"Finish one grammar chapter or 25 questions before noon.",freq:{t:"weekdays"},start:90,base:.7,gain:.15,we:0,lo:30,hi:70},
    {name:"English literature",cat:"study",type:"num",unit:"minutes",target:30,parent:"BCS English",by:"afternoon",freq:{t:"weekdays"},start:90,base:.65,gain:.15,we:0,lo:20,hi:60},
    {name:"Wake up",cat:"self",type:"time",target:"06:30",start:150,mean:405,sd:50,gain:30},
    {name:"Bedtime",cat:"self",type:"time",target:"23:00",start:150,mean:1410,sd:50,gain:25},
    {name:"Dinner",cat:"health",type:"time",target:"21:00",desc:"Log the time you ate. Use Skip this day when you fast or diet.",skipP:.12,start:120,mean:1245,sd:40,gain:10},
    {name:"Morning run",cat:"health",type:"num",unit:"minutes",target:30,freq:{t:"weekly",n:4},start:180,base:.45,gain:.15,we:.1,lo:20,hi:55},
    {name:"Drink water",cat:"health",type:"num",unit:"glasses",target:8,slots:["Morning","Afternoon","Night"],start:180,base:.85,gain:.05,we:-.05,lo:2,hi:4},
    {name:"Read",cat:"study",type:"num",unit:"pages",mpu:2,target:20,start:170,base:.6,gain:.2,we:.2,lo:8,hi:40},
    {name:"Deep work",cat:"work",type:"num",unit:"minutes",target:90,freq:{t:"weekdays"},start:150,base:.7,gain:.15,we:0,lo:40,hi:150},
    {name:"Meditate",cat:"self",type:"yes",mpu:10,start:60,base:.45,gain:.4,we:.1},
    {name:"Journal",cat:"self",type:"yes",mpu:10,freq:{t:"days",days:[0,2,4]},start:100,base:.6,gain:.3,we:0},
    {name:"TV episodes",cat:"fun",type:"num",unit:"episodes",mpu:40,start:160,base:.6,gain:0,we:.25,lo:1,hi:5},
    {name:"Movies watched",cat:"fun",type:"num",unit:"movies",mpu:110,freq:{t:"weekends"},start:160,base:.35,gain:0,we:0,lo:1,hi:1}];
  const idOf={};defs.forEach((d,i)=>{idOf[d.name]="s"+i});
  return defs.map((d,i)=>{
    const h={id:"s"+i,name:d.name,cat:d.cat,type:d.type,color:PAL[i%PAL.length],created:addDays(t,-d.start),cycles:Math.max(1,Math.ceil((d.start+1)/WINDOW)),done:{},notes:{}};
    const ic=d.type==="group"?"🎓":guessIcon(d.name);if(ic)h.icon=ic;
    if(d.freq)h.freq=d.freq;if(d.unit)h.unit=d.unit;if(d.mpu)h.mpu=d.mpu;if(d.target)h.target=d.target;if(d.by)h.by=d.by;if(d.desc)h.desc=d.desc;if(d.parent)h.parent=idOf[d.parent];
    if(d.slots)h.slots=d.slots.map((n,j)=>({id:"s"+j,name:n,by:guessPeriod(n)}));
    if(d.type==="group")return h;
    for(let k=d.start;k>=0;k--){
      const date=addDays(t,-k),w=parse(date).getDay(),we=w===0||w===6;
      if(!isWeekly(h)&&!isDue(h,date))continue;
      if(d.type==="time"){
        if(d.skipP&&rnd()<d.skipP){h.skip=h.skip||{};h.skip[date]=1;continue}
        if(rnd()<.92)h.done[date]=tstr(d.mean-d.gain*(1-k/d.start)+(rnd()-.5)*2*d.sd+(we?25:0));continue}
      const p=Math.min(.97,Math.max(.05,d.base+d.gain*(1-k/d.start)+(we?d.we:0)));
      if(d.slots){const o={};h.slots.forEach(sl=>{if(rnd()<p)o[sl.id]=Math.round(d.lo+rnd()*(d.hi-d.lo))});if(Object.keys(o).length)h.done[date]=o}
      else if(rnd()<p)h.done[date]=d.type==="num"?Math.round(d.lo+rnd()*(d.hi-d.lo)):1;
      else if(d.type==="num"&&d.target&&rnd()<.3)h.done[date]=Math.max(1,Math.round(d.target*(.2+rnd()*.5)));
      if(h.done[date]&&rnd()<.07)h.notes[date]=notes[Math.floor(rnd()*notes.length)]}
    return h})}
