/* coach.js: personalisation and guidance. Rule-based and written in this file: no AI service, and nothing leaves your device.
   General well-being suggestions only, not medical, legal or financial advice.
   settings.profile = {name,age,role,focus:[area ids],rel,kids,money,tone,at}. A habit created from a suggestion carries h.step = the suggestion id. */
const AGES=[["u18","Under 18"],["18-22","18 to 22"],["23-29","23 to 29"],["30-44","30 to 44"],["45-59","45 to 59"],["60+","60 or older"]];
const ROLES=[["school","In school"],["uni","In college or university"],["grad","Finished studies, looking for work"],["work","Working"],["self","Self-employed or running a business"],["home","At home with family or caring for others"],["change","Changing direction, or studying while working"],["pause","Between jobs or retired"]];
const FOCUS=[["career","Finding or growing a job","💼"],["study","Studies and exams","📚"],["skills","Soft skills and communication","🗣️"],["money","Money and saving","💰"],["move","Exercise and movement","🏃"],["food","Eating well","🥗"],["sleep","Sleep and energy","😴"],["mind","Calm, mood and stress","🧘"],["body","Eyes, skin, posture and face care","👁️"],["people","Friends, dating and relationships","🤝"],["family","Family and parenting","👨‍👩‍👧"],["fun","Play, hobbies and screen balance","🎮"]];
const KIDS=[["none","No children"],["expecting","Expecting"],["young","Young children"],["older","Older children or teens"]];
const RELS=[["single","Single"],["dating","Dating"],["partnered","In a relationship"],["married","Married"]];
const MONEYS=[["tight","Money is tight"],["ok","Getting by"],["good","Comfortable"]];
const TONES=[["warm","Warm and nurturing","Take it one small step at a time. I am proud of you for showing up."],["steady","Calm and steady","Pick the one thing that matters most and begin there."],["friend","Upbeat friend","Small wins count. What is the first one today?"]];
const PHASE={
 school:"You are in school. Your job right now is to learn, grow and enjoy being young. Short study blocks, good sleep, time to play and time with friends matter more than marathon cramming.",
 uni:"You are at college or university. This is the time to build habits that last: a study rhythm that does not depend on last-minute panic, friendships, and movement you enjoy.",
 grad:"You have finished your studies and are looking for work. This phase is about structure and momentum: a daily rhythm, steady applications, new skills, and looking after yourself while the right door opens. Waiting is hard, and it is easier with small daily wins.",
 work:"You are working. The risk now is that work eats everything else. Protect your sleep, your movement and time with people you love, and keep learning.",
 self:"You work for yourself. Nobody sets your hours, so a few anchors help: a start and a stop time, a plan for the day, and regular breaks.",
 home:"You spend your days caring for others. Your needs count too. Tiny moments for yourself, rest, and asking for help keep you able to keep giving.",
 change:"You are changing direction or studying while working. Time is the scarce thing, so short, regular sessions beat big plans.",
 pause:"You are between jobs or retired. A gentle daily rhythm, movement, learning and people give your days shape and meaning."};
const AGETXT={"u18":"Your body and mind are still growing, so sleep, play and good food matter a lot.","18-22":"You have plenty of energy for sport and social life. Keep some of the evening for play, and build habits that will carry you for decades.","23-29":"You are building your direction. Protect sleep and exercise so work and study do not quietly use up your health.","30-44":"Time is tight, so small routines matter more than big plans. Regular exercise now pays back for years.","45-59":"Strength, mobility and regular check-ups become more valuable. Keep moving and keep learning.","60+":"Gentle daily movement, balance and staying connected keep life full."};
function phaseInfo(p){const r=ROLES.find(x=>x[0]===p.role);return{title:r?r[1]:"Where you are",text:[PHASE[p.role],AGETXT[p.age]].filter(Boolean).join(" ")||"Tell me a little about your life and I will tailor the suggestions."}}
const WISDOM=["Progress, not perfection.","A small step done today beats a big plan left for tomorrow.","You do not have to feel ready. You only have to begin.","Missing a day is a pause, not the end.","Be as kind to yourself as you would be to a good friend.","Sleep is part of the work.","The goal is to become someone who shows up, not someone who is never tired.","Tiny habits grow quietly into big changes.","Rest is not laziness. It is how you keep going.","Compare yourself with who you were last month, not with anyone else.","Ask for help early. It is a strength.","Notice one thing that went well today."];
const wisdomToday=()=>WISDOM[Math.floor(parse(TODAY())/864e5)%WISDOM.length];
/* ---- suggestions: STEP(id, area, name, icon, category, type, unit, goal, small step, how often, why, filters)
   how often: "d" daily, "wd" weekdays, "w3" = 3 days a week. Filters: a = age ids, r = situations, k = children, l = relationship. */
