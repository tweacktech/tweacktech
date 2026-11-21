import WebSocket from 'ws';
const C='http://127.0.0.1:9222',A='http://localhost:5050',X='http://localhost:5001/api',H={'Content-Type':'application/json'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tab=await (await fetch(`${C}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl,{perMessageDeflate:false});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});
let id=1;const p=new Map();ws.on('message',raw=>{const m=JSON.parse(raw);if(m.id&&p.has(m.id)){const x=p.get(m.id);p.delete(m.id);m.error?x.j(new Error(m.error.message)):x.r(m.result)}});
const send=(method,params={})=>new Promise((r,j)=>{const i=id++;p.set(i,{r,j});ws.send(JSON.stringify({id:i,method,params}))});
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||e);return r.result?.value};
const wait=async(e,ms=20000)=>{const s=Date.now();while(Date.now()-s<ms){if(await ev(e))return true;await sleep(300)}return false};
await send('Page.enable');await send('Runtime.enable');

// Login as student once
await send('Page.navigate',{url:`${A}/login`});await sleep(900);
await ev(`fetch('${X}/auth/login',{method:'POST',headers:${JSON.stringify(H)},body:JSON.stringify({email:'student@tweacktech.com',password:'password@123'})}).then(r=>r.json()).then(j=>{const d=j.data||j;localStorage.setItem('tweacktech-token',d.tokens.accessToken);localStorage.setItem('tweacktech-refresh-token',d.tokens.refreshToken);localStorage.setItem('tweacktech-profile',JSON.stringify(d.user));})`);

const pages=[
 ['landing','/'],
 ['courses','/courses'],
 ['course detail','/courses/d09606bd-7ffc-4a2f-8284-df4b57756dba'],
 ['lesson','/courses/d09606bd-7ffc-4a2f-8284-df4b57756dba/lessons/8bef94a1-c9c1-4d08-8445-ce9089d99146'],
 ['dashboard','/dashboard'],
 ['assignments','/assignments'],
 ['payments','/payments'],
 ['talent','/talent'],
 ['jobs','/jobs'],
 ['blog','/blog'],
];
const widths=[320,360,390,414,768,1024];
const results={};
for(const width of widths){
 await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
 results[width]={};
 for(const [name,path] of pages){
  await send('Page.navigate',{url:`${A}${path}`});
  await sleep(1600);
  const r=await ev(`(()=>{
    const vw=window.innerWidth;
    const sw=document.documentElement.scrollWidth;
    const wide=[...document.querySelectorAll('body *')].filter(e=>{
      const b=e.getBoundingClientRect();
      return b.width>0 && b.right>vw+2 && getComputedStyle(e).position!=='fixed' && getComputedStyle(e).overflowX!=='auto';
    }).slice(0,4).map(e=>({tag:e.tagName,cls:String(e.className||'').slice(0,50),right:Math.round(e.getBoundingClientRect().right)}));
    return {vw,sw,overflow:sw>vw+1,wide};
  })()`);
  results[width][name]=r;
 }
}
console.log(JSON.stringify(results,null,1));ws.close();
