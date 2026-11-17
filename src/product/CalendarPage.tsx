import {useMemo,useRef,useState} from 'react';
import type {CSSProperties,PointerEvent as RPE} from 'react';
import {Icon} from '../ui/Icon';
import {pad,readTasks,isEmptyDay,todayISO} from './dayTasks';
import './tasks-calendar.css';
import m01 from './months/m01.webp';
import m02 from './months/m02.webp';
import m03 from './months/m03.webp';
import m04 from './months/m04.webp';
import m05 from './months/m05.webp';
import m06 from './months/m06.webp';
import m07 from './months/m07.webp';
import m08 from './months/m08.webp';
import m09 from './months/m09.webp';
import m10 from './months/m10.webp';
import m11 from './months/m11.webp';
import m12 from './months/m12.webp';
const ART=[m01,m02,m03,m04,m05,m06,m07,m08,m09,m10,m11,m12];
const artUrl=(m:number)=>ART[m-1];
const MONTHS=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
/* the poster's colour per month, translated to the TICKED palette */
const PALETTE:{bg:string;fg:string}[]=[
 {bg:'#FBD0CA',fg:'#303BC9'},{bg:'#EE5A75',fg:'#10145A'},{bg:'#303BC9',fg:'#FFF7E6'},{bg:'#C1BFDD',fg:'#303BC9'},
 {bg:'#FFF0B4',fg:'#303BC9'},{bg:'#FBD0CA',fg:'#303BC9'},{bg:'#C1BFDD',fg:'#303BC9'},{bg:'#EE5A75',fg:'#10145A'},
 {bg:'#FFE457',fg:'#303BC9'},{bg:'#303BC9',fg:'#FFF7E6'},{bg:'#FBD0CA',fg:'#303BC9'},{bg:'#303BC9',fg:'#FFF7E6'}];
const LETTERS=['M','T','W','T','F','S','S'];
const grid=(year:number,month:number)=>{const lead=(new Date(year,month,1,12).getDay()+6)%7,days=new Date(year,month+1,0).getDate();return {lead,days}};

function MonthBody({year,month,big,onDay,busy}:{year:number;month:number;big?:boolean;onDay?:(iso:string)=>void;busy:Set<string>}){
 const {lead,days}=grid(year,month),today=todayISO();
 return <div className="cal-grid">
  <h3><b>{MONTHS[month]}</b><span>{year}</span></h3>
  <div className="cal-letters" aria-hidden="true">{LETTERS.map((l,i)=><span key={i}>{l}</span>)}</div>
  <div className="cal-days">{Array.from({length:lead},(_,i)=><i key={`b${i}`}/>)}{Array.from({length:days},(_,k)=>{const n=k+1,iso=`${year}-${pad(month+1)}-${pad(n)}`;
   return big?<button type="button" key={n} className="cal-day" data-today={iso===today?'1':undefined} data-busy={busy.has(iso)?'1':undefined} aria-label={`${n} ${MONTHS[month].toLowerCase()} ${year}`} onClick={()=>onDay?.(iso)}>{n}</button>:<span key={n} className="cal-day" data-today={iso===today?'1':undefined}>{n}</span>})}</div>
 </div>;
}

/** Year at a glance (the poster) → tap a month to open it; arrows or swipe go to the previous / next month. */
export function CalendarPage({onOpenDay}:{onOpenDay:(iso:string)=>void}){
 const now=new Date();
 const [year,setYear]=useState(now.getFullYear());
 const [month,setMonth]=useState<number|null>(null);
 const down=useRef<{x:number;y:number}|null>(null);
 const busy=useMemo(()=>{const s=new Set<string>();const {store}=readTasks();for(const [k,v] of Object.entries(store.days))if(!isEmptyDay(v))s.add(k);return s},[month,year]);
 const step=(d:1|-1)=>{if(month===null)return;let m=month+d,y=year;if(m<0){m=11;y--}if(m>11){m=0;y++}setMonth(m);setYear(y)};
 const swipe={onPointerDown:(e:RPE)=>{down.current={x:e.clientX,y:e.clientY}},onPointerUp:(e:RPE)=>{const s=down.current;down.current=null;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1)}};
 if(month!==null){
  const pal=PALETTE[month];
  return <section className="cal cal-month" style={{'--bg':pal.bg,'--fg':pal.fg} as CSSProperties} aria-label={`${MONTHS[month]} ${year}`}>
   <header className="cal-top"><button type="button" onClick={()=>setMonth(null)} aria-label="Back to the year"><Icon name="grid"/><span>{year}</span></button></header>
   <div className="cal-card" {...swipe}><img src={artUrl(month+1)} alt="" draggable={false}/><MonthBody year={year} month={month} big busy={busy} onDay={onOpenDay}/></div>
   <footer className="cal-nav"><button type="button" onClick={()=>step(-1)} aria-label="Previous month"><Icon name="back"/></button><span className="cal-nav__label">{MONTHS[(month+11)%12].slice(0,3)} · <b>{MONTHS[month].slice(0,3)}</b> · {MONTHS[(month+1)%12].slice(0,3)}</span><button type="button" onClick={()=>step(1)} aria-label="Next month"><Icon name="forward"/></button></footer>
  </section>;
 }
 return <section className="cal cal-year" aria-label={`Calendar ${year}`}>
  <header className="cal-year__head"><button type="button" onClick={()=>setYear(y=>y-1)} aria-label="Previous year"><Icon name="back"/></button><h2>{year}</h2><button type="button" onClick={()=>setYear(y=>y+1)} aria-label="Next year"><Icon name="forward"/></button>
   {year!==now.getFullYear()&&<button type="button" className="cal-year__now" onClick={()=>setYear(now.getFullYear())} aria-label="This year"><Icon name="today"/></button>}</header>
  <div className="cal-poster">{MONTHS.map((_,m)=>{const pal=PALETTE[m];return <button type="button" key={m} className="cal-mini" data-now={year===now.getFullYear()&&m===now.getMonth()?'1':undefined} style={{'--bg':pal.bg,'--fg':pal.fg} as CSSProperties} aria-label={`${MONTHS[m]} ${year}`} onClick={()=>setMonth(m)}><img src={artUrl(m+1)} alt="" loading="lazy" draggable={false}/><MonthBody year={year} month={m} busy={busy}/></button>})}</div>
 </section>;
}
