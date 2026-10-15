import {useMemo} from 'react'
import {Scene,INIT,BASE,M,evaluate,clock} from './engine'
const TS=Array.from({length:43},(_,i)=>i*10),pct=(v:number)=>Math.round(v*100)
type S={name:string;v:number[];c:string;dash?:boolean}
const Tile=({k,v,sub,warn}:{k:string;v:string;sub?:string;warn?:boolean})=><div className="border-l-2 border-line pl-3"><div className="text-xs text-ink/60">{k}</div><div className={`font-serif text-xl ${warn?'text-amber':'text-forest'}`}>{v}</div>{sub&&<div className="text-[11px] text-ink/60">{sub}</div>}</div>
function Line({title,unit,series,T}:{title:string;unit:string;series:S[];T:number}){
 const W=420,H=170,pl=38,pb=22,mx=Math.max(1e-9,...series.flatMap(s=>s.v))*1.1
 const X=(i:number)=>pl+i/(TS.length-1)*(W-pl-8),Y=(v:number)=>H-pb-v/mx*(H-pb-10)
 return <figure className="rounded border border-line bg-white/50 p-3"><figcaption className="mb-1 flex justify-between text-sm"><span className="font-serif">{title}</span><span className="text-xs text-ink/60">{unit}</span></figcaption>
  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
   {[0,.5,1].map(f=><g key={f}><line x1={pl} x2={W-8} y1={Y(mx*f)} y2={Y(mx*f)} stroke="#d9d2c3"/><text x={pl-4} y={Y(mx*f)+3} fontSize={9} textAnchor="end" fill="#1b2a23">{Math.round(mx*f*10)/10}</text></g>)}
   {[0,12,24,36,42].map(i=><text key={i} x={X(i)} y={H-6} fontSize={9} textAnchor="middle" fill="#1b2a23">{clock(TS[i])}</text>)}
   <line x1={X(T/10)} x2={X(T/10)} y1={8} y2={H-pb} stroke="#3f7a74" strokeDasharray="3 3"><title>Current simulation time</title></line>
   {series.map(s=><polyline key={s.name} fill="none" stroke={s.c} strokeWidth={2} strokeDasharray={s.dash?'4 3':undefined} points={s.v.map((v,i)=>`${X(i)},${Y(v)}`).join(' ')}><title>{s.name}</title></polyline>)}
  </svg><div className="flex gap-3 text-xs">{series.map(s=><span key={s.name}><i style={{background:s.c}} className="mr-1 inline-block h-2 w-2 rounded-full"/>{s.name}</span>)}</div></figure>}
function Bars({title,rows,unit,warn}:{title:string;rows:{k:string;v:number;b?:number}[];unit:string;warn?:number}){
 const mx=Math.max(1e-9,...rows.flatMap(r=>[r.v,r.b??0]))
 return <figure className="rounded border border-line bg-white/50 p-3"><figcaption className="mb-2 font-serif text-sm">{title}</figcaption>
  {rows.map(r=><div key={r.k} className="mb-1.5 text-xs"><div className="flex justify-between"><span>{r.k}</span><span className="tabular-nums">{Math.round(r.v*10)/10}{unit}{r.b!==undefined&&<span className="text-ink/50"> · base {Math.round(r.b)}</span>}</span></div>
   <div className="h-2 rounded bg-line/60"><div className="h-2 rounded" style={{width:`${r.v/mx*100}%`,background:warn!==undefined&&r.v>warn?'#a8691a':'#3f7a74'}}/></div>
   {r.b!==undefined&&<div className="mt-0.5 h-1 rounded bg-line/60"><div className="h-1 rounded bg-forest/50" style={{width:`${r.b/mx*100}%`}}/></div>}</div>)}
  {!rows.length&&<p className="text-xs text-ink/60">Nothing to show.</p>}</figure>}