const STEPS=[];
function STEP(id,area,name,icon,cat,type,unit,target,tiny,fr,why,o){STEPS.push({id,area,name,icon,cat,type,unit,target,tiny,fr,why,...(o||{})})}
STEP("m_play","move","Play or sport","⚽","Health","num","minutes",60,15,"d","Young people do best with about an hour of active play most days. Fun counts.",{a:["u18"],by:"evening"});
STEP("m_play2","move","Sport or play with friends","⚽","Health","num","minutes",45,15,"w4","Play keeps exercise fun, and fun is what lasts. The evening is a good time for it.",{a:["18-22"],by:"evening"});
STEP("m_jog","move","Jogging or brisk exercise","🏃","Health","num","minutes",25,10,"w3","Regular exercise that raises your heart rate protects your heart and your mood. Adults are advised to aim for around 150 minutes of moderate activity a week; three sessions is a good start.",{a:["23-29","30-44"],by:"evening"});
STEP("m_walk","move","Walk","🚶","Health","num","minutes",20,5,"d","A short walk lifts your mood and energy, and it is the easiest way to begin. A 10-minute walk after a meal is a good habit.",{a:["18-22","23-29","30-44"]});
STEP("m_walk2","move","Brisk walk","🚶","Health","num","minutes",30,10,"w5","Brisk walking is gentle on the joints and one of the best all-round exercises.",{a:["45-59","60+"]});
STEP("m_stretch","move","Stretching","🤸","Health","num","minutes",5,2,"d","A few minutes loosen stiff shoulders, neck and back, especially if you sit a lot.",{by:"morning"});
STEP("m_strength","move","Strength or bodyweight session","🏋️","Health","num","minutes",20,5,"w2","Muscle keeps you strong at every age. Two short sessions a week count.",{a:["18-22","23-29","30-44","45-59","60+"]});
STEP("m_balance","move","Balance practice","🧍","Health","num","minutes",5,2,"d","Simple balance practice, such as standing on one leg while holding a support, helps prevent falls.",{a:["60+"]});
STEP("f_water","food","Drink water","💧","Health","num","glasses",8,3,"d","Water helps energy and focus. Keep a bottle with you to remember.");
STEP("f_veg","food","Fruit or vegetables","🥗","Health","num","portions",3,1,"d","Adding one fruit or vegetable to each meal is a simple, steady way to eat better.");
STEP("f_breakfast","food","Breakfast time","🍳","Health","time","",0,0,"d","Eating at regular times steadies your energy. Log when you ate.",{target:"09:00"});
STEP("f_sugar","food","Skip sugary drinks","🥤","Health","yes","",0,0,"d","Swapping sweet drinks for water is one of the easiest healthy changes.");
STEP("f_plan","food","Plan the week's meals","📝","Health","yes","",0,0,"w1","A short weekly plan makes healthy choices easier on busy days. For a personal diet plan, a doctor or dietitian is the right person.");
STEP("s_bed_u","sleep","Bedtime","🛏️","Self care","time","",0,0,"d","Young people need around 8 to 10 hours of sleep. A steady bedtime does more than any trick.",{a:["u18"],target:"22:00"});
STEP("s_bed","sleep","Bedtime","🛏️","Self care","time","",0,0,"d","A steady bedtime does more for your energy than any trick. Adults generally need 7 to 9 hours.",{a:["18-22","23-29","30-44","45-59"],target:"23:00"});
STEP("s_bed_o","sleep","Bedtime","🛏️","Self care","time","",0,0,"d","A regular bedtime keeps your body clock steady.",{a:["60+"],target:"22:30"});
STEP("s_screen","sleep","Phone away before bed","📵","Self care","yes","",0,0,"d","Putting screens away for 30 minutes before sleep helps you fall asleep more easily.",{by:"night"});
STEP("s_wake","sleep","Wake up","⏰","Self care","time","",0,0,"d","Waking at a similar time every day, even on weekends, makes sleep easier.",{target:"07:00"});
STEP("mi_breathe","mind","Calm breathing","🧘","Self care","num","minutes",5,1,"d","Slow breathing for a few minutes settles the body when you feel tense."),
STEP("mi_good","mind","Note one good thing","📝","Self care","yes","",0,0,"d","Noticing one good thing a day trains your mind to see progress, not only problems.");
STEP("mi_out","mind","Time outside","🌿","Self care","num","minutes",15,5,"d","Daylight and fresh air help mood and sleep.");
STEP("b_eye","body","Eye breaks (20-20-20)","👁️","Self care","num","breaks",4,1,"d","Every 20 minutes of screen time, look at something about 6 metres (20 feet) away for 20 seconds. It eases eye strain.");
STEP("b_skin","body","Skin care","🧴","Self care","yes","",0,0,"d","The basics are gentle cleansing, moisturiser and daily sunscreen. Simple and regular beats complicated.",{slots:["Morning","Night"]});
STEP("b_face","body","Face and jaw relaxation","😌","Self care","num","minutes",3,1,"d","A gentle face and jaw massage relaxes tension. The evidence that face exercises change how you look is limited, so treat this as relaxation.",{by:"night"});
STEP("b_posture","body","Posture and neck stretch breaks","🪑","Self care","num","breaks",3,1,"d","Roll your shoulders and reset your posture whenever you have been sitting for a long time.");
STEP("st_focus","study","Focused study","📚","Study","num","minutes",60,15,"wd","Short focused blocks of 25 to 50 minutes with breaks work better than long, tired sessions.",{r:["school","uni","grad","change"],by:"morning"});
STEP("st_review","study","Review your notes","🔁","Study","num","minutes",15,5,"d","Reviewing a little every day beats cramming.",{r:["school","uni","grad","change"]});
STEP("st_q","study","Practice questions","❓","Study","num","questions",20,5,"d","Testing yourself is one of the most effective ways to learn.",{r:["school","uni","grad","change"]});
STEP("c_apply","career","Send applications","📨","Work","num","applications",2,1,"wd","A few well-tailored applications beat many rushed ones.",{r:["grad","pause","change"]});
STEP("c_int","career","Interview practice","🎤","Work","num","minutes",15,5,"w3","Saying your answers out loud is what makes them come easily on the day.",{r:["grad","pause","change"]});
STEP("c_net","career","Reach out to someone in your field","🤝","Work","num","messages",1,1,"w4","One friendly message a day to someone in your field builds options over time.",{r:["grad","pause","change","work","self"]});
STEP("c_cv","career","Improve your CV or portfolio","📄","Work","num","minutes",20,5,"w3","Small regular edits keep it ready for the moment you need it.",{r:["grad","pause","change"]});
STEP("c_skill","career","Learn a job skill","🛠️","Work","num","minutes",30,10,"d","A small daily amount of learning adds up quickly.",{r:["grad","pause","change","work","self","uni"]});
STEP("c_focus","career","Deep work block","💻","Work","num","minutes",60,15,"wd","One protected block of focused work gets more done than a whole distracted day.",{r:["work","self"],by:"morning"});
STEP("c_plan","career","Plan tomorrow's top 3 tasks","🗓️","Work","yes","",0,0,"wd","Ending the day with a plan makes the next morning easier.",{r:["work","self","grad"],by:"evening"});
STEP("sk_talk","skills","Start a conversation","🗣️","Self care","num","conversations",1,1,"w4","Soft skills grow by using them. Ask one question and listen fully.");
STEP("sk_speak","skills","Speak aloud practice","🎙️","Self care","num","minutes",10,3,"w3","Explaining an idea out loud, as in an interview, builds clarity and confidence.");
STEP("sk_read","skills","Read","📖","Study","num","pages",10,2,"d","Reading widens your vocabulary and your view of the world.");
STEP("sk_lang","skills","Practise a language","🔤","Study","num","minutes",15,5,"w4","Short and regular beats long and rare for languages.");
STEP("mo_track","money","Note today's spending","💰","Other","yes","",0,0,"d","Two minutes a day shows where your money really goes.");
STEP("mo_save","money","Put a little aside","🏦","Other","yes","",0,0,"w1","Even a very small, regular amount builds the habit of saving.");
STEP("mo_check","money","Weekly money check","🗓️","Other","yes","",0,0,"w1","A short weekly look keeps surprises small.");
STEP("p_reach","people","Contact a friend or relative","💬","Self care","num","people",1,1,"w3","Connection protects your well-being. A short message counts.");
STEP("p_social","people","Do something social","🎉","Self care","yes","",0,0,"w1","Meeting people in person, even briefly, lifts your mood.",{a:["u18","18-22","23-29"]});
STEP("p_partner","people","Time with your partner","❤️","Self care","num","minutes",20,5,"w4","Undistracted time together, phones away, keeps a relationship strong.",{l:["partnered","married"]});
STEP("fa_kid","family","Undivided time with your child","🧸","Self care","num","minutes",15,5,"d","Fifteen minutes of full attention does more than a whole distracted evening.",{k:["young","older"]});
STEP("fa_me","family","A few minutes just for you","🌿","Self care","num","minutes",10,3,"d","You can only pour from a cup that gets refilled.",{k:["young","expecting"]});
STEP("fa_help","family","Ask for or accept help","🙏","Self care","yes","",0,0,"w1","Asking for help early is a strength, not a weakness.",{r:["home"]});
STEP("fu_game","fun","Gaming","🎮","Entertainment","num","minutes",0,0,"d","Play is good for you. Choose when you play, after your must-dos, and decide when you will stop. Tracking keeps it a choice, not a drift.");
STEP("fu_hobby","fun","Hobby time","🎨","Entertainment","num","minutes",20,5,"w4","A hobby gives your mind something that is just yours.");
STEP("fu_free","fun","Phone-free hour","📵","Entertainment","yes","",0,0,"d","An hour without your phone clears your head.",{by:"evening"});
const elig=(s,p)=>(!s.a||!p.age||s.a.includes(p.age))&&(!s.r||!p.role||s.r.includes(p.role))&&(!s.k||!p.kids||s.k.includes(p.kids))&&(!s.l||!p.rel||s.l.includes(p.rel));
function buildPlan(p){
  const out=[],seen=new Set(),F=(p.focus&&p.focus.length?p.focus:["move","sleep","mind"]);
  F.forEach((a,i)=>STEPS.filter(s=>s.area===a&&elig(s,p)).slice(0,[4,3,3,3,3][i]||2).forEach(s=>{if(!seen.has(s.id)){seen.add(s.id);out.push(s)}}));
  return out}
