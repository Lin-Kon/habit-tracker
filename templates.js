/* templates.js: starter sets of habits. Adding a template never replaces data; every habit stays editable. */
const TEMPLATES=[
 {id:"bcs",name:"BCS preparation",desc:"A BCS group with English and Bangla grammar and literature, maths, science, affairs, practice questions",group:"BCS preparation",groupIcon:"🎓",habits:[
  {name:"English grammar",cat:"Study",type:"num",unit:"minutes",target:60,by:"morning"},
  {name:"English literature",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"Bangla grammar",cat:"Study",type:"num",unit:"minutes",target:60},
  {name:"Bangla literature",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"Mathematics",cat:"Study",type:"num",unit:"minutes",target:60},
  {name:"General science",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"Bangladesh affairs",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"International affairs",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"Questions solved",cat:"Study",type:"num",unit:"questions",target:50},
  {name:"Revision",cat:"Study",type:"num",unit:"minutes",target:30}]},
 {id:"routine",name:"Daily routine",desc:"Wake up, bedtime, meal times, water, exercise",habits:[
  {name:"Wake up",cat:"Self care",type:"time",target:"06:30"},
  {name:"Bedtime",cat:"Self care",type:"time",target:"23:00"},
  {name:"Breakfast",cat:"Health",type:"time",target:"09:00"},
  {name:"Lunch",cat:"Health",type:"time",target:"14:00"},
  {name:"Dinner",cat:"Health",type:"time",target:"21:00"},
  {name:"Water",cat:"Health",type:"num",unit:"glasses",target:8},
  {name:"Exercise",cat:"Health",type:"num",unit:"minutes",target:30,freq:{t:"weekly",n:4}}]},
 {id:"fun",name:"Entertainment log",desc:"TV episodes, movies, gaming",habits:[
  {name:"TV episodes",cat:"Entertainment",type:"num",unit:"episodes",mpu:40},
  {name:"Movies watched",cat:"Entertainment",type:"num",unit:"movies",mpu:110},
  {name:"Gaming",cat:"Entertainment",type:"num",unit:"minutes"}]},
 {id:"student",name:"Student",desc:"Classes, self-study, homework, revision, practice",habits:[
  {name:"Attend classes",cat:"Study",type:"yes",freq:{t:"weekdays"}},
  {name:"Self-study",cat:"Study",type:"num",unit:"minutes",target:120},
  {name:"Homework tasks",cat:"Study",type:"num",unit:"tasks"},
  {name:"Revision",cat:"Study",type:"num",unit:"minutes",target:45},
  {name:"Practice problems",cat:"Study",type:"num",unit:"problems",target:20}]},
 {id:"jobs",name:"Job seeker",desc:"Applications, networking, skills, CV, interview practice",habits:[
  {name:"Applications sent",cat:"Work",type:"num",unit:"applications",target:3,freq:{t:"weekdays"}},
  {name:"Networking messages",cat:"Work",type:"num",unit:"messages",target:2},
  {name:"Skill practice",cat:"Work",type:"num",unit:"minutes",target:60},
  {name:"CV and portfolio work",cat:"Work",type:"num",unit:"minutes",target:30},
  {name:"Interview practice",cat:"Work",type:"num",unit:"minutes",target:30}]}];
