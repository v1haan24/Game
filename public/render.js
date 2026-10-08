/* ===== RENDER: SNAPSHOT ===== */
function snapHTML(s,hl,gl){return`<div class="snap ${gl?'glitch':''}" style="--cols:${s.tpl}"><div class="st">${s.title}</div>`+
 (s.cols?`<div class="row hd">${s.cols.map(c=>`<span>${c}</span>`).join('')}</div>`:'')+
 s.rows.map((r,i)=>`<div class="row ${hl&&s.hl.includes(r.k)?'hl':''}" style="--d:${i*90}ms;--i:${i}">${r.c.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`).join('')+`</div>`}
/* ===== RENDER: HOST / PRESENTER ===== */
function hostView(){const g=G,n=Object.keys(g.players).length;
 const hd=`<header><b class="g">MEMORADB</b><span>${g.round?`ROUND ${g.round}/${PLAN.length} · ${LBL[g.kind]}`:'MEMORY TEST'}</span><span>${g.mode=='net'?`CODE <b class="g">${g.code}</b> · ${n} 👥`:'LOCAL · '+n+' 👥'}</span><button data-act="end">END GAME</button></header>`;
 const ft=`<div class="foot mono">${g.hist.join('   ')}</div>`;let b='';
 switch(g.phase){
 case'lobby':b=g.mode=='net'?`<h2 class="mut">Join on your phone</h2><div class="code mono g">${g.code}</div><div class="plist">${Object.values(g.players).map(x=>`<span class="chip on">✓ ${esc(x)}</span>`).join('')||'<span class="mut">Waiting for players…</span>'}</div><div class="mut">${n} player${n==1?'':'s'} connected</div>`
  :`<h2>Add players</h2><input id="nm" class="inp" maxlength="14" placeholder="NAME" style="max-width:420px"><button class="btn ghost" data-act="add">ADD</button><div class="plist">${Object.values(g.players).map(x=>`<span class="chip on">✓ ${esc(x)}</span>`).join('')}</div>`;
  b+=`<button class="btn" data-act="start" ${g.mode=='local'&&!n?'disabled':''}>START ROUND</button>`;break;
 case'ready':b=g.cnt=='GO!'?`<div class="big g">GO!</div>`:`<h1 class="g">MEMORADB</h1><h2>MEMORY TEST</h2><div class="mut">Round starts in…</div><div class="big am" id="cnt">${g.cnt}</div>`;break;
 case'show':case'glitch':b=snapHTML(g.snap,0,g.phase=='glitch')+(g.phase=='show'?`<div class="bar"><i id="bar"></i></div><div class="tnum mono" id="tn">${g.secs}</div>`:'')+`<div class="mut">REMEMBER IT.</div>`;break;
 case'hidden':b=`<div class="glow rd">DATABASE HIDDEN</div>`;break;
 case'ask':b=`<div class="q">${esc(g.q.text)}</div>`+(g.mode=='local'?`<div class="plist" id="who">${Object.entries(g.players).map(([id,nm],i)=>`<span class="chip ${i==0?'on':''}" data-act="who" data-id="${id}" style="cursor:pointer">${esc(nm)}</span>`).join('')}</div>`:'')+
  `<div class="opts">${g.q.opts.map((o,i)=>g.mode=='local'?`<button class="opt" data-act="opt" data-o="${i}"><b>${'ABCD'[i]}</b>${esc(o)}</button>`:`<div class="opt"><b>${'ABCD'[i]}</b>${esc(o)}</div>`).join('')}</div><div class="mono mut"><span id="el">0.0s</span> · <span id="oc"></span></div>`;break;
 case'won':{const w=g.winner;b=`<div class="won"><div>${w?`<div class="win g">🏆 WINNER</div><h1>${esc(w.n)}</h1><h2>Correct answer: <span class="g">${esc(g.q.ans)}</span></h2><div class="tnum mono">Answered in ${(w.ms/1000).toFixed(2)} seconds</div>`:`<div class="win am">⏱ TIME'S UP</div><h2>Correct answer: <span class="g">${esc(g.q.ans)}</span></h2>`}
  <button class="btn" data-act="next">${g.round>=PLAN.length?'FINISH':'NEXT ROUND'}</button></div>${snapHTML(g.snap,1,0)}</div>`;break}
 case'tr':b=`<h2 class="line" style="--d:0s">You just remembered data that disappeared.</h2><h2 class="line am" style="--d:2s">But what if the database could remember it for you?</h2><h1 class="line g" style="--d:4s">That's the idea behind MemoraDB.</h1><button class="btn line" style="--d:5.5s" data-act="start">CONTINUE</button>`;break;
 case'fin':b=`<h1 class="line" style="--d:0s">You remembered.</h1><h1 class="line g" style="--d:1.8s">MemoraDB remembers too.</h1><h2 class="line mut" style="--d:3.6s">The difference?<br>You only had a few seconds.<br><span class="g">MemoraDB can keep the story of the data.</span></h2><div class="line" style="--d:5s;display:flex;gap:2vw"><button class="btn" data-act="again">PLAY AGAIN</button><button class="btn ghost" data-act="back">BACK TO PRESENTATION</button></div>`}
 return hd+`<div class="stage">${b}</div>`+ft}
/* ===== RENDER: HOME / PLAYER ===== */
function homeView(){return`<div class="home"><h1 class="g">MEMORADB</h1><h2>MEMORY TEST</h2><div class="mut">Remember it. Disappears. Be first.</div>
 <button class="btn" data-act="pnet">START A GAME (PRESENTER)</button><button class="btn ghost" data-act="pjoin">JOIN WITH PHONE</button>
 <div class="err">${homeErr}</div></div>`}
function joinView(){return`<div class="p"><h1 class="g">MEMORADB</h1><h2>MEMORY TEST</h2><div class="mut">Game code</div><input id="jc" class="inp" maxlength="5" placeholder="M8K4P"><div class="mut">Your name</div><input id="jn" class="inp" maxlength="14" placeholder="NAME" style="text-transform:none"><button class="btn" data-act="doJoin">JOIN GAME</button><div class="err">${homeErr}</div></div>`}
function playerView(){const s=S;if(!s)return`<div class="p"><h2 class="g">YOU ARE IN</h2><div class="mut">Waiting for the presenter…</div></div>`;
 const out=s.out&&s.out.includes(ME.id);
 switch(s.p){
 case'lobby':return`<div class="p"><h2 class="g">YOU ARE IN</h2><div class="mut">Waiting for the presenter…</div></div>`;
 case'ready':return`<div class="p"><div class="mut">Round ${s.r} starts in…</div><div class="big am">${s.c}</div></div>`;
 case'show':return`<div class="p"><h2>👀 WATCH THE SCREEN</h2><div class="bar" style="width:80%"><i id="bar"></i></div><div class="mut">Remember everything.</div></div>`;
 case'glitch':case'hidden':return`<div class="p"><h2 class="rd">DATABASE HIDDEN</h2></div>`;
 case'ask':return out?`<div class="p"><h2 class="rd">✗ WRONG</h2><div class="mut">You're out this round.</div></div>`:
  `<div class="p"><div class="pq">${esc(s.q)}</div><div class="popts">${s.o.map((o,i)=>`<button class="popt ${PL.r==s.r&&PL.o==i?'sel':''}" data-act="pa" data-o="${i}" ${PL.r==s.r?'disabled':''}>${esc(o)}</button>`).join('')}</div>${PL.r==s.r?'<div class="mut">Locked in…</div>':''}</div>`;
 case'won':{const w=s.w,me=w&&w.id==ME.id;return`<div class="p">${w?`<h1 class="${me?'g':''}">${me?'🏆 YOU WON!':'🏆 '+esc(w.n)+' won'}</h1><h2>${(w.ms/1000).toFixed(2)}s</h2>`:`<h1 class="am">⏱ TIME'S UP</h1>`}<div class="mut">Answer</div><h2 class="g">${esc(s.a)}</h2></div>`}
 case'tr':return`<div class="p"><h2 class="g">Look up.</h2></div>`;
 default:return`<div class="p"><h1 class="g">You remembered.</h1><h2>MemoraDB remembers too.</h2></div>`}}