export default function Analytics({sc,T}:{sc:Scene;T:number}){
 const cur=useMemo(()=>TS.map(t=>evaluate(sc,t)),[sc]),bas=useMemo(()=>TS.map(t=>evaluate(INIT,t)),[])
 const m=evaluate(sc,T),b=evaluate(INIT,T)
 const mx=(a:M[],f:(x:M)=>number)=>Math.max(...a.map(f)),at=(a:M[],f:(x:M)=>number)=>clock(TS[a.reduce((w,x,i)=>f(x)>f(a[w])?i:w,0)])
 const ser=(f:(x:M)=>number):S[]=>[{name:'Current',v:cur.map(f),c:'#1f3d2f'},{name:'Baseline',v:bas.map(f),c:'#3f7a74',dash:true}]
 const nm=(id:string)=>sc.facs.find(f=>f.id===id)?.name||id
 return <div className="mx-auto max-w-7xl p-4">
  <p className="mb-3 text-xs text-ink/60">All figures are simulated estimates derived from the current layout, budget and schedule over 16:00–23:00. Dashed lines show the untouched baseline; the vertical marker is the simulation clock.</p>
  <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
   <Tile k="Peak on site" v={mx(cur,x=>x.A).toLocaleString()} sub={`baseline ${mx(bas,x=>x.A).toLocaleString()}`}/>
   <Tile k="Worst walkway" v={pct(mx(cur,x=>x.maxEdge))+'%'} sub={`at ${at(cur,x=>x.maxEdge)} · base ${pct(mx(bas,x=>x.maxEdge))}%`} warn={mx(cur,x=>x.maxEdge)>.85}/>
   <Tile k="Longest queue" v={mx(cur,x=>x.maxWait).toFixed(0)+' min'} sub={`at ${at(cur,x=>x.maxWait)} · base ${mx(bas,x=>x.maxWait).toFixed(0)}`} warn={mx(cur,x=>x.maxWait)>10}/>
   <Tile k="Peak staffing gap" v={String(Math.max(0,mx(cur,x=>x.gap)))} sub={`base ${Math.max(0,mx(bas,x=>x.gap))}`} warn={mx(cur,x=>x.gap)>0}/>
   <Tile k="Medical load (peak)" v={pct(mx(cur,x=>x.medUtil))+'%'} sub={`~${Math.round(mx(cur,x=>x.inc))} incidents/hr`} warn={mx(cur,x=>x.medUtil)>1}/>
   <Tile k="Gate wait (peak)" v={mx(cur,x=>x.gw).toFixed(0)+' min'} warn={mx(cur,x=>x.gw)>10}/>
   <Tile k="Budget used" v={pct(m.spend/sc.total)+'%'} sub={`₹${m.remain}k left`} warn={m.remain<0}/>
  </div>
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   <Line title="Attendance on site" unit="people" T={T} series={ser(x=>x.A)}/>
   <Line title="Peak walkway load" unit="% of capacity" T={T} series={ser(x=>x.maxEdge*100)}/>
   <Line title="Longest queue" unit="minutes" T={T} series={ser(x=>x.maxWait)}/>
   <Line title="Security: needed vs on duty" unit="staff" T={T} series={[{name:'Needed',v:cur.map(x=>x.req),c:'#a8691a'},{name:'On duty',v:cur.map(x=>x.have),c:'#1f3d2f'}]}/>
   <Line title="Gate entry wait" unit="minutes" T={T} series={ser(x=>x.gw)}/>
   <Line title="Medical load" unit="% of capacity" T={T} series={ser(x=>x.medUtil*100)}/>
   <Bars title="Queues right now" unit=" min" warn={6} rows={Object.entries(m.wait).map(([id,v])=>({k:nm(id),v,b:b.wait[id]})).sort((p,q)=>q.v-p.v)}/>
   <Bars title="Walkway load right now" unit="%" warn={85} rows={m.edgeP.map((p,k)=>({k:`W${k+1}`,v:p*100,b:b.edgeP[k]*100}))}/>
   <Bars title="Budget allocation (₹k)" unit="k" rows={Object.keys(BASE).map(c=>({k:c,v:sc.budget[c],b:BASE[c]}))}/>
  </div></div>}
