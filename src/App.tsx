import Analytics from './Analytics'
import {useEffect,useMemo,useRef,useState} from 'react'
import {INIT,BASE,J,E,BLK,ACTS,SCEN,Scene,Kind,Step,evaluate,ripple,suggest,route,nearJ,clock,mv} from './engine'
const COL:Record<Kind,string>={stage:'#1f3d2f',food:'#3f7a74',merch:'#7a9e8f',sponsor:'#a3b3a0',gate:'#1f3d2f',wash:'#8fa9b0',medical:'#fff',exit:'#fff'}
const DEF:Record<string,[Kind,number,string]>={Food:['food',30,'Food Stall'],Merch:['merch',14,'Merch Stall'],Sponsor:['sponsor',20,'Sponsor Booth'],Stage:['stage',1000,'Stage'],Gate:['gate',0,'Gate'],Washroom:['wash',18,'Washrooms'],Medical:['medical',10,'Medical Point'],Exit:['exit',0,'Emergency Exit']}
const pct=(v:number)=>Math.round(v*100)
const btn='rounded border border-line bg-white/60 px-2 py-1 text-xs hover:bg-forest hover:text-paper disabled:opacity-40'
const Row=({k,v,warn}:{k:string;v:string;warn?:boolean})=><div className="flex justify-between border-b border-line py-1 text-sm"><span className="text-ink/70">{k}</span><span className={warn?'font-medium text-amber':''}>{v}</span></div>
const H=({c}:{c:string})=><h2 className="mb-1 mt-4 font-serif text-xs uppercase tracking-widest text-teal">{c}</h2>
const Step_=({v,on,children}:{v:number;on:(d:number)=>void;children:string})=><div className="flex items-center justify-between py-0.5 text-sm"><span>{children}</span><span className="flex items-center gap-1"><button className={btn} title={`Decrease ${children}`} aria-label={`decrease ${children}`} onClick={()=>on(-1)}>−</button><span className="w-12 text-center tabular-nums">{v}</span><button className={btn} title={`Increase ${children}`} aria-label={`increase ${children}`} onClick={()=>on(1)}>+</button></span></div>
export default function App(){
 const [h,setH]=useState({past:[] as Scene[],now:INIT,future:[] as Scene[]})
 const [log,setLog]=useState<{t:number;steps:Step[]}[]>([])
 const [t,setT]=useState(120),[play,setPlay]=useState(true),[speed,setSpeed]=useState(2),[heat,setHeat]=useState(true)
 const [page,setPage]=useState<'map'|'stats'>('map'),[hov,setHov]=useState<string|null>(null),[sel,setSel]=useState<string|null>(null),[drag,setDrag]=useState<{id:string;x:number;y:number}|null>(null)
 const [tab,setTab]=useState('Layout'),[saved,setSaved]=useState<{name:string;s:Scene}[]>([]),[prev,setPrev]=useState<Scene|null>(null),[hi,setHi]=useState<Step|null>(null)
 const svg=useRef<SVGSVGElement>(null),cv=useRef<HTMLCanvasElement>(null),T=Math.floor(t)
 const view=useMemo(()=>drag?mv(h.now,drag.id,drag.x,drag.y):h.now,[h.now,drag])
 const m=useMemo(()=>evaluate(view,T),[view,T])
 const sug=useMemo(()=>suggest(h.now,T),[h.now,T])
 const base=useMemo(()=>evaluate(INIT,T),[T])
 const commit=(label:string,next:Scene)=>{const st=ripple(label,h.now,next,T);setH({past:[...h.past,h.now],now:next,future:[]});setLog(l=>[{t:T,steps:st},...l].slice(0,20));setHi({text:'',ids:st.flatMap(s=>s.ids),edges:st.flatMap(s=>s.edges)});setPrev(null)}
 const undo=()=>{if(h.past.length){setH({past:h.past.slice(0,-1),now:h.past[h.past.length-1],future:[h.now,...h.future]});setPrev(null)}}
 const redo=()=>{if(h.future.length){setH({past:[...h.past,h.now],now:h.future[0],future:h.future.slice(1)})}}
 const reset=()=>{setH({past:[],now:INIT,future:[]});setLog([]);setHi(null);setPrev(null);setSel(null)}
 const sc=h.now,f=sc.facs.find(x=>x.id===sel)
 const add=(k:string)=>{const[kind,cap,name]=DEF[k],n=sc.facs.length;commit(`Added ${name}`,{...sc,facs:[...sc.facs,{id:`n${Date.now()}`,name,kind,cap,x:420+(n%5)*40,y:230+(n%4)*30,open:true}]})}
 const upd=(id:string,p:Partial<{open:boolean;cap:number}>,label:string)=>commit(label,{...sc,facs:sc.facs.map(x=>x.id===id?{...x,...p}:x)})
 const bud=(c:string,dir:number)=>commit(`${c} budget ${dir>0?'+':'−'}₹25k`,{...sc,budget:{...sc.budget,[c]:Math.max(0,sc.budget[c]+dir*25)}})
 useEffect(()=>{if(!play)return;const i=setInterval(()=>setT(x=>(x+speed*.25)%420),250);return()=>clearInterval(i)},[play,speed])
 const rf=useRef({view,m,play,speed,heat});rf.current={view,m,play,speed,heat}
 useEffect(()=>{
  const c=cv.current!,x=c.getContext('2d')!;let seed=7,raf=0,last=performance.now()
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  type Ag={p:{x:number;y:number}[];i:number;x:number;y:number;w:number;dw:number};const ag:Ag[]=[]
  const plan=(from:{x:number;y:number}):{p:{x:number;y:number}[];dw:number}|null=>{const{view:v,m:mm}=rf.current,at=v.facs.filter(q=>(mm.vis[q.id]||0)>0);if(!at.length)return null
   let r=rnd()*at.reduce((s,q)=>s+mm.vis[q.id],0),d=at[at.length-1];for(const q of at){r-=mm.vis[q.id];if(r<=0){d=q;break}}
   return{p:[from,...route(v,nearJ(from),nearJ(d)).ns.map(i=>J[i]),d],dw:2+rnd()*2+(mm.wait[d.id]||0)*.6}}
  const loop=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;const{view:v,m:mm,play:pl,speed:sp,heat:ht}=rf.current
   const gates=v.facs.filter(q=>q.kind==='gate'&&q.open),n=gates.length?Math.min(240,Math.round(mm.A/25)):0
   while(ag.length<n){const g=gates[Math.floor(rnd()*gates.length)],p=plan(g);if(!p)break;ag.push({p:p.p,i:0,x:g.x,y:g.y,w:0,dw:p.dw})}
   ag.length=Math.min(ag.length,n);x.clearRect(0,0,1000,600)
   if(ht)E.forEach(([a,b],k)=>{const p=mm.edgeP[k];if(v.blocked&&k===BLK)return;const col=p>.75?'168,105,26':'63,122,116'
    for(let s=0;s<=5;s++){const px=J[a].x+(J[b].x-J[a].x)*s/5,py=J[a].y+(J[b].y-J[a].y)*s/5,g=x.createRadialGradient(px,py,0,px,py,60);g.addColorStop(0,`rgba(${col},${.08+.3*Math.min(p,1.3)})`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.fillRect(px-60,py-60,120,120)}})
   ag.forEach(a=>{if(pl){if(a.w>0)a.w-=dt*sp;else{const q=a.p[a.i+1]
     if(!q){const np=plan({x:a.x,y:a.y});if(np){a.p=np.p;a.i=0;a.dw=np.dw}}
     else{const dd=Math.hypot(q.x-a.x,q.y-a.y),st=70*dt*sp*(1-Math.min(.45,Math.max(0,mm.maxEdge-.7)));if(dd<=st){a.x=q.x;a.y=q.y;a.i++;if(a.i>=a.p.length-1)a.w=a.dw}else{a.x+=(q.x-a.x)/dd*st;a.y+=(q.y-a.y)/dd*st}}}}
    x.fillStyle='rgba(31,61,47,.75)';x.beginPath();x.arc(a.x,a.y,2.4,0,7);x.fill()})
   raf=requestAnimationFrame(loop)}
  raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[])
const dragRef=useRef(drag),mapRef=useRef<HTMLDivElement>(null);dragRef.current=drag
 useEffect(()=>{const el=mapRef.current!,o={passive:false} as AddEventListenerOptions,stop=(e:Event)=>e.preventDefault()
  const tm=(e:TouchEvent)=>{if(e.touches.length>1||dragRef.current)e.preventDefault()},wh=(e:WheelEvent)=>{if(e.ctrlKey)e.preventDefault()}
  const ev=['gesturestart','gesturechange','gestureend','dblclick','contextmenu'];ev.forEach(n=>el.addEventListener(n,stop,o))
  el.addEventListener('touchstart',tm,o);el.addEventListener('touchmove',tm,o);el.addEventListener('wheel',wh,o)
  return()=>{ev.forEach(n=>el.removeEventListener(n,stop));el.removeEventListener('touchstart',tm);el.removeEventListener('touchmove',tm);el.removeEventListener('wheel',wh)}},[])
 const pt=(e:React.PointerEvent)=>{const s=svg.current!,p=s.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(s.getScreenCTM()!.inverse());return{x:Math.max(20,Math.min(980,q.x)),y:Math.max(20,Math.min(580,q.y))}}
 const drop=()=>{if(!drag)return;const o=sc.facs.find(q=>q.id===drag.id)!;if(Math.hypot(o.x-drag.x,o.y-drag.y)>8)commit(`Moved ${o.name}`,mv(sc,drag.id,Math.round(drag.x),Math.round(drag.y)));setDrag(null)}
 const cmp:[string,(x:typeof m)=>string][]=[['Peak walkway load',x=>pct(x.maxEdge)+'%'],['Longest queue',x=>x.maxWait.toFixed(0)+' min'],['Avg walk',x=>x.walk.toFixed(0)+' m'],['Security gap',x=>String(x.gap)],['Evacuation',x=>x.evac.toFixed(1)+' min'],['Budget left',x=>'₹'+x.remain+'k']]
 const congested=m.edgeP.map((p,k)=>[k,p] as [number,number]).sort((a,b)=>b[1]-a[1]).slice(0,3)
 const hq=view.facs.find(q=>q.id===hov)
 return <div className="min-h-screen">
  <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
   <h1 className="font-serif text-xl text-forest">Moksha Manager</h1><nav className="flex gap-1">{(['map','stats'] as const).map(p=><button key={p} className={`${btn} ${page===p?'bg-forest text-paper':''}`} onClick={()=>setPage(p)}>{p==='map'?'Map':'Analytics'}</button>)}</nav>
   <span className="rounded-full border border-amber/50 px-2 py-0.5 text-[11px] text-amber">Illustrative map · simulated estimates · not a crowd-safety certification</span>
   <div className="ml-auto flex flex-wrap items-center gap-1.5">
    <span className="tabular-nums text-sm">{clock(t)} · {m.A.toLocaleString()} on site</span>
    <button title={play?"Pause the simulation":"Resume the simulation"} className={btn} onClick={()=>setPlay(!play)}>{play?'Pause':'Play'}</button>
    {[1,2,4,8].map(s=><button key={s} title={`Run simulation at ${s}× speed`} className={`${btn} ${speed===s?'bg-forest text-paper':''}`} onClick={()=>setSpeed(s)}>{s}×</button>)}
    <input title="Scrub through festival time (16:00–23:00)" aria-label="Time of day" type="range" min={0} max={419} value={T} onChange={e=>setT(+e.target.value)} className="w-24"/>
    <button title="Toggle crowd-density heatmap along walkways" className={`${btn} ${heat?'bg-forest text-paper':''}`} onClick={()=>setHeat(!heat)}>Heatmap</button>
    <button title="Undo last change" className={btn} disabled={!h.past.length} onClick={undo}>Undo</button><button title="Redo" className={btn} disabled={!h.future.length} onClick={redo}>Redo</button><button title="Restore the baseline layout, budget and schedule" className={btn} onClick={reset}>Reset</button>
   </div></header>
  <div className={`${page==='map'?'':'hidden'} grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[250px_minmax(0,1fr)_290px]`}>
   <aside className="border-line p-4 lg:border-r">
    <nav className="flex gap-1">{['Layout','Budget','Scenarios'].map(n=><button key={n} className={`${btn} ${tab===n?'bg-forest text-paper':''}`} onClick={()=>setTab(n)}>{n}</button>)}</nav>
    {tab==='Layout'&&<><H c="Add facility"/><div className="flex flex-wrap gap-1">{Object.keys(DEF).map(k=><button key={k} className={btn} onClick={()=>add(k)}>+ {k}</button>)}</div>
     <H c="Attendance & schedule"/><Step_ v={sc.peak} on={d=>commit(`Peak attendance ${d>0?'+':'−'}500`,{...sc,peak:Math.max(500,sc.peak+d*500)})}>Peak crowd</Step_>
     <Step_ v={sc.delay} on={d=>commit(`Headliners delayed to +${Math.max(0,sc.delay+d*15)} min`,{...sc,delay:Math.max(0,sc.delay+d*15)})}>Delay (min)</Step_>
     <ul className="mt-2 space-y-0.5 text-xs">{ACTS.map(a=>{const o=a.s==='main'?sc.delay:0;return <li key={a.n} className={T>=a.a+o&&T<a.b+o?'font-medium text-forest':'text-ink/60'}>{clock(a.a+o)}–{clock(a.b+o)} · {a.n} ({a.s==='main'?'Main':'Stage 2'})</li>})}</ul></>}
    {tab==='Budget'&&<><H c="Allocations (₹ thousand)"/><Step_ v={sc.total} on={d=>commit(`Total budget ${d>0?'+':'−'}₹100k`,{...sc,total:sc.total+d*100})}>Total</Step_>
     {Object.keys(BASE).map(c=><Step_ key={c} v={sc.budget[c]} on={d=>bud(c,d)}>{c}</Step_>)}
     <Row k="Remaining" v={`₹${m.remain}k`} warn={m.remain<0}/><Row k="Utilisation" v={pct(m.spend/sc.total)+'%'}/>
     <Row k="Stall service rate" v={`×${m.mu('Stalls').toFixed(2)}`}/><Row k="Security" v={`${m.have} staff / ${m.req} needed`} warn={m.gap>0}/><Row k="Sanitation rate" v={`×${m.mu('Sanitation').toFixed(2)}`}/><Row k="Gate throughput" v={`×${m.mu('Logistics').toFixed(2)}`}/><Row k="Medical capacity" v={`×${m.mu('Medical').toFixed(2)}`}/></>}
    {tab==='Scenarios'&&<><H c="Scenario lab"/><div className="flex flex-col gap-1">{SCEN.map(s=><button key={s.name} className={`${btn} text-left`} onClick={()=>commit(s.name,s.f(sc))}>{s.name}</button>)}</div>
     <button className={`${btn} mt-2`} onClick={()=>setSaved([...saved,{name:`Scenario ${saved.length+1}`,s:sc}])}>Save current</button>
     {saved.map(s=><div key={s.name} className="flex items-center justify-between py-0.5 text-sm">{s.name}<button className={btn} onClick={()=>commit(`Loaded ${s.name}`,s.s)}>Load</button></div>)}
     <H c="Baseline vs current"/>{cmp.map(([k,fn])=><Row key={k} k={k} v={`${fn(base)} → ${fn(m)}`}/>)}</>}
   </aside>
   <main className="min-w-0 p-4">
    <div ref={mapRef} className="mapwrap relative aspect-[5/3] w-full overflow-hidden rounded-lg border border-line bg-[#efe9dc]">
     <svg ref={svg} viewBox="0 0 1000 600" className="absolute inset-0 h-full w-full touch-none" onPointerMove={e=>drag&&setDrag({...drag,...pt(e)})} onPointerUp={drop} onPointerCancel={()=>setDrag(null)} onPointerDown={()=>setSel(null)} role="img" aria-label="Illustrative festival map">
      <rect x={4} y={4} width={992} height={592} rx={14} fill="none" stroke="#d9d2c3"/>
      {E.map(([a,b],k)=>{const p=m.edgeP[k],bl=sc.blocked&&k===BLK,on=hi?.edges.includes(k);return <g key={k}><title>{`Walkway W${k+1}: ${pct(p)}% of capacity${bl?" (blocked)":""}`}</title><line x1={J[a].x} y1={J[a].y} x2={J[b].x} y2={J[b].y} strokeWidth={16} strokeLinecap="round" stroke={bl?'#c9c2b2':p>.85?'#e3c58f':p>.55?'#b5cbc2':'#dde3d8'} strokeDasharray={bl?'6 8':undefined} className={on?'animate-pulse':''}/>
       <text x={(J[a].x+J[b].x)/2} y={(J[a].y+J[b].y)/2+3} textAnchor="middle" fontSize={9} fill="#1b2a23">{bl?'✕ blocked':`W${k+1} · ${pct(p)}%`}</text></g>})}
      {prev&&prev.facs.map(q=>{const o=sc.facs.find(z=>z.id===q.id);return o&&(o.x!==q.x||o.y!==q.y)?<g key={q.id}><line x1={o.x} y1={o.y} x2={q.x} y2={q.y} stroke="#3f7a74" strokeDasharray="4 4"/><circle cx={q.x} cy={q.y} r={16} fill="none" stroke="#3f7a74" strokeWidth={2} strokeDasharray="4 3"/><text x={q.x} y={q.y-22} fontSize={10} textAnchor="middle" fill="#3f7a74">preview</text></g>:null})}
      {view.facs.map(q=>{const w=m.wait[q.id]||0,hl=hi?.ids.includes(q.id),s=sel===q.id
       return <g key={q.id} transform={`translate(${q.x} ${q.y})`} className="cursor-grab" opacity={q.open?1:.4} onPointerEnter={()=>setHov(q.id)} onPointerLeave={()=>setHov(null)} onPointerDown={e=>{e.stopPropagation();svg.current!.setPointerCapture(e.pointerId);setSel(q.id);setDrag({id:q.id,x:q.x,y:q.y})}}>
        {(hl||s)&&<circle r={32} fill="none" stroke={s?'#1f3d2f':'#a8691a'} strokeWidth={2} className={hl?'animate-pulse':''}/>}
        {w>5&&<circle r={22+Math.min(w,30)/2} fill="#c98a2b" opacity={.2}/>}
        {q.kind==='stage'?<rect x={-26} y={-15} width={52} height={30} rx={5} fill={COL.stage}/>:<circle r={q.kind==='gate'?11:14} fill={COL[q.kind]} stroke="#1f3d2f" strokeWidth={1.5} strokeDasharray={q.kind==='exit'||!q.open?'3 2':undefined}/>}
        <text y={q.kind==='stage'?30:28} textAnchor="middle" fontSize={11} fill="#1b2a23" className="select-none">{q.name}{w>=1?` · ${w.toFixed(0)} min`:''}</text></g>})}
     </svg>
     <canvas ref={cv} width={1000} height={600} className="pointer-events-none absolute inset-0 h-full w-full"/>
     {hq&&!drag&&<div className="pointer-events-none absolute z-10 w-48 rounded border border-line bg-paper p-2 text-xs shadow-md" style={{left:`${Math.min(hq.x/10+2,76)}%`,top:`${Math.min(hq.y/6+4,72)}%`}}>
      <div className="font-serif text-sm text-forest">{hq.name}</div><div className="text-ink/60">{hq.kind} · {hq.open?'open':'closed'}</div>
      <Row k="Visitors nearby" v={Math.round(m.vis[hq.id]||0).toLocaleString()}/>
      {hq.id in m.wait&&<Row k="Est. queue" v={m.wait[hq.id].toFixed(1)+' min'} warn={m.wait[hq.id]>6}/>}
      {hq.kind==='stage'&&<Row k="Audience / capacity" v={pct((m.vis[hq.id]||0)/hq.cap)+'%'} warn={(m.vis[hq.id]||0)>hq.cap*.85}/>}
      {hq.cap>0&&hq.kind!=='stage'&&<Row k="Service capacity" v={`${hq.cap}/min`}/>}
      <div className="mt-1 text-ink/60">Drag to relocate · click to inspect</div></div>}
    </div>
    <p className="mt-1 text-xs text-ink/60">Drag any facility to relocate it. Queue halos, walkway loads and the ripple log are derived from the current layout, budget and schedule.</p>
    <H c="Ripple timeline"/>{!log.length&&<p className="text-sm text-ink/60">Move a stage or stall, change a budget, or run a scenario to see its chain of consequences.</p>}
    <ol className="flex gap-3 overflow-x-auto pb-2">{log.map((e,i)=><li key={i} tabIndex={0} role="button" className="min-w-60 max-w-72 shrink-0 cursor-pointer rounded border border-line bg-white/50 p-3 text-xs" onClick={()=>setHi({text:'',ids:e.steps.flatMap(s=>s.ids),edges:e.steps.flatMap(s=>s.edges)})}>
     <div className="text-teal">{clock(e.t)}</div>{e.steps.map((s,j)=><div key={j} className={`mt-1 border-l-2 pl-2 ${j?'border-teal':'border-forest font-medium'}`}>{s.text}</div>)}</li>)}</ol>
   </main>
   <aside className="border-line p-4 lg:border-l">
    <H c="Inspector"/>{f?<div><div className="font-serif text-lg">{f.name}</div><Row k="Type" v={f.kind}/><Row k="Visitors nearby" v={Math.round(m.vis[f.id]||0).toLocaleString()}/>{f.id in m.wait&&<Row k="Est. queue" v={m.wait[f.id].toFixed(1)+' min'} warn={m.wait[f.id]>6}/>}
     {f.cap>0&&<Step_ v={f.cap} on={d=>upd(f.id,{cap:Math.max(1,Math.round(f.cap*(d>0?1.2:.8)))},`${f.name} capacity ${d>0?'+':'−'}20%`)}>Capacity</Step_>}
     <div className="mt-2 flex gap-1"><button className={btn} onClick={()=>upd(f.id,{open:!f.open},`${f.open?'Closed':'Opened'} ${f.name}`)}>{f.open?'Close':'Open'}</button><button className={btn} onClick={()=>{commit(`Removed ${f.name}`,{...sc,facs:sc.facs.filter(q=>q.id!==f.id)});setSel(null)}}>Remove</button></div></div>:<p className="text-sm text-ink/60">Select a facility on the map.</p>}
    <H c="Live operations"/><Row k="Attendance" v={m.A.toLocaleString()}/><Row k="Crowd pressure" v={pct(m.maxEdge)+'%'} warn={m.maxEdge>.85}/><Row k="Longest queue" v={m.maxWait.toFixed(0)+' min'} warn={m.maxWait>6}/><Row k="Avg walk" v={m.walk.toFixed(0)+' m'}/><Row k="Budget used" v={`${pct(m.spend/sc.total)}% · ₹${m.remain}k left`} warn={m.remain<0}/><Row k="Gate entry wait" v={m.gw.toFixed(0)+' min'} warn={m.gw>10}/><Row k="Medical load" v={pct(m.medUtil)+'%'} warn={m.medUtil>1}/><Row k="Staffing gap" v={m.gap>0?`${m.gap} short`:'covered'} warn={m.gap>0}/>
    <div className="mt-2 text-xs text-ink/70">Congested routes: {congested.map(([k,p])=>`W${k+1} ${pct(p)}%`).join(' · ')}</div>
    {m.risks.map(r=><div key={r} className="mt-1 rounded border border-amber/40 px-2 py-1 text-xs text-amber">{r}</div>)}
    <H c="Recovery suggestions"/>{!sug.length&&<p className="text-sm text-ink/60">No improving change found at this hour.</p>}
    {sug.map(s=><div key={s.title} className="mb-2 rounded border border-line bg-white/50 p-2 text-xs"><div className="font-medium">{s.title}</div><p className="mt-1">{s.why}</p><p className="text-ink/60">Trade-off: {s.trade}</p>
     <p className="mt-1 text-teal">Load {pct(m.maxEdge)}→{pct(s.m.maxEdge)}% · queue {m.maxWait.toFixed(0)}→{s.m.maxWait.toFixed(0)} min · gap {m.gap}→{s.m.gap}</p>
     <div className="mt-1 flex gap-1"><button className={btn} onClick={()=>setPrev(s.scene)}>Preview</button><button className={btn} onClick={()=>commit(s.title,s.scene)}>Apply</button></div></div>)}
   </aside>
  </div>{page==='stats'&&<Analytics sc={sc} T={T}/>}</div>}
