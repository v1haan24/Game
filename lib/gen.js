/* ===== DATA GENERATION ===== */
const R=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=(a,n)=>shuf(a).slice(0,n);
const NAMES="Rahul Aarav Riya Ananya Kabir Ishaan Meera Arjun Diya Aditya Anaya Dev Neha Rohan Sneha Vikram Pooja Karan Isha Tanvi Yash Kavya Nikhil Sanya Varun Tara Harsh Naina Ayaan Zoya Mohit Aisha Siddharth Pranav Kriti Rishi Myra Aryan Simran Veer Anika Parth Lavanya Jay Mitali Samar Ira Tejas Nandini".split(" ");
const BR=['CSE','ECE','IT','ME','CE','EE','AI','DS'];
const ord=y=>['','1st','2nd','3rd','4th'][y]+' Year';
const LEVELS={easy:{n:5,t:7,h:0},medium:{n:7,t:5,h:1},hard:{n:10,t:4,h:1}};
const PLAN=['easy','easy','medium','medium','hard','hist','search'];
const LBL={easy:'EASY',medium:'MEDIUM',hard:'HARD',hist:'SPECIAL · TIMELINE',search:'SPECIAL · MEANING'};
function genRecs(n){const names=pick(NAMES,n),ids=new Set();while(ids.size<n)ids.add(100+Math.random()*900|0);
 const brs=pick(BR,n>6?4:5);
 return [...ids].sort((a,b)=>a-b).map((id,i)=>({id:String(id),n:names[i],b:R(brs),y:1+Math.random()*4|0,h:R(['Hostel','Day Scholar'])}))}
/* ===== QUESTION GENERATION ===== */
function opts(ans,pool){const o=[...new Set(pool.filter(x=>x!==ans))];let k=0;while(o.length<3)o.push('—'+(++k));return shuf([ans,...pick(o,3)])}
const uniq=(rs,f)=>rs.filter(r=>rs.filter(x=>f(x)==f(r)).length==1);
const QB={
 val:rs=>{const r=R(rs);return{text:`What branch was student ${r.id} in?`,ans:r.b,opts:opts(r.b,BR),hl:[r.id]}},
 year:rs=>{const r=R(rs);const a=ord(r.y);return{text:`What year was student ${r.id} in?`,ans:a,opts:opts(a,[1,2,3,4].map(ord)),hl:[r.id]}},
 name:rs=>{const r=R(rs);return{text:`What was the name of student ${r.id}?`,ans:r.n,opts:opts(r.n,rs.map(x=>x.n)),hl:[r.id]}},
 idOf:rs=>{const r=R(rs);return{text:`What was ${r.n}'s student ID?`,ans:r.id,opts:opts(r.id,rs.map(x=>x.id)),hl:[r.id]}},
 combo:rs=>{const r=R(rs),a=`${r.b}, ${ord(r.y)}`;const pool=rs.map(x=>`${x.b}, ${ord(x.y)}`).concat([`${r.b}, ${ord(r.y%4+1)}`,`${R(BR.filter(b=>b!=r.b))}, ${ord(r.y)}`]);
  return{text:`What branch and year was ${r.n} in?`,ans:a,opts:opts(a,pool),hl:[r.id]}},
 which:rs=>{const u=uniq(rs,x=>x.b);if(!u.length)return null;const r=R(u);return{text:`Which student was in ${r.b}?`,ans:r.n,opts:opts(r.n,rs.map(x=>x.n)),hl:[r.id]}},
 hy:rs=>{const r=R(rs),a=`${ord(r.y)}, ${r.h}`;const pool=[`${ord(r.y)}, ${r.h=='Hostel'?'Day Scholar':'Hostel'}`,`${ord(r.y%4+1)}, ${r.h}`,`${ord((r.y+1)%4+1)}, ${r.h}`,`${ord(r.y%4+1)}, ${r.h=='Hostel'?'Day Scholar':'Hostel'}`];
  return{text:`What year was ${r.n} in, and where did they stay?`,ans:a,opts:opts(a,pool),hl:[r.id]}},
 count:rs=>{const r=R(rs),hl=rs.filter(x=>x.b==r.b),c=hl.length;const pool=[c-2,c-1,c+1,c+2,c+3].filter(x=>x>=0).map(String);
  return{text:`How many students were in ${r.b}?`,ans:String(c),opts:opts(String(c),pool),hl:hl.map(x=>x.id)}},
 multi:rs=>{const u=uniq(rs,x=>x.b+x.y);if(!u.length)return null;const r=R(u);return{text:`Which student was in ${r.b} and ${ord(r.y)}?`,ans:r.n,opts:opts(r.n,rs.map(x=>x.n)),hl:[r.id]}},
 idBr:rs=>{const u=uniq(rs,x=>x.b);if(!u.length)return null;const r=R(u);return{text:`What was the ID of the ${r.b} student?`,ans:r.id,opts:opts(r.id,rs.map(x=>x.id)),hl:[r.id]}}};
