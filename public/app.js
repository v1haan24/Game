/* client: pure renderer. All game logic + timing lives on the server. */
let V='home',G=null,S=null,ws=null,tick=null,PL={},homeErr='',role='';
const ss=sessionStorage;
const ME={id:ss.pid||(ss.pid=Math.random().toString(36).slice(2,9)),name:ss.pname||''};
function send(o){if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))}
function conn(onopen){const p=location.protocol=='https:'?'wss':'ws';ws=new WebSocket(p+'://'+location.host+'/ws');
 ws.onopen=onopen;ws.onmessage=e=>onMsg(JSON.parse(e.data));
 ws.onclose=()=>{if(role)setTimeout(()=>conn(resume),1500)}}
function resume(){role=='host'?send({t:'host',code:ss.hcode}):send({t:'join',code:ss.jcode,id:ME.id,name:ME.name})}
function onMsg(m){
 if(m.t=='err'){const was=role;role='';try{ws.close()}catch(e){}V=was=='play'?'join':'home';homeErr=m.m;return render()}
 if(m.t=='host'){V='host';role='host';G=m.s;G.mode='net';ss.hcode=G.code;G.deadline=performance.now()+(G.ms||0);G.t0=performance.now()-(G.el||0);render()}
 if(m.t=='oc'){const e=$('#oc');if(e)e.textContent=m.n+' wrong'}
 if(m.t=='p'){const d=m.d,k=[d.p,d.r,(d.out||[]).includes(ME.id),d.w&&d.w.id].join();
  if(!S||S.k!=k){if(!S||S.r!=d.r)PL={};S=d;S.k=k;V='play';render()}else S.ms=d.ms}}
function render(){clearInterval(tick);
 app.innerHTML=V=='home'?homeView():V=='join'?joinView():V=='host'?hostView():playerView();
 const bar=$('#bar');
 if(bar){const ms=V=='host'?G.deadline-performance.now():S.ms||0;bar.style.transition='none';bar.style.width='100%';bar.offsetWidth;bar.style.transition=`width ${ms}ms linear`;bar.style.width='0%'}
 if(V=='host'&&(G.phase=='show'||G.phase=='ask')){const t0=G.t0,dl=G.deadline;
  tick=setInterval(()=>{const tn=$('#tn'),el=$('#el');
   if(tn)tn.textContent=Math.max(0,Math.ceil((dl-performance.now())/1000));
   if(el)el.textContent=((performance.now()-t0)/1000).toFixed(1)+'s'},100)}}
const ACT={
 pnet:()=>{homeErr='';role='host';conn(()=>send({t:'host'}))},
 pjoin:()=>{homeErr='';V='join';render()},
 doJoin:()=>{const c=$('#jc').value.trim().toUpperCase(),n=$('#jn').value.trim();
  if(c.length<5||!n){homeErr='Enter the code and your name.';return render()}
  ss.jcode=c;ss.pname=n;ME.name=n;role='play';S=null;PL={};conn(resume)},
 start:()=>send({t:'start'}),next:()=>send({t:'next'}),end:()=>send({t:'end'}),again:()=>send({t:'again'}),
 back:()=>{role='';try{ws.close()}catch(e){}ss.removeItem('hcode');location.reload()},
 pa:e=>{if(!S||PL.r==S.r)return;PL={r:S.r,o:+e.dataset.o};send({t:'ans',o:PL.o});render()}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(t&&ACT[t.dataset.act])ACT[t.dataset.act](t)});
if(ss.hcode&&location.hash=='#host'){role='host';conn(resume)}
render();
