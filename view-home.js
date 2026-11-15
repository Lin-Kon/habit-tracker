/* view-home.js: the Home tab. One main timer, an optional background timer, pomodoro, and a glance at today. Everything else lives on the Log tab. */
const nameSort=(a,c)=>normName(a.name).localeCompare(normName(c.name));
function recentHabits(){const k=h=>Object.keys(h.ent||{}).sort().pop()||"";return habits.filter(canTime).sort((a,c)=>k(c).localeCompare(k(a))||nameSort(a,c)).slice(0,6)}
function homeView(){
  const P=settings.pomo,h=runH(),b=bgH(),brk=P.brk,t=TODAY(),all=habits.filter(canTime);
  const opt=L=>L.slice().sort(nameSort).map(x=>'<option value="'+x.id+'">'+esc(x.name)+"</option>").join("");
  const chip=(x,a)=>'<button class="qchip" style="--c:'+x.color+'" '+a+'="'+x.id+'">'+ic(x)+esc(x.name)+"</button>";
  let s=orphCard();
  if(h){
    s+='<section class="hcard main" style="--c:'+h.color+'"><div class="hlab">Now</div><div class="hname">'+ic(h)+esc(h.name)+'</div><div class="bigt" data-tkat="'+settings.run.at+'">'+fmtClock((Date.now()-settings.run.at)/1000)+"</div>"
     +(P.on&&P.phase==="focus"?'<div class="hsub">🍅 Round '+(P.n+1)+' · <b data-tkleft="'+(P.at+P.focus*60000)+'">'+mmss(P.at+P.focus*60000-Date.now())+"</b> left in this focus</div>":"")
     +(runLong()?'<p class="hint">This has been running for over 6 hours. If you forgot to stop it, stop it and fix the time in the Log.</p>':"")
     +'<div class="row wrap"><button class="add" data-xend>Stop and save</button></div></section>'}
  else if(brk){
    const hh=habits.find(x=>x.id===brk.hid);
    s+='<section class="hcard" style="--c:var(--moss)"><div class="hlab">'+(brk.kind==="long"?"Long break":"Break")+'</div>'+(brk.over?'<div class="hname">Break is over</div>':'<div class="bigt" data-tkleft="'+brk.until+'">'+mmss(brk.until-Date.now())+"</div>")+'<div class="row wrap">'+(hh?'<button class="add" data-xpnext>Start next round: '+esc(hh.name)+"</button>":"")+'<button class="btn" data-xend>End session</button></div></section>'}
  else s+='<section class="hcard" style="--c:var(--moss)"><div class="hlab">Ready</div><div class="hname">What are you working on?</div>'+(all.length?'<div class="qs">'+recentHabits().map(x=>chip(x,"data-xstart")).join("")+'</div><select id="xhsel" aria-label="Choose a habit to time"><option value="">Choose another habit…</option>'+opt(all)+"</select>":'<p class="meta">No habit can be timed yet. Add one in the Habits tab.</p>')+"</section>";
  if(h||brk){
    if(b)s+='<section class="hcard bgc" style="--c:'+b.color+'"><div class="hlab">Background</div><div class="mh"><div class="hname sm">🎧 '+ic(b)+esc(b.name)+'</div><b class="tk" data-tkat="'+settings.bg.at+'">'+fmtClock((Date.now()-settings.bg.at)/1000)+'</b></div><div class="row wrap"><button class="btn" data-xbgstop>Stop background</button></div></section>';
    else{
      const run=x=>h&&h.id===x.id,fl=all.filter(x=>x.bg&&!run(x)),ot=all.filter(x=>!x.bg&&!run(x));
      s+='<section class="hcard bgc" style="--c:var(--mute)"><div class="hlab">Background (optional)</div>'+(fl.length?'<div class="qs">'+fl.map(x=>chip(x,"data-xbg")).join("")+"</div>":'<p class="meta">Something playing while you work, like a TV series or music. Pick one below and it is remembered here.</p>')+(ot.length?'<select id="xbgsel" aria-label="Add a background habit"><option value="">Add a background habit…</option>'+opt(ot)+"</select>":"")+"</section>"}}
  s+='<div class="row wrap"><button class="nb" data-xpomo aria-pressed="'+!!P.on+'">🍅 Pomodoro '+(P.on?"on · "+P.focus+"/"+P.short:"off")+"</button></div>";
  const D=dayStat(act().filter(x=>x.type!=="group"),t),g=gl().filter(x=>x.status==="active").sort((a,c)=>(a.due||"9").localeCompare(c.due||"9"))[0];
  return s+'<section class="glance"><div class="mh"><b>Today</b><span class="meta">'+D.n+" of "+D.t+' habits done</span></div><div class="meter" style="--c:var(--moss)"><i style="width:'+pct(D.n,D.t)+'%"></i></div><div class="row wrap"><button class="btn" data-view="day">Open Log</button>'+(g?'<button class="btn" data-view="goals">🎯 '+esc(g.name)+" · "+goalProg(g)+"%</button>":"")+"</div></section>"}
