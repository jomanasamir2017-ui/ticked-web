import {useEffect,useMemo,useRef,useState} from 'react';
import {Icon} from '../ui/Icon';
import {TASKS_KEY,addDays,emptyDay,parseISO,progress,readTasks,todayISO,toISO,writeTasks,type DayTasks,type TaskItem,type TaskStore} from './dayTasks';
import './tasks-calendar.css';
const WEEK=['MON','TUE','WED','THU','FRI','SAT','SUN'];

function Row({item,label,kind,onText,onDone,onEnter,inputRef}:{item:TaskItem;label:string;kind:'todo'|'reminder';onText:(v:string)=>void;onDone:()=>void;onEnter:()=>void;inputRef:(el:HTMLInputElement|null)=>void}){
 return <div className={`tasks-row tasks-row--${kind}${item.done?' is-done':''}`}>
  {kind==='reminder'&&<button type="button" role="checkbox" aria-checked={item.done} aria-label={`${label} done`} className="tasks-check tasks-check--round" onClick={onDone}>{item.done&&<Icon name="check"/>}</button>}
  <input ref={inputRef} type="text" value={item.text} maxLength={300} aria-label={label} onChange={e=>onText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onEnter()}}}/>
  {kind==='todo'&&<button type="button" role="checkbox" aria-checked={item.done} aria-label={`${label} done`} className="tasks-check" data-pop={item.done?'1':undefined} onClick={onDone}>{item.done&&<Icon name="check"/>}</button>}
 </div>;
}

/** Ready-made to-do list for the chosen day. Arrows move to the previous / next day. */
export function TasksPage({day,onDay}:{day:string;onDay:(iso:string)=>void}){
 const [{store,error},setState]=useState(()=>readTasks());
 const [saveError,setSaveError]=useState('');
 const todoRefs=useRef<(HTMLInputElement|null)[]>([]);
 useEffect(()=>{const on=(e:StorageEvent)=>{if(e.key===TASKS_KEY)setState(readTasks())};window.addEventListener('storage',on);return()=>window.removeEventListener('storage',on)},[]);
 const data:DayTasks=store.days[day]??emptyDay();
 const commit=(next:DayTasks)=>{const s:TaskStore={version:1,days:{...store.days,[day]:next}};setState({store:s,error});try{writeTasks(s);setSaveError('')}catch(e){setSaveError('Not saved: '+(e instanceof Error?e.message:String(e)))}};
 const patchItems=(key:'todo'|'reminders',i:number,p:Partial<TaskItem>)=>commit({...data,[key]:data[key].map((x,k)=>k===i?{...x,...p}:x)});
 const {done,total}=progress(data);
 const monday=addDays(day,-((parseISO(day).getDay()+6)%7));
 const week=useMemo(()=>Array.from({length:7},(_,i)=>addDays(monday,i)),[monday]);
 const today=todayISO(),label=parseISO(day).toLocaleDateString('en',{weekday:'short',day:'numeric',month:'short'});
 const complete=total>0&&done===total;
 return <section className={`tasks${complete?' is-complete':''}`} aria-label="To-do list">
  <header className="tasks-head"><h2>TO-DO <b>List</b></h2>
   <div className="tasks-week" role="group" aria-label="Week">{week.map((iso,i)=><button type="button" key={iso} className="tasks-dot" aria-pressed={iso===day} aria-label={parseISO(iso).toLocaleDateString('en',{weekday:'long',day:'numeric',month:'long'})} onClick={()=>onDay(iso)}><small>{WEEK[i]}</small><i data-today={iso===today?'1':undefined}/></button>)}</div>
  </header>
  {(error||saveError)&&<p className="tasks-error" role="alert">{error||saveError}</p>}
  <div className="tasks-board">
   <label className="tasks-remember"><span>Remember</span><input type="text" value={data.remember} maxLength={300} onChange={e=>commit({...data,remember:e.target.value})} aria-label="Remember"/></label>
   <div className="tasks-grid">
    <section className="tasks-card tasks-todo"><h3>TO DO:{total>0&&<em aria-label={`${done} of ${total} done`}>{done}/{total}</em>}</h3>
     <div className="tasks-colhead"><span>TASK</span><span>DONE</span></div>
     {data.todo.map((item,i)=><Row key={item.id} item={item} kind="todo" label={`Task ${i+1}`} inputRef={el=>{todoRefs.current[i]=el}} onText={v=>patchItems('todo',i,{text:v})} onDone={()=>patchItems('todo',i,{done:!item.done})} onEnter={()=>todoRefs.current[i+1]?.focus()}/>)}
    </section>
    <div className="tasks-side">
     <section className="tasks-card tasks-urgent"><h3>URGENT</h3><textarea aria-label="Urgent" value={data.urgent} maxLength={2000} onChange={e=>commit({...data,urgent:e.target.value})}/></section>
     <section className="tasks-card tasks-reminder"><h3>REMINDER</h3>{data.reminders.map((item,i)=><Row key={item.id} item={item} kind="reminder" label={`Reminder ${i+1}`} inputRef={()=>{}} onText={v=>patchItems('reminders',i,{text:v})} onDone={()=>patchItems('reminders',i,{done:!item.done})} onEnter={()=>{}}/>)}</section>
     <section className="tasks-card tasks-notes"><h3>NOTES</h3><textarea aria-label="Notes" value={data.notes} maxLength={4000} onChange={e=>commit({...data,notes:e.target.value})}/></section>
    </div>
   </div>
  </div>
  <footer className="tasks-nav"><button type="button" onClick={()=>onDay(addDays(day,-1))} aria-label="Previous day"><Icon name="back"/></button>
   <button type="button" className="tasks-nav__label" onClick={()=>onDay(toISO(new Date()))} aria-label="Go to today" data-now={day===today?'1':undefined}><Icon name="today"/><span>{day===today?'Today':label}</span></button>
   <button type="button" onClick={()=>onDay(addDays(day,1))} aria-label="Next day"><Icon name="forward"/></button></footer>
 </section>;
}
