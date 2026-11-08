/* view-badges.js: the Badges tab (level, XP, badge grid). */
function badgesView(){
  const st=badgeState(),m=metrics(),E=st.filter(b=>b.ok||settings.badges[b.id]),xp=m.total*10+E.length*50;
  let lv=1;while(xp>=100*lv*lv)lv++;
  const lo=100*(lv-1)*(lv-1),hi=100*lv*lv;
  let h='<div class="lvl"><div><b>Level '+lv+'</b> <span class="meta">'+xp+' XP</span></div><div class="meter" style="--c:var(--moss)"><i style="width:'+pct(xp-lo,hi-lo)+'%"></i></div><div class="meta">'+(hi-xp)+" XP to level "+(lv+1)+". Each completed check-in earns 10 XP and each badge 50 XP.</div></div>";
  h+='<p class="meta">'+E.length+" of "+st.length+" badges earned</p>";
  const card=b=>{const e=b.ok||settings.badges[b.id];return '<div class="bd'+(e?" on":"")+'" style="--c:var(--moss)"><div class="bi">'+b.icon+'</div><div><b>'+esc(b.name)+"</b><small>"+esc(b.desc)+"</small>"+(e?'<small class="g">Earned '+fmt(settings.badges[b.id]||TODAY(),{day:"numeric",month:"short",year:"numeric"})+"</small>":'<div class="meter"><i style="width:'+pct(Math.min(b.v,b.t),b.t)+'%"></i></div><small>'+Math.min(r1(b.v),b.t)+" of "+b.t+"</small>")+"</div></div>"};
  return h+[...new Set(st.map(b=>b.g))].map(g=>"<h2>"+g+'</h2><div class="bg">'+st.filter(b=>b.g===g).map(card).join("")+"</div>").join("")}