function catByName(name){let c=cats.find(x=>normName(x.name)===normName(name));if(!c){c={id:"c"+Date.now().toString(36)+Math.floor(Math.random()*99),name,color:PAL[cats.length%PAL.length],icon:CAT_ICON[name]||"📁"};cats.splice(Math.max(0,cats.length-1),0,c)}return c}
function stepHabit(s){
  const c=catByName(s.cat),fr=s.fr==="d"?{t:"daily"}:s.fr==="wd"?{t:"weekdays"}:{t:"weekly",n:+s.fr.slice(1)};
  const h={id:Date.now().toString(36)+Math.floor(Math.random()*999),name:s.name,type:s.type,cat:c.id,color:PAL[habits.length%PAL.length],created:TODAY(),cycles:1,done:{},notes:{},icon:s.icon,desc:s.why,freq:fr,step:s.id};
  if(s.unit)h.unit=s.unit;if(s.target)h.target=s.target;if(s.tiny)h.tiny=s.tiny;if(s.by&&fr.t!=="weekly")h.by=s.by;
  if(s.slots)setSlots(h,s.slots);
  return h}
function addStep(s){if(habitNameTaken(s.name))return null;const h=stepHabit(s);habits.push(h);settings.plan[s.id]=h.id;return h}
/* ---- coach voice */
const MSG={
 warm:{morning:"Good morning, {n}. Take today one small step at a time. I am proud of you for showing up.",day:"Hello, {n}. However the day has gone so far, you can start fresh with one small thing.",evening:"Good evening, {n}. Be gentle with yourself. Whatever you did today was enough for today.",progress:"{k} done today, {n}. That is real progress, and I am proud of you.",all:"Everything done, {n}! Rest well tonight. You earned it.",back:"Welcome back, {n}. I am glad you are here. Coming back is the hardest part, and you did it. Start with your smallest step.",rough:"Some days are heavy, {n}, and that is okay. Do only what you can. Rest is part of the plan.",first:"That is your first one today, {n}. Well done.",small:"A small step, and it counts. Showing up matters more than size, {n}."},
 steady:{morning:"Good morning, {n}. Pick the one thing that matters most today and start there.",day:"Midday check, {n}. Choose the next small action and do it.",evening:"Evening, {n}. Look at what you did, not what you did not. Then rest.",progress:"{k} done, {n}. Keep going at a steady pace.",all:"All done today, {n}. Good discipline. Rest, and come back tomorrow.",back:"Welcome back, {n}. A pause is not a failure. Start again with one small step.",rough:"A hard day, {n}. Do the minimum and protect your rest. Tomorrow is another chance.",first:"First one done, {n}. Momentum starts here.",small:"A small step, counted. Consistency beats intensity, {n}."},
 friend:{morning:"Morning, {n}! Small wins count. What is the first one today?",day:"Hey there, {n}! Still time to grab a win today.",evening:"Evening, {n}. How did it go? Even one win makes it a good day.",progress:"{k} down, {n}! Nice going.",all:"You cleared the list, {n}! Go enjoy your evening.",back:"Hey, welcome back, {n}! No guilt here. Let us start small today.",rough:"Rough day, {n}? That happens. Do your tiniest step or take it easy, no judgement.",first:"First win of the day, {n}! Keep it rolling.",small:"Small step logged, and it counts! Nice one, {n}."}};
