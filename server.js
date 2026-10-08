/* MemoraDB Memory Test: authoritative server. Generates data, runs timers,
   timestamps answers and decides the winner. Clients never decide anything. */
const express=require('express'),http=require('http'),{WebSocketServer}=require('ws'),Gen=require('./lib/gen');
const {PLAN}=Gen,app=express();
app.use(express.static(__dirname+'/public'));
app.get('/health',(q,r)=>r.send('ok'));
const server=http.createServer(app),wss=new WebSocketServer({server,path:'/ws'});
const rooms={},now=()=>performance.now();
const mkCode=()=>{let c;do c=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');while(rooms[c]);return c};
const tx=(ws,o)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))};
const names=r=>Object.fromEntries(Object.entries(r.players).map(([id,p])=>[id,p.name]));
function pub(r){const d={p:r.phase,r:r.round,k:r.kind,n:Object.keys(r.players).length};
 if(r.phase==='ready')d.c=r.cnt;
 if(r.phase==='show')d.ms=Math.max(0,r.deadline-now());
 if(r.phase==='ask'){d.q=r.q.text;d.o=r.q.opts;d.out=r.out}
 if(r.phase==='won'){d.w=r.winner;d.a=r.q.ans;d.last=r.round>=PLAN.length}
 return d}
function hostState(r){const s={code:r.code,phase:r.phase,round:r.round,kind:r.kind,cnt:r.cnt,secs:r.secs,hist:r.hist,players:names(r),out:r.out,winner:r.winner};
 if(r.phase==='show')s.ms=Math.max(0,r.deadline-now());
 if(r.phase==='ask')s.el=now()-r.t0;
 if(['show','glitch','won'].includes(r.phase))s.snap=r.snap;
 if(['ask','won'].includes(r.phase))s.q=r.q;
 return s}
function sync(r){tx(r.host,{t:'host',s:hostState(r)});const d=pub(r);for(const p of Object.values(r.players))tx(p.ws,{t:'p',d})}
const later=(r,f,ms)=>{const t=setTimeout(f,ms);r.tm.push(t);return t};
const clear=r=>{r.tm.forEach(clearTimeout);r.tm=[]};
const setPh=(r,p)=>{r.phase=p;r.touch=Date.now();sync(r)};
function startRound(r){clear(r);r.round++;if(r.round>PLAN.length)return setPh(r,'fin');
 const k=PLAN[r.round-1],b=k==='hist'?Gen.genHist():k==='search'?Gen.genSearch():Gen.genRound(k);
 Object.assign(r,{kind:k,snap:b.snap,q:b.q,secs:b.secs,out:[],winner:null});
 let c=3;const step=()=>{if(c>0){r.cnt=c--;setPh(r,'ready');later(r,step,850)}else{r.cnt='GO!';setPh(r,'ready');later(r,()=>show(r),750)}};step()}
function show(r){r.deadline=now()+r.secs*1000;setPh(r,'show');const ms=r.secs*1000;
 later(r,()=>setPh(r,'glitch'),ms);later(r,()=>setPh(r,'hidden'),ms+850);later(r,()=>ask(r),ms+1900)}
function ask(r){r.t0=now();setPh(r,'ask');r.askT=later(r,()=>win(r,null,0),25000)}
function submit(r,pid,o){if(r.phase!=='ask'||r.winner||r.out.includes(pid)||!r.players[pid])return;
 const t=now()-r.t0;  // server-side timestamp
 if(r.q.opts[o]===r.q.ans)win(r,pid,t);
 else{r.out.push(pid);tx(r.host,{t:'oc',n:r.out.length});tx(r.players[pid].ws,{t:'p',d:pub(r)})}}
function win(r,pid,ms){clearTimeout(r.askT);r.winner=pid?{id:pid,n:r.players[pid].name,ms:Math.round(ms)}:null;
 r.hist.push(`R${r.round} → ${r.winner?r.winner.n:'—'}`);setPh(r,'won')}
wss.on('connection',ws=>{ws.alive=true;ws.on('pong',()=>ws.alive=true);
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
  if(m.t==='host'){let r=m.code&&rooms[String(m.code).toUpperCase()];
   if(!r){r={code:mkCode(),host:null,players:{},round:0,phase:'lobby',hist:[],out:[],tm:[],touch:Date.now()};rooms[r.code]=r}
   r.host=ws;ws.room=r;ws.isHost=true;return sync(r)}
  if(m.t==='join'){const r=rooms[String(m.code||'').toUpperCase()];
   if(!r)return tx(ws,{t:'err',m:'Game code not found.'});
   const id=String(m.id||'').slice(0,12),name=String(m.name||'Player').slice(0,16);
   if(!id)return;r.players[id]={name,ws};ws.room=r;ws.pid=id;
   tx(ws,{t:'p',d:pub(r)});if(r.phase==='lobby')tx(r.host,{t:'host',s:hostState(r)});return}
  const r=ws.room;if(!r)return;
  if(ws.isHost){
   if(m.t==='start'&&(r.phase==='lobby'||r.phase==='tr'))startRound(r);
   if(m.t==='next'&&r.phase==='won'){r.round>=PLAN.length?(clear(r),setPh(r,'fin')):r.round===5?(clear(r),setPh(r,'tr')):startRound(r)}
   if(m.t==='end'){clear(r);setPh(r,'fin')}
   if(m.t==='again'){clear(r);Object.assign(r,{round:0,phase:'lobby',hist:[],out:[],winner:null});sync(r)}}
  else if(m.t==='ans'&&ws.pid)submit(r,ws.pid,+m.o)});
 ws.on('close',()=>{const r=ws.room;if(!r)return;if(ws.isHost&&r.host===ws)r.host=null;
  if(ws.pid&&r.players[ws.pid]&&r.players[ws.pid].ws===ws)r.players[ws.pid].ws=null})});
setInterval(()=>{wss.clients.forEach(ws=>{if(!ws.alive)return ws.terminate();ws.alive=false;ws.ping()});
 for(const c in rooms)if(Date.now()-rooms[c].touch>6*3600e3){clear(rooms[c]);delete rooms[c]}},25000);
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('MemoraDB Memory Test on http://localhost:'+PORT));
