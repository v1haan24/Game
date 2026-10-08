// End-to-end check: 1 host + 3 phones, plays all 7 rounds against a live server.
const {spawn}=require('child_process'),WS=require('ws'),assert=require('assert');
const port=3456,srv=spawn('node',['server.js'],{env:{...process.env,PORT:port},stdio:'inherit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const open=()=>new Promise(r=>{const w=new WS('ws://localhost:'+port+'/ws');w.on('open',()=>r(w))});
(async()=>{await sleep(700);
 const host=await open();let H={},seen=new Set();host.on('message',m=>{m=JSON.parse(m);if(m.t=='host'){H=m.s;seen.add(H.phase+':'+H.kind)}});
 host.send(JSON.stringify({t:'host'}));await sleep(200);const code=H.code;assert(code&&code.length==5);
 const P=['a','b','c'].map(id=>({id,msgs:[]}));
 for(const p of P){p.ws=await open();p.ws.on('message',m=>{m=JSON.parse(m);if(m.t=='p'){p.d=m.d;p.msgs.push(m.d)}});p.ws.send(JSON.stringify({t:'join',code,id:p.id,name:'P'+p.id}))}
 const bad=await open();let err;bad.on('message',m=>err=JSON.parse(m));bad.send(JSON.stringify({t:'join',code:'ZZZZZ',id:'x',name:'x'}));
 await sleep(300);assert.equal(Object.keys(H.players).length,3);assert.equal(err.t,'err');
 const wait=async(f,ms=40000)=>{const t=Date.now();while(!f()){if(Date.now()-t>ms)throw new Error('timeout '+H.phase+' r'+H.round);await sleep(25)}};
 const wins=[];
 for(let r=1;r<=7;r++){
  host.send(JSON.stringify({t:'start'}));await wait(()=>H.phase=='ask'&&H.round==r);
  const ans=H.q.ans,o=H.q.opts,right=o.indexOf(ans),wrong=o.findIndex(x=>x!==ans);
  assert(right>=0&&o.length==4,'4 options incl answer');
  // players never receive snapshot or answer before the round is won
  P.forEach(p=>p.msgs.filter(d=>d.p!='won').forEach(d=>{assert(!('snap' in d)&&!('a' in d))}));
  // a wrong, then b right (first correct), then c right late, a retries right (must be ignored)
  P[0].ws.send(JSON.stringify({t:'ans',o:wrong}));await sleep(60);
  P[1].ws.send(JSON.stringify({t:'ans',o:right}));await sleep(30);
  P[2].ws.send(JSON.stringify({t:'ans',o:right}));P[0].ws.send(JSON.stringify({t:'ans',o:right}));
  await wait(()=>H.phase=='won');assert.equal(H.winner.id,'b','first correct wins');assert(H.winner.ms>0&&H.winner.ms<2000);
  wins.push(H.winner.n+' '+H.winner.ms+'ms');
  if(r<7){host.send(JSON.stringify({t:'next'}));if(r==5){await wait(()=>H.phase=='tr')}}
 }
 host.send(JSON.stringify({t:'next'}));await wait(()=>H.phase=='fin');
 console.log('rounds ok:',wins.join(' | '));console.log('phases seen:',[...seen].filter(x=>/hist|search/.test(x)).join(', '));
 host.send(JSON.stringify({t:'again'}));await wait(()=>H.phase=='lobby'&&H.round==0&&H.hist.length==0);
 // 200 random generations: unique ids/names, valid questions
 const G=require('../lib/gen');for(let i=0;i<300;i++){for(const k of ['easy','medium','hard','hist','search']){const b=k=='hist'?G.genHist():k=='search'?G.genSearch():G.genRound(k);
  assert(new Set(b.q.opts).size==4&&b.q.opts.includes(b.q.ans),k+' '+JSON.stringify(b.q));
  if(k!='hist'&&k!='search')assert(new Set(b.snap.rows.map(r=>r.c[0])).size==b.snap.rows.length)}}
 console.log('300x5 generated rounds valid');console.log('ALL PASS');srv.kill();process.exit(0)})().catch(e=>{console.error('FAIL',e);srv.kill();process.exit(1)});