const nm=()=>(settings.profile&&settings.profile.name)||"";
const coachOn=()=>!!settings.profile&&settings.coachOn!==false;
function say(kind,v){const tone=(settings.profile&&settings.profile.tone)||"warm";let s=(MSG[tone]||MSG.warm)[kind]||"";const N=nm();s=s.replace(", {n}",N?", "+N:"").replace("{n}",N);return s.replace("{k}",(v&&v.k)||"")}
function lastActive(){const t=TODAY();for(let i=1;i<=30;i++){const d=addDays(t,-i);if(act().some(h=>h.type!=="group"&&inWin(h,d)&&logged(h,d)))return d}return null}
function coachNote(){
  const t=TODAY(),due=act().filter(h=>h.type!=="group"&&vis(h,t)&&(isWeekly(h)||isDue(h,t))),done=due.filter(h=>isDone(h,t)).length;
  if(settings.rough[t]===2)return "Today is a rest day. Nothing counts against you. Look after yourself.";
  if(settings.rough[t])return say("rough");
  const last=lastActive();if(last&&dayDiff(last,t)>=3&&!done)return say("back");
  if(due.length&&done===due.length)return say("all");
  if(done)return say("progress",{k:done});
  const hr=new Date().getHours();return say(hr<12?"morning":hr<18?"day":"evening")}
