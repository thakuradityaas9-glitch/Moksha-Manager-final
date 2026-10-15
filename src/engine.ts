// Deterministic rule-based engine. All numbers are illustrative estimates.
export type Kind='stage'|'food'|'merch'|'sponsor'|'gate'|'wash'|'medical'|'exit'
export interface Fac{id:string;name:string;kind:Kind;x:number;y:number;cap:number;open:boolean}
export interface Scene{facs:Fac[];budget:Record<string,number>;total:number;peak:number;blocked:boolean;delay:number}
export interface Step{text:string;ids:string[];edges:number[]}
type P={x:number;y:number}
export const BASE:Record<string,number>={Stages:450,Sound:250,Lighting:200,Stalls:300,Security:300,Sanitation:150,Medical:150,Logistics:200}
const F=(id:string,name:string,kind:Kind,x:number,y:number,cap=0,open=true):Fac=>({id,name,kind,x,y,cap,open})
export const INIT:Scene={facs:[F('main','Main Stage','stage',500,150,2200),F('s2','Stage 2','stage',820,430,1000),F('f1','Food Court A','food',200,210,30),F('f2','Food Court B','food',260,400,30),F('m1','Merch Row','merch',700,300,14),F('m2','Merch Corner','merch',360,480,14),F('sp1','Sponsor Booth 1','sponsor',660,190,20),F('sp2','Sponsor Booth 2','sponsor',330,300,20),F('gA','Gate A (West)','gate',30,300),F('gB','Gate B (South)','gate',500,575),F('gC','Gate C (East)','gate',970,300,0,false),F('w1','Washrooms W','wash',120,470,18),F('w2','Washrooms E','wash',880,200,18),F('med','Medical Point','medical',500,380,10),F('x1','Exit NW','exit',60,60),F('x2','Exit SE','exit',950,560),F('x3','Exit NE','exit',950,40)],budget:{...BASE},total:2200,peak:5000,blocked:false,delay:0}
export const J:P[]=Array.from({length:9},(_,i)=>({x:[140,500,860][i%3],y:[110,300,490][Math.floor(i/3)]}))
export const E:[number,number][]=[];J.forEach((_,i)=>{if(i%3<2)E.push([i,i+1]);if(i<6)E.push([i,i+3])})
const CAP=2400,len=E.map(([a,b])=>Math.hypot(J[a].x-J[b].x,J[a].y-J[b].y))
export const BLK=E.findIndex(([a,b])=>a===1&&b===4)
export const d=(a:P,b:P)=>Math.hypot(a.x-b.x,a.y-b.y)
export const nearJ=(p:P)=>J.reduce((b,q,i)=>d(p,q)<d(p,J[b])?i:b,0)
export const ACTS=[{s:'main',n:'Headliner I',a:90,b:150,d:6},{s:'main',n:'Headliner II',a:200,b:280,d:9},{s:'main',n:'Finale',a:320,b:390,d:7},{s:'s2',n:'Battle of Bands',a:60,b:130,d:3},{s:'s2',n:'Dance Showcase',a:150,b:230,d:4},{s:'s2',n:'Open Mic',a:260,b:340,d:3}]
export const live=(sc:Scene,t:number,s:string)=>ACTS.find(a=>{const o=s==='main'?sc.delay:0;return a.s===s&&t>=a.a+o&&t<a.b+o})
export const clock=(t:number)=>{const m=16*60+Math.floor(t);return `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
export const mv=(sc:Scene,id:string,x:number,y:number):Scene=>({...sc,facs:sc.facs.map(f=>f.id===id?{...f,x,y}:f)})
export function route(sc:Scene,a:number,b:number,load:number[]=[]){
 const D=Array(9).fill(1e9),Pv:number[]=Array(9).fill(-1),Q=[...Array(9).keys()];D[a]=0
 while(Q.length){Q.sort((x,y)=>D[x]-D[y]);const u=Q.shift()!;if(D[u]>=1e9)break
  E.forEach(([p,q],k)=>{if(sc.blocked&&k===BLK)return;const v=p===u?q:q===u?p:-1;if(v<0)return;const c=D[u]+len[k]*(1+1.5*(load[k]||0)/CAP);if(c<D[v]){D[v]=c;Pv[v]=k}})}
 const es:number[]=[],ns=[b];let c=b
 while(c!==a&&Pv[c]>=0){const k=Pv[c];es.push(k);c=E[k][0]===c?E[k][1]:E[k][0];ns.push(c)}
 return{es,ns:ns.reverse()}}
export function evaluate(sc:Scene,t:number){
 const gates=sc.facs.filter(f=>f.kind==='gate'&&f.open),nG=gates.length
 const mu=(c:string)=>Math.max(.4,Math.min(1.6,.5+.5*sc.budget[c]/BASE[c]))
 // gates: entry throughput scales with Logistics spend; long entry queues turn people away
 const A0=nG?Math.round(sc.peak*Math.max(.08,Math.min(1,t/120,(420-t)/90))):0,rg=A0/Math.max(1,nG)*.03/(90*mu('Logistics')),gw=Math.min(60,2*rg/(1-Math.min(rg,.96))),A=Math.round(A0*(1-Math.min(.3,gw/120)))
 const at=sc.facs.filter(f=>f.open&&!['gate','exit'].includes(f.kind)),ml=live(sc,t,'main')
 const w0=(f:Fac)=>{const L=live(sc,t,f.id);return f.kind==='stage'?(L?L.d:.6):f.kind==='food'?2.2*(ml?1:1.6):({merch:1,sponsor:.8,wash:.7,medical:.05} as Record<string,number>)[f.kind]}
 const gd=(f:Fac)=>Math.min(900,...gates.map(g=>d(g,f)))
 const cp=(f:Fac)=>f.cap*(f.kind==='wash'?mu('Sanitation'):f.kind==='medical'?mu('Medical'):mu('Stalls'))
 const RT:Record<string,number>={food:.04,merch:.04,sponsor:.03,wash:.08,medical:.01}
 let vis:Record<string,number>={},wait:Record<string,number>={}
 for(let p=0;p<3;p++){ // queue-aversion feedback: long queues push demand elsewhere
  const w=at.map(f=>w0(f)*(1.25-.5*gd(f)/900)/(1+(wait[f.id]||0)/12)),S=w.reduce((a,b)=>a+b,0)||1
  vis={};at.forEach((f,i)=>vis[f.id]=A*w[i]/S);const nw:Record<string,number>={}
  at.forEach(f=>{const r=RT[f.kind];if(r&&cp(f)>0){const rho=vis[f.id]*r/cp(f);nw[f.id]=Math.min(60,2*rho/(1-Math.min(rho,.96)))}});wait=nw}
 gates.forEach(g=>wait[g.id]=gw)
 const load=E.map(()=>0);let ws=0
 at.forEach(f=>{const v=vis[f.id]||0,jf=nearJ(f);if(!v)return
  gates.forEach(g=>{const jg=nearJ(g),q=v/nG,r=route(sc,jg,jf,load);r.es.forEach(k=>load[k]+=q);ws+=q*(d(g,J[jg])+d(f,J[jf])+r.es.reduce((s,k)=>s+len[k],0))})})
 const req=Math.ceil(A/80+(ml?8:0)+(sc.blocked?6:0)),have=Math.floor(sc.budget.Security/6),gap=req-have,rq=Math.max(1,req)
 const mk=gap>0?1+Math.min(.25,gap/rq*.5):1-Math.min(.15,(have-req)/rq*.3) // marshals ease crowds; shortages let them bunch up
 const edgeP=load.map(l=>l*mk/CAP)
 const ex=sc.facs.filter(f=>f.kind==='exit'&&f.open),mn=sc.facs.find(f=>f.id==='main')
 const evac=!ex.length||!mn?99:Math.min(99,Math.min(...ex.map(e=>d(e,mn)))*.4/1.3/60+(vis.main||0)/(ex.length*150))
 const spend=Object.values(sc.budget).reduce((a,b)=>a+b,0),remain=sc.total-spend
 const maxEdge=Math.max(...edgeP),maxWait=Math.max(0,...Object.values(wait)),risks:string[]=[]
 const inc=A*.003*(1+Math.max(0,maxEdge-.8)*3),mc=sc.facs.filter(f=>f.kind==='medical'&&f.open).reduce((s,f)=>s+f.cap,0)*mu('Medical')*1.2,medUtil=mc?inc/mc:inc?9:0
 if(medUtil>1)risks.push(`Medical points overloaded (${Math.round(medUtil*100)}%)`)
 if(gw>10)risks.push(`Gate entry wait ~${gw.toFixed(0)} min`)
 if(!nG)risks.push('No open gates: nobody can enter')
 if(maxEdge>1)risks.push(`Walkway W${edgeP.indexOf(maxEdge)+1} over capacity (${Math.round(maxEdge*100)}%)`)
 if(gap>0)risks.push(`${gap} security staff short`)
 if(evac>6)risks.push(`Main-stage evacuation ~${evac.toFixed(1)} min`)
 if(remain<0)risks.push(`Overspent by ₹${-remain}k`)
 if(t>240&&sc.budget.Lighting<BASE.Lighting*.7)risks.push('Dim walkways after dusk')
 return{A,vis,wait,edgeP,walk:A?ws/A*.4:0,req,have,gap,evac,spend,remain,maxEdge,maxWait,risks,ml,mu,gw,inc,medUtil}}
export type M=ReturnType<typeof evaluate>
const pc=(v:number)=>Math.round(v*100)
export function ripple(label:string,a:Scene,b:Scene,t:number):Step[]{
 const x=evaluate(a,t),y=evaluate(b,t),nm=(id:string)=>(b.facs.find(f=>f.id===id)||a.facs.find(f=>f.id===id))?.name||id
 const s:Step[]=[{text:label,ids:[],edges:[]}],ids=[...new Set([...Object.keys(x.vis),...Object.keys(y.vis)])]
 ids.map(i=>[i,(y.vis[i]||0)-(x.vis[i]||0)] as [string,number]).filter(([,v])=>Math.abs(v)>Math.max(40,y.A*.012)).sort((p,q)=>Math.abs(q[1])-Math.abs(p[1])).slice(0,2)
  .forEach(([i,v])=>s.push({text:`${nm(i)} now draws ${v>0?'+':''}${Math.round(v)} visitors: demand rebalances by attraction pull, gate distance and queue aversion.`,ids:[i],edges:[]}))
 if(Math.abs(y.walk-x.walk)>1)s.push({text:`Average walk ${x.walk.toFixed(0)}→${y.walk.toFixed(0)} m: gate-to-attraction routes ${y.walk>x.walk?'lengthen':'shorten'}.`,ids:[],edges:[]})
 y.edgeP.map((p,k)=>[k,p-x.edgeP[k]] as [number,number]).filter(([,v])=>Math.abs(v)>.05).sort((p,q)=>Math.abs(q[1])-Math.abs(p[1])).slice(0,2)
  .forEach(([k,v])=>s.push({text:`Walkway W${k+1} load ${pc(x.edgeP[k])}→${pc(y.edgeP[k])}%: ${v>0?'more':'fewer'} routes now cross it.`,ids:[],edges:[k]}))
 ids.map(i=>[i,(y.wait[i]||0)-(x.wait[i]||0)] as [string,number]).filter(([,v])=>Math.abs(v)>.8).sort((p,q)=>Math.abs(q[1])-Math.abs(p[1])).slice(0,2)
  .forEach(([i,v])=>s.push({text:`${nm(i)} queue ${(x.wait[i]||0).toFixed(0)}→${(y.wait[i]||0).toFixed(0)} min: arrivals ${v>0?'rise':'fall'} against its service capacity.`,ids:[i],edges:[]}))
 if(y.gap!==x.gap)s.push({text:`Security gap ${x.gap}→${y.gap}: crowd size and hotspots change staffing need.`,ids:[],edges:[]})
 if(Math.abs(y.evac-x.evac)>.5)s.push({text:`Main-stage evacuation ${x.evac.toFixed(1)}→${y.evac.toFixed(1)} min: exit distance and audience size changed.`,ids:['main'],edges:[]})
 if(s.length===1)s.push({text:'No significant downstream change at this hour.',ids:[],edges:[]})
 return s}
export const SCEN:{name:string;f:(s:Scene)=>Scene}[]=[
 {name:'Relocate main stage (south-east)',f:s=>mv(s,'main',700,520)},
 {name:'Relocate food court (north-east)',f:s=>mv(mv(s,'f1',860,130),'f2',760,120)},
 {name:'Budget cut (-15%)',f:s=>({...s,total:1900,budget:Object.fromEntries(Object.entries(s.budget).map(([k,v])=>[k,Math.round(v*.85)]))})},
 {name:'Block north–centre walkway',f:s=>({...s,blocked:true})},
 {name:'Delay headliners 45 min',f:s=>({...s,delay:45})}]
export function suggest(sc:Scene,t:number){
 const e=evaluate(sc,t),cost=(x:M)=>x.maxEdge*40+x.maxWait+Math.max(0,x.gap)*1.5+x.evac
 const c:{title:string;why:string;trade:string;scene:Scene}[]=[]
 const sh=(a:string,b:string,n:number):Scene=>({...sc,budget:{...sc.budget,[a]:sc.budget[a]-n,[b]:sc.budget[b]+n}})
 const g=sc.facs.find(f=>f.kind==='gate'&&!f.open)
 if(g)c.push({title:`Open ${g.name}`,why:'Splits arrivals across more gates, shortening walks and unloading entry walkways.',trade:'Needs extra gate staff and security attention.',scene:{...sc,facs:sc.facs.map(f=>f.id===g.id?{...f,open:true}:f)}})
 if(sc.blocked)c.push({title:'Clear the blocked walkway',why:'Restores the direct north–centre route and removes detours.',trade:'Pulls a crew away from logistics.',scene:{...sc,blocked:false}})
 const q=sc.facs.filter(f=>f.kind!=='gate'&&e.wait[f.id]>3).sort((a,b)=>e.wait[b.id]-e.wait[a.id])[0]
 if(q){const h=J.map((_,i)=>E.reduce((s,[p,r],k)=>s+(p===i||r===i?e.edgeP[k]:0),0)),i=h.indexOf(Math.min(...h))
  c.push({title:`Move ${q.name} to a quieter junction`,why:'Puts the busiest queue on walkways with spare capacity.',trade:'Visitors must relearn the location; power/water rework needed.',scene:mv(sc,q.id,J[i].x+40,J[i].y+40)})}
 if(e.gap>0)c.push({title:'Shift ₹60k from Lighting to Security',why:'Closes part of the staffing gap.',trade:'Dimmer walkways after dusk.',scene:sh('Lighting','Security',60)})
 if(e.maxWait>6)c.push({title:'Shift ₹60k from Sound to Stalls',why:'Raises stall service rate and cuts queue times.',trade:'Weaker stage audio coverage.',scene:sh('Sound','Stalls',60)})
 return c.map(s=>({...s,m:evaluate(s.scene,t)})).filter(s=>cost(e)-cost(s.m)>.05).sort((a,b)=>cost(a.m)-cost(b.m)).slice(0,3)}
