import {useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {Icon} from '../ui/Icon';
import {readTasks,mergeTasks,writeTasks} from './dayTasks';
import './tasks-calendar.css';

export function MorePage({newNotebook,trash,marksCount,onSearch,onBookmarks,onSettings}:{newNotebook:ReactNode;trash:ReactNode;marksCount:number;onSearch:()=>void;onBookmarks:()=>void;onSettings:()=>void}){
 const file=useRef<HTMLInputElement>(null);const [msg,setMsg]=useState('');
 const exportTasks=()=>{try{const {store}=readTasks();const blob=new Blob([JSON.stringify({app:'TICKED',type:'day-tasks',version:1,days:store.days},null,1)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ticked-tasks-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},2000);setMsg('Tasks exported')}catch(e){setMsg('Export failed: '+(e instanceof Error?e.message:String(e)))}};
 const importTasks=async(f?:File)=>{if(!f)return;try{const {store,error}=readTasks();if(error)throw new Error(error);const r=mergeTasks(store,JSON.parse(await f.text()));writeTasks(r.store);setMsg(`Imported ${r.added} day${r.added===1?'':'s'}${r.skipped?` · kept ${r.skipped} that already had tasks`:''}`)}catch(e){setMsg('Import failed: '+(e instanceof Error?e.message:String(e)))}finally{if(file.current)file.current.value=''}};
 return <section className="more" aria-label="More">
  <h2>More</h2>
  <div className="more-card more-card--new">{newNotebook}</div>
  <button type="button" className="more-item" onClick={onSearch}><Icon name="search"/><span>Search</span></button>
  <button type="button" className="more-item" onClick={onBookmarks}><Icon name="bookmark"/><span>Bookmarks</span><em>{marksCount}</em></button>
  <div className="more-card more-card--trash">{trash}</div>
  <button type="button" className="more-item" onClick={onSettings}><Icon name="settings"/><span>Settings</span></button>
  <div className="more-tasksbackup"><button type="button" className="more-item" onClick={exportTasks}><Icon name="download"/><span>Export tasks</span></button><button type="button" className="more-item" onClick={()=>file.current?.click()}><Icon name="upload"/><span>Import tasks</span></button><input ref={file} type="file" accept="application/json,.json" hidden onChange={e=>importTasks(e.target.files?.[0])}/></div>
  {msg&&<p className="more-msg" role="status">{msg}</p>}
  <p className="more-foot"><Icon name="lock"/><span>Saved on this device</span></p>
 </section>;
}