const QT={easy:['val','year','name','idOf'],medium:['combo','which','hy'],hard:['count','multi','idBr']};
function genRound(level){const L=LEVELS[level];
 for(let i=0;i<40;i++){const rs=genRecs(L.n),q=QB[R(QT[level])](rs);if(!q)continue;
  const cols=['ID','NAME','BRANCH','YEAR'].concat(L.h?['STAY']:[]);
  return{secs:L.t,q,snap:{title:'DATABASE SNAPSHOT',cols,tpl:L.h?'.8fr 1.6fr 1fr 1.1fr 1.4fr':'1fr 2fr 1.2fr 1.2fr',
   rows:rs.map(r=>({k:r.id,c:[r.id,r.n,r.b,ord(r.y)].concat(L.h?[r.h]:[])})),hl:q.hl}}}}
function genHist(){const n=R(NAMES),bs=pick(BR,4),T=['10:00 AM','12:00 PM','2:00 PM'],A=['11:00 AM','1:00 PM','3:00 PM'];
 let y=1+Math.random()*3|0;const st=[0,1,2].map(i=>{if(i)y=Math.min(4,y+(Math.random()<.5?1:0));return{b:bs[i],y}});
 const i=Math.random()*3|0;
 return{secs:6,q:{text:`What was ${n}'s branch at ${A[i]}?`,ans:st[i].b,opts:shuf([bs[0],bs[1],bs[2],bs[3]]),hl:[i]},
  snap:{title:'DATABASE SNAPSHOT',tpl:'14vh 1fr',rows:st.map((s,j)=>({k:j,c:[T[j],`${n} — ${s.b} — Year ${s.y}`]})),hl:[i]}}}
const CL=[{q:'college attendance',i:[['Built an app for tracking student attendance.','Attendance app'],['Made software for monitoring student presence.','Presence monitor']]},
{q:'borrowing books',i:[['Developed a college library management system.','Library system'],['Created a tool to track borrowed books.','Book tracker']]},
{q:'weather forecasting',i:[['Created a weather prediction program.','Weather predictor'],['Built a rainfall forecast app.','Rain forecaster']]},
{q:'ordering food',i:[['Designed a canteen food ordering website.','Canteen ordering'],['Made an app to pre-book mess meals.','Meal booking']]},
{q:'fitness tracking',i:[['Built a step counter for campus runners.','Step counter'],['Wrote a workout tracking tool.','Workout tracker']]},
{q:'parking spaces',i:[['Developed a vehicle parking slot finder.','Parking finder'],['Created a bike stand booking system.','Bike stand booking']]}];
function genSearch(){const [A,B,C]=pick(CL,3),it=shuf([[...A.i[0],1],[...A.i[1],1],[...B.i[0],0],[...C.i[0],0]]);
 const pr=(x,y)=>[x,y].sort().join('  +  '),a=A.i.map(x=>x[1]),d=[B.i[0][1],C.i[0][1]];
 return{secs:6,q:{text:`Which two records are related to “${A.q}”?`,ans:pr(a[0],a[1]),opts:shuf([pr(a[0],a[1]),pr(d[0],d[1]),pr(a[0],d[0]),pr(a[1],d[1])]),hl:[]},
  snap:{title:'INCOMING RECORDS',tpl:'1fr',rows:it.map((x,j)=>({k:j,c:[x[0]]})),hl:it.map((x,j)=>x[2]?j:-1).filter(j=>j>=0)}}}

module.exports={shuf,genRound,genHist,genSearch,PLAN,LBL};
