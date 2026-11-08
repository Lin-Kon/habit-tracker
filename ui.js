/* ui.js: render() and in-app navigation history (Back and Forward buttons, kept in sync with the browser history when it is available). */
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
function render(){
  const A=act(),n=A.filter(h=>isDone(h,sel)).length;
  navList[navIdx]=navSnap();
  const subs={day:A.length?n+" of "+A.length+" done":"No habits yet",cal:"Weekly detail, monthly overview",rep:"Totals, trends and time spent",badge:"Level and achievements",hab:"Add, edit and archive",set:"Templates, categories and backup"};
  document.getElementById("sub").textContent=subs[view];
  document.getElementById("back").disabled=navIdx<=0;
  document.getElementById("fwd").disabled=navIdx>=navList.length-1;
  document.querySelectorAll(".tabs .tab").forEach(b=>b.setAttribute("aria-pressed",b.dataset.view===view));
  document.getElementById("view").innerHTML={day:dayView,cal:calView,rep:repView,badge:badgesView,hab:habitsView,set:settingsView}[view]();
}