function logHook(h,d,was){
  if(!coachOn()||d!==TODAY()||was||!isDone(h,d))return;
  const t=TODAY(),due=act().filter(x=>x.type!=="group"&&vis(x,t)&&(isWeekly(x)||isDue(x,t))),n=due.filter(x=>isDone(x,t)).length;
  const m=due.length&&n===due.length?say("all"):isSmall(h,d)?say("small"):n===1?say("first"):"";
  if(m)toast(m)}
function weekLetter(){
  const t=TODAY(),ws=weekStartOf(t),days=span(ws,t),A=act().filter(h=>h.type!=="group"),tone=(settings.profile&&settings.profile.tone)||"warm",N=nm();
  const on=days.filter(d=>A.some(h=>inWin(h,d)&&logged(h,d))).length;
  const small=A.reduce((a,h)=>a+days.filter(d=>inWin(h,d)&&isSmall(h,d)).length,0);
  const best=A.filter(h=>!isWeekly(h)).map(h=>({h,s:streak(h)})).sort((a,b)=>b.s-a.s)[0];
  const low=A.map(h=>({h,s:stats(h,ws,t)})).filter(x=>x.s.el>=2).map(x=>({h:x.h,p:pct(x.s.dn,x.s.el)})).sort((a,b)=>a.p-b.p)[0];
  const out=[];
  if(N)out.push({warm:"Dear "+N+",",steady:N+",",friend:"Hey "+N+"!"}[tone]);
  out.push({warm:"Here is how your week looked, and I want you to hear this first: showing up on "+on+" of "+days.length+" days is something to be proud of.",steady:"A quick look at your week. You showed up on "+on+" of "+days.length+" days.",friend:"Week check-in! You showed up on "+on+" of "+days.length+" days."}[tone]);
  if(small)out.push(small+(small===1?" of your wins was":" of your wins were")+" a small step. Those count, and they are how big habits begin.");
  if(best&&best.s>=2)out.push("Your steadiest habit is "+best.h.name+", "+best.s+" days in a row.");
  out.push(low&&low.p<50?low.h.name+" had a harder week. Try its smaller version, or move it to a different time of day. Hard weeks are part of the journey.":"Nothing needs fixing this week. Keep what is working.");
  out.push({warm:"Whatever this week held, you are doing better than you think. Rest, and start again when you are ready.",steady:"Keep the pace steady. One small step at a time.",friend:"Proud of you. Same again next week, or even a little gentler!"}[tone]);
  return out}
