/* view-guide.js: the Guide tab (questionnaire, today, my plan, this week, badges). */
let guideTab="today",ob=null,roughOpen=false,showHidden=false;
const lab=(list,id)=>{const x=list.find(y=>y[0]===id);return x?x[1]:""};
const chips=(list,key,cur)=>'<div class="rng wrap">'+list.map(([v,l])=>'<button class="tab chip" data-obset="'+key+'" data-v="'+v+'" aria-pressed="'+(cur===v)+'">'+esc(l)+"</button>").join("")+"</div>";
const disclaimer='<p class="legend">Guidance here is general and written to be gentle and safe for most people. It is not medical, legal or financial advice. If you have a health condition, are in pain, or feel unwell or very low for more than a couple of weeks, please talk to a doctor or someone you trust.</p>';
function obStart(){ob={step:settings.profile?1:0,a:Object.assign({name:"",age:"",role:"",focus:[],rel:"",kids:"",money:"",tone:"warm"},settings.profile?JSON.parse(JSON.stringify(settings.profile)):{})};view="guide"}
function finishOb(){
  const a=ob.a;settings.profile={name:a.name,age:a.age,role:a.role,focus:a.focus.length?a.focus:["move","sleep","mind"],rel:a.rel,kids:a.kids,money:a.money,tone:a.tone||"warm",at:TODAY()};
  settings.promptSeen=1;settings.coachOn=true;ob=null;view="guide";guideTab="plan";save();render();window.scrollTo(0,0);
  toast("Thank you. Here is a gentle starting plan. Add only what feels doable.")}
function obView(){
  const a=ob.a,st=ob.step,dots='<div class="ob-dots">'+[0,1,2,3,4,5,6].map(i=>"<i"+(i<=st?' class="on"':"")+"></i>").join("")+"</div>";
  const nav=(next,label)=>'<div class="row wrap" style="margin-top:14px">'+(st>0?'<button class="btn" data-obback>Back</button>':"")+(next?'<button class="add" data-obnext>'+(label||"Next")+"</button>":"")+'<button class="link" data-obquit>'+(st===0?"Not now":"Stop for now")+"</button></div>";
  let h=dots+'<div class="gcard">';
  if(st===0)h+='<h2>Let me get to know you</h2><p>I will ask a few short questions so my suggestions fit where you are in life. Everything you tell me stays on this device. You can skip any question and change your answers whenever you like.</p><p class="meta">I give general well-being suggestions. I am not a doctor, lawyer or financial adviser.</p>'+nav(true,"Start");
  else if(st===1)h+='<h2>First, a little about you</h2><label class="note" for="obn">What should I call you? (optional)</label><input id="obn" maxlength="30" value="'+esc(a.name)+'" placeholder="Your name or nickname" autocomplete="off"><label class="note">Your age range</label>'+chips(AGES,"age",a.age)+nav(true);
  else if(st===2)h+='<h2>What is life like right now?</h2><p class="meta">Choose the one that fits best today. It can change later, and so can your answer.</p>'+chips(ROLES,"role",a.role)+nav(true);
  else if(st===3)h+='<h2>What would you like help with?</h2><p class="meta">Choose up to five, starting with the most important. ('+a.focus.length+" of 5 chosen)</p>"+'<div class="rng wrap">'+FOCUS.map(([v,l,i])=>'<button class="tab chip" data-obfocus="'+v+'" aria-pressed="'+a.focus.includes(v)+'">'+i+" "+esc(l)+(a.focus.includes(v)?" ("+(a.focus.indexOf(v)+1)+")":"")+"</button>").join("")+"</div>"+nav(true);
  else if(st===4)h+='<h2>A little more (all optional)</h2><p class="meta">This only helps me pick suggestions that fit. Tap again to clear an answer.</p><label class="note">Relationship</label>'+chips(RELS,"rel",a.rel)+'<label class="note">Children</label>'+chips(KIDS,"kids",a.kids)+'<label class="note">Money right now</label>'+chips(MONEYS,"money",a.money)+nav(true);
  else if(st===5)h+='<h2>How should I talk to you?</h2>'+TONES.map(([v,l,s])=>'<button class="tonebtn" data-obset="tone" data-v="'+v+'" aria-pressed="'+(a.tone===v)+'"><b>'+esc(l)+"</b><small>"+esc(s)+"</small></button>").join("")+nav(true);
  else h+='<h2>Here is what I heard</h2><ul class="nl"><li><b>Name:</b> '+esc(a.name||"not shared")+"</li><li><b>Age range:</b> "+esc(lab(AGES,a.age)||"not shared")+"</li><li><b>Life right now:</b> "+esc(lab(ROLES,a.role)||"not shared")+"</li><li><b>Help with:</b> "+esc(a.focus.map(f=>lab(FOCUS,f)).join(", ")||"I will start with movement, sleep and calm")+"</li><li><b>More:</b> "+esc([lab(RELS,a.rel),lab(KIDS,a.kids),lab(MONEYS,a.money)].filter(Boolean).join(", ")||"not shared")+"</li><li><b>Voice:</b> "+esc(lab(TONES,a.tone))+'</li></ul><p class="meta">Next you will see a gentle starting plan. Nothing is added until you choose it.</p>'+'<div class="row wrap" style="margin-top:14px"><button class="btn" data-obback>Back</button><button class="add" data-obfinish>Build my plan</button><button class="link" data-obquit>Stop for now</button></div>';
  return h+"</div>"}
