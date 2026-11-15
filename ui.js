/* ui.js: render(), the More menu and in-app navigation history (Back and Forward buttons, kept in sync with the browser history when it is available). */
const navList=[null];let navIdx=0,navHS=false;
const navSnap=()=>({view,sel,repScope,rng,calMode,calScope,calDate,calPick,editing});
function navPush(){navList[navIdx]=navSnap();navList.length=navIdx+1;navList.push(null);navIdx++;try{history.pushState({navIdx},"");navHS=true}catch(e){}}
function navApply(i){
  navList[navIdx]=navSnap();navIdx=i;const s=navList[i];if(!s)return;
  view=s.view;sel=s.sel;repScope=s.repScope;rng=s.rng;calMode=s.calMode;calScope=s.calScope;calDate=s.calDate;calPick=s.calPick;editing=s.editing;armed=null;noteOpen={};
  render();window.scrollTo(0,0)}
function navGo(i){
  if(i<0||i>=navList.length||i===navIdx)return;
  if(navHS){const before=navIdx;try{history.go(i-navIdx);setTimeout(()=>{if(navIdx===before)navApply(i)},300);return}catch(e){}}
  navApply(i)}
const goBack=()=>navGo(navIdx-1),goForward=()=>navGo(navIdx+1);
if(typeof window!=="undefined")window.addEventListener("popstate",e=>{const i=e.state&&e.state.navIdx!==undefined?e.state.navIdx:0;if(i!==navIdx&&i>=0&&i<navList.length)navApply(i)});
const MORE_VIEWS=["more","cal","guide","set"];
function moreView(){
  return '<div class="more">'+[["cal","🗓️","Calendar","Weekly detail and monthly overview"],["guide","🧭","Guide","Coach, plan, weekly note and badges"],["set","⚙️","Settings","Templates, categories, backup and timers"]].map(([v,i,t,s])=>'<button class="btn tpl" data-view="'+v+'"><span class="mi">'+i+"</span>"+t+"<small>"+s+"</small></button>").join("")+"</div>"}
function render(){
  const A=act(),n=A.filter(h=>isDone(h,sel)).length;
  navList[navIdx]=navSnap();
  document.getElementById("runbar").innerHTML=view==="home"?"":runHtml();
  const subs={home:"Focus now, track the rest",day:A.length?n+" of "+A.length+" done":"No habits yet",cal:"Weekly detail, monthly overview",rep:"Totals, trends, time and combinations",guide:"Guidance, small steps and achievements",hab:"Add, edit and archive",set:"Templates, categories and backup",goals:"Goals, objectives and progress",more:"More from Life OS"};
  document.getElementById("sub").textContent=subs[view];
  document.getElementById("back").disabled=navIdx<=0;
  document.getElementById("fwd").disabled=navIdx>=navList.length-1;
  document.querySelectorAll(".bnav button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.view===view||(b.dataset.view==="more"&&MORE_VIEWS.includes(view))));
  document.getElementById("view").innerHTML={home:homeView,day:dayView,cal:calView,rep:repView,guide:guideView,hab:habitsView,set:settingsView,goals:goalsView,more:moreView}[view]();
  if(typeof tSigSync==="function")tSigSync()}
