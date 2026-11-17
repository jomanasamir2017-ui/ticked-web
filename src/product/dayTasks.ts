/** Day-by-day to-do lists (the Tasks tab). Stored on the device, independent of any notebook. */
export const TASKS_KEY='ticked:v1:day-tasks';
export type TaskItem={id:string;text:string;done:boolean};
export type DayTasks={remember:string;todo:TaskItem[];urgent:string;reminders:TaskItem[];notes:string};
export type TaskStore={version:1;days:Record<string,DayTasks>};
export const TODO_ROWS=15,REMINDER_ROWS=6;
export const pad=(n:number)=>String(n).padStart(2,'0');
export const toISO=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const todayISO=()=>toISO(new Date());
export const parseISO=(iso:string)=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,(m||1)-1,d||1,12)};
export const addDays=(iso:string,n:number)=>{const d=parseISO(iso);d.setDate(d.getDate()+n);return toISO(d)};
const rows=(n:number,prefix:string):TaskItem[]=>Array.from({length:n},(_,i)=>({id:`${prefix}${i}`,text:'',done:false}));
export const emptyDay=():DayTasks=>({remember:'',todo:rows(TODO_ROWS,'t'),urgent:'',reminders:rows(REMINDER_ROWS,'r'),notes:''});
const isItems=(v:unknown):v is TaskItem[]=>Array.isArray(v)&&v.every(x=>x&&typeof x==='object'&&typeof (x as TaskItem).id==='string'&&typeof (x as TaskItem).text==='string'&&typeof (x as TaskItem).done==='boolean');
const fit=(items:TaskItem[],n:number,prefix:string):TaskItem[]=>{const out=items.slice(0,Math.max(n,items.length)).map(x=>({id:x.id,text:x.text.slice(0,300),done:x.done}));while(out.length<n)out.push({id:`${prefix}${out.length}`,text:'',done:false});return out};
export function cleanDay(v:unknown):DayTasks|null{
 if(!v||typeof v!=='object')return null;const d=v as Partial<DayTasks>;
 if(typeof d.remember!=='string'||typeof d.urgent!=='string'||typeof d.notes!=='string'||!isItems(d.todo)||!isItems(d.reminders))return null;
 return {remember:d.remember.slice(0,300),urgent:d.urgent.slice(0,2000),notes:d.notes.slice(0,4000),todo:fit(d.todo,TODO_ROWS,'t'),reminders:fit(d.reminders,REMINDER_ROWS,'r')};
}
export const isEmptyDay=(d:DayTasks)=>!d.remember&&!d.urgent&&!d.notes&&d.todo.every(x=>!x.text&&!x.done)&&d.reminders.every(x=>!x.text&&!x.done);
export function readTasks():{store:TaskStore;error:string}{
 try{const raw=localStorage.getItem(TASKS_KEY);if(raw===null)return {store:{version:1,days:{}},error:''};
  const p=JSON.parse(raw);if(!p||p.version!==1||typeof p.days!=='object')return {store:{version:1,days:{}},error:'Saved tasks use an unsupported format; they were left untouched.'};
  const days:Record<string,DayTasks>={};for(const [k,v] of Object.entries(p.days)){const c=/^\d{4}-\d{2}-\d{2}$/.test(k)?cleanDay(v):null;if(c)days[k]=c}
  return {store:{version:1,days},error:''};
 }catch{return {store:{version:1,days:{}},error:'Saved tasks could not be read; they were left untouched.'}}
}
export function writeTasks(store:TaskStore){
 const days:Record<string,DayTasks>={};for(const [k,v] of Object.entries(store.days))if(!isEmptyDay(v))days[k]=v;
 localStorage.setItem(TASKS_KEY,JSON.stringify({version:1,days}));
}
export const progress=(d:DayTasks)=>{const filled=d.todo.filter(x=>x.text.trim()),done=filled.filter(x=>x.done).length;return {done,total:filled.length}};
/** Merge an exported file: days that are empty here are filled, days with content here are kept. */
export function mergeTasks(current:TaskStore,incoming:unknown):{store:TaskStore;added:number;skipped:number}{
 const days={...current.days};let added=0,skipped=0;
 const src=incoming&&typeof incoming==='object'?(incoming as {days?:Record<string,unknown>}).days:undefined;
 if(!src)throw new Error('This file is not a TICKED tasks backup.');
 for(const [k,v] of Object.entries(src)){const c=/^\d{4}-\d{2}-\d{2}$/.test(k)?cleanDay(v):null;if(!c)continue;if(days[k]&&!isEmptyDay(days[k])){skipped++;continue}days[k]=c;added++}
 return {store:{version:1,days},added,skipped};
}