function guideToday(){
  const p=settings.profile,ph=phaseInfo(p),t=TODAY(),A=act().filter(h=>h.type!=="group"),due=A.filter(h=>vis(h,t)&&(isWeekly(h)||isDue(h,t))),left=due.filter(h=>!isDone(h,t));
  const x=left.find(y=>y.tiny)||left[0];
  return '<div class="coach">'+esc(coachNote())+"</div>"
   +'<div class="gcard"><b>Your one small step today</b><p>'+(!due.length?"You have nothing scheduled yet. Open My plan and add one small habit that feels easy.":!left.length?"Everything scheduled is done. Rest well.":"<b>"+ic(x)+esc(x.name)+"</b>"+(x.tiny?". On a hard day, even "+x.tiny+" "+esc(x.unit||"")+" counts.":". Start with the smallest version you can."))+'</p><button class="btn" data-view="day">Open my Log</button></div>'
   +'<div class="gcard"><b>Where you are: '+esc(ph.title)+"</b><p>"+esc(ph.text)+'</p><button class="link" data-obstart>Update my answers</button></div>'
   +'<div class="gcard"><b>A thought for today</b><p>'+esc(wisdomToday())+"</p></div>"}
function stepCard(s){
  const have=habits.some(h=>h.step===s.id||normName(h.name)===normName(s.name)),fq=s.fr==="d"?"daily":s.fr==="wd"?"weekdays":s.fr.slice(1)+" days a week",goal=s.type==="num"?(s.target?s.target+" "+s.unit:"no fixed goal"):s.type==="time"?"by "+(s.target||""):"yes or no";
  return '<div class="step"><div class="mh"><b>'+s.icon+" "+esc(s.name)+'</b><span class="meta">'+fq+" · "+goal+(s.tiny?" · small step "+s.tiny+" "+esc(s.unit||""):"")+'</span></div><p class="why">'+esc(s.why)+"</p>"+(have?'<span class="warnchip" style="background:#e5f4e4;border-color:#8bc48a;color:#1d5a2a">✓ In your habits</span>':'<div class="row wrap"><button class="add" data-stepadd="'+s.id+'">Add to my habits</button><button class="link" data-stepskip="'+s.id+'">Not for me</button></div>')+"</div>"}
function guidePlan(){
  const p=settings.profile,plan=buildPlan(p),shown=plan.filter(s=>settings.plan[s.id]!=="skip"),hid=plan.filter(s=>settings.plan[s.id]==="skip");
  let h='<p class="meta">Suggestions chosen for you. Start with just one or two; small and steady wins. Every habit you add can be changed or archived later.</p>';
  if(shown.some(s=>!habits.some(x=>x.step===s.id||normName(x.name)===normName(s.name))))h+='<p><button class="btn" data-stepall>Add everything below</button></p>';
  (p.focus&&p.focus.length?p.focus:["move","sleep","mind"]).forEach(a=>{const L=shown.filter(s=>s.area===a);if(!L.length)return;const f=FOCUS.find(x=>x[0]===a);
    h+='<h2 class="cat static" style="margin-top:14px">'+f[2]+" "+esc(f[1])+"</h2>"+(a==="food"?'<p class="meta">These are gentle eating habits that suit most people. A personal diet plan, with calories, weight goals or medical needs, is best made with a doctor or dietitian.</p>':"")+(a==="fun"?'<p class="meta">Play is part of a good life. The aim is to keep it a choice, so decide when you play and when you stop.</p>':"")+L.map(stepCard).join("")});
  if(hid.length)h+='<p><button class="link" data-showhidden>'+(showHidden?"Hide":"Show")+" suggestions I hid ("+hid.length+")</button></p>"+(showHidden?hid.map(s=>'<div class="step"><b>'+s.icon+" "+esc(s.name)+'</b> <button class="link" data-stepun="'+s.id+'">Show again</button></div>').join(""):"");
  return h+(plan.length?"":'<p class="empty">No suggestions yet. Update your answers to get some.</p>')}
function guideWeek(){
  const t=TODAY(),ws=weekStartOf(t),r=settings.reflections[ws]||"",past=Object.keys(settings.reflections).filter(k=>k!==ws).sort().reverse().slice(0,4);
  return '<div class="gcard letter"><b>A note on your week</b>'+weekLetter().map(x=>"<p>"+esc(x)+"</p>").join("")+"</div>"
   +'<div class="gcard"><b>Your reflection</b><p class="meta">What are you proud of this week? What would make next week a little easier?</p><textarea data-refl="'+ws+'" maxlength="600" rows="4" placeholder="Write a few words. Only you can see this.">'+esc(r)+"</textarea></div>"
   +(past.length?'<div class="gcard"><b>Earlier reflections</b>'+past.map(k=>'<p class="meta"><b>Week of '+fmt(k,{day:"numeric",month:"short"})+":</b> "+esc(settings.reflections[k])+"</p>").join("")+"</div>":"")}
function guideView(){
  if(ob)return obView();
  const p=settings.profile;
  if(!p)return '<div class="gcard"><h2>Guidance that fits your life</h2><p>Answer a few short questions about your age range, what life is like now and what you want help with. You get small, doable steps for where you are, and a coach who cheers for small wins. It takes about two minutes, you can skip anything, and everything stays on this device.</p><button class="add" data-obstart>Take the questionnaire</button></div>'+badgesView();
  const tabs=[["today","Today"],["plan","My plan"],["week","This week"],["badges","Badges"]];
  return '<div class="rng">'+tabs.map(([v,l])=>'<button class="tab" data-gtab="'+v+'" aria-pressed="'+(guideTab===v)+'">'+l+"</button>").join("")+"</div>"+({today:guideToday,plan:guidePlan,week:guideWeek,badges:badgesView}[guideTab])()+disclaimer}
